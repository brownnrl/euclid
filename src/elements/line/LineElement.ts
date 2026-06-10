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
        // Stroke weight scales smoothly. Baseline is 1 (normal) or 3
        // (slide-highlight); emphasisAmount interpolates up to 6 for
        // full emphasis. emphasisAmount = 0 → baseline; 1 → 6 px;
        // animator fades 1 → 0 over ~250 ms at the end of a transition
        // so the post-animation settle isn't a hard pop.
        const baseW = this.shouldHighlight ? 3 : 1;
        ctx.lineWidth = baseW + this.emphasisAmount * (6 - baseW);
        // Slide-transition animation: drawProgress < 1 traces only the
        // first `progress` fraction of the line A → B. Default 1 keeps
        // the full-line behaviour every existing consumer relies on.
        let p = this.drawProgress;
        let endX = this._A.x + (this._B.x - this._A.x) * p;
        let endY = this._A.y + (this._B.y - this._A.y) * p;
        ctx.beginPath();
        ctx.moveTo(this._A.x, this._A.y);
        ctx.lineTo(endX, endY);
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
