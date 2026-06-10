// Verifies the per-element drawProgress rendering contract: setting
// drawProgress < 1 on an element causes its drawEdge / drawFace /
// drawVertex to render only the corresponding partial geometry, while
// drawProgress = 1 (the default) reproduces the pre-animation
// behaviour bit-for-bit. Issue #78.

import "mocha";
import * as assert from "assert";
import {createCanvas} from "canvas";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {PointElement} from "../src/elements/point/PointElement";
import {LineElement} from "../src/elements/line/LineElement";
import {CircleElement} from "../src/elements/circle/CircleElement";
import {PolygonElement} from "../src/elements/polygon/PolygonElement";
import {A, findAnimation} from "../src/elements/Animations";
import {toElements} from "./shared/testHelpers";

// Re-uses the recordingCanvas pattern from HighlightTest, extended to
// capture every lineTo / moveTo coordinate so we can verify partial
// geometry quantitatively.
function recordingCanvas(w: number, h: number) {
    const real = createCanvas(w, h);
    const recorded = {
        lineTos:    [] as Array<[number, number]>,
        moveTos:    [] as Array<[number, number]>,
        ellipses:   [] as Array<{
            x: number, y: number, rx: number, ry: number,
            rotation: number, startAngle: number, endAngle: number,
        }>,
        arcs:       [] as Array<{x: number, y: number, r: number}>,
        alphas:     [] as number[],
    };
    const ctx: any = new Proxy(real.getContext("2d") as any, {
        set(target, prop, value) {
            if (prop === "globalAlpha") recorded.alphas.push(value);
            (target as any)[prop] = value;
            return true;
        },
        get(target, prop) {
            if (prop === "lineTo") {
                return function(x: number, y: number) {
                    recorded.lineTos.push([x, y]);
                    return (target as any).lineTo(x, y);
                };
            }
            if (prop === "moveTo") {
                return function(x: number, y: number) {
                    recorded.moveTos.push([x, y]);
                    return (target as any).moveTo(x, y);
                };
            }
            if (prop === "ellipse") {
                return function(x: number, y: number, rx: number, ry: number,
                                rotation: number, startAngle: number, endAngle: number) {
                    recorded.ellipses.push({x, y, rx, ry, rotation, startAngle, endAngle});
                    return (target as any).ellipse(x, y, rx, ry, rotation, startAngle, endAngle);
                };
            }
            if (prop === "arc") {
                return function(x: number, y: number, r: number, ...rest: any[]) {
                    recorded.arcs.push({x, y, r});
                    return (target as any).arc(x, y, r, ...rest);
                };
            }
            const v = (target as any)[prop];
            return typeof v === "function" ? v.bind(target) : v;
        }
    });
    return { canvas: { width: w, height: h, getContext: () => ctx } as any, recorded };
}

function approx(actual: number, expected: number, tolerance: number = 0.01): boolean {
    return Math.abs(actual - expected) <= tolerance;
}

