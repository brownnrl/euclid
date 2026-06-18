/*----------------------------------------------------------------------+
|    Title:	PolylineElement.ts                                          |
|    Part of the geomlib port of David E. Joyce's Geometry Applet.       |
|    TypeScript: 2026, Nelson Brown, brownnrl@gmail.com                  |
+----------------------------------------------------------------------*/

import {PointElement} from "../point/PointElement";
import {GeomElement} from "../GeomElement";
import {SlateCanvas} from "../../Slate";

// An open path (polyline): an ordered run of connected segments through
// the given points (A → B → C → …) that, unlike a polygon, does NOT close
// back to the first point. It is a one-dimensional route — the "bent line"
// of, e.g., Heron's minimum-distance problem (the path A→E→B) — drawn and
// highlightable as ONE element, so a prose ref to the whole route lights
// every segment together.
//
// Mirrors PolygonElement's edge trace (drawProgress-aware), but open and
// with no face. Its points are independent slate elements that move by
// their own handlers, so translate/rotate are no-ops.
export class PolylineElement extends GeomElement {

    public V : PointElement[];

    constructor(ps?: PointElement[]) {
        super();
        this.dimension = 1;
        this.V = ps == null ? [] : ps;
    }

    public defined() : boolean {
        if (this.V.length < 2) return false;
        for (let v of this.V) if (!v.defined()) return false;
        return true;
    }

    public drawEdge(c: SlateCanvas) : void {
        if (!this.visible && !this.shouldHighlight && this.emphasisAmount <= 0) return;
        const color = (this.emphasized || this.shouldHighlight)
            ? this.edgeHighlightColor
            : this.edgeColor;
        if (color == null || this.V.length < 2) return;

        let ctx = c.getContext("2d") as CanvasRenderingContext2D;
        ctx.beginPath();
        ctx.strokeStyle = color;
        {
            const baseW = this.shouldHighlight ? 3 : 1;
            ctx.lineWidth = (baseW + this.emphasisAmount * (6 - baseW)) * GeomElement.styleScale;
        }
        // Open path: V.length - 1 edges (no closing edge). Each integer
        // step of drawProgress · edgeCount advances one full segment; the
        // fractional remainder partially traces the next. drawProgress = 1
        // (default) traces the whole route.
        const n = this.V.length;
        const edgeCount = n - 1;
        const total = this.drawProgress * edgeCount;
        const fullEdges = Math.floor(total);
        const frac = total - fullEdges;

        ctx.moveTo(this.V[0].x, this.V[0].y);
        for (let i = 0; i < fullEdges; i++) {
            const to = this.V[i + 1];
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        }
        if (frac > 0 && fullEdges < edgeCount) {
            const from = this.V[fullEdges];
            const to = this.V[fullEdges + 1];
            ctx.lineTo(from.x + (to.x - from.x) * frac, from.y + (to.y - from.y) * frac);
            ctx.stroke();
        }
    }

    // Open route: no enclosed area to fill.
    public drawFace(c: SlateCanvas) : void {}

    public drawVertex(c: SlateCanvas) : void {
        if (!this.visible && !this.shouldHighlight && this.emphasisAmount <= 0) return;
        if (this.vertexColor != null && this.defined()) {
            for (let v of this.V) v.drawVertex(c, this.vertexColor);
        }
    }

    public drawName(c: SlateCanvas) : void {
        if (!this.visible && !this.shouldHighlight && this.emphasisAmount <= 0) return;
        if (this.nameColor != null && this.name != null && this.defined()) {
            let x = 0, y = 0;
            for (let v of this.V) { x += v.x; y += v.y; }
            const k = this.V.length;
            let ctx = c.getContext("2d") as CanvasRenderingContext2D;
            let [w, h] = this._getTextMetrics(ctx, this._name);
            ctx.beginPath();
            ctx.fillStyle = this.nameColor;
            ctx.fillText(this._name, x / k - w / 2, y / k + h / 4);
        }
    }

    public rotate(pivot: PointElement, ac: number, as: number) : void {}
    public translate(dx: number, dy: number) : void {}
    public update() : void {}
}
