/*----------------------------------------------------------------------+
|    Title:	SectorElement.ts                                            |
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

import {Path} from "paper";
import {GeomElement} from "../GeomElement";
import {PointElement} from "../point/PointElement";
import {PlaneElement} from "../plane/PlaneElement";
import Point = paper.Point;
import {Midpoint} from "../point/Midpoint";
import Line = paper.Path.Line;

export interface ISectorElementConstruction {
    O: PointElement;
    A: PointElement;
    B: PointElement;
    P: PlaneElement;
}

export class SectorElement extends GeomElement {

    _Center : PointElement;
    _A : PointElement;
    _B : PointElement;
    // A and B are two points on a circle with the given center

    _M : Midpoint; // midpoint between A and B
    _T : PointElement; // point "through" the arc

    _P : PlaneElement; // plane of the circle

    _paperJSArc   : Path.Arc = null;
    _paperJSFace  : Path     = null;  // path with no edge to provide for fill (not arc)
    _paperJSEdge1  : Line     = null; // line from center to A (paperFrom)
    _paperJSEdge2  : Line     = null; // line from center to B (paperTo)
    _paperFrom    : Point    = null;
    _paperThrough : Point    = null;
    _paperTo      : Point    = null;
    _paperCenter  : Point    = null;

    constructor(isec?: ISectorElementConstruction) {
        super();
        this.dimension = 2;
        if(isec != null) {
            this._Center = isec.O;
            this._A = isec.A;
            this._B = isec.B;
            this._P = isec.P;
            this._M = new Midpoint(this._A, this._B);
        }
    }

    public toString(): string {
        return `[${this._name}: Center=${this._Center} A=${this._A} B=${this._B}]`;
    }

    radius() : number {
        return this._Center.distance(this._A);
    }

    radius2() : number {
        return this._Center.distance2(this._A);
    }


    // Here, we differ from the original implementation.
    // Since A and B are on the circle, we find the midpoint M between them.
    // Then we calculate a radius distance along the line from Center M
    // as the "through" point.

    _updateThroughPoint() : void {
        if(this._M == null) return;
        this._M.update();
        this._paperFrom.x = this._A.x;
        this._paperFrom.y = this._A.y;
        this._paperTo.x = this._B.x;
        this._paperTo.y = this._B.y;
        this._paperCenter.x = this._Center.x;
        this._paperCenter.y = this._Center.y;
        this._paperThrough.x = this._M.x;
        this._paperThrough.y = this._M.y;
        let p = this._paperThrough.subtract(this._paperCenter);
        p = p.divide(p.length);
        let r = this.radius();
        if(r == 0) { // degenerate circle
            this._paperThrough.x = this._Center.x;
            this._paperThrough.y = this._Center.y;
            return;
        }
        p = this._paperCenter.add(p.multiply(r));
        this._paperThrough.x = p.x;
        this._paperThrough.y = p.y;
        console.log("paperthrough: ", this._paperThrough);
    }

    _createPaperJSElements() : void {
        if(this._paperJSArc == null) {
            this._paperFrom = new Point(this._A.x, this._A.y);
            this._paperTo = new Point(this._B.x, this._B.y);
            this._paperCenter = new Point(this._Center.x, this._Center.y);
            this._paperThrough = new Point(this._Center.x, this._Center.y);
            this._updateThroughPoint();
        } else {
            this._paperJSArc.remove();
            this._paperJSFace.remove();
            this._paperJSEdge1.remove();
            this._paperJSEdge2.remove();
        }

        this._paperJSArc = new Path.Arc(this._paperFrom,
            this._paperThrough,
            this._paperTo);
        this._paperJSEdge1 = new Line(this._paperCenter, this._paperFrom);
        this._paperJSEdge2 = new Line(this._paperCenter, this._paperTo);
        this._paperJSFace = new Path([this._paperCenter, this._paperTo, this._paperFrom]);
    }


    drawEdge(): void {
        this._paperJSArc.strokeColor = this.edgeColor;
        this._paperJSEdge1.strokeColor = this.edgeColor;
        this._paperJSEdge2.strokeColor = this.edgeColor;
    }

    drawFace(): void {
        this._paperJSArc.fillColor = this.faceColor;
        this._paperJSFace.fillColor = this.faceColor;
    }

    drawName(d: paper.Rectangle): void {
        this.drawString(this._paperThrough.x, this._paperThrough.y, d);
    }

    drawVertex(): void {}

    rotate(pivot: PointElement, ac: number, as: number): void {}

    translate(dx: number, dy: number): void {}

    update(): void {
        this._createPaperJSElements();
        this._updateThroughPoint();
    }

}
