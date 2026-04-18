/*----------------------------------------------------------------------+
|    Plane construction classes — extracted from Constructions.ts        |
+----------------------------------------------------------------------*/

import {Construction, AllConstructions,
        PlaneConstructions as PlaneConstructionsEnum,
        GeomElementsForUpdate} from "../Constructions";
import {GeomElement} from "../GeomElement";
import {CircleElement} from "../circle/CircleElement";
import {PointElement} from "../point/PointElement";
import {PlaneElement} from "./PlaneElement";
import {PerpendicularPlane} from "./PerpendicularPlane";
import {ParallelPlane} from "./ParallelPlane";

// plane — 3points — points A, B, C
// (Java: Slate.java plane case 0 — new PlaneElement(A, B, C))
export class Plane3PointsConstruction extends Construction {
    constructionMethod: AllConstructions = PlaneConstructionsEnum.threePoints;
    signature = { points: 3, elements: 0, integers: 0 };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new PlaneElement({A: P[0], B: P[1], C: P[2]});
        return [[g], g];
    }
}

// plane — perpendicular — points A, B
// (Java: Slate.java plane case 1 — new PerpendicularPL(A,B))
export class PerpendicularPlaneConstruction extends Construction {
    constructionMethod: AllConstructions = PlaneConstructionsEnum.perpendicular;
    signature = { points: 2, elements: 0, integers: 0 };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new PerpendicularPlane({A: P[0], E: P[1]});
        return [[g], g];
    }
}

// plane — parallel — plane P, point A
// (Java: ParallelP.java — 26 lines, line-for-line port)
export class PlaneParallelConstruction extends Construction {
    constructionMethod: AllConstructions = PlaneConstructionsEnum.parallel;
    signature = { points: 1, elements: 1, integers: 0, elementTypes: [PlaneElement] };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new ParallelPlane(E[0] as PlaneElement, P[0]);
        return [[g], g];
    }
}

// plane — ambient (point variant) — point A
// (Java: Slate.java plane case 3, choice 0 — returns P[0].AP)
export class AmbientPlanePointConstruction extends Construction {
    constructionMethod: AllConstructions = PlaneConstructionsEnum.ambient;
    signature = { points: 1, elements: 0, integers: 0 };
    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        return [[P[0]._AP], P[0]._AP];
    }
}

// plane — ambient (circle variant) — circle A
// (Java: Slate.java plane case 3, choice 1 — returns ((CircleElement)E[0]).AP)
export class AmbientPlaneCircleConstruction extends Construction {
    constructionMethod: AllConstructions = PlaneConstructionsEnum.ambient;
    signature = { points: 0, elements: 1, integers: 0, elementTypes: [CircleElement] };
    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const c = E[0] as CircleElement;
        return [[c.AP], c.AP];
    }
}

export const planeConstructions: Construction[] = [
    new Plane3PointsConstruction(),
    new PerpendicularPlaneConstruction(),
    new PlaneParallelConstruction(),
    new AmbientPlanePointConstruction(),
    new AmbientPlaneCircleConstruction(),
];
