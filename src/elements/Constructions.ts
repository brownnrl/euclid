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
import {CircumcircleElement} from "./circle/CircumcircleElement";
import {PlaneElement} from "./plane/PlaneElement";
import {IPerpendicularPlaneElementConstruction, 
        PerpendicularPlane} from "./plane/PerpendicularPlane";
import {PointElement} from "./point/PointElement";
import {FixedPoint} from "./point/FixedPoint";
import {PlaneSlider} from "./point/PlaneSlider";
import {Midpoint} from "./point/Midpoint";
import {Intersection} from "./point/Intersection";
import {LineElement} from "./line/LineElement";
import {LineSlider} from "./point/LineSlider";
import {Layoff} from "./point/Layoff";
import {Foot} from "./point/Foot";
import {SectorElement} from "./sector/SectorElement";
import {ArcElement} from "./sector/ArcElement";
import {CircleSlider} from "./point/CircleSlider";
import {Perpendicular} from "./line/Perpendicular";
import {PlanePerpendicularLine} from "./line/PlanePerpendicularLine";
import {Bichord} from "./line/Bichord";
import {Chord} from "./line/Chord";
import {SimilarElement} from "./point/SimilarElement";
import {ProportionElement} from "./point/ProportionElement";
import {AngleDividerElement} from "./point/AngleDividerElement";
import {MeanProportionalElement} from "./point/MeanProportionalElement";
import {HarmonicElement} from "./point/HarmonicElement";
import {InvertPointElement} from "./point/InvertPointElement";
import {SphereSliderElement} from "./point/SphereSliderElement";
import {ParallelPlane} from "./plane/ParallelPlane";
import {PolyhedronElement} from "./polyhedron/PolyhedronElement";
import {PyramidElement} from "./polyhedron/PyramidElement";
import {PrismElement} from "./polyhedron/PrismElement";
import {SphereIntersectionElement} from "./circle/SphereIntersectionElement";
import {InvertCircleElement} from "./circle/InvertCircleElement";
import {PlaneIntersection} from "./point/PlaneIntersection";
import {PlaneFootElement} from "./point/PlaneFootElement";
import {ApplicationElement} from "./polygon/ApplicationElement";
import {PolygonElement} from "./polygon/PolygonElement";
import {RegularPolygonElement} from "./polygon/RegularPolygonElement";
import {SphereElement} from "./sphere/SphereElement";

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

export abstract class Construction {
    public abstract constructionMethod : AllConstructions;
    public abstract signature: ConstructionTypes[];
    public abstract construct(screen: PlaneElement, params: any[]) : [GeomElementsForUpdate, GeomElement];
    // Optional z coordinates are handled by separate 2D/3D construction classes
    // with different signatures (e.g., LineSliderConstruction vs LineSlider2dConstruction).
    public validateSignature(cm : AllConstructions, params: any[]) : boolean {
        if (cm != this.constructionMethod) return false;
        const sigCopy : ConstructionTypes[] = [...this.signature].reverse();
        if (sigCopy.length != params.length) return false;
        for(let param of params) {
            let sigItem = sigCopy.pop();
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
                    if (!(param instanceof SphereElement)) {
                        return false;
                    }
                    break;
                case ConstructionTypes.PolygonElement:
                    if (!(param instanceof PolygonElement)) {
                        return false;
                    }
                    break;
                case ConstructionTypes.PolyhedronElement:
                    if (!(param instanceof PolyhedronElement)) {
                        return false;
                    }
                    break;
                default:
                    return false;
            }
        }
        return true;
    }
}

let ct = ConstructionTypes;

/***********************
 * Element Class Point *
 * (see point/constructions.ts for all point construction classes)
 ***********************/

import {FreePointConstruction, MidPointConstruction, IntersectionConstruction,
    IntersectionConstructionScreen, PlaneIntersectionConstruction,
    FirstPointConstruction, LastPointConstruction,
    CircleCenterConstruction, SphereCenterConstruction,
    LineSliderConstruction, LineSlider2dConstruction,
    CircleSliderConstruction, CircleSliderConstruction2dPoint,
    CircumcircleConstruction, CircumcircleConstruction2d,
    CircumcenterConstruction, CircumcenterConstruction2d,
    FootPointConstruction, PlaneFootPointConstruction,
    CutoffConstruction, ExtendConstruction,
    ParallelogramConstruction,
    SimilarPointConstruction, SimilarPoint3dConstruction,
    PointPerpendicular1Construction, PointPerpendicular2Construction,
    PointPerpendicular3Construction, PointPerpendicular4Construction,
    PointPerpendicular5Construction,
    ProportionPointConstruction, InvertPointConstruction,
    MeanProportionalPointConstruction,
    PlaneSliderConstruction, SphereSliderConstruction,
    AngleBisectorPointConstruction, AngleDividerPointConstruction,
    AngleBisectorPoint3dConstruction, AngleDividerPoint3dConstruction,
    FixedPoint2dConstruction, FixedPoint3dConstruction,
    LineSliderSegmentConstruction, HarmonicPointConstruction,
    VertexConstruction} from "./point/constructions";





