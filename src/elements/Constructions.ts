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
import {PointElement} from "./point/PointElement";
import {PolygonElement} from "./polygon/PolygonElement";
import {PolyhedronElement} from "./polyhedron/PolyhedronElement";
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
    VertexConstruction} from "./point/PointConstructions";





/**********************
 * Element Class Line *
 * (see line/LineConstructions.ts for all line construction classes)
 **********************/

import {LineConnectConstruction,
    AngleBisectorLineConstruction, AngleDividerLineConstruction,
    AngleBisectorLine3dConstruction, AngleDividerLine3dConstruction,
    LineFootConstruction, PlaneFootLineConstruction,
    ChordConstruction, BichordConstruction,
    LinePerpendicular1Construction, LinePerpendicular2Construction,
    LinePerpendicular3Construction, LinePerpendicular4Construction,
    LinePerpendicular5Construction,
    LineCutoffConstruction, LineExtendConstruction,
    LineParallelConstruction,
    SimilarLineConstruction, SimilarLine3dConstruction,
    ProportionLineConstruction, MeanProportionalLineConstruction
    } from "./line/LineConstructions";



/************************
 * Element Class Circle *
 * (see circle/CircleConstructions.ts for circle construction classes)
 * (CircumcircleConstruction lives in point/PointConstructions.ts)
 ************************/

import {CircleRadiusCenterConstruction, CircleRadius3dConstruction,
    CircleRadius3Point3dConstruction, CircleRadius3PointConstruction,
    InvertCircleConstruction, SphereIntersectionConstruction
    } from "./circle/CircleConstructions";


/*************************
 * Element Class Polygon *
 * (see polygon/PolygonConstructions.ts for all polygon construction classes)
 *************************/

import {SquarePolygonConstruction, SquarePolygon3dConstruction,
    TrianglePolygonConstruction, QuadrilateralPolygonConstruction,
    PentagonPolygonConstruction, HexagonPolygonConstruction,
    EquilateralTriangleConstruction, EquilateralTriangle3dConstruction,
    ParallelogramPolygonConstruction,
    RegularPolygonConstruction, RegularPolygon3dConstruction,
    StarPolygonConstruction,
    SimilarPolygonConstruction, SimilarPolygon3dConstruction,
    ApplicationPolygonConstruction,
    OctagonPolygonConstruction, FacePolygonConstruction
    } from "./polygon/PolygonConstructions";

/************************
 * Element Class Sector *
 * (see sector/SectorConstructions.ts for all sector construction classes)
 ************************/

import {SectorConstruction, Sector2Construction,
    ArcConstruction, Arc3dConstruction
    } from "./sector/SectorConstructions";

/***********************
 * Element Class Plane *
 * (see plane/PlaneConstructions.ts for all plane construction classes)
 ***********************/

import {Plane3PointsConstruction, PerpendicularPlaneConstruction,
    PlaneParallelConstruction,
    AmbientPlanePointConstruction, AmbientPlaneCircleConstruction
    } from "./plane/PlaneConstructions";

/************************
 * Element Class Sphere *
 * (see sphere/SphereConstructions.ts for all sphere construction classes)
 ************************/

import {SphereRadiusConstruction, SphereRadius3PointConstruction
    } from "./sphere/SphereConstructions";

/****************************
 * Element Class Polyhedron *
 * (see polyhedron/PolyhedronConstructions.ts for all polyhedron construction classes)
 ****************************/

import {TetrahedronConstruction, ParallelepipedConstruction,
    PrismConstruction, PyramidConstruction
    } from "./polyhedron/PolyhedronConstructions";


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
