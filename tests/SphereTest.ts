import "mocha";
import * as assert from "assert";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {PointElement} from "../src/elements/point/PointElement";
import {SphereElement} from "../src/elements/sphere/SphereElement";
import {createCanvas} from "canvas";
import {almostEqual, toElements} from "./shared/testHelpers";

describe("sphere", () => {

    let sphere_data: IConstructionInfo[] = [
        { construction: E.Point.free,    name: "A",       params: [60, 30] },
        { construction: E.Point.free,    name: "B",       params: [60, 200] },
        { construction: E.Sphere.radius, name: "Asphere", params: ["A", "B"] },
    ];

    it("should create a sphere", () => {
        let slate: Slate = new Slate(createCanvas(200, 200));
        toElements(slate, sphere_data);
        slate.elements.forEach(e => e.update());
        // Mirrors the original smoke test — just ensures the construction
        // pipeline doesn't throw for sphere;radius + free points.
        assert.ok(slate.lookupElement("Asphere") != null);
    });

    // point;center (sphere) — returns sphere center
    it("should return the center of a sphere", () => {
        let data: IConstructionInfo[] = [
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

    // sphere;radius 3-point — sphere at A with radius |BC|
    it("should create a 3-point sphere with radius |BC|", () => {
        let data: IConstructionInfo[] = [
            { name: "A", construction: E.Point.fixed, params: [100, 100, 0] },
            { name: "B", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [60, 80, 0] },
            { name: "S", construction: E.Sphere.radius, params: ["A", "B", "C"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        let sphere = slate.lookupElement("S") as SphereElement;
        almostEqual(sphere.radius(), 100, 0.01);
    });
});
