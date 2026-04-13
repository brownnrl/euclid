/*----------------------------------------------------------------------+
|    Title:	InvertPointElement.ts                                       |
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
import {CircleElement} from "../circle/CircleElement";

export class InvertPointElement extends PointElement {
  /*--------------------------------------------------------------------+
  | Invert the point A in the circle C to get this point                |
  +--------------------------------------------------------------------*/

  private _A: PointElement;
  private _C: CircleElement;

  constructor(A: PointElement, C: CircleElement) {
    super();
    this.dimension = 0;
    this._A = A;
    this._C = C;
    this._AP = C.AP;
  }

  public update() {
    this.toInvertPoint(this._A, this._C);
  }
}