/**********************
 * Element Class Line *
 **********************/

// line
// connect
// points A, B
// the line AB connecting two points A and B
// (Java: Slate.java line case 0 — new LineElement(A,B))
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

// line
// angleBisector (2D variant)
// points B, A, C
// line from A to the bisector point of angle BAC on line BC
// (Java: Slate.java line case 1 — AngleDivider(B,A,C,screen,2) + LineElement(A,result))
export class AngleBisectorLineConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.angleBisector;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let ad = new AngleDividerElement(ps[0], ps[1], ps[2], screen, 2);
        let g = new LineElement({A: ps[1], B: ad});
        return [[ad, g], g];
    }
}

// line
// angleDivider (2D variant)
// points B, A, C, integer n
// line from A to the n-th division point of angle BAC on line BC
// (Java: Slate.java line case 2 — AngleDivider(B,A,C,screen,n) + LineElement(A,result))
export class AngleDividerLineConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.angleDivider;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.Integer];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let n : number = params[3];
        let ad = new AngleDividerElement(ps[0], ps[1], ps[2], screen, n);
        let g = new LineElement({A: ps[1], B: ad});
        return [[ad, g], g];
    }
}

// line — angleBisector (3D variant)
// points B, A, C, plane D
// (Java: Slate.java line case 1, choice 1 — AngleDivider(B,A,C,D,2) + LineElement(A,result))
export class AngleBisectorLine3dConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.angleBisector;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let ad = new AngleDividerElement(ps[0], ps[1], ps[2], params[3] as PlaneElement, 2);
        let g = new LineElement({A: ps[1], B: ad});
        return [[ad, g], g];
    }
}

// line — angleDivider (3D variant)
// points B, A, C, plane D, integer n
// (Java: Slate.java line case 2, choice 1 — AngleDivider(B,A,C,D,n) + LineElement(A,result))
export class AngleDividerLine3dConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.angleDivider;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement, ct.Integer];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let ad = new AngleDividerElement(ps[0], ps[1], ps[2], params[3] as PlaneElement, params[4] as number);
        let g = new LineElement({A: ps[1], B: ad});
        return [[ad, g], g];
    }
}

// line
// foot (2D variant)
// 3 points A, B, C
// the line AD from A to the foot of the perpendicular from A to line BC
// (Java: Slate.java case 3, choice 0 — Foot(A,B,C) + LineElement(A,foot).
// Foot class already IMPL at src/elements/point/Foot.ts.)
export class LineFootConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.foot;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let fo = new Foot(ps[0], ps[1], ps[2]);
        let g = new LineElement({A: ps[0], B: fo});
        return [[fo, g], g];
    }
}

// *Solid Geometry Only*
// line
// foot
// point A plane B
// the line AD drawn perpendicular to plane B with the point D lying on B
// (Java: PlaneFoot.java — TS: PlaneFootElement.ts, renamed for clarity)
export class PlaneFootLineConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.foot;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const A = params[0] as PointElement;
        const P = params[1] as PlaneElement;
        const fo = new PlaneFootElement(A, P);
        const g = new LineElement({A: A, B: fo});
        return [[fo, g], g];
    }
}

// line
// chord
// points A, B, circle C
// the chord of circle C cut by the line AB
// (post-LineElement-expansion: A, B are the two endpoints of the input line)
// (Java: Slate.java line case 4 — new Chord(A,B,C). Java: Chord.java)
export class ChordConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.chord;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.CircleElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const D = params[0] as PointElement;
        const E = params[1] as PointElement;
        const C = params[2] as CircleElement;
        const g = new Chord({D, E, C});
        return [[g], g];
    }
}

// line
// bichord
// circles A, B
// the common chord connecting the two intersection points of the circles A and B
// (Java: Slate.java line case 5 — new Bichord(A,B). Java: Bichord.java)
export class BichordConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.bichord;
    signature: ConstructionTypes[] = [ct.CircleElement, ct.CircleElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : CircleElement[] = params;
        let g = new Bichord({C:ps[0], D:ps[1]});
        return [[g], g];
    }
}

// Line perpendicular constructions — all 5 variants share the same
// construct() pattern: call the parent point-perpendicular construct(),
// then return the Perpendicular LineElement (first in elementsForUpdate).
// (Java: Slate.java line case 6 — all choices dispatch to a Perpendicular
// or PlanePerpendicular, then return the LineElement directly.)
function wrapPointAsLine(es: [GeomElementsForUpdate, GeomElement]): [GeomElementsForUpdate, GeomElement] {
    return [es[0], es[0][0]];
}

