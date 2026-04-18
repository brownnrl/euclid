/*----------------------------------------------------------------------+
|    Sector construction classes — extracted from Constructions.ts       |
+----------------------------------------------------------------------*/

import {Construction, AllConstructions,
        SectorConstructions as SectorConstructionsEnum,
        GeomElementsForUpdate} from "../Constructions";
import {GeomElement} from "../GeomElement";
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "../point/PointElement";
import {SectorElement} from "./SectorElement";
import {ArcElement} from "./ArcElement";

// sector — points A, B, C [plane D = screen]
// (Java: Slate.java sector case 0, choice 0 — new SectorElement(A,B,C,screen))
export class SectorConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructionsEnum.sector;
    signature = { points: 3, elements: 0, integers: 0 };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new SectorElement({O:P[0], A:P[1], B:P[2], P: screen});
        return [[g], g];
    }
}

// sector — sector (3D variant) — points A, B, C, plane D
// (Java: Slate.java sector case 0, choice 1 — new SectorElement(A,B,C,D))
export class Sector2Construction extends Construction {
    constructionMethod: AllConstructions = SectorConstructionsEnum.sector;
    signature = { points: 3, elements: 1, integers: 0, elementTypes: [PlaneElement] };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new SectorElement({O:P[0], A:P[1], B:P[2], P: E[0] as PlaneElement});
        return [[g], g];
    }
}

// sector — arc — points A, M, B in screen plane
// (Java: Slate.java sector case 1 — new ArcElement(A, M, B, screen))
export class ArcConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructionsEnum.arc;
    signature = { points: 3, elements: 0, integers: 0 };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new ArcElement(P[0], P[1], P[2], screen);
        return [[g], g];
    }
}

// sector — arc (3D variant) — points A, M, B, plane D
// (Java: Slate.java sector case 1, choice 1 — new ArcElement(A,M,B,D))
export class Arc3dConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructionsEnum.arc;
    signature = { points: 3, elements: 1, integers: 0, elementTypes: [PlaneElement] };
    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new ArcElement(P[0], P[1], P[2], E[0] as PlaneElement);
        return [[g], g];
    }
}

export const sectorConstructions: Construction[] = [
    new SectorConstruction(),
    new Sector2Construction(),
    new Arc3dConstruction(),
    new ArcConstruction(),
];
