import {GeomElement} from "./elements/GeomElement";
import {PlaneElement} from "./elements/plane/PlaneElement";
import {FixedPoint} from "./elements/point/FixedPoint";
import {AllConstructions, Construction, constructions, getConstructionName} from "./elements/Constructions";
import {PointElement} from "./elements/point/PointElement";
import {Canvas, createCanvas} from "canvas";

export type SlateCanvas = HTMLCanvasElement | Canvas;

export class Slate {

    protected _originalElements : GeomElement[];
    protected _elements : GeomElement[];
    protected _elementsForUpdate : GeomElement[];
    protected _screen : PlaneElement;
    protected _pick : PointElement;
    protected _canvas : SlateCanvas;
    private _htmlCanvas : HTMLCanvasElement = null;
    protected _bgcolor : string;
    public    inTest : boolean = false;
    private static numSlate : number = 0;
    private _itsNumSlate : number = -1;

    constructor(canvas: SlateCanvas) {
        Slate.numSlate += 1;
        this._itsNumSlate = Slate.numSlate;

        this._elements = [];
        this._elementsForUpdate = [];
        if(canvas == null) {
            throw new TypeError("canvas cannot be null or undefined.");
        }
        this._canvas = canvas;

        let screen_origin = new FixedPoint(0,0,0);
        screen_origin.name = "screen_origin";
        let screen_x      = new FixedPoint(1,0,0);
        screen_x.name = "screen_x";
        let screen_y      = new FixedPoint(0,1,0);
        screen_y.name = "screen_y";

        let screen = new PlaneElement({
                A: screen_origin,
                B: screen_x,
                C: screen_y
        });
        screen.name = "screen";
        screen.nameColor = null;
        screen.isScreen = true;
        this._screen = screen;
        this._pick = null;

        for(let e of [screen_origin, screen_x, screen_y, screen]) {
            e.nameColor = null;
            e.vertexColor = null;
            e.vertexHighlightColor = null;
            e.faceColor = null;
            e.faceHighlightColor = null;
            this._elements.push(e);
        }
        this._originalElements = [...this._elements];
        this._elementsForUpdate = [...this._elements];

        let slate = this;

        if(this._canvas instanceof HTMLCanvasElement) {
            let cnv : HTMLCanvasElement = this._canvas as HTMLCanvasElement;
            this._htmlCanvas = cnv;

            cnv.addEventListener("mousedown", (ev) => {
                let [x, y] : number[] = this._getCanvasPosition(ev.x, ev.y);
                slate._onMouseDown(x, y);
            });

            cnv.addEventListener("mouseup", (ev) => {
                let [x, y] : number[] = this._getCanvasPosition(ev.x, ev.y);
                slate._onMouseUp(x, y);
            });

            cnv.addEventListener("mousemove", (ev) => {
                let [x, y] : number[] = this._getCanvasPosition(ev.x, ev.y);
                slate._onMouseDrag(x, y);
            });

            for(let [tEvent, mEvent] of [
                ["touchend", "mouseup"],
                ["touchstart", "mousedown"],
                ["touchmove", "mousemove"]
            ]) {
                this._htmlCanvas.addEventListener(tEvent, (tv : TouchEvent) => {
                    let pos = slate._getTouchPos(tv);
                    let me = new MouseEvent(mEvent,
                        {clientX: pos[0], clientY: pos[1]});
                    slate._htmlCanvas.dispatchEvent(me);
                });
            }
            for(let eventType of ["touchstart", "touchmove", "touchend"]) {
                document.body.addEventListener(eventType, (tv) => {
                    if (tv.target == slate._htmlCanvas) {
                        tv.preventDefault();
                    }
                }, false);
            }
        }

    }

    _getTouchPos(te : TouchEvent) : [number, number] {
        if (this._htmlCanvas == null) return;
        let r = this._htmlCanvas.getBoundingClientRect();
        return [te.touches[0].clientX - r.left,
                te.touches[0].clientY - r.top];
    }

    _getCanvasPosition(x: number, y: number) : [number, number] {
        let r = this._htmlCanvas.getBoundingClientRect();
        return [x - r.left,
                y - r.top];
    }

    _onMouseDown(x: number, y: number) {
        this._pick = null;
        this.movePick(x, y);
    };

    _onMouseUp(x: number, y: number) {
        if (this._pick == null) return;
        this.movePick(x, y);
        this._pick = null;
    };

    _onMouseDrag(x: number, y: number) {
        if (this._pick == null) return;
        this.movePick(x, y);
    };

    get elements() : GeomElement[] {
        return this._elements;
    }

    set bgcolor(value: string ) {
        this._bgcolor = value;
    }

    get bgcolor() : string {
        return this._bgcolor;
    }

    lookupElement(name: string) : GeomElement {
        for (let elem of this._elements) {
            if (elem.name == name) {
                return elem;
            }
        }
        return null;
    }