// line — perpendicular variant 1: points A, B [plane C (screen)]
// the line from A to the point D so that AD is equal and perpendicular to AB in plane C
// (Java: Slate.java line case 6, choice 0 — Perpendicular(A,B,screen,A,B))
export class LinePerpendicular1Construction extends PointPerpendicular1Construction {
    constructionMethod: AllConstructions = LineConstructions.perpendicular;
    construct(screen: PlaneElement, params: any[]) { return wrapPointAsLine(super.construct(screen, params)); }
}

// line — perpendicular variant 2: points A, B, plane C
// (Java: Slate.java line case 6, choice 1 — Perpendicular(A,B,C,A,B))
export class LinePerpendicular2Construction extends PointPerpendicular2Construction {
    constructionMethod: AllConstructions = LineConstructions.perpendicular;
    construct(screen: PlaneElement, params: any[]) { return wrapPointAsLine(super.construct(screen, params)); }
}

// line — perpendicular variant 3: points A, B, D, E [plane C (screen)]
// (Java: Slate.java line case 6, choice 2 — Perpendicular(A,B,screen,D,E))
export class LinePerpendicular3Construction extends PointPerpendicular3Construction {
    constructionMethod: AllConstructions = LineConstructions.perpendicular;
    construct(screen: PlaneElement, params: any[]) { return wrapPointAsLine(super.construct(screen, params)); }
}

// line — perpendicular variant 4: points A, B, plane C, points D, E
// (Java: Slate.java line case 6, choice 3 — Perpendicular(A,B,C,D,E))
export class LinePerpendicular4Construction extends PointPerpendicular4Construction {
    constructionMethod: AllConstructions = LineConstructions.perpendicular;
    construct(screen: PlaneElement, params: any[]) { return wrapPointAsLine(super.construct(screen, params)); }
}

// line — perpendicular variant 5: point A, plane B, points C, D
// (Java: Slate.java line case 6, choice 4 — PlanePerpendicularLine(A,B,C,D))
export class LinePerpendicular5Construction extends PointPerpendicular5Construction {
    constructionMethod: AllConstructions = LineConstructions.perpendicular;
    construct(screen: PlaneElement, params: any[]) { return wrapPointAsLine(super.construct(screen, params)); }
}

// line
// cutoff
// points A, B, C, D
// the line AE equal to CD along the line AB
// (Java: Slate.java line case 7 — Layoff(A,A,B,C,D) + LineElement(A,layoff))
export class LineCutoffConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.cutoff;
    signature: ConstructionTypes[] = (new Array(4)).fill(ct.PointElement);

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let lo = new Layoff(ps[0], ps[0], ps[1], ps[2], ps[3]);
        let g = new LineElement({A: ps[0], B: lo});
        return [[lo, g], g];
    }
}

// line
// extend
// points A, B, C, D
// the line BE equal to CD so that A, B, and C are collinear with B between A and C
// (Java: Slate.java line case 8 — Layoff(B,A,B,C,D) + LineElement(B,layoff))
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

// line
// parallel
// points A, B, C
// the line AD through A parallel and equal to BC, so D = A + (C - B)
// (no dedicated Java class — Slate.java case 9 dispatches to a Layoff
// trick: Layoff(A, B, C, B, C) gives D = A + (C-B), then wraps a fresh
// LineElement(A, D). Same pattern as LineExtendConstruction above.)
export class LineParallelConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.parallel;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let lo = new Layoff(ps[0], ps[1], ps[2], ps[1], ps[2]);
        let g = new LineElement({A: ps[0], B: lo});
        return [[lo, g], g];
    }
}

// line
// similar (2D variant)
// points A, B, D, E, F
// the line AH so that triangle ABH is similar to triangle DEF (screen plane)
// (Java: Slate.java line case 10 — Similar(A,B,screen,D,E,F,screen) + LineElement(A,H))
export class SimilarLineConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.similar;
    signature: ConstructionTypes[] = (new Array(5)).fill(ct.PointElement);

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let sim = new SimilarElement(ps[0], ps[1], screen, ps[2], ps[3], ps[4], screen);
        let g = new LineElement({A: ps[0], B: sim});
        return [[sim, g], g];
    }
}

// line — similar (3D variant)
// points A, B, plane C, points D, E, F, plane G
// (Java: Slate.java line case 10, choice 1 — Similar(A,B,C,D,E,F,G) + LineElement(A,H))
export class SimilarLine3dConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.similar;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PlaneElement,
        ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const A = params[0] as PointElement, B = params[1] as PointElement;
        const C = params[2] as PlaneElement;
        const D = params[3] as PointElement, E = params[4] as PointElement, F = params[5] as PointElement;
        const G = params[6] as PlaneElement;
        let sim = new SimilarElement(A, B, C, D, E, F, G);
        let g = new LineElement({A: A, B: sim});
        return [[sim, g], g];
    }
}

