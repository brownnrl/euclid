/*----------------------------------------------------------------------+
|    Title:	ArcElement.ts                                               |
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

import {SectorElement} from "./SectorElement";
import {PointElement} from "../point/PointElement";
import {PlaneElement} from "../plane/PlaneElement";

/**
 * Port of geom_applet/source/Arc.java — an arc through three points.
 *
 * Given points A, M, B (with M on the arc between A and B), draws the
 * arc of the unique circle passing through all three. The circle's
 * center is recomputed on every update() as circumcenter(A, M, B) and
 * stored in the inherited _Center field; SectorElement.drawEdge then
 * sweeps the arc from A to B using the inherited angle math.
 *
 * _Center is an internal bare PointElement, not registered on the
 * slate. Arc.update() writes into it directly, so it stays in sync
 * with A, M, B without needing a separate elementsForUpdate entry.
 */
export class ArcElement extends SectorElement {

    _M : PointElement;  // the "through" point on the arc between A and B

    constructor(A: PointElement, M: PointElement, B: PointElement, P: PlaneElement) {
        super();
        this.dimension = 2;
        this._Center = new PointElement();
        this._A = A;
        this._M = M;
        this._B = B;
        this._P = P;
    }

    update(): void {
        this._Center.toCircumcenter(this._A, this._M, this._B);
    }
}
