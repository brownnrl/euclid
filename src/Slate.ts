import {GeomElement} from "./elements/GeomElement";
import {PlaneElement} from "./elements/plane/PlaneElement";
import {FixedPoint} from "./elements/point/FixedPoint";
import {AllConstructions, Construction, SortedParams, constructions, getConstructionName} from "./elements/Constructions";
import {PointElement} from "./elements/point/PointElement";
import {Canvas} from "canvas";
import {LineElement} from "./elements/line/LineElement";
import {PolygonElement} from "./elements/polygon/PolygonElement";
import {CircleElement} from "./elements/circle/CircleElement";
import {ISlide, ISlideAnimation, IAnimationConfig} from "./index";
import {SlateAnimator} from "./SlateAnimator";
import {DiagnosticLog, IDiagnostic, IDiagnosticInput, DiagnosticSeverity,
        diagnosticEventDetail} from "./Diagnostics";

export type SlateCanvas = HTMLCanvasElement | Canvas;

export type ResolveJustification = (ref: string) => string | null | undefined;

// #140 — an element that is highlighted or mid-animation is what the viewer
// is meant to be looking at, so it should not be painted over by whatever
// happens to be declared after it in the deck's `elements` array.
//
// `emphasized` is `_emphasisAmount > 0`, so this stays true through the
// post-animation fade taper — an element can't drop back down in z-order
// while it is still visibly gold. `drawProgress < 1` is the independent
// "currently being drawn in" flag: it defaults to 1 and every animation's
// finalise()/cancel resets it to 1, so it covers an animation that drives
// partial geometry without touching emphasis.
export function isPromoted(e: GeomElement): boolean {
    return e.shouldHighlight || e.emphasized || e.drawProgress < 1;
}

/**
 * Reorder one draw pass so promoted elements paint last (on top), while
 * both groups keep their existing relative order.
 *
 * The promotion is deliberately *within a pass*, not to the top of the whole
 * figure: `drawElements` runs face → edge → vertex → name, so a promoted
 * face still stays under every edge. Highlighting a filled polygon therefore
 * can't hide the lines drawn across it.
 *
 * When nothing is promoted this returns the input order, so the render is
 * bit-for-bit unchanged for every static figure and every snapshot golden.
 */
export function promotedDrawOrder(elements: GeomElement[]): GeomElement[] {
    let promoted: GeomElement[] | null = null;
    for (let e of elements) {
        if (isPromoted(e)) {
            if (promoted == null) promoted = [];
            promoted.push(e);
        }
    }
    // Nothing highlighted or animating — the overwhelmingly common case.
    // Hand back the original array untouched (no allocation, no reorder).
    if (promoted == null) return elements;
    const rest: GeomElement[] = [];
    for (let e of elements) if (!isPromoted(e)) rest.push(e);
    return rest.concat(promoted);
}

export class Slate {

    protected _elements : GeomElement[];
    // Name aliases — secondary names that resolve to existing elements
    // without adding new ones to _elements. The original Geometry Applet
    // and Euclid's *Elements* refer to the same circle by every
    // permutation of its three named points (BCD ≡ CDB ≡ DBC ≡ …) and
    // to lines by either endpoint order (AB ≡ BA). Authors register
    // those equivalences here so the prose-side `{NAME}` shortcode can
    // light up the canonical element without needing a parallel
    // invisible duplicate per alias.
    private _aliases : Map<string, string> = new Map();
    // #140 — draw highlighted / mid-animation elements last within each
    // pass so they aren't painted over by later-declared neighbours.
    // On by default; set false to keep the strict declaration order.
    private _highlightOnTop : boolean = true;
    // Optional slideshow walk-through; populated from init().slides.
    // Empty array means no presentation mode is available; SlateControls
    // skips the "▶ Present" button.
    private _slides : ISlide[] = [];
    // Consumer-supplied callback resolving a justification ref label
    // (e.g. "I.Post.3") to a URL. Returns null/undefined when the ref
    // isn't recognised, in which case the Presentation overlay renders
    // the ref as plain text. Undefined means no resolver was passed.
    private _resolveJustification : ResolveJustification | null = null;
    // Slide-transition animation config (rates, durations, modifiers).
    // The slate ships a default; init() merges in whatever the
    // consumer provides via IInitialization.animationConfig.
    private _animationConfig : IAnimationConfig = {};
    // The frame-driver. Lazy-created on first animateTo() so a
    // headless test slate that never animates doesn't allocate a
    // requestAnimationFrame loop.
    private _animator : SlateAnimator | null = null;
    // Ephemeral helper elements an animation can spawn for its
    // lifetime (compass arms, guide circles, straightedge bars).
    // Drawn on top of _elements in the same face → edge → vertex →
    // name order; never appear in lookupElement; cleared on
    // animator.cancel() as a safety net.
    private _ephemerals : GeomElement[] = [];
    // View transform: model (logical) coords → display px is
    // F·model + T, where F = _viewScale (uniform) and T = (_viewOffsetX,
    // _viewOffsetY). drawElements then scales by dpr to the bitmap; the
    // pick path inverts it. T centres the figure when maximized (#99/#107);
    // F shrinks the figure to fit a narrow display (#71). Defaults
    // F=1, T=(0,0) are a no-op, so every existing render path — and the
    // headless snapshot path — is bit-for-bit unchanged.
    // #138 — the bounding box the maximized / presentation centring was
    // computed from. Captured ONCE on entering the maximized view (#114
    // centres once, not per slide) and cleared on leaving, so the centre
    // can't drift as slides reveal and hide elements, and so cloneAside's
    // centre phase (#99) eases to exactly the same target.
    private _centringBounds : { minX: number, maxX: number, minY: number, maxY: number } | null = null;
    // #164 — author-named element the maximized / presentation view centres
    // on, instead of deriving the centre from the figure's bounds. Config,
    // not measurement: clearCentringBounds() must NOT drop it.
    private _centerOnName : string | null = null;
    // #162 — an element wider or taller than this many canvases is treated
    // as unbounded for centring purposes. Generous on purpose: real figures
    // spill past their canvas by ~2x and must be unaffected.
    private static readonly CENTRING_OUTLIER_FACTOR = 10;
    private _centringOutliers : string[] = [];
    private _viewOffsetX : number = 0;
    private _viewOffsetY : number = 0;
    private _viewScale : number = 1;
    // The construction's authored coordinate extent (logical px). Element
    // coords live here. Defaults to the canvas bitmap so the headless /
    // snapshot path has logical == display == bitmap (fit-scale 1). init()
    // overrides it with the authored size on a real DOM canvas (#71).
    private _logicalWidth : number = 0;
    private _logicalHeight : number = 0;
    // Last-dispatched highlighted-name key, so the geomlib:highlight event
    // (#108) fires only when the SET of highlighted elements changes — not
    // on every redraw frame / emphasisAmount fade.
    private _lastHighlightedKey : string = "\u0000";
    // #154 — what this slate has complained about, so a badge can show it
    // and a consumer can read it. Per-slate on purpose: the dedupe flags
    // this replaced were module-global, so one figure's warning silenced
    // every other figure on the page.
    private _diagnostics : DiagnosticLog = new DiagnosticLog();
    private _diagnosticListeners : Array<(s: Slate) => void> = [];
    // #159 — names a macro animation will create partway through the walk
    // (compassTransfer's keepCircles). They do not exist at build time, so
    // both deck validators consult this before calling a name unresolvable.
    private _deferredNames : Set<string> = new Set();
    protected _screen : PlaneElement;
    protected _pick : PointElement;
    protected _canvas : SlateCanvas;
    private _htmlCanvas : HTMLCanvasElement = null;
    protected _bgcolor : string;
    public    inTest : boolean = false;
    private static numSlate : number = 0;
    private _itsNumSlate : number = -1;

