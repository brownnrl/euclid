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
        this._dimension = 0;
        this._draggable = true;
        this._AP = Qval;
        this._x = this._initx = xVal;
        this._y = this._inity = yVal;
        this._z = this._initz = zVal;
    }

    protected update() : void {
        this.toPlane(this._AP);
    }

    protected drag(tox : number, toy : number) : boolean {
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