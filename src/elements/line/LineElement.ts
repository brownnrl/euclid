/*----------------------------------------------------------------------+
|    Title:	LineElement.ts                                              |
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
import {GeomElement} from "../GeomElement";
import {SlateCanvas} from "../../Slate";

interface ILineElementConstructor {
    A : PointElement;
    B : PointElement;
}

export class LineElement extends GeomElement {
    protected _A : PointElement;

    get A() : PointElement { return this._A; }

    protected _B : PointElement;
    get B() : PointElement { return this._B; }

    constructor(ile?: ILineElementConstructor) {
        super();
        this.dimension = 1;
        this._A = ile && ile.A || null;
        this._B = ile && ile.B || null;
    }

    public drawEdge(c: HTMLCanvasElement, color?: string): void {
        if (!this.visible) return;
        if (color == null) {
            if (this.emphasized || this.shouldHighlight) {
                color = this.edgeHighlightColor;
            } else {
                color = this.edgeColor;
            }
        }

        if (color == null) return;

        let ctx = c.getContext("2d");
        ctx.strokeStyle = color;
        // Stroke weight scales with state: 1 normal, 3 slide-highlight,
        // 6 when emphasised (caption ref hover/click). Always assigned
        // explicitly so a leftover lineWidth doesn't carry into the
        // next element in drawElements' iteration.
        ctx.lineWidth = this.emphasized ? 6 : (this.shouldHighlight ? 3 : 1);
        ctx.beginPath();
        ctx.moveTo(this._A.x, this._A.y);
        ctx.lineTo(this._B.x, this._B.y);
        ctx.stroke();
    }

    public drawFace(c: SlateCanvas): void {
    }

    public drawName(c: SlateCanvas): void {
        if (!this.visible) return;
        if (this.nameColor == null || this.name == null) return;
        if (this._A == null || !this._A.defined()) return;
        if (this._B == null || !this._B.defined()) return;
        const ix = Math.round((this._A.x + this._B.x) / 2);
        const iy = Math.round((this._A.y + this._B.y) / 2);
        this.drawString(ix, iy, c);
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
