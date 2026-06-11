// Animations targeting PolygonElement. See ../Animations.ts for the
// abstract base + registry mechanics.

import {Animation, AllAnimations, IAnimationStep, registerAnimation} from "../Animations";
import {GeomElement} from "../GeomElement";
import {Slate} from "../../Slate";
import {PolygonElement} from "./PolygonElement";
import {PointElement} from "../point/PointElement";

// Default per-edge trace rate matches LineAnimations so a polygon's
// edges feel like the same instrument tracing each side in turn.
const DEFAULT_POLYGON_EDGE_RATE_PX_PER_MS = 0.25;
const DEFAULT_POLYGON_FILL_MS = 500;

// Total perimeter (closed if V.length > 2, otherwise open) — used to
// compute the outline duration from edge rate.
function perimeter(poly: PolygonElement): number {
    const n = poly.V.length;
    if (n < 2) return 0;
    let total = 0;
    const closed = n > 2;
    const edgeCount = closed ? n : n - 1;
    for (let i = 0; i < edgeCount; i++) {
        const a = poly.V[i];
        const b = poly.V[(i + 1) % n];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        total += Math.sqrt(dx * dx + dy * dy);
    }
    return total;
}

// A.Polygon.outline — cascade-trace each edge in V[] order.
// PolygonElement.drawEdge already partitions drawProgress over edges
// so a single step driving drawProgress 0 → 1 traces every edge in
// sequence with the right per-edge proportion.
export class PolygonOutlineAnimation extends Animation {
    public animationMethod = AllAnimations.POLYGON_OUTLINE;
    public name = "Polygon.outline";
    public elementType = PolygonElement;
    public defaultRate = DEFAULT_POLYGON_EDGE_RATE_PX_PER_MS;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        const poly = target as PolygonElement;
        const durationMs = Math.max(180, perimeter(poly) / this.defaultRate);
        return [{
            durationMs,
            tick: (progress) => { poly.drawProgress = progress; },
            finalise: () => {
                poly.drawProgress = 1;
                poly.visible = true;
            },
        }];
    }
}

// A.Polygon.outlineAndFill — strict sequence: outline-trace step
// completes first, then a separate fill-fade step. PolygonElement
// now has two independent fields driving this — drawProgress for the
// edge trace (consumed by drawEdge) and faceAlpha for the fill
// (consumed by drawFace). The outline step finalises drawProgress to
// 1 (full edges) before the fill step starts ticking faceAlpha
// 0 → 1; the edges remain stable at full while the face fades in.
//
// The fade duration is intentionally shorter than the outline trace
// — the eye has already absorbed the polygon's shape from the trace,
// so the fill should land quickly. v1: half the outline's runtime,
// capped by defaultDurationMs.
export class PolygonOutlineAndFillAnimation extends Animation {
    public animationMethod = AllAnimations.POLYGON_OUTLINE_AND_FILL;
    public name = "Polygon.outlineAndFill";
    public elementType = PolygonElement;
    public defaultRate = DEFAULT_POLYGON_EDGE_RATE_PX_PER_MS;
    public defaultDurationMs = DEFAULT_POLYGON_FILL_MS;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        const poly = target as PolygonElement;
        const outlineMs = Math.max(180, perimeter(poly) / this.defaultRate);
        const fullRestore = () => {
            poly.faceAlpha = 1;
            poly.drawProgress = 1;
            poly.visible = true;
        };
        // Step 1 — outline trace.
        const outline: IAnimationStep = {
            durationMs: outlineMs,
            setup: () => {
                poly.drawProgress = 0;
                poly.faceAlpha = 0;   // hide fill until step 2
            },
            tick: (progress) => { poly.drawProgress = progress; },
            finalise: () => { poly.drawProgress = 1; },
        };
        // A face-less polygon has nothing to fade — scheduling the
        // fill step anyway would be pure dead time in the middle of
        // a cascade (#81). Run the outline alone, with its finalise
        // doing the full restore.
        if (poly.faceColor == null) {
            outline.finalise = fullRestore;
            return [outline];
        }
        // Fill ~twice as fast as the outline, capped at the
        // class-level default so a giant polygon doesn't yield a
        // glacial fade.
        const fillMs = Math.min(outlineMs / 2, this.defaultDurationMs);
        return [
            outline,
            // Step 2 — face fade-in over the already-traced outline.
            {
                durationMs: fillMs,
                tick: (progress) => { poly.faceAlpha = progress; },
                finalise: fullRestore,
            },
        ];
    }
}

// A.Polygon.superpose — Euclid's superposition (I.4): an ephemeral
// gold-outline ghost copy of the target lifts off, translates so its
// vertex 0 lands on the `onto` polygon's vertex 0, rotates about the
// landing point to lay side 0→1 onto the target side 0→1 (carrying
// the remaining vertices with it), holds a beat coinciding, then
// retraces both motions home. The real polygon never moves — the
// ephemeral system owns the moving copy and its cleanup.
//
// Args: { onto: string } — the polygon to superpose onto. Must
// resolve to a PolygonElement with the same vertex count; anything
// else warns and falls through to an instant no-op.
const SUPERPOSE_TRANSLATE_RATE_PX_PER_MS = 0.25;
const SUPERPOSE_ROTATE_RATE_RAD_PER_MS = 0.003;
const SUPERPOSE_MIN_STEP_MS = 250;
const SUPERPOSE_HOLD_MS = 800;
const GHOST_COLOR = "#FFD700";

