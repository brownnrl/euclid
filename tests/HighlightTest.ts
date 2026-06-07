// Verifies the highlight-rendering contracts that consumers of geomlib
// rely on: flipping shouldHighlight on an element makes the next draw
// use the element's *HighlightColor on the correct canvas attribute
// (strokeStyle for edges, fillStyle for vertex fills), and the
// PointElement vertex marker grows when highlighted so it actually
// reads on the canvas. Issue #72.

import "mocha";
import * as assert from "assert";
import {createCanvas} from "canvas";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {PointElement} from "../src/elements/point/PointElement";
import {LineElement} from "../src/elements/line/LineElement";
import {CircleElement} from "../src/elements/circle/CircleElement";
import {toElements} from "./shared/testHelpers";

// Build a canvas whose getContext returns a proxy that records every
// strokeStyle / fillStyle assignment plus every arc() radius. Lets a
// test assert "the highlight color reached strokeStyle (not fillStyle)"
// without inspecting canvas pixels.
function recordingCanvas(w: number, h: number) {
    const real = createCanvas(w, h);
    const recorded = {
        strokeStyles: [] as string[],
        fillStyles:   [] as string[],
        arcRadii:     [] as number[],
    };
    // Re-wire the proxy to push into the recorded object instead of
    // proxy-local arrays so the test can read them back.
    const ctx: any = new Proxy(real.getContext("2d") as any, {
        set(target, prop, value) {
            if (prop === "strokeStyle") recorded.strokeStyles.push(value);
            if (prop === "fillStyle")   recorded.fillStyles.push(value);
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

describe("highlight rendering (issue #72)", () => {

    const triangle_data: IConstructionInfo[] = [
        { construction: E.Point.free,   name: "A",  params: [50, 50] },
        { construction: E.Point.free,   name: "B",  params: [150, 50] },
        { construction: E.Line.connect, name: "AB", params: ["A", "B"] },
        { construction: E.Circle.radius, name: "Acirc", params: ["A", "B"] },
    ];

    describe("LineElement.drawEdge", () => {
        it("uses strokeStyle (not fillStyle) for the highlight color", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            const line = slate.lookupElement("AB") as LineElement;
            line.edgeHighlightColor = "#ABCDEF";
            line.shouldHighlight = true;

            const r = recordingCanvas(200, 200);
            line.drawEdge(r.canvas);

            assert.ok(
                r.recorded.strokeStyles.includes("#ABCDEF"),
                `expected #ABCDEF on strokeStyle; got strokeStyles=${JSON.stringify(r.recorded.strokeStyles)}, fillStyles=${JSON.stringify(r.recorded.fillStyles)}`
            );
            assert.ok(
                !r.recorded.fillStyles.includes("#ABCDEF"),
                "highlight color should not leak onto fillStyle"
            );
        });

        it("uses strokeStyle for the normal edge color when not highlighted", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            const line = slate.lookupElement("AB") as LineElement;
            line.edgeColor = "#123456";
            line.shouldHighlight = false;

            const r = recordingCanvas(200, 200);
            line.drawEdge(r.canvas);

            assert.ok(
                r.recorded.strokeStyles.includes("#123456"),
                "edge color should reach strokeStyle"
            );
        });
    });

    describe("CircleElement.drawEdge", () => {
        it("uses edgeHighlightColor when shouldHighlight is true", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            slate.elements.forEach(e => e.update());
            const circle = slate.lookupElement("Acirc") as CircleElement;
            circle.edgeColor = "#000000";
            circle.edgeHighlightColor = "#ABCDEF";
            circle.shouldHighlight = true;

            const r = recordingCanvas(200, 200);
            circle.drawEdge(r.canvas);

            assert.ok(
                r.recorded.strokeStyles.includes("#ABCDEF"),
                `expected #ABCDEF on strokeStyle; got ${JSON.stringify(r.recorded.strokeStyles)}`
            );
        });

        it("uses edgeColor when shouldHighlight is false", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            slate.elements.forEach(e => e.update());
            const circle = slate.lookupElement("Acirc") as CircleElement;
            circle.edgeColor = "#123456";
            circle.edgeHighlightColor = "#ABCDEF";
            circle.shouldHighlight = false;

            const r = recordingCanvas(200, 200);
            circle.drawEdge(r.canvas);

            assert.ok(
                r.recorded.strokeStyles.includes("#123456"),
                "edge color should reach strokeStyle"
            );
            assert.ok(
                !r.recorded.strokeStyles.includes("#ABCDEF"),
                "highlight color must not be used when shouldHighlight=false"
            );
        });
    });

    describe("PointElement.drawVertex", () => {
        it("uses vertexHighlightColor with a larger radius when highlighted", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            const pt = slate.lookupElement("A") as PointElement;
            pt.vertexColor = "#000000";
            pt.vertexHighlightColor = "#ABCDEF";
            pt.shouldHighlight = true;

            const r = recordingCanvas(200, 200);
            pt.drawVertex(r.canvas as any);

            assert.ok(
                r.recorded.fillStyles.includes("#ABCDEF"),
                "highlight color should reach fillStyle"
            );
            const lastRadius = r.recorded.arcRadii[r.recorded.arcRadii.length - 1];
            assert.ok(
                lastRadius > 2,
                `highlighted vertex should be larger than the normal 2px dot; got r=${lastRadius}`
            );
        });

        it("uses the small radius with vertexColor when not highlighted", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            const pt = slate.lookupElement("A") as PointElement;
            pt.vertexColor = "#123456";
            pt.shouldHighlight = false;

            const r = recordingCanvas(200, 200);
            pt.drawVertex(r.canvas as any);

            assert.ok(r.recorded.fillStyles.includes("#123456"));
            assert.strictEqual(r.recorded.arcRadii[0], 2);
        });
    });

    describe("GeomElement highlight color defaults", () => {
        it("defaults edge + vertex highlights to a high-contrast amber", () => {
            const slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            const pt = slate.lookupElement("A") as PointElement;
            const line = slate.lookupElement("AB") as LineElement;
            const circle = slate.lookupElement("Acirc") as CircleElement;
            // Material amber #FFC107 — readable on the cream theorem
            // background the Lektor site uses.
            assert.strictEqual(pt.vertexHighlightColor, "#FFC107");
            assert.strictEqual(line.edgeHighlightColor,  "#FFC107");
            assert.strictEqual(circle.edgeHighlightColor, "#FFC107");
        });
    });
});
