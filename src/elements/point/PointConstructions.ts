/*----------------------------------------------------------------------+
|    Point construction classes — extracted from Constructions.ts        |
|    Each class maps a (type, constructionName, signature) triple to     |
|    a construct() method that creates the geometry element.             |
+----------------------------------------------------------------------*/

import {Construction, ConstructionTypes, AllConstructions, PointConstructions,
        CircleConstructions, GeomElementsForUpdate} from "../Constructions";
import {GeomElement} from "../GeomElement";
import {CircleElement} from "../circle/CircleElement";
import {CircumcircleElement} from "../circle/CircumcircleElement";
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "./PointElement";
import {FixedPoint} from "./FixedPoint";
import {PlaneSlider} from "./PlaneSlider";
import {Midpoint} from "./Midpoint";
import {Intersection} from "./Intersection";
import {PlaneIntersection} from "./PlaneIntersection";
import {LineSlider} from "./LineSlider";
import {Layoff} from "./Layoff";
import {Foot} from "./Foot";
import {PlaneFootElement} from "./PlaneFootElement";
import {CircleSlider} from "./CircleSlider";
import {SimilarElement} from "./SimilarElement";
import {ProportionElement} from "./ProportionElement";
import {AngleDividerElement} from "./AngleDividerElement";
import {MeanProportionalElement} from "./MeanProportionalElement";
import {HarmonicElement} from "./HarmonicElement";
import {InvertPointElement} from "./InvertPointElement";
import {SphereSliderElement} from "./SphereSliderElement";
import {Perpendicular} from "../line/Perpendicular";
import {PlanePerpendicularLine} from "../line/PlanePerpendicularLine";
import {SphereElement} from "../sphere/SphereElement";
import {PolygonElement} from "../polygon/PolygonElement";

let ct = ConstructionTypes;

/***********************
 * Element Class Point *
 ***********************/

/* point
 * free
 * integers x, y
 * a freely dragable point in the screen plane with initial coordinates (x,y,0)
 * (Java: Slate.java point case 0 — new PlaneSlider(screen, x, y, 0))
 */
export class FreePointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.free;
    signature: ConstructionTypes[] = [ct.Integer, ct.Integer];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let x : number = params[0];
        let y : number = params[1];

        let g = new PlaneSlider(screen, x, y, 0);

        return [[g], g];
    }

}

// point
// midpoint
// points A, B
// the midpoint of a line AB
// (Java: Slate.java point case 1 — new Midpoint(A, B))
export class MidPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.midpoint;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];

        let g = new Midpoint(a, b);

        return [[g], g];
    }
}

// point
// intersection
// points A, B, C, D, plane E
// the intersection of two lines AB and CD in the plane E
// (Java: Slate.java point case 2, choice 1 — new Intersection(A,B,C,D,E))
export class IntersectionConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.intersection;
    signature: ConstructionTypes[] = [ct.PointElement,
                                      ct.PointElement,
                                      ct.PointElement,
                                      ct.PointElement,
                                      ct.PlaneElement
                                     ];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let c : PointElement = params[2];
        let d : PointElement = params[3];
        let ap : PlaneElement = params[4];

        let g = new Intersection(a,b,c,d,ap);

        return [[g], g];
    }
}

// (Java: Slate.java point case 2, choice 0 — new Intersection(A,B,C,D,screen))
export class IntersectionConstructionScreen extends IntersectionConstruction {
    signature: ConstructionTypes[] = [ct.PointElement,
                                      ct.PointElement,
                                      ct.PointElement,
                                      ct.PointElement,
                                     ];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        params.push(screen);
        return super.construct(screen, params);
    }
}

// point
// intersection (plane-line variant)
// plane A, points B, C
// the intersection of the plane A and the line BC
// (Java: IntersectionPL.java — TS: PlaneIntersection.ts, renamed for clarity)
export class PlaneIntersectionConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.intersection;
    signature: ConstructionTypes[] = [ct.PlaneElement, ct.PointElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const P = params[0] as PlaneElement;
        const A = params[1] as PointElement;
        const B = params[2] as PointElement;
        const g = new PlaneIntersection(P, A, B);
        return [[g], g];
    }
}