    constructor(canvas: SlateCanvas) {
        Slate.numSlate += 1;
        this._itsNumSlate = Slate.numSlate;

        this._elements = [];
        if(canvas == null) {
            throw new TypeError("canvas cannot be null or undefined.");
        }
        this._canvas = canvas;

        let screen_origin = new FixedPoint({x:0,y:0,z:0});
        screen_origin.name = "screen_origin";
        let screen_x      = new FixedPoint({x:1,y:0,z:0});
        screen_x.name = "screen_x";
        let screen_y      = new FixedPoint({x:0,y:1,z:0});
        screen_y.name = "screen_y";

        let screen = new PlaneElement({
                A: screen_origin,
                B: screen_x,
                C: screen_y
        });
        screen.name = "screen";
        screen.nameColor = null;
        screen.isScreen = true;
        this._screen = screen;
        this._pick = null;

        for(let e of [screen_origin, screen_x, screen_y, screen]) {
            e.nameColor = null;
            e.vertexColor = null;
            e.vertexHighlightColor = null;
            e.faceColor = null;
            e.faceHighlightColor = null;
            this._elements.push(e);
        }
        let slate = this;

        let cnv : HTMLCanvasElement = this._canvas as HTMLCanvasElement;
        this._htmlCanvas = cnv;

        if(this._htmlCanvas.addEventListener == null) return;

        // Pointer Events unify mouse / touch / stylus into one event model.
        // Setting touch-action: none here (rather than relying on
        // consumer-side CSS) tells the browser not to claim drag gestures
        // for scroll/zoom; calling setPointerCapture on pointerdown ensures
        // we keep getting move/up events even when the finger leaves the
        // canvas bounds. See issue #55 for the design rationale.
        this._htmlCanvas.style.touchAction = "none";

        // Only the primary pointer drives the drag pipeline for now.
        // Multi-touch (two-finger rotation etc.) is intentionally not yet
        // wired — design questions tracked in issue #57.
        let activePointerId: number | null = null;

        this._htmlCanvas.addEventListener("pointerdown", (ev: PointerEvent) => {
            if (activePointerId !== null) return; // already tracking a primary
            activePointerId = ev.pointerId;
            try { slate._htmlCanvas.setPointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
            let [x, y] = slate._getCanvasPosition(ev.clientX, ev.clientY);
            slate._onMouseDown(x, y);
        });

        this._htmlCanvas.addEventListener("pointermove", (ev: PointerEvent) => {
            if (ev.pointerId !== activePointerId) return;
            let [x, y] = slate._getCanvasPosition(ev.clientX, ev.clientY);
            slate._onMouseDrag(x, y);
        });

        let endPointer = (ev: PointerEvent) => {
            if (ev.pointerId !== activePointerId) return;
            let [x, y] = slate._getCanvasPosition(ev.clientX, ev.clientY);
            slate._onMouseUp(x, y);
            try { slate._htmlCanvas.releasePointerCapture(ev.pointerId); } catch (_) { /* ignore */ }
            activePointerId = null;
        };

        this._htmlCanvas.addEventListener("pointerup", endPointer);
        this._htmlCanvas.addEventListener("pointercancel", endPointer);
        this._htmlCanvas.addEventListener("lostpointercapture", (ev: PointerEvent) => {
            if (ev.pointerId === activePointerId) {
                // Browser revoked capture (e.g., system gesture); clear pick state.
                if (slate._pick != null) {
                    slate._pick = null;
                }
                activePointerId = null;
            }
        });

    }

    _getCanvasPosition(x: number, y: number) : [number, number] {
        let r = this._htmlCanvas.getBoundingClientRect();
        // Map display px → model (logical) coords: invert the view
        // transform F·model + T, so a click lands on the real element even
        // while the figure is fit-scaled (#71) or slid to centre (#99/#107).
        // getBoundingClientRect is display px; dpr never enters here.
        // F = 1, T = 0 → today's plain rect subtraction.
        const F = this._viewScale || 1;
        return [(x - r.left - this._viewOffsetX) / F,
                (y - r.top  - this._viewOffsetY) / F];
    }

    _onMouseDown(x: number, y: number) {
        this._pick = null;
        this.movePick(x, y);
    };

    _onMouseUp(x: number, y: number) {
        if (this._pick == null) return;
        this.movePick(x, y);
        this._pick = null;
    };

    _onMouseDrag(x: number, y: number) {
        if (this._pick == null) return;
        this.movePick(x, y);
    };

    get elements() : GeomElement[] {
        return this._elements;
    }

    set highlightOnTop(value: boolean) {
        this._highlightOnTop = value;
    }

    get highlightOnTop() : boolean {
        return this._highlightOnTop;
    }

    set bgcolor(value: string ) {
        this._bgcolor = value;
    }

    get bgcolor() : string {
        return this._bgcolor;
    }

    // Public accessor for the underlying canvas. Consumer-side code on
    // multi-canvas pages (e.g. the {NAME} shortcode on euclids-elements.org)
    // needs to compare DOM positions of each slate's canvas against the
    // prose-side <span> to pick the right slate. Was protected before
    // 0.4.0; the few prior callers (s.canvas in elem-ref-highlight.js)
    // were just reading undefined and falling through to a brute-force
    // walk of geomlib.slates.
    get canvas() : SlateCanvas {
        return this._canvas;
    }

    lookupElement(name: string) : GeomElement {
        for (let elem of this._elements) {
            if (elem.name == name) {
                return elem;
            }
        }
        // Direct miss — follow the alias map and look up the canonical
        // name. One hop only: we don't chase chains because aliases are
        // expected to point at real element names, not at each other.
        let canonical = this._aliases.get(name);
        if (canonical != null) {
            for (let elem of this._elements) {
                if (elem.name == canonical) return elem;
            }
        }
        return null;
    }

    // Register a single secondary name → canonical name mapping. Idempotent.
    // Called by init() when the user passes an `aliases` field.
    addAlias(from: string, to: string) : void {
        this._aliases.set(from, to);
    }

    addAliases(aliases: {[from: string]: string}) : void {
        for (let from in aliases) this._aliases.set(from, aliases[from]);
    }

    // Draggable elements named here are excluded from the slideshow's
    // every-slide auto-union and follow slide visible sets like any
    // other element — for proof-introduced draggables ("Take an
    // arbitrary point F") that shouldn't show before their moment.
    // They stay fully draggable whenever visible (#89). Populated by
    // init() from the `deferDraggables` field.
    private _deferredDraggables : Set<string> = new Set();

    get deferredDraggables() : Set<string> {
        return this._deferredDraggables;
    }

    deferDraggables(names: string[]) : void {
        for (const n of names || []) this._deferredDraggables.add(n);
    }

    get slides() : ISlide[] {
        return this._slides;
    }

    set slides(value: ISlide[]) {
        this._slides = value || [];
    }

    get resolveJustification() : ResolveJustification | null {
        return this._resolveJustification;
    }

    set resolveJustification(value: ResolveJustification | null) {
        this._resolveJustification = value;
    }

    get animationConfig() : IAnimationConfig {
        return this._animationConfig;
    }

    set animationConfig(value: IAnimationConfig) {
        this._animationConfig = value || {};
    }

    get animator() : SlateAnimator | null {
        return this._animator;
    }

    get ephemerals() : GeomElement[] {
        return this._ephemerals;
    }

    addEphemeral(e: GeomElement) : void {
        this._ephemerals.push(e);
    }

    // Register a pre-built element as a persistent (non-ephemeral) member of
    // the figure — drawn in the normal pass, addressable by name, and governed
    // by the slideshow visible-set. Used by macro animations (e.g.
    // A.Circle.compassTransfer's keepCircles) to leave named scaffolding that a
    // later slide can re-show, where addEphemeral's wipe-on-advance won't do.
    addElement(e: GeomElement) : void {
        if (this._elements.indexOf(e) === -1) this._elements.push(e);
    }

    removeEphemeral(e: GeomElement) : void {
        const i = this._ephemerals.indexOf(e);
        if (i >= 0) this._ephemerals.splice(i, 1);
    }

    clearEphemerals() : void {
        this._ephemerals.length = 0;
    }

    get viewOffsetX() : number { return this._viewOffsetX; }
    get viewOffsetY() : number { return this._viewOffsetY; }
    get viewScale() : number { return this._viewScale; }

    // Device pixel ratio (#71). The canvas BITMAP is sized to display px ×
    // dpr so drawing lands on native device pixels (crisp on HiDPI/retina).
    // Headless / no window → 1, so node-canvas rendering (and the snapshot
    // goldens) is unchanged.
    private _dpr() : number {
        return (typeof window !== "undefined" && window.devicePixelRatio) || 1;
    }

    // The authored coordinate extent (logical px) — the space element
    // coords live in. Falls back to the bitmap when unset (headless /
    // snapshot path), so logical == bitmap there. (#71)
    get logicalWidth() : number { return this._logicalWidth || this._canvas.width; }
    get logicalHeight() : number { return this._logicalHeight || this._canvas.height; }
    setLogicalSize(w: number, h: number) : void {
        if (w > 0) this._logicalWidth = w;
        if (h > 0) this._logicalHeight = h;
    }

    // The canvas DISPLAY size in CSS px (responsive; clientWidth on a real
    // DOM canvas, the fixed bitmap headless). The figure is fit-scaled from
    // logical → display. (#71)
    get displayWidth() : number {
        const c = this._canvas as any;
        return (typeof c.clientWidth === "number" && c.clientWidth) || this._canvas.width;
    }
    get displayHeight() : number {
        const c = this._canvas as any;
        return (typeof c.clientHeight === "number" && c.clientHeight) || this._canvas.height;
    }

    // Recompute the fit-scale F = min(1, display / logical): shrink the
    // figure to fit a narrow display, never grow it. Called on init/resize.
    recomputeFitScale() : void {
        const sx = this.displayWidth / this.logicalWidth;
        const sy = this.displayHeight / this.logicalHeight;
        this._viewScale = Math.min(1, sx, sy);
    }

    // Set the view transform's translate T (display px). drawElements
    // applies F·model + T; the pick path inverts it. (#99/#107)
    setViewOffset(x: number, y: number) : void {
        this._viewOffsetX = x;
        this._viewOffsetY = y;
    }

    clearViewOffset() : void {
        this._viewOffsetX = 0;
        this._viewOffsetY = 0;
    }

    // Axis-aligned bounding box (canvas px) of the visible figure —
    // every named, visible, non-screen element. Returns null when the
    // figure is empty. Used by cloneAside auto-place for the centre
    // target and the fit check (#99). Points/lines/polygons/circles are
    // measured exactly; sector markers sit inside their vertex (already
    // counted) so they're not separately walked.
    visibleBounds() : { minX: number, maxX: number, minY: number, maxY: number } | null {
        return this._bounds(true);
    }

    // Like visibleBounds() but over EVERY named, non-screen element
    // regardless of its `visible` flag — a stable bound that doesn't drift
    // as a presentation reveals/hides elements slide-to-slide. Used to
    // centre the figure in a maximized / presentation view (#107).
    figureBounds() : { minX: number, maxX: number, minY: number, maxY: number } | null {
        return this._bounds(false);
    }

    // #138 — does this element put any ink on the canvas?
    //
    // Deck figures carry construction helpers that exist only to define a
    // direction or a slider's track — a "point at infinity" aim, the two
    // anchors a lineSlider runs between — authored with zero colours so they
    // draw nothing. They are still `visible`, so a visibility filter does NOT
    // exclude them; only asking what actually paints does.
    //
    // The test is per type because a colour slot an element never uses tells
    // us nothing: PointElement.drawEdge / drawFace are no-ops, so a point's
    // edgeColor (which defaults to black when the author omits the field)
    // must not count as ink — that default is exactly what made these helpers
    // look paintable.
    private _paintsInk(elem: GeomElement) : boolean {
        if (!elem.visible) return false;
        if (elem.nameColor != null) return true;
        if (elem instanceof PointElement) return elem.vertexColor != null;
        return elem.edgeColor != null || elem.faceColor != null;
    }

    // Bounding box to centre the figure on in the maximized / presentation
    // view (#107). Measures only elements that actually paint, so an
    // off-screen zero-colour helper can't inflate the box and translate the
    // real geometry off-canvas — the #138 blank-slideshow bug, hit on I.35,
    // I.42 and I.43.
    //
    // Captured once per maximized session rather than recomputed: the result
    // must not move as slides change visibility, and cloneAside reads the
    // same captured box so its centre phase lands where the base centring
    // already is. Falls back to the all-elements bounds if nothing paints at
    // all (a figure built entirely from helpers), so the caller always gets
    // the same shape of answer as before.
    captureCentringBounds() : { minX: number, maxX: number, minY: number, maxY: number } | null {
        this._centringOutliers = [];
        const inked = this._bounds(false, (e) => {
            if (!this._paintsInk(e)) return false;
            if (this._isCentringOutlier(e)) {
                if (e.name != null) this._centringOutliers.push(e.name);
                return false;
            }
            return true;
        });
        // Everything was an outlier (or nothing paints) — better to centre on
        // a runaway figure than to refuse to centre at all.
        this._centringBounds = this._recentreOnTarget(inked != null
            ? inked
            : (this._bounds(false, (e) => this._paintsInk(e)) || this._bounds(false)));
        return this._centringBounds;
    }

    /**
     * Name the element the maximized / presentation view centres on (#164).
     *
     * Bounds-derived centring stays the default and is right for nearly every
     * figure. It cannot be right for some: the hyperbolic Desargues figure is
     * built from geodesics, which ARE large circles, so no arrangement of its
     * points makes its bounds match its canvas. #162 keeps such a figure from
     * landing off-screen; this lets the author say where the centre actually
     * is. Sits beside `pivot`, and often takes the same value.
     *
     * The name is resolved through the alias table and needs no label and no
     * visibility — a zero-colour marker point is a perfectly good target, and
     * is exactly what the Desargues page uses (`diskcenter`). An unresolvable
     * name is reported (#154) and the figure falls back to bounds centring.
     */
    setCenterOn(name: string | null) : void {
        this._centerOnName =
            (typeof name === "string" && name !== "") ? name : null;
        if (this._centerOnName != null
                && this.lookupElement(this._centerOnName) == null) {
            this.reportDiagnostic({
                code: "unknown-center-on",
                key: this._centerOnName,
                message: "centerOn names '" + this._centerOnName +
                    "', but no element or alias resolves to it \u2014 the " +
                    "maximized view falls back to centring on the figure's " +
                    "bounds. Check for a typo, or for a target left behind " +
                    "by a figure change.",
                detail: { centerOn: this._centerOnName },
            });
        }
    }

    /** The element name the view centres on, or null for bounds centring. */
    get centerOn() : string | null {
        return this._centerOnName;
    }

    /**
     * Slide a measured box so its midpoint is the centerOn element's centre.
     *
     * Shifted rather than replaced: the box's EXTENT is still meaningful to
     * other callers — cloneAside sizes its aside from it — so only the centre
     * is overridden. For an element with extent, its own bounding-box centre
     * is the natural reading of "centre on this".
     */
    private _recentreOnTarget(
            b: { minX: number, maxX: number, minY: number, maxY: number } | null
        ) : { minX: number, maxX: number, minY: number, maxY: number } | null {
        if (this._centerOnName == null) return b;
        const elem = this.lookupElement(this._centerOnName);
        if (elem == null) return b;          // reported in setCenterOn
        const eb = this._elementBounds(elem);
        if (eb == null) return b;
        const cx = (eb.minX + eb.maxX) / 2, cy = (eb.minY + eb.maxY) / 2;
        // Nothing painted at all — centre on the target with no extent.
        if (b == null) return { minX: cx, maxX: cx, minY: cy, maxY: cy };
        const dx = cx - (b.minX + b.maxX) / 2;
        const dy = cy - (b.minY + b.maxY) / 2;
        return { minX: b.minX + dx, maxX: b.maxX + dx,
                 minY: b.minY + dy, maxY: b.maxY + dy };
    }

    /**
     * Should this element be left out of the centring box (#162)?
     *
     * #138 stopped an element that paints *nothing* from dragging the centre
     * off-canvas. This is the other half: an element that legitimately paints
     * but has runaway extent. A circumcircle through near-collinear points is
     * unbounded, and on the hyperbolic Desargues figure one reached a radius
     * of ~11,300 on a 500x320 canvas — bounds of roughly 22,600 x 23,100, so
     * maximizing translated the whole figure into blank space.
     *
     * That is not an authoring mistake: Desargues' theorem is *about*
     * collinearity, so constructions of that kind keep producing
     * near-degenerate circles. Only the sliver crossing the canvas is ever
     * seen, so such an element should not decide where the centre is.
     *
     * The threshold is deliberately generous — figures legitimately spill
     * past their canvas (a Book I deck runs to ~2x) and must keep centring
     * exactly as before. This only catches the pathological case.
     */
    private _isCentringOutlier(elem: GeomElement) : boolean {
        // The GETTERS, not the private fields: _logicalWidth is 0 until
        // init() sets it, and the getters fall back to the canvas bitmap.
        // Reading the fields made this a silent no-op on any slate built
        // without an explicit size — including the whole snapshot path.
        const w = this.logicalWidth, h = this.logicalHeight;
        if (!(w > 0) || !(h > 0)) return false;   // no frame of reference
        const b = this._elementBounds(elem);
        if (b == null) return false;
        return (b.maxX - b.minX) > w * Slate.CENTRING_OUTLIER_FACTOR
            || (b.maxY - b.minY) > h * Slate.CENTRING_OUTLIER_FACTOR;
    }

    /**
     * Names of elements left out of the last centring measurement (#162).
     *
     * Exposed rather than reported: after this fix the figure centres
     * correctly, so badging it would flag a page that now works. A deck
     * checker can still surface these to point at a near-degenerate
     * construction the author may want to know about.
     */
    get centringOutliers() : string[] {
        return this._centringOutliers.slice();
    }

    get centringBounds() : { minX: number, maxX: number, minY: number, maxY: number } | null {
        return this._centringBounds;
    }

    clearCentringBounds() : void {
        this._centringBounds = null;
    }

    // One element's axis-aligned extent, or null when it contributes none.
    // Split out of _bounds (#162) so an element can be judged on its own
    // size before it is allowed to influence the figure's centre.
    private _elementBounds(elem: GeomElement) : { minX: number, maxX: number, minY: number, maxY: number } | null {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        const add = (x: number, y: number) => {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
        };
        if (elem instanceof PolygonElement) {
            for (let v of elem.V) add(v.x, v.y);
        } else if (elem instanceof CircleElement) {
            const r = elem.radius;
            add(elem.Center.x - r, elem.Center.y - r);
            add(elem.Center.x + r, elem.Center.y + r);
        } else if (elem instanceof LineElement) {
            add(elem.A.x, elem.A.y);
            add(elem.B.x, elem.B.y);
        } else if (elem instanceof PointElement) {
            add(elem.x, elem.y);
        }
        if (minX === Infinity) return null;
        return { minX, maxX, minY, maxY };
    }

    private _bounds(visibleOnly: boolean,
                    accept?: (e: GeomElement) => boolean) : { minX: number, maxX: number, minY: number, maxY: number } | null {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let elem of this._elements) {
            if (elem.name == null || elem.name.startsWith("screen")) continue;
            if (visibleOnly && !elem.visible) continue;
            if (accept != null && !accept(elem)) continue;
            const b = this._elementBounds(elem);
            if (b == null) continue;
            if (b.minX < minX) minX = b.minX;
            if (b.maxX > maxX) maxX = b.maxX;
            if (b.minY < minY) minY = b.minY;
            if (b.maxY > maxY) maxY = b.maxY;
        }
        if (minX === Infinity) return null;
        return { minX, maxX, minY, maxY };
    }

