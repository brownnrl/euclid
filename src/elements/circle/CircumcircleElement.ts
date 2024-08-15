/*----------------------------------------------------------------------+
|    Title:	Circumcenter.ts                                             |
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
|    TypeScript Port: 2024, Nelson Brown, brownnrl@gmail.com            |
+----------------------------------------------------------------------*/

// import {GeomElement} from "../GeomElement";
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "../point/PointElement";
import {CircleElement} from "./CircleElement";

export class CircumcircleElement extends CircleElement {

  /*--------------------------------------------------------------------+
  | This is the circle passing through the three points B, C, and D.	|
  | It is assumed that all three points lie in the plane AP.		|
  +--------------------------------------------------------------------*/
    public C : PointElement;
    public D : PointElement;

    constructor(B: PointElement, C : PointElement, D: PointElement, AP: PlaneElement) {
        super();
        this.dimension = 2;
        this.B = B;
        this.C = C;
        this.D = D;
        this.AP = AP;
        this.Center = new PointElement({AP:AP});
        this.A = this.Center;
    }

    update() : void { 
        this.Center.toCircumcenter(this.B,this.C,this.D); 
    }

    translate(dx: number, dy: number) {
        this.Center.translate(dx, dy);
    }

    rotate(pivot: PointElement, c: number, s: number) {
        this.Center.rotate(pivot, c, s);
    }

}
