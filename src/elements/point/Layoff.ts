/*----------------------------------------------------------------------+
|    Title:	Layoff.ts                                                   |
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

import {PointElement} from "./PointElement";

export class Layoff extends PointElement {

    // Lay off a line AB with endpoint A given, so that AB is parallel to CD
    // and equal to EF.  (this is B)

    protected _A : PointElement;
    protected _C : PointElement;
    protected _D : PointElement;
    protected _E : PointElement;
    protected _F : PointElement;


    constructor(A: PointElement,
                C: PointElement,
                D: PointElement,
                E: PointElement,
                F: PointElement) {
        super();
        this.dimension = 0;
        this._A = A;
        this._C = C;
        this._D = D;
        this._E = E;
        this._F = F;
        if (A.AP == C.AP && A.AP == D.AP) {
            this._AP = A.AP;
        }
    }

    public update() {
        let factor : number = this._E.distance(this._F) / this._C.distance(this._D);
        this.to(this._D).minus(this._C);
        this.times(factor).plus(this._A);
    }

}
