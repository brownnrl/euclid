/*----------------------------------------------------------------------+
|    Point construction classes — extracted from Constructions.ts        |
|    Each class maps a (type, constructionName, signature) triple to     |
|    a construct() method that creates the geometry element.             |
+----------------------------------------------------------------------*/

import {Construction, ConstructionSignature, AllConstructions, PointConstructions,
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
    signature: ConstructionSignature = { points: 0, elements: 0, integers: 2 };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new PlaneSlider(screen, N[0], N[1], 0);

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
    signature: ConstructionSignature = { points: 2, elements: 0, integers: 0 };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new Midpoint(P[0], P[1]);

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
    signature: ConstructionSignature = { points: 4, elements: 1, integers: 0, elementTypes: [PlaneElement] };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new Intersection(P[0], P[1], P[2], P[3], E[0] as PlaneElement);

        return [[g], g];
    }
}

// (Java: Slate.java point case 2, choice 0 — new Intersection(A,B,C,D,screen))
export class IntersectionConstructionScreen extends IntersectionConstruction {
    signature: ConstructionSignature = { points: 4, elements: 0, integers: 0 };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        return super.construct(screen, P, [screen], N);
    }
}

// point
// intersection (plane-line variant)
// plane A, points B, C
// the intersection of the plane A and the line BC
// (Java: IntersectionPL.java — TS: PlaneIntersection.ts, renamed for clarity)
export class PlaneIntersectionConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.intersection;
    signature: ConstructionSignature = { points: 2, elements: 1, integers: 0, elementTypes: [PlaneElement] };

    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new PlaneIntersection(E[0] as PlaneElement, P[0], P[1]);
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
    signature: ConstructionSignature = { points: 2, elements: 0, integers: 0 };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        return [[], P[0]];
    }

}

// point
// last
// points A, B
// the last end B of the line AB
// (Java: Slate.java point case 4 — returns P[1], preexists=true)
export class LastPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.last;
    signature: ConstructionSignature = { points: 2, elements: 0, integers: 0 };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        return [[], P[1]];
    }
}

// point
// center
// circle A
// the center of the circle A
// (Java: Slate.java point case 5, choice 0 — returns ((CircleElement)E[0]).Center)
export class CircleCenterConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.center;
    signature: ConstructionSignature = { points: 0, elements: 1, integers: 0, elementTypes: [CircleElement] };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        return [[], (E[0] as CircleElement).Center as PointElement];
    }
}

// point
// center (sphere variant)
// sphere A
// the center of the sphere A
// (Java: Slate.java point case 5, choice 1 — returns ((SphereElement)E[0]).Center)
export class SphereCenterConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.center;
    signature: ConstructionSignature = { points: 0, elements: 1, integers: 0, elementTypes: [SphereElement] };
    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        return [[], (E[0] as SphereElement).Center as PointElement];
    }
}

// point
// lineSlider
// points A, B integers x, y,[z]
// a point that slides along a line AB with initial coordinates (x,y,z)
// (Java: Slate.java point case 6 — new LineSlider(A,B,x,y,z,false))
export class LineSliderConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.lineSlider;
    signature: ConstructionSignature = { points: 2, elements: 0, integers: 3 };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = this.createSlider(P[0], P[1], N[0], N[1], N[2]);

        return [[g], g];
    }
    protected createSlider(a: PointElement, b: PointElement, x: number, y: number, z: number) {
        return new LineSlider(a, b, x, y, z, false);
    }
}

// point — lineSlider (2D variant, z defaults to 0)
// (Java: Slate.java point case 6, choice 0 — z set to 0)
export class LineSlider2dConstruction extends LineSliderConstruction {
    signature: ConstructionSignature = { points: 2, elements: 0, integers: 2 };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = this.createSlider(P[0], P[1], N[0], N[1], 0);

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
    signature: ConstructionSignature = { points: 0, elements: 1, integers: 3, elementTypes: [CircleElement] };

    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new CircleSlider(E[0] as CircleElement, N[0], N[1], N[2]);
        return [[g], g];
    }
}

