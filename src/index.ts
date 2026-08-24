import {GeomElement, Align as align} from "./elements/GeomElement"
import {AllConstructions, E as e} from "./elements/Constructions"
import {AllAnimations, A, findAnimation} from "./elements/Animations"
// Per-type animation modules — imported for side effects so each
// Animation subclass registers with the registry at module load. Adding
// a new animation file is a one-line `import "./elements/.../X"` here.
import "./elements/point/PointAnimations";
import "./elements/line/LineAnimations";
import "./elements/circle/CircleAnimations";
import "./elements/polygon/PolygonAnimations";
import "./elements/sector/SectorAnimations";
import "./elements/group/GroupAnimations";
import {PointElement} from "./elements/point/PointElement";
import {Slate} from "./Slate";
import {PlaneSlider} from "./elements/point/PlaneSlider";
import {AngleMarkerElement} from "./elements/sector/AngleMarkerElement";
import {colors, randomColor, lighten, darken, parseColor, anglePalette} from "./Colors";
import {createControls, createDiagnosticBadge} from "./SlateControls";
import {IDiagnostic, DiagnosticSeverity, worstSeverity} from "./Diagnostics";

export type IndexAllConstructions = AllConstructions;
export {align  as Align};
export {e as E};
export {AllAnimations, A};

// Build marker — bumped when behaviour-affecting changes ship so consumers
// (e.g. the test pages used to investigate #55) can confirm which bundle
// they're actually running.
export const BUILD_MARKER = "pointer-events-refactor-v1 (Slate.ts #55)";

export let slates : Slate[] = [];

// #130 — highlight a named element across MORE THAN ONE canvas at once.
// A proposition drawn as several figures that share element names (e.g.
// I.26's two case triangles, both labelled ABC/DEF) wants a single prose
// reference to light the element in EVERY canvas it appears in, not just
// one. This sets `emphasized` on each matching element — alias-aware, via
// `slate.lookupElement` (so a ref spelled "CBA" still matches "ABC") —
// across all live slates, or only those whose canvas id is listed in
// `opts.canvasids` (scope correctly on a page with unrelated figures).
// Each touched slate is redrawn, which fires that canvas's
// `geomlib:highlight` event (#108) so the page lights every prose span.
// Returns the number of canvases the element was found in.
export function highlightByName(name: string, on: boolean = true,
                                opts?: { canvasids?: string[] }): number {
    const ids = opts && opts.canvasids;
    let hits = 0;
    for (const slate of slates) {
        if (ids != null) {
            const id = (slate.canvas as any) && (slate.canvas as any).id;
            if (ids.indexOf(id) === -1) continue;
        }
        const el = slate.lookupElement(name);
        if (el == null) continue;
        el.emphasized = on;
        slate.update();
        hits++;
    }
    return hits;
}

