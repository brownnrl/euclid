import "mocha";
import * as assert from "assert";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {PlaneSlider} from "../src/elements/point/PlaneSlider";
import {Intersection} from "../src/elements/point/Intersection";
import {PointElement} from "../src/elements/point/PointElement";
import {CircleSlider} from "../src/elements/point/CircleSlider";
import {PlaneElement} from "../src/elements/plane/PlaneElement";
import {LineElement} from "../src/elements/line/LineElement";
import {CircumcircleElement} from "../src/elements/circle/CircumcircleElement";
import {SphereElement} from "../src/elements/sphere/SphereElement";
import {ArcElement} from "../src/elements/sector/ArcElement";
import {Chord} from "../src/elements/line/Chord";
import {PolygonElement} from "../src/elements/polygon/PolygonElement";
import {ApplicationElement} from "../src/elements/polygon/ApplicationElement";
import {SimilarElement} from "../src/elements/point/SimilarElement";
import {CircleElement} from "../src/elements/circle/CircleElement";
import {createCanvas} from "canvas";
import {create} from "domain";

let almostEqual = function (actual : number, expected : number, precision: number) {
    return assert.equal(Math.abs(actual-expected) < precision, true, 
                        "expected: " + expected + " actual: " + actual + " tolerance: " + precision);
}

