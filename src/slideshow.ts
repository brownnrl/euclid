// Pure-data helpers for the slideshow presentation mode (issue #75).
// Lives in its own module so SlideTest can exercise the state-machine
// rules without any DOM, while SlateControls.ts owns the overlay.

import {Slate} from "./Slate";
import {ISlide} from "./index";

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
export function computeSlideState(
    slate: Slate,
    slides: ISlide[],
    index: number,
): { visible: Set<string>, highlighted: Set<string> } {
    // Walk back to find the most recent explicit `visible` array.
    let baseVisible: string[] = [];
    for (let i = index; i >= 0; i--) {
        if (slides[i].visible != null) {
            baseVisible = slides[i].visible;
            break;
        }
    }
    const visible = new Set<string>(baseVisible);

    const slide = slides[index];
    const highlighted = new Set<string>(slide.highlighted || []);

    for (const e of slate.elements) {
        if (e.draggable && e.name != null
            && !slate.deferredDraggables.has(e.name)) {
            visible.add(e.name);
        }
    }
    highlighted.forEach(name => visible.add(name));

    return { visible, highlighted };
}