// #154 — check a deck's names at load, not only when a slide runs.
//
// Every name in a slide set and every animation target is resolved once
// here, so a stale reference reports the moment the figure is built.
// Without this the diagnostic only fires if a viewer actually advances
// to the offending slide — which is precisely the case that goes
// unnoticed, and would leave a build-time checker seeing a clean page.
//
// Reporting is deduped per slate, so a name the walk later hits again
// does not report twice.
function validateSlides(slate: Slate, slides: ISlide[]): void {
    // #159 — first pass: let each animation declare the names it will create
    // at run time, so a later slide addressing them is not mistaken for a
    // typo. compassTransfer's keepCircles is the motivating case.
    for (const slide of slides) {
        const anims = slide.transition && slide.transition.animations;
        if (anims == null) continue;
        for (const entry of anims) {
            const animation = findAnimation(entry.name);
            if (animation == null) continue;
            slate.declareDeferredNames(animation.declaredNames(entry.args));
        }
    }

    for (let n = 0; n < slides.length; n++) {
        const slide = slides[n];
        for (const field of ["visible", "highlighted"]) {
            const names = (slide as any)[field] as string[] | undefined;
            if (names == null) continue;
            for (const name of names) {
                if (slate.lookupElement(name) != null) continue;
                if (slate.isDeferredName(name)) continue;   // #159
                slate.reportDiagnostic({
                    code: "unknown-slide-name",
                    key: field + ":" + name,
                    message: "slide " + (n + 1) + " lists '" + name +
                        "' in " + field + ", but no element or alias resolves to it \u2014 " +
                        "the name is ignored. Check for a typo, or for a target left " +
                        "behind by a figure change.",
                    detail: { slide: n + 1, field: field, name: name },
                });
            }
        }
        const anims = slide.transition && slide.transition.animations;
        if (anims == null) continue;
        for (const entry of anims) {
            if (entry.elem == null) continue;
            if (slate.lookupElement(entry.elem) != null) continue;
            if (slate.isDeferredName(entry.elem)) continue;   // #159
            slate.reportDiagnostic({
                code: "unknown-element",
                key: String(entry.elem),
                message: "slide " + (n + 1) + " animates '" + entry.elem +
                    "', but no element or alias resolves to it \u2014 the step " +
                    "is skipped. Check for a typo, or for a target left behind " +
                    "by a figure change.",
                detail: { slide: n + 1, elem: entry.elem },
            });
        }
    }
}

export interface ISlateDiagnostics {
    canvasid: string | null;
    index: number;
    severity: DiagnosticSeverity | null;
    entries: IDiagnostic[];
}

/**
 * Every diagnostic on the page, in one call (#154).
 *
 * Exists so a consumer — a static-site generator checking decks at build
 * time, or a human in a console — can ask "did anything on this page go
 * wrong?" without reimplementing geomlib's own name-resolution rules.
 * Only slates that actually reported something are listed.
 *
 * `opts.canvasids` scopes the query, mirroring highlightByName's idiom.
 */
export function diagnostics(opts?: { canvasids?: string[] }): {
    severity: DiagnosticSeverity | null;
    count: number;
    slates: ISlateDiagnostics[];
    init: IDiagnostic[];
} {
    const ids = opts && opts.canvasids;
    let worst: DiagnosticSeverity | null = null;
    let count = 0;
    const out: ISlateDiagnostics[] = [];
    for (let i = 0; i < slates.length; i++) {
        const slate = slates[i];
        const id = ((slate.canvas as any) && (slate.canvas as any).id) || null;
        if (ids != null && (id == null || ids.indexOf(id) === -1)) continue;
        const entries = slate.diagnostics;
        if (entries.length === 0) continue;
        worst = worstSeverity(worst, slate.diagnosticSeverity);
        count += entries.length;
        out.push({ canvasid: id, index: i, severity: slate.diagnosticSeverity, entries });
    }
    for (const d of initDiagnostics) {
        worst = worstSeverity(worst, d.severity);
        count++;
    }
    return { severity: worst, count, slates: out, init: initDiagnostics.slice() };
}

export interface IConstructionInfo {
    name: string;
    construction: IndexAllConstructions;
    params: any[];
    nameColor?: string | number;
    vertexColor?: string | number;
    edgeColor?: string | number;
    faceColor?: string | number;
}

// Marginal-reference shape for slides. The `ref` is a symbolic label
// such as "I.Post.3" or "C.N.1"; URL resolution happens via the
// consumer-supplied resolveJustification callback so the data here
// doesn't go stale if a referenced page moves on the consumer site.
export interface ISlideJust {
    ref: string;
    // 0.14.0+ — what this step CLAIMS, rendered ahead of the citation as
    // "claim — ref" (#146). Without it the chip can say which proposition
    // licenses a step but never what the step asserts, so a slide carrying
    // several reasoning steps had to be split one-per-sub-slide just to
    // keep each statement next to its own citation. Plain text; omit it and
    // the panel renders exactly as before.
    claim?: string;
}

