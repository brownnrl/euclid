import "mocha";
import * as assert from "assert";
import paper = require('paper');
import {Slate} from "../src/Slate";
import {E} from "../src/index";
import {PlaneSlider} from "../src/elements/point/PlaneSlider";
import {PointElement} from "../src/elements/point/PointElement";
import {LineElement} from "../src/elements/line/LineElement";

describe("slate", ()=> {
    it("should create a free point as a PlaneSlider", () => {
        let slate : Slate = new Slate();
        let e = slate.createElement(E.Point.free, [100,100], "A");
        assert.ok(e == slate.elements[slate.elements.length-1])
        assert.ok(e instanceof PlaneSlider);
        let ps : PlaneSlider = e as PlaneSlider;
        assert.ok(e.name == "A");
        assert.ok(ps.distance(new PointElement({x:100,y:100})) <= 0.001);
    });

    it("should create a connection as a LineElement", () => {
        let slate : Slate = new Slate();
        let p1 = slate.createElement(E.Point.free, [100,100], "A") as PointElement;
        let p2 = slate.createElement(E.Point.free, [10,100], "B") as PointElement;
        let l1 = slate.createElement(E.Line.connect, ["A", "B"], "AB") as LineElement;
        assert.ok(p1 == l1.A);
        assert.ok(p2 == l1.B);

    });
});
