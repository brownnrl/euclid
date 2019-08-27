import {PointElement} from "./PointElement";

export class Midpoint extends PointElement {
    _A : PointElement;
    _B : PointElement;

    constructor(A: PointElement, B: PointElement) {
        super();
        this._dimension = 0;
        this._A = A;
        this._B = B;
        if (this._A.AP == this._B.AP) {
            this._AP = this._A.AP;
        }
    }

    protected update() : void {
        this._x = (this._A.x + this._B.x) / 2.0;
        this._y = (this._A.y + this._B.y) / 2.0;
        this._z = (this._A.z + this._B.z) / 2.0;
    }
}