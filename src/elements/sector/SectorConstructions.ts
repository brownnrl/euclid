/*----------------------------------------------------------------------+
|    Sector construction classes — extracted from Constructions.ts       |
|    Each class maps a (type, constructionName, signature) triple to    |
|    a construct() method that creates the geometry element.             |
+----------------------------------------------------------------------*/

import {Construction, ConstructionTypes, AllConstructions,
        SectorConstructions as SectorConstructionsEnum,
        GeomElementsForUpdate} from "../Constructions";
import {GeomElement} from "../GeomElement";
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "../point/PointElement";
import {SectorElement} from "./SectorElement";
import {ArcElement} from "./ArcElement";

let ct = ConstructionTypes;

/************************
 * Element Class Sector *
 ************************/


// sector
// sector
// points A, B, C [plane D = screen]
// the sector of a circle in plane D given the center A and two points B and C on the circumference
// (Java: Slate.java sector case 0, choice 0 — new SectorElement(A,B,C,screen))
export class SectorConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructionsEnum.sector;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new SectorElement({O:ps[0], A:ps[1], B:ps[2], P: screen});
        return [[g], g];
    }
}

// sector — sector (3D variant)
// points A, B, C, plane D
// the sector of a circle in plane D given the center A and two points B and C on the circumference
// (Java: Slate.java sector case 0, choice 1 — new SectorElement(A,B,C,D))
export class Sector2Construction extends Construction {
    constructionMethod: AllConstructions = SectorConstructionsEnum.sector;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let c : PointElement = params[2];
        let d : PlaneElement = params[3];
        let g = new SectorElement({O:a, A:b, B:c, P: d});
        return [[g], g];
    }
}

// sector
// arc
// points A, M, B
// the arc of the circle through points A, M, B in the screen plane
// (M is the "through" point between the two endpoints A and B)
// 2D variant: arc passes through A, M, B in the screen plane.
// M is the "through" point between endpoints A and B.
// (Java: Slate.java sector case 1 — new ArcElement(A, M, B, screen))
export class ArcConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructionsEnum.arc;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new ArcElement(ps[0], ps[1], ps[2], screen);
        return [[g], g];
    }
}

// sector — arc (3D variant)
// points A, M, B, plane D
// (Java: Slate.java sector case 1, choice 1 — new ArcElement(A,M,B,D))
export class Arc3dConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructionsEnum.arc;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new ArcElement(ps[0], ps[1], ps[2], params[3] as PlaneElement);
        return [[g], g];
    }
}
