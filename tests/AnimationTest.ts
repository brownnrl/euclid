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
import {SectorElement} from "../src/elements/sector/SectorElement";
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
        arcs:       [] as Array<{
            x: number, y: number, r: number,
            startAngle?: number, endAngle?: number,
        }>,
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
                    recorded.arcs.push({
                        x, y, r,
                        startAngle: rest[0], endAngle: rest[1],
                    });
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

// Issue #86 — sector angle-arc animation + polygon superposition.
//   1. SectorElement.drawEdge gains drawProgress partial sweep,
//      emphasisAmount stroke interpolation, and the highlight-before-
//      null-bail color pick (so zero-color angle markers render gold
//      under emphasis / slide-highlight).
//   2. A.Sector.sweep — arc grows from the A arm toward the B arm;
//      face-less sectors skip the fill step (the #81 pattern).
//   3. A.Polygon.superpose — ephemeral gold ghost translates onto the
//      args.onto polygon, rotates side onto side, holds, and retraces
//      home; the real polygon never moves.
describe("sector sweep + polygon superposition (issue #86)", () => {

    const sector_data: IConstructionInfo[] = [
        { construction: E.Point.free,     name: "O", params: [100, 100] },
        { construction: E.Point.free,     name: "P", params: [200, 100] },
        { construction: E.Point.free,     name: "Q", params: [100, 200] },
        { construction: E.Sector.sector,  name: "S", params: ["O", "P", "Q"] },
    ];

    // DEF is ABC translated by (150, 50) then rotated 90° about D —
    // congruent, same orientation, so a superposed ghost lands exactly.
    const two_triangles: IConstructionInfo[] = [
        { construction: E.Point.free,       name: "A",   params: [50, 50] },
        { construction: E.Point.free,       name: "B",   params: [150, 50] },
        { construction: E.Point.free,       name: "C",   params: [100, 130] },
        { construction: E.Polygon.triangle, name: "ABC", params: ["A", "B", "C"] },
        { construction: E.Point.free,       name: "D",   params: [200, 100] },
        { construction: E.Point.free,       name: "E2",  params: [200, 200] },
        { construction: E.Point.free,       name: "F",   params: [120, 150] },
        { construction: E.Polygon.triangle, name: "DEF", params: ["D", "E2", "F"] },
    ];

    function makeSector(): [Slate, SectorElement] {
        const slate = new Slate(createCanvas(300, 300));
        toElements(slate, sector_data);
        slate.elements.forEach(e => e.update());
        return [slate, slate.lookupElement("S") as SectorElement];
    }

    describe("SectorElement.drawEdge", () => {
        it("sweeps a partial arc at drawProgress = 0.5", () => {
            const [, sector] = makeSector();
            sector.edgeColor = "#000000";
            sector.drawProgress = 0.5;

            const r = recordingCanvas(300, 300);
            sector.drawEdge(r.canvas);
            assert.strictEqual(r.recorded.arcs.length, 1);
            const a = r.recorded.arcs[0];
            // P is due east of O → startAngle 0; Q is due south (+90°
            // in canvas coords) but the sector sweeps anticlockwise
            // (-270°): arcAngle from angle() keeps its sign and the
            // half sweep is exactly half of the full endAngle.
            const rFull = recordingCanvas(300, 300);
            sector.drawProgress = 1;
            sector.drawEdge(rFull.canvas);
            const full = rFull.recorded.arcs[0];
            assert.ok(approx(a.startAngle!, full.startAngle!),
                `start angles differ: ${a.startAngle} vs ${full.startAngle}`);
            const half = full.startAngle! + (full.endAngle! - full.startAngle!) / 2;
            assert.ok(approx(a.endAngle!, half),
                `endAngle at 0.5: ${a.endAngle} (expected ${half})`);
        });

        it("renders nothing with null edgeColor and no emphasis", () => {
            const [, sector] = makeSector();
            sector.edgeColor = null;
            const r = recordingCanvas(300, 300);
            sector.drawEdge(r.canvas);
            assert.strictEqual(r.recorded.arcs.length, 0);
        });

        it("renders in the highlight stroke while emphasized", () => {
            const [, sector] = makeSector();
            sector.edgeColor = null;
            sector.emphasisAmount = 1;
            const r = recordingCanvas(300, 300);
            sector.drawEdge(r.canvas);
            assert.strictEqual(r.recorded.arcs.length, 1);
        });

        it("renders in the highlight stroke while slide-highlighted", () => {
            const [, sector] = makeSector();
            sector.edgeColor = null;
            sector.shouldHighlight = true;
            const r = recordingCanvas(300, 300);
            sector.drawEdge(r.canvas);
            assert.strictEqual(r.recorded.arcs.length, 1);
        });
    });

    describe("A.Sector.sweep build()", () => {
        it("face-less sector gets the sweep step alone, with full restore", () => {
            const [slate, sector] = makeSector();
            sector.faceColor = null;
            const anim = findAnimation(A.Sector.sweep)!;
            const steps = anim.build(sector, slate, {});
            assert.strictEqual(steps.length, 1);

            steps[0].setup!();
            assert.strictEqual(sector.drawProgress, 0);
            steps[0].tick(0.5, 8, steps[0].durationMs);
            assert.ok(approx(sector.drawProgress, 0.5));
            steps[0].finalise();
            assert.strictEqual(sector.drawProgress, 1);
            assert.strictEqual(sector.faceAlpha, 1);
            assert.strictEqual(sector.visible, true);
        });

        it("faced sector gets sweep + fill", () => {
            const [slate, sector] = makeSector();
            sector.faceColor = "#ffe9cd";
            const anim = findAnimation(A.Sector.sweep)!;
            const steps = anim.build(sector, slate, {});
            assert.strictEqual(steps.length, 2);
        });
    });

    describe("A.Polygon.superpose build()", () => {
        function makeTriangles(): [Slate, PolygonElement, PolygonElement] {
            const slate = new Slate(createCanvas(400, 300));
            toElements(slate, two_triangles);
            return [
                slate,
                slate.lookupElement("ABC") as PolygonElement,
                slate.lookupElement("DEF") as PolygonElement,
            ];
        }

        it("returns the five-step out-and-back journey", () => {
            const [slate, abc] = makeTriangles();
            const anim = findAnimation(A.Polygon.superpose)!;
            const steps = anim.build(abc, slate, { onto: "DEF" });
            assert.strictEqual(steps.length, 5);
        });

        it("setup spawns the ghost ephemeral; the last finalise removes it", () => {
            const [slate, abc] = makeTriangles();
            const anim = findAnimation(A.Polygon.superpose)!;
            const steps = anim.build(abc, slate, { onto: "DEF" });
            assert.strictEqual(slate.ephemerals.length, 0);
            // The animator's reveal convention pre-zeroes the target;
            // superpose's setup must immediately restore it (the real
            // polygon stays fully drawn while the ghost travels).
            abc.drawProgress = 0;
            abc.visible = false;
            steps[0].setup!();
            assert.strictEqual(slate.ephemerals.length, 1);
            assert.strictEqual(abc.drawProgress, 1);
            assert.strictEqual(abc.visible, true);
            for (const s of steps) s.finalise();
            assert.strictEqual(slate.ephemerals.length, 0);
        });

        it("translate midpoint, rotated landing, and untouched original", () => {
            const [slate, abc, def] = makeTriangles();
            const anim = findAnimation(A.Polygon.superpose)!;
            const steps = anim.build(abc, slate, { onto: "DEF" });

            steps[0].setup!();
            const ghost = slate.ephemerals[0] as PolygonElement;

            // Halfway through the glide: vertex 0 between A(50,50)
            // and D(200,100).
            steps[0].tick(0.5, 8, steps[0].durationMs);
            assert.ok(approx(ghost.V[0].x, 125), `ghost V0.x ${ghost.V[0].x}`);
            assert.ok(approx(ghost.V[0].y, 75), `ghost V0.y ${ghost.V[0].y}`);
            steps[0].finalise();

            // Rotation complete: every ghost vertex coincides with DEF.
            steps[1].tick(1, 8, steps[1].durationMs);
            for (let i = 0; i < 3; i++) {
                assert.ok(approx(ghost.V[i].x, def.V[i].x, 0.5),
                    `ghost V${i}.x ${ghost.V[i].x} vs ${def.V[i].x}`);
                assert.ok(approx(ghost.V[i].y, def.V[i].y, 0.5),
                    `ghost V${i}.y ${ghost.V[i].y} vs ${def.V[i].y}`);
            }

            // Return trip ends at home; the real ABC never moved.
            steps[1].finalise(); steps[2].finalise();
            steps[3].finalise();
            steps[4].tick(1, 8, steps[4].durationMs);
            assert.ok(approx(ghost.V[0].x, 50));
            assert.ok(approx(ghost.V[0].y, 50));
            assert.strictEqual(abc.V[0].x, 50);
            assert.strictEqual(abc.V[0].y, 50);
            steps[4].finalise();
        });

        it("warns and no-ops on a missing or mismatched onto", () => {
            const [slate, abc] = makeTriangles();
            const anim = findAnimation(A.Polygon.superpose)!;
            const steps = anim.build(abc, slate, { onto: "NOPE" });
            assert.strictEqual(steps.length, 1);
            steps[0].finalise();
            assert.strictEqual(abc.visible, true);
            assert.strictEqual(slate.ephemerals.length, 0);
        });
    });
});

