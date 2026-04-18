/*----------------------------------------------------------------------+
|    Sphere construction classes — extracted from Constructions.ts       |
+----------------------------------------------------------------------*/

import {Construction, AllConstructions,
        SphereConstructions as SphereConstructionsEnum,
        GeomElementsForUpdate} from "../Constructions";
import {GeomElement} from "../GeomElement";
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "../point/PointElement";
import {SphereElement} from "./SphereElement";

// sphere — radius — points A, B
// (Java: Slate.java sphere case 0 — new SphereElement(A, A, B))
export class SphereRadiusConstruction extends Construction {
    constructionMethod: AllConstructions = SphereConstructionsEnum.radius;
    signature = { points: 2, elements: 0, integers: 0 };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new SphereElement({Center: P[0], B: P[1]});
        return [[g], g];
    }
}

// sphere — radius (3-point) — points A, B, C — center A, radius |BC|
// (Java: Slate.java sphere case 0, choice 1 — new SphereElement(A,B,C))
export class SphereRadius3PointConstruction extends Construction {
    constructionMethod: AllConstructions = SphereConstructionsEnum.radius;
    signature = { points: 3, elements: 0, integers: 0 };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new SphereElement({Center: P[0], A: P[1], B: P[2]});
        return [[g], g];
    }
}

export const sphereConstructions: Construction[] = [
    new SphereRadius3PointConstruction(),
    new SphereRadiusConstruction(),
];