// point
// first
// points A, B
// the first end A of the line AB
// (Java: Slate.java point case 3 — returns P[0], preexists=true)
export class FirstPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.first;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        return [[], params[0] as PointElement];
    }

}

// point
// last
// points A, B
// the last end B of the line AB
// (Java: Slate.java point case 4 — returns P[1], preexists=true)
export class LastPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.last;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        return [[], params[1] as PointElement];
    }
}

// point
// center
// circle A
// the center of the circle A
// (Java: Slate.java point case 5, choice 0 — returns ((CircleElement)E[0]).Center)
export class CircleCenterConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.center;
    signature: ConstructionTypes[] = [ct.CircleElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        return [[], (params[0] as CircleElement).Center as PointElement];
    }
}

// point
// center (sphere variant)
// sphere A
// the center of the sphere A
// (Java: Slate.java point case 5, choice 1 — returns ((SphereElement)E[0]).Center)
export class SphereCenterConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.center;
    signature: ConstructionTypes[] = [ct.SphereElement];
    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        return [[], (params[0] as SphereElement).Center as PointElement];
    }
}

// point
// lineSlider
// points A, B integers x, y,[z]
// a point that slides along a line AB with initial coordinates (x,y,z)
// (Java: Slate.java point case 6 — new LineSlider(A,B,x,y,z,false))
export class LineSliderConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.lineSlider;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.Integer, ct.Integer, ct.Integer];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let x : number = params[2];
        let y : number = params[3];
        let z : number = params[4];

        let g = this.createSlider(a,b,x,y,z);

        return [[g], g];
    }
    protected createSlider(a: PointElement, b: PointElement, x: number, y: number, z: number) {
        return new LineSlider(a, b, x, y, z, false);
    }
}

// point — lineSlider (2D variant, z defaults to 0)
// (Java: Slate.java point case 6, choice 0 — z set to 0)
export class LineSlider2dConstruction extends LineSliderConstruction {
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.Integer, ct.Integer];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let x : number = params[2];
        let y : number = params[3];

        let g = this.createSlider(a,b,x,y,0);

        return [[g], g];
    }
}

// point
// circleSlider
// circle A, integers x, y, [z]
// a point that slides along a circle A with given initial coordinates (x,y,z)
// (Java: Slate.java point case 7 — new CircleSlider(E[0], x, y, z))
export class CircleSliderConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.circleSlider;
    signature: ConstructionTypes[] = [ct.CircleElement, ct.Integer, ct.Integer, ct.Integer];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let c : CircleElement = params[0];
        let ns : number[] = params.slice(1,4);
        let g = new CircleSlider(c, ns[0], ns[1], ns[2]);
        return [[g], g];
    }
}

// point — circleSlider (2D variant, z defaults to 0)
// (Java: Slate.java point case 7, choice 0 — z set to 0)
export class CircleSliderConstruction2dPoint extends CircleSliderConstruction {
    signature: ConstructionTypes[] = [ct.CircleElement, ct.Integer, ct.Integer];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        params.push(0);
        return super.construct(screen, params);
    }
}

// circle
// circumcircle
// points A, B, C, plane D
// the circle passing through 3 points A, B, and C in the plane D
// (Java: Slate.java circle case 1, choice 1 — new Circumcircle(A,B,C,D))
// NOTE: Lives here (not in circle/constructions.ts) because CircumcenterConstruction
// extends it, and both are tightly coupled.
export class CircumcircleConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructions.circumcircle;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let A : PointElement = params[0];
        let B : PointElement = params[1];
        let C : PointElement = params[2];
        let AP : PlaneElement = params[3];
        let g = new CircumcircleElement(A,B,C,AP);
        return [[g], g];
    }
}

// circle — circumcircle (2D variant, plane defaults to screen)
// (Java: Slate.java circle case 1, choice 0 — E[0] = screen)
export class CircumcircleConstruction2d extends CircumcircleConstruction {
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        params.push(screen);
        return super.construct(screen, params);
    }
}