    convertParams(params: any[]) : any[] {
        let converted_params : any[] = [];
        for(let param of params) {
            switch(typeof(param)) {
                case "string":
                    let g : GeomElement = this.lookupElement(param);
                    if ( g == null )
                        throw new TypeError(`Element with name ${param} not found.`)
                    converted_params.push(g);
                    break;
                case "number":
                    converted_params.push(param);
                    break;
                default:
                    throw new TypeError("Expecting only named elements (strings) or numbers.");
            }
        }
        return converted_params;
    }

    findConstruction(cm : AllConstructions, params: any[]) : Construction {
        for(let c of constructions) {
            if(c.validateSignature(cm, params)) {
                return c;
            }
        }
        return null;
    }

    createElement(cm : AllConstructions, params: any[], name?: string) : GeomElement {
        params = this.convertParams(params);
        let c : Construction = this.findConstruction(cm, params);
        if(c == null) {
            let cName : String = getConstructionName(cm);
            if (name == null) {
                name = "";
            }
            throw new TypeError(`Construction not found for "${name}" ${cName} with params ${params}`);
        }
        let [gs, g] = c.construct(this._screen, params);
        if(name != null)
            g.name = name;
        this._elementsForUpdate = this._elementsForUpdate.concat(gs);
        this._elements = this._elements.concat(gs);
        this._elements.push(g);
        return g;
    }

    reset() : void {
        this._elements = [...this._originalElements];
    }

    update() : void {
        this.drawElements();
    }

    drawElements(): void {
        if(this.inTest) return;
        // we draw all the elements first
        let w = this._canvas.width;
        let h = this._canvas.height;
        for(let element of this._elementsForUpdate) element.update();
        let ctx = this._canvas.getContext("2d");
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = this._bgcolor;
        ctx.fillRect(0,0,w,h);
        for(let element of this._elements) element.drawFace(this._canvas);
        for(let element of this._elements) element.drawEdge(this._canvas);
        for(let element of this._elements) element.drawVertex(this._canvas);
        // and then draw their names.
        for(let element of this._elements)
            element.drawName(this._canvas);
    }

    updateCoordinates(i : number) {
        for(i; i < this.elements.length; i++) {
            if(!this._elements[i].defined())
                this._elements[i].reset();
            //this._elements[i].update();
        }
        this.update();
    }

    translateCoordinates(dx : number, dy: number) {
        for(let i = 0; i < this._elements.length; i++) {
            let elem = this._elements[i];
            elem.translate(dx, dy);
        }
        this.update();
    }

    closestVisiblePoint(elements : GeomElement[], p : PointElement, tolerance : number = 30) : PointElement {
        let sortedDistanceElements = elements
            .filter(e => e instanceof PointElement)
            .map(e => e as PointElement)
            .filter(e => e.vertexColor != null)
            .sort((a,b) => {
                let adcp = a.distance2(p);
                let bdcp = b.distance2(p);
                if(adcp < bdcp) {
                    return -1;
                } else if (bdcp < adcp) {
                    return 1;
                }
                return 0;
            });
        if (sortedDistanceElements.length == 0) return null;
        let bestDistPoint = sortedDistanceElements[0];
        if(bestDistPoint.distance(p) > tolerance) return null;
        return bestDistPoint;
    }

    private _getPick(c: number, d: number) : PointElement {
        if (this._pick != null) return this._pick;
        let currentPoint = new PointElement({x:c,y:d});
        let closestVisiblePoint = this.closestVisiblePoint(this._elements, currentPoint);
        if(closestVisiblePoint == null) return;
        this._pick = closestVisiblePoint;
        return this._pick;
    }

    movePick(c: number, d: number) : void {
        if(this._getPick(c, d) == null) return;
        let picki = this._elements.indexOf(this._pick);

        let w : number = this._canvas.width;
        if (c < 0) c = 0;
        else if (c > w) c = w;
        let h : number = this._canvas.height;
        if (d < 0) d = 0;
        else if (d > h) d = h;
        if (Math.abs(c - this._pick.x) + Math.abs(d - this._pick.y) < 1.0) {
            return; // no motion
        }
        if ( this._pick.draggable ) {
            if(this._pick.drag(c,d)) {
                this.updateCoordinates(picki);
            } else {
                return;
            }
        } // TODO: PORT PIVOT CODE WHEN PIVOT IMPLEMENTED
        /* Pivot code
         else if (pick.AP != null && pick.AP.pivot != null
                 && pick.AP.pivot != pick) // rotate around the pivot
              rotateCoordinates(c,d);
         */
        else {
            let dx = c - this._pick.x;
            let dy = d - this._pick.y;
            this.translateCoordinates(dx,dy);
        }
        // repaint done automatically
    }

}
