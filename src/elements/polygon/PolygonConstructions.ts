/*----------------------------------------------------------------------+
|    Polygon construction classes — extracted from Constructions.ts      |
|    Each class maps a (type, constructionName, signature) triple to    |
|    a construct() method that creates the geometry element.             |
+----------------------------------------------------------------------*/

import {Construction, ConstructionSignature, SortedParams, AllConstructions,
        PolygonConstructions as PolygonConstructionsEnum,
        GeomElementsForUpdate} from "../Constructions";
import {GeomElement} from "../GeomElement";
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "../point/PointElement";
import {Layoff} from "../point/Layoff";
import {SimilarElement} from "../point/SimilarElement";
import {PolygonElement} from "./PolygonElement";
import {RegularPolygonElement} from "./RegularPolygonElement";
import {ApplicationElement} from "./ApplicationElement";
import {PolyhedronElement} from "../polyhedron/PolyhedronElement";

/*************************
 * Element Class Polygon *
 *************************/

export abstract class PolyConstruction extends Construction {
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new PolygonElement(P);
        return [[g],g];
    }
}

// polygon
// square — points A, B [, plane C = screen]
// the square on a side AB in plane C
// 2D: 2 points, 0 elements — uses screen plane
// 3D: 2 points, 1 PlaneElement — uses explicit plane
// (Java: RegularPolygon.java with n=4 — same class as equilateralTriangle)
export class SquarePolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.square;
    signature: ConstructionSignature = { points: 2, elements: 0, integers: 0 };
    public validateSignature(cm: AllConstructions, sp: SortedParams): boolean {
        if (cm !== this.constructionMethod) return false;
        return sp.P.length === 2 && sp.N.length === 0
            && (sp.E.length === 0 || (sp.E.length === 1 && sp.E[0] instanceof PlaneElement));
    }
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const plane = E.length > 0 ? E[0] as PlaneElement : screen;
        const g = new RegularPolygonElement(P[0], P[1], plane, 4);
        return [[g], g];
    }
}

// polygon
// triangle
// points A, B, C
// the triangle ABC given 3 vertices A, B, and C
// (Java: Slate.java polygon case 1 — new PolygonElement(A,B,C))
export class TrianglePolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.triangle;
    signature = { points: 3, elements: 0, integers: 0 };
}

// polygon
// quadrilateral
// points A, B, C, D
// the quadrilateral ABCD given 4 vertices A, B, C, and D
// (Java: Slate.java polygon case 2 — new PolygonElement(A,B,C,D))
export class QuadrilateralPolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.quadrilateral;
    signature = { points: 4, elements: 0, integers: 0 };
}

// polygon
// pentagon
// points A, B, C, D, E
// the pentagon given 5 vertices (free points, not a regular pentagon)
// (Java: Slate.java polygon case 3 — new PolygonElement(A,B,C,D,E))
export class PentagonPolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.pentagon;
    signature = { points: 5, elements: 0, integers: 0 };
}

// polygon
// hexagon
// points A, B, C, D, E, F
// the hexagon given 6 vertices (free points)
// (Java: Slate.java polygon case 4 — new PolygonElement(A,B,C,D,E,F))
export class HexagonPolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.hexagon;
    signature = { points: 6, elements: 0, integers: 0 };
}

// polygon
// equilateralTriangle — points A, B [, plane C = screen]
// the equilateral triangle on side AB in the plane C
// 2D: 2 points, 0 elements — uses screen plane
// 3D: 2 points, 1 PlaneElement — uses explicit plane
// (Java: Slate.java polygon case 5 — new RegularPolygon(A,B,plane,3))
export class EquilateralTriangleConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.equilateralTriangle;
    signature: ConstructionSignature = { points: 2, elements: 0, integers: 0 };
    public validateSignature(cm: AllConstructions, sp: SortedParams): boolean {
        if (cm !== this.constructionMethod) return false;
        return sp.P.length === 2 && sp.N.length === 0
            && (sp.E.length === 0 || (sp.E.length === 1 && sp.E[0] instanceof PlaneElement));
    }
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const plane = E.length > 0 ? E[0] as PlaneElement : screen;
        const g = new RegularPolygonElement(P[0], P[1], plane, 3);
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
    constructionMethod: AllConstructions = PolygonConstructionsEnum.parallelogram;
    signature = { points: 3, elements: 0, integers: 0 };

    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let lo = new Layoff(P[0], P[1], P[2], P[1], P[2]);
        let g = new PolygonElement([P[0], P[1], P[2], lo]);
        return [[lo, g], g];
    }
}