// line
// proportion
// 8 points A, B, C, D, E, F, G, H
// the line GI along GH so that AB:CD = EF:GI
// (Java: Slate.java line case 11 — Proportion + LineElement(G, result))
export class ProportionLineConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.proportion;
    signature: ConstructionTypes[] = (new Array(8)).fill(ct.PointElement);

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let prop = new ProportionElement(ps[0], ps[1], ps[2], ps[3], ps[4], ps[5], ps[6], ps[7]);
        let g = new LineElement({A: ps[6], B: prop});
        return [[prop, g], g];
    }
}

// line
// meanProportional
// 6 points S0, S1, T0, T1, U0, U1
// the line U0U' along U0U1 so that S:U' = U':T
// (Java: Slate.java line case 12 — MeanProportional + LineElement(U0, result))
export class MeanProportionalLineConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.meanProportional;
    signature: ConstructionTypes[] = (new Array(6)).fill(ct.PointElement);

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let mp = new MeanProportionalElement(ps[0], ps[1], ps[2], ps[3], ps[4], ps[5]);
        let g = new LineElement({A: ps[4], B: mp});
        return [[mp, g], g];
    }
}

/************************
 * Element Class Circle *
 ************************/

// circle
// radius
// points A, B [plane C=screen]
// the circle with center A and radius AB in the plane C
// (Java: Slate.java circle case 0, choice 0 — new CircleElement(A,B,screen))
export class CircleRadiusCenterConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructions.radius;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new CircleElement({C:ps[0], B:ps[1], AP:screen});
        return [[g], g];
    }
}

// circle — radius (3D, 2-point)
// points A, B, plane C
// the circle with center A and radius AB in the plane C
// (Java: Slate.java circle case 0, choice 2 — new CircleElement(A,B,C))
export class CircleRadius3dConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructions.radius;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new CircleElement({C: ps[0], B: ps[1], AP: params[2] as PlaneElement});
        return [[g], g];
    }
}

// circle — radius (3D, 3-point)
// points A, B, C, plane D
// (Java: Slate.java circle case 0, choice 3 — new CircleElement(A,B,C,D))
export class CircleRadius3Point3dConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructions.radius;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new CircleElement({C: ps[0], A: ps[1], B: ps[2], AP: params[3] as PlaneElement});
        return [[g], g];
    }
}

// circle — radius (2D, 3-point)
// points A, B, C
// the circle with center A and radius |BC| in the screen plane
// (Java: CircleElement(A, B, C, screen) — A=center, radius=B.distance(C))
// MUST be registered BEFORE the 2-point variant in the constructions array
// (signature variant ordering rule: longer signature first)
export class CircleRadius3PointConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructions.radius;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new CircleElement({C: ps[0], A: ps[1], B: ps[2], AP: screen});
        return [[g], g];
    }
}


// circle
// invert
// circles A, B
// the image of circle A inverted in circle B
// (Java: InvertCircle.java — TS: InvertCircleElement.ts)
export class InvertCircleConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructions.invert;
    signature: ConstructionTypes[] = [ct.CircleElement, ct.CircleElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const C = params[0] as CircleElement;
        const D = params[1] as CircleElement;
        const g = new InvertCircleElement(C, D);
        return [[g], g];
    }
}

// circle
// intersection
// spheres A, B
// the circle at the intersection of spheres A and B
// (Java: IntersectionSS.java — TS: SphereIntersectionElement.ts)
export class SphereIntersectionConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructions.intersection;
    signature: ConstructionTypes[] = [ct.SphereElement, ct.SphereElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const S = params[0] as SphereElement;
        const T = params[1] as SphereElement;
        const g = new SphereIntersectionElement(S, T);
        return [[g], g];
    }
}

/*************************
 * Element Class Polygon *
 *************************/

abstract class PolyConstruction extends Construction {
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new PolygonElement(ps);
        return [[g],g];
    }
}

// polygon
// square
// points A, B [plane C]
// the square on a side AB in plane C (2D variant: plane defaults to screen)
// (Java: RegularPolygon.java with n=4 — same class as equilateralTriangle)
export class SquarePolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.square;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const [a, b] = params as [PointElement, PointElement];
        const g = new RegularPolygonElement(a, b, screen, 4);
        return [[g], g];
    }
}

// polygon — square (3D variant)
// points A, B, plane C
// (Java: Slate.java polygon case 0, choice 1 — new RegularPolygon(A,B,C,4))
export class SquarePolygon3dConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.square;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const [a, b] = params as [PointElement, PointElement];
        const g = new RegularPolygonElement(a, b, params[2] as PlaneElement, 4);
        return [[g], g];
    }
}

