import "mocha";
import * as assert from "assert";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {PlaneElement} from "../src/elements/plane/PlaneElement";
import {createCanvas} from "canvas";
import {almostEqual, toElements} from "./shared/testHelpers";

describe("plane", () => {

    // Book XI, Def 24
    let perpendicular_plane_data: IConstructionInfo[] = [
        { construction: E.Point.free,  name: "origin",  params: [70, 220] },
        { construction: E.Point.fixed, name: "z",       params: [70, 80, 100] },
        { construction: E.Plane.perpendicular, name: "xyplane", params: ["origin", "z"] },
    ];

    it("should create a perpendicular plane", () => {
        let slate: Slate = new Slate(createCanvas(200, 200));
        let elms = toElements(slate, perpendicular_plane_data);
        let p1 = elms[0] as PlaneElement;
        p1.update();
    });

    it("should create a parallel plane through a point", () => {
        let data: IConstructionInfo[] = [
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
        almostEqual(Q.A.x, 50, 0.01);
        almostEqual(Q.A.y, 50, 0.01);
        almostEqual(Q.A.z, 100, 0.01);
    });

    it("should create a plane through 3 points with computed S,T,U frame", () => {
        let data: IConstructionInfo[] = [
            { name: "A", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "B", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "P", construction: E.Plane.threePoints, params: ["A", "B", "C"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let plane = slate.lookupElement("P") as PlaneElement;
        almostEqual(plane.S.x, 1, 0.01); almostEqual(plane.S.y, 0, 0.01); almostEqual(plane.S.z, 0, 0.01);
        almostEqual(plane.T.x, 0, 0.01); almostEqual(plane.T.y, 1, 0.01); almostEqual(plane.T.z, 0, 0.01);
        almostEqual(plane.U.x, 0, 0.01); almostEqual(plane.U.y, 0, 0.01); almostEqual(plane.U.z, 1, 0.01);
    });

    // plane;ambient (point variant) — returns the ambient plane of a point
    it("should return the ambient plane of a point", () => {
        let data: IConstructionInfo[] = [
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
        assert.ok(ambient != null);
        assert.ok(ambient instanceof PlaneElement);
        almostEqual(ambient.S.x, 1, 0.01);
        almostEqual(ambient.S.y, 0, 0.01);
    });
});
