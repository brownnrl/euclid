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
        if (color == null) {
            if (this.shouldHighlight) {
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
        let firstPoint = this.V[0];
        let rest = this.V.slice(1);

        ctx.moveTo(firstPoint.x, firstPoint.y);
        
        for(let vertex of rest) {
            ctx.lineTo(vertex.x, vertex.y);
            ctx.stroke();
        }

        if (this.V.length > 2) {
            ctx.lineTo(firstPoint.x, firstPoint.y);
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
            ctx.fill();
        }
    }

    public drawName(c: SlateCanvas): void {
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
