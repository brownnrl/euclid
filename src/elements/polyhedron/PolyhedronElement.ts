/*----------------------------------------------------------------------+
|    Title:	PolyhedronElement.ts                                        |
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
|    Date:    May, 1997.                                                |
|    TypeScript Port: 2026, Nelson Brown, brownnrl@gmail.com            |
|                           https://www.nelsonbrown.net/                |
+----------------------------------------------------------------------*/

import {GeomElement} from "../GeomElement";
import {PolygonElement} from "../polygon/PolygonElement";
import {PointElement} from "../point/PointElement";
import {SlateCanvas} from "../../Slate";

export class PolyhedronElement extends GeomElement {

    public P: PolygonElement[];   // array of face polygons

    constructor() {
        super();
        this.dimension = 2;
        this.P = [];
    }

    public defined(): boolean {
        for (let i = 0; i < this.P.length; ++i) {
            if (!this.P[i].defined()) return false;
        }
        return true;
    }

    public drawName(c: SlateCanvas): void {
        if (this.nameColor != null && this.name != null && this.defined()) {
            let x = 0, y = 0, ct = 0;
            for (let j = 0; j < this.P.length; ++j) {
                for (let i = 0; i < this.P[j].V.length; ++i) {
                    x += this.P[j].V[i].x;
                    y += this.P[j].V[i].y;
                    ++ct;
                }
            }
            x /= ct;
            y /= ct;
            this.drawString(Math.round(x), Math.round(y), c);
        }
    }

    public drawVertex(c: SlateCanvas): void {
        if (this.vertexColor != null && this.defined()) {
            for (let j = 0; j < this.P.length; ++j) {
                for (let i = 0; i < this.P[j].V.length; ++i) {
                    this.P[j].V[i].drawVertex(c, this.vertexColor);
                }
            }
        }
    }

    public drawEdge(c: SlateCanvas): void {
        if (this.edgeColor != null && this.defined()) {
            let ctx = c.getContext("2d") as CanvasRenderingContext2D;
            ctx.strokeStyle = this.edgeColor;
            for (let j = 0; j < this.P.length; ++j) {
                for (let i = 0; i < this.P[j].V.length; ++i) {
                    let a = this.P[j].V[i];
                    let b = this.P[j].V[(i + 1) % this.P[j].V.length];
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }
    }

    public drawFace(c: SlateCanvas): void {
        if (this.faceColor != null && this.defined()) {
            for (let j = 0; j < this.P.length; ++j) {
                this.P[j].drawFace(c);
            }
        }
    }

    public update(): void {}
    public translate(dx: number, dy: number): void {}
    public rotate(pivot: PointElement, ac: number, as: number): void {}
}
