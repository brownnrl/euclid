// Verifies the SlateAnimator scheduler. Most assertions ride the
// reduced-motion fast path (synchronous finalise) so they don't need
// to spin a real rAF loop. A handful of async tests cover the
// cancel-mid-flight path.

import "mocha";
import * as assert from "assert";
import {createCanvas} from "canvas";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo, A} from "../src/index";
import {PointElement} from "../src/elements/point/PointElement";
import {LineElement} from "../src/elements/line/LineElement";
import {CircleElement} from "../src/elements/circle/CircleElement";
import {toElements} from "./shared/testHelpers";

// Headless slate skips drawElements (inTest = true) so the recording
// machinery isn't exercised; we just verify state transitions.
function buildSlate(data: IConstructionInfo[]): Slate {
    const slate = new Slate(createCanvas(400, 400));
    slate.inTest = true;
    toElements(slate, data);
    slate.elements.forEach(e => e.update());
    return slate;
}

const propI1: IConstructionInfo[] = [
    { construction: E.Point.free,    name: "A",   params: [125, 130] },
    { construction: E.Point.free,    name: "B",   params: [215, 130] },
    { construction: E.Line.connect,  name: "AB",  params: ["A", "B"] },
    { construction: E.Circle.radius, name: "BCD", params: ["A", "B"] },
    { construction: E.Circle.radius, name: "ACE", params: ["B", "A"] },
];

