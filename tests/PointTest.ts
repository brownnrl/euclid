import "mocha";
import * as assert from "assert";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {PlaneSlider} from "../src/elements/point/PlaneSlider";
import {Intersection} from "../src/elements/point/Intersection";
import {PointElement} from "../src/elements/point/PointElement";
import {CircleSlider} from "../src/elements/point/CircleSlider";
import {HarmonicElement} from "../src/elements/point/HarmonicElement";
import {SimilarElement} from "../src/elements/point/SimilarElement";
import {createCanvas} from "canvas";
import {almostEqual, toElements} from "./shared/testHelpers";

describe("point", () => {

    it("should create a free point as a PlaneSlider", () => {
        let slate: Slate = new Slate(createCanvas(200, 200));
        let e = slate.createElement(E.Point.free, [100, 100], "A");
        assert.ok(e == slate.elements[slate.elements.length - 1]);
        assert.ok(e instanceof PlaneSlider);
        let ps: PlaneSlider = e as PlaneSlider;
        assert.ok(e.name == "A");
        assert.ok(ps.distance(new PointElement({x: 100, y: 100})) <= 0.001);
    });

    // Book I, Def I11
    let circle_slider_midpoint_data: IConstructionInfo[] = [
        { construction: E.Point.free,         name: "A",    params: [40, 110] },
        { construction: E.Point.free,         name: "C",    params: [210, 110] },
        { construction: E.Line.connect,       name: "AC",   params: ["A", "C"] },
        { construction: E.Point.lineSlider,   name: "B",    params: ["AC", 100, 110] },
        { construction: E.Point.midpoint,     name: "E",    params: ["B", "C"] },
        { construction: E.Circle.radius,      name: "circ", params: ["E", "C"] },
        { construction: E.Point.circleSlider, name: "D",    params: ["circ", 140, 40] }
    ];

    it("should create a circle, circle slider, and midpoint", () => {
        let slate: Slate = new Slate(createCanvas(200, 200));
        let elms = toElements(slate, circle_slider_midpoint_data);
        slate.elements.forEach(e => e.update());
        let p7 = elms[6] as CircleSlider;
        almostEqual(p7.x, 143, 1);
        almostEqual(p7.y, 56, 1);
    });

    // Book I, Def I2
    let intersection_data: IConstructionInfo[] = [
        { construction: E.Point.free,          name: "A",   params: [40, 70] },
        { construction: E.Point.free,          name: "B",   params: [110, 100] },
        { construction: E.Point.free,          name: "C",   params: [190, 100] },
        { construction: E.Point.free,          name: "D",   params: [280, 50] },
        { construction: E.Line.connect,        name: "BC",  params: ["B", "C"] },
        { construction: E.Point.perpendicular, name: "E'",  params: ["B", "C"] },
        { construction: E.Point.midpoint,      name: "M",   params: ["A", "B"] },
        { construction: E.Point.perpendicular, name: "E''", params: ["M", "B"] },
        { construction: E.Point.intersection,  name: "E",   params: ["B", "E'", "M", "E''"] },
    ];

    it("should create an intersection element", () => {
        let slate: Slate = new Slate(createCanvas(200, 200));
        let elms = toElements(slate, intersection_data);
        slate.elements.forEach(e => e.update());
        let p8 = elms[8] as Intersection;
        almostEqual(p8.x, 110, 1);
        almostEqual(p8.y, 3, 1);
    });

    it("should return the nth vertex of a triangle", () => {
        const data: IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [100, 50] },
            { name: "B", construction: E.Point.free, params: [50, 200] },
            { name: "C", construction: E.Point.free, params: [250, 200] },
            { name: "T", construction: E.Polygon.triangle, params: ["A", "B", "C"] },
            { name: "V1", construction: E.Point.vertex, params: ["T", 1] },
            { name: "V2", construction: E.Point.vertex, params: ["T", 2] },
            { name: "V3", construction: E.Point.vertex, params: ["T", 3] },
        ];
        let slate = new Slate(createCanvas(400, 300));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let V1 = slate.lookupElement("V1") as PointElement;
        let V2 = slate.lookupElement("V2") as PointElement;
        let V3 = slate.lookupElement("V3") as PointElement;
        almostEqual(V1.x, 100, 1); almostEqual(V1.y, 50, 1);
        almostEqual(V2.x, 50, 1);  almostEqual(V2.y, 200, 1);
        almostEqual(V3.x, 250, 1); almostEqual(V3.y, 200, 1);
    });

    it("should compute the 4th vertex of a parallelogram", () => {
        // propI28: A(40,80), B(190,80), C(40,120) → D' = C + (B-A) = (190,120)
        const data: IConstructionInfo[] = [
            { name: "A",  construction: E.Point.free,          params: [40, 80] },
            { name: "B",  construction: E.Point.free,          params: [190, 80] },
            { name: "C",  construction: E.Point.free,          params: [40, 120] },
            { name: "D'", construction: E.Point.parallelogram, params: ["C", "A", "B"] },
        ];
        const slate = new Slate(createCanvas(400, 300));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        const D = slate.lookupElement("D'") as PointElement;
        almostEqual(D.x, 190, 1);
        almostEqual(D.y, 120, 1);
    });

    it("should compute the harmonic conjugate in the 3D branch when any z != 0", () => {
        // The 2D branch is hit when B.z === C.z === D.z === 0; lines 46-59.
        // Lines 61-72 are the 3D branch — exercised as soon as any point
        // has a non-zero z. Picks three collinear points on z=5.
        let B = new PointElement({x: 10, y: 10, z: 5});
        let C = new PointElement({x: 30, y: 10, z: 5});
        let D = new PointElement({x: 50, y: 10, z: 5});
        let H = new HarmonicElement(B, C, D);
        H.update();

        // Harmonic conjugate of B w.r.t. collinear C,D: cross-ratio (A,B;C,D) = -1
        // → A = 110/3 ≈ 36.667, same line → same y, same z.
        almostEqual(H.x, 110 / 3, 0.01);
        almostEqual(H.y, 10, 0.01);
        almostEqual(H.z, 5, 0.01);
    });

    it("should compute the harmonic conjugate (2D collinear case)", () => {
        // Collinear case: C=(0,0), D=(100,0), B=(25,0). Expected A=(-50,0).
        let data: IConstructionInfo[] = [
            { name: "B", construction: E.Point.free, params: [25, 0] },
            { name: "C", construction: E.Point.free, params: [0, 0] },
            { name: "D", construction: E.Point.free, params: [100, 0] },
            { name: "A", construction: E.Point.harmonic, params: ["B", "C", "D"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let A = slate.lookupElement("A") as PointElement;
        almostEqual(A.x, -50, 0.01);
        almostEqual(A.y,   0, 0.01);
    });

    // point;meanProportional — S:U' = U':T (geometric mean)
    it("should compute a mean proportional point (geometric mean)", () => {
        let data: IConstructionInfo[] = [
            { name: "S0", construction: E.Point.free, params: [0, 0] },
            { name: "S1", construction: E.Point.free, params: [100, 0] },
            { name: "T0", construction: E.Point.free, params: [0, 0] },
            { name: "T1", construction: E.Point.free, params: [25, 0] },
            { name: "U0", construction: E.Point.free, params: [0, 0] },
            { name: "U1", construction: E.Point.free, params: [200, 0] },
            { name: "P",  construction: E.Point.meanProportional, params: ["S0","S1","T0","T1","U0","U1"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let P = slate.lookupElement("P") as PointElement;
        almostEqual(P.x, 50, 0.01);
        almostEqual(P.y,  0, 0.01);
        let S = Math.sqrt(100*100);
        let T = Math.sqrt(25*25);
        let Up = P.distance(slate.lookupElement("U0") as PointElement);
        almostEqual(S / Up, Up / T, 0.001);
    });

    it("should compute a fourth proportional point", () => {
        let data: IConstructionInfo[] = [
            { name: "S0", construction: E.Point.free, params: [0, 0] },
            { name: "S1", construction: E.Point.free, params: [100, 0] },
            { name: "T0", construction: E.Point.free, params: [0, 0] },
            { name: "T1", construction: E.Point.free, params: [50, 0] },
            { name: "U0", construction: E.Point.free, params: [0, 0] },
            { name: "U1", construction: E.Point.free, params: [80, 0] },
            { name: "V0", construction: E.Point.free, params: [0, 0] },
            { name: "V1", construction: E.Point.free, params: [200, 0] },
            { name: "P",  construction: E.Point.proportion, params: ["S0","S1","T0","T1","U0","U1","V0","V1"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let P = slate.lookupElement("P") as PointElement;
        almostEqual(P.x, 40, 0.01);
        almostEqual(P.y,  0, 0.01);
    });

    // point;invert — factor = r²/d² = 4; result = (300,100)
    it("should compute the inversion of a point in a circle", () => {
        let data: IConstructionInfo[] = [
            { name: "O", construction: E.Point.free, params: [100, 100] },
            { name: "R", construction: E.Point.free, params: [200, 100] },
            { name: "C", construction: E.Circle.radius, params: ["O", "R"] },
            { name: "A", construction: E.Point.free, params: [150, 100] },
            { name: "B", construction: E.Point.invert, params: ["A", "C"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let B = slate.lookupElement("B") as PointElement;
        almostEqual(B.x, 300, 0.01);
        almostEqual(B.y, 100, 0.01);
    });

    it("should create a planeSlider point on a 3-point plane", () => {
        let data: IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.planeSlider, params: ["plane", 50, 50, 99] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let A = slate.lookupElement("A") as PointElement;
        // xy-plane (z=0) → point should project to z=0
        almostEqual(A.x, 50, 0.01);
        almostEqual(A.y, 50, 0.01);
        almostEqual(A.z, 0, 0.01);
        assert.ok((A as any).draggable);
    });

    // sphereSlider — projects onto sphere surface (distance from center = radius)
    it("should project a sphereSlider point onto the sphere surface", () => {
        let data: IConstructionInfo[] = [
            { name: "O", construction: E.Point.fixed, params: [100, 100, 0] },
            { name: "R", construction: E.Point.fixed, params: [200, 100, 0] },
            { name: "S", construction: E.Sphere.radius, params: ["O", "R"] },
            { name: "A", construction: E.Point.sphereSlider, params: ["S", 150, 100, 50] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let A = slate.lookupElement("A") as PointElement;
        let O = slate.lookupElement("O") as PointElement;
        let dist = Math.sqrt((A.x-O.x)*(A.x-O.x) + (A.y-O.y)*(A.y-O.y) + (A.z-O.z)*(A.z-O.z));
        almostEqual(dist, 100, 0.1);
        assert.ok((A as any).draggable);
    });

    it("should compute the foot of a perpendicular from a point to a plane", () => {
        let data: IConstructionInfo[] = [
            { name: "A", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "B", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "P", construction: E.Plane.threePoints, params: ["A", "B", "C"] },
            { name: "D", construction: E.Point.fixed, params: [50, 50, 100] },
            { name: "F", construction: E.Point.foot, params: ["D", "P"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let foot = slate.lookupElement("F") as PointElement;
        almostEqual(foot.x, 50, 0.01);
        almostEqual(foot.y, 50, 0.01);
        almostEqual(foot.z, 0, 0.01);
    });

    it("should compute a similar point with factor=1 (isosceles right triangle)", () => {
        let data: IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [50, 200] },
            { name: "B", construction: E.Point.free, params: [150, 200] },
            { name: "D", construction: E.Point.free, params: [0, 0] },
            { name: "E", construction: E.Point.free, params: [100, 0] },
            { name: "F", construction: E.Point.free, params: [0, 100] },
            { name: "C", construction: E.Point.similar, params: ["A", "B", "D", "E", "F"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let C = slate.lookupElement("C") as SimilarElement;
        almostEqual(C.x, 50, 0.01);
        almostEqual(C.y, 300, 0.01);
        let A = slate.lookupElement("A") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        almostEqual(A.distance(C) / A.distance(B), 1.0, 0.001);
    });

    it("should compute a similar point with factor=0.5 (non-isosceles right triangle)", () => {
        let data: IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [50, 200] },
            { name: "B", construction: E.Point.free, params: [150, 200] },
            { name: "D", construction: E.Point.free, params: [0, 0] },
            { name: "E", construction: E.Point.free, params: [200, 0] },
            { name: "F", construction: E.Point.free, params: [0, 100] },
            { name: "C", construction: E.Point.similar, params: ["A", "B", "D", "E", "F"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let C = slate.lookupElement("C") as SimilarElement;
        almostEqual(C.x, 50, 0.01);
        almostEqual(C.y, 250, 0.01);
        let A = slate.lookupElement("A") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        almostEqual(A.distance(C) / A.distance(B), 0.5, 0.001);
    });

    it("should compute the angle bisector point", () => {
        let data: IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [0, 100] },
            { name: "B", construction: E.Point.free, params: [0, 0] },
            { name: "C", construction: E.Point.free, params: [100, 0] },
            { name: "D", construction: E.Point.angleBisector, params: ["A", "B", "C"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let D = slate.lookupElement("D") as PointElement;
        almostEqual(D.x, 50, 0.01);
        almostEqual(D.y, 50, 0.01);
    });

    // point;intersection (plane-line) — PlaneIntersection
    // Plane z=0, line (50,50,100)→(50,50,-100) → intersects at (50,50,0)
    it("should compute plane-line intersection", () => {
        let data: IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "P", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [50, 50, 100] },
            { name: "B", construction: E.Point.fixed, params: [50, 50, -100] },
            { name: "X", construction: E.Point.intersection, params: ["P", "A", "B"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let X = slate.lookupElement("X") as PointElement;
        almostEqual(X.x, 50, 0.1);
        almostEqual(X.y, 50, 0.1);
        almostEqual(X.z, 0, 0.1);
    });

    // 3D signature variants
    it("should compute a similar point with explicit planes (3D variant)", () => {
        let data: IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [50, 200, 0] },
            { name: "B", construction: E.Point.fixed, params: [150, 200, 0] },
            { name: "D", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "Ep", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "F", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "C", construction: E.Point.similar, params: ["A", "B", "plane", "D", "Ep", "F", "plane"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let C = slate.lookupElement("C") as PointElement;
        assert.ok(!isNaN(C.x));
        assert.ok(!isNaN(C.y));
    });

    it("should compute angle bisector with explicit plane (3D variant)", () => {
        let data: IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "B", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "D", construction: E.Point.angleBisector, params: ["A", "B", "C", "plane"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let D = slate.lookupElement("D") as PointElement;
        almostEqual(D.x, 50, 0.1);
        almostEqual(D.y, 50, 0.1);
    });

    it("should compute angle divider with explicit plane (3D variant)", () => {
        let data: IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "B", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "D", construction: E.Point.angleDivider, params: ["A", "B", "C", "plane", 3] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let D = slate.lookupElement("D") as PointElement;
        assert.ok(!isNaN(D.x));
        assert.ok(!isNaN(D.y));
    });

    // point;perpendicular has five signatures. Variant 5 (3 pts + plane) is
    // exercised by the drag scene (scene3d's "Pperp"); these cover the rest.
    it("E.Point.perpendicular with 4 points (no plane) should construct variant 3", () => {
        let slate = new Slate(createCanvas(300, 300));
        toElements(slate, [
            { name: "A", construction: E.Point.free, params: [10, 10] },
            { name: "B", construction: E.Point.free, params: [50, 10] },
            { name: "C", construction: E.Point.free, params: [30, 30] },
            { name: "D", construction: E.Point.free, params: [40, 40] },
        ]);
        let g = slate.createElement(
            E.Point.perpendicular, ["A","B","C","D"], "FP3");
        assert.ok(g instanceof PointElement);
    });

    it("E.Point.perpendicular with 4 points + plane should construct variant 4", () => {
        let slate = new Slate(createCanvas(300, 300));
        toElements(slate, [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [10, 10, 0] },
            { name: "B", construction: E.Point.fixed, params: [50, 10, 0] },
            { name: "C", construction: E.Point.fixed, params: [30, 30, 0] },
            { name: "D", construction: E.Point.fixed, params: [40, 40, 0] },
        ]);
        let g = slate.createElement(
            E.Point.perpendicular, ["A","B","plane","C","D"], "FP4");
        assert.ok(g instanceof PointElement);
    });
});
