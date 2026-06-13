/*----------------------------------------------------------------------+
|    Title:	SectorElement.ts                                            |
|    A port of the software Geometry Applet by                          |
|    Author:    David E. Joyce                                          |
|        Department of Mathematics and Computer Science                 |
|        Clark University                                               |
|        Worcester, MA 01610-1477                                       |
|        U.S.A.                                                         |
|                                                                       |
|        http://aleph0.clarku.edu/~djoyce/home.html                     |
|        djoyce@clarku.edu                                              |
|                                                                       |
|    Date:    February, 1996.   Version 2.0.0 May, 1997.                |
|    TypeScript Port: 2019, Nelson Brown, brownnrl@gmail.com            |
|                           https://www.nelsonbrown.net/                |
+----------------------------------------------------------------------*/

import {GeomElement} from "../GeomElement";
import {PointElement} from "../point/PointElement";
import {PlaneElement} from "../plane/PlaneElement";
import {Midpoint} from "../point/Midpoint";
import {SlateCanvas} from "../../Slate";

export interface ISectorElementConstruction {
    O: PointElement;
    A: PointElement;
    B: PointElement;
    P: PlaneElement;
}

export class SectorElement extends GeomElement {

    _Center : PointElement;
    _A : PointElement;
    _B : PointElement;
    // A and B are two points on a circle with the given center

    _P : PlaneElement; // plane of the circle

    _angle : number = null;

    // Face fill alpha — drives drawFace's globalAlpha independent of
    // drawProgress (which drives the arc sweep). Default 1 keeps every
    // existing render path identical. Mirrors Circle/Polygon (#86).
    private _faceAlpha : number = 1;

    set faceAlpha(value: number) {
        this._faceAlpha = value < 0 ? 0 : (value > 1 ? 1 : value);
    }
    get faceAlpha(): number { return this._faceAlpha; }

    constructor(isec?: ISectorElementConstruction) {
        super();
        this.dimension = 2;
        if(isec != null) {
            this._Center = isec.O;
            this._A = isec.A;
            this._B = isec.B;
            this._P = isec.P;
        }
    }

    radius() : number {
        return this._Center.distance(this._A);
    }

    defined() {
        return this._A.defined() && this._B.defined() && this._Center.defined();
    }


    // Here, we differ from the original implementation.
    // Since A and B are on the circle, we find the midpoint M between them.
    // Then we calculate a radius distance along the line from Center M
    // as the "through" point.

    _updateThroughPoint() : void {
        let r = this.radius();
        if(r == 0) { // degenerate circle
            return;
        }
        this._angle = Math.atan2(this._B.y - this._A.y, this._B.x - this._A.x) -
            Math.atan2(this._Center.y - this._A.y, this._Center.x - this._A.x);
        let x = this._Center.x + Math.cos(this._angle/2) * r;
        let y = this._Center.y + Math.sin(this._angle/2) * r;
    }

    drawEdge(c: SlateCanvas): void {
        if (!this.visible) return;
        // Pick the highlight color BEFORE the null bail, matching the
        // other element types (#81 / #86) — a zero-color sector can
        // still render in the highlight stroke while emphasized or
        // slide-highlighted, which is what lets invisible angle
        // markers light up on demand.
        const color = (this.emphasized || this.shouldHighlight)
            ? this.edgeHighlightColor
            : this.edgeColor;
        if (color == null || !this.defined()) return;
        let ctx = c.getContext("2d") as CanvasRenderingContext2D;
        ctx.strokeStyle = color;
        {
            const baseW = this.shouldHighlight ? 3 : 1;
            ctx.lineWidth = baseW + this.emphasisAmount * (6 - baseW);
        }
        ctx.beginPath();
        let r = this.radius();
        let startAngle = Math.atan2(
            this._A.y - this._Center.y,
            this._A.x - this._Center.x);
        let arcAngle = this._arcAngle();
        // Partial sweep for slide-transition animation: the arc grows
        // from the A arm toward the B arm as drawProgress goes 0 → 1.
        // Default progress = 1 reproduces the full arc bit-for-bit.
        let endAngle = startAngle + arcAngle * this.drawProgress;
        ctx.arc(this._Center.x, this._Center.y, r, startAngle, endAngle, this._anticlockwise());
        ctx.stroke();
    }

