import {GeomElement, Align as align} from "./elements/GeomElement"
import {AllConstructions, E as e} from "./elements/Constructions"
import {PointElement} from "./elements/point/PointElement";
import {Slate} from "./Slate";
import {PlaneSlider} from "./elements/point/PlaneSlider";
import {colors, randomColor, lighten, darken, parseColor} from "./Colors";
import {createControls} from "./SlateControls";

export type IndexAllConstructions = AllConstructions;
export {align  as Align};
export {e as E};

// Build marker — bumped when behaviour-affecting changes ship so consumers
// (e.g. the test pages used to investigate #55) can confirm which bundle
// they're actually running.
export const BUILD_MARKER = "pointer-events-refactor-v1 (Slate.ts #55)";

export let slates : Slate[] = [];

export interface IConstructionInfo {
    name: string;
    construction: IndexAllConstructions;
    params: any[];
    nameColor?: string | number;
    vertexColor?: string | number;
    edgeColor?: string | number;
    faceColor?: string | number;
}

export interface IInitialization {
    background : string;
    title : string;
    align? : align;
    canvasid? : string;
    pivot?: string;
    font?: string;
    fontsize?: number;
    elements: (IConstructionInfo | string)[];
}

// Map Java element class names to E object keys
const typeMap: {[key: string]: string} = {
    "point": "Point", "line": "Line", "circle": "Circle",
    "polygon": "Polygon", "sector": "Sector", "plane": "Plane",
    "sphere": "Sphere", "polyhedron": "Polyhedra"
};

// Parse a Java applet param value string into an IConstructionInfo.
// Format: "name;type;construction;arg1,arg2,...[;nameColor[;vertexColor[;edgeColor[;faceColor]]]]"
// Example: "M;point;midpoint;A,B;0;0" → { name: "M", construction: E.Point.midpoint, params: ["A","B"], nameColor: "0", vertexColor: "0" }
export function parseParam(value: string): IConstructionInfo {
    let fields = value.split(";");
    if (fields.length < 4) {
        throw new Error(`parseParam: expected at least 4 semicolon-separated fields, got ${fields.length}: "${value}"`);
    }

    let name = fields[0];
    let type = fields[1];
    let construction = fields[2];
    let data = fields[3];

    // Look up the construction enum value
    let typeKey = typeMap[type];
    if (typeKey == null) {
        throw new Error(`parseParam: unknown element type "${type}" in "${value}"`);
    }
    let enumObj = (e as any)[typeKey];
    // Handle Java names that differ from TS enum keys
    let enumKey = construction === "3points" ? "threePoints" : construction;
    let constructionEnum = enumObj[enumKey];
    if (constructionEnum == null) {
        throw new Error(`parseParam: unknown construction "${type};${construction}" in "${value}"`);
    }

    // Parse params: split on comma, convert numeric strings to numbers
    let params: any[] = data.split(",").map(s => {
        let n = Number(s);
        return (s !== "" && !isNaN(n)) ? n : s;
    });

    // Parse optional color fields (positions 4-7)
    let result: IConstructionInfo = { name, construction: constructionEnum, params };
    if (fields.length > 4 && fields[4] !== undefined) result.nameColor = fields[4];
    if (fields.length > 5 && fields[5] !== undefined) result.vertexColor = fields[5];
    if (fields.length > 6 && fields[6] !== undefined) result.edgeColor = fields[6];
    if (fields.length > 7 && fields[7] !== undefined) result.faceColor = fields[7];

    return result;
}

// see https://stackoverflow.com/questions/4938346/canvas-width-and-height-in-html5
function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) : void {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width != width || canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
    }
}

export function init(i : IInitialization) {
    // Java defaults to CENTRAL (0) — dynamic placement based on
    // position relative to canvas center. Override with align param.
    let defaultAlign : align = i.align != null ? i.align : align.CENTRAL;
    let canvasid : string = i.canvasid;
    if(canvasid == null) canvasid = "canvasid";

    let canvas = document.getElementById(canvasid) as HTMLCanvasElement;
    resizeCanvasToDisplaySize(canvas);
    let slate : Slate = new Slate(canvas);
    slates.push(slate);

    // Set font — Java defaults: Font("TimesRoman", Font.ITALIC, 18)
    let fontName = i.font != null ? i.font : "Times New Roman";
    let fontSize = i.fontsize != null ? i.fontsize : 18;
    GeomElement.setFont(fontName, fontSize);
    // Parse background through parseColor so HSB triples like "35,19,100"
    // are converted to valid CSS rgb() strings for ctx.fillStyle.
    slate.bgcolor = parseColor(i.background, "#ffffff", "#ffffff");
    for(let raw of i.elements) {
        let param: IConstructionInfo = typeof raw === "string" ? parseParam(raw) : raw;
        let element = slate.createElement(param.construction, param.params, param.name);

        element.align = defaultAlign;

        // Name string
        let defaultNameColor = element instanceof PointElement ? "black" : null;
        element.nameColor = parseColor(param.nameColor, defaultNameColor, slate.bgcolor);

        let defaultVertexColor = element.draggable ?
            ((element instanceof PlaneSlider) ?
                'red' : 'orange')
            : 'black';
        element.vertexColor = parseColor(param.vertexColor, defaultVertexColor, slate.bgcolor);

        element.edgeColor = parseColor(param.edgeColor, "black", slate.bgcolor);

        let lighterColor = lighten(slate.bgcolor);
        let defaultFaceColor = element.dimension == 2 ? lighterColor : null;
        element.faceColor = parseColor(param.faceColor, defaultFaceColor, slate.bgcolor);
    }

    if(i.pivot != null) {
        slate.setPivot(i.pivot);
    }

    slate.update();
    slate.updateCoordinates(0);

    // Add UI controls (reset, maximize, new window) if running in browser
    if (canvas && canvas.parentElement) {
        createControls(slate, canvas, i);
    }
}

