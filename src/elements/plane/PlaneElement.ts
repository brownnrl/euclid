/*----------------------------------------------------------------------+
|    Title:	PlaneElement.ts                                             |
|                                                                       |
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

import {GeomElement} from "../GeomElement";
import {PointElement} from "../point/PointElement";

export class PlaneElement extends GeomElement {

    public A : PointElement;
    public B : PointElement;
    public C : PointElement;
    public S : PointElement;
    public T : PointElement;
    public U : PointElement;

    public isScreen : boolean;


    constructor() {
        super();
        this.isScreen = false;
    }

    protected drawEdge(): void {
    }

    protected drawFace(): void {
    }

    protected drawName(d: paper.Rectangle): void {
    }

    protected drawVertex(): void {
    }

    protected rotate(pivot: paper.Point, ac: number, as: number): void {
    }

    protected translate(dx: number, dy: number): void {
    }

    protected update(): void {
    }
}
