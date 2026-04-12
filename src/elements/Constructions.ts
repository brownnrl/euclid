/*----------------------------------------------------------------------+
|    Title:	Constructions.ts                                            |
|    A port of the software Geometry Applet by                          |
|    Author:    David E. Joyce                                          |
|        Department of Mathematics and Computer Science                 |
|        Clark University                                               |
|        Worcester, MA 01610-1477                                       |
|        U.S.A.                                                         |
|                                                                       |
|        http://aleph0.clarku.edu/~djoyce/home.html                     |
|        djoyce@clarku.edu                                              |
|                                                                       |
|    Date:    February, 1996.   Version 2.0.0 May, 1997.                |
|    TypeScript Port: 2019, Nelson Brown, brownnrl@gmail.com            |
|                           https://www.nelsonbrown.net/                |
+----------------------------------------------------------------------*/
import {GeomElement} from "./GeomElement";
import {CircleElement} from "./circle/CircleElement";
import {CircumcircleElement} from "./circle/CircumcircleElement";
import {PlaneElement} from "./plane/PlaneElement";
import {IPerpendicularPlaneElementConstruction, 
        PerpendicularPlane} from "./plane/PerpendicularPlane";
import {PointElement} from "./point/PointElement";
import {FixedPoint} from "./point/FixedPoint";
import {PlaneSlider} from "./point/PlaneSlider";
import {Midpoint} from "./point/Midpoint";
import {Intersection} from "./point/Intersection";
import {LineElement} from "./line/LineElement";
import {LineSlider} from "./point/LineSlider";
import {Layoff} from "./point/Layoff";
import {Foot} from "./point/Foot";
import {SectorElement} from "./sector/SectorElement";
import {ArcElement} from "./sector/ArcElement";
import {CircleSlider} from "./point/CircleSlider";
import {Perpendicular} from "./line/Perpendicular";
import {PlanePerpendicularLine} from "./line/PlanePerpendicularLine";
import {Bichord} from "./line/Bichord";
import {Chord} from "./line/Chord";
import {SimilarElement} from "./point/SimilarElement";
import {ProportionElement} from "./point/ProportionElement";
import {ApplicationElement} from "./polygon/ApplicationElement";
import {PolygonElement} from "./polygon/PolygonElement";
import {RegularPolygonElement} from "./polygon/RegularPolygonElement";
import {SphereElement} from "./sphere/SphereElement";

export enum ConstructionTypes {
    Integer,
    PointElement,
    CircleElement,
    PlaneElement,
    SphereElement,
    PolygonElement
}

export enum PointConstructions {
    free = 1,
    midpoint = 2,
    intersection = 3,
    first = 4,
    last = 5,
    center = 6,
    lineSlider = 7,
    circleSlider = 8,
    circumcenter = 9,
    vertex = 10,
    foot = 11,
    cutoff = 12,
    extend = 13,
    parallelogram = 14,
    similar = 15,
    perpendicular = 16,
    proportion = 17,
    invert = 18,
    meanProportional = 19,
    planeSlider = 20,
    sphereSlider = 21,
    angleBisector = 22,
    angleDivider = 23,
    fixed = 24,
    lineSegmentSlider = 25
}

export enum LineConstructions {
    connect = 101,
    angleBisector = 102,
    angleDivider = 103,
    foot = 104,
    chord = 105,
    bichord = 106,
    perpendicular = 107,
    cutoff = 108,
    extend = 109,
    parallel = 110,
    similar = 111,
    proportion = 112,
    meanProportional = 113
}


export enum CircleConstructions {
    radius = 201,
    circumcircle = 202,
    invert = 203,
    intersection = 204
}


export enum PolygonConstructions {
    square = 301,
    triangle = 302,
    quadrilateral = 303,
    pentagon = 304,
    hexagon = 305,
    equilateralTriangle = 306,
    parallelogram = 307,
    regularPolygon = 308,
    starPolygon = 309,
    similar = 310,
    application = 311,
    octagon = 312,
    face = 313
}

