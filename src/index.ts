import paper = require("paper")
import {GeomElement, Align} from "./elements/GeomElement"
import {AllConstructions, E} from "./elements/Constructions"
import {PointElement} from "./elements/point/PointElement";
import {Slate} from "./Slate";

export type AllConstructions = AllConstructions;
export type Color = paper.Color;
export type Align = Align
export type E = E
export const slate = new Slate();

interface IConstructionInfo {
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
    // TODO : resume here

}
