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

});