    // All names that resolve to the element named `canonical`: the
    // element's own name plus every alias whose target is it. Used to tag
    // the geomlib:highlight event so a consumer can match a prose ref by
    // any spelling (BCD ≡ CDB ≡ DBC). (#108)
    namesFor(canonical: string) : string[] {
        const names = [canonical];
        this._aliases.forEach((target, from) => {
            if (target === canonical && from !== canonical) names.push(from);
        });
        return names;
    }

    // Lazy-create the animator on first use. Each slate owns at most
    // one — cancel() preserves it for re-use across slide transitions.
    private _ensureAnimator() : SlateAnimator {
        if (this._animator == null) {
            this._animator = new SlateAnimator(this);
        }
        return this._animator;
    }

    // Public entry point for slideshow controllers. Diff the current
    // visibility / highlight state against the target, run any slide-
    // listed animations against the elements becoming visible. Newly-
    // visible elements without an explicit animation entry pop in
    // instantly (4b parity). Returns a Promise that resolves when the
    // animator completes the run or cancel() is called.
    animateTo(
        targetVisible: Set<string>,
        targetHighlighted: Set<string>,
        slideAnimations: ISlideAnimation[],
        mode: "cascade" | "parallel",
    ) : Promise<void> {
        return this._ensureAnimator().run(
            targetVisible, targetHighlighted, slideAnimations, mode,
        );
    }

