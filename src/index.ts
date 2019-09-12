import paper = require("paper")
import {GeomElement, Align as align} from "./elements/GeomElement"
import {AllConstructions, E as e} from "./elements/Constructions"
import {PointElement} from "./elements/point/PointElement";
import {Color as color, Rectangle} from "paper";
import {Slate} from "./Slate";
import {PlaneSlider} from "./elements/point/PlaneSlider";

export type AllConstructions = AllConstructions;
export {color as Color};
export {align  as Align};
export {e as E};

export let slates : Slate[] = [];

export interface IConstructionInfo {
    name: string;
    construction: AllConstructions;
    params: any[];
    nameColor?: string;
    vertexColor?: string;
    edgeColor?: string;
    faceColor?: string;
}

interface IInitialization {
    background : color | string;
    title : string;
    align? : align;
    canvasid? : string;
    elements: IConstructionInfo[];
}

export function init(i : IInitialization) {
    let defaultAlign : align = align.ABOVE;
    console.log(i);
    let canvasid : string = i.canvasid;
    if(canvasid == null) canvasid = "canvasid";

    paper.install(window);
    let scope = new paper.PaperScope();
    scope.activate();
    let canvas = document.getElementById(canvasid) as HTMLCanvasElement;
    scope.setup(canvas);
    eval("paper = scope")
    let slate : Slate = new Slate(canvas);
    slates.push(slate);
    slate.bgcolor = i.background;
    for(let param of i.elements) {
        let element = slate.createElement(param.construction, param.params, param.name);

        // Name Color
        if(param.nameColor != null) {
            element.nameColor = new color(param.nameColor);
        } else if (element instanceof PointElement) {
            element.nameColor = new color('black');
        }

        element.align = defaultAlign;

        if (param.vertexColor != null) {
            element.vertexColor = new color(param.vertexColor);
        } else if (element.dimension == 0) {
            element.vertexColor = element.draggable ?
                ((element instanceof PlaneSlider) ?
                    new color('red') : new color('orange'))
                : new color('black');
        }

        if (param.faceColor != null) {
            element.faceColor = new color(param.faceColor);
        } else if (element.dimension == 2) {
            element.faceColor = new color('cyan'); // TODO: background.brighter()
        }

    }

    slate.update();
    slate.updateCoordinates(0);

}