// Issue #95 — A.Point.slide glides a slider point along its line to a
// target parameter t, dragging its dependents. Issue #94 —
// A.Polygon.translateAside spawns a persistent displaced clone.
describe("point slide + polygon translate-aside (issues #95, #94)", () => {

    const slider_data: IConstructionInfo[] = [
        { construction: E.Point.free,       name: "A", params: [0, 100] },
        { construction: E.Point.free,       name: "B", params: [200, 100] },
        { construction: E.Point.lineSlider, name: "D", params: ["A", "B", 40, 100] },
        // A dependent line so we can confirm dependents follow the slide.
        { construction: E.Line.connect,     name: "BD", params: ["B", "D"] },
    ];

    const tri_data: IConstructionInfo[] = [
        { construction: E.Point.free,        name: "A",   params: [50, 50] },
        { construction: E.Point.free,        name: "B",   params: [150, 50] },
        { construction: E.Point.free,        name: "C",   params: [100, 130] },
        { construction: E.Polygon.triangle,  name: "ABC", params: ["A", "B", "C"] },
    ];

    describe("A.Point.slide", () => {
        function sliderSlate(): [Slate, PointElement] {
            const slate = new Slate(createCanvas(300, 200));
            slate.inTest = true;
            toElements(slate, slider_data);
            slate.elements.forEach(e => e.update());
            return [slate, slate.lookupElement("D") as PointElement];
        }

        it("glides D from its start to the target parameter t", () => {
            const [slate, D] = sliderSlate();
            // D projects onto AB (y=100) at x=40.
            assert.ok(approx(D.x, 40) && approx(D.y, 100));
            const anim = findAnimation(A.Point.slide)!;
            const steps = anim.build(D, slate, { to: 0.75 });   // → x = 150
            steps[0].setup!();
            steps[0].tick(0.5, 8, steps[0].durationMs);         // halfway 40→150
            assert.ok(approx(D.x, 95), `mid x ${D.x}`);
            steps[0].finalise();
            assert.ok(approx(D.x, 150), `final x ${D.x}`);
            assert.ok(approx(D.y, 100));
        });

        it("dependents follow the slide", () => {
            const [slate, D] = sliderSlate();
            const BD = slate.lookupElement("BD") as LineElement;
            const anim = findAnimation(A.Point.slide)!;
            const steps = anim.build(D, slate, { to: 0 });       // D → A at x=0
            steps[0].setup!();
            steps[0].finalise();
            // BD's D-endpoint should now sit at x≈0 (D moved to A).
            assert.ok(approx((BD as any)._B.x, 0), `BD endpoint ${(BD as any)._B.x}`);
        });

        it("warns + falls through to instant on a non-slider point", () => {
            const [slate] = sliderSlate();
            const A_free = slate.lookupElement("A") as PointElement;
            // findAnimation resolves; animateTo would reject the type —
            // here we just confirm A.Point.slide's elementType guards it.
            const anim = findAnimation(A.Point.slide)!;
            assert.notStrictEqual(A_free.constructor, anim.elementType);
        });
    });

    describe("A.Group.cloneAside", () => {
        // A small triangle (≈80px wide), an infinite-slider point D on
        // AB, and a line CD that depends on D — small enough that a
        // clone clears the original on a wide test canvas.
        const figure_data: IConstructionInfo[] = [
            { construction: E.Point.free,       name: "A",   params: [40, 50] },
            { construction: E.Point.free,       name: "B",   params: [120, 50] },
            { construction: E.Point.free,       name: "C",   params: [80, 140] },
            { construction: E.Polygon.triangle, name: "ABC", params: ["A", "B", "C"] },
            { construction: E.Point.lineSlider, name: "D",   params: ["A", "B", 80, 50] },
            { construction: E.Line.connect,     name: "CD",  params: ["C", "D"] },
        ];

        // Wide canvas so a 200px offset clears the ~80px figure.
        function figSlate(w: number = 600): Slate {
            const slate = new Slate(createCanvas(w, 300));
            slate.inTest = true;
            toElements(slate, figure_data);
            slate.elements.forEach(e => e.update());
            return slate;
        }

        it("single-element include: one clone, offset lerps, original unmoved", () => {
            const slate = figSlate();
            const abc = slate.lookupElement("ABC") as PolygonElement;
            const a0x = abc.V[0].x;
            const anim = findAnimation(A.Group.cloneAside)!;
            const steps = anim.build(abc, slate, { dx: 200, dy: 0, include: ["ABC"] });
            assert.strictEqual(slate.ephemerals.length, 0);
            steps[0].setup!();
            assert.strictEqual(slate.ephemerals.length, 1);
            const ghost = slate.ephemerals[0] as PolygonElement;
            steps[0].tick(0.5, 8, steps[0].durationMs);
            assert.ok(approx(ghost.V[0].x, a0x + 100), `mid ${ghost.V[0].x}`);
            steps[0].finalise();
            assert.ok(approx(ghost.V[0].x, a0x + 200), `final ${ghost.V[0].x}`);
            assert.ok(approx(abc.V[0].x, a0x), "real polygon unmoved");
        });

        it("include 'all' clones every named visible element (point+line+polygon)", () => {
            const slate = figSlate();
            const abc = slate.lookupElement("ABC") as PolygonElement;
            const anim = findAnimation(A.Group.cloneAside)!;
            const steps = anim.build(abc, slate, { dx: 200, dy: 0 });  // include defaults to all
            steps[0].setup!();
            // A, B, C, D (points) + ABC (polygon) + CD (line) = 6 ghosts.
            assert.strictEqual(slate.ephemerals.length, 6);
        });

        it("vary places the cloned slider at A + t·(B−A) and restores the real one", () => {
            const slate = figSlate();
            const D = slate.lookupElement("D") as PointElement;
            const ptA = slate.lookupElement("A") as PointElement;
            const ptB = slate.lookupElement("B") as PointElement;
            const d0x = D.x, d0y = D.y;
            const anim = findAnimation(A.Group.cloneAside)!;
            const steps = anim.build(slate.lookupElement("ABC")!, slate, {
                dx: 250, dy: 0, include: ["D"],   // a lone point always clears
                vary: { elem: "D", to: -0.3 },     // past A
            });
            steps[0].setup!();
            // Real D restored to its original position.
            assert.ok(approx(D.x, d0x) && approx(D.y, d0y), "real D restored");
            // Cloned D (offset not yet applied — that happens in tick)
            // sits at the varied parameter, past A.
            const ghostD = slate.ephemerals[0] as PointElement;
            const expX = ptA.x + (ptB.x - ptA.x) * -0.3;
            assert.ok(approx(ghostD.x, expX), `cloned D ${ghostD.x} vs ${expX}`);
        });

        it("clones copy colors; unsupported types are skipped", () => {
            const slate = figSlate();
            const abc = slate.lookupElement("ABC") as PolygonElement;
            abc.edgeColor = "#123456";
            abc.faceColor = "rgba(1,2,3,0.3)";
            const anim = findAnimation(A.Group.cloneAside)!;
            const steps = anim.build(abc, slate, { dx: 200, dy: 0, include: ["ABC"] });
            steps[0].setup!();
            const ghost = slate.ephemerals[0] as PolygonElement;
            assert.strictEqual(ghost.edgeColor, "#123456");
            assert.strictEqual(ghost.faceColor, "rgba(1,2,3,0.3)");
        });

        it("persists past finalise; cleared by the slide-advance wipe", () => {
            const slate = figSlate();
            const abc = slate.lookupElement("ABC")!;
            const anim = findAnimation(A.Group.cloneAside)!;
            const steps = anim.build(abc, slate, { dx: 200, dy: 0, include: ["ABC"] });
            steps[0].setup!();
            steps[0].finalise();
            assert.strictEqual(slate.ephemerals.length, 1);
            slate.clearEphemerals();
            assert.strictEqual(slate.ephemerals.length, 0);
        });

        it("desktop-only guard: skips a copy that can't clear the original on a narrow canvas", () => {
            // 150px-wide canvas can't fit the ~80px figure plus a clone
            // clear of it → no clone spawned.
            const slate = figSlate(150);
            const abc = slate.lookupElement("ABC")!;
            const anim = findAnimation(A.Group.cloneAside)!;
            const steps = anim.build(abc, slate, { dx: 200, dy: 0, include: ["ABC"] });
            steps[0].setup!();
            assert.strictEqual(slate.ephemerals.length, 0);
        });

        // #99 — autoPlace: slide the whole figure to canvas centre, then
        // drop the copy in the freed space on its side. The test figure
        // spans x∈[40,120] (centre 80), y∈[50,140] (centre 95).
        describe("autoPlace (#99)", () => {
            it("slides the view offset to centre the figure", () => {
                const slate = figSlate(600);   // 600×300
                const abc = slate.lookupElement("ABC")!;
                const anim = findAnimation(A.Group.cloneAside)!;
                const steps = anim.build(abc, slate, {
                    dx: -200, dy: 0, include: ["ABC"], autoPlace: true,
                });
                assert.strictEqual(slate.viewOffsetX, 0, "offset starts at 0");
                steps[0].setup!();
                steps[0].finalise();
                // figure centre (80,95) → canvas centre (300,150).
                assert.ok(approx(slate.viewOffsetX, 220), `offX ${slate.viewOffsetX}`);
                assert.ok(approx(slate.viewOffsetY, 55), `offY ${slate.viewOffsetY}`);
            });

            it("centres first, then splits the copy out", () => {
                const slate = figSlate(600);
                const abc = slate.lookupElement("ABC") as PolygonElement;
                const baseX = abc.V[0].x;
                const anim = findAnimation(A.Group.cloneAside)!;
                const steps = anim.build(abc, slate, {
                    dx: -200, dy: 0, include: ["ABC"], autoPlace: true,
                });
                steps[0].setup!();
                const ghost = slate.ephemerals[0] as PolygonElement;
                // End of the centre phase: offset fully applied, copy not
                // yet slid (still at its snapshot base position).
                steps[0].tick(0.4, 8, steps[0].durationMs);
                assert.ok(approx(slate.viewOffsetX, 220), "centred by 0.4");
                assert.ok(approx(ghost.V[0].x, baseX), "copy not split yet");
                // After the split phase the copy has moved off its base.
                steps[0].finalise();
                assert.ok(!approx(ghost.V[0].x, baseX), "copy slid out");
            });

            it("lands the copy in the freed space on its side, clear of the figure", () => {
                const slate = figSlate(600);
                const abc = slate.lookupElement("ABC") as PolygonElement;
                const anim = findAnimation(A.Group.cloneAside)!;
                const steps = anim.build(abc, slate, {
                    dx: -200, dy: 0, include: ["ABC"], autoPlace: true,   // left
                });
                steps[0].setup!();
                steps[0].finalise();
                const ghost = slate.ephemerals[0] as PolygonElement;
                // Display = model + view offset. The copy's displayed
                // right edge must clear the centred figure's left edge
                // (figure spans display x∈[260,340]).
                const ox = slate.viewOffsetX;
                const gxs = ghost.V.map(v => v.x + ox);
                const ghostMaxX = Math.max(...gxs);
                assert.ok(ghostMaxX < 260, `copy right edge ${ghostMaxX} not clear of figure`);
                assert.ok(Math.min(...gxs) > 0, "copy on-canvas (left margin)");
            });

            it("opts out (no copy, no view offset) when there's no room", () => {
                const slate = figSlate(160);   // too narrow for an 80px copy beside the figure
                const abc = slate.lookupElement("ABC")!;
                const anim = findAnimation(A.Group.cloneAside)!;
                const steps = anim.build(abc, slate, {
                    dx: -200, dy: 0, include: ["ABC"], autoPlace: true,
                });
                steps[0].setup!();
                steps[0].finalise();
                assert.strictEqual(slate.ephemerals.length, 0, "no copy added");
                assert.strictEqual(slate.viewOffsetX, 0, "figure not moved");
                assert.strictEqual(slate.viewOffsetY, 0);
            });

            it("variants array: both copies placed atomically on a wide canvas", () => {
                const slate = figSlate(600);
                const abc = slate.lookupElement("ABC")!;
                const anim = findAnimation(A.Group.cloneAside)!;
                const steps = anim.build(abc, slate, {
                    include: ["ABC"], autoPlace: true,
                    variants: [{ vary: { elem: "D", to: -0.35 } }, { vary: { elem: "D", to: 0.55 } }],
                });
                steps[0].setup!();
                steps[0].finalise();
                const polys = slate.ephemerals.filter(e => e instanceof PolygonElement);
                assert.strictEqual(polys.length, 2, "both case copies placed");
                assert.ok(approx(slate.viewOffsetX, 220), `figure centred ${slate.viewOffsetX}`);
            });

            it("variants: neither copy placed when there's no room (both-or-neither)", () => {
                const slate = figSlate(160);   // too narrow for either copy beside the figure
                const abc = slate.lookupElement("ABC")!;
                const anim = findAnimation(A.Group.cloneAside)!;
                const steps = anim.build(abc, slate, {
                    include: ["ABC"], autoPlace: true,
                    variants: [{ vary: { elem: "D", to: -0.35 } }, { vary: { elem: "D", to: 0.55 } }],
                });
                steps[0].setup!();
                steps[0].finalise();
                assert.strictEqual(slate.ephemerals.length, 0, "no copies");
                assert.strictEqual(slate.viewOffsetX, 0, "figure not moved");
            });

            it("variants: a single oversize variant aborts the whole layout", () => {
                // Vertical AB on a SHORT canvas: the D-past-A copy is too
                // tall to fit any side, so atomic placement drops BOTH —
                // even though the shorter D-between copy would fit alone.
                const vdata: IConstructionInfo[] = [
                    { construction: E.Point.free,        name: "A",   params: [50, 40] },
                    { construction: E.Point.free,        name: "B",   params: [50, 200] },
                    { construction: E.Point.free,        name: "C",   params: [120, 120] },
                    { construction: E.Polygon.triangle,  name: "ABC", params: ["A", "B", "C"] },
                    { construction: E.Point.lineSlider,  name: "D",   params: ["A", "B", 50, 120] },
                    { construction: E.Line.connect,      name: "CD",  params: ["C", "D"] },
                ];
                function vslate(): Slate {
                    const s = new Slate(createCanvas(700, 220));   // wide but short
                    s.inTest = true;
                    toElements(s, vdata);
                    s.elements.forEach(e => e.update());
                    return s;
                }
                const anim = findAnimation(A.Group.cloneAside)!;
                // The short (between) variant alone DOES place.
                const sOnly = vslate();
                anim.build(sOnly.lookupElement("ABC")!, sOnly, {
                    include: "all", autoPlace: true,
                    variants: [{ vary: { elem: "D", to: 0.55 } }],
                })[0].setup!();
                assert.ok(sOnly.ephemerals.length > 0, "short variant alone fits");
                // Paired with the oversize past-A variant, the whole layout aborts.
                const both = vslate();
                anim.build(both.lookupElement("ABC")!, both, {
                    include: "all", autoPlace: true,
                    variants: [{ vary: { elem: "D", to: -0.6 } }, { vary: { elem: "D", to: 0.55 } }],
                })[0].setup!();
                assert.strictEqual(both.ephemerals.length, 0, "oversize variant aborts both");
                assert.strictEqual(both.viewOffsetX, 0);
            });

            it("copies survive a reduced-motion run (no ephemeral wipe)", async () => {
                const slate = figSlate(600);
                slate.animationConfig = { reducedMotion: true };
                const anim = findAnimation(A.Group.cloneAside)!;
                await slate.animateTo(
                    new Set(["A","B","C","ABC","D","CD"]), new Set(),
                    [{ elem: "ABC", name: A.Group.cloneAside, args: {
                        include: ["ABC"], autoPlace: true,
                        variants: [{ vary: { elem: "D", to: -0.35 } }, { vary: { elem: "D", to: 0.55 } }],
                    } }],
                    "parallel",
                );
                const polys = slate.ephemerals.filter(e => e instanceof PolygonElement);
                assert.strictEqual(polys.length, 2, "reduced-motion keeps the case copies");
            });

            it("does not jump the offset when the figure is already centred (#107 fold)", () => {
                // Pre-centre the figure (as #107 does on a maximized view):
                // offset = canvasCentre − figureCentre. autoPlace must ease
                // FROM this base, not dip back to 0.
                const slate = figSlate(600);   // 600×300, figure centre (80,95)
                slate.setViewOffset(220, 55);
                const abc = slate.lookupElement("ABC")!;
                const anim = findAnimation(A.Group.cloneAside)!;
                const steps = anim.build(abc, slate, {
                    include: ["ABC"], autoPlace: true,
                    variants: [{ vary: { elem: "D", to: -0.35 } }, { vary: { elem: "D", to: 0.55 } }],
                });
                steps[0].setup!();
                // Through the whole centre phase the offset stays put (no dip).
                steps[0].tick(0, 8, steps[0].durationMs);
                assert.ok(approx(slate.viewOffsetX, 220) && approx(slate.viewOffsetY, 55),
                    `offset jumped at p=0: (${slate.viewOffsetX},${slate.viewOffsetY})`);
                steps[0].tick(0.4, 8, steps[0].durationMs);   // end of centre phase
                assert.ok(approx(slate.viewOffsetX, 220) && approx(slate.viewOffsetY, 55),
                    `offset moved during centre phase: (${slate.viewOffsetX},${slate.viewOffsetY})`);
                steps[0].finalise();
                const polys = slate.ephemerals.filter(e => e instanceof PolygonElement);
                assert.strictEqual(polys.length, 2, "copies still placed");
            });

            it("falls back to above/below when the sides are too tight", () => {
                // A wide, short figure (x∈[20,300] → 280px) on a tall but
                // not-very-wide canvas: a left/right copy can't fit beside
                // it, so the left-preferring entry lands ABOVE instead.
                const wide_data: IConstructionInfo[] = [
                    { construction: E.Point.free,        name: "A",   params: [20, 250] },
                    { construction: E.Point.free,        name: "B",   params: [300, 260] },
                    { construction: E.Point.free,        name: "C",   params: [160, 320] },
                    { construction: E.Polygon.triangle,  name: "ABC", params: ["A", "B", "C"] },
                ];
                const slate = new Slate(createCanvas(340, 600));   // tall, sides too tight
                slate.inTest = true;
                toElements(slate, wide_data);
                slate.elements.forEach(e => e.update());
                const abc = slate.lookupElement("ABC") as PolygonElement;
                const anim = findAnimation(A.Group.cloneAside)!;
                const steps = anim.build(abc, slate, {
                    dx: -200, dy: 0, include: ["ABC"], autoPlace: true,   // left preference
                });
                steps[0].setup!();
                steps[0].finalise();
                assert.strictEqual(slate.ephemerals.length, 1, "copy placed (above)");
                // Figure is centred (display centre ≈ canvas centre 300).
                const ghost = slate.ephemerals[0] as PolygonElement;
                const oy = slate.viewOffsetY;
                const gys = ghost.V.map(v => v.y + oy);
                // The copy sits in the top band: its displayed bottom edge
                // clears the centred figure's top edge (figure spans display
                // y∈[300−35, 300+35] = [265,335]).
                assert.ok(Math.max(...gys) < 265, `copy not above figure (maxY ${Math.max(...gys)})`);
                assert.ok(Math.min(...gys) > 0, "copy on-canvas (top margin)");
            });
        });
    });
});