    // Hide every named element whose name is not in the supplied set.
    // Names not matching any element are silently ignored; elements
    // without a name (intermediate construction outputs) are left alone.
    // Screen-helper elements (screen / screen_origin / screen_x /
    // screen_y) follow the same rule: their visible flag does flip, but
    // since they're created with all-null colours they never draw
    // visible pixels anyway. Called by the presentation overlay per
    // slide; consumers can call directly too.
    setVisibleNames(names: string[]) : void {
        const visible = new Set(names);
        for (let elem of this._elements) {
            if (elem.name == null) continue;
            elem.visible = visible.has(elem.name);
        }
    }

    // Names of elements that start hidden (angle markers by default, or
    // anything in init's `initiallyHidden`). clearVisibility restores to
    // this baseline rather than blanket-true, so hidden elements stay
    // hidden after a presentation walk. (#100)
    private _initiallyHidden : Set<string> = new Set();

    get initiallyHidden() : Set<string> {
        return this._initiallyHidden;
    }

    // Mark a named element hidden in the initial figure: flips its
    // visible flag off now and remembers it for clearVisibility.
    setInitiallyHidden(name: string) : void {
        if (name == null) return;
        this._initiallyHidden.add(name);
        const elem = this.lookupElement(name);
        if (elem != null) elem.visible = false;
    }

