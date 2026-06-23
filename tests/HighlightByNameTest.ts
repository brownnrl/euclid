// #130 — geomlib.highlightByName: light a named element across more than
// one canvas at once (multi-canvas propositions that share element names,
// e.g. I.26's two case triangles).

import "mocha";
import * as assert from "assert";
import {createCanvas} from "canvas";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo, slates, highlightByName} from "../src/index";
import {toElements} from "./shared/testHelpers";

function triangleSlate(id: string): Slate {
    const canvas = createCanvas(200, 200);
    (canvas as any).id = id;
    const slate = new Slate(canvas);
    const data: IConstructionInfo[] = [
        { construction: E.Point.free,        name: "A",   params: [40, 40] },
        { construction: E.Point.free,        name: "B",   params: [160, 40] },
        { construction: E.Point.free,        name: "C",   params: [100, 150] },
        { construction: E.Polygon.triangle,  name: "ABC", params: ["A", "B", "C"] },
    ];
    toElements(slate, data);
    slate.elements.forEach(e => e.update());
    return slate;
}

describe("highlightByName — cross-canvas highlight (#130)", () => {

    beforeEach(() => { slates.length = 0; });
    afterEach(() => { slates.length = 0; });

    it("lights the same named element in every canvas, and reports the count", () => {
        const s0 = triangleSlate("canvas_0");
        const s1 = triangleSlate("canvas_1");
        slates.push(s0, s1);

        const hits = highlightByName("ABC");
        assert.strictEqual(hits, 2, "found ABC in both canvases");
        assert.strictEqual(s0.lookupElement("ABC").emphasized, true);
        assert.strictEqual(s1.lookupElement("ABC").emphasized, true);
    });

    it("clears the highlight when on=false", () => {
        const s0 = triangleSlate("canvas_0");
        const s1 = triangleSlate("canvas_1");
        slates.push(s0, s1);

        highlightByName("ABC", true);
        highlightByName("ABC", false);
        assert.strictEqual(s0.lookupElement("ABC").emphasized, false);
        assert.strictEqual(s1.lookupElement("ABC").emphasized, false);
    });

    it("is alias-aware (a ref spelled CBA matches canonical ABC)", () => {
        const s0 = triangleSlate("canvas_0");
        s0.addAlias("CBA", "ABC");
        slates.push(s0);

        const hits = highlightByName("CBA");
        assert.strictEqual(hits, 1);
        assert.strictEqual(s0.lookupElement("ABC").emphasized, true);
    });

    it("scopes to the given canvas ids (unrelated figures on the page stay dark)", () => {
        const s0 = triangleSlate("canvas_0");
        const s1 = triangleSlate("canvas_1");
        const other = triangleSlate("other");  // a different proposition's figure
        slates.push(s0, s1, other);

        const hits = highlightByName("ABC", true, { canvasids: ["canvas_0", "canvas_1"] });
        assert.strictEqual(hits, 2, "only the two scoped canvases");
        assert.strictEqual(s0.lookupElement("ABC").emphasized, true);
        assert.strictEqual(s1.lookupElement("ABC").emphasized, true);
        assert.strictEqual(other.lookupElement("ABC").emphasized, false, "unscoped figure untouched");
    });

    it("returns 0 and touches nothing when the name is absent", () => {
        const s0 = triangleSlate("canvas_0");
        slates.push(s0);
        assert.strictEqual(highlightByName("ZZZ"), 0);
    });
});
