import {GeomElement} from "../GeomElement";
import {PlaneElement} from "../plane/PlaneElement";

export interface IPointElementConstruction {
    x : number;
    y : number;
    z : number;
    AP : PlaneElement;
}

export class PointElement extends GeomElement {

    protected _x : number;
    protected _y : number;
    protected _z : number;
    protected _AP : PlaneElement;

    constructor(canvas: HTMLCanvasElement, ip? : IPointElementConstruction) {
        super(canvas);
        this._x = ip && ip.x || 0;
        this._y = ip && ip.y || 0;
        this._z = ip && ip.z || 0;
        this._AP = ip && ip.AP || null;
    }

    protected drawEdge(): void {
    }

    protected drawFace(): void {
    }

    protected drawName(d: paper.Rectangle): void {
    }

    protected drawVertex(): void {
    }

    protected rotate(pivot: paper.Point, ac: number, as: number): void {
    }

    protected translate(dx: number, dy: number): void {
    }

    protected update(): void {
    }
}