    // Restore every element's visible flag to its initial baseline —
    // true, except names registered as initially hidden. Counterpart to
    // setVisibleNames; called on presentation exit so the canvas
    // returns to its inline default.
    clearVisibility() : void {
        for (let elem of this._elements) {
            elem.visible = !(elem.name != null && this._initiallyHidden.has(elem.name));
        }
    }

    // Sort params into P[] (points), E[] (other elements), N[] (integers),
    // matching Java's selectDataChoice (Slate.java lines 344-393).
    // LineElements are expanded into their two endpoint PointElements, unless
    // the target construction opts out (keepLineElements — e.g. curvedTriangle/
    // curvedPolygon take a line intact as a straight-side carrier).
    convertParams(params: any[], keepLineElements: boolean = false) : SortedParams {
        let P: PointElement[] = [];
        let E: GeomElement[] = [];
        let N: number[] = [];
        for(let param of params) {
            switch(typeof(param)) {
                case "string":
                    let g : GeomElement = this.lookupElement(param);
                    if ( g == null )
                        throw new TypeError(`Element with name ${param} not found.`);
                    if (g instanceof PointElement) {
                        P.push(g);
                    } else if (g instanceof LineElement && !keepLineElements) {
                        // LineElement expands to two PointElements (matching Java)
                        P.push(g.A);
                        P.push(g.B);
                    } else {
                        E.push(g);
                    }
                    break;
                case "number":
                    N.push(param);
                    break;
                default:
                    throw new TypeError("Expecting only named elements (strings) or numbers.");
            }
        }
        return {P, E, N};
    }

