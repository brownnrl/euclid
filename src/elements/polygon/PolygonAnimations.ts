// Animations targeting PolygonElement. See ../Animations.ts for the
// abstract base + registry mechanics.

import {Animation, AllAnimations, IAnimationStep, registerAnimation} from "../Animations";
import {GeomElement} from "../GeomElement";
import {Slate} from "../../Slate";
import {PolygonElement} from "./PolygonElement";

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
        // Fill ~twice as fast as the outline, capped at the
        // class-level default so a giant polygon doesn't yield a
        // glacial fade.
        const fillMs = Math.min(outlineMs / 2, this.defaultDurationMs);
        return [
            // Step 1 — outline trace.
            {
                durationMs: outlineMs,
                setup: () => {
                    poly.drawProgress = 0;
                    poly.faceAlpha = 0;   // hide fill until step 2
                },
                tick: (progress) => { poly.drawProgress = progress; },
                finalise: () => { poly.drawProgress = 1; },
            },
            // Step 2 — face fade-in over the already-traced outline.
            {
                durationMs: fillMs,
                tick: (progress) => { poly.faceAlpha = progress; },
                finalise: () => {
                    poly.faceAlpha = 1;
                    poly.drawProgress = 1;
                    poly.visible = true;
                },
            },
        ];
    }
}

registerAnimation(new PolygonOutlineAnimation());
registerAnimation(new PolygonOutlineAndFillAnimation());
