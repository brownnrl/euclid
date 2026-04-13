/*----------------------------------------------------------------------+
|    Title:	PlaneIntersection.ts                                        |
|    Originally: IntersectionPL.java (renamed for clarity)              |
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
|                                                                       |
|    NOTE: This file was previously a copy of Intersection.ts           |
|    (line-line intersection). Rewritten 2026-04-12 to implement the    |
|    actual plane-line intersection via toIntersectionPL().              |
+----------------------------------------------------------------------*/

import {PointElement} from "./PointElement";
import {PlaneElement} from "../plane/PlaneElement";

export class PlaneIntersection extends PointElement {
    // this point is the intersection of the ambient plane AP and the line AB

    private _A: PointElement;
    private _B: PointElement;

    constructor(AP: PlaneElement, A: PointElement, B: PointElement) {
        super();
        this.dimension = 0;
        this._A = A;
        this._B = B;
        this._AP = AP;
    }

    update(): void {
        this.toIntersectionPL(this._AP, this._A, this._B);
    }
}
