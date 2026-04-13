/*----------------------------------------------------------------------+
|    Title:	SphereElement.ts                                              |
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
|    TypeScript Port: 2024, Nelson Brown, brownnrl@gmail.com            |
+----------------------------------------------------------------------*/


import {GeomElement, Align} from "../GeomElement"
import {SlateCanvas} from "../../Slate";
import {PointElement} from "../point/PointElement";
import {PlaneElement} from "../plane/PlaneElement";

export interface ISphereElementConstruction {
    Center? : PointElement;
    A? : PointElement; // radius is AB
    B? : PointElement; // A assumed to be Center unless provided
}

export class SphereElement extends GeomElement {

    protected _Center : PointElement;
    protected _A : PointElement; // radius is AB
    protected _B : PointElement;

    get Center() : PointElement { return this._Center; }

    constructor(ip? : ISphereElementConstruction) {
        super();
        this.dimension = 2;
        this._Center = ip && ip.Center || new PointElement();
        this._A = ip && ip.A || this._Center;
        this._B = ip && ip.B || new PointElement();
    }

    public drawName(c: SlateCanvas) : void {
        if(this.nameColor != null && this.name != null && this.defined()) {
            this.drawString(Math.round(this._Center.x), Math.round(this._Center.y), c, Align.CENTRAL);
        }
    }

    public defined() : boolean {
        return true;
    }

    public drawEdge(c: SlateCanvas) : void {
        if (this.edgeColor == null || !this.defined()) return;
        let ctx = c.getContext("2d") as CanvasRenderingContext2D;
        ctx.save();
        ctx.strokeStyle = this.edgeColor;
        let r = this.radius();
        let d = Math.round(2*r);
        ctx.beginPath();
        ctx.ellipse(
            this._Center.x-r,
            this._Center.y-r,
            d,
            d,
            0,
            0,
            2*Math.PI);
        ctx.stroke();
        ctx.restore();
    }

    public drawFace(c: SlateCanvas) : void {
        if (this.faceColor == null || !this.defined()) return;
        let ctx = c.getContext("2d") as CanvasRenderingContext2D;
        ctx.save();
        ctx.fillStyle = this.faceColor;
        let r = this.radius();
        let d = Math.round(2*r);
        ctx.beginPath();
        ctx.ellipse(
            this._Center.x-r,
            this._Center.y-r,
            d,
            d,
            0,
            0,
            2*Math.PI);
        ctx.fill();
        ctx.restore();
    }

    public radius() : number { return this._A.distance(this._B); }
    public radius2() : number { return this._A.distance2(this._B); }

    public drawVertex() {}
    public update(): void {}
    public translate(dx: number, dy: number): void {}
    public rotate(pivot: PointElement, ac: number, as : number, plane?: PlaneElement) : void {
    }

}
