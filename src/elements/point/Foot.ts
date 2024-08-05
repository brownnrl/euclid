/*----------------------------------------------------------------------+
|    Title:	Foot.ts                                                     |
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

export class Foot extends PointElement {
    _A : PointElement;
    _B : PointElement;
    _C : PointElement;

    constructor(A: PointElement, B: PointElement, C: PointElement) {
        super();
        this.dimension = 0;
        this._A = A;
        this._B = B;
        this._C = C;
        if (this._B.AP == this._C.AP) {
            this._AP = this._B.AP;
        }
    }

    public update() : void {
        this.to(this._A).toLine(this._B, this._C, false)
    }
}
