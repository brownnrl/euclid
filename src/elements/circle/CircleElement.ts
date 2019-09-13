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
import {SlateCanvas} from "../../Slate";


export interface ICircleElementConstruction {
    C : PointElement; // center of the circle
    B : PointElement; // point on the circle
    AP : PlaneElement;
}

export class CircleElement extends GeomElement {

    public Center : PointElement;
    public A : PointElement;
    public B : PointElement;
    public AP : PlaneElement;

    constructor(ice? : ICircleElementConstruction) {
        super();
        this.dimension = 2;
        if(ice == null) return;
        this.Center = ice.C;
        this.A = this.Center;
        this.B = ice.B;
        this.AP = ice.AP;
    }

    public toString() : string {
        return `[${this._name} (${this.Center}, ${this.A} ${this.B})]`;
    }

    get radius() {
        return this.A.distance(this.B);
    }

    get radius2() {
        return this.A.distance2(this.B);
    }

    public drawEdge(c: SlateCanvas): void {
    }

    public drawFace(c: SlateCanvas): void {
    }

    public drawName(c: SlateCanvas): void {
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
