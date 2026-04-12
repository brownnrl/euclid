/*----------------------------------------------------------------------+
|    Title:	MeanProportionalElement.ts                                  |
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

export class MeanProportionalElement extends PointElement {
  /*--------------------------------------------------------------------+
  | Given lines S,T,U cut off from U a mean proportional U' so that     |
  | S:U'=U':T                                                          |
  +--------------------------------------------------------------------*/

  private _S0: PointElement;
  private _S1: PointElement;
  private _T0: PointElement;
  private _T1: PointElement;
  private _U0: PointElement;
  private _U1: PointElement;

  constructor(S0: PointElement, S1: PointElement, T0: PointElement,
              T1: PointElement, U0: PointElement, U1: PointElement) {
    super();
    this.dimension = 0;
    this._S0 = S0; this._S1 = S1;
    this._T0 = T0; this._T1 = T1;
    this._U0 = U0; this._U1 = U1;
    if (U0._AP === U1._AP) {
      this._AP = U0._AP;
    }
  }

  public update() {
    let factor : number = Math.sqrt(this._S0.distance2(this._S1) * this._T0.distance2(this._T1));
    factor = Math.sqrt(factor / this._U0.distance2(this._U1));
    this.to(this._U1).minus(this._U0);
    this.times(factor).plus(this._U0);
  }
}
