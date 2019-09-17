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
    B : PointElement; // point on the circle
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
        this.A = this.Center;
        this.B = ice.B;
        this.AP = ice.AP;
    }

    public toString() : string {
        return `[${this._name} (${this.Center}, ${this.A} ${this.B})]`;
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

    public drawEdge(c: SlateCanvas): void {
        if (this.edgeColor!=null  && this.defined()) {
            let ctx = c.getContext("2d");
            ctx.strokeStyle = this.edgeColor;
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
                ctx.stroke();
                console.log("drawing circle if");
                return;
            }
            let h : number = r/Math.sqrt(amp2);
            // determine major and minor radius vectors
            let rcos :number = h*this.AP.T.z;
            let rsin :number = -h*this.AP.S.z;
            let majorx :number = rcos*this.AP.S.x + rsin*this.AP.T.x;
            let majory :number = rcos*this.AP.S.y + rsin*this.AP.T.y;
            let factor :number = (amp2 < 1.0)? Math.sqrt(1.0-amp2) : 0.0;
            let minorx :number = -factor*majory;
            let minory :number = factor*majorx;
            let zeroPoint : PointElement = new PointElement({x:0,y:0})
            let majorR : number = (new PointElement({x:majorx, y:majory})).distance(zeroPoint);
            let minorR : number = (new PointElement({x:minorx, y:minory})).distance(zeroPoint);
            ctx.ellipse(
                this.Center.x,
                this.Center.y,
                majorR,
                minorR,
                0,
                0,
                2*Math.PI);
            ctx.stroke();
            console.log("drawing circle else");
        }
    }

    public drawFace(c: SlateCanvas): void {
    }

    public drawName(c: SlateCanvas): void {
        if (this.nameColor != null && this.name != null) {
            let ctx = c.getContext("2d");
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
