/*----------------------------------------------------------------------+
|    Title:	HarmonicElement.ts                                          |
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

export class HarmonicElement extends PointElement {
  /*--------------------------------------------------------------------+
  | The harmonic conjugate A of B with respect to the points C and D.   |
  | If B,C,D are collinear, then A also lies on that line; if not,      |
  | A lies on the circumcircle through B,C,D.                           |
  +--------------------------------------------------------------------*/

  private _B: PointElement;
  private _C: PointElement;
  private _D: PointElement;
  private _E: PointElement;
  private _F: PointElement;
  private _M: PointElement;

  constructor(B: PointElement, C: PointElement, D: PointElement) {
    super();
    this.dimension = 0;
    this._B = B;
    this._C = C;
    this._D = D;
    this._E = new PointElement();
    this._F = new PointElement();
    this._M = new PointElement();
  }

  public update() {
    if (this._B.z === 0.0 && this._C.z === 0.0 && this._D.z === 0.0) {
      // 2D case: treat B,C,D as complex numbers
      // A = (C(B-D) + D(B-C)) / ((B-D) + (B-C))
      let Ex = this._B.x - this._C.x, Ey = this._B.y - this._C.y;
      let Fx = this._B.x - this._D.x, Fy = this._B.y - this._D.y;
      let BFx = this._C.x * Fx - this._C.y * Fy;
      let BFy = this._C.x * Fy + this._C.y * Fx;
      let DEx = this._D.x * Ex - this._D.y * Ey;
      let DEy = this._D.x * Ey + this._D.y * Ex;
      let den = (Fx + Ex) * (Fx + Ex) + (Fy + Ey) * (Fy + Ey);
      let numx = (BFx + DEx) * (Fx + Ex) + (BFy + DEy) * (Fy + Ey);
      let numy = -(BFx + DEx) * (Fy + Ey) + (BFy + DEy) * (Fx + Ex);
      this._x = numx / den;
      this._y = numy / den;
    } else {
      // 3D case
      this._M.to(this._C).plus(this._D).times(0.5);     // M = (C+D)/2
      this._F.to(this._C).minus(this._M);                // F = C-M
      this._E.to(this._B).minus(this._M);                // E = B-M
      let rB2 = 1.0 / this._E.length2();
      let C2 = this._F.length2();
      this.to(this._F)
          .times(2.0 * PointElement.dot(this._E, this._F))
          .minus(this._E.times(C2))
          .times(rB2)
          .plus(this._M);
    }
  }
}
