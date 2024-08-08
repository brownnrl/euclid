import "mocha";
import * as assert from "assert";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {PlaneSlider} from "../src/elements/point/PlaneSlider";
import {PointElement} from "../src/elements/point/PointElement";
import {CircleSlider} from "../src/elements/point/CircleSlider";
import {PlaneElement} from "../src/elements/plane/PlaneElement";
import {LineElement} from "../src/elements/line/LineElement";
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
