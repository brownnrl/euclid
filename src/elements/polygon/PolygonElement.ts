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

export class PolygonElement extends GeomElement {

    public V : PointElement[];

    // Face fill alpha — drives drawFace's globalAlpha independent of
    // drawProgress (which drives the edge trace). Lets an animation
    // run the outline to completion at drawProgress = 1 first, then
    // separately fade the fill in by ticking faceAlpha 0 → 1. Default
    // 1 means "fully opaque" — every existing render path behaves
    // identically.
    private _faceAlpha : number = 1;

    set faceAlpha(value: number) {
        this._faceAlpha = value < 0 ? 0 : (value > 1 ? 1 : value);
    }
    get faceAlpha(): number { return this._faceAlpha; }

    constructor(ps?: PointElement[]) {
        super();
        this.dimension = 2;
        if (ps == null) {
            this.V = [];
            return;
        }
        this.V = ps;
    }

    public area() : number {
        // Ported from PolygonElement.java area() — 2026-04-12
        // Compute the area of this polygon (assuming it's planar & convex).
        // Uses fan triangulation from V[0].
        let sum = 0.0;
        for (let i = 0; i < this.V.length - 2; ++i) {
            sum += PointElement.area(this.V[0], this.V[i + 1], this.V[i + 2]);
        }
        return sum;
    }

    public drawEdge(c: HTMLCanvasElement, color?: string): void {
        if (!this.visible && !this.shouldHighlight && this.emphasisAmount <= 0) return;
        if (color == null) {
            if (this.emphasized || this.shouldHighlight) {
                color = this.edgeHighlightColor;
            } else {
                color = this.edgeColor;
            }
        }

        if (color == null) return;
        if (this.V.length <= 1) return;

        let ctx = c.getContext("2d");
        ctx.beginPath();
        ctx.strokeStyle = color;
        {
            const baseW = this.shouldHighlight ? 3 : 1;
            ctx.lineWidth = baseW + this.emphasisAmount * (6 - baseW);
        }
        // Edge enumeration: a closed polygon (>2 verts) has V.length
        // edges including the closing one; an open polyline has
        // V.length - 1. Each integer step of drawProgress · edgeCount
        // advances one full edge; the fractional remainder partially
        // traces the next. drawProgress = 1 (default) reproduces the
        // pre-animation full-trace behaviour bit-for-bit.
        let n = this.V.length;
        let isClosed = n > 2;
        let edgeCount = isClosed ? n : n - 1;
        let p = this.drawProgress;
        let totalProgress = p * edgeCount;
        let fullEdges = Math.floor(totalProgress);
        let fractionalEdge = totalProgress - fullEdges;

        ctx.moveTo(this.V[0].x, this.V[0].y);
        for (let i = 0; i < fullEdges; i++) {
            let to = this.V[(i + 1) % n];
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        }
        if (fractionalEdge > 0 && fullEdges < edgeCount) {
            let from = this.V[fullEdges];
            let to = this.V[(fullEdges + 1) % n];
            let px = from.x + (to.x - from.x) * fractionalEdge;
            let py = from.y + (to.y - from.y) * fractionalEdge;
            ctx.lineTo(px, py);
            ctx.stroke();
        }
    }

    public defined() : boolean {
        if (this.V.length == 0) return false;
        for(let v of this.V) {
            if (!v.defined()) return false;
        }
        return true;
    }

    public drawFace(c: SlateCanvas): void {
        if (!this.visible && !this.shouldHighlight && this.emphasisAmount <= 0) return;
        if(this.faceColor != null && this.defined() && this.V.length > 2) {
            let ctx : CanvasRenderingContext2D = c.getContext("2d") as CanvasRenderingContext2D;
            ctx.beginPath();
            ctx.fillStyle = this.faceColor;
            let firstPoint = this.V[0];
            let rest = this.V.slice(1);
            ctx.moveTo(firstPoint.x, firstPoint.y);
            for(let vertex of rest)
                ctx.lineTo(vertex.x, vertex.y);
            ctx.closePath();
            // Animate the fill via the dedicated faceAlpha field so
            // outline-then-fill animations can run the edge trace to
            // completion at drawProgress = 1 first, then independently
            // tick faceAlpha from 0 to 1 for the fade-in. Default
            // faceAlpha = 1 preserves the fully-opaque behaviour for
            // every consumer that doesn't animate.
            let a = this.faceAlpha;
            if (a < 1) {
                if (a <= 0) return;  // fully transparent — skip
                ctx.save();
                ctx.globalAlpha = a;
                ctx.fill();
                ctx.restore();
            } else {
                ctx.fill();
            }
        }
    }

    public drawName(c: SlateCanvas): void {
        if (!this.visible && !this.shouldHighlight && this.emphasisAmount <= 0) return;
        if (this.nameColor != null && this.name != null && this.defined()) {
            let x : number = 0;
            let y : number = 0;
            for(let v of this.V) {
                x += v.x;
                y += v.y;
            }
            let n : number = this.V.length;
            x = x / n;
            y = y / n;
            let ctx : CanvasRenderingContext2D = c.getContext("2d") as CanvasRenderingContext2D;
            let [w, h] = this._getTextMetrics(ctx, this._name);
            ctx.beginPath();
            ctx.fillStyle = this.nameColor;
            ctx.fillText(this._name, x - w/2., y + h/4.);
        }
    }

    public drawVertex(c: SlateCanvas): void {
        if (!this.visible && !this.shouldHighlight && this.emphasisAmount <= 0) return;
        if (this.vertexColor != null && this.defined() ) {
            for(let v of this.V) {
                v.drawVertex(c, this.vertexColor);
            }
        }
    }

    public rotate(pivot: PointElement, ac: number, as: number): void {
    }

    public translate(dx: number, dy: number): void {
    }

    public update(): void {
    }
}