// polygon
// triangle
// points A, B, C
// the triangle ABC given 3 vertices A, B, and C
// (Java: Slate.java polygon case 1 — new PolygonElement(A,B,C))
export class TrianglePolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructions.triangle;
    signature: ConstructionTypes[] = (new Array(3)).fill(ct.PointElement);
}

// polygon
// quadrilateral
// points A, B, C, D
// the quadrilateral ABCD given 4 vertices A, B, C, and D
// (Java: Slate.java polygon case 2 — new PolygonElement(A,B,C,D))
export class QuadrilateralPolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructions.quadrilateral;
    signature: ConstructionTypes[] = (new Array(4)).fill(ct.PointElement);
}

// polygon
// pentagon
// points A, B, C, D, E
// the pentagon given 5 vertices (free points, not a regular pentagon)
// (Java: Slate.java polygon case 3 — new PolygonElement(A,B,C,D,E))
export class PentagonPolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructions.pentagon;
    signature: ConstructionTypes[] = (new Array(5)).fill(ct.PointElement);
}

// polygon
// hexagon
// points A, B, C, D, E, F
// the hexagon given 6 vertices (free points)
// (Java: Slate.java polygon case 4 — new PolygonElement(A,B,C,D,E,F))
export class HexagonPolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructions.hexagon;
    signature: ConstructionTypes[] = (new Array(6)).fill(ct.PointElement);
}

// polygon
// equilateralTriangle
// points A, B [plane C = screen]
// the equilateral triangle on side AB in the screen plane (2D variant)
// (Java: Slate.java polygon case 5, choice 0 — new RegularPolygon(A,B,screen,3))
export class EquilateralTriangleConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.equilateralTriangle;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const [a, b] = params as [PointElement, PointElement];
        const g = new RegularPolygonElement(a, b, screen, 3);
        return [[g], g];
    }
}

// polygon — equilateralTriangle (3D variant)
// points A, B, plane C
// (Java: Slate.java polygon case 5, choice 1 — new RegularPolygon(A,B,C,3))
export class EquilateralTriangle3dConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.equilateralTriangle;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const [a, b] = params as [PointElement, PointElement];
        const g = new RegularPolygonElement(a, b, params[2] as PlaneElement, 3);
        return [[g], g];
    }
}

// polygon
// parallelogram
// points A, B, C
// the parallelogram ABCD given A, B, and C, where D = A + (C - B)
// (no dedicated Java class — Slate.java case 6 dispatches to a Layoff
// trick identical to the point;parallelogram and line;parallel patterns)
export class ParallelogramPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.parallelogram;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let lo = new Layoff(ps[0], ps[1], ps[2], ps[1], ps[2]);
        let g = new PolygonElement([ps[0], ps[1], ps[2], lo]);
        return [[lo, g], g];
    }
}

// polygon
// regularPolygon (2D variant)
// points A, B, integer n
// the regular n-gon on side AB in the screen plane
// (Java: Slate.java polygon case 7 — RegularPolygon(A, B, screen, n))
export class RegularPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.regularPolygon;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.Integer];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const a = params[0] as PointElement;
        const b = params[1] as PointElement;
        const n = params[2] as number;
        const g = new RegularPolygonElement(a, b, screen, n);
        return [[g], g];
    }
}

// polygon — regularPolygon (3D variant)
// points A, B, plane C, integer n
// (Java: Slate.java polygon case 7, choice 1 — new RegularPolygon(A,B,C,n))
export class RegularPolygon3dConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.regularPolygon;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PlaneElement, ct.Integer];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const a = params[0] as PointElement;
        const b = params[1] as PointElement;
        const plane = params[2] as PlaneElement;
        const n = params[3] as number;
        const g = new RegularPolygonElement(a, b, plane, n);
        return [[g], g];
    }
}

// polygon
// starPolygon (2D variant)
// points A, B, integers n, d
// the star polygon {n/d} on side AB in the screen plane
// (Java: Slate.java polygon case 8 — new RegularPolygon(A,B,screen,n,d))
export class StarPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.starPolygon;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.Integer, ct.Integer];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const a = params[0] as PointElement;
        const b = params[1] as PointElement;
        const n = params[2] as number;
        const d = params[3] as number;
        const g = new RegularPolygonElement(a, b, screen, n, d);
        return [[g], g];
    }
}