// ---------------------------------------------------------------------
// #127 — A.Polygon.equilateralBuild: the I.1 compass walk as a single
// animation. Two ephemeral compass circles sweep, then the triangle
// outlines/fills, then the circles are cleared.
// ---------------------------------------------------------------------
describe("A.Polygon.equilateralBuild build() (#127)", () => {
    function makeTri(face: string | null): [Slate, PolygonElement] {
        const slate = new Slate(createCanvas(440, 320));
        const data: IConstructionInfo[] = [
            { construction: E.Point.free,                name: "A",   params: [130, 240] },
            { construction: E.Point.free,                name: "B",   params: [310, 240] },
            { construction: E.Polygon.equilateralTriangle, name: "ABC", params: ["A", "B"] },
        ];
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        const tri = slate.lookupElement("ABC") as PolygonElement;
        tri.faceColor = face;   // toElements doesn't apply colors; set directly
        return [slate, tri];
    }

    it("returns 4 steps with a face (2 sweeps + outline + fill), 3 without", () => {
        const [s1, tri1] = makeTri("rgb(210,228,245)");
        assert.strictEqual(findAnimation(A.Polygon.equilateralBuild)!.build(tri1, s1, {}).length, 4);
        const [s2, tri2] = makeTri(null);
        assert.strictEqual(findAnimation(A.Polygon.equilateralBuild)!.build(tri2, s2, {}).length, 3);
    });

    it("step-1 setup spawns two ephemeral circles; the last finalise clears them", () => {
        const [slate, tri] = makeTri("rgb(210,228,245)");
        const steps = findAnimation(A.Polygon.equilateralBuild)!.build(tri, slate, {});
        assert.strictEqual(slate.ephemerals.length, 0);
        steps[0].setup!();
        assert.strictEqual(slate.ephemerals.length, 2, "two compass circles");
        assert.ok(slate.ephemerals.every(e => e instanceof CircleElement));
        steps.forEach(s => s.finalise());   // last finalise (fullRestore) clears them
        assert.strictEqual(slate.ephemerals.length, 0, "cleared after the walk");
    });

    it("starts both circles un-drawn so the second doesn't flash full during the first sweep", () => {
        const [slate, tri] = makeTri(null);
        const steps = findAnimation(A.Polygon.equilateralBuild)!.build(tri, slate, {});
        steps[0].setup!();
        const [cA, cB] = slate.ephemerals as CircleElement[];
        assert.strictEqual(cA.drawProgress, 0, "first circle starts at 0");
        assert.strictEqual(cB.drawProgress, 0, "second circle starts at 0 (not the default 1)");
    });

    it("the circles are centred on the base endpoints with radius |AB|", () => {
        const [slate, tri] = makeTri(null);
        const steps = findAnimation(A.Polygon.equilateralBuild)!.build(tri, slate, {});
        steps[0].setup!();
        const [cA, cB] = slate.ephemerals as CircleElement[];
        const pA = tri.V[0], pB = tri.V[1], ab = pA.distance(pB);
        assert.ok(approx(cA.Center.x, pA.x) && approx(cA.Center.y, pA.y), "circle 1 centred on A");
        assert.ok(approx(cA.radius, ab), `circle 1 radius ${cA.radius} vs ${ab}`);
        assert.ok(approx(cB.Center.x, pB.x) && approx(cB.Center.y, pB.y), "circle 2 centred on B");
        assert.ok(approx(cB.radius, ab), `circle 2 radius ${cB.radius} vs ${ab}`);
    });

    it("keeps the triangle dark (drawProgress 0) through the circle sweeps", () => {
        const [slate, tri] = makeTri(null);
        const steps = findAnimation(A.Polygon.equilateralBuild)!.build(tri, slate, {});
        tri.drawProgress = 1;            // animator pre-state
        steps[0].setup!();
        assert.strictEqual(tri.drawProgress, 0, "hidden while the compass sweeps");
        // the outline step (last) reveals it
        steps[steps.length - 1].finalise();
        assert.strictEqual(tri.drawProgress, 1, "revealed at the end");
        assert.strictEqual(tri.visible, true);
    });
});