// One step in the slideshow / presentation walk-through. The DSL is
// declarative: each slide describes its full effective state, and the
// Presentation controller computes the transitions between them.
//
//   - visible inherits from the previous slide if omitted, so authors
//     only re-specify on state change.
//   - highlighted defaults to [] (clears between slides), so a
//     highlight only persists when re-specified on the next slide.
//   - Draggable elements (e.draggable === true) are auto-unioned into
//     the visible set by the Presentation controller; authors don't
//     need to list free construction points per slide.
//   - Highlighted elements are auto-unioned into visible — you can't
//     highlight what isn't drawn.
// Per-element animation choice on one slide. Cascade order = the
// array order. An element revealed by the slide but not listed here
// pops in instantly. See A.* / AllAnimations for valid name values.
export interface ISlideAnimation {
    elem: string;
    name: AllAnimations | string;
    args?: any;
    durationMs?: number;
}

export interface ISlideTransition {
    mode?: "cascade" | "parallel";
    animations?: ISlideAnimation[];
}

export interface ISlide {
    text: string;
    visible?: string[];
    highlighted?: string[];
    justifications?: ISlideJust[];
    transition?: ISlideTransition;
}

// Slate-level animation tuning. No "default animations" — animations
// are strictly opt-in per slide via slide.transition.animations. A
// slate that never sets animationConfig keeps the 0.5.0 instant
// behaviour everywhere.
export interface IAnimationConfig {
    // Per-animation rate overrides, keyed by animation name. Lets a
    // consumer dial all "Line.straightEdgeConnect" animations 30%
    // slower without touching individual slides.
    rates?: { [animationName: string]: number };
    // Per-animation duration overrides.
    durations?: { [animationName: string]: number };
    // Pause between cascaded steps; default 0.
    cascadeGapMs?: number;
    // Global multiplier; 1.0 default; 0 = jump-to-final.
    speedMultiplier?: number;
    // Default reads prefers-reduced-motion CSS media query at init().
    reducedMotion?: boolean;
}

export interface IInitialization {
    background : string;
    title : string;
    align? : align;
    canvasid? : string;
    pivot?: string;
    // #164 — element the maximized / presentation view centres on. Absent or
    // unresolvable falls back to bounds-derived centring.
    centerOn?: string;
    font?: string;
    fontsize?: number;
    // Authored logical coordinate size (#71). Optional — normally inferred
    // from the canvas's CSS style px / width-height attribute. Set it to
    // pin the coordinate space when neither is declared, or to override.
    width?: number;
    height?: number;
    elements: (IConstructionInfo | string)[];
    // Secondary element names that resolve to a canonical element.
    // Lets prose name an element under any of the conventional
    // letter-permutations (e.g. "circle BCD" ≡ "circle CDB") without
    // forcing the canvas to carry an invisible duplicate per alias.
    // Resolved by Slate.lookupElement after a direct-name miss.
    aliases?: {[from: string]: string};
    // Draggable element names excluded from the slideshow's
    // every-slide auto-union (#89). Use for draggables the proof
    // introduces mid-walk ("Take an arbitrary point F") so they stay
    // hidden until a slide's visible set includes them. They remain
    // fully draggable whenever shown. No effect outside presentation
    // mode.
    deferDraggables?: string[];
    // 0.9.0+ — element names that start hidden in the static figure
    // (visible = false). Revealed by a slide's visible set, or when the
    // element is highlighted / its {NAME} ref is hovered. clearVisibility
    // (presentation exit) restores to this baseline. (#100)
    initiallyHidden?: string[];
    // 0.9.0+ — show angle markers (E.Sector.angleMarker /
    // angleMarkerReflex) in the static figure. Default false: markers
    // are hidden initially (Euclid's source diagram draws no angle arcs)
    // and appear during the slide walk or on hover. (#100)
    showAngles?: boolean;
    // 0.14.0+ — draw highlighted / mid-animation elements last within each
    // draw pass, so a neighbour declared later in `elements` can't paint
    // over the gold stroke where it crosses. Promotion is within a pass, so
    // a promoted face still stays under every edge. Default true; set false
    // to keep the strict declaration order. (#140)
    highlightOnTop?: boolean;
    // Optional slideshow walk-through. When provided + non-empty,
    // SlateControls renders a "▶ Present" button that opens the
    // Presentation overlay. Stays empty (no button, no behaviour
    // change) for consumers that don't opt in.
    slides?: ISlide[];
    // Consumer lookup that maps a justification ref ("I.Post.3") to
    // a URL string. Returning null/undefined renders the ref as
    // plain text. Sync; the lektor site wires this to a page-emitted
    // window.eucrefs map.
    resolveJustification?: (ref: string) => string | null | undefined;
    // Slide-transition animation config. Optional; without it, the
    // slideshow keeps the 0.5.0 instant behaviour. Animations are
    // also strictly per-slide opt-in — even with animationConfig set,
    // a slide without transition.animations pops in instantly.
    animationConfig?: IAnimationConfig;
}

