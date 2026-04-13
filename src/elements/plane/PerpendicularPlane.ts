/*----------------------------------------------------------------------+
|    Title:	PerpendicularPlane.ts                                       |
|    Originally: PerpendicularPL.java (renamed for clarity)            |
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
|    TypeScript Port: 2024, Nelson Brown, brownnrl@gmail.com            |
|                           https://www.nelsonbrown.net/                |
+----------------------------------------------------------------------*/

import {PointElement} from "../point/PointElement";
import {PlaneElement} from "./PlaneElement";

export interface IPerpendicularPlaneElementConstruction {
    A : PointElement;
    E : PointElement;
}

export class PerpendicularPlane extends PlaneElement {

    // this is the plane perpendicular to the line AE at the point A

    public E : PointElement;

    constructor(ippe? : IPerpendicularPlaneElementConstruction) {
        super();
        this.A = ippe.A;
        this.E = ippe.E;
        this.B = new PointElement({AP: this});
        this.C = new PointElement({AP: this});
        this.S = new PointElement();
        this.T = new PointElement();
    }

    translate(dx: number, dy: number) : void {
        this.B.translate(dx, dy);
        this.C.translate(dx, dy);
    }

    rotate(pivot : PointElement, ac: number, as: number) {
        this.B.rotate(pivot, ac, as);
        this.C.rotate(pivot, ac, as);
        super.update();
    }

    update() {
        this.U = PointElement.difference(this.E,this.A);
        let len : number = this.U.length();
        // TODO: Check division by 0?
        this.U.times(1.0/len);
        let lxy : number = Math.sqrt(this.U.x*this.U.x + this.U.y*this.U.y);
        if(lxy >= 0.000001) {
            this.S.x = -this.U.y/lxy;
            this.S.y = this.U.x/lxy;
            this.T.toCross(this.U,this.S);
        } else {
            this.S.x = 1.0;
            this.S.y = 0.0;
            this.S.z = 0.0;
            this.T.x = 0.0;
            this.T.y = 1.0;
            this.T.z = 0.0;
        }
        this.B.to(this.S).times(len).plus(this.A);
        this.C.to(this.T).times(len).plus(this.A);
    }
}