describe("SlateAnimator (issue #78)", () => {

    describe("reduced-motion fast path", () => {
        it("synchronously finalises every animation when reducedMotion is true", async () => {
            const slate = buildSlate(propI1);
            slate.animationConfig = { reducedMotion: true };
            const ab = slate.lookupElement("AB") as LineElement;
            const bcd = slate.lookupElement("BCD") as CircleElement;
            ab.drawProgress = 0;
            bcd.drawProgress = 0;
            ab.visible = false;
            bcd.visible = false;
            await slate.animateTo(
                new Set(["A","B","AB","BCD"]),
                new Set(),
                [
                    { elem: "AB",  name: A.Line.straightEdgeConnect },
                    { elem: "BCD", name: A.Circle.compass },
                ],
                "cascade",
            );
            assert.strictEqual(ab.drawProgress, 1, "AB should finalise to drawProgress=1");
            assert.strictEqual(bcd.drawProgress, 1, "BCD should finalise to drawProgress=1");
            assert.strictEqual(ab.visible, true);
            assert.strictEqual(bcd.visible, true);
        });

        it("synchronously finalises when speedMultiplier is 0", async () => {
            const slate = buildSlate(propI1);
            slate.animationConfig = { speedMultiplier: 0 };
            const ab = slate.lookupElement("AB") as LineElement;
            ab.drawProgress = 0;
            await slate.animateTo(
                new Set(["A","B","AB"]),
                new Set(),
                [{ elem: "AB", name: A.Line.straightEdgeConnect }],
                "cascade",
            );
            assert.strictEqual(ab.drawProgress, 1);
        });
    });

    describe("visibility / highlight wiring", () => {
        it("applies target visibility instantly to elements without an animation entry", async () => {
            const slate = buildSlate(propI1);
            slate.animationConfig = { reducedMotion: true };
            const ab = slate.lookupElement("AB") as LineElement;
            const ace = slate.lookupElement("ACE") as CircleElement;
            ab.visible = false;
            ace.visible = false;
            await slate.animateTo(
                new Set(["A","B","AB","ACE"]),
                new Set(),
                [{ elem: "AB", name: A.Line.straightEdgeConnect }],
                "cascade",
            );
            // ACE is in the visible set but has no animation entry —
            // animateTo flips it visible instantly with drawProgress=1.
            assert.strictEqual(ace.visible, true);
            assert.strictEqual(ace.drawProgress, 1);
        });

        it("applies highlighted state to every element regardless of animation", async () => {
            const slate = buildSlate(propI1);
            slate.animationConfig = { reducedMotion: true };
            const ab = slate.lookupElement("AB") as LineElement;
            ab.shouldHighlight = false;
            await slate.animateTo(
                new Set(["A","B","AB"]),
                new Set(["AB"]),
                [{ elem: "AB", name: A.Line.straightEdgeConnect }],
                "cascade",
            );
            assert.strictEqual(ab.shouldHighlight, true);
        });

        it("hides elements not in the target visible set", async () => {
            const slate = buildSlate(propI1);
            slate.animationConfig = { reducedMotion: true };
            const bcd = slate.lookupElement("BCD") as CircleElement;
            bcd.visible = true;
            await slate.animateTo(
                new Set(["A","B","AB"]),
                new Set(),
                [],
                "cascade",
            );
            assert.strictEqual(bcd.visible, false);
        });
    });

    describe("unknown animation lookup", () => {
        it("warn-and-falls-through to instant on an unknown name", async () => {
            const slate = buildSlate(propI1);
            slate.animationConfig = { reducedMotion: true };
            const ab = slate.lookupElement("AB") as LineElement;
            ab.drawProgress = 0;
            ab.visible = false;
            await slate.animateTo(
                new Set(["A","B","AB"]),
                new Set(),
                [{ elem: "AB", name: "Line.notARealAnimation" }],
                "cascade",
            );
            // Unknown → animateTo treats as no entry → instant flip.
            assert.strictEqual(ab.drawProgress, 1);
            assert.strictEqual(ab.visible, true);
        });

        it("warn-and-falls-through to instant on type mismatch", async () => {
            const slate = buildSlate(propI1);
            slate.animationConfig = { reducedMotion: true };
            const ab = slate.lookupElement("AB") as LineElement;
            ab.drawProgress = 0;
            ab.visible = false;
            await slate.animateTo(
                new Set(["A","B","AB"]),
                new Set(),
                // Circle.compass on a Line is a type mismatch.
                [{ elem: "AB", name: A.Circle.compass }],
                "cascade",
            );
            assert.strictEqual(ab.drawProgress, 1);
            assert.strictEqual(ab.visible, true);
        });
    });

    describe("cancel()", () => {
        it("finalises every step started so far + clears ephemerals", async () => {
            const slate = buildSlate(propI1);
            // Don't set reducedMotion — we want the async path so we
            // can cancel mid-flight.
            slate.animationConfig = {};
            const ab = slate.lookupElement("AB") as LineElement;
            ab.drawProgress = 0;
            ab.visible = false;
            // Kick off a run without awaiting it.
            const p = slate.animateTo(
                new Set(["A","B","AB"]),
                new Set(),
                [{ elem: "AB", name: A.Line.straightEdgeConnect }],
                "cascade",
            );
            // Cancel right away.
            slate.animator!.cancel();
            await p;
            assert.strictEqual(ab.drawProgress, 1);
            assert.strictEqual(ab.visible, true);
            assert.strictEqual(slate.ephemerals.length, 0);
        });
    });

    describe("A.instant", () => {
        it("finalises immediately without any tick activity", async () => {
            const slate = buildSlate(propI1);
            slate.animationConfig = { reducedMotion: true };
            const ab = slate.lookupElement("AB") as LineElement;
            ab.drawProgress = 0;
            ab.visible = false;
            await slate.animateTo(
                new Set(["A","B","AB"]),
                new Set(),
                [{ elem: "AB", name: A.instant }],
                "cascade",
            );
            assert.strictEqual(ab.drawProgress, 1);
            assert.strictEqual(ab.visible, true);
        });
    });

    describe("Slate ephemeral surface", () => {
        it("addEphemeral / removeEphemeral / clearEphemerals", () => {
            const slate = buildSlate(propI1);
            const helperA = new PointElement();
            const helperB = new PointElement();
            assert.strictEqual(slate.ephemerals.length, 0);
            slate.addEphemeral(helperA);
            slate.addEphemeral(helperB);
            assert.strictEqual(slate.ephemerals.length, 2);
            slate.removeEphemeral(helperA);
            assert.strictEqual(slate.ephemerals.length, 1);
            slate.clearEphemerals();
            assert.strictEqual(slate.ephemerals.length, 0);
        });
    });
});
