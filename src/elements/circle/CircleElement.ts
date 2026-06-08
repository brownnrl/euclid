/*----------------------------------------------------------------------+
|    Title:	CircleElement.ts                                            |
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
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "../point/PointElement";
import {SlateCanvas} from "../../Slate";


export interface ICircleElementConstruction {
    C : PointElement; // center of the circle
    B : PointElement; // point defining one end of the radius segment
    A? : PointElement; // point defining the other end of the radius segment
                       // (defaults to C — so radius = C.distance(B) in the 2-point form,
                       // or A.distance(B) in the 3-point form where A ≠ C)
    AP : PlaneElement;
}

export class CircleElement extends GeomElement {

    public Center : PointElement;
    public A : PointElement;
    public B : PointElement;
    public AP : PlaneElement;

    constructor(ice? : ICircleElementConstruction) {
        super();
        this.dimension = 2;
        if(ice == null) return;
        this.Center = ice.C;
        this.A = ice.A != null ? ice.A : this.Center;
        this.B = ice.B;
        this.AP = ice.AP;
    }

    get radius() {
        return this.A.distance(this.B);
    }

    get radius2() {
        return this.A.distance2(this.B);
    }

    public defined() : boolean {
        return true;
        //return this.Center.defined() && this.A.defined()
        //    && this.B.defined() && this.AP.defined();
    }


    // drawEllipse and fillEllipse not necessary as they are provided
    // in the canvas api.

    private _drawCircle(ctx : CanvasRenderingContext2D) : void {
        ctx.beginPath();
        let r2 : number = this.radius2;
        let r : number = Math.sqrt(r2);
        let amp2 : number = this.AP.S.z*this.AP.S.z + this.AP.T.z*this.AP.T.z;
        if (Math.abs(amp2) < 0.01) { // the circle is flat
            ctx.ellipse(
                this.Center.x,
                this.Center.y,
                r,
                r,
                0,
                0,
                2*Math.PI);
            return;
        }
        let h : number = r/Math.sqrt(amp2);
        // determine major and minor radius vectors (a,b) and (c,d)
        let rcos :number = h*this.AP.T.z;
        let rsin :number = -h*this.AP.S.z;
        let majorx :number = rcos*this.AP.S.x + rsin*this.AP.T.x;
        let majory :number = rcos*this.AP.S.y + rsin*this.AP.T.y;
        let factor :number = (amp2 < 1.0)? Math.sqrt(1.0-amp2) : 0.0;
        let minorx :number = -factor*majory;
        let minory :number = factor*majorx;
        let majorR : number = Math.sqrt(majorx*majorx + majory*majory);
        let minorR : number = Math.sqrt(minorx*minorx + minory*minory);
        // Degenerate case: ellipse is so thin it looks like a line.
        // (minorR <= majorR always since minorR = factor * majorR with
        // factor in [0,1], so we only need to check minorR.)
        if (minorR < 0.5) {
            ctx.moveTo(this.Center.x - majorx, this.Center.y - majory);
            ctx.lineTo(this.Center.x + majorx, this.Center.y + majory);
            return;
        }
        // Rotation angle of the major axis
        let rotation : number = Math.atan2(majory, majorx);
        ctx.ellipse(
            this.Center.x,
            this.Center.y,
            majorR,
            minorR,
            rotation,
            0,
            2*Math.PI);
    }

    public drawEdge(c: SlateCanvas): void {
        if (this.edgeColor == null || !this.defined()) return;
        let ctx = c.getContext("2d") as CanvasRenderingContext2D;
        ctx.strokeStyle = this.shouldHighlight
            ? this.edgeHighlightColor
            : this.edgeColor;
        // Match LineElement: bump line weight when highlighted; always
        // assign explicitly so a previous element's value doesn't leak.
        ctx.lineWidth = this.shouldHighlight ? 3 : 1;
        this._drawCircle(ctx);
        ctx.stroke();
    }

    public drawFace(c: SlateCanvas): void {
        if (this.faceColor == null || !this.defined()) return;
        let ctx = c.getContext("2d") as CanvasRenderingContext2D;
        ctx.fillStyle = this.faceColor;
        this._drawCircle(ctx);
        ctx.fill();
    }

    public drawName(c: SlateCanvas): void {
        if (this.nameColor != null && this.name != null) {
            let ctx = c.getContext("2d") as CanvasRenderingContext2D;
            ctx.strokeStyle = this.nameColor;
            ctx.font = GeomElement._font;
            let [w, h] = this._getTextMetrics(ctx, this.name);
            ctx.fillText(this._name, this.Center.x - w/2, this.Center.y - h/2);
        }
    }

    public drawVertex(c: SlateCanvas): void {
    }

    public rotate(pivot: PointElement, ac: number, as: number): void {
    }

    public translate(dx: number, dy: number): void {
    }

    public update(): void {
    }

}