// polygon
// similar (2D variant)
// points A, B, D, E, F
// the triangle ABH where H is the similar point so △ABH ∼ △DEF (screen plane)
// (Java: Slate.java polygon case 9 — Similar(A,B,screen,D,E,F,screen) + PolygonElement(A,B,H))
export class SimilarPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.similar;
    signature: ConstructionTypes[] = (new Array(5)).fill(ct.PointElement);

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let sim = new SimilarElement(ps[0], ps[1], screen, ps[2], ps[3], ps[4], screen);
        let g = new PolygonElement([ps[0], ps[1], sim]);
        return [[sim, g], g];
    }
}

// polygon — similar (3D variant)
// points A, B, plane C, points D, E, F, plane G
// (Java: Slate.java polygon case 9, choice 1 — Similar(A,B,C,D,E,F,G) + PolygonElement(A,B,H))
export class SimilarPolygon3dConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.similar;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PlaneElement,
        ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const A = params[0] as PointElement, B = params[1] as PointElement;
        const C = params[2] as PlaneElement;
        const D = params[3] as PointElement, E = params[4] as PointElement, F = params[5] as PointElement;
        const G = params[6] as PlaneElement;
        let sim = new SimilarElement(A, B, C, D, E, F, G);
        let g = new PolygonElement([A, B, sim]);
        return [[sim, g], g];
    }
}

// polygon
// application
// polygon A points B, C, D
// the parallelogram equal to the given polygon A with one side BC and one angle BCD
// (Java: Application.java — parallelogram with area = P.area(), side BC, angle DCB)
export class ApplicationPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.application;
    signature: ConstructionTypes[] = [ct.PolygonElement, ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const P = params[0] as PolygonElement;
        const A = params[1] as PointElement;
        const B = params[2] as PointElement;
        const C = params[3] as PointElement;
        const g = new ApplicationElement(P, A, B, C);
        return [[g], g];
    }
}

// polygon
// octagon
// 8 points A, B, C, D, E, F, G, H
// the octagon given 8 vertices (free points, pass-through)
// (Java: Slate.java polygon case 11 — new PolygonElement(A,B,C,D,E,F,G,H))
export class OctagonPolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructions.octagon;
    signature: ConstructionTypes[] = (new Array(8)).fill(ct.PointElement);
}

// polygon
// face
// polyhedron A integer n
// the nth face (1-based) of polyhedron A
// (Java: Slate.java polygon case 12 — ((PolyhedronElement)E[0]).P[N[0]-1])
// Same pattern as point;vertex (returns polygon from polyhedron, not point from polygon)
export class FacePolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.face;
    signature: ConstructionTypes[] = [ct.PolyhedronElement, ct.Integer];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const polyhedron = params[0] as PolyhedronElement;
        const n = params[1] as number;
        const face = polyhedron.P[n - 1];
        return [[face], face];
    }
}

/************************
 * Element Class Sector *
 ************************/


// sector
// sector
// points A, B, C [plane D = screen]
// the sector of a circle in plane D given the center A and two points B and C on the circumference
// (Java: Slate.java sector case 0, choice 0 — new SectorElement(A,B,C,screen))
export class SectorConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructions.sector;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new SectorElement({O:ps[0], A:ps[1], B:ps[2], P: screen});
        return [[g], g];
    }
}

// sector — sector (3D variant)
// points A, B, C, plane D
// the sector of a circle in plane D given the center A and two points B and C on the circumference
// (Java: Slate.java sector case 0, choice 1 — new SectorElement(A,B,C,D))
export class Sector2Construction extends Construction {
    constructionMethod: AllConstructions = SectorConstructions.sector;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let c : PointElement = params[2];
        let d : PlaneElement = params[3];
        let g = new SectorElement({O:a, A:b, B:c, P: d});
        return [[g], g];
    }
}

// sector
// arc
// points A, M, B
// the arc of the circle through points A, M, B in the screen plane
// (M is the "through" point between the two endpoints A and B)
// 2D variant: arc passes through A, M, B in the screen plane.
// M is the "through" point between endpoints A and B.
// (Java: Slate.java sector case 1 — new ArcElement(A, M, B, screen))
export class ArcConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructions.arc;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new ArcElement(ps[0], ps[1], ps[2], screen);
        return [[g], g];
    }
}

// sector — arc (3D variant)
// points A, M, B, plane D
// (Java: Slate.java sector case 1, choice 1 — new ArcElement(A,M,B,D))
export class Arc3dConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructions.arc;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new ArcElement(ps[0], ps[1], ps[2], params[3] as PlaneElement);
        return [[g], g];
    }
}

/***********************
 * Element Class Plane *
 ***********************/

// plane
// 3points
// points A, B, C
// the plane passing through points A, B, and C
// (Java: Slate.java plane case 0 — new PlaneElement(A, B, C).
// PlaneElement.ts already has the full constructor + update() that computes S, T, U.)
export class Plane3PointsConstruction extends Construction {
    constructionMethod: AllConstructions = PlaneConstructions.threePoints;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new PlaneElement({A: ps[0], B: ps[1], C: ps[2]});
        return [[g], g];
    }
}

