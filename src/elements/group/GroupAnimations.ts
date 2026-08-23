// Cross-type group animations. See ../Animations.ts for the abstract
// base + registry mechanics.

import {Animation, AllAnimations, IAnimationStep, registerAnimation} from "../Animations";
import {GeomElement} from "../GeomElement";
import {Slate} from "../../Slate";
import {PointElement} from "../point/PointElement";
import {LineElement} from "../line/LineElement";
import {PolygonElement} from "../polygon/PolygonElement";
import {LineSlider} from "../point/LineSlider";

const CLONE_ASIDE_RATE_PX_PER_MS = 0.4;
const CLONE_ASIDE_MIN_MS = 200;
// Below this canvas (≈ viewport, in presentation mode) width, the legacy
// explicit-offset path skips the case-variant copies — they were a
// desktop affordance. The autoPlace path (#99) supersedes this: it slides
// the figure to centre and only opts out when a copy genuinely can't fit.
const CLONE_ASIDE_DESKTOP_MIN_WIDTH = 520;

// autoPlace timing + spacing (#99).
const CLONE_ASIDE_AUTOPLACE_MS = 900;   // whole centre-then-split beat
const AUTOPLACE_CENTRE_FRAC = 0.4;      // first 40%: slide figure to centre
const AUTOPLACE_MARGIN = 8;             // px gap to the canvas edge
const AUTOPLACE_GAP = 16;               // px gap between figure and a copy

// easeOutCubic for the slide-to-centre phase.
function easeOut(t: number): number { return 1 - Math.pow(1 - t, 3); }

// A mutable clone vertex tracked against its snapshot base, so the
// animation can slide every clone point by the same offset.
interface ClonePoint { pt: PointElement; bx: number; by: number; }

// Snapshot one element into a bare render-copy (no construction refs;
// update() is a no-op) at its current geometry, returning the ghost
// plus the list of its mutable points. Supported v1 types: point,
// line, polygon. Unsupported types return null (skipped with a warn).
function snapshotElement(el: GeomElement): { ghost: GeomElement, pts: ClonePoint[] } | null {
    const bare = (src: PointElement): PointElement => {
        const p = new PointElement();
        p.x = src.x; p.y = src.y; p.z = src.z;
        return p;
    };
    // PolygonElement extends nothing point-like but has V[]; check it
    // before LineElement / PointElement so a polygon isn't mis-typed.
    if (el instanceof PolygonElement) {
        const ghost = new PolygonElement();
        const pts: ClonePoint[] = [];
        for (const v of el.V) {
            const p = bare(v);
            ghost.V.push(p);
            pts.push({ pt: p, bx: p.x, by: p.y });
        }
        ghost.edgeColor = el.edgeColor;
        ghost.faceColor = el.faceColor;
        ghost.faceAlpha = el.faceAlpha;
        ghost.nameColor = el.nameColor;
        ghost.vertexColor = el.vertexColor;
        return { ghost, pts };
    }
    if (el instanceof LineElement) {
        const a = bare(el.A);
        const b = bare(el.B);
        const ghost = new LineElement({ A: a, B: b });
        ghost.edgeColor = el.edgeColor;
        ghost.nameColor = el.nameColor;
        return { ghost, pts: [{ pt: a, bx: a.x, by: a.y }, { pt: b, bx: b.x, by: b.y }] };
    }
    if (el instanceof PointElement) {
        const p = bare(el);
        p.vertexColor = el.vertexColor;
        p.nameColor = el.nameColor;
        if (el.name != null) p.name = el.name;
        return { ghost: p, pts: [{ pt: p, bx: p.x, by: p.y }] };
    }
    return null;   // circle / sector / other — deferred
}

type Bounds = { minX: number, maxX: number, minY: number, maxY: number };
type Side = "left" | "right" | "top" | "bottom";

// Resolve the elements a copy clones: "all" / missing → every named,
// visible, non-screen element; otherwise the explicit name list.
function resolveSources(slate: Slate, include: any): GeomElement[] {
    const sources: GeomElement[] = [];
    if (Array.isArray(include)) {
        for (const nm of include) {
            const e = slate.lookupElement(String(nm));
            if (e != null) sources.push(e);
        }
    } else {
        for (const e of slate.elements) {
            if (e.name != null && e.visible && !e.name.startsWith("screen")) {
                sources.push(e);
            }
        }
    }
    return sources;
}