    findConstruction(cm : AllConstructions, sp: SortedParams) : Construction {
        for(let c of constructions) {
            if(c.validateSignature(cm, sp)) {
                return c;
            }
        }
        return null;
    }

    createElement(cm : AllConstructions, params: any[], name?: string) : GeomElement {
        // A construction for this method may want LineElement params kept
        // intact (not expanded to endpoints) — see Construction.keepsLineElements.
        let keepLines = constructions.some(c => c.constructionMethod === cm && c.keepsLineElements);
        let sp : SortedParams = this.convertParams(params, keepLines);
        let c : Construction = this.findConstruction(cm, sp);
        if(c == null) {
            let cName : String = getConstructionName(cm);
            if (name == null) {
                name = "";
            }
            throw new TypeError(`Construction not found for "${name}" ${cName} with params P=[${sp.P}] E=[${sp.E}] N=[${sp.N}]`);
        }
        let [gs, g] = c.construct(this._screen, sp.P, sp.E, sp.N);
        // Mark as preexisting if this element was already in _elements
        // before this construction (e.g., point;first returns an existing
        // PointElement). Preexisting elements are skipped during
        // rotate/translate to avoid double-movement.
        // (Java: Slate.java preexists[] array)
        if (this._elements.indexOf(g) !== -1) {
            g.preexists = true;
        }
        if(name != null)
            g.name = name;
        for (let elem of gs) {
            if (this._elements.indexOf(elem) == -1)
                this._elements.push(elem);
        }
        if(this._elements.indexOf(g) == -1)
            this._elements.push(g);
        return g;
    }

    reset() : void {
        for (let element of this._elements) {
            element.reset();
        }
        this.update();
    }

    update() : void {
        for(let element of this._elements) element.update();
        this.drawElements();
    }

    drawElements(): void {
        if(this.inTest) return;
        let ctx : CanvasRenderingContext2D = this._canvas.getContext("2d") as CanvasRenderingContext2D;
        // View transform (#71/#99/#107): model (logical) coords map to
        // device px as dpr·(F·model + T), where F = _viewScale (fit) and
        // T = view offset (centre). Clear + background fill cover the whole
        // bitmap under identity; the figure + ephemerals then draw under the
        // model→device transform. Headless dpr=1, F=1, T=0 → identity, so
        // node-canvas rendering (and every snapshot golden) is unchanged.
        const dpr = this._dpr(), F = this._viewScale;
        const tx = this._viewOffsetX, ty = this._viewOffsetY;
        // Keep decorations (labels, dots, line widths) a constant on-screen
        // size while the geometry is fit-scaled by F (#71). 1/F ≥ 1; F=1 → 1.
        GeomElement.styleScale = F > 0 ? 1 / F : 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        ctx.fillStyle = this._bgcolor;
        ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
        ctx.setTransform(dpr * F, 0, 0, dpr * F, dpr * tx, dpr * ty);
        // #140 — highlighted / mid-animation elements paint last within each
        // pass, so a later-declared neighbour can't chop the gold stroke
        // where it crosses. Identity when nothing is promoted.
        const order = this._highlightOnTop
            ? promotedDrawOrder(this._elements) : this._elements;
        for(let element of order) element.drawFace(this._canvas);
        for(let element of order) element.drawEdge(this._canvas);
        for(let element of order) element.drawVertex(this._canvas);
        // and then draw their names.
        for(let element of order)
            element.drawName(this._canvas);
        // Ephemeral animation helpers render on top of the permanent
        // figure (compass arms, guide circles, straightedge bars).
        // Same face → edge → vertex → name pass order so a guide arc
        // overlays correctly without re-clearing the canvas.
        for(let e of this._ephemerals) e.drawFace(this._canvas);
        for(let e of this._ephemerals) e.drawEdge(this._canvas);
        for(let e of this._ephemerals) e.drawVertex(this._canvas);
        for(let e of this._ephemerals) e.drawName(this._canvas);
        ctx.setTransform(1, 0, 0, 1, 0, 0);   // reset so nothing leaks
        GeomElement.styleScale = 1;
        this._dispatchHighlightChange();
    }

