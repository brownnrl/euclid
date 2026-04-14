/*----------------------------------------------------------------------+
|    Title:	PlaneFootElement.ts                                         |
|    Originally: PlaneFoot.java (renamed for clarity)                   |
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
|    TypeScript Port: 2026, Nelson Brown, brownnrl@gmail.com            |
|                           https://www.nelsonbrown.net/                |
+----------------------------------------------------------------------*/

import {PointElement} from "./PointElement";
import {PlaneElement} from "../plane/PlaneElement";

export class PlaneFootElement extends PointElement {
    // foot of perpendicular from point A to the ambient plane AP

    private _A: PointElement;

    constructor(A: PointElement, P: PlaneElement) {
        super();
        this.dimension = 0;
        this._A = A;
        this._AP = P;
    }

    public update() {
        this.to(this._A).toPlane(this._AP);
    }
}