// Snapshot the figure's current geometry into bare render-copies.
//
// Takes the slate purely so an unsupported element can be reported
// against it (#154). It used to latch a module-global boolean, which hid
// the 2nd..Nth distinct unsupported element even within one figure, and
// silenced the warning entirely for every later figure on the page.
function snapshotSources(sources: GeomElement[], slate: Slate): { ghosts: GeomElement[], pts: ClonePoint[] } {
    const ghosts: GeomElement[] = [];
    const pts: ClonePoint[] = [];
    for (const el of sources) {
        const snap = snapshotElement(el);
        if (snap == null) {
            slate.reportDiagnostic({
                code: "unsupported-element",
                key: String(el.name),
                message: "Group.cloneAside: skipping unsupported "
                    + "element type (" + el.name + ")",
                detail: { animation: "Group.cloneAside", elem: String(el.name) },
            });
            continue;
        }
        ghosts.push(snap.ghost);
        for (const p of snap.pts) pts.push(p);
    }
    return { ghosts, pts };
}

// Apply a { elem, to } slider vary, recomputing the figure. Returns a
// restore thunk (or null when the vary doesn't apply), so the caller can
// snapshot the varied figure and put the real slider back.
function applyVary(slate: Slate, vary: any): (() => void) | null {
    if (!vary || vary.elem == null || typeof vary.to !== "number") return null;
    const s = slate.lookupElement(String(vary.elem));
    if (!(s instanceof LineSlider)) return null;
    const sx = s.x, sy = s.y, sz = s.z;
    const A = (s as any)._A as PointElement;
    const B = (s as any)._B as PointElement;
    s.x = A.x + (B.x - A.x) * vary.to;
    s.y = A.y + (B.y - A.y) * vary.to;
    s.z = A.z + (B.z - A.z) * vary.to;
    slate.update();
    return () => { s.x = sx; s.y = sy; s.z = sz; slate.update(); };
}

function boundsOf(pts: ClonePoint[]): Bounds {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const c of pts) {
        if (c.bx < minX) minX = c.bx; if (c.bx > maxX) maxX = c.bx;
        if (c.by < minY) minY = c.by; if (c.by > maxY) maxY = c.by;
    }
    return { minX, maxX, minY, maxY };
}

function sideFromSign(dx: number, dy: number): Side {
    if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? "left" : "right";
    return dy < 0 ? "top" : "bottom";
}


