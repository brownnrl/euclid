/*----------------------------------------------------------------------+
|    Title:	CurvedTriangleElement.ts                                    |
|    Part of the geomlib port of David E. Joyce's Geometry Applet.       |
|    TypeScript: 2026, Nelson Brown, brownnrl@gmail.com                  |
+----------------------------------------------------------------------*/

import {GeomElement} from "../GeomElement";
import {SlateCanvas} from "../../Slate";
import {PointElement} from "../point/PointElement";
import {CircleElement} from "../circle/CircleElement";

// A triangle whose three sides are circular arcs rather than straight
// segments — the figure of non-Euclidean geometry (an elliptic triangle
// on the disk model, a hyperbolic triangle in the Poincaré disk; both
// have circular-arc sides). It is defined by its three vertices A, B, C
// and the three "lines" (circles) the sides lie on: side i is the
// geodesic arc on circle i from vertex i to vertex i+1, clipped to the
// vertices (so it stops at the corners, unlike the full great-circle
// arc that runs on to the disk boundary).
//
// It IS the three side-segments — it draws and highlights them itself,
// so it is one highlightable element (hovering "triangle ABC" lights the
// three curved sides gold), not an overlay on top of separate arcs.
//
// The vertices and circles are independent slate elements that move by
// their own handlers, so translate/rotate are no-ops.
export class CurvedTriangleElement extends GeomElement {

    private _vertices : PointElement[];   // A, B, C in order
    private _sides : CircleElement[];     // circle for side A→B, B→C, C→A

    constructor(vertices: PointElement[], sides: CircleElement[]) {
        super();
        this.dimension = 1;
        this._vertices = vertices;
        this._sides = sides;
    }

    update() : void {}

    defined() : boolean {
        if (this._vertices.length < 3 || this._sides.length < 3) return false;
        for (let v of this._vertices) if (!v.defined()) return false;
        for (let s of this._sides) if (!s.defined()) return false;
        return true;
    }

    // The signed minor angle from a0 to a1 around a centre, in (−π, π].
    private static _delta(a0: number, a1: number) : number {
        let d = a1 - a0;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d <= -Math.PI) d += 2 * Math.PI;
        return d;
    }

    drawEdge(c: SlateCanvas) : void {
        const color = (this.emphasized || this.shouldHighlight)
            ? this.edgeHighlightColor
            : this.edgeColor;
        if (color == null || !this.defined()) return;
        let ctx = c.getContext("2d") as CanvasRenderingContext2D;
        ctx.strokeStyle = color;
        const baseW = this.shouldHighlight ? 3 : 1;
        ctx.lineWidth = (baseW + this.emphasisAmount * (6 - baseW)) * GeomElement.styleScale;
        const n = this._vertices.length;
        for (let i = 0; i < n; i++) {
            const V = this._vertices[i];
            const W = this._vertices[(i + 1) % n];
            const circ = this._sides[i];
            const cx = circ.Center.x, cy = circ.Center.y, r = circ.radius;
            const a0 = Math.atan2(V.y - cy, V.x - cx);
            const a1 = Math.atan2(W.y - cy, W.x - cx);
            const d = CurvedTriangleElement._delta(a0, a1);
            ctx.beginPath();
            ctx.arc(cx, cy, r, a0, a0 + d, d < 0);
            ctx.stroke();
        }
    }

    // Boundary-highlight figure: no fill, no separate vertices.
    drawFace(c: SlateCanvas) : void {}
    drawVertex(c: SlateCanvas) : void {}

    drawName(c: SlateCanvas) : void {
        if (!this.defined()) return;   // drawString() guards on a null name/colour
        let x = 0, y = 0;
        for (let v of this._vertices) { x += v.x; y += v.y; }
        this.drawString(x / this._vertices.length, y / this._vertices.length, c);
    }

    translate(dx: number, dy: number) : void {}
    rotate(pivot: PointElement, ac: number, as: number) : void {}
}
