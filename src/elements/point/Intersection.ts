/*----------------------------------------------------------------------+
|    Title:	Intersection.ts                                             |
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
|    TypeScript Port: 2024, Nelson Brown, brownnrl@gmail.com            |
+----------------------------------------------------------------------*/

import {PointElement} from "./PointElement";
import {PlaneElement} from "../plane/PlaneElement";

export class Intersection extends PointElement {
    
    A : PointElement;
    B : PointElement;
    C : PointElement;
    D : PointElement;

    constructor(A: PointElement,
                B: PointElement,
                C: PointElement,
                D: PointElement,
                AP: PlaneElement) {
        super({AP: AP});
        this.dimension = 0;
        this.A = A;
        this.B = B;
        this.C = C;
        this.D = D;
    }

    update(): void {
        this.toIntersection(this.A, this.B, this.C, this.D, this.AP);
    }
}


