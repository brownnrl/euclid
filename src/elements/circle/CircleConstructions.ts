/*----------------------------------------------------------------------+
|    Circle construction classes — extracted from Constructions.ts       |
|    Note: CircumcircleConstruction lives in point/PointConstructions.ts |
|    because CircumcenterConstruction extends it directly.              |
+----------------------------------------------------------------------*/

import {Construction, AllConstructions,
        CircleConstructions as CircleConstructionsEnum,
        GeomElementsForUpdate} from "../Constructions";
import {GeomElement} from "../GeomElement";
import {CircleElement} from "./CircleElement";
import {InvertCircleElement} from "./InvertCircleElement";
import {SphereIntersectionElement} from "./SphereIntersectionElement";
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "../point/PointElement";
import {SphereElement} from "../sphere/SphereElement";

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
    signature = { points: 2, elements: 0, integers: 0 };

    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new CircleElement({C:P[0], B:P[1], AP:screen});
        return [[g], g];
    }
}

// circle — radius (3D, 2-point)
// points A, B, plane C
// the circle with center A and radius AB in the plane C
// (Java: Slate.java circle case 0, choice 2 — new CircleElement(A,B,C))
export class CircleRadius3dConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructionsEnum.radius;
    signature = { points: 2, elements: 1, integers: 0, elementTypes: [PlaneElement] };

    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new CircleElement({C: P[0], B: P[1], AP: E[0] as PlaneElement});
        return [[g], g];
    }
}

// circle — radius (3D, 3-point)
// points A, B, C, plane D
// (Java: Slate.java circle case 0, choice 3 — new CircleElement(A,B,C,D))
export class CircleRadius3Point3dConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructionsEnum.radius;
    signature = { points: 3, elements: 1, integers: 0, elementTypes: [PlaneElement] };

    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new CircleElement({C: P[0], A: P[1], B: P[2], AP: E[0] as PlaneElement});
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
    signature = { points: 3, elements: 0, integers: 0 };

    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new CircleElement({C: P[0], A: P[1], B: P[2], AP: screen});
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
    signature = { points: 0, elements: 2, integers: 0, elementTypes: [CircleElement, CircleElement] };

    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new InvertCircleElement(E[0] as CircleElement, E[1] as CircleElement);
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
    signature = { points: 0, elements: 2, integers: 0, elementTypes: [SphereElement, SphereElement] };

    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new SphereIntersectionElement(E[0] as SphereElement, E[1] as SphereElement);
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
