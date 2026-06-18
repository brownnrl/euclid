// Verifies the visibility contract: when an element's `visible` flag
// is false, every per-type draw method short-circuits and writes
// nothing to the canvas. Used by the slideshow presentation overlay
// (issue #75).

import "mocha";
import * as assert from "assert";
import {createCanvas} from "canvas";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {PointElement} from "../src/elements/point/PointElement";
import {LineElement} from "../src/elements/line/LineElement";
import {CircleElement} from "../src/elements/circle/CircleElement";
import {PolygonElement} from "../src/elements/polygon/PolygonElement";
import {toElements} from "./shared/testHelpers";

// Proxy around a canvas's CanvasRenderingContext2D that records every
// attribute assignment + every arc / fillText call. Same pattern as
// tests/HighlightTest.ts.
function recordingCanvas(w: number, h: number) {
    const real = createCanvas(w, h);
    const recorded = {
        strokeStyles: [] as string[],
        fillStyles:   [] as string[],
        lineWidths:   [] as number[],
        arcRadii:     [] as number[],
        textWrites:   [] as string[],
        moveTos:      [] as [number, number][],
    };
    const ctx: any = new Proxy(real.getContext("2d") as any, {
        set(target, prop, value) {
            if (prop === "strokeStyle") recorded.strokeStyles.push(value);
            if (prop === "fillStyle")   recorded.fillStyles.push(value);
            if (prop === "lineWidth")   recorded.lineWidths.push(value);
            (target as any)[prop] = value;
            return true;
        },
        get(target, prop) {
            if (prop === "arc") {
                return function(x: number, y: number, r: number, ...rest: any[]) {
                    recorded.arcRadii.push(r);
                    return (target as any).arc(x, y, r, ...rest);
                };
            }
            if (prop === "fillText") {
                return function(text: string, ...rest: any[]) {
                    recorded.textWrites.push(text);
                    return (target as any).fillText(text, ...rest);
                };
            }
            if (prop === "moveTo") {
                return function(x: number, y: number) {
                    recorded.moveTos.push([x, y]);
                    return (target as any).moveTo(x, y);
                };
            }
            const v = (target as any)[prop];
            return typeof v === "function" ? v.bind(target) : v;
        }
    });
    const fakeCanvas: any = {
        width: w,
        height: h,
        getContext: () => ctx,
    };
    return { canvas: fakeCanvas, recorded };
}

// True iff the recorder saw any canvas mutation that would result in
// a visible pixel change (style assignments, arcs, text writes,
// moveTo path setup).
function recordedAnyDraw(r: { strokeStyles: any[]; fillStyles: any[]; arcRadii: any[]; textWrites: any[]; moveTos: any[]; }): boolean {
    return r.strokeStyles.length + r.fillStyles.length + r.arcRadii.length + r.textWrites.length + r.moveTos.length > 0;
}