// point
// circumcenter
// points A, B, C, plane D
// the center of a circle ABC passing through 3 points A, B, and C in the plane D
// (Java: Slate.java point case 8 — new Circumcircle(A,B,C,D), returns circ.Center)
export class CircumcenterConstruction extends CircumcircleConstruction {
    constructionMethod: AllConstructions = PointConstructions.circumcenter;

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let es = super.construct(screen, params);
        let g : CircleElement = es[1] as CircleElement;
        es[0].push(g.Center);
        return [es[0], g.Center];
    }
}

// point — circumcenter (2D variant, plane defaults to screen)
// (Java: Slate.java point case 8, choice 0 — E[0] = screen)
export class CircumcenterConstruction2d extends CircumcenterConstruction {
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        params.push(screen);
        return super.construct(screen, params);
    }
}

/* point
 * foot
 * points A, B, C
 * the foot of a perpendicular drawn from A to a line BC
 */
// (Java: Slate.java point case 10, choice 0 — new Foot(A,B,C))
export class FootPointConstruction extends Construction {
    constructionMethod : AllConstructions = PointConstructions.foot;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];
    construct(screen: PlaneElement, params: any[]) : [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let c : PointElement = params[2];
        let g = new Foot(a, b, c);

        return [[g], g];
    }
}

// point
// foot (plane variant — solid geometry)
// point A plane B
// the foot of a perpendicular drawn from A to a plane B
// (Java: PlaneFoot.java — TS: PlaneFootElement.ts, renamed for clarity)
export class PlaneFootPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.foot;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const A = params[0] as PointElement;
        const P = params[1] as PlaneElement;
        const g = new PlaneFootElement(A, P);
        return [[g], g];
    }
}

// point
// layoff used for extend and cutoff
export abstract class LayoffConstruction extends Construction {
    signature: ConstructionTypes[] = (new Array(4)).fill(ct.PointElement);
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = this._createLayoff(ps);
        return [[g], g];
    }

    protected abstract _createLayoff(ps: PointElement[]) : GeomElement;
}

// point
// cutoff
// points A, B, C, D
// the point E on a line AB so that AE = CD
// (Java: Slate.java point case 11 — new Layoff(A,A,B,C,D))
export class CutoffConstruction extends LayoffConstruction {
    constructionMethod: AllConstructions = PointConstructions.cutoff;
    protected _createLayoff(ps: PointElement[]) : GeomElement {
        return new Layoff(ps[0], ps[0], ps[1], ps[2], ps[3]);
    }
}

// point
// extend
// points A, B, C, D
// the point E on a line AB so that BE = CD
// (Java: Slate.java point case 12 — new Layoff(B,A,B,C,D))
export class ExtendConstruction extends LayoffConstruction {
    constructionMethod: AllConstructions = PointConstructions.extend;
    protected _createLayoff(ps: PointElement[]) : GeomElement {
        return new Layoff(ps[1], ps[0], ps[1], ps[2], ps[3]);
    }
}

// point
// parallelogram
// points C, A, B
// the 4th vertex D' of the parallelogram C-A-B-D' given 3 vertices C, A, B
// D' = C + (B - A)  [reuses Layoff with equal direction and length vectors]
// (Java: Slate.java point case 13 — new Layoff(C,A,B,A,B))
export class ParallelogramConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.parallelogram;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const [c, a, b] = params as [PointElement, PointElement, PointElement];
        const g = new Layoff(c, a, b, a, b);
        return [[g], g];
    }
}

// point
// similar	points A, B, D, E, F [planes C, G]
// the point H so that triangle ABH in plane C is similar to triangle DEF in plane G
// 2D variant: 5 PointElements, both planes default to screen
// (Java: Similar.java — extends PointElement, calls this.toSimilar(...) in update())
export class SimilarPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.similar;
    signature: ConstructionTypes[] = (new Array(5)).fill(ct.PointElement);

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new SimilarElement(ps[0], ps[1], screen, ps[2], ps[3], ps[4], screen);
        return [[g], g];
    }
}