export enum SectorConstructions {
    sector = 401,
    arc = 402
}

export enum PlaneConstructions {
    threePoints = 501,
    perpendicular = 502,
    parallel = 503,
    ambient = 504
}

export enum SphereConstructions {
    radius = 601
}

export enum PolyhedraConstructions {
    tetrahedron = 701,
    parallelepiped = 702,
    prism = 703,
    pyramid = 704
}

export function getConstructionName(cm: AllConstructions) : String {
    if(cm < 100) {
        return "Point." + PointConstructions[cm];
    } else if (100 < cm && cm < 200) {
        return "Line." + LineConstructions[cm];
    } else if (300 < cm && cm < 400) {
        return "Polygon." + PolygonConstructions[cm];
    } else if (400 < cm && cm < 500) {
        return "Sector." + SectorConstructions[cm];
    } else if (500 < cm && cm < 600) {
        return "Plane." + PlaneConstructions[cm];
    } else if (600 < cm && cm < 700) {
        return "Sphere." + SphereConstructions[cm];
    } else if (700 < cm && cm < 800) {
        return "Polyhedra." + PolyhedraConstructions[cm];
    }

    return "<Not Valid Construction>";
}

export var E =  {
    Point : PointConstructions,
    Line : LineConstructions,
    Circle: CircleConstructions,
    Polygon: PolygonConstructions,
    Sector: SectorConstructions,
    Plane: PlaneConstructions,
    Sphere: SphereConstructions,
    Polyhedra: PolyhedraConstructions
};

export type AllConstructions =
    PointConstructions   |
    LineConstructions    |
    CircleConstructions  |
    PlaneConstructions   |
    PolygonConstructions |
    SectorConstructions  |
    SphereConstructions  |
    PolyhedraConstructions;

export type GeomElementsForUpdate = GeomElement[];

export abstract class Construction {
    public abstract constructionMethod : AllConstructions;
    public abstract signature: ConstructionTypes[];
    public abstract construct(screen: PlaneElement, params: any[]) : [GeomElementsForUpdate, GeomElement];
    // TODO: Optional values (such as null z coordinates) should be allowed
    public validateSignature(cm : AllConstructions, params: any[]) : boolean {
        if (cm != this.constructionMethod) return false;
        const sigCopy : ConstructionTypes[] = [...this.signature].reverse();
        if (sigCopy.length != params.length) return false;
        for(let param of params) {
            let sigItem = sigCopy.pop();
            // TODO: resume here
            switch(sigItem) {
                case ConstructionTypes.Integer:
                    if (!(typeof(param) == "number")) {
                        return false;
                    }
                    break;
                case ConstructionTypes.CircleElement:
                    if (!(param instanceof CircleElement)) {
                        return false;
                    }
                    break;
                case ConstructionTypes.PlaneElement:
                    if (!(param instanceof PlaneElement)) {
                        return false;
                    }
                    break;
                case ConstructionTypes.PointElement:
                    if (!(param instanceof PointElement)) {
                        return false;
                    }
                    break;
                case ConstructionTypes.SphereElement:
                    // TODO:
                    break;
                case ConstructionTypes.PolygonElement:
                    if (!(param instanceof PolygonElement)) {
                        return false;
                    }
                    break;
                default:
                    return false;
            }
        }
        return true;
    }
}

let ct = ConstructionTypes;

/***********************
 * Element Class Point *
 ***********************/

/* point
 * free	
 * integers x, y	
 * a freely dragable point in the screen plane with initial coordinates (x,y,0)
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

// TBD
// point
// intersection 
// points B, C plane A
// the intersection of the plane A and the line BC

// point
// first
// points A, B
// the first end A of the line AB
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
export class CircleCenterConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.center;
    signature: ConstructionTypes[] = [ct.CircleElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        return [[], (params[0] as CircleElement).Center as PointElement];
    }
}

// TBD
// point
// center
// sphere A
// the center of the sphere A

// point
// lineSlider
// points A, B integers x, y,[z] 
// a point that slides along a line AB with initial coordinates (x,y,z)
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

// point
// lineSlider (optional argument z excluded)
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
// circleSlider	circle A integers x, y,[z]	a point that slides along a circle A with given initial coordinates (x,y,z)
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

// point
// circleSlider (optional argument z excluded)
export class CircleSliderConstruction2dPoint extends CircleSliderConstruction {
    signature: ConstructionTypes[] = [ct.CircleElement, ct.Integer, ct.Integer];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        params.push(0);
        return super.construct(screen, params);
    }
}

/*******************************************
 * Circle Elements needed for CircumCircle *
 *******************************************/

