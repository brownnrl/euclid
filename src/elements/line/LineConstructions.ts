/*----------------------------------------------------------------------+
|    Line construction classes — extracted from Constructions.ts         |
|    Each class maps a (type, constructionName, signature) triple to    |
|    a construct() method that creates the geometry element.             |
+----------------------------------------------------------------------*/

import {Construction, ConstructionTypes, AllConstructions, LineConstructions as LineConstructionsEnum,
        GeomElementsForUpdate} from "../Constructions";
import {PointPerpendicular1Construction, PointPerpendicular2Construction,
        PointPerpendicular3Construction, PointPerpendicular4Construction,
        PointPerpendicular5Construction} from "../point/PointConstructions";
import {GeomElement} from "../GeomElement";
import {CircleElement} from "../circle/CircleElement";
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "../point/PointElement";
import {Layoff} from "../point/Layoff";
import {Foot} from "../point/Foot";
import {PlaneFootElement} from "../point/PlaneFootElement";
import {LineElement} from "./LineElement";
import {Perpendicular} from "./Perpendicular";
import {PlanePerpendicularLine} from "./PlanePerpendicularLine";
import {Bichord} from "./Bichord";
import {Chord} from "./Chord";
import {SimilarElement} from "../point/SimilarElement";
import {ProportionElement} from "../point/ProportionElement";
import {AngleDividerElement} from "../point/AngleDividerElement";
import {MeanProportionalElement} from "../point/MeanProportionalElement";

let ct = ConstructionTypes;

/**********************
 * Element Class Line *
 **********************/

// line
// connect
// points A, B
// the line AB connecting two points A and B
// (Java: Slate.java line case 0 — new LineElement(A,B))
export class LineConnectConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.connect;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];

        let g = new LineElement({A:a, B: b});

        return [[g], g];
    }
}

// line
// angleBisector (2D variant)
// points B, A, C
// line from A to the bisector point of angle BAC on line BC
// (Java: Slate.java line case 1 — AngleDivider(B,A,C,screen,2) + LineElement(A,result))
export class AngleBisectorLineConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.angleBisector;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let ad = new AngleDividerElement(ps[0], ps[1], ps[2], screen, 2);
        let g = new LineElement({A: ps[1], B: ad});
        return [[ad, g], g];
    }
}

// line
// angleDivider (2D variant)
// points B, A, C, integer n
// line from A to the n-th division point of angle BAC on line BC
// (Java: Slate.java line case 2 — AngleDivider(B,A,C,screen,n) + LineElement(A,result))
export class AngleDividerLineConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.angleDivider;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.Integer];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let n : number = params[3];
        let ad = new AngleDividerElement(ps[0], ps[1], ps[2], screen, n);
        let g = new LineElement({A: ps[1], B: ad});
        return [[ad, g], g];
    }
}

// line — angleBisector (3D variant)
// points B, A, C, plane D
// (Java: Slate.java line case 1, choice 1 — AngleDivider(B,A,C,D,2) + LineElement(A,result))
export class AngleBisectorLine3dConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.angleBisector;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let ad = new AngleDividerElement(ps[0], ps[1], ps[2], params[3] as PlaneElement, 2);
        let g = new LineElement({A: ps[1], B: ad});
        return [[ad, g], g];
    }
}

// line — angleDivider (3D variant)
// points B, A, C, plane D, integer n
// (Java: Slate.java line case 2, choice 1 — AngleDivider(B,A,C,D,n) + LineElement(A,result))
export class AngleDividerLine3dConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.angleDivider;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement, ct.Integer];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let ad = new AngleDividerElement(ps[0], ps[1], ps[2], params[3] as PlaneElement, params[4] as number);
        let g = new LineElement({A: ps[1], B: ad});
        return [[ad, g], g];
    }
}

// line
// foot (2D variant)
// 3 points A, B, C
// the line AD from A to the foot of the perpendicular from A to line BC
// (Java: Slate.java case 3, choice 0 — Foot(A,B,C) + LineElement(A,foot).
// Foot class already IMPL at src/elements/point/Foot.ts.)
export class LineFootConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.foot;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let fo = new Foot(ps[0], ps[1], ps[2]);
        let g = new LineElement({A: ps[0], B: fo});
        return [[fo, g], g];
    }
}