export class PolygonSuperposeAnimation extends Animation {
    public animationMethod = AllAnimations.POLYGON_SUPERPOSE;
    public name = "Polygon.superpose";
    public elementType = PolygonElement;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        const poly = target as PolygonElement;
        const ontoName = args && args.onto;
        const onto = ontoName != null ? slate.lookupElement(String(ontoName)) : null;
        if (!(onto instanceof PolygonElement) || onto.V.length !== poly.V.length) {
            if (typeof console !== "undefined" && console.warn) {
                console.warn("[geomlib] Polygon.superpose: args.onto ('"
                    + ontoName + "') is not a polygon with "
                    + poly.V.length + " vertices — skipping");
            }
            return [{
                durationMs: 0,
                tick: () => {},
                finalise: () => {
                    poly.drawProgress = 1;
                    poly.visible = true;
                },
            }];
        }

        // Source coordinates are captured at setup time (not build
        // time) so the ghost reflects any drags that happened between
        // slide construction and this step actually starting.
        const n = poly.V.length;
        let src: Array<{x: number, y: number}> = [];
        let dx = 0, dy = 0;         // translate delta: V[0] → onto.V[0]
        let theta = 0;              // rotation about the landing point
        const ghostPts: PointElement[] = [];
        const ghost = new PolygonElement();
        ghost.edgeColor = GHOST_COLOR;
        ghost.faceColor = null;
        ghost.nameColor = null;
        ghost.vertexColor = null;

        const setGhost = (coords: Array<{x: number, y: number}>) => {
            for (let i = 0; i < n; i++) {
                ghostPts[i].x = coords[i].x;
                ghostPts[i].y = coords[i].y;
            }
        };
        const translated = (t: number) =>
            src.map(p => ({ x: p.x + dx * t, y: p.y + dy * t }));
        // Rotate the fully-translated coords about the landing point
        // (onto.V[0]) by angle · t.
        const rotated = (t: number) => {
            const cx = onto.V[0].x, cy = onto.V[0].y;
            const cos = Math.cos(theta * t), sin = Math.sin(theta * t);
            return translated(1).map(p => ({
                x: cx + (p.x - cx) * cos - (p.y - cy) * sin,
                y: cy + (p.x - cx) * sin + (p.y - cy) * cos,
            }));
        };

        // Durations are estimated from build-time geometry; the exact
        // path re-derives from setup-time coords so a stale estimate
        // only affects pacing, never correctness.
        const estDist = Math.hypot(onto.V[0].x - poly.V[0].x, onto.V[0].y - poly.V[0].y);
        const translateMs = Math.max(SUPERPOSE_MIN_STEP_MS,
            estDist / SUPERPOSE_TRANSLATE_RATE_PX_PER_MS);
        const estTheta = Math.abs(this._sideAngleDelta(poly, onto));
        const rotateMs = Math.max(SUPERPOSE_MIN_STEP_MS,
            estTheta / SUPERPOSE_ROTATE_RATE_RAD_PER_MS);

        return [
            // ① glide: vertex 0 travels to onto's vertex 0.
            {
                durationMs: translateMs,
                setup: () => {
                    // Superpose is not a reveal — the real polygon is
                    // already on stage and must stay fully drawn while
                    // its ghost travels. Undo the animator's reveal-
                    // convention pre-zeroing.
                    poly.drawProgress = 1;
                    poly.visible = true;
                    src = poly.V.map(p => ({ x: p.x, y: p.y }));
                    dx = onto.V[0].x - src[0].x;
                    dy = onto.V[0].y - src[0].y;
                    theta = this._sideAngleDelta(poly, onto);
                    for (let i = 0; i < n; i++) {
                        const gp = new PointElement();
                        gp.x = src[i].x;
                        gp.y = src[i].y;
                        ghostPts.push(gp);
                        ghost.V.push(gp);
                    }
                    slate.addEphemeral(ghost);
                },
                tick: (p) => { setGhost(translated(p)); },
                finalise: () => { setGhost(translated(1)); },
            },
            // ② rotate about the landing point: side 0→1 lays onto
            // the target's side 0→1.
            {
                durationMs: rotateMs,
                tick: (p) => { setGhost(rotated(p)); },
                finalise: () => { setGhost(rotated(1)); },
            },
            // ③ hold, coinciding.
            {
                durationMs: SUPERPOSE_HOLD_MS,
                tick: () => {},
                finalise: () => {},
            },
            // ④ rotate home.
            {
                durationMs: rotateMs,
                tick: (p) => { setGhost(rotated(1 - p)); },
                finalise: () => { setGhost(translated(1)); },
            },
            // ⑤ glide home; the ghost's work is done.
            {
                durationMs: translateMs,
                tick: (p) => { setGhost(translated(1 - p)); },
                finalise: () => {
                    slate.removeEphemeral(ghost);
                    poly.drawProgress = 1;
                    poly.visible = true;
                },
            },
        ];
    }

    // Angle that carries the source side V[0]→V[1] onto the target
    // side, normalized to [-π, π] so the ghost takes the short way.
    private _sideAngleDelta(from: PolygonElement, onto: PolygonElement): number {
        const a = Math.atan2(from.V[1].y - from.V[0].y, from.V[1].x - from.V[0].x);
        const b = Math.atan2(onto.V[1].y - onto.V[0].y, onto.V[1].x - onto.V[0].x);
        let d = b - a;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        return d;
    }
}

registerAnimation(new PolygonOutlineAnimation());
registerAnimation(new PolygonOutlineAndFillAnimation());
registerAnimation(new PolygonSuperposeAnimation());
