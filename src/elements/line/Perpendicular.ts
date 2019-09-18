/*----------------------------------------------------------------------+
|    Title:	Perpendicular.ts                                            |
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


import {PointElement} from "../point/PointElement";
import {SlateCanvas} from "../../Slate";
import {LineElement} from "./LineElement";
import {PlaneElement} from "../plane/PlaneElement";

interface IPerpendicularElementConstructor {
    A : PointElement;
    B : PointElement;
}

export class Perpendicular extends LineElement {
    // draw perpendicular to CD in the plane P.  A is the proj of
    // C onto P, while AB is perpendicular to CD and equals EF.

    protected _C : PointElement;
    protected _D : PointElement;
    protected _E : PointElement;
    protected _F : PointElement;
    protected _P : PlaneElement;

    // TODO: Pick it up from here.
    constructor(ile?: IPerpendicularElementConstructor) {
        super();
        this.dimension = 1;
        this._A = ile && ile.A || null;
        this._B = ile && ile.B || null;
    }

    public drawEdge(c: HTMLCanvasElement, color?: string): void {
        if (color == null) {
            if (this.shouldHighlight) {
                color = this.edgeHighlightColor;
            } else {
                color = this.edgeColor;
            }
        }

        let ctx = c.getContext("2d");
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(this._A.x, this._A.y);
        ctx.lineTo(this._B.x, this._B.y);
        ctx.stroke();
    }

    public drawFace(c: SlateCanvas): void {
    }

    public drawName(c: SlateCanvas): void {
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