describe("slate", ()=> {

    function toElements(slate : Slate, data : IConstructionInfo[]) {
        return data.map(
            cld => slate.createElement(cld.construction, cld.params, cld.name)
        );
    }

    it("should create a free point as a PlaneSlider", () => {
        let slate : Slate = new Slate(createCanvas(200,200));
        let e = slate.createElement(E.Point.free, [100,100], "A");
        assert.ok(e == slate.elements[slate.elements.length-1])
        assert.ok(e instanceof PlaneSlider);
        let ps : PlaneSlider = e as PlaneSlider;
        assert.ok(e.name == "A");
        assert.ok(ps.distance(new PointElement({x:100,y:100})) <= 0.001);
    });
    
    let connected_line_data : IConstructionInfo[] = [
        { construction: E.Point.free,   name: "A",  params: [10,100]},
        { construction: E.Point.free,   name: "B",  params: [100,100]},
        { construction: E.Line.connect, name: "AB", params: ["A","B"]},
    ];

    it("should create a connection as a LineElement", () => {
        let slate : Slate = new Slate(createCanvas(200,200));
        let elms = toElements(slate, connected_line_data);
        let p1 = elms[0] as PointElement;
        let p2 = elms[1] as PointElement;
        let l1 = elms[2] as LineElement;
        assert.ok(p1 == l1.A);
        assert.ok(p2 == l1.B);
    });
    
    // Book XI, Def 24
    let perpendicular_plane_data : IConstructionInfo[] = [
        { construction: E.Point.free,   name: "origin",  params: [70,220]},
        { construction: E.Point.fixed,  name: "z",  params: [70,80,100]},
        { construction: E.Plane.perpendicular, name: "xyplane", params: ["origin","z"]},
    ];
    
    it("should create a perpendicular plane", () => {
        let slate : Slate = new Slate(createCanvas(200,200));
        let elms = toElements(slate, perpendicular_plane_data);
        let p1 = elms[0] as PlaneElement;
        p1.update();
    });

    // Book I, Def I11
    let circle_slider_midpoint_data : IConstructionInfo[] = [
        /*<param name=e[1] value="A;point;free;40,110">
        <param name=e[2] value="C;point;free;210,110">
        <param name=e[3] value="AC;line;connect;A,C">
        <param name=e[4] value="B;point;lineSlider;AC,100,110">
        <param name=e[5] value="E;point;midpoint;B,C;0;0">
        <param name=e[6] value="circ;circle;radius;E,C;0;0;0;0">
        <param name=e[7] value="D;point;circleSlider;circ,140,40">*/
        { construction: E.Point.free, name: "A", params: [40, 110]},
        { construction: E.Point.free, name: "C", params: [210, 110]},
        { construction: E.Line.connect, name: "AC", params: ["A", "C"]},
        { construction: E.Point.lineSlider, name: "B", params: ["AC", 100, 110]},
        { construction: E.Point.midpoint, name: "E", params: ["B", "C"]},
        { construction: E.Circle.radius, name: "circ", params: ["E", "C"]},
        { construction: E.Point.circleSlider, name: "D", params: ["circ", 140, 40]}
    ];

    it("should create a circle, circle slider, and midpoint", () => {
        let slate : Slate = new Slate(createCanvas(200, 200));
        let elms = toElements(slate, circle_slider_midpoint_data);
        slate.elements.forEach(e => e.update());
        let p7 = elms[6] as CircleSlider;
        almostEqual(p7.x, 143, 1);
        almostEqual(p7.y, 56, 1);
    });

    // Book I, Def I2
    let intersection_data : IConstructionInfo[] = [
        /* 
        <param name=e[1] value="A;point;free;40,170;0">
        <param name=e[2] value="B;point;free;110,100;0">
        <param name=e[3] value="C;point;free;190,100;0">
        <param name=e[4] value="D;point;free;280,50;0">
        <param name=e[5] value="BC;line;connect;B,C">
        <param name=e[6] value="E';point;perpendicular;B,C;0;0">
        <param name=e[7] value="M;point;midpoint;A,B;0;0">
        <param name=e[8] value="E'';point;perpendicular;M,B;0;0">
        <param name=e[9] value="E;point;intersection;B,E',M,E'';0;0"> */
        { construction: E.Point.free, name: "A", params: [40, 70]},
        { construction: E.Point.free, name: "B", params: [110, 100]},
        { construction: E.Point.free, name: "C", params: [190,100]},
        { construction: E.Point.free, name: "D", params: [280,50]},
        { construction: E.Line.connect, name: "BC", params: ["B", "C"]},
        { construction: E.Point.perpendicular, name: "E'", params: ["B", "C"]},
        { construction: E.Point.midpoint, name: "M", params: ["A", "B"]},
        { construction: E.Point.perpendicular, name: "E''", params: ["M", "B"]},
        { construction: E.Point.intersection, name: "E", params: ["B", "E'", "M", "E''"]},
    ]

    it("should create an intersection element", () => {
        let slate : Slate = new Slate(createCanvas(200, 200));
        let elms = toElements(slate, intersection_data);
        slate.elements.forEach(e => e.update());
        let p8 = elms[8] as Intersection;
        almostEqual(p8.x, 110, 1);
        almostEqual(p8.y, 3, 1);
    });


    let circle_center_circumcircle_data : IConstructionInfo[] = [
    /*
    <img src=propIII10.gif alt="java applet or image">
    <param name=background value="35,19,100">
    <param name=title value="III.10">
    <param name=e[1] value="B;point;free;150,40">
    <param name=e[2] value="F;point;free;150,260">
    <param name=e[3] value="H;point;free;40,180">
    <param name=e[4] value="ABC;circle;circumcircle;B,F,H;0;0;black;random">
    <param name=e[5] value="P;point;center;ABC;black;green">
    */
        { construction: E.Point.free, name: "B", params: [150, 40]},
        { construction: E.Point.free, name: "F", params: [110, 100]},
        { construction: E.Point.free, name: "H", params: [190,100]},
        { construction: E.Circle.circumcircle, name: "ABC", params: ["B","F","H"]},
        { construction: E.Point.center, name: "P", params: ["ABC"]},
    ]

    it("should create a circumcircle and center elements", () => {
        let slate : Slate = new Slate(createCanvas(200, 200));
        let elms = toElements(slate, circle_center_circumcircle_data);
        slate.elements.forEach(e => e.update());
        let p3 = elms[3] as CircumcircleElement;
        let p4 = elms[4] as PointElement;
        assert.equal(p3.Center, p4);
        almostEqual(p4.x, 150, 1);
        almostEqual(p4.y, 83, 1);
    });


    let circumcenter_data : IConstructionInfo[] = [
    /*
        <img src=propIII25a.gif alt="java applet or image">
        <param name=background value="35,19,100">
        <param name=title value="III.25a">
        <param name=e[1] value="A;point;free;60,30">
        <param name=e[2] value="C;point;free;60,200">
        <param name=e[3] value="AC;line;connect;A,C">
        <param name=e[4] value="D;point;midpoint;AC">
        <param name=e[5] value="DB;line;perpendicular;D,A;0;0;0">
        <param name=e[6] value="B;point;lineSlider;DB,30,115">
        <param name=e[7] value="E;point;circumcenter;A,B,C;black;green">
    */
        { construction: E.Point.free, name: "A", params: [60, 30]},
        { construction: E.Point.free, name: "C", params: [60, 200]},
        { construction: E.Line.connect, name: "AC", params: ["A", "C"]},
        { construction: E.Point.midpoint, name: "D", params: ["AC"]},
        { construction: E.Line.perpendicular, name: "DB", params: ["D", "A"]},
        { construction: E.Point.lineSlider, name: "B", params: ["DB", 30, 115]},
        { construction: E.Point.circumcenter, name: "E", params: ["A", "B", "C"]},
    ]

    it("should create a circumcenter and line perpendiular element", () => {
        let slate : Slate = new Slate(createCanvas(200, 200));
        let elms = toElements(slate, circumcenter_data);
        slate.elements.forEach(e => e.update());
        // circumcenter pushes two elements on the update list
        // the circumcircle as one, and the circumcenter as the other
        let elmsUpdate = slate.elementsForUpdate;
        let n = elmsUpdate.length;
        let pcircle = elmsUpdate[n-2] as CircumcircleElement;
        let pcenter = elmsUpdate[n-1] as PointElement;
        assert.equal(pcircle.Center, pcenter);
        almostEqual(pcenter.x, 165, 1);
        almostEqual(pcenter.y, 115, 1);
    });

    let sphere_data : IConstructionInfo[] = [
    /*
        <img src="propXII17.gif" alt="java applet or image">
        <param name=background value="35,19,100">
        <param name=title value="XII.17">
        <param name=fontsize value=14>
        <param name=e[1] value="zen;point;fixed;250,-10000,5000;0;0">
        <param name=e[2] value="A;point;free;250,250">
        <param name=e[3] value="eqplane;plane;perpendicular;A,zen;0;0;0;0">
        <param name=e[4] value="B;point;planeSlider;eqplane,450,360,60">
        <param name=e[5] value="Bsphere;sphere;radius;A,B;0;0;black;random">
    */
        { construction: E.Point.free, name: "A", params: [60, 30]},
        { construction: E.Point.free, name: "B", params: [60, 200]},
        { construction: E.Sphere.radius, name: "Asphere", params: ["A", "B"]},
    ]

    it("should create a sphere", () => {
        let slate : Slate = new Slate(createCanvas(200, 200));
        let elms = toElements(slate, sphere_data);
        slate.elements.forEach(e => e.update());
        let elmsUpdate = slate.elementsForUpdate;
        let pcenter = elmsUpdate[2] as SphereElement;
        /*assert.equal(pcircle.Center, pcenter);
        almostEqual(pcenter.x, 165, 1);
        almostEqual(pcenter.y, 115, 1);*/
    });
    
    it("should facilitate updates", () => {
        let slate : Slate = new Slate(createCanvas(200,200));
        let elms = toElements(slate, connected_line_data);
        slate.elements.forEach(e => e.update());
    });

    it("should translate coordinates", () => {
        let slate : Slate = new Slate(createCanvas(200,200));
        slate.inTest = true;
        let elms = toElements(slate, connected_line_data);
        slate.translateCoordinates(1,0);
        let A = slate.lookupElement("A") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        let AB = slate.lookupElement("AB") as LineElement;
        assert.equal(A.x, 11);
        assert.equal(A.y, 100);
        assert.equal(B.x, 101);
        assert.equal(B.y, 100);
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

    it("should produce an equilateral triangle", () => {
        const data: IConstructionInfo[] = [
            { name: "A",   construction: E.Point.free,               params: [40, 170] },
            { name: "B",   construction: E.Point.free,               params: [200, 170] },
            { name: "ABC", construction: E.Polygon.equilateralTriangle, params: ["A", "B"] },
            { name: "C",   construction: E.Point.vertex,             params: ["ABC", 3] },
        ];
        const slate = new Slate(createCanvas(400, 300));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        const A = slate.lookupElement("A") as PointElement;
        const B = slate.lookupElement("B") as PointElement;
        const C = slate.lookupElement("C") as PointElement;
        // All three sides must be equal length (equilateral)
        const ab = Math.hypot(B.x - A.x, B.y - A.y);
        const ac = Math.hypot(C.x - A.x, C.y - A.y);
        const bc = Math.hypot(C.x - B.x, C.y - B.y);
        almostEqual(ac, ab, 1);
        almostEqual(bc, ab, 1);
        // Apex should be above the base (smaller y in screen coordinates)
        assert.ok(C.y < A.y);
    });

    // Book III, Prop 2 — arc through three points
    // <param name=e[1] value="A;point;free;50,130">
    // <param name=e[2] value="B;point;free;120,200">
    // <param name=e[6] value="E;point;free;70,210">
    // <param name=e[7] value="AEB;sector;arc;A,E,B">
    //
    // The arc's internal _Center should be the circumcenter of A, E, B.
    // Hand-computed:
    //   u=-14800, v=-2700, den=-4200
    //   cx = -364000 / -4200 ≈ 86.667
    //   cy = -686000 / -4200 ≈ 163.333
    //   r  = |Center-A| = sqrt(1344.5 + 1111.1) ≈ 49.554
    let arc_propIII2_data : IConstructionInfo[] = [
        { name: "A",   construction: E.Point.free,  params: [50, 130] },
        { name: "E",   construction: E.Point.free,  params: [70, 210] },
        { name: "B",   construction: E.Point.free,  params: [120, 200] },
        { name: "AEB", construction: E.Sector.arc, params: ["A", "E", "B"] },
    ];

    it("should compute the circumcenter of an arc through three points", () => {
        let slate = new Slate(createCanvas(260, 260));
        toElements(slate, arc_propIII2_data);
        slate.elements.forEach(e => e.update());
        let arc = slate.lookupElement("AEB") as ArcElement;
        almostEqual(arc._Center.x, 86.667, 0.01);
        almostEqual(arc._Center.y, 163.333, 0.01);
        // All three given points should be equidistant from the center
        let rA = arc._Center.distance(arc._A);
        let rM = arc._Center.distance(arc._M);
        let rB = arc._Center.distance(arc._B);
        almostEqual(rA, 49.554, 0.01);
        almostEqual(rM, 49.554, 0.01);
        almostEqual(rB, 49.554, 0.01);
    });

    it("should translate only the arc center, leaving A, M, B untouched", () => {
        let slate = new Slate(createCanvas(260, 260));
        toElements(slate, arc_propIII2_data);
        slate.elements.forEach(e => e.update());
        let arc = slate.lookupElement("AEB") as ArcElement;
        let cx0 = arc._Center.x;
        let cy0 = arc._Center.y;
        arc.translate(5, 7);
        almostEqual(arc._Center.x, cx0 + 5, 0.001);
        almostEqual(arc._Center.y, cy0 + 7, 0.001);
        // A, M, B are independent slate elements; arc.translate() must not touch them
        let A = slate.lookupElement("A") as PointElement;
        let M = slate.lookupElement("E") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        almostEqual(A.x, 50,  0.001); almostEqual(A.y, 130, 0.001);
        almostEqual(M.x, 70,  0.001); almostEqual(M.y, 210, 0.001);
        almostEqual(B.x, 120, 0.001); almostEqual(B.y, 200, 0.001);
    });

    it("should rotate only the arc center around a pivot", () => {
        let slate = new Slate(createCanvas(260, 260));
        toElements(slate, arc_propIII2_data);
        slate.elements.forEach(e => e.update());
        let arc = slate.lookupElement("AEB") as ArcElement;
        let A = slate.lookupElement("A") as PointElement;
        // 90° CCW rotation around A=(50,130): ac=cos(90°)=0, as=sin(90°)=1
        // dx=36.667, dy=33.333
        // new x = 50 + 0*36.667 - 1*33.333 = 16.667
        // new y = 130 + 1*36.667 + 0*33.333 = 166.667
        arc.rotate(A, 0, 1);
        almostEqual(arc._Center.x, 16.667, 0.01);
        almostEqual(arc._Center.y, 166.667, 0.01);
        // A, M, B untouched
        let M = slate.lookupElement("E") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        almostEqual(A.x, 50,  0.001); almostEqual(A.y, 130, 0.001);
        almostEqual(M.x, 70,  0.001); almostEqual(M.y, 210, 0.001);
        almostEqual(B.x, 120, 0.001); almostEqual(B.y, 200, 0.001);
    });

    // Book I, Prop 12 — chord of circle cut by a line
    // <param name=e[1]  value="A;point;free;30,180">
    // <param name=e[2]  value="B;point;free;290,180">
    // <param name=e[3]  value="AB;line;connect;A,B">
    // <param name=e[4]  value="C;point;free;160,130">
    // <param name=e[5]  value="D;point;free;180,220">
    // <param name=e[6]  value="EFG;circle;radius;C,D">
    // <param name=e[7]  value="EG;line;chord;AB,EFG">
    //
    // Hand-computed expectations (see doc/journal.md entry for line;chord):
    //   radius² = 20² + 90² = 8500
    //   foot of ⊥ from C=(160,130) to line y=180 is (160,180)
    //   d² = 50² = 2500
    //   s  = √(8500-2500) = √6000 ≈ 77.460
    //   factor = s / D.distance(foot) = 77.460 / 130 ≈ 0.59585
    //   chord.A = (D-foot)*factor + foot = (82.540, 180)
    //   chord.B = 2*foot - chord.A         = (237.460, 180)
    let chord_propI12_data : IConstructionInfo[] = [
        { name: "A",   construction: E.Point.free,     params: [30, 180] },
        { name: "B",   construction: E.Point.free,     params: [290, 180] },
        { name: "AB",  construction: E.Line.connect,   params: ["A", "B"] },
        { name: "C",   construction: E.Point.free,     params: [160, 130] },
        { name: "D",   construction: E.Point.free,     params: [180, 220] },
        { name: "EFG", construction: E.Circle.radius,  params: ["C", "D"] },
        { name: "EG",  construction: E.Line.chord,     params: ["AB", "EFG"] },
    ];

    it("should compute the chord of a circle cut by a line", () => {
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, chord_propI12_data);
        slate.elements.forEach(e => e.update());
        let chord = slate.lookupElement("EG") as Chord;
        almostEqual(chord.A.x,  82.540, 0.01);
        almostEqual(chord.A.y, 180.000, 0.01);
        almostEqual(chord.B.x, 237.460, 0.01);
        almostEqual(chord.B.y, 180.000, 0.01);
        // Both endpoints must lie on the circle
        let center = slate.lookupElement("C") as PointElement;
        let r = Math.sqrt(8500);
        almostEqual(chord.A.distance(center), r, 0.001);
        almostEqual(chord.B.distance(center), r, 0.001);
    });

    it("should NaN the chord when the line misses the circle entirely", () => {
        // Shift C far above the line so the circle can't reach it.
        let miss_data : IConstructionInfo[] = [
            { name: "A",   construction: E.Point.free,    params: [30, 180] },
            { name: "B",   construction: E.Point.free,    params: [290, 180] },
            { name: "AB",  construction: E.Line.connect,  params: ["A", "B"] },
            { name: "C",   construction: E.Point.free,    params: [160, 10] },  // far above y=180
            { name: "D",   construction: E.Point.free,    params: [165, 20] },  // tiny circle
            { name: "EFG", construction: E.Circle.radius, params: ["C", "D"] },
            { name: "EG",  construction: E.Line.chord,    params: ["AB", "EFG"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, miss_data);
        slate.elements.forEach(e => e.update());
        let chord = slate.lookupElement("EG") as Chord;
        assert.ok(isNaN(chord.A.x) && isNaN(chord.A.y));
        assert.ok(isNaN(chord.B.x) && isNaN(chord.B.y));
    });

    it("should translate only the chord endpoints, leaving inputs untouched", () => {
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, chord_propI12_data);
        slate.elements.forEach(e => e.update());
        let chord = slate.lookupElement("EG") as Chord;
        let ax0 = chord.A.x, ay0 = chord.A.y;
        let bx0 = chord.B.x, by0 = chord.B.y;
        chord.translate(5, 7);
        almostEqual(chord.A.x, ax0 + 5, 0.001);
        almostEqual(chord.A.y, ay0 + 7, 0.001);
        almostEqual(chord.B.x, bx0 + 5, 0.001);
        almostEqual(chord.B.y, by0 + 7, 0.001);
        // Input free points must be untouched
        let A = slate.lookupElement("A") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        let C = slate.lookupElement("C") as PointElement;
        let D = slate.lookupElement("D") as PointElement;
        almostEqual(A.x,  30, 0.001); almostEqual(A.y, 180, 0.001);
        almostEqual(B.x, 290, 0.001); almostEqual(B.y, 180, 0.001);
        almostEqual(C.x, 160, 0.001); almostEqual(C.y, 130, 0.001);
        almostEqual(D.x, 180, 0.001); almostEqual(D.y, 220, 0.001);
    });

    it("should rotate only the chord endpoints around a pivot", () => {
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, chord_propI12_data);
        slate.elements.forEach(e => e.update());
        let chord = slate.lookupElement("EG") as Chord;
        let A = slate.lookupElement("A") as PointElement;
        // 90° CCW rotation around A=(30,180): ac=cos(90°)=0, as=sin(90°)=1
        // chord.A (82.540, 180) → dx=52.540, dy=0
        //   new x = 30 + 0*52.540 - 1*0        = 30
        //   new y = 180 + 1*52.540 + 0*0       = 232.540
        // chord.B (237.460, 180) → dx=207.460, dy=0
        //   new x = 30 + 0*207.460 - 1*0       = 30
        //   new y = 180 + 1*207.460 + 0*0      = 387.460
        chord.rotate(A, 0, 1);
        almostEqual(chord.A.x,  30.000, 0.01);
        almostEqual(chord.A.y, 232.540, 0.01);
        almostEqual(chord.B.x,  30.000, 0.01);
        almostEqual(chord.B.y, 387.460, 0.01);
        // Input free points untouched (A is the pivot; B, C, D must not move)
        let B = slate.lookupElement("B") as PointElement;
        let C = slate.lookupElement("C") as PointElement;
        let D = slate.lookupElement("D") as PointElement;
        almostEqual(A.x,  30, 0.001); almostEqual(A.y, 180, 0.001);
        almostEqual(B.x, 290, 0.001); almostEqual(B.y, 180, 0.001);
        almostEqual(C.x, 160, 0.001); almostEqual(C.y, 130, 0.001);
        almostEqual(D.x, 180, 0.001); almostEqual(D.y, 220, 0.001);
    });

    // line;parallel — line through A parallel and equal to BC
    // Slate.java case 9: Layoff(A, B, C, B, C) → D = A + (C-B), then LineElement(A, D)
    //
    // Test fixture: A=(50,100), B=(100,100), C=(200,200)
    //   direction BC = (100, 100)
    //   D = A + (C-B) = (50,100) + (100,100) = (150, 200)
    //   resulting line: (50,100) → (150,200), parallel to BC, same length
    let parallel_data : IConstructionInfo[] = [
        { name: "A",  construction: E.Point.free,     params: [50, 100] },
        { name: "B",  construction: E.Point.free,     params: [100, 100] },
        { name: "C",  construction: E.Point.free,     params: [200, 200] },
        { name: "AD", construction: E.Line.parallel,  params: ["A", "B", "C"] },
    ];

    // polygon;parallelogram — parallelogram CABD given 3 vertices C, A, B
    // Slate.java case 6: Layoff(C, A, B, A, B) → D = C + (B-A), then
    // PolygonElement([C, A, B, D])
    //
    // propI34: C=(50,175), A=(90,50), B=(250,50)
    //   D = C + (B-A) = (50+160, 175+0) = (210, 175)
    //   polygon vertices: [(50,175), (90,50), (250,50), (210,175)]
    let pgram_propI34_data : IConstructionInfo[] = [
        { name: "A",    construction: E.Point.free,              params: [90, 50] },
        { name: "B",    construction: E.Point.free,              params: [250, 50] },
        { name: "C",    construction: E.Point.free,              params: [50, 175] },
        { name: "CABD", construction: E.Polygon.parallelogram,   params: ["C", "A", "B"] },
        { name: "D",    construction: E.Point.vertex,            params: ["CABD", 4] },
    ];

    it("should compute a parallelogram with the 4th vertex via Layoff", () => {
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, pgram_propI34_data);
        slate.elements.forEach(e => e.update());
        let poly = slate.lookupElement("CABD") as PolygonElement;
        // 4 vertices
        assert.equal(poly.V.length, 4);
        // V[0]=C, V[1]=A, V[2]=B, V[3]=D
        almostEqual(poly.V[0].x,  50, 0.01); almostEqual(poly.V[0].y, 175, 0.01);
        almostEqual(poly.V[1].x,  90, 0.01); almostEqual(poly.V[1].y,  50, 0.01);
        almostEqual(poly.V[2].x, 250, 0.01); almostEqual(poly.V[2].y,  50, 0.01);
        almostEqual(poly.V[3].x, 210, 0.01); almostEqual(poly.V[3].y, 175, 0.01);
        // Opposite sides should be equal length (parallelogram property)
        let CA = poly.V[0].distance(poly.V[1]);
        let BD = poly.V[2].distance(poly.V[3]);
        almostEqual(CA, BD, 0.001);
        let AB = poly.V[1].distance(poly.V[2]);
        let CD = poly.V[0].distance(poly.V[3]);
        almostEqual(AB, CD, 0.001);
    });

    it("should extract the 4th vertex via point;vertex", () => {
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, pgram_propI34_data);
        slate.elements.forEach(e => e.update());
        let D = slate.lookupElement("D") as PointElement;
        almostEqual(D.x, 210, 0.01);
        almostEqual(D.y, 175, 0.01);
    });

    // point;similar — point C such that △ABC ∼ △DEF
    // Similar.java: this.toSimilar(A, B, screen, D, E, F, screen)
    //
    // Test 1: isosceles right triangle DEF, factor=1
    //   D=(0,0), E=(100,0), F=(0,100) → θ = π/2, factor = 100/100 = 1
    //   A=(50,200), B=(150,200)
    //   C = rotate B around A by π/2 then scale by 1 → (50, 300)
    //
    // Test 2: non-isosceles right triangle, factor=0.5
    //   D=(0,0), E=(200,0), F=(0,100) → θ = π/2, factor = 100/200 = 0.5
    //   A=(50,200), B=(150,200)
    //   C = rotate B around A by π/2 then scale by 0.5 → (50, 250)

    // point;proportion — point V' on V0V1 so that |S|:|T| = |U|:|V'|
    // S=(0,0)→(100,0) len=100; T=(0,0)→(50,0) len=50;
    // U=(0,0)→(80,0) len=80;  V=(0,0)→(200,0) len=200
    // factor = sqrt(50²*80² / (100²*200²)) = 4000/20000 = 0.2
    // result = (0,0) + 0.2 * (200,0) = (40, 0)
    // Check: S:T = 100:50 = 2:1; U:V' = 80:40 = 2:1 ✓
    // polygon;application — parallelogram with area = input polygon's area
    // Input triangle P: (0,0),(100,0),(0,80) → area = 100*80/2 = 4000
    // Side AB: A=(50,200), B=(150,200) → |AB| = 100
    // Direction C: (50,100) → angle CAB points upward
    // area(A,B,C) = area of triangle (50,200),(150,200),(50,100) = 100*100/2 = 5000
    // factor = |P.area()| / (2 * |area(A,B,C)|) = 4000 / (2*5000) = 0.4
    // V[3] = A + 0.4*(C-A) = (50,200) + 0.4*(0,-100) = (50, 160)
    // V[2] = B + V[3] - A = (150,200) + (50,160) - (50,200) = (150, 160)
    it("should create a parallelogram with the same area as the input polygon", () => {
        let data : IConstructionInfo[] = [
            { name: "P1", construction: E.Point.free, params: [0, 0] },
            { name: "P2", construction: E.Point.free, params: [100, 0] },
            { name: "P3", construction: E.Point.free, params: [0, 80] },
            { name: "P",  construction: E.Polygon.triangle, params: ["P1", "P2", "P3"] },
            { name: "A",  construction: E.Point.free, params: [50, 200] },
            { name: "B",  construction: E.Point.free, params: [150, 200] },
            { name: "C",  construction: E.Point.free, params: [50, 100] },
            { name: "ABEF", construction: E.Polygon.application, params: ["P", "A", "B", "C"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let app = slate.lookupElement("ABEF") as ApplicationElement;
        assert.equal(app.V.length, 4);
        // V[0]=A, V[1]=B
        almostEqual(app.V[0].x,  50, 0.01); almostEqual(app.V[0].y, 200, 0.01);
        almostEqual(app.V[1].x, 150, 0.01); almostEqual(app.V[1].y, 200, 0.01);
        // V[3] = A + factor*(C-A) = (50, 160)
        almostEqual(app.V[3].x,  50, 0.01); almostEqual(app.V[3].y, 160, 0.01);
        // V[2] = B + V[3] - A = (150, 160)
        almostEqual(app.V[2].x, 150, 0.01); almostEqual(app.V[2].y, 160, 0.01);
        // The resulting parallelogram area should equal the input triangle area (4000)
        almostEqual(app.area(), 4000, 1);
    });

    // point;meanProportional — point U' on U0U1 so that S:U' = U':T (geometric mean)
    // S=(0,0)→(100,0) len=100; T=(0,0)→(25,0) len=25; U=(0,0)→(200,0) len=200
    // |U'| = sqrt(|S|*|T|) = sqrt(100*25) = 50
    // factor = 50/200 = 0.25; result = (0,0) + 0.25*(200,0) = (50, 0)
    // Check: S:U' = 100:50 = 2:1; U':T = 50:25 = 2:1 ✓
    it("should compute a mean proportional point (geometric mean)", () => {
        let data : IConstructionInfo[] = [
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
        // Verify the proportion: S:U' should equal U':T
        let S = Math.sqrt(100*100);  // 100
        let T = Math.sqrt(25*25);    // 25
        let Up = P.distance(slate.lookupElement("U0") as PointElement); // 50
        almostEqual(S / Up, Up / T, 0.001);
    });

    it("should compute a fourth proportional point", () => {
        let data : IConstructionInfo[] = [
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

    // polygon;similar — triangle ABH where H is the similar point so △ABH ∼ △DEF
    // propI23: A=(40,180), G=(cutoff result), C=(190,80), E=(270,180), D=(260,40)
    // Simpler standalone: A=(50,200), B=(150,200), D=(0,0), E=(100,0), F=(0,100)
    //   → H = (50,300) (same as point;similar test with factor=1)
    //   → polygon vertices = [A, B, H] = [(50,200), (150,200), (50,300)]
    it("should create a similar triangle polygon", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [50, 200] },
            { name: "B", construction: E.Point.free, params: [150, 200] },
            { name: "D", construction: E.Point.free, params: [0, 0] },
            { name: "E", construction: E.Point.free, params: [100, 0] },
            { name: "F", construction: E.Point.free, params: [0, 100] },
            { name: "ABH", construction: E.Polygon.similar, params: ["A", "B", "D", "E", "F"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let poly = slate.lookupElement("ABH") as PolygonElement;
        assert.equal(poly.V.length, 3);
        almostEqual(poly.V[0].x,  50, 0.01); almostEqual(poly.V[0].y, 200, 0.01);
        almostEqual(poly.V[1].x, 150, 0.01); almostEqual(poly.V[1].y, 200, 0.01);
        almostEqual(poly.V[2].x,  50, 0.01); almostEqual(poly.V[2].y, 300, 0.01);
    });

    // line;similar — line AH where H is the similar point
    it("should create a similar line", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [50, 200] },
            { name: "B", construction: E.Point.free, params: [150, 200] },
            { name: "D", construction: E.Point.free, params: [0, 0] },
            { name: "E", construction: E.Point.free, params: [100, 0] },
            { name: "F", construction: E.Point.free, params: [0, 100] },
            { name: "AH", construction: E.Line.similar, params: ["A", "B", "D", "E", "F"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let line = slate.lookupElement("AH") as LineElement;
        // Line starts at A
        almostEqual(line.A.x,  50, 0.01); almostEqual(line.A.y, 200, 0.01);
        // Line ends at H = similar point = (50, 300)
        almostEqual(line.B.x,  50, 0.01); almostEqual(line.B.y, 300, 0.01);
    });

    // circle;radius 3-point — circle at Center with radius = |A-B| (not |Center-B|)
    // propIII26: center H=(340,115), radius-points G=(120,115), A=(75,30)
    //   radius = |GA| = sqrt(45^2 + 85^2) = sqrt(2025+7225) = sqrt(9250) ≈ 96.177
    it("should create a circle with center H and radius |GA| (3-point form)", () => {
        let data : IConstructionInfo[] = [
            { name: "G",   construction: E.Point.free,    params: [120, 115] },
            { name: "A",   construction: E.Point.free,    params: [75, 30] },
            { name: "H",   construction: E.Point.free,    params: [340, 115] },
            { name: "DEF", construction: E.Circle.radius, params: ["H", "G", "A"] },
        ];
        let slate = new Slate(createCanvas(500, 300));
        toElements(slate, data);
        let circle = slate.lookupElement("DEF") as CircleElement;
        // Center should be H
        almostEqual(circle.Center.x, 340, 0.01);
        almostEqual(circle.Center.y, 115, 0.01);
        // Radius should be |GA|, not |H-anything|
        let expectedRadius = Math.sqrt(45*45 + 85*85); // sqrt(9250) ≈ 96.177
        almostEqual(circle.radius, expectedRadius, 0.01);
        // A should NOT be Center (that would be the 2-point form)
        assert.notEqual(circle.A, circle.Center);
    });

    // line;foot (2D) — line from A to the foot of the perpendicular from A to line BC
    // A=(100,50), B=(50,200), C=(250,200) — BC is horizontal at y=200
    // Foot of perp from A to BC = (100, 200)
    // Line goes from A=(100,50) to foot=(100,200)
    it("should compute a line from A to the foot of the perpendicular on BC", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [100, 50] },
            { name: "B", construction: E.Point.free, params: [50, 200] },
            { name: "C", construction: E.Point.free, params: [250, 200] },
            { name: "AL", construction: E.Line.foot, params: ["A", "B", "C"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let line = slate.lookupElement("AL") as LineElement;
        // Line starts at A
        almostEqual(line.A.x, 100, 0.01);
        almostEqual(line.A.y,  50, 0.01);
        // Line ends at foot = (100, 200)
        almostEqual(line.B.x, 100, 0.01);
        almostEqual(line.B.y, 200, 0.01);
        // Line should be perpendicular to BC (dot product of directions = 0)
        let dx_line = line.B.x - line.A.x;  // 0
        let dy_line = line.B.y - line.A.y;  // 150
        let dx_bc = 250 - 50;               // 200
        let dy_bc = 0;                       // 0
        almostEqual(dx_line * dx_bc + dy_line * dy_bc, 0, 0.01);
    });

    // polygon;square — RegularPolygonElement with n=4
    // propI46: A=(50,190), B=(170,190), side=120
    //   V[2] = A rotated 90° around B: dx=50-170=-120, dy=0
    //     x = 170 + 0*(-120) - 1*0 = 170
    //     y = 190 + 1*(-120) + 0*0 = 70    → V[2] = (170, 70)
    //   V[3] = B rotated 90° around V[2]: dx=170-170=0, dy=190-70=120
    //     x = 170 + 0*0 - 1*120 = 50
    //     y = 70 + 1*0 + 0*120 = 70         → V[3] = (50, 70)
    it("should compute a square with 4 vertices at right angles", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [50, 190] },
            { name: "B", construction: E.Point.free, params: [170, 190] },
            { name: "ABED", construction: E.Polygon.square, params: ["A", "B"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let sq = slate.lookupElement("ABED") as PolygonElement;
        assert.equal(sq.V.length, 4);
        almostEqual(sq.V[0].x,  50, 0.01); almostEqual(sq.V[0].y, 190, 0.01);
        almostEqual(sq.V[1].x, 170, 0.01); almostEqual(sq.V[1].y, 190, 0.01);
        almostEqual(sq.V[2].x, 170, 0.01); almostEqual(sq.V[2].y,  70, 0.01);
        almostEqual(sq.V[3].x,  50, 0.01); almostEqual(sq.V[3].y,  70, 0.01);
        // All sides equal (120)
        let side = sq.V[0].distance(sq.V[1]);
        almostEqual(side, 120, 0.01);
        almostEqual(sq.V[1].distance(sq.V[2]), side, 0.01);
        almostEqual(sq.V[2].distance(sq.V[3]), side, 0.01);
        almostEqual(sq.V[3].distance(sq.V[0]), side, 0.01);
    });

    // line;angleBisector — bisect angle BAC, line from vertex A to bisector point on BC
    // Right angle at B=(0,0), rays to A=(0,100) and C=(100,0)
    // Bisector of 90° at B → 45° ray hits AC (line from (0,100) to (100,0), x+y=100)
    // at (50, 50)
    // point;sphereSlider — point constrained to sphere surface
    // Sphere center (100,100,0), radius point (200,100,0) → radius=100
    // Point starts at (150,100,50), should project onto sphere surface
    // Distance from center = sqrt(50²+0²+50²) = sqrt(5000) ≈ 70.71
    // factor = 100/70.71 ≈ 1.414
    // Projected: center + factor*(P-center) = (100+1.414*50, 100, 0+1.414*50) ≈ (170.71, 100, 70.71)
    it("should project a sphereSlider point onto the sphere surface", () => {
        let data : IConstructionInfo[] = [
            { name: "O", construction: E.Point.fixed, params: [100, 100, 0] },
            { name: "R", construction: E.Point.fixed, params: [200, 100, 0] },
            { name: "S", construction: E.Sphere.radius, params: ["O", "R"] },
            { name: "A", construction: E.Point.sphereSlider, params: ["S", 150, 100, 50] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let A = slate.lookupElement("A") as PointElement;
        // Distance from center should equal radius (100)
        let O = slate.lookupElement("O") as PointElement;
        let dist = Math.sqrt((A.x-O.x)*(A.x-O.x) + (A.y-O.y)*(A.y-O.y) + (A.z-O.z)*(A.z-O.z));
        almostEqual(dist, 100, 0.1);
        // Should be draggable
        assert.ok((A as any).draggable);
    });

    // plane;parallel — plane through point A parallel to plane P
    it("should create a parallel plane through a point", () => {
        let data : IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "P", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [50, 50, 100] },
            { name: "Q", construction: E.Plane.parallel, params: ["P", "A"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let Q = slate.lookupElement("Q") as PlaneElement;
        // Parallel plane should pass through A
        almostEqual(Q.A.x, 50, 0.01);
        almostEqual(Q.A.y, 50, 0.01);
        almostEqual(Q.A.z, 100, 0.01);
    });

    // polyhedron;tetrahedron — 4 points → triangle base + pyramid
    it("should create a tetrahedron with 4 triangular faces", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "B", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [50, 87, 0] },
            { name: "D", construction: E.Point.fixed, params: [50, 29, 82] },
            { name: "T", construction: E.Polyhedra.tetrahedron, params: ["A", "B", "C", "D"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        // The tetrahedron should have 4 faces (1 base + 3 sides)
        // Find it — it's the last PolyhedronElement in the elements list
        let tetra = slate.lookupElement("T");
        assert.ok(tetra != null);
        assert.equal((tetra as any).P.length, 4);
    });

    // polyhedron;prism — base polygon + direction vector → prism
    // Triangle base + extrusion direction (0,0,100) → 5 faces (2 triangles + 3 quads)
    it("should create a prism with base+2 triangles and 3 side quads", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "B", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [50, 87, 0] },
            { name: "base", construction: E.Polygon.triangle, params: ["A", "B", "C"] },
            { name: "D", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "E", construction: E.Point.fixed, params: [0, 0, 100] },
            { name: "P", construction: E.Polyhedra.prism, params: ["base", "D", "E"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let prism = slate.lookupElement("P");
        assert.ok(prism != null);
        // 2 + base.V.length = 2 + 3 = 5 faces
        assert.equal((prism as any).P.length, 5);
        // Top vertices should be base + (E-D) = base + (0,0,100)
        let top = (prism as any).P[1] as PolygonElement;
        almostEqual(top.V[0].z, 100, 0.01);
        almostEqual(top.V[1].z, 100, 0.01);
        almostEqual(top.V[2].z, 100, 0.01);
    });

    // polyhedron;parallelepiped — 4 points → parallelogram base + prism
    it("should create a parallelepiped with 6 faces", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "B", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "D", construction: E.Point.fixed, params: [0, 0, 100] },
            { name: "PP", construction: E.Polyhedra.parallelepiped, params: ["A", "B", "C", "D"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let pp = slate.lookupElement("PP");
        assert.ok(pp != null);
        // parallelepiped = prism on parallelogram base = 2 + 4 = 6 faces
        assert.equal((pp as any).P.length, 6);
    });

    // circle;intersection — intersection of two spheres
    // Sphere S: center (0,0,0), radius 100 (edge at (100,0,0))
    // Sphere T: center (100,0,0), radius 100 (edge at (200,0,0))
    // Both radii = 100, centers 100 apart → intersection circle at x=50
    // factor = 0.5 + (100²-100²)/(2*100²) = 0.5
    // Center = S.Center + factor*(T.Center - S.Center)... wait, the formula is:
    //   Center.to(S.Center).minus(T.Center).times(factor).plus(T.Center)
    //   = (0-100)*0.5 + 100 = 50
    // radius = sqrt(T.radius² - Center.distance²(T.Center)) = sqrt(10000 - 2500) = sqrt(7500) ≈ 86.6
    it("should compute the intersection circle of two spheres", () => {
        let data : IConstructionInfo[] = [
            { name: "O1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "R1", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "S", construction: E.Sphere.radius, params: ["O1", "R1"] },
            { name: "O2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "R2", construction: E.Point.fixed, params: [200, 0, 0] },
            { name: "T", construction: E.Sphere.radius, params: ["O2", "R2"] },
            { name: "C", construction: E.Circle.intersection, params: ["S", "T"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let circle = slate.lookupElement("C") as CircleElement;
        // Center of intersection circle should be at (50, 0, 0)
        almostEqual(circle.Center.x, 50, 0.1);
        almostEqual(circle.Center.y, 0, 0.1);
        // Radius should be sqrt(10000 - 2500) = sqrt(7500) ≈ 86.6
        almostEqual(circle.radius, Math.sqrt(7500), 0.1);
    });

    // --- Tests for the 7 previously missing constructions ---

    // point;intersection (plane-line) — PlaneIntersection
    // Plane z=0 (xy-plane), line from (50,50,100) to (50,50,-100) → intersects at (50,50,0)
    it("should compute plane-line intersection", () => {
        let data : IConstructionInfo[] = [
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

    // point;center (sphere) — returns sphere center
    it("should return the center of a sphere", () => {
        let data : IConstructionInfo[] = [
            { name: "O", construction: E.Point.fixed, params: [150, 150, 50] },
            { name: "R", construction: E.Point.fixed, params: [250, 150, 50] },
            { name: "S", construction: E.Sphere.radius, params: ["O", "R"] },
            { name: "C", construction: E.Point.center, params: ["S"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        let C = slate.lookupElement("C") as PointElement;
        almostEqual(C.x, 150, 0.01);
        almostEqual(C.y, 150, 0.01);
        almostEqual(C.z, 50, 0.01);
    });

    // --- 3D signature variant tests ---

    // circle;radius 3D (2-point with explicit plane)
    it("should create a circle with explicit plane (3D variant)", () => {
        let data : IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [50, 50, 0] },
            { name: "B", construction: E.Point.fixed, params: [100, 50, 0] },
            { name: "C", construction: E.Circle.radius, params: ["A", "B", "plane"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        let circle = slate.lookupElement("C") as CircleElement;
        almostEqual(circle.radius, 50, 0.01);
        // AP should be the explicit plane, not screen
        assert.ok(circle.AP != null);
    });

    // polygon;equilateralTriangle 3D (with explicit plane)
    it("should create an equilateral triangle with explicit plane (3D variant)", () => {
        let data : IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [50, 50, 0] },
            { name: "B", construction: E.Point.fixed, params: [150, 50, 0] },
            { name: "T", construction: E.Polygon.equilateralTriangle, params: ["A", "B", "plane"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let tri = slate.lookupElement("T") as PolygonElement;
        assert.equal(tri.V.length, 3);
        // All sides should be equal (100)
        let side = tri.V[0].distance(tri.V[1]);
        almostEqual(side, 100, 0.01);
        almostEqual(tri.V[1].distance(tri.V[2]), side, 0.01);
        almostEqual(tri.V[2].distance(tri.V[0]), side, 0.01);
    });

    // sector;arc 3D (with explicit plane)
    it("should create an arc with explicit plane (3D variant)", () => {
        let data : IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [50, 130, 0] },
            { name: "M", construction: E.Point.fixed, params: [70, 210, 0] },
            { name: "B", construction: E.Point.fixed, params: [120, 200, 0] },
            { name: "arc", construction: E.Sector.arc, params: ["A", "M", "B", "plane"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let arc = slate.lookupElement("arc");
        assert.ok(arc != null);
    });

    // point;similar 3D (with explicit planes)
    it("should compute a similar point with explicit planes (3D variant)", () => {
        let data : IConstructionInfo[] = [
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

    // point;angleBisector 3D
    it("should compute angle bisector with explicit plane (3D variant)", () => {
        let data : IConstructionInfo[] = [
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

    // point;angleDivider 3D
    it("should compute angle divider with explicit plane (3D variant)", () => {
        let data : IConstructionInfo[] = [
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

    // line;angleBisector 3D
    it("should compute line angle bisector with explicit plane (3D variant)", () => {
        let data : IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "B", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "L", construction: E.Line.angleBisector, params: ["A", "B", "C", "plane"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let L = slate.lookupElement("L") as LineElement;
        almostEqual(L.A.x, 0, 0.1);
        almostEqual(L.A.y, 0, 0.1);
    });

    // line;angleDivider 3D
    it("should compute line angle divider with explicit plane (3D variant)", () => {
        let data : IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "B", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "L", construction: E.Line.angleDivider, params: ["A", "B", "C", "plane", 3] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let L = slate.lookupElement("L") as LineElement;
        assert.ok(L != null);
        assert.ok(!isNaN(L.A.x));
    });

    // line;similar 3D
    it("should compute a similar line with explicit planes (3D variant)", () => {
        let data : IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [50, 200, 0] },
            { name: "B", construction: E.Point.fixed, params: [150, 200, 0] },
            { name: "D", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "Ep", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "F", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "L", construction: E.Line.similar, params: ["A", "B", "plane", "D", "Ep", "F", "plane"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let L = slate.lookupElement("L") as LineElement;
        almostEqual(L.A.x, 50, 0.1);
        assert.ok(!isNaN(L.B.x));
    });

    // circle;radius 3D (3-point with explicit plane)
    it("should create a 3-point circle with explicit plane (3D variant)", () => {
        let data : IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [50, 50, 0] },
            { name: "B", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [60, 80, 0] },
            { name: "circ", construction: E.Circle.radius, params: ["A", "B", "C", "plane"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        let circle = slate.lookupElement("circ") as CircleElement;
        almostEqual(circle.radius, 100, 0.01);
    });

    // polygon;square 3D
    it("should create a square with explicit plane (3D variant)", () => {
        let data : IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [50, 190, 0] },
            { name: "B", construction: E.Point.fixed, params: [170, 190, 0] },
            { name: "S", construction: E.Polygon.square, params: ["A", "B", "plane"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let sq = slate.lookupElement("S") as PolygonElement;
        assert.equal(sq.V.length, 4);
        let side = sq.V[0].distance(sq.V[1]);
        almostEqual(side, 120, 0.01);
    });

    // polygon;regularPolygon 3D
    it("should create a regular pentagon with explicit plane (3D variant)", () => {
        let data : IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [100, 50, 0] },
            { name: "B", construction: E.Point.fixed, params: [200, 50, 0] },
            { name: "pent", construction: E.Polygon.regularPolygon, params: ["A", "B", "plane", 5] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let poly = slate.lookupElement("pent") as PolygonElement;
        assert.equal(poly.V.length, 5);
    });

    // polygon;similar 3D
    it("should create a similar polygon with explicit planes (3D variant)", () => {
        let data : IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [50, 200, 0] },
            { name: "B", construction: E.Point.fixed, params: [150, 200, 0] },
            { name: "D", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "Ep", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "F", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "T", construction: E.Polygon.similar, params: ["A", "B", "plane", "D", "Ep", "F", "plane"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let tri = slate.lookupElement("T") as PolygonElement;
        assert.equal(tri.V.length, 3);
        assert.ok(!isNaN(tri.V[2].x));
    });

    // polygon;starPolygon — star polygon with density d
    // {5/2} pentagram: 5 vertices, density 2
    it("should create a star polygon (pentagram) with 5 vertices", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [100, 50] },
            { name: "B", construction: E.Point.free, params: [200, 50] },
            { name: "S", construction: E.Polygon.starPolygon, params: ["A", "B", 5, 2] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let poly = slate.lookupElement("S") as PolygonElement;
        assert.equal(poly.V.length, 5);
        // V[0]=A and V[1]=B are the given edge
        almostEqual(poly.V[0].x, 100, 0.01);
        almostEqual(poly.V[1].x, 200, 0.01);
        // V[2] should exist and not be NaN
        assert.ok(!isNaN(poly.V[2].x));
        assert.ok(!isNaN(poly.V[2].y));
    });

    // sphere;radius 3-point — sphere at A with radius |BC|
    it("should create a 3-point sphere with radius |BC|", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.fixed, params: [100, 100, 0] },
            { name: "B", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [60, 80, 0] },
            { name: "S", construction: E.Sphere.radius, params: ["A", "B", "C"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        let sphere = slate.lookupElement("S") as SphereElement;
        // radius should be |BC| = sqrt(60²+80²) = 100
        almostEqual(sphere.radius(), 100, 0.01);
    });

    // circle;invert — inversion of circle in another circle
    // Circle C: center (100,100), radius 30 (edge at (130,100))
    // Circle D: center (200,100), radius 50 (edge at (250,100))
    // The inverted circle should have a computable center and radius
    it("should compute the inversion of a circle in another circle", () => {
        let data : IConstructionInfo[] = [
            { name: "O1", construction: E.Point.free, params: [100, 100] },
            { name: "R1", construction: E.Point.free, params: [130, 100] },
            { name: "C", construction: E.Circle.radius, params: ["O1", "R1"] },
            { name: "O2", construction: E.Point.free, params: [200, 100] },
            { name: "R2", construction: E.Point.free, params: [250, 100] },
            { name: "D", construction: E.Circle.radius, params: ["O2", "R2"] },
            { name: "E", construction: E.Circle.invert, params: ["C", "D"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let inverted = slate.lookupElement("E") as CircleElement;
        // The inverted circle should be defined (not NaN)
        assert.ok(!isNaN(inverted.Center.x));
        assert.ok(!isNaN(inverted.Center.y));
        assert.ok(inverted.radius > 0);
    });

    // plane;ambient (point variant) — returns the ambient plane of a point
    // Note: ambient returns the SAME object (name gets overwritten, like point;vertex)
    it("should return the ambient plane of a point", () => {
        let data : IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "P", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.planeSlider, params: ["P", 50, 50, 0] },
            { name: "AP", construction: E.Plane.ambient, params: ["A"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let ambient = slate.lookupElement("AP") as PlaneElement;
        // The ambient plane should be a valid PlaneElement with S,T,U frame
        assert.ok(ambient != null);
        assert.ok(ambient instanceof PlaneElement);
        // S should be unit vector in direction P1→P2
        almostEqual(ambient.S.x, 1, 0.01);
        almostEqual(ambient.S.y, 0, 0.01);
    });

    // line;proportion — line GI along GH so that AB:CD = EF:GI
    // Using same values as point;proportion test: S=100, T=50, U=80, V=200
    // factor = (50*80)/(100*200) = 0.2, result at V0 + 0.2*(V1-V0)
    // Line from V0=(0,200) to result=(40,200)
    it("should compute a proportion line", () => {
        let data : IConstructionInfo[] = [
            { name: "S0", construction: E.Point.free, params: [0, 0] },
            { name: "S1", construction: E.Point.free, params: [100, 0] },
            { name: "T0", construction: E.Point.free, params: [0, 0] },
            { name: "T1", construction: E.Point.free, params: [50, 0] },
            { name: "U0", construction: E.Point.free, params: [0, 0] },
            { name: "U1", construction: E.Point.free, params: [80, 0] },
            { name: "V0", construction: E.Point.free, params: [0, 200] },
            { name: "V1", construction: E.Point.free, params: [200, 200] },
            { name: "L",  construction: E.Line.proportion, params: ["S0","S1","T0","T1","U0","U1","V0","V1"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let line = slate.lookupElement("L") as LineElement;
        // Line starts at V0 = (0, 200)
        almostEqual(line.A.x, 0, 0.01);
        almostEqual(line.A.y, 200, 0.01);
        // Line ends at proportional point = (40, 200)
        almostEqual(line.B.x, 40, 0.01);
        almostEqual(line.B.y, 200, 0.01);
    });

    // point;invert — inversion of a point in a circle
    // Circle center (100,100), radius point (200,100) → radius=100
    // Point A at (150,100) → distance from center = 50
    // Inverted: factor = r²/d² = 10000/2500 = 4
    // Result = center + 4*(A-center) = (100,100) + 4*(50,0) = (300,100)
    it("should compute the inversion of a point in a circle", () => {
        let data : IConstructionInfo[] = [
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

    // point;harmonic — harmonic conjugate of B with respect to C and D
    // Collinear case: C=(0,0), D=(100,0), B=(25,0)
    // Complex formula: A = (C(B-D) + D(B-C)) / ((B-D) + (B-C))
    // E=B-C=(25,0), F=B-D=(-75,0)
    // CF=C*F=(0,0), DE=D*E=(2500,0)
    // numx = (CF+DE)*(F+E) = 2500*(-50) = -125000
    // den = (-50)^2 = 2500
    // A = (-50, 0)
    it("should compute the harmonic conjugate (2D collinear case)", () => {
        let data : IConstructionInfo[] = [
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

    // point;planeSlider — draggable point constrained to a non-screen plane
    it("should create a planeSlider point on a 3-point plane", () => {
        let data : IConstructionInfo[] = [
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
        // The plane is the xy-plane (z=0), so the point should project to z=0
        almostEqual(A.x, 50, 0.01);
        almostEqual(A.y, 50, 0.01);
        almostEqual(A.z, 0, 0.01);
        // Should be draggable
        assert.ok((A as any).draggable);
    });

    // plane;3points — plane through 3 non-collinear points
    it("should create a plane through 3 points with computed S,T,U frame", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "B", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "P", construction: E.Plane.threePoints, params: ["A", "B", "C"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let plane = slate.lookupElement("P") as PlaneElement;
        // S should be unit vector in direction A→B = (1,0,0)
        almostEqual(plane.S.x, 1, 0.01);
        almostEqual(plane.S.y, 0, 0.01);
        almostEqual(plane.S.z, 0, 0.01);
        // T should be unit vector perpendicular to S in the plane = (0,1,0)
        almostEqual(plane.T.x, 0, 0.01);
        almostEqual(plane.T.y, 1, 0.01);
        almostEqual(plane.T.z, 0, 0.01);
        // U should be normal = (0,0,1)
        almostEqual(plane.U.x, 0, 0.01);
        almostEqual(plane.U.y, 0, 0.01);
        almostEqual(plane.U.z, 1, 0.01);
    });

    // polygon;octagon — 8 free vertices pass-through
    it("should create an octagon with 8 vertices", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [100, 50] },
            { name: "B", construction: E.Point.free, params: [150, 50] },
            { name: "C", construction: E.Point.free, params: [175, 100] },
            { name: "D", construction: E.Point.free, params: [150, 150] },
            { name: "E", construction: E.Point.free, params: [100, 150] },
            { name: "F", construction: E.Point.free, params: [75, 100] },
            { name: "G", construction: E.Point.free, params: [85, 70] },
            { name: "H", construction: E.Point.free, params: [115, 70] },
            { name: "OCT", construction: E.Polygon.octagon, params: ["A","B","C","D","E","F","G","H"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        let poly = slate.lookupElement("OCT") as PolygonElement;
        assert.equal(poly.V.length, 8);
        almostEqual(poly.V[0].x, 100, 0.01);
        almostEqual(poly.V[7].x, 115, 0.01);
    });

    // line;cutoff — line AE equal to CD along line AB
    // A=(50,100), B=(200,100), C=(0,0), D=(60,0) → |CD|=60
    // Layoff(A,A,B,C,D): E on ray AB from A with |AE|=60 → E=(110,100)
    // Line from A=(50,100) to E=(110,100)
    it("should create a line cutoff equal to a given length", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [50, 100] },
            { name: "B", construction: E.Point.free, params: [200, 100] },
            { name: "C", construction: E.Point.free, params: [0, 0] },
            { name: "D", construction: E.Point.free, params: [60, 0] },
            { name: "AE", construction: E.Line.cutoff, params: ["A", "B", "C", "D"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let line = slate.lookupElement("AE") as LineElement;
        // Line starts at A
        almostEqual(line.A.x, 50, 0.01);
        almostEqual(line.A.y, 100, 0.01);
        // Line ends at E = A + 60 along AB direction (horizontal)
        almostEqual(line.B.x, 110, 0.01);
        almostEqual(line.B.y, 100, 0.01);
    });

    it("should bisect a right angle and intersect the opposite side", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [0, 100] },
            { name: "B", construction: E.Point.free, params: [0, 0] },
            { name: "C", construction: E.Point.free, params: [100, 0] },
            { name: "Bbis", construction: E.Line.angleBisector, params: ["A", "B", "C"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let line = slate.lookupElement("Bbis") as LineElement;
        // Line starts at vertex B
        almostEqual(line.A.x, 0, 0.01);
        almostEqual(line.A.y, 0, 0.01);
        // Line ends at bisector point on AC = (50, 50)
        almostEqual(line.B.x, 50, 0.01);
        almostEqual(line.B.y, 50, 0.01);
    });

    // point;angleBisector — just the bisector point, no line
    it("should compute the angle bisector point", () => {
        let data : IConstructionInfo[] = [
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

    // polygon;regularPolygon — variable-n regular polygon via RegularPolygonElement
    // n=5 (pentagon): A=(100,50), B=(200,50), side=100
    // All sides should be equal and there should be 5 vertices
    it("should create a regular pentagon with 5 equal sides", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [100, 50] },
            { name: "B", construction: E.Point.free, params: [200, 50] },
            { name: "ABCDE", construction: E.Polygon.regularPolygon, params: ["A", "B", 5] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let poly = slate.lookupElement("ABCDE") as PolygonElement;
        assert.equal(poly.V.length, 5);
        // All 5 sides should be equal to side AB = 100
        let side = poly.V[0].distance(poly.V[1]);
        almostEqual(side, 100, 0.01);
        for (let i = 1; i < 5; i++) {
            almostEqual(poly.V[i].distance(poly.V[(i+1) % 5]), side, 0.01);
        }
    });

    // polygon;quadrilateral — 4 free vertices passed through to PolygonElement
    it("should create a quadrilateral with 4 vertices", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [80, 40] },
            { name: "B", construction: E.Point.free, params: [40, 210] },
            { name: "C", construction: E.Point.free, params: [210, 210] },
            { name: "D", construction: E.Point.free, params: [250, 40] },
            { name: "ABCD", construction: E.Polygon.quadrilateral, params: ["A", "B", "C", "D"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        let poly = slate.lookupElement("ABCD") as PolygonElement;
        assert.equal(poly.V.length, 4);
        almostEqual(poly.V[0].x,  80, 0.01); almostEqual(poly.V[0].y,  40, 0.01);
        almostEqual(poly.V[1].x,  40, 0.01); almostEqual(poly.V[1].y, 210, 0.01);
        almostEqual(poly.V[2].x, 210, 0.01); almostEqual(poly.V[2].y, 210, 0.01);
        almostEqual(poly.V[3].x, 250, 0.01); almostEqual(poly.V[3].y,  40, 0.01);
    });

    it("should compute a similar point with factor=1 (isosceles right triangle)", () => {
        let data : IConstructionInfo[] = [
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
        // Verify similarity: |AC|/|AB| should equal |DF|/|DE| = 1.0
        let A = slate.lookupElement("A") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        almostEqual(A.distance(C) / A.distance(B), 1.0, 0.001);
    });

    it("should compute a similar point with factor=0.5 (non-isosceles right triangle)", () => {
        let data : IConstructionInfo[] = [
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
        // Verify similarity: |AC|/|AB| should equal |DF|/|DE| = 0.5
        let A = slate.lookupElement("A") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        almostEqual(A.distance(C) / A.distance(B), 0.5, 0.001);
    });

    it("should compute a line through A parallel and equal to BC", () => {
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, parallel_data);
        slate.elements.forEach(e => e.update());
        let line = slate.lookupElement("AD") as LineElement;
        // Line starts at A
        almostEqual(line.A.x,  50, 0.01);
        almostEqual(line.A.y, 100, 0.01);
        // Line ends at D = A + (C-B) = (150, 200)
        almostEqual(line.B.x, 150, 0.01);
        almostEqual(line.B.y, 200, 0.01);
        // Direction AD should equal direction BC
        let adx = line.B.x - line.A.x;  // 100
        let ady = line.B.y - line.A.y;  // 100
        let bcx = 200 - 100;             // 100
        let bcy = 200 - 100;             // 100
        almostEqual(adx, bcx, 0.01);
        almostEqual(ady, bcy, 0.01);
        // Lengths should match
        let lenAD = Math.sqrt(adx*adx + ady*ady);
        let lenBC = Math.sqrt(bcx*bcx + bcy*bcy);
        almostEqual(lenAD, lenBC, 0.001);
    });

    it("should recompute the parallel line when an input point moves", () => {
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, parallel_data);
        slate.elements.forEach(e => e.update());
        // Move C from (200,200) to (250,150)
        let C = slate.lookupElement("C") as PointElement;
        C.x = 250; C.y = 150;
        slate.elements.forEach(e => e.update());
        let line = slate.lookupElement("AD") as LineElement;
        // D = A + (C'-B) = (50,100) + (150,50) = (200, 150)
        almostEqual(line.A.x,  50, 0.01);
        almostEqual(line.A.y, 100, 0.01);
        almostEqual(line.B.x, 200, 0.01);
        almostEqual(line.B.y, 150, 0.01);
    });

    it("should be able to find the closest visible point within a tolerance", () =>{
        let slate : Slate = new Slate(createCanvas(200,200));
        let elms = toElements(slate, connected_line_data);
        let A = slate.lookupElement("A") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        let red = "#FF0000";
        A.vertexColor = 'red';
        B.vertexColor = 'red';

        let P = slate.closestVisiblePoint(slate.elements,
                                  new PointElement({x:(10+100)/2 - 1, y:100}), 100);
        assert(P.name == "A");
        P = slate.closestVisiblePoint(slate.elements,
            new PointElement({x:(10+100)/2 + 1, y:100}), 100);
        assert(P.name == "B");

        P = slate.closestVisiblePoint(slate.elements,
            new PointElement({x:(10+100)/2 - 1, y:100}), 10);
        assert(P == null);

        P = slate.closestVisiblePoint(slate.elements,
            new PointElement({x:89, y:100}), 10);
        assert(P == null);

        P = slate.closestVisiblePoint(slate.elements,
            new PointElement({x:91, y:100}), 10);
        assert(P.name == "B");
    });

    // point;foot (plane variant) — foot of perpendicular from D to plane P
    // Plane P = XY-plane through A=(0,0,0), B=(100,0,0), C=(0,100,0)
    // D=(50,50,100) — foot should be (50,50,0)
    it("should compute the foot of a perpendicular from a point to a plane", () => {
        let data : IConstructionInfo[] = [
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

    // line;foot (plane variant) — line from D to foot of perpendicular on plane P
    // Same setup: foot at (50,50,0), line from D=(50,50,100) to foot
    it("should compute a line from a point to the foot on a plane", () => {
        let data : IConstructionInfo[] = [
            { name: "A", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "B", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "P", construction: E.Plane.threePoints, params: ["A", "B", "C"] },
            { name: "D", construction: E.Point.fixed, params: [50, 50, 100] },
            { name: "DF", construction: E.Line.foot, params: ["D", "P"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let line = slate.lookupElement("DF") as LineElement;
        // Line starts at D
        almostEqual(line.A.x, 50, 0.01);
        almostEqual(line.A.y, 50, 0.01);
        almostEqual(line.A.z, 100, 0.01);
        // Line ends at foot = (50, 50, 0)
        almostEqual(line.B.x, 50, 0.01);
        almostEqual(line.B.y, 50, 0.01);
        almostEqual(line.B.z, 0, 0.01);
    });

});

import {parseColor, brighter, darker} from "../src/Colors";

describe("parseColor", () => {

    let bgcolor = "rgb(255,233,205)"; // #ffe9cd — the standard proposition background

    // 1. Transparent inputs → null
    it("should return null for null input (uses default)", () => {
        assert.equal(parseColor(null, "black", bgcolor), "black");
    });
    it("should return null for 'none'", () => {
        assert.equal(parseColor("none", "black", bgcolor), null);
    });
    it("should return null for string '0'", () => {
        assert.equal(parseColor("0", "black", bgcolor), null);
    });
    it("should return null for numeric 0", () => {
        assert.equal(parseColor(0, "black", bgcolor), null);
    });
    it("should return null for empty string", () => {
        assert.equal(parseColor("", "black", bgcolor), null);
    });

    // 2. Special keywords
    it("should return a random color for 'random'", () => {
        let c = parseColor("random", "black", bgcolor);
        assert.ok(c.startsWith("rgb("));
    });
    it("should return bgcolor for 'background'", () => {
        assert.equal(parseColor("background", "black", bgcolor), bgcolor);
    });
    it("should return a brighter color for 'brighter'", () => {
        let c = parseColor("brighter", "black", bgcolor);
        assert.ok(c.startsWith("rgb("));
        assert.notEqual(c, bgcolor);
    });
    it("should return a darker color for 'darker'", () => {
        let c = parseColor("darker", "black", bgcolor);
        assert.ok(c.startsWith("rgb("));
        assert.notEqual(c, bgcolor);
    });

    // 3. Named colors (all 13)
    it("should resolve all 13 named colors", () => {
        assert.equal(parseColor("black", null, bgcolor), "rgb(0,0,0)");
        assert.equal(parseColor("blue", null, bgcolor), "rgb(0,0,255)");
        assert.equal(parseColor("cyan", null, bgcolor), "rgb(0,255,255)");
        assert.equal(parseColor("darkGray", null, bgcolor), "rgb(64,64,64)");
        assert.equal(parseColor("gray", null, bgcolor), "rgb(128,128,128)");
        assert.equal(parseColor("green", null, bgcolor), "rgb(0,255,0)");
        assert.equal(parseColor("lightGray", null, bgcolor), "rgb(192,192,192)");
        assert.equal(parseColor("magenta", null, bgcolor), "rgb(255,0,255)");
        assert.equal(parseColor("orange", null, bgcolor), "rgb(255,200,0)");
        assert.equal(parseColor("pink", null, bgcolor), "rgb(255,175,175)");
        assert.equal(parseColor("red", null, bgcolor), "rgb(255,0,0)");
        assert.equal(parseColor("white", null, bgcolor), "rgb(255,255,255)");
        assert.equal(parseColor("yellow", null, bgcolor), "rgb(255,255,0)");
    });

    // 4. Hex color parsing
    it("should parse 6-digit hex 'ff0000' as red", () => {
        assert.equal(parseColor("ff0000", null, bgcolor), "rgb(255,0,0)");
    });
    it("should parse hex '0000ff' as blue", () => {
        assert.equal(parseColor("0000ff", null, bgcolor), "rgb(0,0,255)");
    });
    it("should parse hex 'ffffff' as white", () => {
        assert.equal(parseColor("ffffff", null, bgcolor), "rgb(255,255,255)");
    });

    // 5. HSB comma triple parsing
    it("should parse '35,19,100' (standard background) as warm peach", () => {
        // h=35/360, s=19/100, b=100/100
        let c = parseColor("35,19,100", null, bgcolor);
        assert.ok(c.startsWith("rgb("));
        // Should be approximately rgb(255,233,205) — the peach background
        let m = c.match(/rgb\((\d+),(\d+),(\d+)\)/);
        let r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
        // Java produces Color(255,233,206) for HSB(35/360, 19/100, 100/100)
        assert.ok(r >= 250 && r <= 255, `red ${r} should be ~255`);
        assert.ok(g >= 228 && g <= 238, `green ${g} should be ~233`);
        assert.ok(b >= 200 && b <= 210, `blue ${b} should be ~206`);
    });
    it("should parse '0,0,0' as black", () => {
        assert.equal(parseColor("0,0,0", null, bgcolor), "rgb(0,0,0)");
    });
    it("should parse '0,0,100' as white (full brightness, no saturation)", () => {
        let c = parseColor("0,0,100", null, bgcolor);
        assert.equal(c, "rgb(255,255,255)");
    });
    it("should parse '270,70,100' as a purple", () => {
        let c = parseColor("270,70,100", null, bgcolor);
        let m = c.match(/rgb\((\d+),(\d+),(\d+)\)/);
        let r = parseInt(m[1]), b = parseInt(m[3]);
        // Hue 270 = purple region, high saturation
        assert.ok(b > r, `blue ${b} should exceed red ${r} for purple`);
    });

    // 6. Unrecognized → null
    it("should return null for unrecognized input", () => {
        assert.equal(parseColor("notacolor", null, bgcolor), null);
    });
});

describe("brighter / darker", () => {

    it("brighter should increase RGB components", () => {
        let c = brighter("rgb(100,100,100)");
        let m = c.match(/rgb\((\d+),(\d+),(\d+)\)/);
        let r = parseInt(m[1]);
        assert.ok(r > 100, `brighter(100) = ${r} should be > 100`);
        // Java: floor(100 / 0.7) = 142
        assert.equal(r, 142);
    });

    it("brighter should handle black (all zeros)", () => {
        let c = brighter("rgb(0,0,0)");
        // Java: ceil(1.0 / (1.0 - 0.7)) = ceil(3.333) = 4
        assert.equal(c, "rgb(4,4,4)");
    });

    it("brighter should cap at 255", () => {
        let c = brighter("rgb(200,200,200)");
        let m = c.match(/rgb\((\d+),(\d+),(\d+)\)/);
        let r = parseInt(m[1]);
        assert.ok(r <= 255, `brighter(200) = ${r} should be <= 255`);
    });

    it("darker should reduce RGB components by factor 0.7", () => {
        let c = darker("rgb(100,100,100)");
        // Java: floor(100 * 0.7) = 70
        assert.equal(c, "rgb(70,70,70)");
    });

    it("darker should handle black", () => {
        let c = darker("rgb(0,0,0)");
        assert.equal(c, "rgb(0,0,0)");
    });

    it("brighter should work with HSB triple input", () => {
        // "35,19,100" → rgb(~255,~233,~206) → brighter clamps near 255
        let c = brighter("35,19,100");
        assert.ok(c.startsWith("rgb("), `expected rgb string, got: ${c}`);
    });

    it("darker should work with named color input", () => {
        let c = darker("red");
        // red = rgb(255,0,0) → darker = rgb(178,0,0)
        assert.equal(c, "rgb(178,0,0)");
    });
});

import {parseParam} from "../src/index";

describe("parseParam", () => {

    it("should parse a free point with coordinates", () => {
        let p = parseParam("A;point;free;60,100");
        assert.equal(p.name, "A");
        assert.equal(p.construction, E.Point.free);
        assert.deepEqual(p.params, [60, 100]);
    });

    it("should parse a midpoint with string references", () => {
        let p = parseParam("M;point;midpoint;A,B");
        assert.equal(p.name, "M");
        assert.equal(p.construction, E.Point.midpoint);
        assert.deepEqual(p.params, ["A", "B"]);
    });

    it("should parse a circle construction", () => {
        let p = parseParam("C;circle;radius;A,B");
        assert.equal(p.construction, E.Circle.radius);
        assert.deepEqual(p.params, ["A", "B"]);
    });

    it("should parse a line construction", () => {
        let p = parseParam("AB;line;connect;A,B");
        assert.equal(p.construction, E.Line.connect);
        assert.deepEqual(p.params, ["A", "B"]);
    });

    it("should parse a polygon construction", () => {
        let p = parseParam("T;polygon;triangle;A,B,C");
        assert.equal(p.construction, E.Polygon.triangle);
        assert.deepEqual(p.params, ["A", "B", "C"]);
    });

    it("should parse a sector construction", () => {
        let p = parseParam("S;sector;sector;A,B,C");
        assert.equal(p.construction, E.Sector.sector);
    });

    it("should parse a plane construction", () => {
        let p = parseParam("P;plane;3points;A,B,C");
        assert.equal(p.construction, E.Plane.threePoints);
    });

    it("should parse a sphere construction", () => {
        let p = parseParam("S;sphere;radius;A,B");
        assert.equal(p.construction, E.Sphere.radius);
    });

    it("should parse a polyhedron construction", () => {
        let p = parseParam("P;polyhedron;pyramid;base,D");
        assert.equal(p.construction, E.Polyhedra.pyramid);
        assert.deepEqual(p.params, ["base", "D"]);
    });

    it("should convert numeric params to numbers", () => {
        let p = parseParam("A;point;fixed;50,100,0");
        assert.deepEqual(p.params, [50, 100, 0]);
        assert.equal(typeof p.params[0], "number");
    });

    it("should handle mixed string and numeric params", () => {
        let p = parseParam("R;polygon;regularPolygon;A,B,5");
        assert.deepEqual(p.params, ["A", "B", 5]);
    });

    it("should handle negative numeric params", () => {
        let p = parseParam("Y;point;planeSlider;P,-90,202,90");
        assert.deepEqual(p.params, ["P", -90, 202, 90]);
    });

    it("should parse color fields", () => {
        let p = parseParam("T;polygon;triangle;A,B,C;0;0;black;random");
        assert.equal(p.nameColor, "0");
        assert.equal(p.vertexColor, "0");
        assert.equal(p.edgeColor, "black");
        assert.equal(p.faceColor, "random");
    });

    it("should parse partial color fields", () => {
        let p = parseParam("D;point;fixed;50,100,0;black;green");
        assert.equal(p.nameColor, "black");
        assert.equal(p.vertexColor, "green");
        assert.equal(p.edgeColor, undefined);
        assert.equal(p.faceColor, undefined);
    });

    it("should parse a single color field", () => {
        let p = parseParam("Z;point;lineSlider;A,B,40,40,100;0");
        assert.equal(p.nameColor, "0");
        assert.equal(p.vertexColor, undefined);
    });

    it("should throw on unknown element type", () => {
        assert.throws(() => parseParam("A;bogus;free;60,100"), /unknown element type/);
    });

    it("should throw on unknown construction name", () => {
        assert.throws(() => parseParam("A;point;bogus;60,100"), /unknown construction/);
    });

    it("should throw on too few fields", () => {
        assert.throws(() => parseParam("A;point"), /at least 4/);
    });
});
