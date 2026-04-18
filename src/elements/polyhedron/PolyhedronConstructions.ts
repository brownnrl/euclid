/*----------------------------------------------------------------------+
|    Polyhedron construction classes — extracted from Constructions.ts   |
+----------------------------------------------------------------------*/

import {Construction, AllConstructions,
        PolyhedraConstructions as PolyhedraConstructionsEnum,
        GeomElementsForUpdate} from "../Constructions";
import {GeomElement} from "../GeomElement";
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "../point/PointElement";
import {Layoff} from "../point/Layoff";
import {PolygonElement} from "../polygon/PolygonElement";
import {PyramidElement} from "./PyramidElement";
import {PrismElement} from "./PrismElement";

// polyhedron — tetrahedron — points A, B, C, D
// (Java: Slate.java polyhedron case 0 — PolygonElement(A,B,C) + Pyramid(base,D))
export class TetrahedronConstruction extends Construction {
    constructionMethod: AllConstructions = PolyhedraConstructionsEnum.tetrahedron;
    signature = { points: 4, elements: 0, integers: 0 };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let base = new PolygonElement([P[0], P[1], P[2]]);
        let g = new PyramidElement(base, P[3]);
        return [[base, g], g];
    }
}

// polyhedron — parallelepiped — points A, B, C, D
// (Java: Slate.java polyhedron case 1 — Layoff(B,A,C,A,C) + PolygonElement(B,A,C,fourth) + Prism(base,A,D))
export class ParallelepipedConstruction extends Construction {
    constructionMethod: AllConstructions = PolyhedraConstructionsEnum.parallelepiped;
    signature = { points: 4, elements: 0, integers: 0 };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let fourth = new Layoff(P[1], P[0], P[2], P[0], P[2]);
        let base = new PolygonElement([P[1], P[0], P[2], fourth]);
        let g = new PrismElement(base, P[0], P[3]);
        return [[fourth, base, g], g];
    }
}

// polyhedron — prism — polygon A, points B, C
// (Java: Prism.java — 41 lines, line-for-line port)
export class PrismConstruction extends Construction {
    constructionMethod: AllConstructions = PolyhedraConstructionsEnum.prism;
    signature = { points: 2, elements: 1, integers: 0, elementTypes: [PolygonElement] };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new PrismElement(E[0] as PolygonElement, P[0], P[1]);
        return [[g], g];
    }
}

// polyhedron — pyramid — polygon A, point B
// (Java: Pyramid.java — 11 lines, line-for-line port)
export class PyramidConstruction extends Construction {
    constructionMethod: AllConstructions = PolyhedraConstructionsEnum.pyramid;
    signature = { points: 1, elements: 1, integers: 0, elementTypes: [PolygonElement] };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new PyramidElement(E[0] as PolygonElement, P[0]);
        return [[g], g];
    }
}

export const polyhedronConstructions: Construction[] = [
    new TetrahedronConstruction(),
    new ParallelepipedConstruction(),
    new PrismConstruction(),
    new PyramidConstruction(),
];