describe("element drawProgress rendering (issue #78)", () => {

    const line_data: IConstructionInfo[] = [
        { construction: E.Point.free,   name: "A",  params: [50, 50] },
        { construction: E.Point.free,   name: "B",  params: [250, 50] },
        { construction: E.Line.connect, name: "AB", params: ["A", "B"] },
    ];

    const triangle_data: IConstructionInfo[] = [
        { construction: E.Point.free,    name: "A",   params: [50, 50] },
        { construction: E.Point.free,    name: "B",   params: [150, 50] },
        { construction: E.Point.free,    name: "C",   params: [100, 150] },
        { construction: E.Polygon.triangle, name: "ABC", params: ["A", "B", "C"] },
    ];

    const circle_data: IConstructionInfo[] = [
        { construction: E.Point.free,    name: "A",     params: [100, 100] },
        { construction: E.Point.free,    name: "B",     params: [200, 100] },
        { construction: E.Circle.radius, name: "BCD",   params: ["A", "B"] },
    ];

    describe("LineElement.drawEdge", () => {
        it("traces only to the interpolated endpoint at drawProgress = 0.5", () => {
            const slate = new Slate(createCanvas(300, 300));
            toElements(slate, line_data);
            const line = slate.lookupElement("AB") as LineElement;
            line.edgeColor = "#000000";
            line.drawProgress = 0.5;

            const r = recordingCanvas(300, 300);
            line.drawEdge(r.canvas);

            assert.strictEqual(r.recorded.moveTos.length, 1);
            assert.strictEqual(r.recorded.lineTos.length, 1);
            const [mx, my] = r.recorded.moveTos[0];
            const [lx, ly] = r.recorded.lineTos[0];
            assert.ok(approx(mx, 50), `moveTo x: ${mx}`);
            assert.ok(approx(my, 50), `moveTo y: ${my}`);
            // Halfway from (50,50) toward (250,50) is (150, 50).
            assert.ok(approx(lx, 150), `lineTo x: ${lx} (expected ~150)`);
            assert.ok(approx(ly, 50), `lineTo y: ${ly}`);
        });

        it("traces the full segment at drawProgress = 1 (default)", () => {
            const slate = new Slate(createCanvas(300, 300));
            toElements(slate, line_data);
            const line = slate.lookupElement("AB") as LineElement;
            line.edgeColor = "#000000";
            // drawProgress defaults to 1.
            const r = recordingCanvas(300, 300);
            line.drawEdge(r.canvas);

            const [lx, ly] = r.recorded.lineTos[0];
            assert.ok(approx(lx, 250), `lineTo x at progress=1: ${lx}`);
            assert.ok(approx(ly, 50));
        });
    });

    describe("CircleElement.drawEdge", () => {
        it("sweeps an arc from startAngle through 2pi · drawProgress", () => {
            const slate = new Slate(createCanvas(400, 400));
            toElements(slate, circle_data);
            slate.elements.forEach(e => e.update());
            const circle = slate.lookupElement("BCD") as CircleElement;
            circle.edgeColor = "#000000";
            circle.drawStartAngle = Math.PI / 2;
            circle.drawProgress = 0.5;

            const r = recordingCanvas(400, 400);
            circle.drawEdge(r.canvas);

            assert.strictEqual(r.recorded.ellipses.length, 1);
            const e = r.recorded.ellipses[0];
            assert.ok(approx(e.startAngle, Math.PI / 2),
                `startAngle: ${e.startAngle}`);
            // 0.5 * 2π = π — end angle should be startAngle + π.
            assert.ok(approx(e.endAngle, Math.PI / 2 + Math.PI),
                `endAngle: ${e.endAngle}`);
        });

        it("sweeps a full circle at the default startAngle=0, progress=1", () => {
            const slate = new Slate(createCanvas(400, 400));
            toElements(slate, circle_data);
            slate.elements.forEach(e => e.update());
            const circle = slate.lookupElement("BCD") as CircleElement;
            circle.edgeColor = "#000000";

            const r = recordingCanvas(400, 400);
            circle.drawEdge(r.canvas);
            const e = r.recorded.ellipses[0];
            assert.ok(approx(e.startAngle, 0));
            assert.ok(approx(e.endAngle, 2 * Math.PI));
        });
    });

    describe("PolygonElement.drawEdge", () => {
        it("traces only floor(progress * edgeCount) full edges plus a partial", () => {
            const slate = new Slate(createCanvas(300, 300));
            toElements(slate, triangle_data);
            const tri = slate.lookupElement("ABC") as PolygonElement;
            tri.edgeColor = "#000000";
            // Triangle has 3 closed edges (A→B, B→C, C→A).
            // At progress=1/3 we expect exactly 1 full edge, 0 partial.
            tri.drawProgress = 1 / 3;

            const r = recordingCanvas(300, 300);
            tri.drawEdge(r.canvas);

            // 1 moveTo + 1 lineTo for the single full edge.
            assert.strictEqual(r.recorded.moveTos.length, 1);
            assert.strictEqual(r.recorded.lineTos.length, 1);
            const [lx, ly] = r.recorded.lineTos[0];
            // First edge is A(50,50) → B(150,50).
            assert.ok(approx(lx, 150) && approx(ly, 50),
                `first edge endpoint: (${lx},${ly})`);
        });

        it("traces a partial second edge at progress = 0.5", () => {
            const slate = new Slate(createCanvas(300, 300));
            toElements(slate, triangle_data);
            const tri = slate.lookupElement("ABC") as PolygonElement;
            tri.edgeColor = "#000000";
            // edgeCount = 3, progress 0.5 → 1 full edge + 0.5 of next.
            tri.drawProgress = 0.5;

            const r = recordingCanvas(300, 300);
            tri.drawEdge(r.canvas);

            assert.strictEqual(r.recorded.lineTos.length, 2);
            const [partialX, partialY] = r.recorded.lineTos[1];
            // 0.5 progress of 3 edges = 1.5, so the partial half-edge
            // runs from B(150,50) to halfway toward C(100,150) →
            // (125, 100).
            const fractional = 0.5 * 3 - 1;   // = 0.5
            const expectedX = 150 + (100 - 150) * fractional;  // 125
            const expectedY = 50 + (150 - 50) * fractional;    // 100
            assert.ok(approx(partialX, expectedX, 0.5),
                `partial x: ${partialX} (expected ${expectedX})`);
            assert.ok(approx(partialY, expectedY, 0.5),
                `partial y: ${partialY} (expected ${expectedY})`);
        });

        it("traces every edge at the default progress=1", () => {
            const slate = new Slate(createCanvas(300, 300));
            toElements(slate, triangle_data);
            const tri = slate.lookupElement("ABC") as PolygonElement;
            tri.edgeColor = "#000000";

            const r = recordingCanvas(300, 300);
            tri.drawEdge(r.canvas);
            // 3 closed edges → 3 lineTos.
            assert.strictEqual(r.recorded.lineTos.length, 3);
        });
    });

    describe("PolygonElement.drawFace", () => {
        it("fades the fill via globalAlpha at faceAlpha < 1", () => {
            const slate = new Slate(createCanvas(300, 300));
            toElements(slate, triangle_data);
            const tri = slate.lookupElement("ABC") as PolygonElement;
            tri.faceColor = "#ff0000";
            tri.faceAlpha = 0.5;

            const r = recordingCanvas(300, 300);
            tri.drawFace(r.canvas);
            assert.ok(r.recorded.alphas.includes(0.5),
                `alphas observed: ${JSON.stringify(r.recorded.alphas)}`);
        });

        it("does not touch globalAlpha at faceAlpha=1 (the default)", () => {
            const slate = new Slate(createCanvas(300, 300));
            toElements(slate, triangle_data);
            const tri = slate.lookupElement("ABC") as PolygonElement;
            tri.faceColor = "#ff0000";

            const r = recordingCanvas(300, 300);
            tri.drawFace(r.canvas);
            for (const a of r.recorded.alphas) {
                assert.strictEqual(a, 1, `unexpected alpha ${a}`);
            }
        });

        it("face fade is independent of edge drawProgress", () => {
            const slate = new Slate(createCanvas(300, 300));
            toElements(slate, triangle_data);
            const tri = slate.lookupElement("ABC") as PolygonElement;
            tri.faceColor = "#ff0000";
            // Mid-outline (edges at 50% complete) but face fully shown.
            tri.drawProgress = 0.5;
            tri.faceAlpha = 1;

            const r = recordingCanvas(300, 300);
            tri.drawFace(r.canvas);
            for (const a of r.recorded.alphas) {
                assert.strictEqual(a, 1, "face should be opaque regardless of drawProgress");
            }
        });
    });

    describe("PointElement.drawVertex", () => {
        it("scales the marker radius by drawProgress", () => {
            const slate = new Slate(createCanvas(300, 300));
            toElements(slate, line_data);
            const pt = slate.lookupElement("A") as PointElement;
            pt.vertexColor = "#000000";
            pt.drawProgress = 0.5;

            const r = recordingCanvas(300, 300);
            pt.drawVertex(r.canvas as any);
            // Normal radius = 2; at progress 0.5 → 1 px.
            assert.strictEqual(r.recorded.arcs.length, 1);
            assert.ok(approx(r.recorded.arcs[0].r, 1),
                `radius at progress=0.5: ${r.recorded.arcs[0].r}`);
        });

        it("skips drawing when scaled radius drops below 0.5 px", () => {
            const slate = new Slate(createCanvas(300, 300));
            toElements(slate, line_data);
            const pt = slate.lookupElement("A") as PointElement;
            pt.vertexColor = "#000000";
            // Normal r = 2; 0.2 * 2 = 0.4 < 0.5 → early return.
            pt.drawProgress = 0.2;

            const r = recordingCanvas(300, 300);
            pt.drawVertex(r.canvas as any);
            assert.strictEqual(r.recorded.arcs.length, 0);
        });

        it("uses the full radius at progress=1 (the default)", () => {
            const slate = new Slate(createCanvas(300, 300));
            toElements(slate, line_data);
            const pt = slate.lookupElement("A") as PointElement;
            pt.vertexColor = "#000000";

            const r = recordingCanvas(300, 300);
            pt.drawVertex(r.canvas as any);
            assert.ok(approx(r.recorded.arcs[0].r, 2));
        });
    });
});