// circle
// circumcircle	
// points A, B, C, plane D
// the circle passing through 3 points A, B, and C in the plane D
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

// circle
// circumcircle	
// points A, B, C [plane D=screen]
// the circle passing through 3 points A, B, and C in the plane D
export class CircumcircleConstruction2d extends CircumcircleConstruction {
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        params.push(screen);
        return super.construct(screen, params);
    }
}

// point
// circumcenter
// points A, B, C plane D	
// the center of a circle ABC passing through 3 points A, B, and C in the plane D
export class CircumcenterConstruction extends CircumcircleConstruction {
    constructionMethod: AllConstructions = PointConstructions.circumcenter;

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let es : [GeomElementsForUpdate, GeomElement] = super.construct(screen, params);
        let g : CircleElement = es[1] as CircleElement;
        es[0].push(g.Center);
        // returns cirlce and circle center for update
        // and the circle center as the constructed element
        return [es[0], g.Center];
    }
}

// point
// circumcenter
// points A, B, C plane D	
// the center of a circle ABC passing through 3 points A, B, and C in the plane D
export class CircumcenterConstruction2d extends CircumcenterConstruction {
    constructionMethod: AllConstructions = PointConstructions.circumcenter;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        params.push(screen)
        return super.construct(screen, params);
    }
}

// TBD
/* point
 * vertex
 * polygon A integer i
 * a vertex Ai of the polygon A1A2...An with index i
 */

/* point
 * foot
 * points A, B, C
 * the foot of a perpendicular drawn from A to a line BC
 */
export class FootPointConsturction extends Construction {
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

// TBD
// point
// foot
// point A plane B
// the foot of a perpendicular drawn from A to a plane B

// point
// layoff used for extend and cutoff
abstract class LayoffConstruction extends Construction {
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
// points A, B, C, 
// the point E on a line AB so that AE = CD
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

// point perpendicular constructions
abstract class PointPerpendicularConstruction extends Construction {
    constructionMethod : AllConstructions = PointConstructions.perpendicular;
}

/* point
 * perpendicular
 * points A, B, [plane C (screen)]
 * the point D so that AD is equal and perpendicular to AB in plane C
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
 * points A, B, D, E [plane C]
 * the point F so that AF is perpendicular to AB in plane C and equals DE
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
 * points A, C, D plane B 
 * the point E on the line perpendicular to plane B passing through 
 * A so that the distance from E to B equals CD
 */
export class PointPerpendicular5Construction extends PointPerpendicularConstruction {
    signature: ConstructionTypes[] = [ct.PointElement, ct.PlaneElement, ct.PlaneElement, ct.PointElement, ct.PointElement];
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

// TBD
// point
// invert
// point A circle B
// the image of a point A inverted in the circle B

// TBD
// point
// meanProportional
// 6 points A, B, C, D, E, F
// the point G on EF so that AB:CD = CD:EG

// TBD
// point
// planeSlider	
// plane A integers x, y, z
// a point that slides on the plane A with initial coordinates (x,y,z)

// TBD
// point
// sphereSlider
// sphere A integers x, y, z
// a point that slides on the sphere A with initial coordinates (x,y,z)

// TBD
// point
// angleBisector	
// points A, B, C [plane D]
// The point at the intersection of the angle bisector of angle BAC and the line BC in plane D

// TBD
// point
// angleDivider
// points A, B, C [plane D] integer n
// The point E on the line BC so that angle BAE is the nth part of the angle BAC in plane D

// point
// fixed
// integers x, y,[z=0]
// the fixed point with coordinates (x, y, z)
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
// points A, B integers x, y,[z]
// a point that slides along within the line segment AB with initial coordinates (x,y,z)
export class LineSliderSegmentConstruction extends LineSliderConstruction {
    constructionMethod: AllConstructions = PointConstructions.lineSegmentSlider;
    protected createSlider(a: PointElement, b: PointElement, x: number, y: number, z: number) {
        return new LineSlider(a, b, x, y, z, true);
    }
}


// TBD
// point
// harmonic
// points B, C, D
// the harmonic conjugate of B with respect to C and D


/**********************
 * Element Class Line *
 **********************/

// line
// connect
// points A, B
// the line AB connecting two points A and B
export class LineConnectConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.connect;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let a : PointElement = params[0];
        let b : PointElement = params[1];

