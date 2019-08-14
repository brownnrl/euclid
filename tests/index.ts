import "mocha";
import * as assert from "assert";
import {Clock} from "../dist/index";

describe("index", ()=> {
    it("should say 'hello world'", () => {
        (new Clock(null)).HelloWorld();
       assert.ok(true);
    });
});