// point
// similar (3D variant)
// points A, B, D, E, F, planes C, G
// (Java: Similar with explicit PlaneElements instead of screen)
export class SimilarPoint3dConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.similar;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PlaneElement,
        ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const A = params[0] as PointElement, B = params[1] as PointElement;
        const C = params[2] as PlaneElement;
        const D = params[3] as PointElement, E = params[4] as PointElement, F = params[5] as PointElement;
        const G = params[6] as PlaneElement;
        const g = new SimilarElement(A, B, C, D, E, F, G);
        return [[g], g];
    }
}

// point perpendicular constructions
export abstract class PointPerpendicularConstruction extends Construction {
    constructionMethod : AllConstructions = PointConstructions.perpendicular;
}

/* point
 * perpendicular
 * points A, B, [plane C (screen)]
 * the point D so that AD is equal and perpendicular to AB in plane C
 * (Java: Slate.java point case 15, choice 0 — new Perpendicular(A,B,screen,A,B))
 */
export class PointPerpendicular1Construction extends PointPerpendicularConstruction {
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let g = new Perpendicular({C:a, D:b,P:screen, E:a, F:b});
        return [[g], g.B];
    }
}


/* point
 * perpendicular
 * points A, B, plane C
 * the point D so that AD is equal and perpendicular to AB in plane C
 * (Java: Slate.java point case 15, choice 1 — new Perpendicular(A,B,C,A,B))
 */
export class PointPerpendicular2Construction extends PointPerpendicularConstruction {
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PlaneElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let c : PlaneElement = params[2];
        let g = new Perpendicular({C:a, D:b,P:c, E:a, F:b});
        return [[g], g.B];
    }
}


/* point
 * perpendicular
 * points A, B, D, E [plane C (screen)]
 * the point F so that AF is perpendicular to AB in plane C and equals DE
 * (Java: Slate.java point case 15, choice 2 — new Perpendicular(A,B,screen,D,E))
 */
export class PointPerpendicular3Construction extends PointPerpendicularConstruction {
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let d : PointElement = params[2];
        let e : PointElement = params[3];
        let g = new Perpendicular({C:a, D:b,P:screen, E:d, F:e});
        return [[g], g.B];
    }
}


/* point
 * perpendicular
 * points A, B, plane C, points D, E
 * the point F so that AF is perpendicular to AB in plane C and equals DE
 * (Java: Slate.java point case 15, choice 3 — new Perpendicular(A,B,C,D,E))
 */
export class PointPerpendicular4Construction extends PointPerpendicularConstruction {
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PlaneElement, ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];
        let c : PlaneElement = params[2];
        let d : PointElement = params[3];
        let e : PointElement = params[4];
        let g = new Perpendicular({C:a, D:b,P:c, E:d, F:e});
        return [[g], g.B];
    }
}


/* point
 * perpendicular
 * point A, plane B, points C, D
 * the point E on the line perpendicular to plane B passing through
 * A so that the distance from E to B equals CD
 * (Java: Slate.java point case 15, choice 4 — new PlanePerpendicular(A,B,C,D))
 */
export class PointPerpendicular5Construction extends PointPerpendicularConstruction {
    signature: ConstructionTypes[] = [ct.PointElement, ct.PlaneElement, ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PlaneElement = params[1];
        let c : PointElement = params[2];
        let d : PointElement = params[3];
        let g = new PlanePerpendicularLine({C:a, P:b, D:c, E:d});
        return [[g], g.B];
    }
}


// point
// proportion
// 8 points S0, S1, T0, T1, U0, U1, V0, V1
// the point V' on V0V1 so that |S0S1|:|T0T1| = |U0U1|:|V0V'|
// (Java: Proportion.java — 26 lines, line-for-line port)
export class ProportionPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.proportion;
    signature: ConstructionTypes[] = (new Array(8)).fill(ct.PointElement);

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new ProportionElement(ps[0], ps[1], ps[2], ps[3], ps[4], ps[5], ps[6], ps[7]);
        return [[g], g];
    }
}

