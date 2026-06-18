/*----------------------------------------------------------------------+
|    Title:	CurvedTriangleElement.ts                                    |
|    Part of the geomlib port of David E. Joyce's Geometry Applet.       |
|    TypeScript: 2026, Nelson Brown, brownnrl@gmail.com                  |
+----------------------------------------------------------------------*/

import {GeomElement} from "../GeomElement";
import {SlateCanvas} from "../../Slate";
import {PointElement} from "../point/PointElement";
import {CircleElement} from "../circle/CircleElement";
import {LineElement} from "../line/LineElement";

// A triangle whose three sides are circular arcs rather than straight
// segments — the figure of non-Euclidean geometry (an elliptic triangle on
// the disk model, a hyperbolic triangle in the Poincaré disk; both have
// circular-arc sides).
//
// It is defined by 3 vertices A, B, C and 3 side carriers (one per side,
// **positionally**: side i connects vertex i to vertex i+1 and lies on
// carrier i). A carrier is the "line" the side lies on:
//   - a CircleElement → the side is the minor arc of that circle between the
//     two vertices, clipped to them (it stops at the corners, unlike the full
//     great-circle arc that runs on to the disk boundary);
//   - a LineElement → the side is the straight chord between the two vertices
//     (a disk diameter, whose geodesic is straight).
//
// It IS the side-segments — it draws and (optionally) fills them itself, so it
// is one highlightable/fillable element (hovering "triangle ABC" lights the
// curved sides gold). The minor arc makes the curve well-defined; positional
// carriers make "which circle" well-defined. (The side tracing is written for
// N sides, so a general curved polygon is a later, easy generalisation.)
//
// The vertices and carriers are independent slate elements that move by their
// own handlers, so translate/rotate are no-ops.
type SideCarrier = CircleElement | LineElement;

export class CurvedTriangleElement extends GeomElement {

    private _vertices : PointElement[];   // A, B, C in order
    private _sides : SideCarrier[];       // carrier for side i (Vi → V(i+1))

    constructor(vertices: PointElement[], sides: SideCarrier[]) {
        super();
        this.dimension = 1;
        this._vertices = vertices;
        this._sides = sides;
    }

    update() : void {}

    // A vertex lies on a circle carrier (|dist − r| small) / a line carrier
    // (perpendicular distance small). Tolerances are relative to the carrier's
    // own scale, with a 0.5px floor: generous against float error, but catches
    // a carrier that simply doesn't pass through the side's endpoints.
    private static _onCircle(v: PointElement, c: CircleElement) : boolean {
        const r = c.radius;
        return Math.abs(v.distance(c.Center) - r) <= Math.max(0.5, 1e-3 * r);
    }
    private static _onLine(v: PointElement, l: LineElement) : boolean {
        const ax = l.A.x, ay = l.A.y, bx = l.B.x, by = l.B.y;
        const dx = bx - ax, dy = by - ay;
        const len = Math.hypot(dx, dy);
        if (len === 0) return false;
        const perp = Math.abs((v.x - ax) * dy - (v.y - ay) * dx) / len;
        return perp <= Math.max(0.5, 1e-3 * len);
    }

    defined() : boolean {
        const n = this._vertices.length;
        if (n < 3 || this._sides.length !== n) return false;
        for (let v of this._vertices) if (!v.defined()) return false;
        // Each carrier must be defined AND pass through BOTH vertices of its
        // side, else the figure is ill-posed — undefined, so we draw no
        // misleading arcs. (LineElement inherits no real defined(), so a line
        // carrier is "defined" when both its endpoints are.)
        for (let i = 0; i < n; i++) {
            const V = this._vertices[i];
            const W = this._vertices[(i + 1) % n];
            const s = this._sides[i];
            if (s instanceof CircleElement) {
                if (!s.defined()) return false;
                if (!CurvedTriangleElement._onCircle(V, s) || !CurvedTriangleElement._onCircle(W, s)) return false;
            } else {
                const l = s as LineElement;
                if (l.A == null || l.B == null || !l.A.defined() || !l.B.defined()) return false;
                if (!CurvedTriangleElement._onLine(V, l) || !CurvedTriangleElement._onLine(W, l)) return false;
            }
        }
        return true;
    }

    // The signed minor angle from a0 to a1 around a centre, in (−π, π].
    private static _delta(a0: number, a1: number) : number {
        let d = a1 - a0;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d <= -Math.PI) d += 2 * Math.PI;
        return d;
    }

    // Trace the closed curved boundary into the current ctx path (no
    // beginPath / stroke / fill). Shared by drawEdge and drawFace so the
    // stroked outline and the filled region are the exact same path.
    private _traceBoundary(ctx: CanvasRenderingContext2D) : void {
        const n = this._vertices.length;
        const V0 = this._vertices[0];
        ctx.moveTo(V0.x, V0.y);
        for (let i = 0; i < n; i++) {
            const V = this._vertices[i];
            const W = this._vertices[(i + 1) % n];
            const s = this._sides[i];
            if (s instanceof CircleElement) {
                const cx = s.Center.x, cy = s.Center.y, r = s.radius;
                const a0 = Math.atan2(V.y - cy, V.x - cx);
                const a1 = Math.atan2(W.y - cy, W.x - cx);
                const d = CurvedTriangleElement._delta(a0, a1);
                // V is on the circle, so ctx.arc's implicit lineTo to the arc
                // start is zero-length and the path stays continuous.
                ctx.arc(cx, cy, r, a0, a0 + d, d < 0);
            } else {
                // Straight side (line carrier / diameter): chord to the vertex.
                ctx.lineTo(W.x, W.y);
            }
        }
        ctx.closePath();
    }

    drawFace(c: SlateCanvas) : void {
        if (!this.visible && !this.shouldHighlight && this.emphasisAmount <= 0) return;
        if (this.faceColor == null || !this.defined()) return;
        let ctx = c.getContext("2d") as CanvasRenderingContext2D;
        ctx.beginPath();
        this._traceBoundary(ctx);
        ctx.fillStyle = this.faceColor;
        ctx.fill();
    }

    drawEdge(c: SlateCanvas) : void {
        if (!this.visible && !this.shouldHighlight && this.emphasisAmount <= 0) return;
        const color = (this.emphasized || this.shouldHighlight)
            ? this.edgeHighlightColor
            : this.edgeColor;
        if (color == null || !this.defined()) return;
        let ctx = c.getContext("2d") as CanvasRenderingContext2D;
        ctx.strokeStyle = color;
        const baseW = this.shouldHighlight ? 3 : 1;
        ctx.lineWidth = (baseW + this.emphasisAmount * (6 - baseW)) * GeomElement.styleScale;
        ctx.beginPath();
        this._traceBoundary(ctx);
        ctx.stroke();
    }

    drawVertex(c: SlateCanvas) : void {}

    drawName(c: SlateCanvas) : void {
        if (!this.visible && !this.shouldHighlight && this.emphasisAmount <= 0) return;
        if (!this.defined()) return;   // drawString() guards on a null name/colour
        let x = 0, y = 0;
        for (let v of this._vertices) { x += v.x; y += v.y; }
        this.drawString(x / this._vertices.length, y / this._vertices.length, c);
    }

    translate(dx: number, dy: number) : void {}
    rotate(pivot: PointElement, ac: number, as: number) : void {}
}
