/*----------------------------------------------------------------------+
|    Title:	RegularPolygonElement.ts                                    |
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

import {PolygonElement} from "./PolygonElement";
import {PointElement} from "../point/PointElement";
import {PlaneElement} from "../plane/PlaneElement";

export class RegularPolygonElement extends PolygonElement {

    private _cos: number;
    private _sin: number;
    private _P: PlaneElement;

    constructor(A: PointElement, B: PointElement, plane: PlaneElement, n: number) {
        super();
        this._P = plane;
        const theta = Math.PI * (n - 2) / n;
        this._cos = Math.cos(theta);
        this._sin = Math.sin(theta);
        this.V = new Array(n);
        this.V[0] = A;
        this.V[1] = B;
        for (let i = 2; i < n; i++) {
            this.V[i] = new PointElement({ AP: plane });
        }
    }

    update(): void {
        for (let i = 2; i < this.V.length; i++) {
            this.V[i].to(this.V[i - 2]);
            this.V[i].rotate(this.V[i - 1], this._cos, this._sin, this._P);
        }
    }

    translate(dx: number, dy: number): void {
        for (let i = 2; i < this.V.length; i++) {
            this.V[i].translate(dx, dy);
        }
    }

    rotate(pivot: PointElement, ac: number, as: number): void {
        for (let i = 2; i < this.V.length; i++) {
            this.V[i].rotate(pivot, ac, as, this._P);
        }
    }
}
