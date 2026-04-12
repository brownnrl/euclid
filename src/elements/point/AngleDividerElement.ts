/*----------------------------------------------------------------------+
|    Title:	AngleDividerElement.ts                                      |
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

import {PointElement} from "./PointElement";
import {PlaneElement} from "../plane/PlaneElement";

export class AngleDividerElement extends PointElement {
  /*--------------------------------------------------------------------+
  | n-sect angle BAC in the ambient plane AP                            |
  +--------------------------------------------------------------------*/

  private _A: PointElement;  // vertex of the angle
  private _B: PointElement;  // first ray point
  private _C: PointElement;  // second ray point
  private _n: number;        // divisor (2 = bisector)

  constructor(B: PointElement, A: PointElement, C: PointElement,
              AP: PlaneElement, n: number) {
    super();
    this.dimension = 0;
    this._A = A;
    this._B = B;
    this._C = C;
    this._AP = AP;
    this._n = n;
  }

  public update() {
    let theta : number = this._A.angle(this._B, this._C, this._AP) / this._n;
    let cos : number = Math.cos(theta);
    let sin : number = Math.sin(theta);
    if (this._AP.isScreen) {
      this._x = this._A.x + cos * (this._B.x - this._A.x) - sin * (this._B.y - this._A.y);
      this._y = this._A.y + sin * (this._B.x - this._A.x) + cos * (this._B.y - this._A.y);
      this._z = 0.0;
    } else {
      this.to(this._B).rotate(this._A, cos, sin, this._AP);
    }
    this.toIntersection(this, this._A, this._B, this._C, this._AP);
  }
}
