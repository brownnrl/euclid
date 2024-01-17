/*----------------------------------------------------------------------+
|    Title:	Constructions.ts                                            |
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
import {GeomElement} from "./GeomElement";
import {CircleElement} from "./circle/CircleElement";
import {PlaneElement} from "./plane/PlaneElement";
import {IPerpendicularPlaneElementConstruction, 
        PerpendicularPlane} from "./plane/PerpendicularPlane";
import {PointElement} from "./point/PointElement";
import {FixedPoint} from "./point/FixedPoint";
import {PlaneSlider} from "./point/PlaneSlider";
import {Midpoint} from "./point/Midpoint";
import {LineElement} from "./line/LineElement";
import {LineSlider} from "./point/LineSlider";
import {Layoff} from "./point/Layoff";
import {SectorElement} from "./sector/SectorElement";
import {CircleSlider} from "./point/CircleSlider";
import {Perpendicular} from "./line/Perpendicular";
import {PlanePerpendicularLine} from "./line/PlanePerpendicularLine";
import {Bichord} from "./line/Bichord";
import {PolygonElement} from "./polygon/PolygonElement";

export enum ConstructionTypes {
    Integer,
    PointElement,
    CircleElement,
    PlaneElement,
    SphereElement
}

export enum PointConstructions {
    free = 1,
    midpoint = 2,
    intersection = 3,
    first = 4,
    last = 5,
    center = 6,
    lineSlider = 7,
    circleSlider = 8,
    circumcenter = 9,
    vertex = 10,
    foot = 11,
    cutoff = 12,
    extend = 13,
    parallelogram = 14,
    similar = 15,
    perpendicular = 16,
    proportion = 17,
    invert = 18,
    meanProportional = 19,
    planeSlider = 20,
    sphereSlider = 21,
    angleBisector = 22,
    angleDivider = 23,
    fixed = 24,
    lineSegmentSlider = 25
}

export enum LineConstructions {
    connect = 101,
    angleBisector = 102,
    angleDivider = 103,
    foot = 104,
    chord = 105,
    bichord = 106,
    perpendicular = 107,
    cutoff = 108,
    extend = 109,
    parallel = 110,
    similar = 111,
    proportion = 112,
    meanProportional = 113
}


export enum CircleConstructions {
    radius = 201,
    circumcircle = 202,
    invert = 203,
    intersection = 204
}


export enum PolygonConstructions {
    square = 301,
    triangle = 302,
    quadrilateral = 303,
    pentagon = 304,
    hexagon = 305,
    equilateralTriangle = 306,
    parallelogram = 307,
    regularPolygon = 308,
    starPolygon = 309,
    similar = 310,
    application = 311,
    octagon = 312,
    face = 313
}

export enum SectorConstructions {
    sector = 401,
    arc = 402
}

export enum PlaneConstructions {
    threePoints = 501,
    perpendicular = 502,
    parallel = 503,
    ambient = 504
}

export enum SphereConstructions {
    radius = 601
}

export enum PolyhedraConstructions {
    tetrahedron = 701,
    parallelepiped = 702,
    prism = 703,
    pyramid = 704
}

export function getConstructionName(cm: AllConstructions) : String {
    if(cm < 100) {
        return "Point." + PointConstructions[cm];
    } else if (100 < cm && cm < 200) {
        return "Line." + LineConstructions[cm];
    } else if (300 < cm && cm < 400) {
        return "Polygon." + PolygonConstructions[cm];
    } else if (400 < cm && cm < 500) {
        return "Sector." + SectorConstructions[cm];
    } else if (500 < cm && cm < 600) {
        return "Plane." + PlaneConstructions[cm];
    } else if (600 < cm && cm < 700) {
        return "Sphere." + SphereConstructions[cm];
    } else if (700 < cm && cm < 800) {
        return "Polyhedra." + PolyhedraConstructions[cm];
    }

    return "<Not Valid Construction>";
}

export var E =  {
    Point : PointConstructions,
    Line : LineConstructions,
    Circle: CircleConstructions,
    Polygon: PolygonConstructions,
    Sector: SectorConstructions,
    Plane: PlaneConstructions,
    Sphere: SphereConstructions,
    Polyhedra: PolyhedraConstructions
};

export type AllConstructions =
    PointConstructions   |
    LineConstructions    |
    CircleConstructions  |
    PlaneConstructions   |
    PolygonConstructions |
    SectorConstructions  |
    PolyhedraConstructions;

export type GeomElementsForUpdate = GeomElement[];

export abstract class Construction {
    public abstract constructionMethod : AllConstructions;
    public abstract signature: ConstructionTypes[];
    public abstract construct(screen: PlaneElement, params: any[]) : [GeomElementsForUpdate, GeomElement];
    // TODO: Optional values (such as null z coordinates) should be allowed
    public validateSignature(cm : AllConstructions, params: any[]) : boolean {
        if (cm != this.constructionMethod) return false;
        const sigCopy : ConstructionTypes[] = [...this.signature].reverse();
        if (sigCopy.length != params.length) return false;
        for(let param of params) {
            let sigItem = sigCopy.pop();
            // TODO: resume here
            switch(sigItem) {
                case ConstructionTypes.Integer:
                    if (!(typeof(param) == "number")) {
                        return false;
                    }
                    break;
                case ConstructionTypes.CircleElement:
                    if (!(param instanceof CircleElement)) {
                        return false;
                    }
                    break;
                case ConstructionTypes.PlaneElement:
                    if (!(param instanceof PlaneElement)) {
                        return false;
                    }
                    break;
                case ConstructionTypes.PointElement:
                    if (!(param instanceof PointElement)) {
                        return false;
                    }
                    break;
                case ConstructionTypes.SphereElement:
                    // TODO:
                    break;
                default:
                    return false;
            }
        }
        return true;
    }
}

let ct = ConstructionTypes;

export class FreePointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.free;
    signature: ConstructionTypes[] = [ct.Integer, ct.Integer];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let x : number = params[0];
        let y : number = params[1];

        let g = new PlaneSlider(screen, x, y, 0);

        return [[g], g];
    }

}

export class FixedPoint2dConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.fixed;
    signature: ConstructionTypes[] = [ct.Integer, ct.Integer];
    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let x : number = params[0];
        let y : number = params[1];

        let g = new FixedPoint({x:x, y:y,z:0});

        return [[g], g];
    }
}

export class FixedPoint3dConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.fixed;
    signature: ConstructionTypes[] = [ct.Integer, ct.Integer, ct.Integer];
    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let x : number = params[0];
        let y : number = params[1];
        let z : number = params[2];

        let g = new FixedPoint({x:x, y:y, z:z});

        return [[g], g];
    }
}


export class FirstPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.first;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        return [[], params[0] as PointElement];
    }

}

export class LastPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.last;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        return [[], params[1] as PointElement];
    }
}

export class MidPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.midpoint;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];

        let g = new Midpoint(a, b);

        return [[g], g];
    }
}

// point perpendicular constructions
abstract class PointPerpendicularConstruction extends Construction {
    constructionMethod : AllConstructions = PointConstructions.perpendicular;
}

export class PointPerpendicular1Construction extends PointPerpendicularConstruction {
    /* points A, B, [plane C (screen)]
     * the point D so that AD is equal and perpendicular to AB in plane C
     * */
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let g = new Perpendicular({C:a, D:b,P:screen, E:a, F:b});
        return [[g], g.B];
    }
}