describe("element visibility (issue #75)", () => {

    const triangle_data: IConstructionInfo[] = [
        { construction: E.Point.free,   name: "A",  params: [50, 50] },
        { construction: E.Point.free,   name: "B",  params: [150, 50] },
        { construction: E.Line.connect, name: "AB", params: ["A", "B"] },
        { construction: E.Circle.radius, name: "Acirc", params: ["A", "B"] },
    ];

    describe("PointElement", () => {
        it("drawVertex writes nothing when visible=false", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            const pt = slate.lookupElement("A") as PointElement;
            pt.vertexColor = "#000000";
            pt.visible = false;
            const r = recordingCanvas(200, 200);
            pt.drawVertex(r.canvas as any);
            assert.ok(!recordedAnyDraw(r.recorded), `hidden point should make no canvas writes; got ${JSON.stringify(r.recorded)}`);
        });

        it("drawName writes nothing when visible=false", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            const pt = slate.lookupElement("A") as PointElement;
            pt.nameColor = "#000000";
            pt.visible = false;
            const r = recordingCanvas(200, 200);
            pt.drawName(r.canvas as any);
            assert.strictEqual(r.recorded.textWrites.length, 0, "hidden point should not draw its name");
        });

        it("drawVertex still draws when visible=true (regression guard)", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            const pt = slate.lookupElement("A") as PointElement;
            pt.vertexColor = "#000000";
            pt.visible = true;
            const r = recordingCanvas(200, 200);
            pt.drawVertex(r.canvas as any);
            assert.ok(r.recorded.arcRadii.length > 0, "visible point should arc its marker");
        });

        // #126 — a hidden point must stay hidden even when highlighted /
        // emphasised: being in a slide's `highlighted` set (or an alias of
        // one) must not force a point that is NOT in the visible set, or is a
        // not-yet-revealed deferred reveal target, to draw its dot or label.
        it("drawVertex writes nothing when visible=false even if highlighted (out-of-set apex)", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            const pt = slate.lookupElement("A") as PointElement;
            pt.vertexColor = "#000000";
            pt.visible = false;
            pt.shouldHighlight = true;   // highlighted but not in the visible set
            const r = recordingCanvas(200, 200);
            pt.drawVertex(r.canvas as any);
            assert.ok(!recordedAnyDraw(r.recorded),
                `hidden+highlighted point should make no canvas writes; got ${JSON.stringify(r.recorded)}`);
        });

        it("drawName writes nothing when visible=false even if highlighted (deferred reveal)", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            const pt = slate.lookupElement("A") as PointElement;
            pt.nameColor = "#000000";
            pt.visible = false;
            pt.shouldHighlight = true;
            pt.drawProgress = 0;         // deferred — not yet revealed by its appear step
            const r = recordingCanvas(200, 200);
            pt.drawName(r.canvas as any);
            assert.strictEqual(r.recorded.textWrites.length, 0,
                "a deferred highlighted point must not draw its label before its reveal");
        });

        it("drawVertex still draws (in highlight colour) when visible=true and highlighted", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            const pt = slate.lookupElement("A") as PointElement;
            pt.vertexColor = "#000000";
            pt.visible = true;
            pt.shouldHighlight = true;   // highlight styles a SHOWN point
            const r = recordingCanvas(200, 200);
            pt.drawVertex(r.canvas as any);
            assert.ok(r.recorded.arcRadii.length > 0, "visible highlighted point still draws its marker");
            assert.ok(r.recorded.fillStyles.includes("#FFD700"), "and in the highlight colour");
        });
    });

    describe("LineElement", () => {
        it("drawEdge writes nothing when visible=false", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            const line = slate.lookupElement("AB") as LineElement;
            line.edgeColor = "#000000";
            line.visible = false;
            const r = recordingCanvas(200, 200);
            line.drawEdge(r.canvas);
            assert.ok(!recordedAnyDraw(r.recorded));
        });
    });

    describe("CircleElement", () => {
        it("drawEdge writes nothing when visible=false", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            slate.elements.forEach(e => e.update());
            const c = slate.lookupElement("Acirc") as CircleElement;
            c.edgeColor = "#000000";
            c.visible = false;
            const r = recordingCanvas(200, 200);
            c.drawEdge(r.canvas);
            assert.ok(!recordedAnyDraw(r.recorded));
        });

        it("drawFace writes nothing when visible=false", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            slate.elements.forEach(e => e.update());
            const c = slate.lookupElement("Acirc") as CircleElement;
            c.faceColor = "#FF0000";
            c.visible = false;
            const r = recordingCanvas(200, 200);
            c.drawFace(r.canvas);
            assert.ok(!recordedAnyDraw(r.recorded));
        });
    });

    describe("PolygonElement", () => {
        const poly_data: IConstructionInfo[] = [
            { construction: E.Point.free,    name: "A",   params: [10, 10] },
            { construction: E.Point.free,    name: "B",   params: [100, 10] },
            { construction: E.Point.free,    name: "C",   params: [55, 80] },
            { construction: E.Polygon.triangle, name: "ABC", params: ["A","B","C"] },
        ];

        it("drawEdge writes nothing when visible=false", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, poly_data);
            const p = slate.lookupElement("ABC") as PolygonElement;
            p.edgeColor = "#000000";
            p.visible = false;
            const r = recordingCanvas(200, 200);
            p.drawEdge(r.canvas);
            assert.ok(!recordedAnyDraw(r.recorded));
        });

        it("drawFace writes nothing when visible=false", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, poly_data);
            const p = slate.lookupElement("ABC") as PolygonElement;
            p.faceColor = "#FF0000";
            p.visible = false;
            const r = recordingCanvas(200, 200);
            p.drawFace(r.canvas);
            assert.ok(!recordedAnyDraw(r.recorded));
        });
    });

    describe("Slate.setVisibleNames / clearVisibility", () => {
        it("hides every named element not in the supplied set", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            slate.setVisibleNames(["A", "AB"]);
            assert.strictEqual(slate.lookupElement("A").visible, true);
            assert.strictEqual(slate.lookupElement("AB").visible, true);
            assert.strictEqual(slate.lookupElement("B").visible, false);
            assert.strictEqual(slate.lookupElement("Acirc").visible, false);
        });

        it("clearVisibility restores everything", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            slate.setVisibleNames(["A"]);
            slate.clearVisibility();
            for (const e of slate.elements) {
                assert.strictEqual(e.visible, true);
            }
        });

        it("ignores unnamed elements (intermediate construction outputs)", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            slate.setVisibleNames(["A"]);
            // Any unnamed element should keep its default visible=true.
            // Named screen helpers (screen / screen_origin / etc.) do
            // flip, but render no visible pixels regardless because
            // their colours are null.
            for (const e of slate.elements) {
                if (e.name == null) assert.strictEqual(e.visible, true);
            }
        });
    });

    describe("defaults", () => {
        it("every element is visible by default", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            for (const e of slate.elements) {
                assert.strictEqual(e.visible, true, `element ${e.name} should default visible`);
            }
        });
    });
});
