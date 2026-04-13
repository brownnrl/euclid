/*----------------------------------------------------------------------+
|    Title:	PrismElement.ts                                             |
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

import {PolyhedronElement} from "./PolyhedronElement";
import {PolygonElement} from "../polygon/PolygonElement";
import {PointElement} from "../point/PointElement";

export class PrismElement extends PolyhedronElement {

  // The base is given as well as a line segment CD for the sides to be
  // parallel to.

  private _C: PointElement;
  private _D: PointElement;

  constructor(Base: PolygonElement, C: PointElement, D: PointElement) {
    super();
    this.dimension = 2;
    this._C = C;
    this._D = D;
    let baseN = Base.V.length;
    let n = 2 + baseN;
    this.P = new Array(n);
    this.P[0] = Base;
    // create the top — vertices translated by (D-C) from base
    let topVerts : PointElement[] = new Array(baseN);
    for (let j = 0; j < baseN; ++j) {
      topVerts[j] = new PointElement();
      topVerts[j].to(Base.V[j]).plus(D).minus(C);
    }
    this.P[1] = new PolygonElement(topVerts);
    // create the sides — quadrilaterals connecting base and top edges
    for (let i = 2; i < n; ++i) {
      this.P[i] = new PolygonElement([
        Base.V[i - 2],
        Base.V[(i - 1) % baseN],
        this.P[1].V[(i - 1) % baseN],
        this.P[1].V[i - 2]
      ]);
    }
  }

  public translate(dx: number, dy: number) {
    for (let i = 0; i < this.P[1].V.length; ++i) {
      this.P[1].V[i].translate(dx, dy);
    }
  }

  public rotate(pivot: PointElement, ac: number, as: number) {
    for (let i = 0; i < this.P[1].V.length; ++i) {
      this.P[1].V[i].rotate(pivot, ac, as);
    }
  }

  public update() {
    for (let j = 0; j < this.P[1].V.length; ++j) {
      this.P[1].V[j].to(this.P[0].V[j]).plus(this._D).minus(this._C);
    }
  }
}
