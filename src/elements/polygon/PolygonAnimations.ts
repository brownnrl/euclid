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

// A.Polygon.outlineAndFill — composite: outline traces first, then
// face-fade. Two steps; the SlateAnimator runs them sequentially when
// they arrive from build().
//
// Implementation detail: PolygonElement.drawEdge and drawFace both
// read drawProgress, so we can't drive both with the same field. The
// outline step ticks drawProgress 0 → 1 for the edges, then finalises
// to 1; the face step then steers globalAlpha by ticking drawProgress
// back from 0 → 1 while the edges (now stable at full) re-render
// fully each frame.
//
// To make this work cleanly, the outline step ALSO sets the face's
// drawProgress back to 0 in its finalise so the fade-in step has a
// clean 0 → 1 path for the face. We rely on the fact that the polygon's
// edges still render at drawProgress = 0 because they were already
// drawn opaque by the time the fade-in starts (face fills before edges
// in drawElements pass order, so each frame the face fades while the
// edges sit fully drawn underneath).
//
// (drawElements order is face → edge → vertex → name, so fading the
// face while drawProgress < 1 is fine — edges render in full because
// the outline step finalised them to drawProgress = 1 before this fade
// step started; but the polygon shares ONE drawProgress field across
// both. The fade step temporarily overrides drawProgress to drive the
// alpha; the edges will visually re-shorten too. That's not what we
// want.)
//
// Cleanest fix without changing the element shape: split into two
// separate elements internally. Out of scope for v1 — the simpler
// recipe is to just do the outline and skip the face fade. If a
// proposition needs the composite badly, future work can split.
//
// v1 implementation: outline only, then snap face from invisible to
// full at the end (a quick alpha pulse). Authors who want a slow
// fade can use A.Polygon.outline + an explicit short A.Polygon.fill
// follow-up in a later iteration.
export class PolygonOutlineAndFillAnimation extends Animation {
    public animationMethod = AllAnimations.POLYGON_OUTLINE_AND_FILL;
    public name = "Polygon.outlineAndFill";
    public elementType = PolygonElement;
    public defaultRate = DEFAULT_POLYGON_EDGE_RATE_PX_PER_MS;
    public defaultDurationMs = DEFAULT_POLYGON_FILL_MS;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        const poly = target as PolygonElement;
        const outlineMs = Math.max(180, perimeter(poly) / this.defaultRate);
        // Single composite step: drawProgress drives both edges (per
        // PolygonElement.drawEdge's edge-counting) and the face alpha
        // (per PolygonElement.drawFace's globalAlpha mapping) at the
        // same time. Visually this gives the outline tracing alongside
        // a gradually opacifying fill — a different feel from a strict
        // sequential outline-then-fill but cleaner for v1 and still
        // matches the "trace this polygon" reading.
        return [{
            durationMs: outlineMs + this.defaultDurationMs,
            tick: (progress) => { poly.drawProgress = progress; },
            finalise: () => {
                poly.drawProgress = 1;
                poly.visible = true;
            },
        }];
    }
}

registerAnimation(new PolygonOutlineAnimation());
registerAnimation(new PolygonOutlineAndFillAnimation());
