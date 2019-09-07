/*----------------------------------------------------------------------+
|    Title:	Midpoint.ts                                                 |
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

export class Midpoint extends PointElement {
    _A : PointElement;
    _B : PointElement;

    constructor(A: PointElement, B: PointElement) {
        super();
        this.dimension = 0;
        this._A = A;
        this._B = B;
        if (this._A.AP == this._B.AP) {
            this._AP = this._A.AP;
        }
    }

    public update() : void {
        this._x = (this._A.x + this._B.x) / 2.0;
        this._y = (this._A.y + this._B.y) / 2.0;
        this._z = (this._A.z + this._B.z) / 2.0;
    }
}
