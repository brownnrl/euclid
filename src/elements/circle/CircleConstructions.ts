/*----------------------------------------------------------------------+
|    Circle construction classes — extracted from Constructions.ts       |
|    Note: CircumcircleConstruction lives in point/PointConstructions.ts |
|    because CircumcenterConstruction extends it directly.              |
+----------------------------------------------------------------------*/

import {Construction, ConstructionSignature, SortedParams, AllConstructions,
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
// radius — points A, B [, plane C = screen]
// the circle with center A and radius AB in the plane C
// 2D: 2 points, 0 elements — uses screen plane
// 3D: 2 points, 1 PlaneElement — uses explicit plane
// (Java: Slate.java circle case 0 — new CircleElement(A,B,plane))
export class CircleRadiusCenterConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructionsEnum.radius;
    signature: ConstructionSignature = { points: 2, elements: 0, integers: 0 };
    public validateSignature(cm: AllConstructions, sp: SortedParams): boolean {
        if (cm !== this.constructionMethod) return false;
        return sp.P.length === 2 && sp.N.length === 0
            && (sp.E.length === 0 || (sp.E.length === 1 && sp.E[0] instanceof PlaneElement));
    }
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let plane = E.length > 0 ? E[0] as PlaneElement : screen;
        let g = new CircleElement({C:P[0], B:P[1], AP:plane});
        return [[g], g];
    }
}

// circle — radius (3-point) — points A, B, C [, plane D = screen]
// the circle with center A and radius |BC| in the plane D
// 2D: 3 points, 0 elements — uses screen plane
// 3D: 3 points, 1 PlaneElement — uses explicit plane
// MUST be registered BEFORE the 2-point variant in the constructions array
// (signature variant ordering rule: longer signature first)
// (Java: Slate.java circle case 0 — new CircleElement(A,B,C,plane))
export class CircleRadius3PointConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructionsEnum.radius;
    signature: ConstructionSignature = { points: 3, elements: 0, integers: 0 };
    public validateSignature(cm: AllConstructions, sp: SortedParams): boolean {
        if (cm !== this.constructionMethod) return false;
        return sp.P.length === 3 && sp.N.length === 0
            && (sp.E.length === 0 || (sp.E.length === 1 && sp.E[0] instanceof PlaneElement));
    }
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let plane = E.length > 0 ? E[0] as PlaneElement : screen;
        let g = new CircleElement({C: P[0], A: P[1], B: P[2], AP: plane});
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
    new CircleRadius3PointConstruction(),
    new CircleRadiusCenterConstruction(),
    new InvertCircleConstruction(),
    new SphereIntersectionConstruction(),
];
