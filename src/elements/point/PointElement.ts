import {GeomElement} from "../GeomElement";
import {PlaneElement} from "../plane/PlaneElement";

export interface IPointElementConstruction {
    x : number;
    y : number;
    z : number;
    AP : PlaneElement;
}

type ipec = IPointElementConstruction

export class PointElement extends GeomElement {

    protected _x : number;
    protected _y : number;
    protected _z : number;
    protected _AP : PlaneElement;

    constructor(ip? : IPointElementConstruction) {
        super();
        this._x = ip && ip.x || 0;
        this._y = ip && ip.y || 0;
        this._z = ip && ip.z || 0;
        this._AP = ip && ip.AP || null;
    }

    get x() { return this._x }
    get y() { return this._y }
    get z() { return this._z }

    protected defined() : boolean {
        return !isNaN(this._x) && !isNaN(this._y) && ! isNan(this._z);
    }

    public toString() : string {
        return `[${this._name} (${this._x}, ${this._y}, ${this._z})]`;
    }

    public hitTest(x: number, y: number) : boolean {
        return Math.sqrt((this._x - x) * (this._x - x) + (this._y - y) * (this._y - y)) <= this._pixelTolerance;
    }

    to(B : PointElement ) : PointElement {this._x = B._x; this._y = B._y; this._z= B._z; return this;}
    plus(B : PointElement ) : PointElement {this._x += B._x; this._y += B._y; this._z+= B._z; return this;}
    minus(B : PointElement) : PointElement {this._x -= B._x; this._y -= B._y; this._z-= B._z; return this;}
    times(a : number) : PointElement {this._x *= a; this._y *= a; this._z *= a; return this;}

    static sum(A : PointElement, B: PointElement) : PointElement {
        return new PointElement({x: A.x+B.x,y: A.y+B.y, z:A.z+B.z, AP: null});
    }

    static difference(A : PointElement, B : PointElement) : PointElement {
        return new PointElement({x:A.x-B.x, y:A.y-B.y, z:A.z-B.z, AP: null});
    }

    static product(a : number, B : PointElement) : PointElement {
        return new PointElement({x:a*B.x, y:a*B.y, z:a*B.z, AP: null});
    }

    static dot(A : PointElement, B : PointElement) : number {
        return A.x * B.x + A.y * B.y + A.z * B.z;
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