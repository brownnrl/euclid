/*----------------------------------------------------------------------+
|    Sector construction classes — extracted from Constructions.ts       |
+----------------------------------------------------------------------*/

import {Construction, ConstructionSignature, SortedParams, AllConstructions,
        SectorConstructions as SectorConstructionsEnum,
        GeomElementsForUpdate} from "../Constructions";
import {GeomElement} from "../GeomElement";
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "../point/PointElement";
import {SectorElement} from "./SectorElement";
import {ArcElement} from "./ArcElement";
import {AngleMarkerElement} from "./AngleMarkerElement";

// sector — points A, B, C [, plane D = screen]
// 2D: 3 points, 0 elements — uses screen plane
// 3D: 3 points, 1 PlaneElement — uses explicit plane
// (Java: Slate.java sector case 0 — new SectorElement(A,B,C,plane))
export class SectorConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructionsEnum.sector;
    signature: ConstructionSignature = { points: 3, elements: 0, integers: 0 };
    public validateSignature(cm: AllConstructions, sp: SortedParams): boolean {
        if (cm !== this.constructionMethod) return false;
        return sp.P.length === 3 && sp.N.length === 0
            && (sp.E.length === 0 || (sp.E.length === 1 && sp.E[0] instanceof PlaneElement));
    }
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let plane = E.length > 0 ? E[0] as PlaneElement : screen;
        let g = new SectorElement({O:P[0], A:P[1], B:P[2], P: plane});
        return [[g], g];
    }
}

// sector — arc — points A, M, B [, plane D = screen]
// 2D: 3 points, 0 elements — uses screen plane
// 3D: 3 points, 1 PlaneElement — uses explicit plane
// (Java: Slate.java sector case 1 — new ArcElement(A,M,B,plane))
export class ArcConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructionsEnum.arc;
    signature: ConstructionSignature = { points: 3, elements: 0, integers: 0 };
    public validateSignature(cm: AllConstructions, sp: SortedParams): boolean {
        if (cm !== this.constructionMethod) return false;
        return sp.P.length === 3 && sp.N.length === 0
            && (sp.E.length === 0 || (sp.E.length === 1 && sp.E[0] instanceof PlaneElement));
    }
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let plane = E.length > 0 ? E[0] as PlaneElement : screen;
        let g = new ArcElement(P[0], P[1], P[2], plane);
        return [[g], g];
    }
}

// angleMarker — vertex V, arm points P1, P2 [, int radiusPx]
// Marks the interior angle P1-V-P2 with a small fixed-radius sector
// (radius computed by the element, not the arm length). The optional
// integer overrides the default px radius. 2D screen-plane only for
// v1. (#91)
export class AngleMarkerConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructionsEnum.angleMarker;
    signature: ConstructionSignature = { points: 3, elements: 0, integers: 0 };
    public validateSignature(cm: AllConstructions, sp: SortedParams): boolean {
        if (cm !== this.constructionMethod) return false;
        return sp.P.length === 3 && sp.N.length === 0 && sp.E.length === 0;
    }
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new AngleMarkerElement(P[0], P[1], P[2], screen);
        return [[g], g];
    }
}

// angleMarker with an explicit px radius override.
export class AngleMarkerRadiusConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructionsEnum.angleMarker;
    signature: ConstructionSignature = { points: 3, elements: 0, integers: 1 };
    public validateSignature(cm: AllConstructions, sp: SortedParams): boolean {
        if (cm !== this.constructionMethod) return false;
        return sp.P.length === 3 && sp.N.length === 1 && sp.E.length === 0;
    }
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new AngleMarkerElement(P[0], P[1], P[2], screen, N[0]);
        return [[g], g];
    }
}

// angleMarkerReflex — same as angleMarker but draws the major (reflex,
// > 180°) arc. Rare; Euclid avoids reflex angles, so this is for the
// occasional teaching case (a III.20-style central angle). (#91)
export class AngleMarkerReflexConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructionsEnum.angleMarkerReflex;
    signature: ConstructionSignature = { points: 3, elements: 0, integers: 0 };
    public validateSignature(cm: AllConstructions, sp: SortedParams): boolean {
        if (cm !== this.constructionMethod) return false;
        return sp.P.length === 3 && sp.N.length === 0 && sp.E.length === 0;
    }
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new AngleMarkerElement(P[0], P[1], P[2], screen, undefined, true);
        return [[g], g];
    }
}

export class AngleMarkerReflexRadiusConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructionsEnum.angleMarkerReflex;
    signature: ConstructionSignature = { points: 3, elements: 0, integers: 1 };
    public validateSignature(cm: AllConstructions, sp: SortedParams): boolean {
        if (cm !== this.constructionMethod) return false;
        return sp.P.length === 3 && sp.N.length === 1 && sp.E.length === 0;
    }
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new AngleMarkerElement(P[0], P[1], P[2], screen, N[0], true);
        return [[g], g];
    }
}

export const sectorConstructions: Construction[] = [
    new SectorConstruction(),
    new ArcConstruction(),
    new AngleMarkerConstruction(),
    new AngleMarkerRadiusConstruction(),
    new AngleMarkerReflexConstruction(),
    new AngleMarkerReflexRadiusConstruction(),
];
