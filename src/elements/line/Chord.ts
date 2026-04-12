/*----------------------------------------------------------------------+
|    Title:	Chord.ts                                                    |
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

import {LineElement} from "./LineElement";
import {CircleElement} from "../circle/CircleElement";
import {PointElement} from "../point/PointElement";

interface IChordElementConstructor {
  D : PointElement;
  E : PointElement;
  C : CircleElement;
}

export class Chord extends LineElement {
  /*--------------------------------------------------------------------+
  | This line AB is the segment of the line DE (extended) that          |
  | intersects the circle C.  It is assumed that DE and C lie in the    |
  | same plane, namely that of C.                                       |
  +--------------------------------------------------------------------*/

  public C: CircleElement;
  public D: PointElement;
  public E: PointElement;

  constructor(ice? : IChordElementConstructor) {
    super();
    this.dimension = 1;
    if (ice == null) return;

    this.C = ice.C;
    this.D = ice.D;
    this.E = ice.E;
    this._A = new PointElement({AP: this.C.AP});
    this._B = new PointElement({AP: this.C.AP});
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
    this._B.to(this.C.Center).toLine(this.D, this.E, false);
    let d2 : number = this.C.Center.distance2(this._B);
    let r2 : number = this.C.radius2;
    if (d2 > r2) {
      let v = 0.0/0.0;
      this._A.x = v;
      this._A.y = v;
      this._A.z = v;
      this._B.x = v;
      this._B.y = v;
      this._B.z = v;
      return;
    }
    let s : number = Math.sqrt(r2 - d2);
    let factor : number = s / this.D.distance(this._B);
    if (factor < 1e10) {
      this._A.to(this.D).minus(this._B).times(factor).plus(this._B);
    } else {
      factor = s / this.E.distance(this._B);
      this._A.to(this.E).minus(this._B).times(factor).plus(this._B);
    }
    this._B.times(2.0).minus(this._A);
  }

}
