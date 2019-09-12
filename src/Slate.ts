import paper = require('paper');
import {GeomElement} from "./elements/GeomElement";
import {PlaneElement} from "./elements/plane/PlaneElement";
import {FixedPoint} from "./elements/point/FixedPoint";
import {AllConstructions, Construction, constructions, getConstructionName, PreExists} from "./elements/Constructions";
import {PointElement} from "./elements/point/PointElement";
import {Canvas} from "canvas";
import {Point, Rectangle} from "paper";
import Color = paper.Color;

export type SlateCanvas = HTMLCanvasElement | Canvas;

export class Slate {

    protected _originalElements : GeomElement[];
    protected _elements : GeomElement[];
    protected _preExists : PreExists[];
    protected _screen : PlaneElement;
    protected _pick : PointElement;
    protected _canvas : SlateCanvas;
    protected _bgcolor : string;
    public    inTest : boolean = false;
    protected _bg : paper.Path.Rectangle = null;
    private _ctx : CanvasRenderingContext2D = null;

    constructor(canvas: SlateCanvas) {
        this._elements = [];
        this._preExists = [];
        if(canvas == null) {
            throw new TypeError("canvas cannot be null or undefined.");
        }
        this._canvas = canvas;
        this._ctx = this._canvas.getContext("2d");

        let screen_origin = new FixedPoint(0,0,0);
        screen_origin.name = "screen_origin";
        let screen_x      = new FixedPoint(0,0,0);
        screen_x.name = "screen_x";
        let screen_y      = new FixedPoint(0,0,0);
        screen_y.name = "screen_y";

        let screen = new PlaneElement({
                A: screen_origin,
                B: screen_x,
                C: screen_y
        });
        screen.name = "screen";
        screen.isScreen = true;
        this._screen = screen;
        this._pick = null;

        for(let e of [screen_origin, screen_x, screen_y, screen]) {
            this._elements.push(e);
        }
        this._originalElements = [...this._elements];

        let slate = this;
        let tool = new paper.Tool();

        tool.onMouseDown = function(te: paper.ToolEvent) {
            console.log("d", te.point);
            slate._pick = null;
            slate.movePick(te.point.x, te.point.y);
        };

        tool.onMouseUp = function(te: paper.ToolEvent) {
            console.log("u", te.point);
            if (slate._pick == null) return;
            slate.movePick(te.point.x, te.point.y);
        };

        tool.onMouseDrag = function(te: paper.ToolEvent) {
            slate.movePick(te.point.x, te.point.y);
        };
    }

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
        let [p, g] = c.construct(this._screen, params);
        if(name != null)
            g.name = name;
        this._elements.push(g);
        this._preExists.push(p);
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
        for(let element of this._elements) element.update();
        this._ctx.clearRect(0,0,w,h);
        this._ctx.fillStyle = this._bgcolor;
        this._ctx.fillRect(0,0,w,h);
        //for(let element of this._elements) element.drawFace(this._ctx);
        //for(let element of this._elements) element.drawEdge(this._ctx);
        for(let element of this._elements) element.drawVertex(this._ctx);
        // and then draw their names.
        for(let element of this._elements)
            element.drawName(this._ctx, new Rectangle(new Point(w, 0), new Point(0, h)));
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
            if(!this._preExists[i]) {
                elem.translate(dx, dy);
            }
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