        let g = new LineElement({A:a, B: b});

        return [[g], g];
    }
}

// TBD
// line
// angleBisector
// points A, B, C [plane D]
// the line AE bisecting angle BAC with E on BC in plane D

// TBD
// line
// angleDivider
// points A, B, C [plane D] integer n
// the line AE with E on BC so that BAE is the nth part of the angle BAC in plane D

// line
// foot (2D variant)
// 3 points A, B, C
// the line AD from A to the foot of the perpendicular from A to line BC
// (Java: Slate.java case 3, choice 0 — Foot(A,B,C) + LineElement(A,foot).
// Foot class already IMPL at src/elements/point/Foot.ts.)
export class LineFootConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.foot;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let fo = new Foot(ps[0], ps[1], ps[2]);
        let g = new LineElement({A: ps[0], B: fo});
        return [[fo, g], g];
    }
}

// TBD
// *Solid Geometry Only*
// line
// foot
// point A plane B
// the line AD drawn perpendicular to plane B with the point D lying on B

// line
// chord
// points A, B circle C
// the chord of circle C cut by the line AB
// (post-LineElement-expansion: A, B are the two endpoints of the input line)
export class ChordConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.chord;
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
export class BichordConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.bichord;
    signature: ConstructionTypes[] = [ct.CircleElement, ct.CircleElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : CircleElement[] = params;
        let g = new Bichord({C:ps[0], D:ps[1]});
        return [[g], g];
    }
}

// TODO: maybe find some common / better mixin pattern for perpendiculars
// line
// perpendicular
// points A, B, [plane C], D, E 
// the line AF perpendicular to AB in plane C equal to DE

// TBD
// *Solid Geometry Only*
// line
// perpendicular
// point A, plane B point C, D 
// the line EF perpendicular to plane B passing through A equal to CD with E lying on B
export class LinePerpendicular1Construction extends PointPerpendicular1Construction {
    constructionMethod : AllConstructions = LineConstructions.perpendicular;
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let es = super.construct(screen, params);
        return [es[0], es[0][0]];
    }
}
export class LinePerpendicular2Construction extends PointPerpendicular2Construction {
    constructionMethod : AllConstructions = LineConstructions.perpendicular;
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let es = super.construct(screen, params);
        return [es[0], es[0][0]];
    }
}
export class LinePerpendicular3Construction extends PointPerpendicular3Construction {
    constructionMethod : AllConstructions = LineConstructions.perpendicular;
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let es = super.construct(screen, params);
        return [es[0], es[0][0]];
    }
}
export class LinePerpendicular4Construction extends PointPerpendicular4Construction {
    constructionMethod : AllConstructions = LineConstructions.perpendicular;
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let es = super.construct(screen, params);
        return [es[0], es[0][0]];
    }
}
export class LinePerpendicular5Construction extends PointPerpendicular5Construction {
    constructionMethod : AllConstructions = LineConstructions.perpendicular;
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let es = super.construct(screen, params);
        return [es[0], es[0][0]];
    }
}

// TBD
// line
// cutoff
// points A, B, C, D
// the line AE equal to CD along the line AB