    // The signed arc to sweep from the A arm to the B arm, in radians.
    // Default is the minor signed angle (−π..π). AngleMarkerElement
    // overrides this to optionally sweep the major (reflex) arc.
    protected _arcAngle(): number {
        return this._Center.angle(this._A, this._B, this._P);
    }

    // Sweep direction passed to ctx.arc. Fixed true for plain sectors /
    // arcs (their authors order _A/_B for that). AngleMarkerElement
    // flips it to draw the major arc between the same two rays for a
    // reflex marker.
    protected _anticlockwise(): boolean {
        return true;
    }

    // Magnitude of the swept arc — used by A.Sector.sweep to size the
    // animation duration to what's actually drawn (so a reflex marker
    // doesn't sweep a big arc in a tiny time).
    public arcSpan(): number {
        return Math.abs(this._arcAngle());
    }

    // Trace the closed wedge path (arc + the two radii back to centre)
    // into the current ctx path. Shared by the face fill and the flash
    // overlay so they cover exactly the same region.
    protected _traceWedge(ctx: CanvasRenderingContext2D, r: number): void {
        let startAngle = Math.atan2(
            this._A.y - this._Center.y,
            this._A.x - this._Center.x);
        let arcAngle = this._arcAngle();
        let endAngle = startAngle + arcAngle;
        ctx.beginPath();
        ctx.arc(this._Center.x, this._Center.y, r, startAngle, endAngle, this._anticlockwise());
        ctx.moveTo(this._Center.x, this._Center.y);
        if(arcAngle <= 180.) {
            ctx.lineTo(this._A.x, this._A.y);
            ctx.lineTo(this._B.x, this._B.y);
        } else {
            ctx.lineTo(this._B.x, this._B.y);
            ctx.lineTo(this._A.x, this._A.y);
        }
        ctx.lineTo(this._Center.x, this._Center.y);
    }

    // Whether the whole wedge should flash (fill with the highlight
    // color) while emphasised. False for plain sectors/arcs — only
    // angle markers light up their fill during a slide transition.
    protected _flashFace(): boolean {
        return false;
    }

    drawFace(c: SlateCanvas): void {
        if (!this.visible) return;
        if (this.faceColor == null || !this.defined()) return;
        // Face is independent of the edge sweep — always the full
        // sector wedge, with alpha driven by the dedicated faceAlpha
        // field (mirrors Circle/Polygon, #86). Default 1 preserves
        // the fully-opaque behaviour for every non-animating consumer.
        let a = this.faceAlpha;
        if (a <= 0) return;
        let ctx = c.getContext("2d") as CanvasRenderingContext2D;
        let r = this.radius();
        ctx.fillStyle = this.faceColor;
        this._traceWedge(ctx, r);
        if (a < 1) {
            ctx.save();
            ctx.globalAlpha = a;
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fill();
        }
        // Transition flash: while emphasised (the animator bumps
        // emphasisAmount to 1 during a sweep and fades it 1 → 0
        // afterward), light the ENTIRE wedge with the highlight color,
        // fading with the emphasis. Edge-only emphasis (stroke width /
        // gold) already happens in drawEdge; this fills the area too.
        if (this._flashFace() && this.emphasisAmount > 0) {
            ctx.save();
            ctx.fillStyle = this.faceHighlightColor;
            ctx.globalAlpha = 0.55 * this.emphasisAmount;
            this._traceWedge(ctx, r);
            ctx.fill();
            ctx.restore();
        }
    }

    drawName(c: SlateCanvas): void {
    }

    drawVertex(c: SlateCanvas): void {}

    rotate(pivot: PointElement, ac: number, as: number): void {}

    translate(dx: number, dy: number): void {}

    update(): void {
        this._updateThroughPoint();
    }

}
