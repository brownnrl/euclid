/*----------------------------------------------------------------------+
|    Title:	SimilarElement.ts                                           |
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
import {PlaneElement} from "../plane/PlaneElement";

export class SimilarElement extends PointElement {
  /*--------------------------------------------------------------------+
  | Construct a triangle AB(this) in the plane AP similar to the        |
  | triangle DEF in the plane Q.                                        |
  +--------------------------------------------------------------------*/

  private _parentA: PointElement;
  private _parentB: PointElement;
  private _D: PointElement;
  private _E: PointElement;
  private _F: PointElement;
  private _Q: PlaneElement;

  constructor(A: PointElement, B: PointElement, AP: PlaneElement,
              D: PointElement, E: PointElement, F: PointElement,
              Q: PlaneElement) {
    super();
    this.dimension = 0;
    this._parentA = A;
    this._parentB = B;
    this._AP = AP;
    this._D = D;
    this._E = E;
    this._F = F;
    this._Q = Q;
  }

  public update() {
    this.toSimilar(this._parentA, this._parentB, this._AP,
                   this._D, this._E, this._F, this._Q);
  }
}
