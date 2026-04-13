/*----------------------------------------------------------------------+
|    Title:	SphereIntersectionElement.ts                                |
|    Originally: IntersectionSS.java (renamed for clarity)             |
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
|    Date:    May, 1997.                                                |
|    TypeScript Port: 2026, Nelson Brown, brownnrl@gmail.com            |
|                           https://www.nelsonbrown.net/                |
+----------------------------------------------------------------------*/

import {CircleElement} from "./CircleElement";
import {SphereElement} from "../sphere/SphereElement";
import {PointElement} from "../point/PointElement";
import {PerpendicularPlane} from "../plane/PerpendicularPlane";

export class SphereIntersectionElement extends CircleElement {
  /*--------------------------------------------------------------------+
  | This circle is the intersection of two spheres S and T. The center  |
  | of the circle is Center, which is A, lies in the plane AP, and      |
  | has radius AB.                                                      |
  +--------------------------------------------------------------------*/

  private _S: SphereElement;
  private _T: SphereElement;

  constructor(S: SphereElement, T: SphereElement) {
    super();
    this.dimension = 2;
    this._S = S;
    this._T = T;
    this.Center = this.A = new PointElement();
    this.B = new PointElement();
    this.AP = new PerpendicularPlane({A: this.Center, E: T.Center});
    this.Center._AP = this.AP;
  }

  public update() {
    let d2 = this._T.Center.distance2(this._S.Center);
    let t2 = this._T.radius2();
    let factor = 0.5 + (t2 - this._S.radius2()) / (2.0 * d2);
    this.Center.to(this._S.Center).minus(this._T.Center).times(factor).plus(this._T.Center);
    let radius = Math.sqrt(t2 - this.Center.distance2(this._T.Center));
    this.B.to(this.Center);
    this.B.z += radius;
    this.AP.update();
  }

  public translate(dx: number, dy: number) {
    this.Center.translate(dx, dy);
    this.B.translate(dx, dy);
    this.AP.translate(dx, dy);
  }

  public rotate(pivot: PointElement, ac: number, as: number) {
    this.Center.rotate(pivot, ac, as);
    this.B.rotate(pivot, ac, as);
    this.AP.rotate(pivot, ac, as);
  }
}
