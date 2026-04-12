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
