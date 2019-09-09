/*----------------------------------------------------------------------+
|    Title:	CircleSlider.ts                                             |
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
import {CircleElement} from "../circle/CircleElement";

export class CircleSlider extends PointElement {
    _C : CircleElement;
    _initx : number;
    _inity : number;
    _initz : number;
    _segment : boolean;

    _newP : PointElement = new PointElement();

    constructor(C: CircleElement,
                x: number, y: number, z: number, segment: boolean) {
        super();
        this.dimension = 0;
        this.draggable = true;
        this._C = C;
        this._x = x;
        this._initx = x;
        this._y = y;
        this._inity = y;
        this._z = z;
        this._initz = z;
    }

    public reset() {
        this._x = this._initx;
        this._y = this._inity;
        this._z = this._initz;
        this.toCircle(this._C);
    }

    public update() {
        this.toCircle(this._C);
    }

    public drag(tox: number, toy: number): boolean {
        this._x = tox;
        this._y = toy;
        if (!this.defined()) this._z = this._initz;
        this._newP.to(this).uptoPlane(this._C.AP);
        if (!this._newP.defined())	// vertical plane
            this._newP.to(this).toPlane(this._C.AP);
        this._newP.toSphere(this._C.Center, this._C.radius);
        if ((this._newP.x-this.x)*(this._newP.x-this.x) +
            (this._newP.y-this.y)*(this._newP.y-this.y) < 0.5)
            return false;
        this.to(this._newP);
        return true;
    }
}
