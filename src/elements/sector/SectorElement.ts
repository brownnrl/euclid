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

import {GeomElement} from "../GeomElement";
import {PointElement} from "../point/PointElement";
import {PlaneElement} from "../plane/PlaneElement";
import {Midpoint} from "../point/Midpoint";
import {SlateCanvas} from "../../Slate";

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
    _P : PlaneElement; // plane of the circle

    _angle : number = null;

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
        let r = this.radius();
        if(r == 0) { // degenerate circle
            return;
        }
        this._angle = Math.atan2(this._B.y - this._A.y, this._B.x - this._A.x) -
            Math.atan2(this._Center.y - this._A.y, this._Center.x - this._A.x);
        let x = this._Center.x + Math.cos(this._angle/2) * r;
        let y = this._Center.y + Math.sin(this._angle/2) * r;
    }


    drawEdge(c: SlateCanvas): void {
    }

    drawFace(c: SlateCanvas): void {
    }

    drawName(c: SlateCanvas): void {
    }

    drawVertex(c: SlateCanvas): void {}

    rotate(pivot: PointElement, ac: number, as: number): void {}

    translate(dx: number, dy: number): void {}

    update(): void {
        this._updateThroughPoint();
    }

}
