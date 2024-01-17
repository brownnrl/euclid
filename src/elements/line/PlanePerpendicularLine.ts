/*----------------------------------------------------------------------+
|    Title:	PlanePerpendicularLine.ts                                   |
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
|    TypeScript Port: 2023, Nelson Brown, brownnrl@gmail.com            |
|                           https://www.nelsonbrown.net/                |
+----------------------------------------------------------------------*/

import {PointElement} from "../point/PointElement";
import {SlateCanvas} from "../../Slate";
import {LineElement} from "./LineElement";
import {PlaneElement} from "../plane/PlaneElement";
import {IPerpendicularElementConstructor} from "./Perpendicular";

export interface IPlanePerpendicularLineConstructor {
    C : PointElement;
    P : PlaneElement;
    D : PointElement;
    E : PointElement;
}

export class PlanePerpendicularLine extends LineElement {
  
    // draw perpendicular at C to the plane P.  A is the proj of C onto P, while
    // AB is perpendicular to P and equal to DE

    protected _C : PointElement;
    protected _P : PlaneElement;
    protected _D : PointElement;
    protected _E : PointElement;
    
    // The line AB will be perpendicular to the plane P.  A will be the projection
    // of C on to the plane P.  AB will equal DE.

    constructor(ipe?: IPlanePerpendicularLineConstructor) {
        super();
        this.dimension = 1;
        if(ipe == null) return;
        this._A = new PointElement({AP: ipe.P});
        this._B = new PointElement();
        this._C = ipe.C;
        this._D = ipe.D;
        this._E = ipe.E;
        this._P = ipe.P;
    }

    public rotate(pivot: PointElement, ac: number, as: number): void {
        this.A.rotate(pivot, ac, as);
        this.B.rotate(pivot, ac, as);
    }

    public translate(dx: number, dy: number): void {
        this.A.translate(dx,dy);
        this.B.translate(dx,dy);
    }

    public update(): void {
        this._A.to(this._C).toPlane(this._P);
        this._B.toCross(this._P.S, this._P.T);
        this._B.times(this._D.distance(this._E)).plus(this._A)
    }
}
