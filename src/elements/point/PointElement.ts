/*----------------------------------------------------------------------+
|    Title:	PointElement.ts                                             |
|                                                                       |
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
        return !isNaN(this._x) && !isNaN(this._y) && ! isNaN(this._z);
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

    public length2() : number {
        return this._x * this._x + this._y * this._y + this._z + this._z;
    }

    public length() : number {
        return Math.sqrt(this.length2());
    }

    public distance2(B : PointElement) : number {
        return (this._x-B.x)*(this._x-B.x) +
               (this._y-B.y)*(this._y-B.y) +
               (this._z-B.z)*(this._z-B.z);
    }

    public distance(B : PointElement) : number {
        return Math.sqrt(this.distance2(B));
    }

    public toCross(A : PointElement, B : PointElement) : PointElement {
        // set to the cross product of A and B
        this._x = A.y*B.z - A.z*B.y;
        this._y = A.z*B.x - A.x*B.z;
        this._z = A.x*B.y - A.y*B.x;
        return this;
    }

    public static cross(A: PointElement, B: PointElement) : PointElement {
        // return the cross product of A and B
        return new PointElement({x: A.y*B.z - A.z*B.y,
                                    y: A.z*B.x - A.x*B.z,
                                    z: A.x*B.y - A.y*B.x,
                                    AP: null});
    }

    public static triple(A: PointElement, B: PointElement, C: PointElement) : number {
    // return the triple product of A, B, and C
        return A.x*(B.y*C.z - B.z*C.y) +
               B.x*(C.y*A.z - C.z*A.y) +
               C.x*(A.y*B.z - A.z*B.y);
    }

    protected toLine(A: PointElement, B: PointElement, segment: boolean) : PointElement{
        /*---------------------------------------------------------------------+
        |  Project this point to the foot of the perpendicular from it to the  |
        |  line determined by the points A and B. If A were the origin, then   |
        |  the foot would be at ((this dot B)/B^2) B.  When segment is true    |
        |  and the foot is beyond A or B, then move the point to the closer    |
        |  of A and B.                                                         |
        +---------------------------------------------------------------------*/
        let V : PointElement = PointElement.difference(B,A);
        this.minus(A);
        let factor : number= PointElement.dot(V,this)/V.length2();
        if (segment) {
            if (factor < 0.0) factor = 0.0;
            else if (factor > 1.0) factor = 1.0;
        }
        V.times(factor);
        return this.to(V).plus(A);
    }


    protected toPlane (P : PlaneElement) : PointElement {
        /*---------------------------------------------------------------------+
        |  Project this point to the foot of the perpendicular from it to the  |
        |  plane P.                                                            |
        +---------------------------------------------------------------------*/
        if (P.isScreen) {
            this._z = 0.0;
        } else {
            this.minus(P.A);
            let s : number = PointElement.dot(this, P.S);
            let t = PointElement.dot(this, P.T);
            this.to(P.S).times(s).plus(PointElement.product(t,P.T)).plus(P.A);
        }
        return this;
    }

    uptoPlane(P : PlaneElement) : PointElement {
        /*---------------------------------------------------------------------+
        |  Project this point to the point on the plane P where the vertical   |
        |  line through this meets P.                                          |
        +---------------------------------------------------------------------*/
        if (P.isScreen) {
            this._z = 0.0;
        }  else {
            this.minus(P.A);
            let den : number = P.S.x*P.T.y - P.S.y*P.T.x;
            let s : number = (this.x*P.T.y - this.y*P.T.x) / den;
            let t : number = (this.y*P.S.x - this.x*P.S.y) / den;
            this.to(P.S).times(s).plus(PointElement.product(t,P.T)).plus(P.A);
        }
        return this;
    }


    toCircumcenter (A: PointElement, B: PointElement, C: PointElement) : PointElement{
        /*---------------------------------------------------------------------+
        | Move this point to the center of the circle passing through the      |
        | points A, B, and C.                                                  |
        +---------------------------------------------------------------------*/
        if (A.z == 0.0 && B.z == 0.0 && C.z == 0.0) {
            let u   : number = ((A.x-B.x)*(A.x+B.x) + (A.y-B.y)*(A.y+B.y)) / 2.0;
            let v   : number = ((B.x-C.x)*(B.x+C.x) + (B.y-C.y)*(B.y+C.y)) / 2.0;
            let den : number = (A.x-B.x)*(B.y-C.y) - (B.x-C.x)*(A.y-B.y);
            this._x = (u * (B.y-C.y) - v*(A.y-B.y)) / den;
            this._y = (v * (A.x-B.x) - u*(B.x-C.x)) / den;
            this._z = 0.0;
        } else {
            let BmA : PointElement = PointElement.difference(B,A)
            let CmA : PointElement = PointElement.difference(C,A);
            let BC : number = PointElement.dot(BmA,CmA);
            let B2 : number = BmA.length2();
            let C2 : number = CmA.length2();
            //double BC2 = BC*BC;
            let den : number = 2.0*(B2*C2-BC*BC);
            let s : number   = C2*(B2-BC)/den;
            let t : number   = B2*(C2-BC)/den;
            this.to(A).plus(BmA.times(s)).plus(CmA.times(t));
        }
        return this;
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