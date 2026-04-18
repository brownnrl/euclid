/*----------------------------------------------------------------------+
|    Plane construction classes — extracted from Constructions.ts        |
|    Each class maps a (type, constructionName, signature) triple to    |
|    a construct() method that creates the geometry element.             |
+----------------------------------------------------------------------*/

import {Construction, ConstructionTypes, AllConstructions,
        PlaneConstructions as PlaneConstructionsEnum,
        GeomElementsForUpdate} from "../Constructions";
import {GeomElement} from "../GeomElement";
import {CircleElement} from "../circle/CircleElement";
import {PointElement} from "../point/PointElement";
import {PlaneElement} from "./PlaneElement";
import {PerpendicularPlane} from "./PerpendicularPlane";
import {ParallelPlane} from "./ParallelPlane";

let ct = ConstructionTypes;

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
    constructionMethod: AllConstructions = PlaneConstructionsEnum.threePoints;
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
    constructionMethod: AllConstructions = PlaneConstructionsEnum.perpendicular;
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
    constructionMethod: AllConstructions = PlaneConstructionsEnum.parallel;
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
    constructionMethod: AllConstructions = PlaneConstructionsEnum.ambient;
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
    constructionMethod: AllConstructions = PlaneConstructionsEnum.ambient;
    signature: ConstructionTypes[] = [ct.CircleElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const c = params[0] as CircleElement;
        return [[c.AP], c.AP];
    }
}
