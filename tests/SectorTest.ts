import "mocha";
import * as assert from "assert";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {PointElement} from "../src/elements/point/PointElement";
import {ArcElement} from "../src/elements/sector/ArcElement";
import {createCanvas} from "canvas";
import {almostEqual, toElements} from "./shared/testHelpers";

describe("sector", () => {

    // Book III, Prop 2 — arc through three points
    // A=(50,130), E=(70,210), B=(120,200)
    // Expected center: (86.667, 163.333), radius ≈ 49.554
    let arc_propIII2_data: IConstructionInfo[] = [
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
        // 90° CCW around A=(50,130): ac=0, as=1
        arc.rotate(A, 0, 1);
        almostEqual(arc._Center.x, 16.667, 0.01);
        almostEqual(arc._Center.y, 166.667, 0.01);
        let M = slate.lookupElement("E") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        almostEqual(A.x, 50,  0.001); almostEqual(A.y, 130, 0.001);
        almostEqual(M.x, 70,  0.001); almostEqual(M.y, 210, 0.001);
        almostEqual(B.x, 120, 0.001); almostEqual(B.y, 200, 0.001);
    });

    it("should create an arc with explicit plane (3D variant)", () => {
        let data: IConstructionInfo[] = [
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
});
