/*----------------------------------------------------------------------+
|    Title:	CircleElement.ts                                            |
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
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "../point/PointElement";

export class CircleElement extends GeomElement {

    public Center : PointElement;
    public A : PointElement;
    public B : PointElement;
    public AP : PlaneElement;

    constructor() {
        super();
        this.dimension = 2;
    }

    get radius() {
        return this.A.distance(this.B);
    }

    get radius2() {
        return this.A.distance2(this.B);
    }

    public drawEdge(): void {
    }

    public drawFace(): void {
    }

    public drawName(d: paper.Rectangle): void {
    }

    public drawVertex(): void {
    }

    public rotate(pivot: PointElement, ac: number, as: number): void {
    }

    public translate(dx: number, dy: number): void {
    }

    public update(): void {
    }

}
