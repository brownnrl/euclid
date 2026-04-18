/*----------------------------------------------------------------------+
|    Circle construction classes — extracted from Constructions.ts       |
|    Note: CircumcircleConstruction lives in point/PointConstructions.ts |
|    because CircumcenterConstruction extends it directly.              |
+----------------------------------------------------------------------*/

import {Construction, ConstructionTypes, AllConstructions,
        CircleConstructions as CircleConstructionsEnum,
        GeomElementsForUpdate} from "../Constructions";
import {GeomElement} from "../GeomElement";
import {CircleElement} from "./CircleElement";
import {InvertCircleElement} from "./InvertCircleElement";
import {SphereIntersectionElement} from "./SphereIntersectionElement";
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "../point/PointElement";
import {SphereElement} from "../sphere/SphereElement";

let ct = ConstructionTypes;

/************************
 * Element Class Circle *
 ************************/

// circle
// radius
// points A, B [plane C=screen]
// the circle with center A and radius AB in the plane C
// (Java: Slate.java circle case 0, choice 0 — new CircleElement(A,B,screen))
export class CircleRadiusCenterConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructionsEnum.radius;
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
    constructionMethod: AllConstructions = CircleConstructionsEnum.radius;
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
    constructionMethod: AllConstructions = CircleConstructionsEnum.radius;
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
    constructionMethod: AllConstructions = CircleConstructionsEnum.radius;
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
    constructionMethod: AllConstructions = CircleConstructionsEnum.invert;
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
    constructionMethod: AllConstructions = CircleConstructionsEnum.intersection;
    signature: ConstructionTypes[] = [ct.SphereElement, ct.SphereElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const S = params[0] as SphereElement;
        const T = params[1] as SphereElement;
        const g = new SphereIntersectionElement(S, T);
        return [[g], g];
    }
}

export const circleConstructions: Construction[] = [
    new CircleRadius3Point3dConstruction(),
    new CircleRadius3dConstruction(),
    new CircleRadius3PointConstruction(),
    new CircleRadiusCenterConstruction(),
    new InvertCircleConstruction(),
    new SphereIntersectionConstruction(),
];