// polygon
// regularPolygon — points A, B, integer n [, plane C = screen]
// the regular n-gon on side AB in the plane C
// 2D: 2 points, 0 elements, 1 integer — uses screen plane
// 3D: 2 points, 1 PlaneElement, 1 integer — uses explicit plane
// (Java: Slate.java polygon case 7 — RegularPolygon(A,B,plane,n))
export class RegularPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.regularPolygon;
    signature: ConstructionSignature = { points: 2, elements: 0, integers: 1 };
    public validateSignature(cm: AllConstructions, sp: SortedParams): boolean {
        if (cm !== this.constructionMethod) return false;
        return sp.P.length === 2 && sp.N.length === 1
            && (sp.E.length === 0 || (sp.E.length === 1 && sp.E[0] instanceof PlaneElement));
    }
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const plane = E.length > 0 ? E[0] as PlaneElement : screen;
        const g = new RegularPolygonElement(P[0], P[1], plane, N[0]);
        return [[g], g];
    }
}

// polygon
// starPolygon (2D variant)
// points A, B, integers n, d
// the star polygon {n/d} on side AB in the screen plane
// (Java: Slate.java polygon case 8 — new RegularPolygon(A,B,screen,n,d))
export class StarPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.starPolygon;
    signature = { points: 2, elements: 0, integers: 2 };

    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new RegularPolygonElement(P[0], P[1], screen, N[0], N[1]);
        return [[g], g];
    }
}


// polygon
// similar — points A, B, D, E, F [, planes C, G = screen]
// the triangle ABH where H is the similar point so triangle ABH ~ triangle DEF
// 2D: 5 points, 0 elements — uses screen plane for both
// 3D: 5 points, 2 PlaneElements — uses explicit planes
// (Java: Slate.java polygon case 9 — Similar(A,B,C,D,E,F,G) + PolygonElement(A,B,H))
export class SimilarPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.similar;
    signature: ConstructionSignature = { points: 5, elements: 0, integers: 0 };
    public validateSignature(cm: AllConstructions, sp: SortedParams): boolean {
        if (cm !== this.constructionMethod) return false;
        return sp.P.length === 5 && sp.N.length === 0
            && (sp.E.length === 0 || sp.E.length === 2);
    }
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let c = E.length > 0 ? E[0] as PlaneElement : screen;
        let g2 = E.length > 1 ? E[1] as PlaneElement : screen;
        let sim = new SimilarElement(P[0], P[1], c, P[2], P[3], P[4], g2);
        let g = new PolygonElement([P[0], P[1], sim]);
        return [[sim, g], g];
    }
}

// polygon
// application
// polygon A points B, C, D
// the parallelogram equal to the given polygon A with one side BC and one angle BCD
// (Java: Application.java — parallelogram with area = P.area(), side BC, angle DCB)
export class ApplicationPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.application;
    signature = { points: 3, elements: 1, integers: 0, elementTypes: [PolygonElement] };

    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new ApplicationElement(E[0] as PolygonElement, P[0], P[1], P[2]);
        return [[g], g];
    }
}

// polygon
// octagon
// 8 points A, B, C, D, E, F, G, H
// the octagon given 8 vertices (free points, pass-through)
// (Java: Slate.java polygon case 11 — new PolygonElement(A,B,C,D,E,F,G,H))
export class OctagonPolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.octagon;
    signature = { points: 8, elements: 0, integers: 0 };
}

// polygon
// face
// polyhedron A integer n
// the nth face (1-based) of polyhedron A
// (Java: Slate.java polygon case 12 — ((PolyhedronElement)E[0]).P[N[0]-1])
// Same pattern as point;vertex (returns polygon from polyhedron, not point from polygon)
export class FacePolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.face;
    signature = { points: 0, elements: 1, integers: 1, elementTypes: [PolyhedronElement] };

    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const polyhedron = E[0] as PolyhedronElement;
        const face = polyhedron.P[N[0] - 1];
        return [[face], face];
    }
}

export const polygonConstructions: Construction[] = [
    new TrianglePolygonConstruction(),
    new StarPolygonConstruction(),
    new RegularPolygonConstruction(),
    new SquarePolygonConstruction(),
    new EquilateralTriangleConstruction(),
    new ParallelogramPolygonConstruction(),
    new QuadrilateralPolygonConstruction(),
    new OctagonPolygonConstruction(),
    new PentagonPolygonConstruction(),
    new HexagonPolygonConstruction(),
    new SimilarPolygonConstruction(),
    new ApplicationPolygonConstruction(),
    new FacePolygonConstruction(),
];
