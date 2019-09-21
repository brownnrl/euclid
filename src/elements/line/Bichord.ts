/*----------------------------------------------------------------------+
|    Title:	Bichord.ts                                                  |
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

import {LineElement} from "./LineElement";
import {CircleElement} from "../circle/CircleElement";
import {PointElement} from "../point/PointElement";

interface IBichordElementConstructor {
  C : CircleElement;
  D : CircleElement;
}

export class Bichord extends LineElement {
  /*--------------------------------------------------------------------+
 | This line AB connects the two points where the two circles C and D   |
 | meet. It is assumed that the two circles lie in the same plane, the  |
 | plane of C.                                                          |
 +--------------------------------------------------------------------*/

  public C: CircleElement;
  public D: CircleElement;

  constructor(ibe? : IBichordElementConstructor) {
    super();
    this.dimension = 1;
    if (ibe == null) return;

    this._A = new PointElement();
    this._B = new PointElement();
    this.C = ibe.C;
    this.D = ibe.D;
    this._A._AP = this.C.AP;
    this._B._AP = this.C.AP;
  }

  public translate(dx: number, dy: number) {
    this._A.translate(dx, dy);
    this._B.translate(dx, dy);
  }

  public rotate(pivot : PointElement, ac : number, as : number) {
    this._A.rotate(pivot, ac, as);
    this._B.rotate(pivot, ac, as);
  }

  public update() {
    let r : number = this.C.radius;
    let s : number = this.D.radius;
    let d : number = this.C.Center.distance(this.D.Center);
    if (d > r + s) {
      let v = 0.0/0.0;
      this.A.x = v;
      this.A.y = v;
      this.A.z = v;
      this.B.x = v;
      this.B.y = v;
      this.B.z = v;
      return;
    }
    let costheta : number = (d*d + r*r - s*s) / (2.0 * d * r);
    let sintheta : number = Math.sqrt(1.0-costheta*costheta);
    this.A.to(this.D.Center).toCircle(this.C);
    this.B.to(this.A);
    this.A.rotate(this.C.Center,costheta,sintheta,this.C.AP);
    this.B.rotate(this.C.Center,costheta,-sintheta,this.C.AP);
  }

}
