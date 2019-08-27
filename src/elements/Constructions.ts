import {GeomElement} from "./GeomElement";
import {CircleElement} from "./circle/CircleElement";
import {PlaneElement} from "./plane/PlaneElement";
import {PointElement} from "./point/PointElement";
import {PlaneSlider} from "./point/PlaneSlider";
import {Midpoint} from "./point/Midpoint";

export enum ConstructableElements {
    PointElement,
    LineElement,
    CircleElement,
    PlaneElement,
    PolygonElement,
    SectorElement,
    SphereElement,
    PolyhedronElement
}

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

export class E {
    public static C = {
        Point : PointConstructions,
        Line : LineConstructions,
        Circle: CircleConstructions,
        Polygon: PolygonConstructions,
        Sector: SectorConstructions,
        Plane: PlaneConstructions,
        Sphere: SphereConstructions,
        Polyhedra: PolyhedraConstructions
    }

}

type AllConstructions =
    PointConstructions   |
    LineConstructions    |
    CircleConstructions  |
    PlaneConstructions   |
    PolygonConstructions |
    SectorConstructions  |
    PolyhedraConstructions;

abstract class Construction {
    public abstract constructableType : ConstructableElements;
    public abstract constructionMethod : AllConstructions;
    public abstract signature: ConstructionTypes[];
    public abstract construct(screen: PlaneElement, params: any[]) : GeomElement;
    public validateSignature(params: any[]) : boolean {
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


    }
}

let ct = ConstructionTypes;

class FreePointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.free;
    constructableType: ConstructableElements = ConstructableElements.PointElement;
    signature: ConstructionTypes[] = [ct.Integer, ct.Integer];

    construct(screen : PlaneElement, params: any[]): GeomElement {
        let x : number = params[0];
        let y : number = params[1];

        return new PlaneSlider(screen, x, y, 0);
    }

}


class MidPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.midpoint;
    constructableType: ConstructableElements = ConstructableElements.PointElement;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): GeomElement {
        let a : PointElement = params[0];
        let b : PointElement = params[1];

        return new Midpoint(a, b);
    }

}


