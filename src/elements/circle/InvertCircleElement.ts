/*----------------------------------------------------------------------+
|    Title:	InvertCircleElement.ts                                      |
|    Originally: InvertCircle.java                                      |
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

import {CircleElement} from "./CircleElement";
import {PointElement} from "../point/PointElement";

export class InvertCircleElement extends CircleElement {
  /*--------------------------------------------------------------------+
  | Invert the circle C in the circle D to get this circle.  It is      |
  | assumed that C and D lie in the same plane C.AP.                    |
  +--------------------------------------------------------------------*/

  private _C: CircleElement;
  private _D: CircleElement;

  constructor(C: CircleElement, D: CircleElement) {
    super();
    this.dimension = 2;
    this._C = C;
    this._D = D;
    this.AP = C.AP;
    this.Center = new PointElement({AP: this.AP});
    this.A = this.Center;
    this.B = new PointElement({AP: this.AP});
  }

  public update() {
    let d2 = this._C.Center.distance2(this._D.Center);
    let r2 = this._C.radius2;
    let factor = this._D.radius2 / (d2 - r2);
    this.Center.to(this._C.Center).minus(this._D.Center).times(factor).plus(this._D.Center);
    factor = 1.0 + Math.sqrt(r2 / d2);
    this.B.to(this.Center).minus(this._D.Center).times(factor).plus(this._D.Center);
  }

  public translate(dx: number, dy: number) {
    this.Center.translate(dx, dy);
    this.B.translate(dx, dy);
  }

  public rotate(pivot: PointElement, ac: number, as: number) {
    this.Center.rotate(pivot, ac, as);
    this.B.rotate(pivot, ac, as);
  }
}