// TBD
// line
// extend
// points A, B, C, D
// the line BE equal to CD so that A, B, and C are collinear with B between A and C
export class LineExtendConstruction extends Construction {
    constructionMethod: AllConstructions = LineConstructions.extend;
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
    constructionMethod: AllConstructions = LineConstructions.parallel;
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
    constructionMethod: AllConstructions = LineConstructions.similar;
    signature: ConstructionTypes[] = (new Array(5)).fill(ct.PointElement);

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let sim = new SimilarElement(ps[0], ps[1], screen, ps[2], ps[3], ps[4], screen);
        let g = new LineElement({A: ps[0], B: sim});
        return [[sim, g], g];
    }
}

// TBD
// line
// proportion
// 8 points A, B, C, D, E, F, G, H
// the line GI along GH so that AB:CD = EF:GI

// TBD
// line
// meanProportional
// 6 points A, B, C, D, E, F
// the line EG along EF so that AB:CD = CD:EG

/************************
 * Element Class Circle *
 ************************/

// circle
// radius
// points A, B [plane C=screen]
// the circle with center A and radius AB in the plane C
export class CircleRadiusCenterConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructions.radius;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new CircleElement({C:ps[0], B:ps[1], AP:screen});
        return [[g], g];
    }
}

// TBD
// circle
// radius (3D, 2-point)
// points A, B, plane C
// the circle with center A and radius AB in the plane C

// circle
// radius (2D, 3-point)
// points A, B, C
// the circle with center A and radius |BC| in the screen plane
// (Java: CircleElement(A, B, C, screen) — A=center, radius=B.distance(C))
// MUST be registered BEFORE the 2-point variant in the constructions array
// (signature variant ordering rule: longer signature first)
export class CircleRadius3PointConstruction extends Construction {
    constructionMethod: AllConstructions = CircleConstructions.radius;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new CircleElement({C: ps[0], A: ps[1], B: ps[2], AP: screen});
        return [[g], g];
    }
}


// TBD
// circle
// invert
// circles A, B	
// the image of circle A inverted in circle B


// TBD
// *Solid Geometry Only*
// circle
// intersection
// spheres A, B	
// the intersection of spheres A and B

/*************************
 * Element Class Polygon *
 *************************/

abstract class PolyConstruction extends Construction {
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new PolygonElement(ps);
        return [[g],g];
    }
}

// polygon
// square
// points A, B [plane C]
// the square on a side AB in plane C (2D variant: plane defaults to screen)
// (Java: RegularPolygon.java with n=4 — same class as equilateralTriangle)
export class SquarePolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.square;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const [a, b] = params as [PointElement, PointElement];
        const g = new RegularPolygonElement(a, b, screen, 4);
        return [[g], g];
    }
}

// polygon
// triangle	
// points A, B, C
// the triangle ABC given 3 vertices A, B, and C
export class TrianglePolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructions.triangle;
    signature: ConstructionTypes[] = (new Array(3)).fill(ct.PointElement);
}


// point
// vertex
// polygon A, integer n
// the nth vertex (1-based) of polygon A
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

// polygon
// quadrilateral
// points A, B, C, D
// the quadrilateral ABCD given 4 vertices A, B, C, and D
export class QuadrilateralPolygonConstruction extends PolyConstruction {
    constructionMethod: AllConstructions = PolygonConstructions.quadrilateral;
    signature: ConstructionTypes[] = (new Array(4)).fill(ct.PointElement);
}

// TBD
// polygon
// pentagon	
// points A, B, C, D, E
// the pentagon given 5 vertices

// TBD
// polygon
// hexagon
// points A, B, C, D, E, F
// the hexagon given 6 vertices

// polygon
// equilateralTriangle
// points A, B [plane C = screen]
// the equilateral triangle on side AB in the screen plane (2D variant)
export class EquilateralTriangleConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.equilateralTriangle;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const [a, b] = params as [PointElement, PointElement];
        const g = new RegularPolygonElement(a, b, screen, 3);
        return [[g], g];
    }
}

