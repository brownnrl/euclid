import {GeomElement} from "./elements/GeomElement";
import {PlaneElement} from "./elements/plane/PlaneElement";
import {FixedPoint} from "./elements/point/FixedPoint";
import {AllConstructions, Construction, constructions} from "./elements/Constructions";
import {PointElement} from "./elements/point/PointElement";

export class Slate {

    protected _originalElements : GeomElement[];
    protected _elements : GeomElement[];
    protected _screen : PlaneElement;
    protected _pick : PointElement;

    constructor() {
        this._elements = [];

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
        this._screen = screen;
        this._pick = new PointElement();

        for(let e of [screen_origin, screen_x, screen_y, screen]) {
            this._elements.push(e);
        }
        this._originalElements = [...this._elements];
    }

    get elements() : GeomElement[] {
        return this._elements;
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
        if(c == null)
            throw new TypeError(`Construction not found for ${cm} with params ${params}`);
        let g : GeomElement = c.construct(this._screen, params);
        if(name != null)
            g.name = name;
        this._elements.push(g);
        return g;
    }

    reset() : void {
        this._elements = [...this._originalElements];
    }

    updateCoordinates(i : number) {
        for(i; i <= this.elements.length; i++) {
            if(!this._elements[i].defined())
                this._elements[i].reset();
            this._elements[i].update();
        }
    }

    translateCoordinates(i : number, d: number) {
        
    }

}
