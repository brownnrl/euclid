import "mocha";
import * as assert from "assert";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {PointElement} from "../src/elements/point/PointElement";
import {PlaneElement} from "../src/elements/plane/PlaneElement";
import {CircleElement} from "../src/elements/circle/CircleElement";
import {CircumcircleElement} from "../src/elements/circle/CircumcircleElement";
import {createCanvas} from "canvas";
import {almostEqual, toElements} from "./shared/testHelpers";

describe("circle", () => {

    let circle_center_circumcircle_data: IConstructionInfo[] = [
        { construction: E.Point.free, name: "B", params: [150, 40] },
        { construction: E.Point.free, name: "F", params: [110, 100] },
        { construction: E.Point.free, name: "H", params: [190, 100] },
        { construction: E.Circle.circumcircle, name: "ABC", params: ["B", "F", "H"] },
        { construction: E.Point.center, name: "P", params: ["ABC"] },
    ];

    it("should create a circumcircle and center elements", () => {
        let slate: Slate = new Slate(createCanvas(200, 200));
        let elms = toElements(slate, circle_center_circumcircle_data);
        slate.elements.forEach(e => e.update());
        let p3 = elms[3] as CircumcircleElement;
        let p4 = elms[4] as PointElement;
        assert.equal(p3.Center, p4);
        almostEqual(p4.x, 150, 1);
        almostEqual(p4.y, 83, 1);
    });

    // circle;radius 3-point — circle at Center with radius = |A-B|
    it("should create a circle with center H and radius |GA| (3-point form)", () => {
        let data: IConstructionInfo[] = [
            { name: "G",   construction: E.Point.free,    params: [120, 115] },
            { name: "A",   construction: E.Point.free,    params: [75, 30] },
            { name: "H",   construction: E.Point.free,    params: [340, 115] },
            { name: "DEF", construction: E.Circle.radius, params: ["H", "G", "A"] },
        ];
        let slate = new Slate(createCanvas(500, 300));
        toElements(slate, data);
        let circle = slate.lookupElement("DEF") as CircleElement;
        almostEqual(circle.Center.x, 340, 0.01);
        almostEqual(circle.Center.y, 115, 0.01);
        let expectedRadius = Math.sqrt(45*45 + 85*85);
        almostEqual(circle.radius, expectedRadius, 0.01);
        assert.notEqual(circle.A, circle.Center);
    });

    // circle;intersection — intersection circle of two spheres
    it("should compute the intersection circle of two spheres", () => {
        let data: IConstructionInfo[] = [
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
        almostEqual(circle.Center.x, 50, 0.1);
        almostEqual(circle.Center.y, 0, 0.1);
        almostEqual(circle.radius, Math.sqrt(7500), 0.1);
    });

    it("should compute the inversion of a circle in another circle", () => {
        let data: IConstructionInfo[] = [
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
        assert.ok(!isNaN(inverted.Center.x));
        assert.ok(!isNaN(inverted.Center.y));
        assert.ok(inverted.radius > 0);
    });

    // 3D signature variants
    it("should create a circle with explicit plane (3D variant)", () => {
        let data: IConstructionInfo[] = [
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
        assert.ok(circle.AP != null);
    });

    it("should create a 3-point circle with explicit plane (3D variant)", () => {
        let data: IConstructionInfo[] = [
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

    // CircleElement._drawCircle has a degenerate branch for edge-on rendering
    // (minor axis < 0.5 px). Hand-craft a tilted AP to exercise it.
    it("CircleElement.drawEdge should handle an edge-on circle without throwing", () => {
        let canvas = createCanvas(100, 100);
        let center = new PointElement({x: 50, y: 50, z: 0});
        let B      = new PointElement({x: 51, y: 50, z: 0});

        let plane = new PlaneElement({
            A: new PointElement({x: 0, y: 0, z: 0}),
            B: new PointElement({x: 1, y: 0, z: 0}),
            C: new PointElement({x: 0, y: 1, z: 0}),
        });
        plane.S = new PointElement({x: 0.1, y: 0, z: 0.995});
        plane.T = new PointElement({x: 0,   y: 1, z: 0});
        plane.U = new PointElement({x: 1,   y: 0, z: 0});

        let circle = new CircleElement({C: center, A: center, B: B, AP: plane});
        circle.edgeColor = "black";
        circle.drawEdge(canvas as any);
    });
});
