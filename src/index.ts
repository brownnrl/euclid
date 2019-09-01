import paper = require("paper")
import {GeomElement, Align} from "./elements/GeomElement"
import {AllConstructions, E as e} from "./elements/Constructions"
import {PointElement} from "./elements/point/PointElement";
import {Slate} from "./Slate";

export type AllConstructions = AllConstructions;
export type Color = paper.Color;
export type Align = Align
export var E = e;

export let slates : Slate[] = [];

export interface IConstructionInfo {
    name: string;
    construction: AllConstructions;
    params: any[];
}

interface IInitialization {
    background : Color | string;
    title : string;
    align? : Align;
    canvasid? : string;
    elements: IConstructionInfo[];
}

export function init(i : IInitialization) {
    console.log(i);
    let canvasid : string = i.canvasid;
    if(canvasid == null) canvasid = "canvasid";

    window.onload = function() {
        paper.install(window);
        let scope = new paper.PaperScope();
        let canvas = document.getElementById(canvasid) as HTMLCanvasElement;
        scope.setup(canvas);
        scope.activate();
        let slate : Slate = new Slate(canvas);
        slates.push(slate);
        for(let element of i.elements) {
            slate.createElement(element.construction, element.params, element.name);
        }
    }

}
