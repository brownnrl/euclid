/*----------------------------------------------------------------------+
|    Title:	ApplicationElement.ts                                       |
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
|    TypeScript Port: 2026, Nelson Brown, brownnrl@gmail.com            |
|                           https://www.nelsonbrown.net/                |
+----------------------------------------------------------------------*/

import {PolygonElement} from "./PolygonElement";
import {PointElement} from "../point/PointElement";

export class ApplicationElement extends PolygonElement {
  /*--------------------------------------------------------------------+
  | Apply a polygon P to get a parallelogram                            |
  | with a side AB in an angle CAB                                      |
  +--------------------------------------------------------------------*/

  private _P: PolygonElement;
  private _C: PointElement;

  constructor(P: PolygonElement, A: PointElement, B: PointElement, C: PointElement) {
    super();
    this.dimension = 2;
    this._P = P;
    this._C = C;
    this.V = new Array(4);
    this.V[0] = A;
    this.V[1] = B;
    this.V[2] = new PointElement();
    this.V[3] = new PointElement();
    if (A._AP === B._AP && A._AP === C._AP) {
      this.V[2]._AP = A._AP;
      this.V[3]._AP = A._AP;
    }
  }

  public translate(dx: number, dy: number) {
    this.V[2].translate(dx, dy);
    this.V[3].translate(dx, dy);
  }

  public rotate(pivot: PointElement, ac: number, as: number) {
    this.V[2].rotate(pivot, ac, as);
    this.V[3].rotate(pivot, ac, as);
  }

  public update() {
    let factor : number = this._P.area() / (2.0 * PointElement.area(this.V[0], this.V[1], this._C));
    factor = Math.abs(factor);
    this.V[3].x = this.V[0].x + factor * (this._C.x - this.V[0].x);
    this.V[3].y = this.V[0].y + factor * (this._C.y - this.V[0].y);
    this.V[3].z = this.V[0].z + factor * (this._C.z - this.V[0].z);
    this.V[2].x = this.V[1].x + this.V[3].x - this.V[0].x;
    this.V[2].y = this.V[1].y + this.V[3].y - this.V[0].y;
    this.V[2].z = this.V[1].z + this.V[3].z - this.V[0].z;
  }
}