// Map Java element class names to E object keys
const typeMap: {[key: string]: string} = {
    "point": "Point", "line": "Line", "circle": "Circle",
    "polygon": "Polygon", "sector": "Sector", "plane": "Plane",
    "sphere": "Sphere", "polyhedron": "Polyhedra"
};

// Parse a Java applet param value string into an IConstructionInfo.
// Format: "name;type;construction;arg1,arg2,...[;nameColor[;vertexColor[;edgeColor[;faceColor]]]]"
// Example: "M;point;midpoint;A,B;0;0" → { name: "M", construction: E.Point.midpoint, params: ["A","B"], nameColor: "0", vertexColor: "0" }
export function parseParam(value: string): IConstructionInfo {
    let fields = value.split(";");
    if (fields.length < 4) {
        throw new Error(`parseParam: expected at least 4 semicolon-separated fields, got ${fields.length}: "${value}"`);
    }

    let name = fields[0];
    let type = fields[1];
    let construction = fields[2];
    let data = fields[3];

    // Look up the construction enum value
    let typeKey = typeMap[type];
    if (typeKey == null) {
        throw new Error(`parseParam: unknown element type "${type}" in "${value}"`);
    }
    let enumObj = (e as any)[typeKey];
    // Handle Java names that differ from TS enum keys
    let enumKey = construction === "3points" ? "threePoints" : construction;
    let constructionEnum = enumObj[enumKey];
    if (constructionEnum == null) {
        throw new Error(`parseParam: unknown construction "${type};${construction}" in "${value}"`);
    }

    // Parse params: split on comma, convert numeric strings to numbers
    let params: any[] = data.split(",").map(s => {
        let n = Number(s);
        return (s !== "" && !isNaN(n)) ? n : s;
    });

    // Parse optional color fields (positions 4-7)
    let result: IConstructionInfo = { name, construction: constructionEnum, params };
    if (fields.length > 4 && fields[4] !== undefined) result.nameColor = fields[4];
    if (fields.length > 5 && fields[5] !== undefined) result.vertexColor = fields[5];
    if (fields.length > 6 && fields[6] !== undefined) result.edgeColor = fields[6];
    if (fields.length > 7 && fields[7] !== undefined) result.faceColor = fields[7];

    return result;
}

// The construction's authored coordinate extent (logical px). Element
// coords are authored in this space; the figure is fit-scaled from here to
// the (responsive) display. Read before the bitmap is resized. (#71)
function authoredLogicalSize(i: IInitialization, canvas: HTMLCanvasElement) : [number, number] {
    const c = canvas as any;
    const px = (s: any) => {
        const m = /^\s*(\d+(?:\.\d+)?)\s*px\s*$/.exec(typeof s === "string" ? s : "");
        return m ? parseFloat(m[1]) : 0;
    };
    const style = c.style || {};
    const attr = (n: string) => (typeof c.getAttribute === "function"
        ? parseInt(c.getAttribute(n) || "0", 10) || 0 : 0);
    const w = (i.width || 0) || px(style.width)  || attr("width")  || c.clientWidth  || canvas.width;
    const h = (i.height || 0) || px(style.height) || attr("height") || c.clientHeight || canvas.height;
    return [w, h];
}