// polygon
// parallelogram
// points A, B, C
// the parallelogram ABCD given A, B, and C, where D = A + (C - B)
// (no dedicated Java class — Slate.java case 6 dispatches to a Layoff
// trick identical to the point;parallelogram and line;parallel patterns)
export class ParallelogramPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.parallelogram;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let lo = new Layoff(ps[0], ps[1], ps[2], ps[1], ps[2]);
        let g = new PolygonElement([ps[0], ps[1], ps[2], lo]);
        return [[lo, g], g];
    }
}

// polygon
// regularPolygon (2D variant)
// points A, B, integer n
// the regular n-gon on side AB in the screen plane
// (Java: Slate.java polygon case 7 — RegularPolygon(A, B, screen, n))
export class RegularPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.regularPolygon;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.Integer];

    construct(screen: PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const a = params[0] as PointElement;
        const b = params[1] as PointElement;
        const n = params[2] as number;
        const g = new RegularPolygonElement(a, b, screen, n);
        return [[g], g];
    }
}

// TBD
// polygon
// starPolygon (2D variant)
// points A, B, integers n, d
// the star polygon {n/d} on side AB in the screen plane
// (RegularPolygonElement already supports density param d — just needs dispatcher)
// (Java: Slate.java polygon case 8 — RegularPolygon(A, B, screen, n, d))


// polygon
// similar (2D variant)
// points A, B, D, E, F
// the triangle ABH where H is the similar point so △ABH ∼ △DEF (screen plane)
// (Java: Slate.java polygon case 9 — Similar(A,B,screen,D,E,F,screen) + PolygonElement(A,B,H))
export class SimilarPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.similar;
    signature: ConstructionTypes[] = (new Array(5)).fill(ct.PointElement);

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let sim = new SimilarElement(ps[0], ps[1], screen, ps[2], ps[3], ps[4], screen);
        let g = new PolygonElement([ps[0], ps[1], sim]);
        return [[sim, g], g];
    }
}

// polygon
// application
// polygon A points B, C, D
// the parallelogram equal to the given polygon A with one side BC and one angle BCD
// (Java: Application.java — parallelogram with area = P.area(), side BC, angle DCB)
export class ApplicationPolygonConstruction extends Construction {
    constructionMethod: AllConstructions = PolygonConstructions.application;
    signature: ConstructionTypes[] = [ct.PolygonElement, ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        const P = params[0] as PolygonElement;
        const A = params[1] as PointElement;
        const B = params[2] as PointElement;
        const C = params[3] as PointElement;
        const g = new ApplicationElement(P, A, B, C);
        return [[g], g];
    }
}

// TBD
// polygon
// octagon	
// 8 points A, B, C, D, E, F, G, H
// the octagon given 8 vertices


// TBD
// *Solid Geometry Only*
// polygon
// face	
// polyhedron A integer n
// the nth face of polyhedron A


/************************
 * Element Class Sector *
 ************************/


// sector
// sector
// points A, B, C [plane D]
// the sector of a circle in plane D given the center A and two points B and C on the circumference
export class SectorConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructions.sector;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new SectorElement({O:ps[0], A:ps[1], B:ps[2], P: screen});
        return [[g], g];
    }
}

// sector
// sector
// points A, B, C [plane D]
// the sector of a circle in plane D given the center A and two points B and C on the circumference
export class Sector2Construction extends Construction {
    constructionMethod: AllConstructions = SectorConstructions.sector;
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
// 2D variant; the 3D variant [Point, Point, Point, Plane] is TBD per 2D-first policy.
export class ArcConstruction extends Construction {
    constructionMethod: AllConstructions = SectorConstructions.arc;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement, ct.PointElement];

    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new ArcElement(ps[0], ps[1], ps[2], screen);
        return [[g], g];
    }
}

/***********************
 * Element Class Plane *
 ***********************/

// TBD
// *Solid Geometry Only*
// plane
// 3points
// points A, B, C
// the plane passing through points A, B, and C


