import "mocha";
import * as assert from "assert";
import {E, parseParam} from "../src/index";

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
