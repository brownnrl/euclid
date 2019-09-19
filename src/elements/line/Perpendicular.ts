/*----------------------------------------------------------------------+
|    Title:	Perpendicular.ts                                            |
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
|    TypeScript Port: 2019, Nelson Brown, brownnrl@gmail.com            |
|                           https://www.nelsonbrown.net/                |
+----------------------------------------------------------------------*/


import {PointElement} from "../point/PointElement";
import {SlateCanvas} from "../../Slate";
import {LineElement} from "./LineElement";
import {PlaneElement} from "../plane/PlaneElement";

interface IPerpendicularElementConstructor {
    C : PointElement;
    D : PointElement;
    P : PlaneElement;
    E : PointElement;
    F : PointElement;
}

export class Perpendicular extends LineElement {
    // draw perpendicular to CD in the plane P.  A is the proj of
    // C onto P, while AB is perpendicular to CD and equals EF.

    protected _C : PointElement;
    protected _D : PointElement;
    protected _E : PointElement;
    protected _F : PointElement;
    protected _P : PlaneElement;

    constructor(ipe?: IPerpendicularElementConstructor) {
        super();
        this.dimension = 1;
        if(ipe == null) return;
        this._P = ipe.P;
        this._A = new PointElement({AP: ipe.P});
        this._B = new PointElement({AP: ipe.P});
        this._C = ipe.C;
        this._D = ipe.D;
        this._E = ipe.E;
        this._F = ipe.F;
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
        this._B.to(this._D).minus(this._A);
        let Bs : number = PointElement.dot(this.B,this._P.S);
        let Bt : number = PointElement.dot(this.B,this._P.T);
        let factor : number = Math.sqrt(this._E.distance2(this._F)/(Bs*Bs+Bt*Bt));
        Bs = -Bs/factor;
        Bt /= factor;
        this._B.x = Bt*this._P.S.x + Bs*this._P.T.x + this._A.x;
        this._B.y = Bt*this._P.S.y + Bs*this._P.T.y + this._A.y;
        this._B.z = Bt*this._P.S.z + Bs*this._P.T.z + this._A.z;
    }
}
