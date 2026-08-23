// Animations targeting PolygonElement. See ../Animations.ts for the
// abstract base + registry mechanics.

import {Animation, AllAnimations, IAnimationStep, registerAnimation} from "../Animations";
import {GeomElement} from "../GeomElement";
import {Slate} from "../../Slate";
import {PolygonElement} from "./PolygonElement";
import {PointElement} from "../point/PointElement";
import {CircleElement} from "../circle/CircleElement";

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
            slate.reportDiagnostic({
                code: "bad-animation-args",
                key: "Polygon.superpose|" + String(poly.name) + "|" + String(ontoName),
                message: "Polygon.superpose: args.onto ('"
                    + ontoName + "') is not a polygon with "
                    + poly.V.length + " vertices — skipping",
                detail: { animation: "Polygon.superpose", elem: String(poly.name), onto: String(ontoName) },
            });
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

// A.Polygon.equilateralBuild — Euclid I.1: build the equilateral triangle
// on a base as a transitory compass walk. Two gold compass circles (centre
// V[0] through V[1], centre V[1] through V[0]) sweep out, then the triangle
// traces (and fills) — and the circles vanish, leaving just the triangle.
// The target is the declared `polygon;equilateralTriangle` (V[0]=A, V[1]=B,
// V[2]=apex); the circles are bare EPHEMERALS the animation owns and clears,
// so a deck calls one entry instead of declaring + sequencing the rig.
//
// Unlike A.Polygon.superpose (whose target is already on stage), this target
// is a DEFERRED REVEAL: it stays dark (drawProgress=0, faceAlpha=0) through
// the circle sweeps and only traces in on the outline step.
const EQUILATERAL_SWEEP_RATE_RAD_PER_MS = 0.0045;   // brisker than the lone compass

export class PolygonEquilateralBuildAnimation extends Animation {
    public animationMethod = AllAnimations.POLYGON_EQUILATERAL_BUILD;
    public name = "Polygon.equilateralBuild";
    public elementType = PolygonElement;
    public defaultRate = EQUILATERAL_SWEEP_RATE_RAD_PER_MS;
    public defaultDurationMs = DEFAULT_POLYGON_FILL_MS;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        const poly = target as PolygonElement;
        // Need a base (A, B) to centre the two compass circles on.
        if (poly.V.length < 2) {
            return [{ durationMs: 0, tick: () => {},
                finalise: () => { poly.drawProgress = 1; poly.faceAlpha = 1; poly.visible = true; } }];
        }
        const A = poly.V[0], B = poly.V[1];
        const plane = A.AP;
        const sweepMs = (2 * Math.PI) / this.defaultRate;
        // Bare ephemeral circles (no face — a compass walk is the arc only).
        // They paint gold via the highlight stroke because they're emphasised.
        const circAB = new CircleElement({ C: A, B: B, AP: plane });   // centre A through B
        const circBA = new CircleElement({ C: B, B: A, AP: plane });   // centre B through A
        for (const c of [circAB, circBA]) {
            c.edgeColor = null; c.faceColor = null; c.nameColor = null; c.vertexColor = null;
            c.emphasized = true;
        }
        const startAngle = (c: CircleElement) =>
            Math.atan2(c.B.y - c.Center.y, c.B.x - c.Center.x);
        const sweep = (c: CircleElement): IAnimationStep => ({
            durationMs: sweepMs,
            setup: () => { c.drawStartAngle = startAngle(c); c.drawProgress = 0; },
            tick: (p) => { c.drawProgress = p; },
            finalise: () => { c.drawProgress = 1; },
        });

        const outlineMs = Math.max(180, perimeter(poly) / DEFAULT_POLYGON_EDGE_RATE_PX_PER_MS);
        const clearCircles = () => { slate.removeEphemeral(circAB); slate.removeEphemeral(circBA); };
        const fullRestore = () => {
            poly.drawProgress = 1; poly.faceAlpha = 1; poly.visible = true;
            clearCircles();
        };

        // Step 1 — first compass circle; also creates + registers both ephemerals
        // and hides the polygon until its outline step.
        const first = sweep(circAB);
        const firstSetup = first.setup;
        first.setup = () => {
            poly.drawProgress = 0; poly.faceAlpha = 0;   // deferred reveal — stay dark
            slate.addEphemeral(circAB); slate.addEphemeral(circBA);
            // Both circles start un-drawn: a fresh CircleElement defaults to
            // drawProgress = 1, and ephemerals get no animator pre-zeroing, so
            // the second circle would otherwise flash full during the first sweep.
            circAB.drawProgress = 0; circBA.drawProgress = 0;
            if (firstSetup) firstSetup();
        };

        // Step N — outline trace. Reveals the triangle; clears the circles last
        // (after a faceless polygon, or before the fill step takes over).
        const outline: IAnimationStep = {
            durationMs: outlineMs,
            setup: () => { poly.drawProgress = 0; poly.faceAlpha = 0; },
            tick: (p) => { poly.drawProgress = p; },
            finalise: () => { poly.drawProgress = 1; },
        };
        if (poly.faceColor == null) {
            outline.finalise = fullRestore;
            return [first, sweep(circBA), outline];
        }
        const fillMs = Math.min(outlineMs / 2, this.defaultDurationMs);
        return [
            first,
            sweep(circBA),
            outline,
            // Final step — face fade-in; clears the circles as the triangle lands.
            { durationMs: fillMs, tick: (p) => { poly.faceAlpha = p; }, finalise: fullRestore },
        ];
    }
}

registerAnimation(new PolygonOutlineAnimation());
registerAnimation(new PolygonOutlineAndFillAnimation());
registerAnimation(new PolygonSuperposeAnimation());
registerAnimation(new PolygonEquilateralBuildAnimation());
