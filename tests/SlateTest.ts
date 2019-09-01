import "mocha";
import * as assert from "assert";
import paper = require('paper');
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {PlaneSlider} from "../src/elements/point/PlaneSlider";
import {PointElement} from "../src/elements/point/PointElement";
import {LineElement} from "../src/elements/line/LineElement";
import {createCanvas} from "canvas";
import {create} from "domain";
import Color = paper.Color;

describe("slate", ()=> {

    let connected_line_data : IConstructionInfo[] = [
        { construction: E.Point.free,   name: "A",  params: [100,100]},
        { construction: E.Point.free,   name: "B",  params: [10,100]},
        { construction: E.Line.connect, name: "AB", params: ["A","B"]},
    ];

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

    it("should create a connection as a LineElement", () => {
        let slate : Slate = new Slate(createCanvas(200,200));
        let elms = toElements(slate, connected_line_data);
        let p1 = elms[0] as PointElement;
        let p2 = elms[1] as PointElement;
        let l1 = elms[2] as LineElement;
        assert.ok(p1 == l1.A);
        assert.ok(p2 == l1.B);
    });

    it("should facilitate updates", () => {
        let slate : Slate = new Slate(createCanvas(200,200));
        let elms = toElements(slate, connected_line_data);
        slate.elements.forEach(e => e.update());
    });

    it("should be able to find the closest visible point within a tolerance", () =>{
        let slate : Slate = new Slate(createCanvas(200,200));
        let elms = toElements(slate, connected_line_data);
        let A = slate.lookupElement("A") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        let red = new paper.Color("#FF0000");
        A.vertexColor = red;
        B.vertexColor = red;

        let P = slate.closestVisiblePoint(slate.elements,
                                  new PointElement({x:(10+100)/2 + 1, y:100}))
        assert(P.name == "B");
        P = slate.closestVisiblePoint(slate.elements,
            new PointElement({x:(10+100)/2 - 1, y:100}))
        assert(P.name == "A");
    });
});