// point — circleSlider (2D variant, z defaults to 0)
// (Java: Slate.java point case 7, choice 0 — z set to 0)
export class CircleSliderConstruction2dPoint extends CircleSliderConstruction {
    signature: ConstructionSignature = { points: 0, elements: 1, integers: 2, elementTypes: [CircleElement] };

    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        return super.construct(screen, P, E, [...N, 0]);
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
    signature: ConstructionSignature = { points: 3, elements: 1, integers: 0, elementTypes: [PlaneElement] };

    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new CircumcircleElement(P[0], P[1], P[2], E[0] as PlaneElement);
        return [[g], g];
    }
}

// circle — circumcircle (2D variant, plane defaults to screen)
// (Java: Slate.java circle case 1, choice 0 — E[0] = screen)
export class CircumcircleConstruction2d extends CircumcircleConstruction {
    signature: ConstructionSignature = { points: 3, elements: 0, integers: 0 };

    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        return super.construct(screen, P, [screen], N);
    }
}

// point
// circumcenter
// points A, B, C, plane D
// the center of a circle ABC passing through 3 points A, B, and C in the plane D
// (Java: Slate.java point case 8 — new Circumcircle(A,B,C,D), returns circ.Center)
export class CircumcenterConstruction extends CircumcircleConstruction {
    constructionMethod: AllConstructions = PointConstructions.circumcenter;

    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let es = super.construct(screen, P, E, N);
        let g : CircleElement = es[1] as CircleElement;
        es[0].push(g.Center);
        return [es[0], g.Center];
    }
}

// point — circumcenter (2D variant, plane defaults to screen)
// (Java: Slate.java point case 8, choice 0 — E[0] = screen)
export class CircumcenterConstruction2d extends CircumcenterConstruction {
    signature: ConstructionSignature = { points: 3, elements: 0, integers: 0 };

    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        return super.construct(screen, P, [screen], N);
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
    signature: ConstructionSignature = { points: 3, elements: 0, integers: 0 };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]) : [GeomElementsForUpdate, GeomElement] {
        let g = new Foot(P[0], P[1], P[2]);

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
    signature: ConstructionSignature = { points: 1, elements: 1, integers: 0, elementTypes: [PlaneElement] };

    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new PlaneFootElement(P[0], E[0] as PlaneElement);
        return [[g], g];
    }
}

// point
// layoff used for extend and cutoff
export abstract class LayoffConstruction extends Construction {
    signature: ConstructionSignature = { points: 4, elements: 0, integers: 0 };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = this._createLayoff(P);
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
    signature: ConstructionSignature = { points: 3, elements: 0, integers: 0 };

    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new Layoff(P[0], P[1], P[2], P[1], P[2]);
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
    signature: ConstructionSignature = { points: 5, elements: 0, integers: 0 };

    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new SimilarElement(P[0], P[1], screen, P[2], P[3], P[4], screen);
        return [[g], g];
    }
}

