// Verifies the slide-data API on init() + the pure-data
// computeSlideState helper that the Presentation overlay calls per
// slide. Tests run without any DOM — the overlay UI is exercised
// manually (see issue #75 validation matrix).

import "mocha";
import * as assert from "assert";
import {parseCaptionTokens} from "../src/SlateControls";
import {createCanvas} from "canvas";
import {init, slates, ISlide, IConstructionInfo} from "../src/index";
import {computeSlideState} from "../src/slideshow";

// Mock the minimum DOM that init() needs.
function withFakeDOM<T>(fn: (canvasId: string) => T): T {
    const canvasId = "test_canvas_" + Math.random().toString(36).slice(2);
    const fake = createCanvas(300, 300) as any;
    fake.id = canvasId;
    fake.style = {};
    fake.getBoundingClientRect = () => ({ width: 300, height: 300 });
    fake.addEventListener = () => {};
    (global as any).window = global;
    (global as any).document = {
        getElementById: (id: string) => (id === canvasId ? fake : null),
    };
    (global as any).HTMLCanvasElement = function() {};
    try {
        return fn(canvasId);
    } finally {
        delete (global as any).window;
        delete (global as any).document;
        delete (global as any).HTMLCanvasElement;
    }
}

const propI1_elements = [
    "A;point;free;50,50",
    "B;point;free;150,50",
    "AB;line;connect;A,B",
    "BCD;circle;radius;A,B",
    "ACE;circle;radius;B,A",
];

describe("ISlide on init() (issue #75)", () => {

    beforeEach(() => {
        // init() pushes onto a module-global slates[] — clear between
        // tests so we can find the new slate at slates[0].
        slates.length = 0;
    });

    it("init({ slides: [...] }) populates slate.slides", () => {
        const slides: ISlide[] = [
            { text: "Step 1", visible: ["A","B"] },
            { text: "Step 2", visible: ["A","B","AB"] },
        ];
        withFakeDOM((canvasId) => {
            init({
                canvasid: canvasId,
                background: "0,0,100",
                title: "test",
                elements: propI1_elements,
                slides,
            });
        });
        assert.strictEqual(slates.length, 1);
        assert.strictEqual(slates[0].slides.length, 2);
        assert.strictEqual(slates[0].slides[0].text, "Step 1");
    });

    it("slate.slides defaults to [] when no slides field is passed", () => {
        withFakeDOM((canvasId) => {
            init({
                canvasid: canvasId,
                background: "0,0,100",
                title: "test",
                elements: propI1_elements,
            });
        });
        assert.deepStrictEqual(slates[0].slides, []);
    });

    it("init({ resolveJustification: fn }) stashes the callback", () => {
        const fn = (ref: string) => "/lookup/" + ref;
        withFakeDOM((canvasId) => {
            init({
                canvasid: canvasId,
                background: "0,0,100",
                title: "test",
                elements: propI1_elements,
                resolveJustification: fn,
            });
        });
        assert.strictEqual(slates[0].resolveJustification, fn);
        assert.strictEqual(slates[0].resolveJustification("I.Post.3"), "/lookup/I.Post.3");
    });

    it("resolveJustification defaults to null when not passed", () => {
        withFakeDOM((canvasId) => {
            init({
                canvasid: canvasId,
                background: "0,0,100",
                title: "test",
                elements: propI1_elements,
            });
        });
        assert.strictEqual(slates[0].resolveJustification, null);
    });

    it("init({ deferDraggables: [...] }) populates slate.deferredDraggables", () => {
        withFakeDOM((canvasId) => {
            init({
                canvasid: canvasId,
                background: "0,0,100",
                title: "test",
                elements: propI1_elements,
                deferDraggables: ["A"],
            });
        });
        assert.ok(slates[0].deferredDraggables.has("A"));
    });
});

