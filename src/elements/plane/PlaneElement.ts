/*----------------------------------------------------------------------+
|    Title:	PlaneElement.ts                                             |
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
import {PointElement} from "../point/PointElement";
import {SlateCanvas} from "../../Slate";


export interface IPlaneElementConstruction {
    A : PointElement;
    B : PointElement;
    C : PointElement;
}

type iplec = IPlaneElementConstruction

export class PlaneElement extends GeomElement {

    /*--------------------------------------------------------------------+
    | The plane is represented by three points on it.  It's displayed as  |
    | a parallelogram with three vertices A, B, and C,projected onto the  |
    | xy-plane. S is a unit vector in the direction AB, T is a            |
    | perpendicular unit in the plane, and U is perpendicular to both.    |
    +--------------------------------------------------------------------*/
    public A : PointElement;
    public B : PointElement;
    public C : PointElement;
    public S : PointElement;
    public T : PointElement;
    public U : PointElement;

    public isScreen : boolean;

    constructor(ip? : IPlaneElementConstruction) {
        super();
        this.dimension = 2;
        this.isScreen = false;
        if (ip != null) {
            this.A = ip.A;
            this.B = ip.B;
            this.C = ip.C;
            this.S = new PointElement();
            this.T = new PointElement();
            this.U = new PointElement();
        }
    }

    public drawEdge(c: SlateCanvas): void {
    }

    public drawFace(c: SlateCanvas): void {
    }

    public drawName(c: SlateCanvas): void {
    }

    public drawVertex(c: SlateCanvas): void {
    }

    public rotate(pivot: PointElement, ac: number, as: number): void {
        this.update();
    }

    public translate(dx: number, dy: number): void {
    }

    public update(): void {
        if (this.isScreen && (this.A.z!=0.0 || this.B.z!=0.0 || this.C.z!=0.0))
            this.isScreen = false;
        // update the frame S,T,U
        this.S.to(this.B).minus(this.A);
        this.T.to(this.C).minus(this.A);
        this.S.times(1.0/this.S.length());
        let st : number = PointElement.dot(this.T, this.S);
        this.T.x -= st*this.S.x;
        this.T.y -= st*this.S.y;
        this.T.z -= st*this.S.z;
        this.T.times(1.0/this.T.length());
        this.U.toCross(this.S,this.T);
    }
}
