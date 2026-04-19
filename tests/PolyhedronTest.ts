import "mocha";
import * as assert from "assert";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {PolygonElement} from "../src/elements/polygon/PolygonElement";
import {createCanvas} from "canvas";
import {almostEqual, toElements} from "./shared/testHelpers";
import {buildSpecializedScene} from "./shared/dragScenes";

describe("polyhedron", () => {

    it("should create a tetrahedron with 4 triangular faces", () => {
        let data: IConstructionInfo[] = [
            { name: "A", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "B", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "C", construction: E.Point.fixed, params: [50, 87, 0] },
            { name: "D", construction: E.Point.fixed, params: [50, 29, 82] },
            { name: "T", construction: E.Polyhedra.tetrahedron, params: ["A", "B", "C", "D"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        let tetra = slate.lookupElement("T");
        assert.ok(tetra != null);
        assert.equal((tetra as any).P.length, 4);
    });

    it("should create a prism with base+2 triangles and 3 side quads", () => {
        let data: IConstructionInfo[] = [
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
        assert.equal((prism as any).P.length, 5);
        let top = (prism as any).P[1] as PolygonElement;
        almostEqual(top.V[0].z, 100, 0.01);
        almostEqual(top.V[1].z, 100, 0.01);
        almostEqual(top.V[2].z, 100, 0.01);
    });

    it("should create a parallelepiped with 6 faces", () => {
        let data: IConstructionInfo[] = [
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
        assert.equal((pp as any).P.length, 6);
    });

    it("PolyhedronElement.drawVertex should render face vertices when vertexColor is set", () => {
        let slate = buildSpecializedScene();
        let pep = slate.lookupElement("pep");  // parallelepiped
        assert.ok(pep != null, "parallelepiped should exist");
        pep.vertexColor = "black";
        pep.drawVertex(createCanvas(300, 300) as any);
    });
});
