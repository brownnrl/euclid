/*----------------------------------------------------------------------+
|    Polygon construction classes — extracted from Constructions.ts      |
|    Each class maps a (type, constructionName, signature) triple to    |
|    a construct() method that creates the geometry element.             |
+----------------------------------------------------------------------*/

import {Construction, AllConstructions,
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
// square
// points A, B [plane C]
// the square on a side AB in plane C (2D variant: plane defaults to screen)
// (Java: RegularPolygon.java with n=4 — same class as equilateralTriangle)
export class SquarePolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.square;
    signature = { points: 2, elements: 0, integers: 0 };

    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new RegularPolygonElement(P[0], P[1], screen, 4);
        return [[g], g];
    }
}

// polygon — square (3D variant)
// points A, B, plane C
// (Java: Slate.java polygon case 0, choice 1 — new RegularPolygon(A,B,C,4))
export class SquarePolygon3dConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.square;
    signature = { points: 2, elements: 1, integers: 0, elementTypes: [PlaneElement] };

    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new RegularPolygonElement(P[0], P[1], E[0] as PlaneElement, 4);
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
// equilateralTriangle
// points A, B [plane C = screen]
// the equilateral triangle on side AB in the screen plane (2D variant)
// (Java: Slate.java polygon case 5, choice 0 — new RegularPolygon(A,B,screen,3))
export class EquilateralTriangleConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.equilateralTriangle;
    signature = { points: 2, elements: 0, integers: 0 };

    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new RegularPolygonElement(P[0], P[1], screen, 3);
        return [[g], g];
    }
}

// polygon — equilateralTriangle (3D variant)
// points A, B, plane C
// (Java: Slate.java polygon case 5, choice 1 — new RegularPolygon(A,B,C,3))
export class EquilateralTriangle3dConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.equilateralTriangle;
    signature = { points: 2, elements: 1, integers: 0, elementTypes: [PlaneElement] };

    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new RegularPolygonElement(P[0], P[1], E[0] as PlaneElement, 3);
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
// regularPolygon (2D variant)
// points A, B, integer n
// the regular n-gon on side AB in the screen plane
// (Java: Slate.java polygon case 7 — RegularPolygon(A, B, screen, n))
export class RegularPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.regularPolygon;
    signature = { points: 2, elements: 0, integers: 1 };

    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new RegularPolygonElement(P[0], P[1], screen, N[0]);
        return [[g], g];
    }
}

// polygon — regularPolygon (3D variant)
// points A, B, plane C, integer n
// (Java: Slate.java polygon case 7, choice 1 — new RegularPolygon(A,B,C,n))
export class RegularPolygon3dConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.regularPolygon;
    signature = { points: 2, elements: 1, integers: 1, elementTypes: [PlaneElement] };

    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new RegularPolygonElement(P[0], P[1], E[0] as PlaneElement, N[0]);
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
// similar (2D variant)
// points A, B, D, E, F
// the triangle ABH where H is the similar point so △ABH ∼ △DEF (screen plane)
// (Java: Slate.java polygon case 9 — Similar(A,B,screen,D,E,F,screen) + PolygonElement(A,B,H))
export class SimilarPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.similar;
    signature = { points: 5, elements: 0, integers: 0 };

    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let sim = new SimilarElement(P[0], P[1], screen, P[2], P[3], P[4], screen);
        let g = new PolygonElement([P[0], P[1], sim]);
        return [[sim, g], g];
    }
}

// polygon — similar (3D variant)
// points A, B, plane C, points D, E, F, plane G
// (Java: Slate.java polygon case 9, choice 1 — Similar(A,B,C,D,E,F,G) + PolygonElement(A,B,H))
export class SimilarPolygon3dConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.similar;
    signature = { points: 5, elements: 2, integers: 0, elementTypes: [PlaneElement, PlaneElement] };

    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let sim = new SimilarElement(P[0], P[1], E[0] as PlaneElement, P[2], P[3], P[4], E[1] as PlaneElement);
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
    new FacePolygonConstruction(),
];
