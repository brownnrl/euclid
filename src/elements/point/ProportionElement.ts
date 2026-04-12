/*----------------------------------------------------------------------+
|    Title:	ProportionElement.ts                                        |
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

export class ProportionElement extends PointElement {
  /*--------------------------------------------------------------------+
  | Given lines S(S0,S1), T(T0,T1), U(U0,U1), V(V0,V1), cut off from  |
  | V a fourth proportional V' so that S:T = U:V'.                     |
  +--------------------------------------------------------------------*/

  private _S0: PointElement;
  private _S1: PointElement;
  private _T0: PointElement;
  private _T1: PointElement;
  private _U0: PointElement;
  private _U1: PointElement;
  private _V0: PointElement;
  private _V1: PointElement;

  constructor(S0: PointElement, S1: PointElement, T0: PointElement,
              T1: PointElement, U0: PointElement, U1: PointElement,
              V0: PointElement, V1: PointElement) {
    super();
    this.dimension = 0;
    this._S0 = S0; this._S1 = S1;
    this._T0 = T0; this._T1 = T1;
    this._U0 = U0; this._U1 = U1;
    this._V0 = V0; this._V1 = V1;
    if (V0._AP === V1._AP) {
      this._AP = V0._AP;
    }
  }

  public update() {
    let factor : number = this._T0.distance2(this._T1) * this._U0.distance2(this._U1)
                        / (this._S0.distance2(this._S1) * this._V0.distance2(this._V1));
    factor = Math.sqrt(factor);
    this.to(this._V1).minus(this._V0);
    this.times(factor).plus(this._V0);
  }
}
