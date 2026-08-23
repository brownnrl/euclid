// Pure-data helpers for the slideshow presentation mode (issue #75).
// Lives in its own module so SlideTest can exercise the state-machine
// rules without any DOM, while SlateControls.ts owns the overlay.

import {Slate} from "./Slate";
import {ISlide} from "./index";


// #151 — resolve slide-set names through the alias table, and report the
// ones that resolve to nothing.
//
// Aliases worked for prose `{NAME}` refs and `lookupElement`, but a slide's
// `visible` / `highlighted` arrays were passed through verbatim and both
// consumers compare against the element's own `name`. An alias placed in a
// slide set therefore matched nothing and was **silently** ignored: no
// error, no warning, the element just never lit. An audit of the lektor
// decks found 33 such inert names across 17 canvases, spanning propositions
// I.8 to I.47.
//
// The asymmetry was the trap: an author who wrote `aliases: { FC: "CF" }`
// and watched `{FC}` light from the prose had every reason to expect "FC" to
// work in a slide set too.

/**
 * Map slide-set names onto the element names the renderers actually compare
 * against, following one alias hop via `lookupElement`.
 *
 * Returns the canonical set plus every name that resolved to no element.
 * An unmatched name is kept in the set as authored — dropping it would
 * change nothing on screen (nothing matches it either way) and keeping it
 * makes the returned set a faithful record of what the slide asked for.
 */
export function canonicaliseSlideNames(
    slate: Slate,
    names: string[],
): { canonical: Set<string>, unmatched: string[] } {
    const canonical = new Set<string>();
    const unmatched: string[] = [];
    for (const name of names || []) {
        const elem = slate.lookupElement(name);
        if (elem != null && elem.name != null) {
            canonical.add(elem.name);
        } else {
            canonical.add(name);
            unmatched.push(name);
        }
    }
    return { canonical, unmatched };
}

// Compute the visible + highlighted name sets for slide `index` given:
//   - visible inherits from the previous slide if omitted;
//     "hide all at start" applies when no earlier slide ever declared
//     visible (initial state is the empty set).
//   - highlighted clears each slide (defaults to []).
//   - Every draggable element on the slate is auto-unioned into
//     visible — free construction points always stay interactive —
//     EXCEPT names in slate.deferredDraggables (#89): draggables the
//     proof introduces mid-walk follow visible sets like any other
//     element.
//   - Every highlighted name is auto-unioned into visible — you can't
//     highlight what isn't drawn.
//   - Names are resolved through the alias table (#151), so a slide set may
//     spell an element any way the prose does. A name matching no element
//     is reported once per slate via console.warn — that also surfaces
//     stale targets left behind when a figure is refactored.
export function computeSlideState(
    slate: Slate,
    slides: ISlide[],
    index: number,
): { visible: Set<string>, highlighted: Set<string> } {
    // Walk back to find the most recent explicit `visible` array.
    let baseVisible: string[] = [];
    let baseIndex = index;
    for (let i = index; i >= 0; i--) {
        if (slides[i].visible != null) {
            baseVisible = slides[i].visible;
            baseIndex = i;
            break;
        }
    }
    // #151 — resolve aliases before the renderers compare against e.name.
    const v = canonicaliseSlideNames(slate, baseVisible);
    const visible = v.canonical;
    reportUnmatched(slate, v.unmatched, baseIndex, "visible");

    const slide = slides[index];
    const h = canonicaliseSlideNames(slate, slide.highlighted || []);
    const highlighted = h.canonical;
    reportUnmatched(slate, h.unmatched, index, "highlighted");

    for (const e of slate.elements) {
        if (e.draggable && e.name != null
            && !slate.deferredDraggables.has(e.name)) {
            visible.add(e.name);
        }
    }
    highlighted.forEach(name => visible.add(name));

    return { visible, highlighted };
}

// Shared wording for an unmatched slide-set name, so `visible`,
// `highlighted` and an animation's `elem:` all read the same in the console.
function reportUnmatched(
    slate: Slate,
    unmatched: string[],
    slideIndex: number,
    field: string,
): void {
    for (const name of unmatched) {
        // #154 — reported through the slate so the canvas can badge it;
        // reportDiagnostic owns the dedupe that warnOnce used to do.
        slate.reportDiagnostic({
            code: "unknown-slide-name",
            key: field + ":" + name,
            message: "slide " + (slideIndex + 1) + " lists '" + name +
                "' in " + field + ", but no element or alias resolves to it — " +
                "the name is ignored. Check for a typo, or for a target left " +
                "behind by a figure change.",
            detail: { slide: slideIndex + 1, field: field, name: name },
        });
    }
}