// point
// invert
// point A circle B
// the image of a point A inverted in the circle B
// (Java: InvertPoint.java — 16 lines, calls toInvertPoint(A, C))
export class InvertPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.invert;
    signature: ConstructionTypes[] = [ct.PointElement, ct.CircleElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const A = params[0] as PointElement;
        const C = params[1] as CircleElement;
        const g = new InvertPointElement(A, C);
        return [[g], g];
    }
}

// point
// meanProportional
// 6 points S0, S1, T0, T1, U0, U1
// the point U' on U0U1 so that S:U' = U':T (geometric mean)
// (Java: MeanProportional.java — 23 lines, line-for-line port)
export class MeanProportionalPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.meanProportional;
    signature: ConstructionTypes[] = (new Array(6)).fill(ct.PointElement);

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new MeanProportionalElement(ps[0], ps[1], ps[2], ps[3], ps[4], ps[5]);
        return [[g], g];
    }
}

// point
// planeSlider
// plane A integers x, y, z
// a point that slides on the plane A with initial coordinates (x,y,z)
// (Java: Slate.java point case 19 — new PlaneSlider((PlaneElement)E[0], N[0], N[1], N[2]).
// PlaneSlider.ts already has the full constructor + update() + drag().)
export class PlaneSliderConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.planeSlider;
    signature: ConstructionTypes[] = [ct.PlaneElement, ct.Integer, ct.Integer, ct.Integer];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const plane = params[0] as PlaneElement;
        const x = params[1] as number;
        const y = params[2] as number;
        const z = params[3] as number;
        const g = new PlaneSlider(plane, x, y, z);
        return [[g], g];
    }
}

// point
// sphereSlider
// sphere A integers x, y, z
// a point that slides on the sphere A with initial coordinates (x,y,z)
// (Java: SphereSlider.java — 43 lines, line-for-line port)
export class SphereSliderConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.sphereSlider;
    signature: ConstructionTypes[] = [ct.SphereElement, ct.Integer, ct.Integer, ct.Integer];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const S = params[0] as SphereElement;
        const x = params[1] as number;
        const y = params[2] as number;
        const z = params[3] as number;
        const g = new SphereSliderElement(S, x, y, z);
        return [[g], g];
    }
}

// point
// angleBisector (2D variant)
// points B, A, C
// bisect angle BAC — the point on BC where the bisector from A meets BC
// (Java: AngleDivider.java with n=2, Slate.java point case 21)
export class AngleBisectorPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.angleBisector;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new AngleDividerElement(ps[0], ps[1], ps[2], screen, 2);
        return [[g], g];
    }
}

// point
// angleDivider (2D variant)
// points B, A, C, integer n
// n-sect angle BAC — the point on BC where the 1/n ray from A meets BC
// (Java: AngleDivider.java with variable n, Slate.java point case 22)
export class AngleDividerPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.angleDivider;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.Integer];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let n : number = params[3];
        let g = new AngleDividerElement(ps[0], ps[1], ps[2], screen, n);
        return [[g], g];
    }
}

// point — angleBisector (3D variant)
// points B, A, C, plane D
// (Java: Slate.java point case 21, choice 1 — new AngleDivider(B,A,C,D,2))
export class AngleBisectorPoint3dConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.angleBisector;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new AngleDividerElement(ps[0], ps[1], ps[2], params[3] as PlaneElement, 2);
        return [[g], g];
    }
}

// point — angleDivider (3D variant)
// points B, A, C, plane D, integer n
// (Java: Slate.java point case 22, choice 1 — new AngleDivider(B,A,C,D,n))
export class AngleDividerPoint3dConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.angleDivider;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement, ct.PlaneElement, ct.Integer];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new AngleDividerElement(ps[0], ps[1], ps[2], params[3] as PlaneElement, params[4] as number);
        return [[g], g];
    }
}

