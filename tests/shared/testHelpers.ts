/*----------------------------------------------------------------------+
|    Shared helpers for the per-element test suites.                    |
+----------------------------------------------------------------------*/

import * as assert from "assert";
import {Slate} from "../../src/Slate";
import {IConstructionInfo} from "../../src/index";

export let almostEqual = function (actual: number, expected: number, precision: number) {
    return assert.equal(
        Math.abs(actual - expected) < precision,
        true,
        "expected: " + expected + " actual: " + actual + " tolerance: " + precision);
};

export function toElements(slate: Slate, data: IConstructionInfo[]) {
    return data.map(
        cld => slate.createElement(cld.construction, cld.params, cld.name)
    );
}