// A.Group.cloneAside — clone a sub-figure (a named set of elements, or
// "all") into displaced bare copies and slide them aside, where they
// PERSIST for the slide. Optionally vary a slider point per copy so each
// shows a different case (a trichotomy's three positions of D). The real
// figure never moves; only bare render-copies are added as ephemerals.
//
// args:
//   include       "all" (default) or an array of element names — what
//                 each copy clones.
//   vary?         { elem, to } — set a slider to parameter t (A + t·(B−A);
//                 infinite-slider t may be < 0) before snapshotting, so the
//                 copy shows the varied figure; the real slider is restored
//                 afterward. (Single-copy form.)
//   dx, dy        legacy explicit pixel offset for the single copy (no
//                 autoPlace). With autoPlace + no `variants`, only the SIGN
//                 is used, to pick the copy's preferred side.
//   autoPlace?    when true (#99): slide the whole visible figure to the
//                 canvas centre (a translate-only slate view offset — the
//                 real figure stays draggable), then lay the copies in the
//                 freed space around it. Each copy takes its preferred side
//                 (left/right/top/bottom), falling back to a free
//                 perpendicular side when its first choice can't fit. No
//                 scaling.
//   variants?     [{ vary?, prefer? }, …] — with autoPlace, the case copies
//                 to lay out ATOMICALLY: either every variant gets a slot
//                 (all placed), or if any can't fit anywhere free, NONE are
//                 placed and the figure doesn't move (both-or-neither).
//                 `prefer` is a side name; default by index (left, right,
//                 top, bottom). Direction is per-variant independent; only
//                 the place/no-place decision is collective.
//
// Lifecycle: copies are ephemerals this animation does NOT remove — they
// persist until the next slide advance clears them (SlateControls.showSlide
// wipes leftover ephemerals + the view offset on every transition).
//
// elementType is GeomElement: the entry's `elem` is a nominal anchor; the
// clone set comes from args.include.
export class GroupCloneAsideAnimation extends Animation {
    public animationMethod = AllAnimations.GROUP_CLONE_ASIDE;
    public name = "Group.cloneAside";
    public elementType = GeomElement;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        const include = args && args.include;
        const autoPlace = args && args.autoPlace === true;
        const sources = resolveSources(slate, include);
        return autoPlace
            ? [this._autoPlaceStep(target, slate, args, sources)]
            : [this._legacyStep(target, slate, args, sources)];
    }

    // Atomic centred layout (#99). Snapshot every variant, centre the
    // figure, assign each copy a free slot (preferred side → fallback);
    // commit all only if every variant fits, else place nothing.
    private _autoPlaceStep(target: GeomElement, slate: Slate, args: any,
                           sources: GeomElement[]): IAnimationStep {
        // Normalise to a variant list. No `variants` → a single copy whose
        // preferred side comes from the dx/dy sign (so the old single-copy
        // autoPlace call still works).
        const dx = args && typeof args.dx === "number" ? args.dx : 0;
        const dy = args && typeof args.dy === "number" ? args.dy : 0;
        const variants: any[] = Array.isArray(args && args.variants) && args.variants.length > 0
            ? args.variants
            : [{ vary: args && args.vary, prefer: sideFromSign(dx, dy) }];

        let targetOffX = 0, targetOffY = 0;
        // View offset already in effect at setup time — the presentation /
        // maximize base centring (#107). The centre phase eases from this
        // base to the target, so when the figure is ALREADY centred
        // (base == target) it's a no-op (no jump) and only the copies
        // slide; outside a maximized view base is 0 → centres as before.
        let baseOffX = 0, baseOffY = 0;
        let placed = false;
        // Per placed copy: its mutable points + the slot offset it slides to.
        let copies: { pts: ClonePoint[], edx: number, edy: number }[] = [];

        const drive = (p: number) => {
            if (!placed) return;
            const centreP = easeOut(Math.min(1, p / AUTOPLACE_CENTRE_FRAC));
            const splitP = Math.max(0, Math.min(1,
                (p - AUTOPLACE_CENTRE_FRAC) / (1 - AUTOPLACE_CENTRE_FRAC)));
            slate.setViewOffset(baseOffX + (targetOffX - baseOffX) * centreP,
                                baseOffY + (targetOffY - baseOffY) * centreP);
            for (const c of copies)
                for (const pt of c.pts) {
                    pt.pt.x = pt.bx + c.edx * splitP;
                    pt.pt.y = pt.by + c.edy * splitP;
                }
        };

        return {
            durationMs: CLONE_ASIDE_AUTOPLACE_MS,
            setup: () => {
                target.drawProgress = 1;
                target.visible = true;
                // Display px (#71): autoPlace runs only while presenting
                // (maximized ⇒ fit-scale 1), so this is the on-screen extent.
                const W = slate.displayWidth;
                const H = slate.displayHeight;
                if (!W || !H) return;

                // Snapshot each variant (vary → snapshot → restore).
                const snaps: { ghosts: GeomElement[], pts: ClonePoint[], bbox: Bounds, prefer?: Side }[] = [];
                for (const variant of variants) {
                    const restore = applyVary(slate, variant && variant.vary);
                    const snap = snapshotSources(sources, slate);
                    if (restore) restore();
                    if (snap.pts.length === 0) continue;
                    snaps.push({
                        ghosts: snap.ghosts, pts: snap.pts,
                        bbox: boundsOf(snap.pts),
                        prefer: variant && variant.prefer,
                    });
                }
                if (snaps.length === 0) return;

                // Capture the base offset (a maximized/presentation centring,
                // #107) so the centre phase eases from it instead of 0.
                baseOffX = slate.viewOffsetX;
                baseOffY = slate.viewOffsetY;

                // Centre target from the real (restored) figure. Read the
                // box the #107 base-centring was computed from so this lands
                // exactly where the figure already sits (no shift when
                // already centred). #138 — that is now the captured
                // painting-elements box; fall back to figureBounds() when
                // nothing captured it (not maximized / no presentation).
                const fb = slate.centringBounds != null
                    ? slate.centringBounds : slate.figureBounds();
                if (fb == null) return;
                const figW = fb.maxX - fb.minX, figH = fb.maxY - fb.minY;
                const figCx = (fb.minX + fb.maxX) / 2;
                const figCy = (fb.minY + fb.maxY) / 2;
                targetOffX = W / 2 - figCx;
                targetOffY = H / 2 - figCy;

                const M = AUTOPLACE_MARGIN, G = AUTOPLACE_GAP;
                // The slot offset that drops a copy (bbox bb) centred in the
                // freed band on `side`, cross-aligned with the centred
                // figure — or null when it doesn't fit. (display = model +
                // view offset, so edx = bandCentre − targetOff − copyCentre.)
                const slotFor = (side: Side, bb: Bounds): [number, number] | null => {
                    const bw = bb.maxX - bb.minX, bh = bb.maxY - bb.minY;
                    const ccx = (bb.minX + bb.maxX) / 2, ccy = (bb.minY + bb.maxY) / 2;
                    if (side === "left" || side === "right") {
                        if (bh > H - 2 * M) return null;
                        const inner = side === "left" ? W / 2 - figW / 2 - G : W / 2 + figW / 2 + G;
                        const outer = side === "left" ? M : W - M;
                        if (Math.abs(outer - inner) < bw) return null;
                        return [(inner + outer) / 2 - targetOffX - ccx, figCy - ccy];
                    }
                    if (bw > W - 2 * M) return null;
                    const inner = side === "top" ? H / 2 - figH / 2 - G : H / 2 + figH / 2 + G;
                    const outer = side === "top" ? M : H - M;
                    if (Math.abs(outer - inner) < bh) return null;
                    return [figCx - ccx, (inner + outer) / 2 - targetOffY - ccy];
                };

                // Assign each variant a free slot: preferred side first,
                // then any other free side. ATOMIC — if any variant can't be
                // placed, none are (both-or-neither).
                const DEFAULT: Side[] = ["left", "right", "top", "bottom"];
                const taken = new Set<Side>();
                const assigned: { pts: ClonePoint[], edx: number, edy: number }[] = [];
                for (let i = 0; i < snaps.length; i++) {
                    const s = snaps[i];
                    const prefer = s.prefer || DEFAULT[i % DEFAULT.length];
                    const order: Side[] = [prefer].concat(DEFAULT.filter(x => x !== prefer));
                    let slot: [number, number] | null = null;
                    for (const side of order) {
                        if (taken.has(side)) continue;
                        slot = slotFor(side, s.bbox);
                        if (slot != null) { taken.add(side); break; }
                    }
                    if (slot == null) return;   // no free slot — abort, place nothing
                    assigned.push({ pts: s.pts, edx: slot[0], edy: slot[1] });
                }

                // Commit every copy.
                for (const s of snaps) for (const g of s.ghosts) slate.addEphemeral(g);
                copies = assigned;
                placed = true;
            },
            tick: (p) => { drive(p); },
            finalise: () => { drive(1); },
        };
    }

    // Legacy explicit-offset single copy (≤ 0.9.x behaviour, unchanged):
    // clone once, clamp the requested dx/dy into the canvas, only show the
    // copy if it clears the figure; skip on a narrow viewport.
    private _legacyStep(target: GeomElement, slate: Slate, args: any,
                        sources: GeomElement[]): IAnimationStep {
        const dx = args && typeof args.dx === "number" ? args.dx : 0;
        const dy = args && typeof args.dy === "number" ? args.dy : 0;
        const vary = args && args.vary;
        const durationMs = Math.max(CLONE_ASIDE_MIN_MS,
            Math.hypot(dx, dy) / CLONE_ASIDE_RATE_PX_PER_MS);

        let cloned: ClonePoint[] = [];
        let edx = dx, edy = dy;
        let placed = false;
        const slideCopy = (p: number) => {
            for (const c of cloned) {
                c.pt.x = c.bx + edx * p;
                c.pt.y = c.by + edy * p;
            }
        };

        return {
            durationMs,
            setup: () => {
                target.drawProgress = 1;
                target.visible = true;
                const restore = applyVary(slate, vary);
                const snap = snapshotSources(sources, slate);
                if (restore) restore();
                const temp = snap.ghosts;
                const pts = snap.pts;
                if (temp.length === 0) return;

                const bb = boundsOf(pts);
                const bw = bb.maxX - bb.minX, bh = bb.maxY - bb.minY;
                // Display px (#71): autoPlace runs only while presenting
                // (maximized ⇒ fit-scale 1), so this is the on-screen extent.
                const W = slate.displayWidth;
                const H = slate.displayHeight;
                const MARGIN = 6;
                if (W && W < CLONE_ASIDE_DESKTOP_MIN_WIDTH) return;
                edx = dx; edy = dy;
                if (W && H) {
                    if (bb.minX + edx < MARGIN) edx = MARGIN - bb.minX;
                    if (bb.maxX + edx > W - MARGIN) edx = (W - MARGIN) - bb.maxX;
                    if (bb.minY + edy < MARGIN) edy = MARGIN - bb.minY;
                    if (bb.maxY + edy > H - MARGIN) edy = (H - MARGIN) - bb.maxY;
                }
                const CLEAR_GAP = 8;
                const clears = Math.abs(edx) >= bw + CLEAR_GAP
                    || Math.abs(edy) >= bh + CLEAR_GAP
                    || (bw === 0 && bh === 0);
                if (!clears) return;

                for (const g of temp) slate.addEphemeral(g);
                cloned = pts;
                placed = true;
            },
            tick: (p) => { if (placed) slideCopy(p); },
            finalise: () => { if (placed) slideCopy(1); },
        };
    }
}

registerAnimation(new GroupCloneAsideAnimation());
