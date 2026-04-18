/*----------------------------------------------------------------------+
|    Polygon construction classes — extracted from Constructions.ts      |
|    Each class maps a (type, constructionName, signature) triple to    |
|    a construct() method that creates the geometry element.             |
+----------------------------------------------------------------------*/

import {Construction, ConstructionTypes, AllConstructions,
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

let ct = ConstructionTypes;

/*************************
 * Element Class Polygon *
 *************************/

export abstract class PolyConstruction extends Construction {
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
    constructionMethod: AllConstructions = PolygonConstructionsEnum.square;
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
    constructionMethod: AllConstructions = PolygonConstructionsEnum.square;
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
    constructionMethod: AllConstructions = PolygonConstructionsEnum.triangle;
    signature: ConstructionTypes[] = (new Array(3)).fill(ct.PointElement);
}

// polygon
// quadrilateral
// points A, B, C, D
// the quadrilateral ABCD given 4 vertices A, B, C, and D
// (Java: Slate.java polygon case 2 — new PolygonElement(A,B,C,D))
export class QuadrilateralPolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.quadrilateral;
    signature: ConstructionTypes[] = (new Array(4)).fill(ct.PointElement);
}

// polygon
// pentagon
// points A, B, C, D, E
// the pentagon given 5 vertices (free points, not a regular pentagon)
// (Java: Slate.java polygon case 3 — new PolygonElement(A,B,C,D,E))
export class PentagonPolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.pentagon;
    signature: ConstructionTypes[] = (new Array(5)).fill(ct.PointElement);
}

// polygon
// hexagon
// points A, B, C, D, E, F
// the hexagon given 6 vertices (free points)
// (Java: Slate.java polygon case 4 — new PolygonElement(A,B,C,D,E,F))
export class HexagonPolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.hexagon;
    signature: ConstructionTypes[] = (new Array(6)).fill(ct.PointElement);
}

// polygon
// equilateralTriangle
// points A, B [plane C = screen]
// the equilateral triangle on side AB in the screen plane (2D variant)
// (Java: Slate.java polygon case 5, choice 0 — new RegularPolygon(A,B,screen,3))
export class EquilateralTriangleConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.equilateralTriangle;
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
    constructionMethod: AllConstructions = PolygonConstructionsEnum.equilateralTriangle;
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
    constructionMethod: AllConstructions = PolygonConstructionsEnum.parallelogram;
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
    constructionMethod: AllConstructions = PolygonConstructionsEnum.regularPolygon;
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
    constructionMethod: AllConstructions = PolygonConstructionsEnum.regularPolygon;
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
    constructionMethod: AllConstructions = PolygonConstructionsEnum.starPolygon;
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
    constructionMethod: AllConstructions = PolygonConstructionsEnum.similar;
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
    constructionMethod: AllConstructions = PolygonConstructionsEnum.similar;
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
    constructionMethod: AllConstructions = PolygonConstructionsEnum.application;
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
    constructionMethod: AllConstructions = PolygonConstructionsEnum.octagon;
    signature: ConstructionTypes[] = (new Array(8)).fill(ct.PointElement);
}

// polygon
// face
// polyhedron A integer n
// the nth face (1-based) of polyhedron A
// (Java: Slate.java polygon case 12 — ((PolyhedronElement)E[0]).P[N[0]-1])
// Same pattern as point;vertex (returns polygon from polyhedron, not point from polygon)
export class FacePolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructionsEnum.face;
    signature: ConstructionTypes[] = [ct.PolyhedronElement, ct.Integer];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const polyhedron = params[0] as PolyhedronElement;
        const n = params[1] as number;
        const face = polyhedron.P[n - 1];
        return [[face], face];
    }
}
