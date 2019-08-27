import {GeomElement} from "./elements/GeomElement";
import {PlaneElement} from "./elements/plane/PlaneElement";
import {FixedPoint} from "./elements/point/FixedPoint";

export class Slate {
    protected _elements : GeomElement[];
    protected _preexists : boolean[];

    protected _screen : PlaneElement;

    constructor() {
        this._elements = [];
        this._preexists = [];

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

        for(let e of [screen_origin, screen_x, screen_y, screen]) {
            this._elements.push(e);
        }

    }

    get elements() : GeomElement[] {
        return this._elements;
    }
}