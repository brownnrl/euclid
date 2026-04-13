/*----------------------------------------------------------------------+
|    Title:	SphereSliderElement.ts                                      |
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
import {SphereElement} from "../sphere/SphereElement";

export class SphereSliderElement extends PointElement {

  private _S: SphereElement;
  private _initx: number;
  private _inity: number;
  private _initz: number;

  constructor(S: SphereElement, x: number, y: number, z: number) {
    super();
    this.dimension = 0;
    this.draggable = true;
    this._S = S;
    this._x = this._initx = x;
    this._y = this._inity = y;
    this._z = this._initz = z;
  }

  public reset() {
    this._x = this._initx;
    this._y = this._inity;
    this._z = this._initz;
    this.toSphere(this._S.Center, this._S.radius);
  }

  public update() {
    this.toSphere(this._S.Center, this._S.radius);
  }

  public drag(tox: number, toy: number): boolean {
    let dist2 = (this._S.Center.x - tox) * (this._S.Center.x - tox)
              + (this._S.Center.y - toy) * (this._S.Center.y - toy);
    let r2 = this._S.radius2;
    if (dist2 <= r2) {
      this._x = tox;
      this._y = toy;
      if (this._z > this._S.Center.z)
        this._z = this._S.Center.z + Math.sqrt(r2 - dist2);
      else
        this._z = this._S.Center.z - Math.sqrt(r2 - dist2);
    } else {
      // beyond shadow of sphere
      tox -= this._S.Center.x;
      toy -= this._S.Center.y;
      let factor = Math.sqrt((tox * tox + toy * toy) / r2);
      tox = tox / factor + this._S.Center.x;
      toy = toy / factor + this._S.Center.y;
      if ((tox - this._x) * (tox - this._x) + (toy - this._y) * (toy - this._y) < 0.5)
        return false;
      this._x = tox;
      this._y = toy;
      this._z = this._S.Center.z;
    }
    return true;
  }
}
