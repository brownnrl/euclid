/*----------------------------------------------------------------------+
|    Title:	PlaneSlider.ts                                              |
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
import {PlaneElement} from "../plane/PlaneElement";

export class PlaneSlider extends PointElement {

    // this point can be dragged anywhere on the ambient plane AP

    protected _initx : number;
    protected _inity : number;
    protected _initz : number;

    protected _newP : PointElement = new PointElement();

    constructor(Qval : PlaneElement, xVal : number, yVal : number, zVal : number) {
        super();
        this.dimension = 0;
        this.draggable = true;
        this._AP = Qval;
        this._x = this._initx = xVal;
        this._y = this._inity = yVal;
        this._z = this._initz = zVal;
    }

    public update() : void {
        this.toPlane(this._AP);
    }

    public reset() : void {
        this._x = this._initx;
        this._y = this._inity;
        this._z = this._initz;
        this.toPlane(this._AP);
    }

    public drag(tox : number, toy : number) : boolean {
        this._x = tox;
        this._y = toy;
        if (!this.defined()) { this._z = this._initz; }
        this._newP.to(this).uptoPlane(this._AP);
        if(this._newP.defined()) {
            this.to(this._newP);
        } else {
            this.toPlane(this._AP);
        }

        return true;
    }



}
