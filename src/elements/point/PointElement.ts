/*----------------------------------------------------------------------+
|    Title:	PointElement.ts                                             |
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

import {GeomElement} from "../GeomElement";
import {PlaneElement} from "../plane/PlaneElement";
import {CircleElement} from "../circle/CircleElement";
import {SlateCanvas} from "../../Slate";

export interface IPointElementConstruction {
    x? : number;
    y? : number;
    z? : number;
    AP? : PlaneElement;
}

export class PointElement extends GeomElement {

    protected _x : number;
    protected _y : number;
    protected _z : number;
    _AP : PlaneElement;

    constructor(ip? : IPointElementConstruction) {
        super();
        this._x = ip && ip.x || 0;
        this._y = ip && ip.y || 0;
        this._z = ip && ip.z || 0;
        this._AP = ip && ip.AP || null;
    }

    get x() { return this._x }
    set x(value: number) { this._x = value }
    get y() { return this._y }
    set y(value: number) { this._y = value }
    get z() { return this._z }
    set z(value: number) { this._z = value }

    get AP() { return this._AP; }


    public defined() : boolean {
        return !isNaN(this._x) && !isNaN(this._y) && !isNaN(this._z)
            && this._x != null && true && this._y != null && true && this._z != null;
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


    public toPlane (P : PlaneElement) : PointElement {
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

    toCircle (C: CircleElement) : PointElement {
        /*---------------------------------------------------------------------+
        | Move this point to the nearest point on the circle C.                |
        +---------------------------------------------------------------------*/
        if (C.AP.isScreen) {
            let factor : number = C.radius / this.distance(C.Center);
            this._x = C.Center.x + factor*(this._x - C.Center.x);
            this._y = C.Center.y + factor*(this._y - C.Center.y);
            this._z = 0.0;
        } else { // 3d case: project to plane of circle then move to sphere of circle
            this.toPlane(C.AP);
            this.toSphere(C.Center,C.radius);
        }
        return this;
    }

    toSphere (Center : PointElement, radius : number) : PointElement{
        /*---------------------------------------------------------------------+
        | Move this point to the nearest point on the sphere S.                |
        +---------------------------------------------------------------------*/
        let factor : number = radius / this.distance(Center);
        this._x = Center.x + factor*(this._x - Center.x);
        this._y = Center.y + factor*(this._y - Center.y);
        this._z = Center.z + factor*(this._z - Center.z);
        return this;
    }

    public static area(A: PointElement, B: PointElement, C: PointElement) {
        // return the area of the triangle ABC
        let U : PointElement = PointElement.difference(B,A);
        let V : PointElement = PointElement.difference(C,A);
        return this.cross(U,V).length()/2.0;
    }

    public angle(B: PointElement, C: PointElement, P: PlaneElement) : number {
        // Determine the angle BAC in the plane P where this is A.
        // The angle lies between -pi and pi (-180 degrees and 180 degrees)
        let Bx : number = B.x - this._x, Cx = C.x - this._x;
        let By : number = B.y - this._y, Cy = C.y - this._y;
        if (P.isScreen) {
            return Math.atan2 (Bx*Cy - By*Cx, Bx*Cx + By*Cy);
        } else { // 3d case.  First get P-coordinates for B and C
            let Bz : number = B.z -this._z, Cz = C.z -this._z;
            let Bs : number = Bx * P.S.x + By * P.S.y + Bz * P.S.z;
            let Bt : number = Bx * P.T.x + By * P.T.y + Bz * P.T.z;
            let Cs : number = Cx * P.S.x + Cy * P.S.y + Cz * P.S.z;
            let Ct : number = Cx * P.T.x + Cy * P.T.y + Cz * P.T.z;
            return Math.atan2(Bs * Ct - Bt * Cs, Bs * Cs + Bt * Ct);
        }
    }

    toIntersection (
        A: PointElement,
        B: PointElement,
        C: PointElement,
        D: PointElement,
        P: PlaneElement) : PointElement {
        if (P.isScreen) {
            // move this point to where the two lines AB and CD meet
            let d0 : number = A.x*B.y - A.y*B.x;
            let d1 : number = C.x*D.y - C.y*D.x;
            let den : number = (B.y-A.y)*(C.x-D.x) - (A.x-B.x)*(D.y-C.y);
            this._x = (d0*(C.x-D.x) - d1*(A.x-B.x)) / den;
            this._y = (d1*(B.y-A.y) - d0*(D.y-C.y)) / den;
        } else { // 3d case
            let AmA : PointElement = PointElement.difference(A,P.A);
            let BmA : PointElement = PointElement.difference(B,P.A);
            let CmA : PointElement = PointElement.difference(C,P.A);
            let DmA : PointElement = PointElement.difference(D,P.A);
            let Ax = PointElement.dot(AmA,P.S);
            let Ay = PointElement.dot(AmA,P.T);
            let Bx = PointElement.dot(BmA,P.S);
            let By = PointElement.dot(BmA,P.T);
            let Cx = PointElement.dot(CmA,P.S);
            let Cy = PointElement.dot(CmA,P.T);
            let Dx = PointElement.dot(DmA,P.S);
            let Dy = PointElement.dot(DmA,P.T);
            let d0 = Ax*By - Ay*Bx;
            let d1 = Cx*Dy - Cy*Dx;
            let den = (By-Ay)*(Cx-Dx) - (Ax-Bx)*(Dy-Cy);
            let s = (d0*(Cx-Dx) - d1*(Ax-Bx)) / den;
            let t = (d1*(By-Ay) - d0*(Dy-Cy)) / den;
            this.to(P.S).times(s).plus(PointElement.product(t,P.T)).plus(P.A);
        }
        return this;
    }

    toIntersectionPL (
        P: PlaneElement,
        D: PointElement,
        E: PointElement) : PointElement {
        // move this point to where the plane P meets the line DE
        this.to(E).minus(D);
        let DmA : PointElement = PointElement.difference(D,P.A);
        let u : number =   -PointElement.triple(P.S,P.T,DmA)
                          / PointElement.triple(P.S,P.T,this);
        return this.times(u).plus(D);
    }

    toInvertPoint (A: PointElement, C: CircleElement) : PointElement {
        // move this point to the inversion of the point A in the circle C
        let factor : number = C.radius2 / A.distance2(C.Center);
        return this.to(A).minus(C.Center).times(factor).plus(C.Center);
    }

    toSimilar (
        A: PointElement,
        B: PointElement,
        P : PlaneElement,
        D: PointElement,
        E: PointElement,
        F: PointElement,
        Q: PlaneElement) : PointElement {
        // move this point to the location C so that triangle ABC is similar
        // to triangle DEF.
        let theta : number = D.angle(E,F,Q);
        let co : number = Math.cos(theta), si  : number = Math.sin(theta);
        let factor : number = D.distance(F) / D.distance(E);
        if (P.isScreen) {
            this._x = B.x;
            this._y = B.y;
            this.rotate(A,co,si,P);
            this._x = A.x + factor*(this._x - A.x);
            this._y = A.y + factor*(this._y - A.y);
            this._z = 0.0;
        } else {
            let BmA : PointElement = PointElement.difference(B,A);
            let  s : number = PointElement.dot(BmA,P.S);
            let  t : number = PointElement.dot(BmA,P.T);
            let ss : number = factor*(co*s - si*t);
            let tt : number = factor*(si*s + co*t);
            this._x = ss*P.S.x + tt*P.T.x + A.x;
            this._y = ss*P.S.y + tt*P.T.y + A.y;
            this._z = ss*P.S.z + tt*P.T.z + A.z;
        }
        return this;
    }

    public rotate ( pivot : PointElement,
                       ac : number,
                       as : number,
                       plane?: PlaneElement) : void {
        /*--------------------------------------------------------------------------+
        | Scale and rotate this point around the axis through the pivot and		|
        | perpendicular to the plane.  Scale by a factor of a, and rotate by the	|
        | angle theta where ac = a cos theta, and as = a sin theta.			|
        +--------------------------------------------------------------------------*/
        if (plane == null) plane = pivot._AP;
        if (this == pivot) return;
        if (plane.isScreen) {
            let dx : number = this.x - pivot.x;
            let dy : number = this.y - pivot.y;
            this._x = pivot.x + ac*dx - as*dy;
            this._y = pivot.y + as*dx + ac*dy;
        } else {
            this.minus(pivot);
            let S : PointElement = plane.S;
            let T : PointElement = plane.T;
            let U : PointElement = plane.U;
            let s : number = PointElement.dot(this,S);
            let t : number = PointElement.dot(this,T);
            let z1 : number = PointElement.dot(this,U);
            let x1 : number = ac*s - as*t;
            let y1 : number = as*s + ac*t;
            this._x = pivot.x + x1*S.x + y1*T.x + z1*U.x;
            this._y = pivot.y + x1*S.y + y1*T.y + z1*U.y;
            this._z = pivot.z + x1*S.z + y1*T.z + z1*U.z;
        }
    }

    public drawName(c: SlateCanvas): void {
        if (this.nameColor != null && this.name != null && this.defined()) {
            this.drawString(Math.round(this.x), Math.round(this.y), c)
        }
    }

    public drawVertex(c: HTMLCanvasElement, color?: string): void {
        let ctx = c.getContext("2d");
        if (color == null) {
            if (this.shouldHighlight) {
                color = this.vertexHighlightColor;
            } else {
                color = this.vertexColor;
            }
        }
        if (color == null) return;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(this._x, this._y, 2, 0, 2*Math.PI, false);
        ctx.fill();
    }


    public translate(dx: number, dy: number): void {
        this._x += dx;
        this._y += dy;
    }

    public update(): void {
    }

    public drawEdge(c: SlateCanvas): void {
    }

    public drawFace(c: SlateCanvas): void {
    }
}
