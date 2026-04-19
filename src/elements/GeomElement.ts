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

import {PointElement} from "./point/PointElement"
import {SlateCanvas} from "../Slate";

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
    // True for elements that are references to existing elements (e.g.,
    // point;first returns P[0], point;vertex returns polygon.V[n-1]).
    // Preexisting elements are skipped during rotate/translate to avoid
    // double-movement. Matches Java's preexists[] array in Slate.java.
    public preexists: boolean = false;
    // All colors default to null (transparent) — matching Java's Element.java.
    // Named elements get their colors assigned by init() in index.ts, which
    // computes type-appropriate defaults. Internal/intermediate elements
    // created inside constructions stay null (invisible) unless explicitly set.
    private _nameColor: string = null;
    protected _vertexColor : string = null;
    private _edgeColor : string = null;
    private _faceColor : string = null;

    private _nameHighlightColor   : string = '#FF0000';
    private _vertexHighlightColor : string = '#FFFFFF';
    private _edgeHighlightColor   : string = '#FFFFFF';
    private _faceHighlightColor   : string = '#00FFFF';

    // Default matches Java: Font("TimesRoman", Font.ITALIC, 18)
    protected static _font : string = "italic 18px Times New Roman";

    static setFont(fontName: string, fontSize: number): void {
        GeomElement._font = `italic ${fontSize}px ${fontName}`;
    }

    private _draggable : boolean;
    private _dimension : number;
    private _align : Align;

    private _shouldHighlight : boolean = false;
    protected _pixelTolerance : number = 50;

    protected _getTextMetrics(ctx: CanvasRenderingContext2D, txt: string) : [number, number] {
        let textMetrics = ctx.measureText(txt);
        let w = textMetrics.width;
        // Use actual font metrics for height; fall back to ascent-based estimate
        let h = (textMetrics.actualBoundingBoxAscent != null)
            ? textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent
            : 16;
        return [w, h];
    }

    drawString(ix : number, iy : number,  c: SlateCanvas, overrideAlign? : Align) {
        let ctx = c.getContext("2d") as CanvasRenderingContext2D;
        if(this._nameColor == null) return;
        ctx.font = GeomElement._font;
        ctx.fillStyle = this._nameColor;
        let [w, h] = this._getTextMetrics(ctx, this._name);

        switch (overrideAlign || this._align) {
            case Align.LEFT:
                ix = ix - w - 6;
                iy = iy + h/2 - 4;
                ctx.fillText(this._name, ix, iy);
                return;
            case Align.RIGHT:
                ix += 2;
                iy += h/2 - 4;
                ctx.fillText(this._name, ix, iy);
                return;
            case Align.ABOVE:
                ix -= w/2;
                iy += -h/2 + 4;
                ctx.fillText(this._name, ix, iy);
                return;
            case Align.BELOW:
                ix -= w/2;
                iy += h/2 + 6;
                ctx.fillText(this._name, ix, iy);
                return;
        }
        // compute (dx,dy) coordinates relative to center of canvas
        // and normalized
        let cw = c.width;
        let ch = c.height;
        let dx = (ix - cw/2) * ch;
        let dy = (iy - ch/2) * cw;
        if (dy > dx) {
            if (dy >= -dx)	// put name below
            {
                ix -= w/2;
                iy += h/2 + 6;
                ctx.fillText(this._name, ix, iy);
            }
            else 		// put name left
            {
                ix = ix - w - 6;
                iy += h/2 - 4;
                ctx.fillText(this._name, ix, iy);
            }
        }
        else {
            if (dy >= -dx) {	// put name right
                    ix += 2;
                    iy += h/2 - 4;
                    ctx.fillText(this._name, ix, iy);
            } else { 		// put name above
                ix -= w/2;
                iy += -h/2 + 4;
                ctx.fillText(this._name, ix, iy);
            }
        }
    }

    public get name() {
        return this._name;
    }

    public set name(n : string) {
        this._name = n;
    }

    public abstract update() : void;
    public reset() { this.update(); }
    public defined() : boolean { return false; }
    public drag(tox: number, toy: number) : boolean { return false; }
    // drag returns true when the element is actually dragged
    public abstract translate(dx: number, dy: number) : void;
    public abstract rotate(pivot : PointElement, ac : number, as: number) : void;
    public abstract drawName(c: SlateCanvas) : void;
    public abstract drawFace(c: SlateCanvas) : void;
    public abstract drawEdge(c: SlateCanvas) : void;
    public abstract drawVertex(c: SlateCanvas) : void;

    set nameColor(value: string) {
        this._nameColor = value;
    }

    set edgeColor(value: string) {
        this._edgeColor = value;
    }

    set faceColor(value: string) {
        this._faceColor = value;
    }

    set nameHighlightColor(value: string) {
        this._nameHighlightColor = value;
    }

    set vertexHighlightColor(value: string) {
        this._vertexHighlightColor = value;
    }

    set edgeHighlightColor(value: string) {
        this._edgeHighlightColor = value;
    }

    set faceHighlightColor(value: string) {
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

    get nameColor(): string {
        return this._nameColor;
    }

    get vertexColor(): string {
        return this._vertexColor;
    }

    set vertexColor(c : string) {
        this._vertexColor = c;
    }

    get edgeColor(): string {
        return this._edgeColor;
    }

    get faceColor(): string {
        return this._faceColor;
    }

    get nameHighlightColor(): string {
        return this._nameHighlightColor;
    }

    get vertexHighlightColor(): string {
        return this._vertexHighlightColor;
    }

    get edgeHighlightColor(): string {
        return this._edgeHighlightColor;
    }

    get faceHighlightColor(): string {
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