// *Solid Geometry Only*
// line
// foot
// point A plane B
// the line AD drawn perpendicular to plane B with the point D lying on B
// (Java: PlaneFoot.java — TS: PlaneFootElement.ts, renamed for clarity)
export class PlaneFootLineConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.foot;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const A = params[0] as PointElement;
        const P = params[1] as PlaneElement;
        const fo = new PlaneFootElement(A, P);
        const g = new LineElement({A: A, B: fo});
        return [[fo, g], g];
    }
}

// line
// chord
// points A, B, circle C
// the chord of circle C cut by the line AB
// (post-LineElement-expansion: A, B are the two endpoints of the input line)
// (Java: Slate.java line case 4 — new Chord(A,B,C). Java: Chord.java)
export class ChordConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.chord;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.CircleElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const D = params[0] as PointElement;
        const E = params[1] as PointElement;
        const C = params[2] as CircleElement;
        const g = new Chord({D, E, C});
        return [[g], g];
    }
}

// line
// bichord
// circles A, B
// the common chord connecting the two intersection points of the circles A and B
// (Java: Slate.java line case 5 — new Bichord(A,B). Java: Bichord.java)
export class BichordConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.bichord;
    signature: ConstructionTypes[] = [ct.CircleElement, ct.CircleElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : CircleElement[] = params;
        let g = new Bichord({C:ps[0], D:ps[1]});
        return [[g], g];
    }
}

// Line perpendicular constructions — all 5 variants share the same
// construct() pattern: call the parent point-perpendicular construct(),
// then return the Perpendicular LineElement (first in elementsForUpdate).
// (Java: Slate.java line case 6 — all choices dispatch to a Perpendicular
// or PlanePerpendicular, then return the LineElement directly.)
function wrapPointAsLine(es: [GeomElementsForUpdate, GeomElement]): [GeomElementsForUpdate, GeomElement] {
    return [es[0], es[0][0]];
}

// line — perpendicular variant 1: points A, B [plane C (screen)]
// the line from A to the point D so that AD is equal and perpendicular to AB in plane C
// (Java: Slate.java line case 6, choice 0 — Perpendicular(A,B,screen,A,B))
export class LinePerpendicular1Construction extends PointPerpendicular1Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.perpendicular;
    construct(screen: PlaneElement, params: any[]) { return wrapPointAsLine(super.construct(screen, params)); }
}

// line — perpendicular variant 2: points A, B, plane C
// (Java: Slate.java line case 6, choice 1 — Perpendicular(A,B,C,A,B))
export class LinePerpendicular2Construction extends PointPerpendicular2Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.perpendicular;
    construct(screen: PlaneElement, params: any[]) { return wrapPointAsLine(super.construct(screen, params)); }
}

// line — perpendicular variant 3: points A, B, D, E [plane C (screen)]
// (Java: Slate.java line case 6, choice 2 — Perpendicular(A,B,screen,D,E))
export class LinePerpendicular3Construction extends PointPerpendicular3Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.perpendicular;
    construct(screen: PlaneElement, params: any[]) { return wrapPointAsLine(super.construct(screen, params)); }
}

// line — perpendicular variant 4: points A, B, plane C, points D, E
// (Java: Slate.java line case 6, choice 3 — Perpendicular(A,B,C,D,E))
export class LinePerpendicular4Construction extends PointPerpendicular4Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.perpendicular;
    construct(screen: PlaneElement, params: any[]) { return wrapPointAsLine(super.construct(screen, params)); }
}

// line — perpendicular variant 5: point A, plane B, points C, D
// (Java: Slate.java line case 6, choice 4 — PlanePerpendicularLine(A,B,C,D))
export class LinePerpendicular5Construction extends PointPerpendicular5Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.perpendicular;
    construct(screen: PlaneElement, params: any[]) { return wrapPointAsLine(super.construct(screen, params)); }
}