export class PointPerpendicular2Construction extends PointPerpendicularConstruction {
    /* points A, B, plane C
     * the point D so that AD is equal and perpendicular to AB in plane C
     * */
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PlaneElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let c : PlaneElement = params[2];
        let g = new Perpendicular({C:a, D:b,P:c, E:a, F:b});
        return [[g], g.B];
    }
}

export class PointPerpendicular3Construction extends PointPerpendicularConstruction {
    /* points A, B, D, E [plane C (screen)]
     * the point F so that AF is perpendicular to AB in plane C and equals DE
    */
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let d : PointElement = params[2];
        let e : PointElement = params[3];
        let g = new Perpendicular({C:a, D:b,P:screen, E:d, F:e});
        return [[g], g.B];
    }
}

export class PointPerpendicular4Construction extends PointPerpendicularConstruction {
    /* points A, B, D, E [plane C]
     * the point F so that AF is perpendicular to AB in plane C and equals DE
    */
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PlaneElement, ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let c : PlaneElement = params[2];
        let d : PointElement = params[3];
        let e : PointElement = params[4];
        let g = new Perpendicular({C:a, D:b,P:c, E:d, F:e});
        return [[g], g.B];
    }
}

export class PointPerpendicular5Construction extends PointPerpendicularConstruction {
    /*points A, C, D plane B 
     * the point E on the line perpendicular to plane B passing through 
     * A so that the distance from E to B equals CD
     */
    signature: ConstructionTypes[] = [ct.PointElement, ct.PlaneElement, ct.PlaneElement, ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PlaneElement = params[1];
        let c : PointElement = params[2];
        let d : PointElement = params[3];
        let g = new PlanePerpendicularLine({C:a, P:b, D:c, E:d});
        return [[g], g.B];
    }
}

