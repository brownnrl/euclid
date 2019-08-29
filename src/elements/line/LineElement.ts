/*----------------------------------------------------------------------+
|    Title:	LineElement.ts                                              |
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


import paper = require('paper');
import Rectangle = paper.Rectangle;
import {GeomElement} from "../GeomElement";
import {PointElement} from "../point/PointElement";

interface ILineElementConstructor {
    A : PointElement;
    B : PointElement;
}

export class LineElement extends GeomElement {
    protected _A : PointElement;
    get A() : PointElement { return this._A; }

    protected _B : PointElement;
    get B() : PointElement { return this._B; }

    constructor(ile?: ILineElementConstructor) {
        super();
        this._dimension = 1;
        this._A = ile && ile.A || null;
        this._B = ile && ile.B || null;
    }

    public drawEdge(): void {
    }

    public drawFace(): void {
    }

    public drawName(d: Rectangle): void {
    }

    public drawVertex(): void {
    }

    public rotate(pivot: PointElement, ac: number, as: number): void {
    }

    public translate(dx: number, dy: number): void {
    }

    public update(): void {
    }
}