// plane
// perpendicular
// points A, B
// the plane passing through point A and perpendicular to line AB
// (Java: Slate.java plane case 1 — new PerpendicularPL(A,B). Java: PerpendicularPL.java)
export class PerpendicularPlaneConstruction extends Construction {
    constructionMethod: AllConstructions = PlaneConstructions.perpendicular;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement]
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new PerpendicularPlane({A: ps[0], E: ps[1]});
        return [[g], g];
    }
}



// plane
// parallel
// plane P, point A
// the plane passing through point A and parallel to plane P
// (Java: ParallelP.java — 26 lines, line-for-line port)
export class PlaneParallelConstruction extends Construction {
    constructionMethod: AllConstructions = PlaneConstructions.parallel;
    signature: ConstructionTypes[] = [ct.PlaneElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const P = params[0] as PlaneElement;
        const A = params[1] as PointElement;
        const g = new ParallelPlane(P, A);
        return [[g], g];
    }
}

// plane
// ambient (point variant)
// point A
// the ambient plane of point A
// (Java: Slate.java plane case 3, choice 0 — returns P[0].AP)
export class AmbientPlanePointConstruction extends Construction {
    constructionMethod: AllConstructions = PlaneConstructions.ambient;
    signature: ConstructionTypes[] = [ct.PointElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const p = params[0] as PointElement;
        return [[p._AP], p._AP];
    }
}

// plane
// ambient (circle variant)
// circle A
// the ambient plane of circle A
// (Java: Slate.java plane case 3, choice 1 — returns ((CircleElement)E[0]).AP)
export class AmbientPlaneCircleConstruction extends Construction {
    constructionMethod: AllConstructions = PlaneConstructions.ambient;
    signature: ConstructionTypes[] = [ct.CircleElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const c = params[0] as CircleElement;
        return [[c.AP], c.AP];
    }
}

/************************
 * Element Class Sphere *
 ************************/

// sphere
// radius
// points A, B
// the sphere with center A and radius AB
// (Java: Slate.java sphere case 0 — new SphereElement(A, A, B))
export class SphereRadiusConstruction extends Construction {
    constructionMethod: AllConstructions = SphereConstructions.radius;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement]
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new SphereElement({Center: ps[0], B: ps[1]});
        return [[g], g];
    }
}



// sphere
// radius (3-point variant)
// points A, B, C
// the sphere with center A and radius |BC|
// (Java: Slate.java sphere case 0, choice 1 — new SphereElement(A,B,C))
export class SphereRadius3PointConstruction extends Construction {
    constructionMethod: AllConstructions = SphereConstructions.radius;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new SphereElement({Center: ps[0], A: ps[1], B: ps[2]});
        return [[g], g];
    }
}

/****************************
 * Element Class Polyhedron *
 ****************************/

// polyhedron
// tetrahedron
// points A, B, C, D
// the tetrahedron given four vertices (creates a triangle base + Pyramid)
// (Java: Slate.java polyhedron case 0 — PolygonElement(A,B,C) + Pyramid(base,D))
export class TetrahedronConstruction extends Construction {
    constructionMethod: AllConstructions = PolyhedraConstructions.tetrahedron;
    signature: ConstructionTypes[] = (new Array(4)).fill(ct.PointElement);

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let base = new PolygonElement([ps[0], ps[1], ps[2]]);
        let g = new PyramidElement(base, ps[3]);
        return [[base, g], g];
    }
}

// polyhedron
// parallelepiped
// points A, B, C, D
// the parallelepiped with three edges AB, AC, and AD
// (Java: Slate.java polyhedron case 1 — Layoff(B,A,C,A,C) + PolygonElement(B,A,C,fourth) + Prism(base,A,D))
export class ParallelepipedConstruction extends Construction {
    constructionMethod: AllConstructions = PolyhedraConstructions.parallelepiped;
    signature: ConstructionTypes[] = (new Array(4)).fill(ct.PointElement);

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let fourth = new Layoff(ps[1], ps[0], ps[2], ps[0], ps[2]);
        let base = new PolygonElement([ps[1], ps[0], ps[2], fourth]);
        let g = new PrismElement(base, ps[0], ps[3]);
        return [[fourth, base, g], g];
    }
}

// polyhedron
// prism
// polygon A points B, C
// the prism with base A and side edges parallel and equal to BC
// (Java: Prism.java — 41 lines, line-for-line port)
export class PrismConstruction extends Construction {
    constructionMethod: AllConstructions = PolyhedraConstructions.prism;
    signature: ConstructionTypes[] = [ct.PolygonElement, ct.PointElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const base = params[0] as PolygonElement;
        const C = params[1] as PointElement;
        const D = params[2] as PointElement;
        const g = new PrismElement(base, C, D);
        return [[g], g];
    }
}

