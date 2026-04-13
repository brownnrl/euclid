/*----------------------------------------------------------------------+
|    Title:	PyramidElement.ts                                           |
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

export class PyramidElement extends PolyhedronElement {

    constructor(Base: PolygonElement, Apex: PointElement) {
        super();
        this.dimension = 2;
        let n = 1 + Base.V.length;
        this.P = new Array(n);
        this.P[0] = Base;
        for (let i = 1; i < n; ++i) {
            this.P[i] = new PolygonElement([Apex, Base.V[i - 1], Base.V[i % Base.V.length]]);
        }
    }
}