export class LineConnectConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.connect;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];

        let g = new LineElement({A:a, B: b});

        return [[g], g];
    }
}

export class LineSliderConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.lineSlider;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.Integer, ct.Integer, ct.Integer];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let x : number = params[2];
        let y : number = params[3];
        let z : number = params[4];

        let g = this.createSlider(a,b,x,y,z);

        return [[g], g];
    }
    protected createSlider(a: PointElement, b: PointElement, x: number, y: number, z: number) {
        return new LineSlider(a, b, x, y, z, false);
    }
}

export class LineSlider2dConstruction extends LineSliderConstruction {
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.Integer, ct.Integer];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let x : number = params[2];
        let y : number = params[3];

        let g = this.createSlider(a,b,x,y,0);

        return [[g], g];
    }
}

export class LineSliderSegmentConstruction extends LineSliderConstruction {
    constructionMethod: AllConstructions = PointConstructions.lineSegmentSlider;
    protected createSlider(a: PointElement, b: PointElement, x: number, y: number, z: number) {
        return new LineSlider(a, b, x, y, z, true);
    }
}

abstract class LayoffConstruction extends Construction {
    signature: ConstructionTypes[] = (new Array(4)).fill(ct.PointElement);
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = this._createLayoff(ps);
        return [[g], g];
    }

    protected abstract _createLayoff(ps: PointElement[]) : GeomElement;
}

export class ExtendConstruction extends LayoffConstruction {
    constructionMethod: AllConstructions = PointConstructions.extend;
    protected _createLayoff(ps: PointElement[]) : GeomElement {
        return new Layoff(ps[1], ps[0], ps[1], ps[2], ps[3]);
    }
}

export class CutoffConstruction extends LayoffConstruction {
    constructionMethod: AllConstructions = PointConstructions.cutoff;
    protected _createLayoff(ps: PointElement[]) : GeomElement {
        return new Layoff(ps[0], ps[0], ps[1], ps[2], ps[3]);
    }
}

export class LineExtendConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.extend;
    signature: ConstructionTypes[] = (new Array(4)).fill(ct.PointElement);

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let lo = new Layoff(ps[1], ps[0], ps[1], ps[2], ps[3]);
        let g = new LineElement({A: ps[1], B: lo});
        return [[lo, g], g];
    }
}

export class SectorConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructions.sector;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new SectorElement({O:ps[0], A:ps[1], B:ps[2], P: screen});
        return [[g], g];
    }
}

export class CircleSliderConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.circleSlider;
    signature: ConstructionTypes[] = [ct.CircleElement, ct.Integer, ct.Integer, ct.Integer];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let c : CircleElement = params[0];
        let ns : number[] = params.slice(1,4);
        let g = new CircleSlider(c, ns[0], ns[1], ns[2]);
        return [[g], g];
    }
}

export class CircleRadiusCenterConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructions.radius;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new CircleElement({C:ps[0], B:ps[1], AP:screen});
        return [[g], g];
    }
}


export class BichordConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.bichord;
    signature: ConstructionTypes[] = [ct.CircleElement, ct.CircleElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : CircleElement[] = params;
        let g = new Bichord({C:ps[0], D:ps[1]});
        return [[g], g];
    }
}

export class PerpendicularPlaneConstruction extends Construction {
    constructionMethod: AllConstructions = PlaneConstructions.perpendicular;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement]
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new PerpendicularPlane({A: ps[0], E: ps[1]});
        return [[g], g];
    }
}

abstract class PolyConstruction extends Construction {
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new PolygonElement(ps);
        return [[g],g];
    }
}

export class TrianglePolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructions.triangle;
    signature: ConstructionTypes[] = (new Array(3)).fill(ct.PointElement);
}


export const constructions : Construction[] = [
    new FreePointConstruction(),
    new FixedPoint2dConstruction(),
    new FixedPoint3dConstruction(),
    new FirstPointConstruction(),
    new LastPointConstruction(),
    new MidPointConstruction(),
    new ExtendConstruction(),
    new CutoffConstruction(),
    new LineSliderConstruction(),
    new LineSlider2dConstruction(),
    new LineSliderSegmentConstruction(),
    new LineConnectConstruction(),
    new LineExtendConstruction(),
    new SectorConstruction(),
    new CircleSliderConstruction(),
    new CircleRadiusCenterConstruction(),
    new PointPerpendicular1Construction(),
    new BichordConstruction(),
    new TrianglePolygonConstruction(),
    new PerpendicularPlaneConstruction()
];