// polyhedron
// pyramid
// polygon A point B
// the pyramid with base A and apex B
// (Java: Pyramid.java — 11 lines, line-for-line port)
export class PyramidConstruction extends Construction {
    constructionMethod: AllConstructions = PolyhedraConstructions.pyramid;
    signature: ConstructionTypes[] = [ct.PolygonElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const base = params[0] as PolygonElement;
        const apex = params[1] as PointElement;
        const g = new PyramidElement(base, apex);
        return [[g], g];
    }
}


export const constructions : Construction[] = [
    new FreePointConstruction(),
    new FixedPoint2dConstruction(),
    new FixedPoint3dConstruction(),
    new FirstPointConstruction(),
    new LastPointConstruction(),
    new CircleCenterConstruction(),
    new CircumcenterConstruction(),
    new CircumcenterConstruction2d(),
    new MidPointConstruction(),
    new IntersectionConstruction(),
    new IntersectionConstructionScreen(),
    new FootPointConstruction(),
    new PlaneFootPointConstruction(),
    new ExtendConstruction(),
    new CutoffConstruction(),
    new ParallelogramConstruction(),
    new SimilarPoint3dConstruction(),
    new SimilarPointConstruction(),
    new ProportionPointConstruction(),
    new AngleBisectorPoint3dConstruction(),
    new AngleBisectorPointConstruction(),
    new AngleDividerPoint3dConstruction(),
    new AngleDividerPointConstruction(),
    new MeanProportionalPointConstruction(),
    new PlaneSliderConstruction(),
    new SphereSliderConstruction(),
    new HarmonicPointConstruction(),
    new InvertPointConstruction(),
    new PlaneIntersectionConstruction(),
    new SphereCenterConstruction(),
    new CircumcircleConstruction(),
    new CircumcircleConstruction2d(),
    new LineSliderConstruction(),
    new LineSlider2dConstruction(),
    new LineSliderSegmentConstruction(),
    new LineConnectConstruction(),
    new LineExtendConstruction(),
    new SectorConstruction(),
    new Sector2Construction(),
    new Arc3dConstruction(),
    new ArcConstruction(),
    new CircleSliderConstruction(),
    new CircleSliderConstruction2dPoint(),
    new CircleRadius3Point3dConstruction(),
    new CircleRadius3dConstruction(),
    new CircleRadius3PointConstruction(),
    new CircleRadiusCenterConstruction(),
    new InvertCircleConstruction(),
    new SphereIntersectionConstruction(),
    new PointPerpendicular1Construction(),
    new PointPerpendicular2Construction(),
    new PointPerpendicular3Construction(),
    new PointPerpendicular4Construction(),
    new PointPerpendicular5Construction(),
    new LinePerpendicular1Construction(),
    new LinePerpendicular2Construction(),
    new LinePerpendicular3Construction(),
    new LinePerpendicular4Construction(),
    new LinePerpendicular5Construction(),
    new BichordConstruction(),
    new ChordConstruction(),
    new LineParallelConstruction(),
    new LineCutoffConstruction(),
    new PlaneFootLineConstruction(),
    new LineFootConstruction(),
    new SimilarLine3dConstruction(),
    new SimilarLineConstruction(),
    new ProportionLineConstruction(),
    new AngleBisectorLine3dConstruction(),
    new AngleBisectorLineConstruction(),
    new AngleDividerLine3dConstruction(),
    new AngleDividerLineConstruction(),
    new MeanProportionalLineConstruction(),
    new TrianglePolygonConstruction(),
    new StarPolygonConstruction(),
    new RegularPolygon3dConstruction(),
    new RegularPolygonConstruction(),
    new SquarePolygon3dConstruction(),
    new SquarePolygonConstruction(),
    new EquilateralTriangle3dConstruction(),
    new EquilateralTriangleConstruction(),
    new ParallelogramPolygonConstruction(),
    new QuadrilateralPolygonConstruction(),
    new OctagonPolygonConstruction(),
    new PentagonPolygonConstruction(),
    new HexagonPolygonConstruction(),
    new SimilarPolygon3dConstruction(),
    new SimilarPolygonConstruction(),
    new ApplicationPolygonConstruction(),
    new VertexConstruction(),
    new Plane3PointsConstruction(),
    new PerpendicularPlaneConstruction(),
    new PlaneParallelConstruction(),
    new AmbientPlanePointConstruction(),
    new AmbientPlaneCircleConstruction(),
    new SphereRadius3PointConstruction(),
    new SphereRadiusConstruction(),
    new TetrahedronConstruction(),
    new ParallelepipedConstruction(),
    new PrismConstruction(),
    new PyramidConstruction(),
    new FacePolygonConstruction(),
];