// Size the canvas BITMAP to its CSS display size × devicePixelRatio so it
// renders crisp on HiDPI / retina (#71). The construction coordinate space
// stays in CSS px (clientWidth/Height); drawElements scales the context by
// dpr. Headless / no window → dpr 1, so node rendering is unchanged.
// see https://stackoverflow.com/questions/4938346/canvas-width-and-height-in-html5
function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) : void {
    const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
    const width = Math.round(canvas.clientWidth * dpr);
    const height = Math.round(canvas.clientHeight * dpr);

    if (canvas.width != width || canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
    }
}

/**
 * If init() fails partway, the canvas stays blank and the user sees
 * nothing — the <noscript> tag won't fire because JS *is* running, it
 * just errored. This helper looks for a <noscript> sibling of the
 * canvas (the conventional location for the static-image fallback,
 * e.g. <noscript><img src="propI4.gif"/></noscript>), reparses its
 * contents, inserts them as a visible sibling, and hides the canvas.
 *
 * Safe no-op if `canvas` is null, has no noscript sibling, or any
 * DOM operation throws. Exported so consumers can call it directly
 * if they have their own error-handling path.
 */
export function revealNoscriptFallback(canvas: HTMLCanvasElement | null): void {
    if (!canvas) return;
    try {
        // Scan up to ~5 element siblings forward — the <noscript> is
        // usually the immediate next, but the document may have other
        // markup interleaved.
        let sibling = canvas.nextElementSibling;
        let attempts = 0;
        while (sibling && attempts++ < 5 && sibling.tagName !== "NOSCRIPT") {
            sibling = sibling.nextElementSibling;
        }
        if (!sibling || sibling.tagName !== "NOSCRIPT") return;

        // With JS enabled, <noscript>'s contents are a single text node
        // holding the raw markup. Reparse via a wrapper div.
        let html = sibling.innerHTML;
        if (!html) return;
        let wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        sibling.parentNode?.insertBefore(wrapper, sibling);
        canvas.style.display = "none";
    } catch (_) {
        // Swallow: this is an emergency fallback. If we can't reveal it,
        // the user is no worse off than before this helper existed.
    }
}

// #154 — a slate-less record of init() failures. init() throws before any
// Slate exists in the common case (a wrong canvasid makes `new Slate(null)`
// throw), so these can't live on a slate and are collected here instead.
export let initDiagnostics : IDiagnostic[] = [];

/**
 * Mark a failed init on the page, next to where the diagram would have been.
 *
 * Deliberately modest. On the most common failure — a canvasid that matches
 * nothing — there is no canvas to badge, and a marker floating at some
 * arbitrary spot is worse than none; the console error plus the revealed
 * <noscript> image is the indication. So: badge when there is an anchor,
 * stay silent when there isn't.
 *
 * The whole body swallows its own exceptions, matching
 * revealNoscriptFallback. init()'s catch re-throws the original error, and
 * a throw from in here would replace it.
 */
export function markInitFailure(canvas: HTMLCanvasElement | null, canvasid: string): void {
    try {
        if (typeof document === "undefined") return;
        const anchor = canvas ||
            (document.getElementById(canvasid) as HTMLCanvasElement | null);
        if (!anchor) return;
        const host = anchor.parentElement;
        if (!host) return;
        const badge = createDiagnosticBadge("error");
        // Static, not absolute: createControls is the last statement of
        // initInner, so on failure the positioned .geomlib-wrapper almost
        // never exists and there is no containing block to anchor to. An
        // inline-block sibling just before the canvas lands where the
        // diagram's top-left would have been.
        badge.style.position = "static";
        badge.style.display = "inline-block";
        badge.style.verticalAlign = "top";
        host.insertBefore(badge, anchor);
    } catch (_) { /* never let the badge replace the real error */ }
}

