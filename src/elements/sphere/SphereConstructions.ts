/*----------------------------------------------------------------------+
|    Sphere construction classes — extracted from Constructions.ts       |
|    Each class maps a (type, constructionName, signature) triple to    |
|    a construct() method that creates the geometry element.             |
+----------------------------------------------------------------------*/

import {Construction, ConstructionTypes, AllConstructions,
        SphereConstructions as SphereConstructionsEnum,
        GeomElementsForUpdate} from "../Constructions";
import {GeomElement} from "../GeomElement";
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "../point/PointElement";
import {SphereElement} from "./SphereElement";

let ct = ConstructionTypes;

/************************
 * Element Class Sphere *
 ************************/

// sphere
// radius
// points A, B
// the sphere with center A and radius AB
// (Java: Slate.java sphere case 0 — new SphereElement(A, A, B))
export class SphereRadiusConstruction extends Construction {
    constructionMethod: AllConstructions = SphereConstructionsEnum.radius;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement]
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new SphereElement({Center: ps[0], B: ps[1]});
        return [[g], g];
    }
}



// sphere
// radius (3-point variant)
// points A, B, C
// the sphere with center A and radius |BC|
// (Java: Slate.java sphere case 0, choice 1 — new SphereElement(A,B,C))
export class SphereRadius3PointConstruction extends Construction {
    constructionMethod: AllConstructions = SphereConstructionsEnum.radius;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new SphereElement({Center: ps[0], A: ps[1], B: ps[2]});
        return [[g], g];
    }
}
