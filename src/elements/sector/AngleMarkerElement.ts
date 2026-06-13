/*----------------------------------------------------------------------+
|    Title:	AngleMarkerElement.ts                                       |
|    Part of the geomlib port of David E. Joyce's Geometry Applet.       |
|    TypeScript: 2026, Nelson Brown, brownnrl@gmail.com                  |
+----------------------------------------------------------------------*/

import {SectorElement} from "./SectorElement";
import {PointElement} from "../point/PointElement";
import {PlaneElement} from "../plane/PlaneElement";

// A small sector drawn at a vertex to mark the interior angle between
// two arms. Unlike a plain `sector;sector` (whose radius is the
// vertex-to-arm distance, so it swings with arm length), an angle
// marker computes its OWN fixed radius — a sensible px default,
// clamped to a fraction of the shorter arm so it never overshoots.
// It also auto-orients to the interior arc, removing the per-marker
// arm-order sign-check the old midpoint-chain pattern needed (#91).
//
// The vertex (_Center) and the two arm points are real slate elements
// (drags follow them automatically). _A / _B are INTERNAL points,
// recomputed each update() at the marker radius along each arm — they
// are never registered on the slate. The inherited SectorElement
// drawEdge / drawFace then render the wedge, with drawProgress,
// emphasisAmount, and faceAlpha all working unchanged.
export const DEFAULT_ANGLE_MARKER_RADIUS_PX = 22;
export const ANGLE_MARKER_MAX_ARM_FRACTION = 0.45;
export const ANGLE_MARKER_RING_STEP = 9;

export class AngleMarkerElement extends SectorElement {

    private _arm1 : PointElement;
    private _arm2 : PointElement;
    private _radiusOverride : number;

    // Concentric-ring index for same-vertex markers. 0.8.1 will assign
    // this automatically so overlapping markers nest; for now it
    // defaults to 0 and can be set by hand. Each step bumps the radius
    // by ANGLE_MARKER_RING_STEP.
    public ringIndex : number = 0;

    // Draw the major (reflex, > 180°) arc instead of the interior
    // minor one. Default false — interior is the faithful Euclidean
    // case (his angles live in 0..180°). Set via the
    // `angleMarkerReflex` construction for the rare reflex marking
    // (e.g. a III.20-style central angle).
    public reflex : boolean = false;

    constructor(vertex: PointElement, arm1: PointElement, arm2: PointElement,
                plane: PlaneElement, radiusOverride?: number, reflex?: boolean) {
        super();
        this.dimension = 2;
        this._Center = vertex;
        this._arm1 = arm1;
        this._arm2 = arm2;
        this._P = plane;
        this._radiusOverride = radiusOverride != null ? radiusOverride : null;
        this.reflex = reflex === true;
        // Internal arc endpoints — placed in update().
        this._A = new PointElement();
        this._B = new PointElement();
    }

    // update() orders _A/_B so the inherited minor angle is negative
    // (interior, drawn with the default anticlockwise=true). A reflex
    // marker draws the MAJOR arc between the same two rays — same
    // endpoints, opposite side — which is the magnitude 2π−|minor| with
    // the anticlockwise flag flipped (see _anticlockwise).
    protected _arcAngle(): number {
        const minor = this._Center.angle(this._A, this._B, this._P);
        return this.reflex ? (2 * Math.PI - Math.abs(minor)) : minor;
    }

    protected _anticlockwise(): boolean {
        return !this.reflex;
    }

    // Angle markers flash their whole wedge during a transition (the
    // emphasis bump), not just the edge.
    protected _flashFace(): boolean {
        return true;
    }

    radius() : number {
        const a1 = this._Center.distance(this._arm1);
        const a2 = this._Center.distance(this._arm2);
        const shorter = Math.min(a1, a2);
        const base = this._radiusOverride != null
            ? this._radiusOverride
            : DEFAULT_ANGLE_MARKER_RADIUS_PX;
        const clamped = Math.min(base, shorter * ANGLE_MARKER_MAX_ARM_FRACTION);
        return clamped + this.ringIndex * ANGLE_MARKER_RING_STEP;
    }

    // Place an internal endpoint at distance r from the vertex along
    // the direction of `arm`.
    private _place(target: PointElement, arm: PointElement, r: number) : void {
        const dx = arm.x - this._Center.x;
        const dy = arm.y - this._Center.y;
        const dz = arm.z - this._Center.z;
        const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (len === 0) {
            target.x = this._Center.x;
            target.y = this._Center.y;
            target.z = this._Center.z;
            return;
        }
        target.x = this._Center.x + dx / len * r;
        target.y = this._Center.y + dy / len * r;
        target.z = this._Center.z + dz / len * r;
    }

    update() : void {
        const r = this.radius();
        this._place(this._A, this._arm1, r);
        this._place(this._B, this._arm2, r);
        // Auto-interior: PointElement.angle is signed (−π..π) and atan2
        // already returns the short way, so the magnitude is the
        // interior angle; only the rendered sweep direction matters.
        // The empirically-interior case (matching the old sign-checks)
        // is angle(_A, _B) < 0 — if it's positive, swap the arms.
        const ang = this._Center.angle(this._A, this._B, this._P);
        if (ang > 0) {
            this._place(this._A, this._arm2, r);
            this._place(this._B, this._arm1, r);
        }
    }
}
