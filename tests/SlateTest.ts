import "mocha";
import * as assert from "assert";
import paper = require('paper');
import {Slate} from "../src/Slate";
import {E} from "../src/index";

describe("slate", ()=> {
    it("should create a free point", () => {
        let slate : Slate = new Slate();
        let e = slate.createElement(E.Point.free, [100,100], "A");
        console.log("Newly created element", e);

        assert.ok(true);

    });
});
