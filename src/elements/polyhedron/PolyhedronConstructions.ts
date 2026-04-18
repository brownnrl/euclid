/*----------------------------------------------------------------------+
|    Polyhedron construction classes — extracted from Constructions.ts   |
|    Each class maps a (type, constructionName, signature) triple to    |
|    a construct() method that creates the geometry element.             |
+----------------------------------------------------------------------*/

import {Construction, ConstructionTypes, AllConstructions,
        PolyhedraConstructions as PolyhedraConstructionsEnum,
        GeomElementsForUpdate} from "../Constructions";
import {GeomElement} from "../GeomElement";
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "../point/PointElement";
import {Layoff} from "../point/Layoff";
import {PolygonElement} from "../polygon/PolygonElement";
import {PolyhedronElement} from "./PolyhedronElement";
import {PyramidElement} from "./PyramidElement";
import {PrismElement} from "./PrismElement";

let ct = ConstructionTypes;

/****************************
 * Element Class Polyhedron *
 ****************************/

// polyhedron
// tetrahedron
// points A, B, C, D
// the tetrahedron given four vertices (creates a triangle base + Pyramid)
// (Java: Slate.java polyhedron case 0 — PolygonElement(A,B,C) + Pyramid(base,D))
export class TetrahedronConstruction extends Construction {
    constructionMethod: AllConstructions = PolyhedraConstructionsEnum.tetrahedron;
    signature: ConstructionTypes[] = (new Array(4)).fill(ct.PointElement);

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let base = new PolygonElement([ps[0], ps[1], ps[2]]);
        let g = new PyramidElement(base, ps[3]);
        return [[base, g], g];
    }
}

// polyhedron
// parallelepiped
// points A, B, C, D
// the parallelepiped with three edges AB, AC, and AD
// (Java: Slate.java polyhedron case 1 — Layoff(B,A,C,A,C) + PolygonElement(B,A,C,fourth) + Prism(base,A,D))
export class ParallelepipedConstruction extends Construction {
    constructionMethod: AllConstructions = PolyhedraConstructionsEnum.parallelepiped;
    signature: ConstructionTypes[] = (new Array(4)).fill(ct.PointElement);

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let fourth = new Layoff(ps[1], ps[0], ps[2], ps[0], ps[2]);
        let base = new PolygonElement([ps[1], ps[0], ps[2], fourth]);
        let g = new PrismElement(base, ps[0], ps[3]);
        return [[fourth, base, g], g];
    }
}

// polyhedron
// prism
// polygon A points B, C
// the prism with base A and side edges parallel and equal to BC
// (Java: Prism.java — 41 lines, line-for-line port)
export class PrismConstruction extends Construction {
    constructionMethod: AllConstructions = PolyhedraConstructionsEnum.prism;
    signature: ConstructionTypes[] = [ct.PolygonElement, ct.PointElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const base = params[0] as PolygonElement;
        const C = params[1] as PointElement;
        const D = params[2] as PointElement;
        const g = new PrismElement(base, C, D);
        return [[g], g];
    }
}

// polyhedron
// pyramid
// polygon A point B
// the pyramid with base A and apex B
// (Java: Pyramid.java — 11 lines, line-for-line port)
export class PyramidConstruction extends Construction {
    constructionMethod: AllConstructions = PolyhedraConstructionsEnum.pyramid;
    signature: ConstructionTypes[] = [ct.PolygonElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const base = params[0] as PolygonElement;
        const apex = params[1] as PointElement;
        const g = new PyramidElement(base, apex);
        return [[g], g];
    }
}