    // #108 — bidirectional highlight binding. After each real draw, if the
    // SET of highlighted elements (shouldHighlight || emphasized — the
    // boolean intent, ignoring the fading emphasisAmount) has changed,
    // emit a `geomlib:highlight` CustomEvent on the canvas so a consuming
    // page can light up every textual reference to those elements. The
    // event carries each element's canonical name + all its aliases. Fires
    // on any highlight source (prose-ref hover, slide `highlighted`) since
    // it lives in the shared redraw path; idempotent (no re-emit on an
    // unchanged set → no feedback loop). No-op when the canvas can't
    // dispatch DOM events (node-canvas in tests).
    private _dispatchHighlightChange() : void {
        const names: string[] = [];
        for (let elem of this._elements) {
            if (elem.name == null || elem.name.startsWith("screen")) continue;
            if (elem.shouldHighlight || elem.emphasized) names.push(elem.name);
        }
        const key = names.sort().join("|");
        if (key === this._lastHighlightedKey) return;
        this._lastHighlightedKey = key;
        const canvas: any = this._canvas;
        if (!canvas || typeof canvas.dispatchEvent !== "function"
            || typeof CustomEvent !== "function") return;
        const highlighted = names.map(n => ({ name: n, aliases: this.namesFor(n) }));
        canvas.dispatchEvent(new CustomEvent("geomlib:highlight", {
            bubbles: true,
            detail: { highlighted },
        }));
    }

    // ---- Diagnostics (#154) ------------------------------------------
    //
    // geomlib skips what it cannot resolve and keeps rendering, which is
    // the right behaviour — a deck with one bad name should still draw.
    // The cost is that the only evidence was a console line nobody has
    // open. Reporting through here records it too, so SlateControls can
    // badge the canvas and a consumer can read the list.

    /**
     * Record a diagnostic and mirror it to the console.
     *
     * Deduped per key, per slate: repeat reports bump a counter without
     * a second console line. That replaces two module-global dedupe
     * flags which silenced a warning for every OTHER figure on the page
     * once any one figure tripped them.
     */
    reportDiagnostic(input: IDiagnosticInput) : void {
        const rec = this._diagnostics.report(input, Date.now());
        if (rec == null) return;   // already reported on this slate

        if (typeof console !== "undefined") {
            const fn = rec.severity === "error" ? console.error : console.warn;
            if (fn) fn("[geomlib] " + rec.message);
        }
        this._dispatchDiagnostic(rec);
        this._notifyDiagnosticListeners();
    }

    /**
     * Register names that an animation will create later in the walk (#159).
     *
     * Deck validation runs when the figure is built, so a name a macro has
     * yet to register would otherwise look like a typo. This does NOT create
     * the elements — lookupElement still returns null until the animation
     * runs; it only tells the validators that the name is accounted for.
     */
    declareDeferredNames(names: string[]) : void {
        for (const n of names || []) {
            if (typeof n === "string" && n !== "") this._deferredNames.add(n);
        }
    }

    /** True when some animation on this slate has claimed the name (#159). */
    isDeferredName(name: string) : boolean {
        return this._deferredNames.has(name);
    }

    /** Everything this slate has reported, oldest first. */
    get diagnostics() : IDiagnostic[] {
        return this._diagnostics.entries;
    }

    /** Worst severity reported, or null when the slate is clean. */
    get diagnosticSeverity() : DiagnosticSeverity | null {
        return this._diagnostics.severity;
    }

    /**
     * Forget everything reported so far.
     *
     * NOT called from reset(): minimize() and presentation-exit both run
     * reset() internally, and construction-time diagnostics never fire
     * again, so clearing there would silently discard exactly the
     * warnings worth keeping. SlateControls calls this from the explicit
     * reset control / `r` key instead — a deliberate viewer gesture.
     */
    clearDiagnostics() : void {
        this._diagnostics.clear();
        this._dispatchDiagnostic(null);
        this._notifyDiagnosticListeners();
    }

    /** Subscribe to diagnostic changes. Returns an unsubscribe fn. */
    onDiagnosticsChanged(listener: (s: Slate) => void) : () => void {
        this._diagnosticListeners.push(listener);
        return () => {
            const i = this._diagnosticListeners.indexOf(listener);
            if (i >= 0) this._diagnosticListeners.splice(i, 1);
        };
    }

    private _notifyDiagnosticListeners() : void {
        for (const l of this._diagnosticListeners.slice()) {
            try { l(this); } catch (_) { /* a listener must not break reporting */ }
        }
    }

    // Same capability guard as the geomlib:highlight dispatch above — a
    // node-canvas Canvas has no dispatchEvent, so the headless path
    // short-circuits here exactly as it does for highlights.
    private _dispatchDiagnostic(d: IDiagnostic | null) : void {
        const canvas: any = this._canvas;
        if (!canvas || typeof canvas.dispatchEvent !== "function"
            || typeof CustomEvent !== "function") return;
        canvas.dispatchEvent(new CustomEvent("geomlib:diagnostic", {
            bubbles: true,
            detail: diagnosticEventDetail(this._diagnostics, d),
        }));
    }

    // Update coordinates starting with element[i+1], matching Java's
    // Slate.java updateCoordinates (lines 808-814). Only elements AFTER
    // the picked element are recomputed — elements before it are left
    // untouched to avoid reprojection artifacts after rotation.
    updateCoordinates(i : number) {
        for(++i; i < this._elements.length; i++) {
            if(!this._elements[i].defined())
                this._elements[i].reset();
            this._elements[i].update();
        }
        this.drawElements();
    }

    translateCoordinates(dx : number, dy: number) {
        // translate all non-preexisting elements
        // (Java: Slate.java line 819 — if (!preexists[i]) element[i].translate(...))
        for(let i = 0; i < this._elements.length; i++) {
            let elem = this._elements[i];
            if (!elem.preexists)
                elem.translate(dx, dy);
        }
        this.update();
    }

