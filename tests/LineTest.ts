import "mocha";
import * as assert from "assert";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {PointElement} from "../src/elements/point/PointElement";
import {LineElement} from "../src/elements/line/LineElement";
import {CircumcircleElement} from "../src/elements/circle/CircumcircleElement";
import {Chord} from "../src/elements/line/Chord";
import {createCanvas} from "canvas";
import {almostEqual, toElements} from "./shared/testHelpers";

describe("line", () => {

    let connected_line_data: IConstructionInfo[] = [
        { construction: E.Point.free,   name: "A",  params: [10, 100] },
        { construction: E.Point.free,   name: "B",  params: [100, 100] },
        { construction: E.Line.connect, name: "AB", params: ["A", "B"] },
    ];

    it("should create a connection as a LineElement", () => {
        let slate: Slate = new Slate(createCanvas(200, 200));
        let elms = toElements(slate, connected_line_data);
        let p1 = elms[0] as PointElement;
        let p2 = elms[1] as PointElement;
        let l1 = elms[2] as LineElement;
        assert.ok(p1 == l1.A);
        assert.ok(p2 == l1.B);
    });

    // Book III, Prop 25a — circumcenter via perpendicular bisector lineSlider
    let circumcenter_data: IConstructionInfo[] = [
        { construction: E.Point.free,        name: "A",  params: [60, 30] },
        { construction: E.Point.free,        name: "C",  params: [60, 200] },
        { construction: E.Line.connect,      name: "AC", params: ["A", "C"] },
        { construction: E.Point.midpoint,    name: "D",  params: ["AC"] },
        { construction: E.Line.perpendicular,name: "DB", params: ["D", "A"] },
        { construction: E.Point.lineSlider,  name: "B",  params: ["DB", 30, 115] },
        { construction: E.Point.circumcenter,name: "E",  params: ["A", "B", "C"] },
    ];

    it("should create a circumcenter and line perpendicular element", () => {
        let slate: Slate = new Slate(createCanvas(200, 200));
        let elms = toElements(slate, circumcenter_data);
        slate.elements.forEach(e => e.update());
        let allElms = slate.elements;
        let n = allElms.length;
        let pcircle = allElms[n - 2] as CircumcircleElement;
        let pcenter = allElms[n - 1] as PointElement;
        assert.equal(pcircle.Center, pcenter);
        almostEqual(pcenter.x, 165, 1);
        almostEqual(pcenter.y, 115, 1);
    });

    // Book I, Prop 12 — chord of circle cut by a line
    // Hand-computed: chord.A = (82.540, 180), chord.B = (237.460, 180)
    let chord_propI12_data: IConstructionInfo[] = [
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
        let center = slate.lookupElement("C") as PointElement;
        let r = Math.sqrt(8500);
        almostEqual(chord.A.distance(center), r, 0.001);
        almostEqual(chord.B.distance(center), r, 0.001);
    });

    it("should NaN the chord when the line misses the circle entirely", () => {
        let miss_data: IConstructionInfo[] = [
            { name: "A",   construction: E.Point.free,    params: [30, 180] },
            { name: "B",   construction: E.Point.free,    params: [290, 180] },
            { name: "AB",  construction: E.Line.connect,  params: ["A", "B"] },
            { name: "C",   construction: E.Point.free,    params: [160, 10] },
            { name: "D",   construction: E.Point.free,    params: [165, 20] },
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
        // 90° CCW rotation around A: expected chord.A=(30, 232.540), chord.B=(30, 387.460)
        chord.rotate(A, 0, 1);
        almostEqual(chord.A.x,  30.000, 0.01);
        almostEqual(chord.A.y, 232.540, 0.01);
        almostEqual(chord.B.x,  30.000, 0.01);
        almostEqual(chord.B.y, 387.460, 0.01);
        let B = slate.lookupElement("B") as PointElement;
        let C = slate.lookupElement("C") as PointElement;
        let D = slate.lookupElement("D") as PointElement;
        almostEqual(A.x,  30, 0.001); almostEqual(A.y, 180, 0.001);
        almostEqual(B.x, 290, 0.001); almostEqual(B.y, 180, 0.001);
        almostEqual(C.x, 160, 0.001); almostEqual(C.y, 130, 0.001);
        almostEqual(D.x, 180, 0.001); almostEqual(D.y, 220, 0.001);
    });

    let parallel_data: IConstructionInfo[] = [
        { name: "A",  construction: E.Point.free,     params: [50, 100] },
        { name: "B",  construction: E.Point.free,     params: [100, 100] },
        { name: "C",  construction: E.Point.free,     params: [200, 200] },
        { name: "AD", construction: E.Line.parallel,  params: ["A", "B", "C"] },
    ];

    it("should compute a line through A parallel and equal to BC", () => {
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, parallel_data);
        slate.elements.forEach(e => e.update());
        let line = slate.lookupElement("AD") as LineElement;
        almostEqual(line.A.x,  50, 0.01);
        almostEqual(line.A.y, 100, 0.01);
        almostEqual(line.B.x, 150, 0.01);
        almostEqual(line.B.y, 200, 0.01);
    });

    it("should recompute the parallel line when an input point moves", () => {
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, parallel_data);
        slate.elements.forEach(e => e.update());
        let C = slate.lookupElement("C") as PointElement;
        C.x = 250; C.y = 150;
        slate.elements.forEach(e => e.update());
        let line = slate.lookupElement("AD") as LineElement;
        almostEqual(line.A.x,  50, 0.01);
        almostEqual(line.A.y, 100, 0.01);
        almostEqual(line.B.x, 200, 0.01);
        almostEqual(line.B.y, 150, 0.01);
    });

    // line;foot (2D)
    it("should compute a line from A to the foot of the perpendicular on BC", () => {
        let data: IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [100, 50] },
            { name: "B", construction: E.Point.free, params: [50, 200] },
            { name: "C", construction: E.Point.free, params: [250, 200] },
            { name: "AL", construction: E.Line.foot, params: ["A", "B", "C"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let line = slate.lookupElement("AL") as LineElement;
        almostEqual(line.A.x, 100, 0.01);
        almostEqual(line.A.y,  50, 0.01);
        almostEqual(line.B.x, 100, 0.01);
        almostEqual(line.B.y, 200, 0.01);
        let dx_line = line.B.x - line.A.x;
        let dy_line = line.B.y - line.A.y;
        let dx_bc = 250 - 50;
        let dy_bc = 0;
        almostEqual(dx_line * dx_bc + dy_line * dy_bc, 0, 0.01);
    });

    // line;similar
    it("should create a similar line", () => {
        let data: IConstructionInfo[] = [
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
        almostEqual(line.A.x,  50, 0.01); almostEqual(line.A.y, 200, 0.01);
        almostEqual(line.B.x,  50, 0.01); almostEqual(line.B.y, 300, 0.01);
    });

    // line;cutoff
    it("should create a line cutoff equal to a given length", () => {
        let data: IConstructionInfo[] = [
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
        almostEqual(line.A.x, 50, 0.01);
        almostEqual(line.A.y, 100, 0.01);
        almostEqual(line.B.x, 110, 0.01);
        almostEqual(line.B.y, 100, 0.01);
    });

    it("should bisect a right angle and intersect the opposite side", () => {
        let data: IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [0, 100] },
            { name: "B", construction: E.Point.free, params: [0, 0] },
            { name: "C", construction: E.Point.free, params: [100, 0] },
            { name: "Bbis", construction: E.Line.angleBisector, params: ["A", "B", "C"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let line = slate.lookupElement("Bbis") as LineElement;
        almostEqual(line.A.x, 0, 0.01);
        almostEqual(line.A.y, 0, 0.01);
        almostEqual(line.B.x, 50, 0.01);
        almostEqual(line.B.y, 50, 0.01);
    });

    // line;proportion
    it("should compute a proportion line", () => {
        let data: IConstructionInfo[] = [
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
        almostEqual(line.A.x, 0, 0.01);
        almostEqual(line.A.y, 200, 0.01);
        almostEqual(line.B.x, 40, 0.01);
        almostEqual(line.B.y, 200, 0.01);
    });

    // line;foot (plane variant)
    it("should compute a line from a point to the foot on a plane", () => {
        let data: IConstructionInfo[] = [
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
        almostEqual(line.A.x, 50, 0.01);
        almostEqual(line.A.y, 50, 0.01);
        almostEqual(line.A.z, 100, 0.01);
        almostEqual(line.B.x, 50, 0.01);
        almostEqual(line.B.y, 50, 0.01);
        almostEqual(line.B.z, 0, 0.01);
    });

    // 3D signature variants
    it("should compute line angle bisector with explicit plane (3D variant)", () => {
        let data: IConstructionInfo[] = [
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

    it("should compute line angle divider with explicit plane (3D variant)", () => {
        let data: IConstructionInfo[] = [
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

    it("should compute a similar line with explicit planes (3D variant)", () => {
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
            { name: "L", construction: E.Line.similar, params: ["A", "B", "plane", "D", "Ep", "F", "plane"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let L = slate.lookupElement("L") as LineElement;
        almostEqual(L.A.x, 50, 0.1);
        assert.ok(!isNaN(L.B.x));
    });

    describe("drawName", () => {
        function buildLine(slate: Slate, opts: { nameColor?: string, name?: string } = {}): LineElement {
            let data: IConstructionInfo[] = [
                { construction: E.Point.free,   name: "A",  params: [40, 60] },
                { construction: E.Point.free,   name: "B",  params: [120, 200] },
                { construction: E.Line.connect, name: "AB", params: ["A", "B"] },
            ];
            toElements(slate, data);
            slate.elements.forEach(e => e.update());
            let line = slate.lookupElement("AB") as LineElement;
            if (opts.name !== undefined) line.name = opts.name;
            if (opts.nameColor !== undefined) line.nameColor = opts.nameColor;
            return line;
        }

        it("draws the label at the midpoint when nameColor and name are set", () => {
            let slate = new Slate(createCanvas(300, 300));
            let line = buildLine(slate, { name: "AB", nameColor: "black" });

            let calls: [number, number][] = [];
            (line as any).drawString = (ix: number, iy: number) => { calls.push([ix, iy]); };

            line.drawName(slate as any);

            assert.equal(calls.length, 1);
            assert.equal(calls[0][0], Math.round((40 + 120) / 2));
            assert.equal(calls[0][1], Math.round((60 + 200) / 2));
        });

        it("does nothing when nameColor is null", () => {
            let slate = new Slate(createCanvas(300, 300));
            let line = buildLine(slate, { name: "AB" });
            line.nameColor = null;

            let called = false;
            (line as any).drawString = () => { called = true; };

            line.drawName(slate as any);
            assert.equal(called, false);
        });

        it("does nothing when name is null", () => {
            let slate = new Slate(createCanvas(300, 300));
            let line = buildLine(slate, { nameColor: "black" });
            line.name = null;

            let called = false;
            (line as any).drawString = () => { called = true; };

            line.drawName(slate as any);
            assert.equal(called, false);
        });
    });
});
