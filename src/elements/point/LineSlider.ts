/*----------------------------------------------------------------------+
|    Title:	LineSlider.ts                                               |
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

export class LineSlider extends PointElement {
    _A : PointElement;
    _B : PointElement;
    _initx : number;
    _inity : number;
    _initz : number;
    _segment : boolean;

    constructor(A: PointElement, B: PointElement,
                x: number, y: number, z: number, segment: boolean) {
        super();
        this.dimension = 0;
        this.draggable = true;
        this._A = A;
        this._B = B;
        this._x = x;
        this._initx = x;
        this._y = y;
        this._inity = y;
        this._z = z;
        this._initz = z;
        this._segment = segment;
        if(this._A.AP == this._B.AP) this._AP = this._A.AP;
    }

    public reset() {
        this._x = this._initx;
        this._y = this._inity;
        this._z = this._initz;
        this.toLine(this._A, this._B, this._segment);
    }

    public update() {
        this.toLine(this._A, this._B, this._segment);
    }

    public drag(tox: number, toy: number): boolean {
        tox -= this._A.x;
        toy -= this._A.y;
        let dx : number = this._B.x - this._A.x;
        let dy : number = this._B.y - this._A.y;
        let factor : number = (tox*dx + toy*dy)/(dx*dx + dy*dy);
        if (this._segment) {
            if (factor < 0.0) factor = 0.0;
            else if (factor > 1.0) factor = 1.0;
        }
        tox = this._A.x + dx*factor;
        toy = this._A.y + dy*factor;
        if ((tox-this._x)*(tox-this._x) + (tox-this._y)*(tox-this._y) < 0.5) return false;
        // now drag this point
        this._x = tox;
        this._y = toy;
        this._z = this._A.z + (this._B.z-this._A.z)*factor;
        return true;
    }
}