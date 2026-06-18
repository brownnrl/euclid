import "mocha";
import * as assert from "assert";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {PointElement} from "../src/elements/point/PointElement";
import {PolygonElement} from "../src/elements/polygon/PolygonElement";
import {ApplicationElement} from "../src/elements/polygon/ApplicationElement";
import {createCanvas} from "canvas";
import {almostEqual, toElements} from "./shared/testHelpers";

describe("polygon", () => {

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
        const ab = Math.hypot(B.x - A.x, B.y - A.y);
        const ac = Math.hypot(C.x - A.x, C.y - A.y);
        const bc = Math.hypot(C.x - B.x, C.y - B.y);
        almostEqual(ac, ab, 1);
        almostEqual(bc, ab, 1);
        assert.ok(C.y < A.y);
    });

    // polygon;path — an open polyline (connected route) through points,
    // highlightable as one element; unlike a polygon it does not close (#121).
    describe("path (open polyline, #121)", () => {
        const route: IConstructionInfo[] = [
            { name: "A",   construction: E.Point.free,   params: [40, 60] },
            { name: "E",   construction: E.Point.free,   params: [120, 200] },
            { name: "B",   construction: E.Point.free,   params: [220, 60] },
            { name: "AEB", construction: E.Polygon.path,  params: ["A", "E", "B"] },
        ];
        function build(): Slate {
            const s = new Slate(createCanvas(300, 260));
            toElements(s, route);
            s.elements.forEach(e => e.update());
            return s;
        }
        // Render through a recording context; report segments + stroke colour.
        function spyDraw(el: any): { lineTo: number, stroke: string } {
            let lineTo = 0, stroke = "";
            const ctx: any = {
                beginPath() {}, moveTo() {}, stroke() {}, lineWidth: 0,
                lineTo() { lineTo++; },
                set strokeStyle(v: string) { stroke = v; }, get strokeStyle() { return stroke; },
            };
            el.drawEdge({ getContext: () => ctx } as any);
            return { lineTo, stroke };
        }

        it("builds a PolylineElement from the route points, defined", () => {
            const s = build();
            const p = s.lookupElement("AEB");
            assert.strictEqual(p.constructor.name, "PolylineElement");
            assert.ok(p.defined(), "path defined when its points are");
        });

        it("is open: three points draw two segments (A→E→B), no closing edge", () => {
            const s = build();
            const p = s.lookupElement("AEB");
            p.edgeColor = "black";
            assert.strictEqual(spyDraw(p).lineTo, 2, "two segments, not three");
        });

        it("strokes the highlight colour when emphasized", () => {
            const s = build();
            const p = s.lookupElement("AEB");
            p.edgeColor = "black";
            assert.strictEqual(spyDraw(p).stroke, "black", "rest colour when not emphasized");
            p.emphasized = true;
            assert.strictEqual(spyDraw(p).stroke, "#FFD700", "gold when emphasized");
        });
    });

    // polygon;parallelogram — propI34 fixture
    let pgram_propI34_data: IConstructionInfo[] = [
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
        assert.equal(poly.V.length, 4);
        almostEqual(poly.V[0].x,  50, 0.01); almostEqual(poly.V[0].y, 175, 0.01);
        almostEqual(poly.V[1].x,  90, 0.01); almostEqual(poly.V[1].y,  50, 0.01);
        almostEqual(poly.V[2].x, 250, 0.01); almostEqual(poly.V[2].y,  50, 0.01);
        almostEqual(poly.V[3].x, 210, 0.01); almostEqual(poly.V[3].y, 175, 0.01);
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

    it("should create a parallelogram with the same area as the input polygon", () => {
        let data: IConstructionInfo[] = [
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
        almostEqual(app.V[0].x,  50, 0.01); almostEqual(app.V[0].y, 200, 0.01);
        almostEqual(app.V[1].x, 150, 0.01); almostEqual(app.V[1].y, 200, 0.01);
        almostEqual(app.V[3].x,  50, 0.01); almostEqual(app.V[3].y, 160, 0.01);
        almostEqual(app.V[2].x, 150, 0.01); almostEqual(app.V[2].y, 160, 0.01);
        almostEqual(app.area(), 4000, 1);
    });

    it("should create a similar triangle polygon", () => {
        let data: IConstructionInfo[] = [
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

    it("should compute a square with 4 vertices at right angles", () => {
        let data: IConstructionInfo[] = [
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
        let side = sq.V[0].distance(sq.V[1]);
        almostEqual(side, 120, 0.01);
        almostEqual(sq.V[1].distance(sq.V[2]), side, 0.01);
        almostEqual(sq.V[2].distance(sq.V[3]), side, 0.01);
        almostEqual(sq.V[3].distance(sq.V[0]), side, 0.01);
    });

    it("should create a regular pentagon with 5 equal sides", () => {
        let data: IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [100, 50] },
            { name: "B", construction: E.Point.free, params: [200, 50] },
            { name: "ABCDE", construction: E.Polygon.regularPolygon, params: ["A", "B", 5] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let poly = slate.lookupElement("ABCDE") as PolygonElement;
        assert.equal(poly.V.length, 5);
        let side = poly.V[0].distance(poly.V[1]);
        almostEqual(side, 100, 0.01);
        for (let i = 1; i < 5; i++) {
            almostEqual(poly.V[i].distance(poly.V[(i+1) % 5]), side, 0.01);
        }
    });

    it("should create a quadrilateral with 4 vertices", () => {
        let data: IConstructionInfo[] = [
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

    it("should create an octagon with 8 vertices", () => {
        let data: IConstructionInfo[] = [
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

    // polygon;starPolygon — {5/2} pentagram
    it("should create a star polygon (pentagram) with 5 vertices", () => {
        let data: IConstructionInfo[] = [
            { name: "A", construction: E.Point.free, params: [100, 50] },
            { name: "B", construction: E.Point.free, params: [200, 50] },
            { name: "S", construction: E.Polygon.starPolygon, params: ["A", "B", 5, 2] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let poly = slate.lookupElement("S") as PolygonElement;
        assert.equal(poly.V.length, 5);
        almostEqual(poly.V[0].x, 100, 0.01);
        almostEqual(poly.V[1].x, 200, 0.01);
        assert.ok(!isNaN(poly.V[2].x));
        assert.ok(!isNaN(poly.V[2].y));
    });

    // 3D signature variants
    it("should create an equilateral triangle with explicit plane (3D variant)", () => {
        let data: IConstructionInfo[] = [
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
        let side = tri.V[0].distance(tri.V[1]);
        almostEqual(side, 100, 0.01);
        almostEqual(tri.V[1].distance(tri.V[2]), side, 0.01);
        almostEqual(tri.V[2].distance(tri.V[0]), side, 0.01);
    });

    it("should create a square with explicit plane (3D variant)", () => {
        let data: IConstructionInfo[] = [
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

    it("should create a regular pentagon with explicit plane (3D variant)", () => {
        let data: IConstructionInfo[] = [
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

    it("should create a similar polygon with explicit planes (3D variant)", () => {
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
            { name: "T", construction: E.Polygon.similar, params: ["A", "B", "plane", "D", "Ep", "F", "plane"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let tri = slate.lookupElement("T") as PolygonElement;
        assert.equal(tri.V.length, 3);
        assert.ok(!isNaN(tri.V[2].x));
    });
});