// Issue #81 — two related fixes:
//   1. CircleElement.drawEdge picks the highlight color BEFORE the
//      null-edgeColor bail, matching LineElement / PolygonElement, so
//      a zero-color circle renders in the highlight stroke while
//      emphasized or slide-highlighted (the "invisible highlight
//      target" pattern; also what makes zero-color transitionary
//      circles visible during their compass animation, since the
//      SlateAnimator holds emphasisAmount = 1 on animating targets).
//   2. Circle.compass / Polygon.outlineAndFill skip their face-fade
//      step entirely when the target has no faceColor — a null face
//      never draws, so the step was pure dead time mid-cascade.
describe("null-edge highlight + face-less animation steps (issue #81)", () => {

    const circle_data: IConstructionInfo[] = [
        { construction: E.Point.free,    name: "A",   params: [100, 100] },
        { construction: E.Point.free,    name: "B",   params: [200, 100] },
        { construction: E.Circle.radius, name: "BCD", params: ["A", "B"] },
    ];

    const triangle_data: IConstructionInfo[] = [
        { construction: E.Point.free,       name: "A",   params: [50, 50] },
        { construction: E.Point.free,       name: "B",   params: [150, 50] },
        { construction: E.Point.free,       name: "C",   params: [100, 150] },
        { construction: E.Polygon.triangle, name: "ABC", params: ["A", "B", "C"] },
    ];

    function makeCircle(): [Slate, CircleElement] {
        const slate = new Slate(createCanvas(400, 400));
        toElements(slate, circle_data);
        slate.elements.forEach(e => e.update());
        return [slate, slate.lookupElement("BCD") as CircleElement];
    }

    function makeTriangle(): [Slate, PolygonElement] {
        const slate = new Slate(createCanvas(300, 300));
        toElements(slate, triangle_data);
        return [slate, slate.lookupElement("ABC") as PolygonElement];
    }

    describe("CircleElement.drawEdge with null edgeColor", () => {
        it("draws nothing when neither emphasized nor highlighted", () => {
            const [, circle] = makeCircle();
            circle.edgeColor = null;

            const r = recordingCanvas(400, 400);
            circle.drawEdge(r.canvas);
            assert.strictEqual(r.recorded.ellipses.length, 0);
        });

        it("draws in the highlight stroke while emphasized", () => {
            const [, circle] = makeCircle();
            circle.edgeColor = null;
            circle.emphasisAmount = 1;

            const r = recordingCanvas(400, 400);
            circle.drawEdge(r.canvas);
            assert.strictEqual(r.recorded.ellipses.length, 1);
        });

        it("draws in the highlight stroke while slide-highlighted", () => {
            const [, circle] = makeCircle();
            circle.edgeColor = null;
            circle.shouldHighlight = true;

            const r = recordingCanvas(400, 400);
            circle.drawEdge(r.canvas);
            assert.strictEqual(r.recorded.ellipses.length, 1);
        });
    });

    describe("Circle.compass build() on a face-less circle", () => {
        it("returns the sweep step alone — no dead fill step", () => {
            const [slate, circle] = makeCircle();
            circle.faceColor = null;
            const anim = findAnimation(A.Circle.compass)!;
            const steps = anim.build(circle, slate, {});
            assert.strictEqual(steps.length, 1);
        });

        it("the lone step's finalise does the full restore", () => {
            const [slate, circle] = makeCircle();
            circle.faceColor = null;
            const anim = findAnimation(A.Circle.compass)!;
            const steps = anim.build(circle, slate, {});

            steps[0].setup!();
            assert.strictEqual(circle.drawProgress, 0);
            assert.strictEqual(circle.faceAlpha, 0);

            steps[0].finalise();
            assert.strictEqual(circle.drawProgress, 1);
            assert.strictEqual(circle.faceAlpha, 1);
            assert.strictEqual(circle.drawStartAngle, 0);
            assert.strictEqual(circle.visible, true);
        });

        it("still returns sweep + fill when the circle has a face", () => {
            const [slate, circle] = makeCircle();
            circle.faceColor = "#ffe9cd";
            const anim = findAnimation(A.Circle.compass)!;
            const steps = anim.build(circle, slate, {});
            assert.strictEqual(steps.length, 2);
        });
    });

    describe("Polygon.outlineAndFill build() on a face-less polygon", () => {
        it("returns the outline step alone — no dead fill step", () => {
            const [slate, tri] = makeTriangle();
            tri.faceColor = null;
            const anim = findAnimation(A.Polygon.outlineAndFill)!;
            const steps = anim.build(tri, slate, {});
            assert.strictEqual(steps.length, 1);
        });

        it("the lone step's finalise does the full restore", () => {
            const [slate, tri] = makeTriangle();
            tri.faceColor = null;
            const anim = findAnimation(A.Polygon.outlineAndFill)!;
            const steps = anim.build(tri, slate, {});

            steps[0].setup!();
            assert.strictEqual(tri.drawProgress, 0);
            assert.strictEqual(tri.faceAlpha, 0);

            steps[0].finalise();
            assert.strictEqual(tri.drawProgress, 1);
            assert.strictEqual(tri.faceAlpha, 1);
            assert.strictEqual(tri.visible, true);
        });

        it("still returns outline + fill when the polygon has a face", () => {
            const [slate, tri] = makeTriangle();
            tri.faceColor = "#ffe9cd";
            const anim = findAnimation(A.Polygon.outlineAndFill)!;
            const steps = anim.build(tri, slate, {});
            assert.strictEqual(steps.length, 2);
        });
    });
});
