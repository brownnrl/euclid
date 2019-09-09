/*----------------------------------------------------------------------+
|    Title:	GeomElement.ts                                              |
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
import {Point, PointText, Rectangle, Color} from "paper";
import {PointElement} from "./point/PointElement"


export enum Align {
    CENTRAL,
    LEFT,
    RIGHT,
    ABOVE,
    BELOW
}

export abstract class GeomElement {

    constructor() {
    }

    protected _name: string;
    private _nameColor: Color = new Color('black');
    protected _vertexColor : Color = new Color('red');
    private _edgeColor : Color = new Color('black');
    private _faceColor : Color = new Color('blue');

    private _nameHighlightColor   : Color = new Color(255, 0, 0); // Color.red;
    private _vertexHighlightColor : Color = new Color(255,255,255); // Color.WHITE;
    private _edgeHighlightColor   : Color = new Color(255,255,255); // Color.white;
    private _faceHighlightColor   : Color = new Color(0, 255, 255); // Color.CYAN;

    protected _inTest : boolean;
    private _draggable : boolean;
    private _dimension : number;

    private _align : Align;

    private _shouldHighlight : boolean = false;
    protected _pixelTolerance : number = 50;

    protected _paperJSNameLabel : PointText = null;

    drawString(ix : number, iy : number, d: Rectangle) {
        let p = new Point(ix, iy);
        if(this._paperJSNameLabel == null) {
            this._paperJSNameLabel = new PointText(p);
            this._paperJSNameLabel.fontFamily = 'Arial';
            this._paperJSNameLabel.fontWeight = 'italic';
            this._paperJSNameLabel.fontSize = 12;
        }
        this._paperJSNameLabel.position = p;
        this._paperJSNameLabel.fillColor = this._nameColor;
        this._paperJSNameLabel.bringToFront();
        let text = this._paperJSNameLabel;
        text.content = this._name;
        let w = text.bounds.width;
        let h = text.bounds.height;

        switch (this._align) {
            case Align.LEFT:
                text.point = new Point(ix-w-6, iy+h/2-4);
                return;
            case Align.RIGHT:
                text.point = new Point(ix+2, iy+h/2-4);
                return;
            case Align.ABOVE:
                text.point = new Point(ix-w/2, iy+h/2+4);
                return;
            case Align.BELOW:
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
        console.log("drawing ", text);
    }

    public get name() {
        return this._name;
    }

    public set name(n : string) {
        this._name = n;
    }

    public hitTest(x : number, y: number) : boolean {
        return false;
    }

    public abstract update() : void;
    public reset() { this.update(); }
    public defined() : boolean { return false; }
    public drag(tox: number, toy: number) : boolean { return false; }
    // drag returns true when the element is actually dragged
    public abstract translate(dx: number, dy: number) : void;
    public abstract rotate(pivot : PointElement, ac : number, as: number) : void;
    public abstract drawName(d: Rectangle) : void;
    public abstract drawFace() : void;
    public abstract drawEdge() : void;
    public abstract drawVertex() : void;

    set nameColor(value: paper.Color) {
        this._nameColor = value;
    }

    set edgeColor(value: paper.Color) {
        this._edgeColor = value;
    }

    set faceColor(value: paper.Color) {
        this._faceColor = value;
    }

    set nameHighlightColor(value: paper.Color) {
        this._nameHighlightColor = value;
    }

    set vertexHighlightColor(value: paper.Color) {
        this._vertexHighlightColor = value;
    }

    set edgeHighlightColor(value: paper.Color) {
        this._edgeHighlightColor = value;
    }

    set faceHighlightColor(value: paper.Color) {
        this._faceHighlightColor = value;
    }

    set draggable(value: boolean) {
        this._draggable = value;
    }

    set dimension(value: number) {
        this._dimension = value;
    }

    set align(value: Align) {
        this._align = value;
    }

    set shouldHighlight(value: boolean) {
        this._shouldHighlight = value;
    }

    get nameColor(): paper.Color {
        return this._nameColor;
    }

    get vertexColor(): paper.Color {
        return this._vertexColor;
    }

    set vertexColor(c : paper.Color) {
        this._vertexColor = c;
    }

    get edgeColor(): paper.Color {
        return this._edgeColor;
    }

    get faceColor(): paper.Color {
        return this._faceColor;
    }

    get nameHighlightColor(): paper.Color {
        return this._nameHighlightColor;
    }

    get vertexHighlightColor(): paper.Color {
        return this._vertexHighlightColor;
    }

    get edgeHighlightColor(): paper.Color {
        return this._edgeHighlightColor;
    }

    get faceHighlightColor(): paper.Color {
        return this._faceHighlightColor;
    }

    get draggable(): boolean {
        return this._draggable;
    }

    get dimension(): number {
        return this._dimension;
    }

    get align(): Align {
        return this._align;
    }

    get shouldHighlight(): boolean {
        return this._shouldHighlight;
    }
}