describe("computeSlideState (issue #75)", () => {

    beforeEach(() => { slates.length = 0; });

    function makeSlate(slides: ISlide[]) {
        withFakeDOM((canvasId) => {
            init({
                canvasid: canvasId,
                background: "0,0,100",
                title: "test",
                elements: propI1_elements,
                slides,
            });
        });
        return slates[0];
    }

    it("visible inherits from the previous slide when omitted", () => {
        const slides: ISlide[] = [
            { text: "1", visible: ["AB","BCD"] },
            { text: "2" },                                // inherits
            { text: "3", visible: ["AB","BCD","ACE"] },
        ];
        const slate = makeSlate(slides);
        const s1 = computeSlideState(slate, slides, 1);
        // slide 2 inherits slide 1's ["AB","BCD"]; plus draggable
        // free points A, B auto-unioned.
        assert.ok(s1.visible.has("AB"));
        assert.ok(s1.visible.has("BCD"));
        assert.ok(!s1.visible.has("ACE"));
    });

    it("highlighted defaults to [] and does not persist", () => {
        const slides: ISlide[] = [
            { text: "1", visible: ["AB"], highlighted: ["AB"] },
            { text: "2", visible: ["AB"] },
        ];
        const slate = makeSlate(slides);
        const s0 = computeSlideState(slate, slides, 0);
        const s1 = computeSlideState(slate, slides, 1);
        assert.ok(s0.highlighted.has("AB"));
        assert.strictEqual(s1.highlighted.size, 0);
    });

    it("draggable elements are auto-unioned into visible", () => {
        const slides: ISlide[] = [
            { text: "1", visible: ["AB"] },  // doesn't list A, B
        ];
        const slate = makeSlate(slides);
        const s = computeSlideState(slate, slides, 0);
        // A and B are free points (draggable) — should be in visible
        // even though the slide didn't list them.
        assert.ok(s.visible.has("A"), "A should auto-include (draggable)");
        assert.ok(s.visible.has("B"), "B should auto-include (draggable)");
    });

    it("highlighted elements are auto-unioned into visible", () => {
        const slides: ISlide[] = [
            { text: "1", visible: ["AB"], highlighted: ["BCD"] },
        ];
        const slate = makeSlate(slides);
        const s = computeSlideState(slate, slides, 0);
        assert.ok(s.visible.has("BCD"), "highlighted BCD should auto-include in visible");
    });

    it("deferred draggables follow visible sets instead of auto-union (issue #89)", () => {
        const slides: ISlide[] = [
            { text: "1", visible: ["AB"] },           // B not listed
            { text: "2", visible: ["AB","B"] },       // B's moment
        ];
        const slate = makeSlate(slides);
        slate.deferDraggables(["B"]);
        const s0 = computeSlideState(slate, slides, 0);
        assert.ok(!s0.visible.has("B"),
            "deferred draggable B should stay hidden until listed");
        assert.ok(s0.visible.has("A"),
            "non-deferred draggable A still auto-includes");
        const s1 = computeSlideState(slate, slides, 1);
        assert.ok(s1.visible.has("B"),
            "B appears once a slide's visible set lists it");
    });

    it("initial state with no explicit visible array is hide-all (plus draggable)", () => {
        const slides: ISlide[] = [
            { text: "1" },  // no visible declared anywhere
        ];
        const slate = makeSlate(slides);
        const s = computeSlideState(slate, slides, 0);
        // Only the draggable A, B should appear; AB, BCD, ACE all
        // hidden.
        assert.ok(s.visible.has("A"));
        assert.ok(s.visible.has("B"));
        assert.ok(!s.visible.has("AB"));
        assert.ok(!s.visible.has("BCD"));
    });
});

// #136 — caption token grammar. The DISPLAY half of a {display|element}
// override may be a whole phrase; the element half stays strict because it
// has to resolve against the slate.
describe("parseCaptionTokens (#136)", () => {

    const refs = (text: string) =>
        parseCaptionTokens(text)
            .filter(t => t.kind === "ref")
            .map(t => `${(t as any).display}->${(t as any).target}`);

    it("keeps a bare token binding display and target together", () => {
        assert.deepEqual(refs("Join {AB} and {CD}."), ["AB->AB", "CD->CD"]);
    });

    it("keeps the single-word display override (#90)", () => {
        assert.deepEqual(refs("the angle {ABC|angBint}"), ["ABC->angBint"]);
    });

    it("accepts a multi-word display — the case that filed the ticket", () => {
        // From I.31. Before this, the whole token leaked into the caption
        // verbatim as "{the side from D to A|sideDA}", so decks bound a
        // single keyword inside the phrase instead.
        assert.deepEqual(
            refs("Produce {the side from D to A|sideDA} to meet it."),
            ["the side from D to A->sideDA"]);
    });

    it("keeps the surrounding prose intact around a phrase ref", () => {
        const toks = parseCaptionTokens("Produce {the side from D to A|sideDA} to meet it.");
        assert.deepEqual(toks.map(t => t.kind), ["text", "ref", "text"]);
        assert.equal((toks[0] as any).text, "Produce ");
        assert.equal((toks[2] as any).text, " to meet it.");
    });

    it("still requires the element half to look like a name", () => {
        // A strict target is what makes the display half safe to widen: the
        // second group can never swallow prose.
        assert.deepEqual(refs("{some words|not a name}"), []);
        assert.deepEqual(refs("{display|9bad}"), []);
    });

    it("does not let a display run across the closing brace", () => {
        assert.deepEqual(refs("{a|X} and {b|Y}"), ["a->X", "b->Y"]);
    });

    it("handles several refs and adjacent tokens", () => {
        assert.deepEqual(
            refs("{AB}{the base|BC} then {angle ABC|angB}."),
            ["AB->AB", "the base->BC", "angle ABC->angB"]);
    });

    it("leaves text with no tokens as a single run", () => {
        const toks = parseCaptionTokens("No refs here at all.");
        assert.deepEqual(toks, [{ kind: "text", text: "No refs here at all." }]);
    });

    it("is not stateful across calls", () => {
        // A module-level regex with /g carries lastIndex between calls; the
        // tokenizer must build its own each time or every second caption
        // would tokenize from the wrong offset.
        const once = refs("{AB} and {CD}");
        const twice = refs("{AB} and {CD}");
        assert.deepEqual(once, twice);
    });
});