// *Solid Geometry Only*
// plane
// perpendicular
// points A, B
// the plane passing through point A and perpendicular to line AB
export class PerpendicularPlaneConstruction extends Construction {
    constructionMethod: AllConstructions = PlaneConstructions.perpendicular;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement]
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new PerpendicularPlane({A: ps[0], E: ps[1]});
        return [[g], g];
    }
}



// TBD
// *Solid Geometry Only*
// plane
// parallel	
// plane A point B
// the plane passing through point A and parallel to plane B


// TBD
// *Solid Geometry Only*
// plane
// ambient
// point A
// the ambient plane of point A


// TBD
// *Solid Geometry Only*
// plane
// ambient
// circle A
// the ambient plane of circle A


/************************
 * Element Class Sphere *
 ************************/

// TBD
// *Solid Geometry Only*
// sphere
// radius
// points A, B
// the sphere with center A and radius AB
export class SphereRadiusConstruction extends Construction {
    constructionMethod: AllConstructions = SphereConstructions.radius;
    signature: ConstructionTypes[] = [ct.PointElement, ct.PointElement]
    construct(screen : PlaneElement, params: any[]): [GeomElementsForUpdate, GeomElement] {
        let ps : PointElement[] = params;
        let g = new SphereElement({Center: ps[0], B: ps[1]});
        return [[g], g];
    }
}



// TBD
// *Solid Geometry Only*
// sphere
// radius
// points A, B, C
// the sphere with center A and radius BC

/****************************
 * Element Class Polyhedron *
 ****************************/

// TBD
// *Solid Geometry Only*
// polyhedron
// tetrahedron
// points A, B, C, D
// the tetrahedron given four vertices


// TBD
// *Solid Geometry Only*
// polyhedron
// parallelepiped
// points A, B, C, D
// the parallelepiped with three edges AB, AC, and AD


// TBD
// *Solid Geometry Only*
// polyhedron
// prism
// polygon A points B, C
// the prism with base A and side edges parallel and equal to BC


// TBD
// *Solid Geometry Only*
// polyhedron
// pyramid
// polygon A point B
// the pyramid with base A and apex B


export const constructions : Construction[] = [
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
    new FootPointConsturction(),
    new ExtendConstruction(),
    new CutoffConstruction(),
    new ParallelogramConstruction(),
    new SimilarPointConstruction(),
    new ProportionPointConstruction(),
    new CircumcircleConstruction(),
    new CircumcircleConstruction2d(),
    new LineSliderConstruction(),
    new LineSlider2dConstruction(),
    new LineSliderSegmentConstruction(),
    new LineConnectConstruction(),
    new LineExtendConstruction(),
    new SectorConstruction(),
    new Sector2Construction(),
    new ArcConstruction(),
    new CircleSliderConstruction(),
    new CircleSliderConstruction2dPoint(),
    new CircleRadius3PointConstruction(),
    new CircleRadiusCenterConstruction(),
    new PointPerpendicular1Construction(),
    new PointPerpendicular2Construction(),
    new PointPerpendicular3Construction(),
    new PointPerpendicular4Construction(),
    new PointPerpendicular5Construction(),
    new LinePerpendicular1Construction(),
    new LinePerpendicular2Construction(),
    new LinePerpendicular3Construction(),
    new LinePerpendicular4Construction(),
    new LinePerpendicular5Construction(),
    new BichordConstruction(),
    new ChordConstruction(),
    new LineParallelConstruction(),
    new LineFootConstruction(),
    new SimilarLineConstruction(),
    new TrianglePolygonConstruction(),
    new RegularPolygonConstruction(),
    new SquarePolygonConstruction(),
    new EquilateralTriangleConstruction(),
    new ParallelogramPolygonConstruction(),
    new QuadrilateralPolygonConstruction(),
    new SimilarPolygonConstruction(),
    new ApplicationPolygonConstruction(),
    new VertexConstruction(),
    new PerpendicularPlaneConstruction(),
    new SphereRadiusConstruction()
];
