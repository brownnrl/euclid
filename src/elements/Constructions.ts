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
import {PlaneElement} from "./plane/PlaneElement";
import {PointElement} from "./point/PointElement";

export enum ConstructionTypes {
    Integer,
    PointElement,
    CircleElement,
    PlaneElement,
    SphereElement,
    PolygonElement,
    PolyhedronElement
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
    lineSegmentSlider = 25,
    harmonic = 26
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
    SphereConstructions  |
    PolyhedraConstructions;

export type GeomElementsForUpdate = GeomElement[];

// Type-sorted parameter arrays, matching Java's P[]/E[]/N[] dispatch.
// P = PointElements (including LineElement endpoint expansions)
// E = all other elements (Circle, Plane, Sphere, Polygon, Polyhedron)
// N = integers (numbers)
export interface SortedParams {
    P: PointElement[];
    E: GeomElement[];
    N: number[];
}

export interface ConstructionSignature {
    points: number;
    elements: number;
    integers: number;
    elementTypes?: Function[];
}

export abstract class Construction {
    public abstract constructionMethod : AllConstructions;
    // Signature: type counts + element subtype list for E[] entries.
    // e.g. { points: 2, elements: 1, integers: 0, elementTypes: [PlaneElement] }
    public abstract signature: ConstructionSignature;

    public abstract construct(screen: PlaneElement, P: PointElement[],
                              E: GeomElement[], N: number[]) : [GeomElementsForUpdate, GeomElement];

    // Match by counting types (matching Java's selectDataChoice).
    // Position-independent: "E,Vplane,D,B" and "E,D,B,Vplane" both match
    // { points: 3, elements: 1, elementTypes: [PlaneElement] }.
    public validateSignature(cm: AllConstructions, sp: SortedParams) : boolean {
        if (cm != this.constructionMethod) return false;
        let sig = this.signature;
        if (sig.points !== sp.P.length) return false;
        if (sig.elements !== sp.E.length) return false;
        if (sig.integers !== sp.N.length) return false;
        // Check element subtypes if specified
        if (sig.elementTypes) {
            for (let i = 0; i < sig.elementTypes.length; i++) {
                if (!(sp.E[i] instanceof sig.elementTypes[i])) return false;
            }
        }
        return true;
    }
}

/***********************************************************************
 * Construction classes — organized by element type.                   *
 * Each type's constructions live in their own package file and export *
 * a pre-built Construction[] array.                                   *
 *                                                                     *
 * Point      — point/PointConstructions.ts                            *
 *              (also contains CircumcircleConstruction)                *
 * Line       — line/LineConstructions.ts                              *
 * Circle     — circle/CircleConstructions.ts                          *
 * Polygon    — polygon/PolygonConstructions.ts                        *
 * Sector     — sector/SectorConstructions.ts                          *
 * Plane      — plane/PlaneConstructions.ts                            *
 * Sphere     — sphere/SphereConstructions.ts                          *
 * Polyhedron — polyhedron/PolyhedronConstructions.ts                  *
 ***********************************************************************/

import {pointConstructions}     from "./point/PointConstructions";
import {lineConstructions}      from "./line/LineConstructions";
import {circleConstructions}    from "./circle/CircleConstructions";
import {polygonConstructions}   from "./polygon/PolygonConstructions";
import {sectorConstructions}    from "./sector/SectorConstructions";
import {planeConstructions}     from "./plane/PlaneConstructions";
import {sphereConstructions}    from "./sphere/SphereConstructions";
import {polyhedronConstructions} from "./polyhedron/PolyhedronConstructions";


export const constructions: Construction[] = [
    ...pointConstructions,
    ...lineConstructions,
    ...circleConstructions,
    ...sectorConstructions,
    ...polygonConstructions,
    ...planeConstructions,
    ...sphereConstructions,
    ...polyhedronConstructions,
];
