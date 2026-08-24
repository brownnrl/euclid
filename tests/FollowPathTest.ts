// A.Point.followPath (#137) — move a point along a path for illustration.
//
// The behaviour that matters most is the one that is easy to get wrong:
// by default the point must end up EXACTLY where it started. The animation
// exists to show a hypothesis failing (I.31: drag the apex across DC and the
// "parallel" stops being parallel) and then put the figure back. A point
// left displaced would silently corrupt every slide after it.

import "mocha";
import * as assert from "assert";
import {createCanvas} from "canvas";
import {Slate} from "../src/Slate";
import {E} from "../src/index";
import {A, findAnimation} from "../src/elements/Animations";
import {PointElement} from "../src/elements/point/PointElement";
import {almostEqual} from "./shared/testHelpers";

describe("A.Point.followPath (#137)", () => {

    // A free apex plus a line it can be walked across.
    function scene(): Slate {
        const s = new Slate(createCanvas(400, 300) as any);
        s.inTest = true;
        s.createElement(E.Point.free, [100, 60], "A");
        s.createElement(E.Point.free, [40, 200], "D");
        s.createElement(E.Point.free, [300, 200], "C");
        s.createElement(E.Line.connect, ["D", "C"], "DC");
        s.createElement(E.Line.connect, ["A", "D"], "AD");
        s.update();
        return s;
    }

    function steps(slate: Slate, args: any) {
        const anim = findAnimation(A.Point.followPath)!;
        const target = slate.lookupElement("A")!;
        return { anim, target, built: anim.build(target, slate, args) };
    }

    function capture<T>(fn: () => T): T {
        const w = console.warn, e = console.error;
        console.warn = () => {}; console.error = () => {};
        try { return fn(); } finally { console.warn = w; console.error = e; }
    }

    it("registers under A.Point.followPath", () => {
        const anim = findAnimation(A.Point.followPath);
        assert.ok(anim != null);
        assert.equal(anim!.name, "Point.followPath");
    });

    it("returns the point exactly to its start (the default)", () => {
        const slate = scene();
        const A0 = slate.lookupElement("A") as PointElement;
        const startX = A0.x, startY = A0.y;
        const { built } = steps(slate, { via: [[240, 250]] });
        const step = built[0];
        step.setup!();
        step.tick!(0.5, 16, 1200);
        assert.ok(Math.abs(A0.x - startX) > 1,
            "mid-animation the point must actually have travelled");
        step.finalise!();
        almostEqual(A0.x, startX, 1e-9);
        almostEqual(A0.y, startY, 1e-9);
    });

    it("travels out and back, so the far point is reached at half progress", () => {
        const slate = scene();
        const A0 = slate.lookupElement("A") as PointElement;
        const { built } = steps(slate, { via: [[240, 250]] });
        const step = built[0];
        step.setup!();
        step.tick!(0.5, 16, 1200);
        almostEqual(A0.x, 240, 1e-6);
        almostEqual(A0.y, 250, 1e-6);
        step.tick!(1, 16, 1200);
        // Back at the start by the end of the tick range.
        almostEqual(A0.x, 100, 1e-6);
        almostEqual(A0.y, 60, 1e-6);
    });

    it("settle:true leaves the point at the far end", () => {
        const slate = scene();
        const A0 = slate.lookupElement("A") as PointElement;
        const { built } = steps(slate, { via: [[240, 250]], settle: true });
        const step = built[0];
        step.setup!();
        step.finalise!();
        almostEqual(A0.x, 240, 1e-6);
        almostEqual(A0.y, 250, 1e-6);
    });

    it("accepts an element name as a waypoint", () => {
        const slate = scene();
        const A0 = slate.lookupElement("A") as PointElement;
        const C = slate.lookupElement("C") as PointElement;
        const { built } = steps(slate, { via: ["C"], settle: true });
        const step = built[0];
        step.setup!();
        step.finalise!();
        almostEqual(A0.x, C.x, 1e-6);
        almostEqual(A0.y, C.y, 1e-6);
    });

    it("drives dependents as it goes", () => {
        // The reason the animation exists: the construction must visibly
        // react while the point travels, not just at the end.
        const slate = scene();
        const AD = slate.lookupElement("AD") as any;
        const { built } = steps(slate, { via: [[240, 250]] });
        const step = built[0];
        step.setup!();
        const beforeY = AD.A.y;
        step.tick!(0.5, 16, 1200);
        assert.notStrictEqual(AD.A.y, beforeY,
            "the line through A should follow A while it moves");
        step.finalise!();
    });

    it("walks a line end to end via args.along", () => {
        const slate = scene();
        const A0 = slate.lookupElement("A") as PointElement;
        const C = slate.lookupElement("C") as PointElement;
        const { built } = steps(slate, { along: "DC", settle: true });
        const step = built[0];
        step.setup!();
        step.finalise!();
        // along appends both endpoints, so it settles on the far one.
        almostEqual(A0.x, C.x, 1e-6);
        almostEqual(A0.y, C.y, 1e-6);
    });

    describe("bad input", () => {
        it("reports an unresolvable waypoint and stays put", () => {
            const slate = scene();
            const A0 = slate.lookupElement("A") as PointElement;
            const { built } = steps(slate, { via: ["NOPE"] });
            capture(() => { built[0].setup!(); built[0].finalise!(); });
            assert.equal(slate.diagnostics.length, 2,
                "one for the bad waypoint, one for ending up with no path");
            assert.equal(slate.diagnostics[0].code, "unresolvable-target");
            almostEqual(A0.x, 100, 1e-9);
        });

        it("reports when no waypoints are given at all", () => {
            const slate = scene();
            const { built } = steps(slate, {});
            capture(() => built[0].setup!());
            assert.equal(slate.diagnostics.length, 1);
            assert.equal(slate.diagnostics[0].code, "bad-animation-args");
        });

        it("reports a non-line args.along", () => {
            const slate = scene();
            const { built } = steps(slate, { along: "A" });
            capture(() => built[0].setup!());
            assert.ok(slate.diagnostics.some((d) => d.code === "bad-animation-args"));
        });

        it("does not move the point when the path is empty", () => {
            const slate = scene();
            const A0 = slate.lookupElement("A") as PointElement;
            const { built } = steps(slate, {});
            capture(() => {
                built[0].setup!();
                built[0].tick!(0.5, 16, 1200);
                built[0].finalise!();
            });
            almostEqual(A0.x, 100, 1e-9);
            almostEqual(A0.y, 60, 1e-9);
        });
    });


    // #137 arc mode — swing about a centre instead of walking legs.
    describe("arc mode", () => {

        it("defaults the radius to where the point already is", () => {
            // t=0 must leave the figure exactly as authored, or every deck
            // using this would jump on entry.
            const slate = scene();
            const A0 = slate.lookupElement("A") as PointElement;
            const x0 = A0.x, y0 = A0.y;
            const { built } = steps(slate, { arc: { center: "DC" } });
            built[0].setup!();
            built[0].tick!(0, 16, 1200);
            almostEqual(A0.x, x0, 1e-6);
            almostEqual(A0.y, y0, 1e-6);
            built[0].finalise!();
        });

        it("a LINE centre means its midpoint", () => {
            // `center: "DC"` should read as "swing about the middle of DC"
            // without the deck declaring a midpoint element.
            const slate = scene();
            const A0 = slate.lookupElement("A") as PointElement;
            const D = slate.lookupElement("D") as PointElement;
            const C = slate.lookupElement("C") as PointElement;
            const mx = (D.x + C.x) / 2, my = (D.y + C.y) / 2;
            const r0 = Math.hypot(A0.x - mx, A0.y - my);
            const { built } = steps(slate, { arc: { center: "DC" }, settle: true });
            built[0].setup!();
            built[0].tick!(0.5, 16, 1200);
            // Still on the same circle about the midpoint.
            almostEqual(Math.hypot(A0.x - mx, A0.y - my), r0, 1e-6);
            built[0].finalise!();
        });

        it("stays on the circle throughout the sweep", () => {
            const slate = scene();
            const A0 = slate.lookupElement("A") as PointElement;
            const { built } = steps(slate, { arc: { center: [170, 200] }, settle: true });
            built[0].setup!();
            const r = Math.hypot(A0.x - 170, A0.y - 200);
            for (const t of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
                built[0].tick!(t, 16, 1200);
                almostEqual(Math.hypot(A0.x - 170, A0.y - 200), r, 1e-6);
            }
            built[0].finalise!();
        });

        it("a 180-degree sweep lands diametrically opposite", () => {
            const slate = scene();
            const A0 = slate.lookupElement("A") as PointElement;
            const cxy = [170, 200];
            const { built } = steps(slate,
                { arc: { center: cxy, sweep: 180 }, settle: true });
            built[0].setup!();
            const sx = A0.x, sy = A0.y;
            built[0].finalise!();
            almostEqual(A0.x, 2 * cxy[0] - sx, 1e-6);
            almostEqual(A0.y, 2 * cxy[1] - sy, 1e-6);
        });

        it("carries the point across the line it swings about", () => {
            // The reason the mode exists: swinging about DC's midpoint
            // sweeps the apex to the far side along a natural path.
            const slate = scene();
            const A0 = slate.lookupElement("A") as PointElement;
            const D = slate.lookupElement("D") as PointElement;
            const above = A0.y < D.y;
            const { built } = steps(slate, { arc: { center: "DC" }, settle: true });
            built[0].setup!();
            built[0].finalise!();
            assert.notStrictEqual(A0.y < D.y, above,
                "after a half turn about DC's midpoint the apex must be on the other side");
        });

        it("returns exactly to the start when settle is false", () => {
            const slate = scene();
            const A0 = slate.lookupElement("A") as PointElement;
            const x0 = A0.x, y0 = A0.y;
            const { built } = steps(slate, { arc: { center: "DC" } });
            built[0].setup!();
            built[0].tick!(0.5, 16, 1200);
            built[0].finalise!();
            almostEqual(A0.x, x0, 1e-9);
            almostEqual(A0.y, y0, 1e-9);
        });

        it("reports an unusable centre and leaves the point put", () => {
            const slate = scene();
            const A0 = slate.lookupElement("A") as PointElement;
            const { built } = steps(slate, { arc: { center: "NOPE" } });
            capture(() => { built[0].setup!(); built[0].finalise!(); });
            assert.ok(slate.diagnostics.some((d) => d.code === "bad-animation-args"));
            almostEqual(A0.x, 100, 1e-9);
        });

        it("reports a zero radius (point sitting on the centre)", () => {
            const slate = scene();
            const A0 = slate.lookupElement("A") as PointElement;
            const { built } = steps(slate, { arc: { center: [A0.x, A0.y] } });
            capture(() => built[0].setup!());
            assert.ok(slate.diagnostics.some((d) =>
                d.message.indexOf("radius is zero") >= 0));
        });

        it("still supports static coordinates via `via` (unchanged)", () => {
            const slate = scene();
            const A0 = slate.lookupElement("A") as PointElement;
            const { built } = steps(slate, { via: [[200, 100], [260, 140]], settle: true });
            built[0].setup!();
            built[0].finalise!();
            almostEqual(A0.x, 260, 1e-6);
            almostEqual(A0.y, 140, 1e-6);
        });
    });

    it("parameterises by arc length, so a long leg takes longer", () => {
        // Two legs: a short hop then a long one. At half progress the point
        // should be well into the long leg, not sitting at the joint.
        const slate = scene();
        const A0 = slate.lookupElement("A") as PointElement;
        const { built } = steps(slate, { via: [[110, 60], [310, 60]], settle: true });
        const step = built[0];
        step.setup!();
        step.tick!(0.5, 16, 1200);
        assert.ok(A0.x > 150,
            `expected to be along the long leg at t=0.5, got x=${A0.x}`);
        step.finalise!();
        almostEqual(A0.x, 310, 1e-6);
    });
});