export function init(i : IInitialization) {
    let canvasid : string = i.canvasid != null ? i.canvasid : "canvasid";
    let canvas = document.getElementById(canvasid) as HTMLCanvasElement;
    try {
        initInner(i, canvas);
    } catch (err) {
        // Blank canvas + console error = silent failure from the
        // visitor's point of view. Reveal the conventional <noscript>
        // static-image fallback so they at least see the diagram, then
        // re-throw so callers / test harnesses can detect the failure.
        console.error("[geomlib] init failed:", err);
        initDiagnostics.push({
            severity: "error", code: "init-failed",
            message: "init failed: " + String(err),
            detail: { canvasid: canvasid }, at: Date.now(), count: 1,
        });
        // Badge BEFORE revealing the fallback: revealNoscriptFallback sets
        // canvas.style.display = "none", so inserting first puts the mark
        // above the static image rather than beside a hidden canvas.
        markInitFailure(canvas, canvasid);
        revealNoscriptFallback(canvas);
        throw err;
    }
}

function initInner(i: IInitialization, canvas: HTMLCanvasElement) {
    // Java defaults to CENTRAL (0) — dynamic placement based on
    // position relative to canvas center. Override with align param.
    let defaultAlign : align = i.align != null ? i.align : align.CENTRAL;

    // Capture the authored LOGICAL coordinate size (#71) before
    // resizeCanvasToDisplaySize overwrites the bitmap: explicit config →
    // CSS style px → width/height attribute → clientWidth. The first three
    // are the uncapped authored size (so a figure stays its logical size
    // even when CSS shrinks the display on a narrow column); clientWidth is
    // the last-resort legacy behaviour.
    const [logicalW, logicalH] = authoredLogicalSize(i, canvas);
    resizeCanvasToDisplaySize(canvas);
    let slate : Slate = new Slate(canvas);
    slate.setLogicalSize(logicalW, logicalH);
    slate.recomputeFitScale();
    slates.push(slate);

    // Set font — Java defaults: Font("TimesRoman", Font.ITALIC, 18)
    let fontName = i.font != null ? i.font : "Times New Roman";
    let fontSize = i.fontsize != null ? i.fontsize : 18;
    GeomElement.setFont(fontName, fontSize);
    // Parse background through parseColor so HSB triples like "35,19,100"
    // are converted to valid CSS rgb() strings for ctx.fillStyle.
    slate.bgcolor = parseColor(i.background, "#ffffff", "#ffffff");
    // Cycles the angle-marker palette in construction order (#91) so
    // concurrent markers get distinct colors.
    let angleMarkerCount = 0;
    for(let raw of i.elements) {
        let param: IConstructionInfo = typeof raw === "string" ? parseParam(raw) : raw;
        let element = slate.createElement(param.construction, param.params, param.name);

        element.align = defaultAlign;

        // Angle markers default to a translucent palette fill + solid
        // colored edge instead of the dim2 lighten-bg face / black edge.
        // The rgba face is set directly (it wouldn't survive parseColor)
        // unless the author supplies an explicit faceColor param.
        if (element instanceof AngleMarkerElement) {
            const swatch = anglePalette[angleMarkerCount % anglePalette.length];
            angleMarkerCount++;
            element.nameColor = parseColor(param.nameColor, null, slate.bgcolor);
            element.vertexColor = parseColor(param.vertexColor, null, slate.bgcolor);
            element.edgeColor = parseColor(param.edgeColor, swatch.edge, slate.bgcolor);
            if (param.faceColor != null) {
                element.faceColor = parseColor(param.faceColor, swatch.edge, slate.bgcolor);
            } else {
                element.faceColor = swatch.face;
            }
            continue;
        }

        // Name string
        let defaultNameColor = element instanceof PointElement ? "black" : null;
        element.nameColor = parseColor(param.nameColor, defaultNameColor, slate.bgcolor);

        let defaultVertexColor = element.draggable ?
            ((element instanceof PlaneSlider) ?
                'red' : 'orange')
            : 'black';
        element.vertexColor = parseColor(param.vertexColor, defaultVertexColor, slate.bgcolor);

        element.edgeColor = parseColor(param.edgeColor, "black", slate.bgcolor);

        let lighterColor = lighten(slate.bgcolor);
        let defaultFaceColor = element.dimension == 2 ? lighterColor : null;
        element.faceColor = parseColor(param.faceColor, defaultFaceColor, slate.bgcolor);
    }

    if (i.aliases != null) {
        slate.addAliases(i.aliases);
    }

    if (i.deferDraggables != null) {
        slate.deferDraggables(i.deferDraggables);
    }

    // #140 — opt out of highlight/animation z-order promotion. Default is
    // on, so only an explicit `false` changes anything.
    if (i.highlightOnTop != null) {
        slate.highlightOnTop = i.highlightOnTop;
    }

    // Angle markers are hidden in the static figure by default (Euclid's
    // diagram draws no angle arcs); init({ showAngles: true }) reveals
    // them. Plus any explicit initiallyHidden names. clearVisibility
    // restores to this baseline. (#100)
    if (!i.showAngles) {
        for (let elem of slate.elements) {
            if (elem instanceof AngleMarkerElement && elem.name != null) {
                slate.setInitiallyHidden(elem.name);
            }
        }
    }
    if (i.initiallyHidden != null) {
        for (let name of i.initiallyHidden) slate.setInitiallyHidden(name);
    }

    // Same-vertex angle markers auto-nest: group by shared vertex and
    // step each one's radius into a concentric ring (smallest interior
    // angle innermost), with distinct palette colors within the group,
    // so they don't overlap. Author radiusPx overrides opt out of the
    // ring-stepping. Runs before update() places the arc endpoints. (#103)
    {
        const byVertex = new Map<PointElement, AngleMarkerElement[]>();
        for (let elem of slate.elements) {
            if (elem instanceof AngleMarkerElement) {
                let g = byVertex.get(elem.vertex);
                if (g == null) { g = []; byVertex.set(elem.vertex, g); }
                g.push(elem);
            }
        }
        byVertex.forEach((group: AngleMarkerElement[]) => {
            if (group.length <= 1) return;
            // Smallest angle innermost so a tight wedge nests inside a
            // wider one sharing the vertex.
            group.sort((a, b) => a.spanRadians() - b.spanRadians());
            let ring = 0;
            group.forEach((m, idx) => {
                // Distinct color per group member (de-clash by group
                // position). Author param-color overrides are left alone.
                const isDefault = anglePalette.some(p => p.face === m.faceColor);
                if (isDefault) {
                    const sw = anglePalette[idx % anglePalette.length];
                    m.edgeColor = sw.edge;
                    m.faceColor = sw.face;
                }
                // Pinned-radius markers keep their explicit radius (ring
                // 0); only auto-radius markers step outward, consecutively.
                if (!m.hasRadiusOverride) { m.ringIndex = ring; ring++; }
            });
        });
    }

    if (i.slides != null && i.slides.length > 0) {
        slate.slides = i.slides;
        validateSlides(slate, i.slides);
    }

    if (i.resolveJustification != null) {
        slate.resolveJustification = i.resolveJustification;
    }

    if (i.animationConfig != null) {
        slate.animationConfig = i.animationConfig;
    }

    if (i.centerOn != null) {
        // After the elements are built, so the name can be resolved (and an
        // unresolvable one reported) at load time rather than on first
        // maximize — a badge nobody sees until then is a badge too late.
        slate.setCenterOn(i.centerOn);
    }
    if(i.pivot != null) {
        slate.setPivot(i.pivot);
    }

    slate.update();
    slate.updateCoordinates(0);

    // Add UI controls (reset, maximize, present) if running in browser
    if (canvas && canvas.parentElement) {
        createControls(slate, canvas, i);
    }
}

