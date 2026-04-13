/*----------------------------------------------------------------------+
|    Title:	ParallelPlane.ts                                            |
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

import {PlaneElement} from "./PlaneElement";
import {PointElement} from "../point/PointElement";

export class ParallelPlane extends PlaneElement {
  /*--------------------------------------------------------------------+
  | this is the plane parallel to the plane P passing through the       |
  | point A                                                             |
  +--------------------------------------------------------------------*/

  private _P: PlaneElement;

  constructor(P: PlaneElement, A: PointElement) {
    super();
    this.dimension = 2;
    this._P = P;
    this.A = A;
    this.B = new PointElement();
    this.C = new PointElement();
    this.S = P.S;
    this.T = P.T;
    this.U = P.U;
  }

  public translate(dx: number, dy: number) {
    this.B.translate(dx, dy);
    this.C.translate(dx, dy);
  }

  public rotate(pivot: PointElement, ac: number, as: number) {
    this.B.rotate(pivot, ac, as);
    this.C.rotate(pivot, ac, as);
  }

  public update() {
    this.B.to(this._P.B).minus(this._P.A).plus(this.A);
    this.C.to(this._P.C).minus(this._P.A).plus(this.A);
  }
}
