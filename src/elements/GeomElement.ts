/*----------------------------------------------------------------------+
|    Title:	GeomElement.ts                                              |
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

import {Point, PointText, Rectangle, Color} from "paper";

export enum Position {
    CENTRAL,
    LEFT,
    RIGHT,
    ABOVE,
    BELOW
}

export abstract class GeomElement {

    constructor() {
    }

    protected _canvas: HTMLCanvasElement;

    protected _name: string;
    protected _nameColor: Color;
    protected _vertexColor : Color;
    protected _edgeColor : Color;
    protected _faceColor : Color;

    protected _draggable : boolean;
    protected _dimension : number;

    protected _align : Position;

    protected _shouldHighlight : boolean;
    protected _pixelTolerance : number;

    public set canvas(c: HTMLCanvasElement) {
        this._canvas = c
    }

    public get canvas() : HTMLCanvasElement{
        return this._canvas
    }

    drawString(ix : number, iy : number, d: Rectangle) {
        let p = new Point(ix, iy);
        let text = new PointText(p);
        text.content = this._name;
        let w = text.bounds.width;
        let h = text.bounds.height;

        switch (this._align) {
            case Position.LEFT:
                text.point = new Point(ix-w-6, iy+h/2-4);
                return;
            case Position.RIGHT:
                text.point = new Point(ix+2, iy+h/2-4);
                return;
            case Position.ABOVE:
                text.point = new Point(ix-w/2, iy+h/2+4);
                return;
            case Position.BELOW:
                text.point = new Point(ix-w/2, iy+h/2+6);
                return;
        }
        // compute (dx,dy) coordinates relative to center of canvas
        // and normalized
        let dx = (ix - d.width/2) * d.height;
        let dy = (iy - d.height/2) * d.width;
        if (dy > dx) {
            if (dy >= -dx)	// put name below
                text.point = new Point( ix-w/2, iy+h/2+6);
            else 		// put name left
                text.point = new Point( ix-w-6, iy+h/2-4);
        }
        else {
            if (dy >= -dx)	// put name right
                text.point = new Point( ix+2, iy+h/2-4);
            else 		// put name above
                text.point = new Point( ix-w/2, iy-h/2+4);
        }
    }

    public get name() {
        return this._name;
    }

    public hitTest(x : number, y: number) : boolean {
        return false;
    }

    protected reset() { this.update(); }
    // drag returns true when the element is actually dragged
    protected drag(tox: number, toy: number) : boolean { return false; }
    protected defined() : boolean { return false; }
    protected abstract update() : void;
    protected abstract translate(dx: number, dy: number) : void;
    protected abstract rotate(pivot : Point, ac : number, as: number) : void;
    protected abstract drawName(d: Rectangle) : void;
    protected abstract drawFace() : void;
    protected abstract drawEdge() : void;
    protected abstract drawVertex() : void;

}