// point
// fixed
// integers x, y [z=0]
// the fixed point with coordinates (x, y, 0)
// (Java: Slate.java point case 23, choice 0 — new FixedPoint(x,y,0))
export class FixedPoint2dConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.fixed;
    signature: ConstructionTypes[] = [ct.Integer, ct.Integer];
    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let x : number = params[0];
        let y : number = params[1];

        let g = new FixedPoint({x:x, y:y,z:0});

        return [[g], g];
    }
}

// point
// fixed
// integers x, y, z
// the fixed point with coordinates (x, y, z)
// (Java: Slate.java point case 23 — new FixedPoint(x,y,z))
export class FixedPoint3dConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.fixed;
    signature: ConstructionTypes[] = [ct.Integer, ct.Integer, ct.Integer];
    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let x : number = params[0];
        let y : number = params[1];
        let z : number = params[2];

        let g = new FixedPoint({x:x, y:y, z:z});

        return [[g], g];
    }
}

// point
// lineSegmentSlider
// points A, B, integers x, y, [z]
// a point that slides along within the line segment AB with initial coordinates (x,y,z)
// (Java: Slate.java point case 24 — new LineSlider(A,B,x,y,z,true))
export class LineSliderSegmentConstruction extends LineSliderConstruction {
    constructionMethod: AllConstructions = PointConstructions.lineSegmentSlider;
    protected createSlider(a: PointElement, b: PointElement, x: number, y: number, z: number) {
        return new LineSlider(a, b, x, y, z, true);
    }
}


// point
// harmonic
// points B, C, D
// the harmonic conjugate of B with respect to C and D
// (Java: Harmonic.java — 43 lines, line-for-line port.
// Slate.java point case 25 — new Harmonic(P[0], P[1], P[2]))
export class HarmonicPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.harmonic;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new HarmonicElement(ps[0], ps[1], ps[2]);
        return [[g], g];
    }
}

// point
// vertex
// polygon A, integer n
// the nth vertex (1-based) of polygon A
// (Java: Slate.java point case 9 — returns ((PolygonElement)E[0]).V[n-1])
export class VertexConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.vertex;
    signature: ConstructionTypes[] = [ct.PolygonElement, ct.Integer];

    construct(_screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const poly = params[0] as PolygonElement;
        const n    = params[1] as number;
        const vertex = poly.V[n - 1];
        return [[vertex], vertex];
    }
}

export const pointConstructions: Construction[] = [
    new FreePointConstruction(),
    new FixedPoint2dConstruction(),
    new FixedPoint3dConstruction(),
    new FirstPointConstruction(),
    new LastPointConstruction(),
    new CircleCenterConstruction(),
    new CircumcenterConstruction(),
    new CircumcenterConstruction2d(),
    new MidPointConstruction(),
    new IntersectionConstruction(),
    new IntersectionConstructionScreen(),
    new FootPointConstruction(),
    new PlaneFootPointConstruction(),
    new ExtendConstruction(),
    new CutoffConstruction(),
    new ParallelogramConstruction(),
    new SimilarPoint3dConstruction(),
    new SimilarPointConstruction(),
    new ProportionPointConstruction(),
    new AngleBisectorPoint3dConstruction(),
    new AngleBisectorPointConstruction(),
    new AngleDividerPoint3dConstruction(),
    new AngleDividerPointConstruction(),
    new MeanProportionalPointConstruction(),
    new PlaneSliderConstruction(),
    new SphereSliderConstruction(),
    new HarmonicPointConstruction(),
    new InvertPointConstruction(),
    new PlaneIntersectionConstruction(),
    new SphereCenterConstruction(),
    new CircumcircleConstruction(),
    new CircumcircleConstruction2d(),
    new LineSliderConstruction(),
    new LineSlider2dConstruction(),
    new LineSliderSegmentConstruction(),
    new CircleSliderConstruction(),
    new CircleSliderConstruction2dPoint(),
    new PointPerpendicular1Construction(),
    new PointPerpendicular2Construction(),
    new PointPerpendicular3Construction(),
    new PointPerpendicular4Construction(),
    new PointPerpendicular5Construction(),
    new VertexConstruction(),
];