// line
// cutoff
// points A, B, C, D
// the line AE equal to CD along the line AB
// (Java: Slate.java line case 7 — Layoff(A,A,B,C,D) + LineElement(A,layoff))
export class LineCutoffConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.cutoff;
    signature: ConstructionTypes[] = (new Array(4)).fill(ct.PointElement);

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let lo = new Layoff(ps[0], ps[0], ps[1], ps[2], ps[3]);
        let g = new LineElement({A: ps[0], B: lo});
        return [[lo, g], g];
    }
}

// line
// extend
// points A, B, C, D
// the line BE equal to CD so that A, B, and C are collinear with B between A and C
// (Java: Slate.java line case 8 — Layoff(B,A,B,C,D) + LineElement(B,layoff))
export class LineExtendConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.extend;
    signature: ConstructionTypes[] = (new Array(4)).fill(ct.PointElement);

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let lo = new Layoff(ps[1], ps[0], ps[1], ps[2], ps[3]);
        let g = new LineElement({A: ps[1], B: lo});
        return [[lo, g], g];
    }
}

// line
// parallel
// points A, B, C
// the line AD through A parallel and equal to BC, so D = A + (C - B)
// (no dedicated Java class — Slate.java case 9 dispatches to a Layoff
// trick: Layoff(A, B, C, B, C) gives D = A + (C-B), then wraps a fresh
// LineElement(A, D). Same pattern as LineExtendConstruction above.)
export class LineParallelConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.parallel;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let lo = new Layoff(ps[0], ps[1], ps[2], ps[1], ps[2]);
        let g = new LineElement({A: ps[0], B: lo});
        return [[lo, g], g];
    }
}

// line
// similar (2D variant)
// points A, B, D, E, F
// the line AH so that triangle ABH is similar to triangle DEF (screen plane)
// (Java: Slate.java line case 10 — Similar(A,B,screen,D,E,F,screen) + LineElement(A,H))
export class SimilarLineConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.similar;
    signature: ConstructionTypes[] = (new Array(5)).fill(ct.PointElement);

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let sim = new SimilarElement(ps[0], ps[1], screen, ps[2], ps[3], ps[4], screen);
        let g = new LineElement({A: ps[0], B: sim});
        return [[sim, g], g];
    }
}

// line — similar (3D variant)
// points A, B, plane C, points D, E, F, plane G
// (Java: Slate.java line case 10, choice 1 — Similar(A,B,C,D,E,F,G) + LineElement(A,H))
export class SimilarLine3dConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.similar;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PlaneElement,
        ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const A = params[0] as PointElement, B = params[1] as PointElement;
        const C = params[2] as PlaneElement;
        const D = params[3] as PointElement, E = params[4] as PointElement, F = params[5] as PointElement;
        const G = params[6] as PlaneElement;
        let sim = new SimilarElement(A, B, C, D, E, F, G);
        let g = new LineElement({A: A, B: sim});
        return [[sim, g], g];
    }
}

// line
// proportion
// 8 points A, B, C, D, E, F, G, H
// the line GI along GH so that AB:CD = EF:GI
// (Java: Slate.java line case 11 — Proportion + LineElement(G, result))
export class ProportionLineConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.proportion;
    signature: ConstructionTypes[] = (new Array(8)).fill(ct.PointElement);

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let prop = new ProportionElement(ps[0], ps[1], ps[2], ps[3], ps[4], ps[5], ps[6], ps[7]);
        let g = new LineElement({A: ps[6], B: prop});
        return [[prop, g], g];
    }
}

// line
// meanProportional
// 6 points S0, S1, T0, T1, U0, U1
// the line U0U' along U0U1 so that S:U' = U':T
// (Java: Slate.java line case 12 — MeanProportional + LineElement(U0, result))
export class MeanProportionalLineConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructionsEnum.meanProportional;
    signature: ConstructionTypes[] = (new Array(6)).fill(ct.PointElement);

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let mp = new MeanProportionalElement(ps[0], ps[1], ps[2], ps[3], ps[4], ps[5]);
        let g = new LineElement({A: ps[4], B: mp});
        return [[mp, g], g];
    }
}
