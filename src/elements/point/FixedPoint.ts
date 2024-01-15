/*----------------------------------------------------------------------+
|    Title:	FixedPoint.ts                                               |
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
import {PointElement, IPointElementConstruction} from "./PointElement";
import {PlaneElement} from "../plane/PlaneElement";

export class FixedPoint extends PointElement {

    protected _initx : number;
    protected _inity : number;
    protected _initz : number;

    constructor(ip? : IPointElementConstruction) {
        super(ip);
        this._initx = this._x;
        this._inity = this._y;
        this._initz = this._z;
    }

    public reset() : void {
        this._x = this._initx;
        this._y = this._inity;
        this._z = this._initz;
    }
}