    closestVisiblePoint(elements : GeomElement[], p : PointElement, tolerance : number = 30) : PointElement {
        // Use 2D screen distance (x,y only, ignoring z) for picking,
        // matching the Java applet's movePick() at Slate.java:887-889.
        // The canvas is a 2D projection; a 3D point at (x,y,z) renders
        // at screen position (x,y) regardless of z.
        let screenDist2 = (a: PointElement, b: PointElement) =>
            (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
        let sortedDistanceElements = elements
            .filter(e => e instanceof PointElement)
            .map(e => e as PointElement)
            .filter(e => e.vertexColor != null)
            .sort((a,b) => {
                let adcp = screenDist2(a, p);
                let bdcp = screenDist2(b, p);
                if(adcp < bdcp) {
                    return -1;
                } else if (bdcp < adcp) {
                    return 1;
                }
                return 0;
            });
        if (sortedDistanceElements.length == 0) return null;
        let bestDistPoint = sortedDistanceElements[0];
        if(Math.sqrt(screenDist2(bestDistPoint, p)) > tolerance) return null;
        return bestDistPoint;
    }

    private _getPick(c: number, d: number) : PointElement {
        if (this._pick != null) return this._pick;
        let currentPoint = new PointElement({x:c,y:d});
        let closestVisiblePoint = this.closestVisiblePoint(this._elements, currentPoint);
        if(closestVisiblePoint == null) return;
        this._pick = closestVisiblePoint;
        return this._pick;
    }

    // Set the pivot point for scene rotation.
    // Format: "pointName" or "pointName,planeName"
    // Without a plane, the pivot is set on the screen plane.
    // With a plane, the pivot is set on that plane (for 3D rotation).
    // (Java: Slate.java setPivot, lines 787-801)
    setPivot(param : string) : void {
        let parts = param.split(",");
        let pointName = parts[0].trim();
        let e : GeomElement = this.lookupElement(pointName);
        if (e == null || !(e instanceof PointElement)) return;
        let piv : PointElement = e as PointElement;

        if (parts.length > 1) {
            // "A,xyplane" — set pivot on a specific plane
            let planeName = parts[1].trim();
            let p : GeomElement = this.lookupElement(planeName);
            if (p == null || !(p instanceof PlaneElement)) return;
            (p as PlaneElement).pivot = piv;
        } else {
            // "A" — set pivot on screen plane
            piv._AP = this._screen;
            this._screen.pivot = piv;
        }
    }

    movePick(c: number, d: number) : void {
        if(this._getPick(c, d) == null) return;
        let picki = this._elements.indexOf(this._pick);

        // Clamp the drag to the on-screen region in MODEL coords. Under the
        // view transform F·model + T, the display spans model
        // [−T/F, (display − T)/F] — so the fit-scale (#71) and centre offset
        // (#99/#107) both shift/scale the bounds. F=1, T=0 → [0, display].
        const F = this._viewScale || 1;
        let ox = this._viewOffsetX, oy = this._viewOffsetY;
        let loX = -ox / F, hiX = (this.displayWidth - ox) / F;
        if (c < loX) c = loX; else if (c > hiX) c = hiX;
        let loY = -oy / F, hiY = (this.displayHeight - oy) / F;
        if (d < loY) d = loY; else if (d > hiY) d = hiY;
        if (Math.abs(c - this._pick.x) + Math.abs(d - this._pick.y) < 1.0) {
            return; // no motion
        }
        if ( this._pick.draggable ) {
            if(this._pick.drag(c,d)) {
                this.updateCoordinates(picki);
            } else {
                return;
            }
        } else if (this._pick.AP != null 
          && this._pick.AP.pivot != null
          && this._pick.AP.pivot != this._pick) { // rotate around the pivot
              this.rotateCoordinates(c,d);
        } else {
            let dx = c - this._pick.x;
            let dy = d - this._pick.y;
            this.translateCoordinates(dx,dy);
        }
        this.drawElements();
    }

    rotateCoordinates(c : number, d : number) : void {
      // rotate space according to how pick goes around pivot in the plane
      let pick : PointElement = this._pick;
      let piv : PointElement = pick.AP.pivot;
      // compute old and new pick's 3D coordinates relative to the pivot
      let oldP : PointElement = PointElement.difference(pick,piv);
      let newx : number = c-piv.x;
      let newy : number = d-piv.y;		//(newz is irrelevant)
      // find their 2D coordinates on the plane
      let S : PointElement = pick.AP.S;
      let T : PointElement = pick.AP.T;
      let olds : number = PointElement.dot(oldP,S);
      let oldt : number = PointElement.dot(oldP,T);
      let den  : number = S.x * T.y - S.y * T.x;
      let news : number = (newx*T.y - newy*T.x)/den;
      let newt : number = (newy*S.x - newx*S.y)/den;
      // compute the scale&rotation factors
      den = olds*olds + oldt*oldt;
      let ac : number = (news*olds + newt*oldt)/den;
      let as : number = (newt*olds - news*oldt)/den;
      // Rotate all non-preexisting elements directly.
      // (Java: Slate.java line 843-845)
      for (let elem of this._elements) {
          if (!elem.preexists)
              elem.rotate(piv, ac, as);
      }
      // After direct rotation, recompute derived elements from their (now
      // rotated) parents. Java doesn't need this because element[] carries
      // duplicate entries for shared objects — a Layoff created by
      // line;extend and re-referenced by point;last appears at two indices,
      // one with preexists=false that gets rotated directly. TS dedupes
      // _elements, so a shared object marked preexists=true is skipped,
      // which means Layoff-style points backed by bare LineElement wrappers
      // would never get moved directly (bare LineElement.rotate is a no-op).
      // Running update() rebuilds them from their (rotated) parents, which
      // produces the same result because rotation is a linear operation
      // and Layoff.update() derives its position from parent coords.
      this.update();
    }

}