// point
// similar (3D variant)
// points A, B, D, E, F, planes C, G
// (Java: Similar with explicit PlaneElements instead of screen)
export class SimilarPoint3dConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.similar;
    signature: ConstructionSignature = { points: 5, elements: 2, integers: 0, elementTypes: [PlaneElement, PlaneElement] };

    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new SimilarElement(P[0], P[1], E[0] as PlaneElement, P[2], P[3], P[4], E[1] as PlaneElement);
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
    signature: ConstructionSignature = { points: 2, elements: 0, integers: 0 };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new Perpendicular({C:P[0], D:P[1],P:screen, E:P[0], F:P[1]});
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
    signature: ConstructionSignature = { points: 2, elements: 1, integers: 0, elementTypes: [PlaneElement] };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new Perpendicular({C:P[0], D:P[1],P:E[0] as PlaneElement, E:P[0], F:P[1]});
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
    signature: ConstructionSignature = { points: 4, elements: 0, integers: 0 };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new Perpendicular({C:P[0], D:P[1],P:screen, E:P[2], F:P[3]});
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
    signature: ConstructionSignature = { points: 4, elements: 1, integers: 0, elementTypes: [PlaneElement] };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new Perpendicular({C:P[0], D:P[1],P:E[0] as PlaneElement, E:P[2], F:P[3]});
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
    signature: ConstructionSignature = { points: 3, elements: 1, integers: 0, elementTypes: [PlaneElement] };
    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new PlanePerpendicularLine({C:P[0], P:E[0] as PlaneElement, D:P[1], E:P[2]});
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
    signature: ConstructionSignature = { points: 8, elements: 0, integers: 0 };

    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new ProportionElement(P[0], P[1], P[2], P[3], P[4], P[5], P[6], P[7]);
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
    signature: ConstructionSignature = { points: 1, elements: 1, integers: 0, elementTypes: [CircleElement] };

    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new InvertPointElement(P[0], E[0] as CircleElement);
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
    signature: ConstructionSignature = { points: 6, elements: 0, integers: 0 };

    construct(screen : PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new MeanProportionalElement(P[0], P[1], P[2], P[3], P[4], P[5]);
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
    signature: ConstructionSignature = { points: 0, elements: 1, integers: 3, elementTypes: [PlaneElement] };

    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new PlaneSlider(E[0] as PlaneElement, N[0], N[1], N[2]);
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
    signature: ConstructionSignature = { points: 0, elements: 1, integers: 3, elementTypes: [SphereElement] };

    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const g = new SphereSliderElement(E[0] as SphereElement, N[0], N[1], N[2]);
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
    signature: ConstructionSignature = { points: 3, elements: 0, integers: 0 };

    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new AngleDividerElement(P[0], P[1], P[2], screen, 2);
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
    signature: ConstructionSignature = { points: 3, elements: 0, integers: 1 };

    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new AngleDividerElement(P[0], P[1], P[2], screen, N[0]);
        return [[g], g];
    }
}

// point — angleBisector (3D variant)
// points B, A, C, plane D
// (Java: Slate.java point case 21, choice 1 — new AngleDivider(B,A,C,D,2))
export class AngleBisectorPoint3dConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.angleBisector;
    signature: ConstructionSignature = { points: 3, elements: 1, integers: 0, elementTypes: [PlaneElement] };

    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new AngleDividerElement(P[0], P[1], P[2], E[0] as PlaneElement, 2);
        return [[g], g];
    }
}

// point — angleDivider (3D variant)
// points B, A, C, plane D, integer n
// (Java: Slate.java point case 22, choice 1 — new AngleDivider(B,A,C,D,n))
export class AngleDividerPoint3dConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.angleDivider;
    signature: ConstructionSignature = { points: 3, elements: 1, integers: 1, elementTypes: [PlaneElement] };

    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new AngleDividerElement(P[0], P[1], P[2], E[0] as PlaneElement, N[0]);
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
    signature: ConstructionSignature = { points: 0, elements: 0, integers: 2 };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new FixedPoint({x:N[0], y:N[1],z:0});

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
    signature: ConstructionSignature = { points: 0, elements: 0, integers: 3 };
    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new FixedPoint({x:N[0], y:N[1], z:N[2]});

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
    signature: ConstructionSignature = { points: 3, elements: 0, integers: 0 };

    construct(screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        let g = new HarmonicElement(P[0], P[1], P[2]);
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
    signature: ConstructionSignature = { points: 0, elements: 1, integers: 1, elementTypes: [PolygonElement] };

    construct(_screen: PlaneElement, P: PointElement[], E: GeomElement[], N: number[]): [GeomElementsForUpdate, GeomElement] {
        const poly = E[0] as PolygonElement;
        const vertex = poly.V[N[0] - 1];
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