// ---------------------------------------------------------------------
// #127 — A.Circle.compassTransfer: Euclid I.2 (copy a length) as one
// animation. Target = the kept radius circle (circle;radius;P,C,D); the
// macro animates the rigorous I.2 scaffolding (join, equilateral, two
// produced sides, two lay-off circles) as ephemerals, then reveals it.
// ---------------------------------------------------------------------
describe("A.Circle.compassTransfer build() (#127)", () => {
    // P = centre/target point; C,D = the source segment (length to copy).
    function makeScene(radiusParams: string[]): [Slate, CircleElement] {
        const slate = new Slate(createCanvas(460, 360));
        const data: IConstructionInfo[] = [
            { construction: E.Point.free,   name: "P", params: [140, 200] },
            { construction: E.Point.free,   name: "C", params: [250, 230] },
            { construction: E.Point.free,   name: "D", params: [330, 180] },
            { construction: E.Circle.radius, name: "K", params: radiusParams },
        ];
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        const k = slate.lookupElement("K") as CircleElement;
        k.visible = true; k.emphasized = true;   // animator _startStep pre-state
        return [slate, k];
    }

    it("returns the 9-step I.2 walk for a radius circle", () => {
        const [slate, k] = makeScene(["P", "C", "D"]);
        const steps = findAnimation(A.Circle.compassTransfer)!.build(k, slate, {});
        assert.strictEqual(steps.length, 9);
    });

    it("step-1 setup spawns 8 ephemerals; the last finalise clears them", () => {
        const [slate, k] = makeScene(["P", "C", "D"]);
        const steps = findAnimation(A.Circle.compassTransfer)!.build(k, slate, {});
        assert.strictEqual(slate.ephemerals.length, 0);
        steps[0].setup!();
        assert.strictEqual(slate.ephemerals.length, 8,
            "join + 2 equilateral circles + triangle + 2 produced sides + 2 lay-off circles");
        steps.forEach(s => s.finalise());   // the reveal's finalise clears the scaffold
        assert.strictEqual(slate.ephemerals.length, 0, "scaffolding cleared once the circle lands");
    });

    it("a lay-off circle carries the copied length |CD| (centred on the near source end)", () => {
        const [slate, k] = makeScene(["P", "C", "D"]);
        const C = slate.lookupElement("C") as PointElement;
        const D = slate.lookupElement("D") as PointElement;
        const r = C.distance(D);
        findAnimation(A.Circle.compassTransfer)!.build(k, slate, {})[0].setup!();
        const circles = slate.ephemerals.filter(e => e instanceof CircleElement) as CircleElement[];
        // Two circles are centred on C — the I.1 equilateral circle (radius |PC|)
        // and the lay-off circle (radius |CD|); assert the lay-off one exists.
        const layoff = circles.find(c => approx(c.Center.x, C.x) && approx(c.Center.y, C.y) && approx(c.radius, r));
        assert.ok(layoff, "a lay-off compass circle centred on C carries radius |CD|");
        assert.ok(approx(k.radius, r), "the kept circle's radius is the copied length");
    });

    it("hides the result circle until the reveal step", () => {
        const [slate, k] = makeScene(["P", "C", "D"]);
        const steps = findAnimation(A.Circle.compassTransfer)!.build(k, slate, {});
        k.drawProgress = 1;
        steps[0].setup!();
        assert.strictEqual(k.drawProgress, 0, "result dark while the walk runs");
        steps[steps.length - 1].finalise();
        assert.strictEqual(k.drawProgress, 1, "revealed at the end");
    });

    it("keepCircles persists the four circles as named real elements for a later count", () => {
        const [slate, k] = makeScene(["P", "C", "D"]);
        const names = ["Ka", "Kc", "Kc2", "KT"];
        const steps = findAnimation(A.Circle.compassTransfer)!.build(k, slate, { keepCircles: names });
        steps[0].setup!();
        // the four construction circles are real, name-addressable elements …
        names.forEach(n => assert.ok(slate.lookupElement(n) instanceof CircleElement, n + " is a real named circle"));
        steps.forEach(s => s.finalise());
        // … the transitory scaffolding (join/triangle/sides) cleared, but the
        // named circles persist so a later slide can re-show / count them …
        assert.strictEqual(slate.ephemerals.length, 0, "transitory scaffolding cleared");
        names.forEach(n => assert.ok(slate.lookupElement(n), n + " persists for the count"));
        // … and they're initiallyHidden so they don't pollute the static figure.
        names.forEach(n => assert.ok(slate.initiallyHidden.has(n), n + " is initiallyHidden"));
    });

    it("degenerate radius (centre-through-point, no distinct source) → 1 instant step, no ephemerals", () => {
        const [slate, k] = makeScene(["P", "C"]);   // circle;radius;P,C → A defaults to centre P
        const steps = findAnimation(A.Circle.compassTransfer)!.build(k, slate, {});
        assert.strictEqual(steps.length, 1);
        if (steps[0].setup) steps[0].setup();
        assert.strictEqual(slate.ephemerals.length, 0, "no scaffolding for a degenerate input");
    });
});
