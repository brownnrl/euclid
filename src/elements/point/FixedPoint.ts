import {PointElement} from "./PointElement";
import {PlaneElement} from "../plane/PlaneElement";

export class FixedPoint extends PointElement {

    protected _initx : number;
    protected _inity : number;
    protected _initz : number;

    constructor(xVal : number, yVal : number, zVal : number) {
        super();
        this._dimension = 0;
        this._x = this._initx = xVal;
        this._y = this._inity = yVal;
        this._z = this._initz = zVal;
    }

    protected reset() : void {
        this._x = this._initx;
        this._y = this._inity;
        this._z = this._initz;
    }
}
