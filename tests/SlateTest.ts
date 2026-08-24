import "mocha";
import * as assert from "assert";
import {Slate, isPromoted, promotedDrawOrder} from "../src/Slate";
import {E, IConstructionInfo, init, slates, revealNoscriptFallback, parseParam} from "../src/index";
import {PlaneSlider} from "../src/elements/point/PlaneSlider";
import {PointElement} from "../src/elements/point/PointElement";
import {GeomElement} from "../src/elements/GeomElement";
import {trackWindowResize, escapeAction} from "../src/SlateControls";
import {createCanvas} from "canvas";
import {almostEqual, toElements} from "./shared/testHelpers";
import {parseColor} from "../src/Colors";
import {
    buildPivotScene,
    buildScene3d,
    buildSpecializedScene,
} from "./shared/dragScenes";

describe("slate", () => {

    let connected_line_data: IConstructionInfo[] = [
        { construction: E.Point.free,   name: "A",  params: [10, 100] },
        { construction: E.Point.free,   name: "B",  params: [100, 100] },
        { construction: E.Line.connect, name: "AB", params: ["A", "B"] },
    ];

    it("should facilitate updates", () => {
        let slate: Slate = new Slate(createCanvas(200, 200));
        toElements(slate, connected_line_data);
        slate.elements.forEach(e => e.update());
    });

    it("should translate coordinates", () => {
        let slate: Slate = new Slate(createCanvas(200, 200));
        slate.inTest = true;
        toElements(slate, connected_line_data);
        slate.translateCoordinates(1, 0);
        let A = slate.lookupElement("A") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        assert.equal(A.x, 11);
        assert.equal(A.y, 100);
        assert.equal(B.x, 101);
        assert.equal(B.y, 100);
    });

    it("should be able to find the closest visible point within a tolerance", () => {
        let slate: Slate = new Slate(createCanvas(200, 200));
        toElements(slate, connected_line_data);
        let A = slate.lookupElement("A") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        A.vertexColor = "red";
        B.vertexColor = "red";

        let P = slate.closestVisiblePoint(slate.elements,
            new PointElement({x: (10 + 100) / 2 - 1, y: 100}), 100);
        assert(P.name == "A");
        P = slate.closestVisiblePoint(slate.elements,
            new PointElement({x: (10 + 100) / 2 + 1, y: 100}), 100);
        assert(P.name == "B");

        P = slate.closestVisiblePoint(slate.elements,
            new PointElement({x: (10 + 100) / 2 - 1, y: 100}), 10);
        assert(P == null);

        P = slate.closestVisiblePoint(slate.elements,
            new PointElement({x: 89, y: 100}), 10);
        assert(P == null);

        P = slate.closestVisiblePoint(slate.elements,
            new PointElement({x: 91, y: 100}), 10);
        assert(P.name == "B");
    });

    // Slate.createElement error paths.
    it("createElement should throw TypeError when a param is not a string or number", () => {
        let slate = new Slate(createCanvas(100, 100));
        slate.createElement(E.Point.free, [10, 10], "A");
        // Mixed-in boolean hits convertParams' default case.
        assert.throws(
            () => slate.createElement(E.Point.midpoint, ["A", true as any], "X"),
            TypeError);
    });

    it("createElement should throw a descriptive TypeError when no construction matches", () => {
        let slate = new Slate(createCanvas(100, 100));
        // No construction takes zero points → findConstruction returns null.
        // Omitting name exercises the name-is-null fallback.
        assert.throws(
            () => slate.createElement(E.Point.midpoint, []),
            /Construction not found/);
    });

    // #140 — a highlighted or mid-animation element should paint over its
    // neighbours instead of being chopped by whatever was declared after it.
    describe("promotedDrawOrder", () => {

        // Three named elements in declaration order, so the tests can talk
        // about "declared later paints over".
        function scene(): {slate: Slate; A: GeomElement; B: GeomElement; C: GeomElement} {
            let slate: Slate = new Slate(createCanvas(200, 200));
            slate.inTest = true;
            toElements(slate, [
                { construction: E.Point.free, name: "A", params: [10, 10] },
                { construction: E.Point.free, name: "B", params: [50, 50] },
                { construction: E.Point.free, name: "C", params: [90, 90] },
            ]);
            let [A, B, C] = ["A", "B", "C"].map(n => slate.lookupElement(n));
            return {slate, A, B, C};
        }

        // A slate carries built-in screen_* plane elements ahead of the
        // authored ones; ignore them the way _dispatchHighlightChange does.
        const names = (es: GeomElement[]) => es
            .map(e => e.name)
            .filter(n => n != null && !n.startsWith("screen"))
            .join(",");

        it("returns the original array untouched when nothing is promoted", () => {
            let {slate} = scene();
            assert.strictEqual(
                promotedDrawOrder(slate.elements), slate.elements,
                "the idle path must hand back the SAME array — no reorder and no " +
                "allocation, so every static figure and snapshot golden is unchanged");
        });

        it("moves a highlighted element to the end of the pass", () => {
            let {slate, A} = scene();
            A.shouldHighlight = true;
            assert.equal(names(promotedDrawOrder(slate.elements)), "B,C,A",
                "A was declared first, so B and C used to paint over it");
        });

        it("promotes an emphasised element (hover / caption ref)", () => {
            let {slate, A} = scene();
            A.emphasized = true;
            assert.equal(names(promotedDrawOrder(slate.elements)), "B,C,A");
        });

        it("keeps promotion through the post-animation emphasis fade", () => {
            let {slate, A} = scene();
            // SlateAnimator ticks emphasisAmount 1 → 0 over EMPHASIS_FADE_OUT_MS.
            // Mid-taper the element is still visibly gold, so it must stay on top
            // rather than snapping back down in z-order.
            A.emphasisAmount = 0.2;
            assert.equal(names(promotedDrawOrder(slate.elements)), "B,C,A");
            A.emphasisAmount = 0;
            assert.equal(names(promotedDrawOrder(slate.elements)), "A,B,C",
                "once the taper reaches 0 the element drops back to declaration order");
        });

        it("promotes a mid-animation element via drawProgress", () => {
            let {slate, B} = scene();
            // drawProgress defaults to 1 and every finalise()/cancel resets it,
            // so < 1 is an independent "being drawn in right now" flag — it
            // covers an animation that never touches emphasis.
            B.drawProgress = 0.4;
            assert.equal(names(promotedDrawOrder(slate.elements)), "A,C,B");
            B.drawProgress = 1;
            assert.equal(names(promotedDrawOrder(slate.elements)), "A,B,C");
        });

        it("preserves relative order within each group", () => {
            let {slate, A, C} = scene();
            A.shouldHighlight = true;
            C.shouldHighlight = true;
            assert.equal(names(promotedDrawOrder(slate.elements)), "B,A,C",
                "A still precedes C among the promoted; the unpromoted keep their order too");
        });

        it("isPromoted covers highlight, emphasis and animation", () => {
            let {A} = scene();
            assert.ok(!isPromoted(A), "a resting element is not promoted");
            A.shouldHighlight = true;
            assert.ok(isPromoted(A));
            A.shouldHighlight = false;
            A.emphasisAmount = 0.5;
            assert.ok(isPromoted(A));
            A.emphasisAmount = 0;
            A.drawProgress = 0.5;
            assert.ok(isPromoted(A));
        });

        it("slate.highlightOnTop defaults on and can be turned off", () => {
            let {slate} = scene();
            assert.ok(slate.highlightOnTop, "#140 promotion is on by default");
            slate.highlightOnTop = false;
            assert.ok(!slate.highlightOnTop);
        });
    });

    // #138 — a figure's centring box must ignore construction helpers that
    // paint nothing. Hit on three decks (I.35, I.42, I.43): an off-screen
    // zero-colour helper inflated the box, present-centring translated the
    // real geometry off-canvas, and the slideshow rendered blank.
    describe("centringBounds (#138)", () => {

        // The I.42 shape: two invisible anchors defining the track two
        // sliders run along, plus the triangle the reader actually sees.
        // Zero colours (";0;0") make the anchors paint nothing — but they
        // are still `visible`, which is the whole point of the bug.
        function anchoredScene(anchorX: number): Slate {
            let slate = new Slate(createCanvas(340, 240));
            slate.inTest = true;
            const specs = [
                `B0;point;free;${-anchorX},180;0;0`,
                `B3;point;free;${anchorX},180;0;0`,
                "B;point;lineSlider;B0,B3,90,0",
                "C;point;lineSlider;B0,B3,210,0",
                "A;point;free;120,30",
                "AB;line;connect;A,B",
            ];
            for (const spec of specs) {
                const i = parseParam(spec);
                const el = slate.createElement(i.construction, i.params, i.name);
                // Mirror what init() does with the colour fields — note
                // parseParam yields the STRING "0", and parseColor maps that
                // to null (paints nothing); an omitted field takes the
                // default, which for edgeColor is black even on a point.
                el.nameColor = parseColor(i.nameColor, "black", "white");
                el.vertexColor = parseColor(i.vertexColor, "red", "white");
                el.edgeColor = parseColor(i.edgeColor, "black", "white");
            }
            slate.update();
            return slate;
        }

        it("excludes zero-colour helpers that a visibility filter would keep", () => {
            const slate = anchoredScene(1000);

            // The bug, stated as a test: `visible` is TRUE for these helpers,
            // so _bounds(true) — the fix originally proposed on the ticket —
            // would NOT have excluded them.
            const B0 = slate.lookupElement("B0");
            assert.ok(B0.visible,
                "a zero-colour helper is still `visible`; only asking what PAINTS excludes it");
            assert.deepEqual(slate.visibleBounds(), slate.figureBounds(),
                "visibleBounds and figureBounds agree here — a visibility filter is no fix");

            const b = slate.captureCentringBounds();
            assert.ok(b.minX > -1000 && b.maxX < 1000,
                `centring box should exclude the ±1000 anchors, got ${JSON.stringify(b)}`);
        });

        it("centres on the real geometry, not the helper span", () => {
            const slate = anchoredScene(1000);
            const b = slate.captureCentringBounds();
            const cx = (b.minX + b.maxX) / 2;
            // Painted geometry spans x = 90..210 (the two sliders) plus A at
            // 120, so the centre belongs near 150 — not near 0, which is what
            // the symmetric ±1000 anchors average to.
            assert.ok(cx > 90 && cx < 220,
                `centre should sit inside the drawn figure, got ${cx}`);
        });

        it("is unmoved by how far off-screen the helpers sit", () => {
            // I.35 failed with a one-sided helper at x=10000; I.42 with a
            // symmetric ±1000 pair. Different numbers, same cause — so the
            // centring box must not depend on them at all.
            const near = anchoredScene(1000).captureCentringBounds();
            const far = anchoredScene(100000).captureCentringBounds();
            // Compared with a tolerance, not exactly: a lineSlider
            // parameterised across a ±100000 track loses a little precision
            // (89.99999999998545 rather than 90). That is the slider's
            // arithmetic, not the centring box — what matters is that the
            // helpers' distance doesn't move the frame.
            almostEqual(far.minX, near.minX, 1e-6);
            almostEqual(far.maxX, near.maxX, 1e-6);
            almostEqual(far.minY, near.minY, 1e-6);
            almostEqual(far.maxY, near.maxY, 1e-6);
        });

        it("still counts an element that paints only a label", () => {
            let slate = new Slate(createCanvas(200, 200));
            slate.inTest = true;
            const i = parseParam("P;point;free;150,150;0;0");
            const el = slate.createElement(i.construction, i.params, i.name);
            el.nameColor = "black";     // labelled but no dot — it shows
            el.vertexColor = null;
            el.edgeColor = "black";     // irrelevant to a point; must not count
            const j = parseParam("Q;point;free;10,10");
            const q = slate.createElement(j.construction, j.params, j.name);
            q.nameColor = "black"; q.vertexColor = "red";
            slate.update();

            const b = slate.captureCentringBounds();
            assert.equal(b.maxX, 150, "a label-only point is visible ink and must count");
        });

        it("ignores an element hidden by initiallyHidden / a slide", () => {
            let slate = new Slate(createCanvas(200, 200));
            slate.inTest = true;
            for (const spec of ["A;point;free;10,10", "Z;point;free;900,900"]) {
                const i = parseParam(spec);
                const el = slate.createElement(i.construction, i.params, i.name);
                el.nameColor = "black"; el.vertexColor = "red";
            }
            slate.lookupElement("Z").visible = false;
            slate.update();

            const b = slate.captureCentringBounds();
            assert.ok(b.maxX < 900, "a hidden element paints nothing, so it must not frame the view");
        });

        it("falls back to the all-elements box when nothing paints", () => {
            let slate = new Slate(createCanvas(200, 200));
            slate.inTest = true;
            const i = parseParam("H;point;free;40,50;0;0");
            const el = slate.createElement(i.construction, i.params, i.name);
            el.nameColor = null; el.vertexColor = null;
            el.edgeColor = "black";     // the point default; still no ink
            slate.update();

            const b = slate.captureCentringBounds();
            assert.ok(b != null, "a figure of pure helpers still gets a box rather than null");
            assert.equal(b.minX, 40);
        });

        it("caches the box and clears it on demand", () => {
            const slate = anchoredScene(1000);
            assert.equal(slate.centringBounds, null, "nothing captured yet");
            const first = slate.captureCentringBounds();
            assert.deepEqual(slate.centringBounds, first, "captured box is readable");

            // Moving a point must NOT change the already-captured box: the
            // centre is fixed on entering the maximized view (#114) so a
            // resize mid-walk re-centres on the same frame the walk began in.
            (slate.lookupElement("A") as PointElement).x = 300;
            slate.update();
            assert.deepEqual(slate.centringBounds, first, "captured box stays put until cleared");

            slate.clearCentringBounds();
            assert.equal(slate.centringBounds, null);
        });
    });


    // #162 — an element can PAINT and still be pathologically large.
    //
    // #138 stopped an inkless off-canvas helper from dragging the centre
    // away. This is the other half: a circumcircle through near-collinear
    // points is unbounded, and on the hyperbolic Desargues figure one
    // reached radius ~11,300 on a 500x320 canvas — bounds of roughly
    // 22,600 x 23,100, so maximizing translated the figure into blank space.
    // Only the sliver crossing the canvas is ever seen, so such an element
    // must not decide where the centre is.
    describe("centring outliers (#162)", () => {

        // A small figure plus one runaway circle, in a 500x320 frame.
        function scene(runawayRadius: number | null): Slate {   // arg only toggles the degenerate circle
            // Deliberately NOT setting _logicalWidth/_logicalHeight: a
            // 500x320 canvas is the frame of reference via the getters.
            const slate = new Slate(createCanvas(500, 320));
            slate.inTest = true;
            const mk = (spec: string) => {
                const i = parseParam(spec);
                const el = slate.createElement(i.construction, i.params, i.name);
                el.nameColor = parseColor(i.nameColor, "black", "white");
                el.vertexColor = parseColor(i.vertexColor, "red", "white");
                el.edgeColor = parseColor(i.edgeColor, "black", "white");
                return el;
            };
            mk("A;point;free;100,100");
            mk("B;point;free;300,200");
            mk("AB;line;connect;A,B");
            if (runawayRadius != null) {
                // The real shape of the bug: a circumcircle through THREE
                // NEAR-COLLINEAR points. Its centre is computed internally
                // (not a painted element), so the only thing that grows is
                // the circle's own extent — which is exactly what #162 has
                // to notice. The nearer to collinear, the larger the radius.
                mk("N1;point;free;120,100");
                mk("N2;point;free;260,100");
                mk("N3;point;free;400,101");     // ~0.4 degrees off the line
                mk("BIG;circle;circumcircle;N1,N2,N3");
            }
            slate.update();
            return slate;
        }

        it("excludes an element far larger than the canvas", () => {
            const slate = scene(12000);
            const b = slate.captureCentringBounds()!;
            assert.ok(b.maxX - b.minX < 500 * 10,
                `centring box should not follow the runaway circle, got ` +
                `${Math.round(b.maxX - b.minX)} wide`);
            assert.ok(slate.centringOutliers.indexOf("BIG") >= 0,
                "and it should say which element it left out");
        });

        it("leaves figureBounds() untouched", () => {
            // The public bounds API still reports what the model contains;
            // only the CENTRING measurement is opinionated.
            const slate = scene(12000);
            slate.captureCentringBounds();
            const fb = slate.figureBounds()!;
            assert.ok(fb.maxX - fb.minX > 500 * 10,
                "figureBounds must still see the whole model");
        });

        it("does NOT exclude a figure that merely spills past its canvas", () => {
            // Real decks run to ~2-4x their canvas and must centre exactly as
            // before — the threshold is deliberately generous.
            const slate = scene(null);
            const mk = (spec: string) => {
                const i = parseParam(spec);
                const el = slate.createElement(i.construction, i.params, i.name);
                el.edgeColor = "black"; el.nameColor = null; el.vertexColor = null;
                return el;
            };
            mk("Wide;point;free;-600,-400");
            mk("Wide2;point;free;1100,700");
            mk("WW;line;connect;Wide,Wide2");
            slate.update();
            const b = slate.captureCentringBounds()!;
            assert.deepEqual(slate.centringOutliers, [],
                "a 1700x1100 figure on a 500x320 canvas is normal, not pathological");
            assert.ok(b.minX <= -600 && b.maxX >= 1100,
                "so it must still be measured in full");
        });

        it("reports no outliers on an ordinary figure", () => {
            const slate = scene(null);
            slate.captureCentringBounds();
            assert.deepEqual(slate.centringOutliers, []);
        });

        it("still centres when EVERY element is an outlier", () => {
            // Refusing to centre would be worse than centring on a runaway
            // figure, so the fallback must always produce a box.
            const slate = new Slate(createCanvas(500, 320));
            slate.inTest = true;
            (slate as any)._logicalWidth = 500;
            (slate as any)._logicalHeight = 320;
            const i = parseParam("P;point;free;0,0");
            const p = slate.createElement(i.construction, i.params, i.name);
            p.vertexColor = "red";
            const j = parseParam("Q;point;free;99999,99999");
            const q = slate.createElement(j.construction, j.params, j.name);
            q.vertexColor = "red";
            const k = parseParam("PQ;line;connect;P,Q");
            const l = slate.createElement(k.construction, k.params, k.name);
            l.edgeColor = "black"; l.nameColor = null; l.vertexColor = null;
            slate.update();
            const b = slate.captureCentringBounds();
            assert.ok(b != null, "must never refuse to produce a centring box");
        });

        it("outliers are recomputed on each capture", () => {
            const slate = scene(12000);
            slate.captureCentringBounds();
            assert.equal(slate.centringOutliers.length, 1);
            slate.captureCentringBounds();
            assert.equal(slate.centringOutliers.length, 1,
                "a second capture must not accumulate duplicates");
        });


        it("works on a slate with no explicitly-set logical size", () => {
            // The private _logicalWidth is 0 until init() sets it; the
            // GETTER falls back to the canvas bitmap. Reading the field made
            // this whole check a silent no-op on any slate built without an
            // explicit size — which is every scene the snapshot suite builds.
            const slate = scene(12000);
            assert.equal((slate as any)._logicalWidth, 0,
                "precondition: nothing set the logical size");
            slate.captureCentringBounds();
            assert.ok(slate.centringOutliers.indexOf("BIG") >= 0,
                "the canvas bitmap must serve as the frame of reference");
        });

        it("centringOutliers hands back a copy", () => {
            const slate = scene(12000);
            slate.captureCentringBounds();
            slate.centringOutliers.length = 0;
            assert.equal(slate.centringOutliers.length, 1);
        });
    });


    // #164 — the author names the centring target.
    //
    // #162 makes the DEFAULT robust: a pathological element can no longer
    // ruin an ordinary figure. This is the other half — the case where no
    // automatic rule can be right. Hyperbolic geodesics ARE large circles,
    // so the Desargues figure's bounds cannot be made to match its canvas by
    // any arrangement of its points; the author knows the centre and until
    // now had no way to say so.
    describe("centerOn (#164)", () => {

        // A figure whose bounds centre (250, 250) is deliberately NOT the
        // interesting centre — the marker sits well off to one side.
        function scene(): Slate {
            const slate = new Slate(createCanvas(500, 320));
            slate.inTest = true;
            const mk = (spec: string) => {
                const i = parseParam(spec);
                const el = slate.createElement(i.construction, i.params, i.name);
                el.nameColor = parseColor(i.nameColor, "black", "white");
                el.vertexColor = parseColor(i.vertexColor, "red", "white");
                el.edgeColor = parseColor(i.edgeColor, "black", "white");
                return el;
            };
            mk("A;point;free;0,0");
            mk("B;point;free;500,500");
            mk("AB;line;connect;A,B");
            // The target: addressable, but carries no label and paints no
            // ink of its own — the shape `diskcenter` takes on the real page.
            const m = mk("mark;point;free;400,100");
            m.nameColor = null;
            m.vertexColor = null;
            slate.update();
            return slate;
        }

        it("centres the box on the named element", () => {
            const slate = scene();
            const before = slate.captureCentringBounds()!;
            assert.equal((before.minX + before.maxX) / 2, 250,
                "precondition: bounds centre is the midpoint of A..B");

            slate.clearCentringBounds();
            slate.setCenterOn("mark");
            const b = slate.captureCentringBounds()!;
            assert.equal((b.minX + b.maxX) / 2, 400);
            assert.equal((b.minY + b.maxY) / 2, 100);
        });

        it("works on an element with no label and no ink", () => {
            // The Desargues target (`diskcenter`) is drawn with nameColor 0.
            // Lookup must not assume a labelled or painting element.
            const slate = scene();
            assert.equal(slate.lookupElement("mark")!.nameColor, null,
                "precondition: the target carries no label");
            slate.setCenterOn("mark");
            const b = slate.captureCentringBounds()!;
            assert.equal((b.minX + b.maxX) / 2, 400);
        });

        it("preserves the box's extent, shifting only the centre", () => {
            // cloneAside sizes its aside from this box, so the extent has to
            // survive — only the centre is the author's to override.
            const slate = scene();
            const before = slate.captureCentringBounds()!;
            const w = before.maxX - before.minX, h = before.maxY - before.minY;
            slate.clearCentringBounds();
            slate.setCenterOn("mark");
            const after = slate.captureCentringBounds()!;
            assert.equal(after.maxX - after.minX, w);
            assert.equal(after.maxY - after.minY, h);
        });

        it("uses an element's own centre when it has extent", () => {
            const slate = scene();
            const i = parseParam("Cc;point;free;100,100");
            slate.createElement(i.construction, i.params, i.name);
            const j = parseParam("K;circle;radius;Cc,A");
            const k = slate.createElement(j.construction, j.params, j.name);
            k.edgeColor = "black";
            slate.update();
            slate.setCenterOn("K");
            const b = slate.captureCentringBounds()!;
            assert.equal((b.minX + b.maxX) / 2, 100, "a circle centres on its centre");
            assert.equal((b.minY + b.maxY) / 2, 100);
        });

        it("resolves through the alias table", () => {
            const slate = scene();
            slate.addAlias("theCentre", "mark");
            slate.setCenterOn("theCentre");
            const b = slate.captureCentringBounds()!;
            assert.equal((b.minX + b.maxX) / 2, 400);
        });

        it("reports an unresolvable name and falls back to bounds", () => {
            const slate = scene();
            slate.setCenterOn("nope");
            const codes = slate.diagnostics.map((d) => d.code);
            assert.ok(codes.indexOf("unknown-center-on") >= 0,
                "a typo must not be swallowed: " + JSON.stringify(codes));
            const b = slate.captureCentringBounds()!;
            assert.equal((b.minX + b.maxX) / 2, 250,
                "and the figure still centres the old way");
        });

        it("changes nothing when it is not set", () => {
            // The default path must be untouched — every existing deck.
            const slate = scene();
            assert.equal(slate.centerOn, null);
            const b = slate.captureCentringBounds()!;
            assert.equal((b.minX + b.maxX) / 2, 250);
            assert.deepEqual(slate.diagnostics.map((d) => d.code), []);
        });

        it("setCenterOn(null) goes back to bounds centring", () => {
            const slate = scene();
            slate.setCenterOn("mark");
            slate.setCenterOn(null);
            assert.equal(slate.centerOn, null);
            const b = slate.captureCentringBounds()!;
            assert.equal((b.minX + b.maxX) / 2, 250);
        });

        it("survives clearCentringBounds — it is config, not measurement", () => {
            const slate = scene();
            slate.setCenterOn("mark");
            slate.captureCentringBounds();
            slate.clearCentringBounds();
            assert.equal(slate.centerOn, "mark");
            const b = slate.captureCentringBounds()!;
            assert.equal((b.minX + b.maxX) / 2, 400,
                "leaving and re-entering the maximized view must re-apply it");
        });

        it("still honours the #162 outlier exclusion", () => {
            // The two features compose: the runaway circle neither defines
            // the extent nor drags the centre.
            const slate = scene();
            const i = parseParam("Far;point;free;-12000,0");
            slate.createElement(i.construction, i.params, i.name);
            const j = parseParam("BIG;circle;radius;Far,A");
            const k = slate.createElement(j.construction, j.params, j.name);
            k.edgeColor = "black";
            slate.update();
            slate.setCenterOn("mark");
            const b = slate.captureCentringBounds()!;
            assert.ok(slate.centringOutliers.indexOf("BIG") >= 0);
            assert.equal((b.minX + b.maxX) / 2, 400);
            assert.ok(b.maxX - b.minX < 500 * 10, "extent stays sane too");
        });
    });

    describe("drag coordinates: 2D pivot scene", () => {

        it("should rotate non-pivot elements around F when dragging a derived point", () => {
            let slate = buildPivotScene();
            slate.setPivot("F");

            let A = slate.lookupElement("A") as PointElement;
            let D = slate.lookupElement("D") as PointElement;
            let F = slate.lookupElement("F") as PointElement;
            let fInitX = F.x, fInitY = F.y;
            let aInitX = A.x, aInitY = A.y;

            let dx0 = Math.round(D.x), dy0 = Math.round(D.y);
            slate._onMouseDown(dx0, dy0);
            slate._onMouseDrag(dx0 + 20, dy0 + 15);
            slate._onMouseUp(dx0 + 20, dy0 + 15);

            almostEqual(F.x, fInitX, 0.001);
            almostEqual(F.y, fInitY, 0.001);
            almostEqual(D.x, dx0 + 20, 0.5);
            almostEqual(D.y, dy0 + 15, 0.5);
            assert.ok(Math.hypot(A.x - aInitX, A.y - aInitY) > 1,
                `A should have moved; went from (${aInitX},${aInitY}) to (${A.x},${A.y})`);
        });

        it("should translate every non-preexisting element when dragging with no pivot", () => {
            let slate = buildPivotScene();
            // No setPivot → the drag branch becomes translateCoordinates.

            let A = slate.lookupElement("A") as PointElement;
            let D = slate.lookupElement("D") as PointElement;
            let aInitX = A.x, aInitY = A.y;
            let dInitX = D.x, dInitY = D.y;

            let dx0 = Math.round(D.x), dy0 = Math.round(D.y);
            slate._onMouseDown(dx0, dy0);
            slate._onMouseDrag(dx0 + 20, dy0 + 15);
            slate._onMouseUp(dx0 + 20, dy0 + 15);

            almostEqual(A.x, aInitX + 20, 0.001);
            almostEqual(A.y, aInitY + 15, 0.001);
            almostEqual(D.x, dInitX + 20, 0.001);
            almostEqual(D.y, dInitY + 15, 0.001);
        });
    });

    describe("drag coordinates: 3D plane scene", () => {

        it("should translate 3D plane elements when dragging a non-draggable point", () => {
            let slate = buildScene3d();

            let origin = slate.lookupElement("origin") as PointElement;
            let x = slate.lookupElement("x") as PointElement;
            let D = slate.lookupElement("D") as PointElement;
            let A = slate.lookupElement("A") as PointElement;
            let oInitX = origin.x, oInitY = origin.y;
            let xInitX = x.x, xInitY = x.y;
            let aInitX = A.x, aInitY = A.y;

            // Slate derives the drag delta from the pick's actual position,
            // not the rounded mouse-down coords — compute delta the same way.
            let dInitX = D.x, dInitY = D.y;
            let dx0 = Math.round(dInitX), dy0 = Math.round(dInitY);
            let targetX = dx0 + 15, targetY = dy0 - 10;
            let deltaX = targetX - dInitX;
            let deltaY = targetY - dInitY;
            slate._onMouseDown(dx0, dy0);
            slate._onMouseDrag(targetX, targetY);
            slate._onMouseUp(targetX, targetY);

            almostEqual(origin.x, oInitX + deltaX, 0.001);
            almostEqual(origin.y, oInitY + deltaY, 0.001);
            almostEqual(x.x, xInitX + deltaX, 0.001);
            almostEqual(x.y, xInitY + deltaY, 0.001);
            almostEqual(A.x, aInitX + deltaX, 0.001);
            almostEqual(A.y, aInitY + deltaY, 0.001);
        });

        it("should rotate 3D plane elements around a pivot on xyplane", () => {
            let slate = buildScene3d();
            slate.setPivot("origin,xyplane");

            let origin = slate.lookupElement("origin") as PointElement;
            let D = slate.lookupElement("D") as PointElement;
            let A = slate.lookupElement("A") as PointElement;
            let oInitX = origin.x, oInitY = origin.y;
            let aInitX = A.x, aInitY = A.y;

            let dx0 = Math.round(D.x), dy0 = Math.round(D.y);
            slate._onMouseDown(dx0, dy0);
            slate._onMouseDrag(dx0 + 20, dy0 + 12);
            slate._onMouseUp(dx0 + 20, dy0 + 12);

            almostEqual(origin.x, oInitX, 0.001);
            almostEqual(origin.y, oInitY, 0.001);
            assert.ok(Math.hypot(A.x - aInitX, A.y - aInitY) > 0.5,
                `A should have rotated; went from (${aInitX},${aInitY}) to (${A.x},${A.y})`);
        });

        it("should also restore the FixedPoint from the 3D scene on reset", () => {
            let slate = buildScene3d();
            let x = slate.lookupElement("x") as PointElement;
            let xInit: [number, number, number] = [x.x, x.y, x.z];

            let D = slate.lookupElement("D") as PointElement;
            slate._onMouseDown(Math.round(D.x), Math.round(D.y));
            slate._onMouseDrag(Math.round(D.x) + 15, Math.round(D.y) - 10);
            slate._onMouseUp(Math.round(D.x) + 15, Math.round(D.y) - 10);

            assert.ok(x.x !== xInit[0] || x.y !== xInit[1],
                "FixedPoint should have translated before reset");

            slate.reset();

            almostEqual(x.x, xInit[0], 0.001);
            almostEqual(x.y, xInit[1], 0.001);
            almostEqual(x.z, xInit[2], 0.001);
        });
    });

    describe("drag coordinates: specialized scene", () => {

        it("should translate specialized elements (RegularPolygon, Application, InvertCircle, etc.)", () => {
            let slate = buildSpecializedScene();

            let A = slate.lookupElement("A") as PointElement;
            let M = slate.lookupElement("M") as PointElement;
            let aInitX = A.x, aInitY = A.y;
            let mInitX = M.x, mInitY = M.y;

            let dx0 = Math.round(mInitX), dy0 = Math.round(mInitY);
            let targetX = dx0 + 25, targetY = dy0 + 15;
            let deltaX = targetX - mInitX;
            let deltaY = targetY - mInitY;
            slate._onMouseDown(dx0, dy0);
            slate._onMouseDrag(targetX, targetY);
            slate._onMouseUp(targetX, targetY);

            almostEqual(A.x, aInitX + deltaX, 0.001);
            almostEqual(A.y, aInitY + deltaY, 0.001);
        });

        it("should rotate specialized elements around a pivot", () => {
            let slate = buildSpecializedScene();
            slate.setPivot("C");

            let M = slate.lookupElement("M") as PointElement;
            let A = slate.lookupElement("A") as PointElement;
            let C = slate.lookupElement("C") as PointElement;
            let aInitX = A.x, aInitY = A.y;
            let cInitX = C.x, cInitY = C.y;

            let dx0 = Math.round(M.x), dy0 = Math.round(M.y);
            slate._onMouseDown(dx0, dy0);
            slate._onMouseDrag(dx0 + 20, dy0 + 15);
            slate._onMouseUp(dx0 + 20, dy0 + 15);

            almostEqual(C.x, cInitX, 0.001);
            almostEqual(C.y, cInitY, 0.001);
            assert.ok(Math.hypot(A.x - aInitX, A.y - aInitY) > 0.5,
                `A should have rotated; stayed at (${A.x},${A.y})`);
        });

        it("should restore all slider initial positions when slate.reset() is called", () => {
            let slate = buildSpecializedScene();

            let A = slate.lookupElement("A") as PointElement;   // PlaneSlider
            let P = slate.lookupElement("P") as PointElement;   // CircleSlider
            let Q = slate.lookupElement("Q") as PointElement;   // SphereSlider
            let inits = new Map<PointElement, [number, number, number]>();
            for (let p of [A, P, Q]) inits.set(p, [p.x, p.y, p.z]);

            let M = slate.lookupElement("M") as PointElement;
            slate._onMouseDown(Math.round(M.x), Math.round(M.y));
            slate._onMouseDrag(Math.round(M.x) + 25, Math.round(M.y) + 15);
            slate._onMouseUp(Math.round(M.x) + 25, Math.round(M.y) + 15);

            let [ax, ay] = inits.get(A)!;
            assert.ok(A.x !== ax || A.y !== ay, "A should have moved before reset");

            slate.reset();

            for (let [p, [x, y, z]] of inits) {
                almostEqual(p.x, x, 0.01);
                almostEqual(p.y, y, 0.01);
                almostEqual(p.z, z, 0.01);
            }
        });
    });

    // Regression test for bugfix/issue-41 — propI2 slate1.
    // Dragging a non-draggable Layoff point (L, created via
    // point;last on a line;extend-produced LineElement) should rotate
    // the whole scene around the pivot D, including ALL derived
    // Layoff points (E, G, F, H, K) — not just the free points (A, B, C).
    // Before the fix, preexists marking on shared Layoff objects caused
    // the derived points to be skipped during rotation, leaving them
    // stationary while A/B/C swung around D — a visibly sheared scene.
    describe("drag coordinates: propI2 slate1 (issue #41)", () => {
        let params = [
            "A;point;free;160,190",
            "B;point;free;190,160",
            "C;point;free;180,90",
            "BC;line;connect;B,C",
            "DAB;polygon;equilateralTriangle;A,B;0;0;0;0",
            "D;point;vertex;DAB,3;black;green",
            "AL;line;extend;D,A,B,C",
            "L;point;last;AL",
            "LE;line;extend;A,L,A,B",
            "E;point;last;LE;black;0",
            "BG;line;extend;D,B,B,C",
            "G;point;last;BG",
            "GF;line;extend;B,G,A,B",
            "F;point;last;GF;black;0",
            "BH;line;extend;G,B,G,B;0;0;0",
            "H;point;last;BH;black;0",
            "DK;line;extend;G,D,G,D;0;0;0",
            "K;point;last;DK;black;0",
        ];

        function buildScene(): Slate {
            let slate = new Slate(createCanvas(340, 320));
            let parseParam = require("../src/index").parseParam;
            for (let p of params) {
                let info = parseParam(p);
                slate.createElement(info.construction, info.params, info.name);
            }
            slate.elements.forEach(e => e.update());
            for (let e of slate.elements) {
                if (e instanceof PointElement && (e as any).vertexColor == null) {
                    (e as any).vertexColor = "black";
                }
            }
            slate.setPivot("D");
            return slate;
        }

        it("dragging L rotates every derived point, not only the free A/B/C", () => {
            let slate = buildScene();
            let before: Record<string, [number, number]> = {};
            for (let n of ["A","B","C","D","L","E","G","F","H","K"]) {
                let p = slate.lookupElement(n) as PointElement;
                before[n] = [p.x, p.y];
            }

            let L = slate.lookupElement("L") as PointElement;
            let fromX = Math.round(L.x), fromY = Math.round(L.y);
            let toX = fromX + 50, toY = fromY + 30;
            (slate as any)._onMouseDown(fromX, fromY);
            (slate as any)._onMouseDrag(toX, toY);
            (slate as any)._onMouseUp(toX, toY);

            let moved = (n: string) => {
                let p = slate.lookupElement(n) as PointElement;
                return Math.hypot(p.x - before[n][0], p.y - before[n][1]);
            };

            // Pivot must not move.
            assert.ok(moved("D") < 0.001, `D (pivot) unexpectedly moved by ${moved("D")}`);
            // L lands at drop target.
            assert.ok(Math.abs(L.x - toX) < 1 && Math.abs(L.y - toY) < 1,
                `L should have landed at (${toX},${toY}), got (${L.x},${L.y})`);
            // Every non-pivot point must rotate, including Layoff-backed ones.
            for (let n of ["A","B","C","E","G","F","H","K"]) {
                assert.ok(moved(n) > 5,
                    `${n} should rotate with L; moved by only ${moved(n).toFixed(2)} px`);
            }
        });

        it("L stays on the ray DA after the drag (Layoff invariant)", () => {
            let slate = buildScene();
            let L = slate.lookupElement("L") as PointElement;
            let fromX = Math.round(L.x), fromY = Math.round(L.y);
            (slate as any)._onMouseDown(fromX, fromY);
            (slate as any)._onMouseDrag(fromX + 30, fromY + 20);
            (slate as any)._onMouseUp(fromX + 30, fromY + 20);

            let A = slate.lookupElement("A") as PointElement;
            let D = slate.lookupElement("D") as PointElement;
            let dA = Math.hypot(A.x - D.x, A.y - D.y);
            let dL = Math.hypot(L.x - D.x, L.y - D.y);
            let ux = (A.x - D.x) / dA, uy = (A.y - D.y) / dA;
            let err = Math.hypot(L.x - (D.x + dL * ux), L.y - (D.y + dL * uy));
            assert.ok(err < 0.5, `L should stay on ray DA; off by ${err.toFixed(2)} px`);
        });
    });

    // Exercises src/index.ts init() — the public entry point. Snapshot
    // tests use buildScene() directly; unit tests construct Slate without
    // going through init(). Stubs the DOM lookup init() needs.
    it("init() should build a slate from an IInitialization config", () => {
        let canvas: any = createCanvas(250, 250);
        canvas.clientWidth = 250;
        canvas.clientHeight = 250;
        canvas.parentElement = null;  // skip createControls — no DOM tree

        let savedDoc = (global as any).document;
        (global as any).document = {
            getElementById: (id: string) => id === "myCanvas" ? canvas : null,
        };

        try {
            let before = slates.length;
            init({
                background: "35,19,100",
                title: "init-test",
                canvasid: "myCanvas",
                elements: [
                    // Mix of string (parseParam path) and object form.
                    "A;point;free;60,60",
                    { name: "B", construction: E.Point.free, params: [180, 60] },
                    { name: "C", construction: E.Point.free, params: [120, 180] },
                    "circABC;circle;circumcircle;A,B,C",
                    { name: "F", construction: E.Point.center, params: ["circABC"] },
                ],
                pivot: "F",
            });

            assert.equal(slates.length, before + 1,
                "init() should have pushed one slate onto geomlib.slates");
            let slate = slates[slates.length - 1];
            let A = slate.lookupElement("A") as PointElement;
            assert.ok(A instanceof PlaneSlider, "A should be a PlaneSlider");
            almostEqual(A.x, 60, 0.001);
            almostEqual(A.y, 60, 0.001);
            let F = slate.lookupElement("F") as PointElement;
            assert.ok(F != null, "F should be constructed");
        } finally {
            if (savedDoc === undefined) delete (global as any).document;
            else (global as any).document = savedDoc;
        }
    });

    // Helper used by SlateControls.maximize() to keep the canvas bitmap in
    // sync with the wrapper's CSS size when the viewport changes (issue #61).
    // Pure function — no real Window needed for the unit test.
    describe("trackWindowResize", () => {
        it("attaches a resize listener and the teardown removes it", () => {
            let attached: Array<{type: string; fn: () => void}> = [];
            let removed: Array<{type: string; fn: () => void}> = [];
            let target = {
                addEventListener: (type: "resize", fn: () => void) => {
                    attached.push({type, fn});
                },
                removeEventListener: (type: "resize", fn: () => void) => {
                    removed.push({type, fn});
                },
            };
            let callCount = 0;
            let teardown = trackWindowResize(target, () => { callCount++; });

            assert.equal(attached.length, 1, "should attach exactly one listener");
            assert.equal(attached[0].type, "resize");

            // Firing the attached handler triggers the callback.
            attached[0].fn();
            assert.equal(callCount, 1);
            attached[0].fn();
            assert.equal(callCount, 2);

            // Teardown removes the SAME handler reference (otherwise the
            // browser would keep firing it after we stopped caring).
            teardown();
            assert.equal(removed.length, 1);
            assert.equal(removed[0].type, "resize");
            assert.equal(removed[0].fn, attached[0].fn,
                "teardown must pass the original handler so removeEventListener actually unregisters it");
        });
    });

    // #139 — Escape peels off ONE layer of viewport takeover per press.
    // Pure routing decision, so no DOM is needed to pin the semantics.
    describe("escapeAction", () => {
        it("exits presentation first, keeping the maximized view (#115)", () => {
            assert.equal(
                escapeAction({presenting: true, maximized: true}), "exitPresent",
                "the first Escape in a slideshow must leave the walk, NOT un-maximize — " +
                "#115 keeps the viewer's manipulation until they leave the maximized view");
        });

        it("minimizes on the next press, once the walk is over", () => {
            assert.equal(
                escapeAction({presenting: false, maximized: true}), "minimize",
                "Escape in the maximized view (no slideshow running) should leave it");
        });

        it("does nothing for an inline canvas", () => {
            assert.equal(
                escapeAction({presenting: false, maximized: false}), "none",
                "Escape must not reset or otherwise disturb a diagram sitting inline");
        });

        it("takes two presses to leave a slideshow entirely", () => {
            // Walk the state machine the way the handler drives it: each press
            // performs its action, which flips the corresponding flag.
            let presenting = true, maximized = true;
            const press = () => {
                const action = escapeAction({presenting, maximized});
                if (action === "exitPresent") presenting = false;
                if (action === "minimize") maximized = false;
                return action;
            };
            assert.equal(press(), "exitPresent");
            assert.ok(maximized, "still maximized after leaving the walk");
            assert.equal(press(), "minimize");
            assert.ok(!maximized && !presenting, "fully out after the second press");
            assert.equal(press(), "none", "further presses are inert");
        });
    });

    // When geomlib.init() throws, the conventional fallback is the
    // <noscript> sibling of the canvas — usually a static .gif image
    // representing the diagram. This helper reveals it. Issue #53.
    describe("revealNoscriptFallback", () => {
        function makeStubCanvas(noscript: any): any {
            return {
                nextElementSibling: noscript,
                style: { display: "" },
            };
        }
        function makeStubNoscript(innerHTML: string): any {
            let inserted: any[] = [];
            let stub: any = {
                tagName: "NOSCRIPT",
                innerHTML,
                nextElementSibling: null,
                parentNode: { insertBefore: (node: any) => inserted.push(node) },
            };
            stub.insertedSiblings = inserted;
            return stub;
        }

        // Each test stubs the bare minimum of `document` so the helper's
        // document.createElement call works.
        function withStubDocument<T>(fn: () => T): T {
            let savedDoc = (global as any).document;
            (global as any).document = {
                createElement: (_: string) => ({ innerHTML: "" }),
            };
            try {
                return fn();
            } finally {
                if (savedDoc === undefined) delete (global as any).document;
                else (global as any).document = savedDoc;
            }
        }

        it("reveals the noscript content and hides the canvas", () => {
            withStubDocument(() => {
                let noscript = makeStubNoscript('<img src="propI4.gif"/>');
                let canvas = makeStubCanvas(noscript);

                revealNoscriptFallback(canvas);

                assert.equal(noscript.insertedSiblings.length, 1,
                    "should have inserted exactly one wrapper before the noscript");
                assert.equal(noscript.insertedSiblings[0].innerHTML, '<img src="propI4.gif"/>',
                    "the wrapper should carry the noscript's raw markup so the browser parses it as real DOM");
                assert.equal(canvas.style.display, "none",
                    "canvas should be hidden so it doesn't show as a blank box next to the fallback");
            });
        });

        it("is a no-op when no noscript sibling is present", () => {
            withStubDocument(() => {
                let canvas = makeStubCanvas(null);
                // Should neither throw nor mutate the canvas style.
                assert.doesNotThrow(() => revealNoscriptFallback(canvas));
                assert.equal(canvas.style.display, "");
            });
        });

        it("is a no-op when canvas is null", () => {
            withStubDocument(() => {
                assert.doesNotThrow(() => revealNoscriptFallback(null));
            });
        });

        it("swallows internal errors so the original error keeps surfacing", () => {
            // If document.createElement itself throws, the helper should
            // not propagate — init() already plans to re-throw the real
            // failure after calling this helper.
            let savedDoc = (global as any).document;
            (global as any).document = {
                createElement: () => { throw new Error("doc broken"); },
            };
            try {
                let canvas = makeStubCanvas(makeStubNoscript("<img/>"));
                assert.doesNotThrow(() => revealNoscriptFallback(canvas));
            } finally {
                if (savedDoc === undefined) delete (global as any).document;
                else (global as any).document = savedDoc;
            }
        });
    });

    describe("element name aliases", () => {
        // Joyce's prose names the same circle as both "BCD" and "CDB"
        // and the same line as both "AB" and "BA". Slate.lookupElement
        // resolves the secondary name to the canonical element so the
        // shortcode-driven highlight on the consumer site doesn't need
        // a separate invisible duplicate per alias.
        let triangle_data: IConstructionInfo[] = [
            { construction: E.Point.free,    name: "A",   params: [50, 50] },
            { construction: E.Point.free,    name: "B",   params: [150, 50] },
            { construction: E.Line.connect,  name: "AB",  params: ["A", "B"] },
            { construction: E.Circle.radius, name: "BCD", params: ["A", "B"] },
        ];

        it("resolves a secondary name to the canonical element", () => {
            let slate: Slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            slate.addAlias("CDB", "BCD");
            slate.addAlias("BA", "AB");
            let canonical = slate.lookupElement("BCD");
            assert.ok(canonical);
            assert.strictEqual(slate.lookupElement("CDB"), canonical);
            assert.strictEqual(slate.lookupElement("BA"), slate.lookupElement("AB"));
        });

        it("returns null when the alias target itself doesn't exist", () => {
            let slate: Slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            slate.addAlias("XYZ", "NOPE");
            assert.strictEqual(slate.lookupElement("XYZ"), null);
        });

        it("prefers a direct match over an alias when both exist", () => {
            // Edge case: someone authored both an element named "BA"
            // AND an alias "BA → AB". Direct match wins.
            let slate: Slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            // Add a separate BA line so we can disambiguate.
            toElements(slate, [
                { construction: E.Line.connect, name: "BA", params: ["B", "A"] },
            ]);
            slate.addAlias("BA", "AB");
            let direct = slate.lookupElement("BA");
            let canonical = slate.lookupElement("AB");
            assert.ok(direct);
            assert.notStrictEqual(direct, canonical);
        });

        it("addAliases bulk-loads a map", () => {
            let slate: Slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            slate.addAliases({"CDB": "BCD", "BA": "AB"});
            assert.strictEqual(slate.lookupElement("CDB"), slate.lookupElement("BCD"));
            assert.strictEqual(slate.lookupElement("BA"),  slate.lookupElement("AB"));
        });
    });

    describe("view offset + visibleBounds (#99)", () => {
        let triangle_data: IConstructionInfo[] = [
            { construction: E.Point.free,       name: "A",   params: [50, 50] },
            { construction: E.Point.free,       name: "B",   params: [150, 50] },
            { construction: E.Point.free,       name: "C",   params: [100, 140] },
            { construction: E.Polygon.triangle, name: "ABC", params: ["A", "B", "C"] },
        ];

        it("setViewOffset / clearViewOffset round-trips", () => {
            let slate: Slate = new Slate(createCanvas(200, 200));
            assert.strictEqual(slate.viewOffsetX, 0);
            assert.strictEqual(slate.viewOffsetY, 0);
            slate.setViewOffset(30, -20);
            assert.strictEqual(slate.viewOffsetX, 30);
            assert.strictEqual(slate.viewOffsetY, -20);
            slate.clearViewOffset();
            assert.strictEqual(slate.viewOffsetX, 0);
            assert.strictEqual(slate.viewOffsetY, 0);
        });

        it("reset restores a dragged free point to its initial position", () => {
            let slate: Slate = new Slate(createCanvas(200, 200));
            toElements(slate, [
                { construction: E.Point.free, name: "A", params: [100, 100] },
            ]);
            slate.elements.forEach(e => { (e as any).vertexColor = "black"; e.update(); });
            const A = slate.lookupElement("A") as PointElement;
            slate._onMouseDown(100, 100);
            slate._onMouseDrag(150, 60);
            slate._onMouseUp(150, 60);
            almostEqual(A.x, 150, 0.5); almostEqual(A.y, 60, 0.5);   // dragged
            slate.reset();
            almostEqual(A.x, 100, 0.001); almostEqual(A.y, 100, 0.001);   // restored
        });

        it("styleScale enlarges the label font so it stays constant size under fit-scale (#71)", () => {
            GeomElement.setFont("Times New Roman", 18);
            GeomElement.styleScale = 1;
            assert.ok(GeomElement.fontString().includes("18px"), GeomElement.fontString());
            GeomElement.styleScale = 2;   // figure shrunk to F=0.5 → decorations ×2
            assert.ok(GeomElement.fontString().includes("36px"), GeomElement.fontString());
            GeomElement.styleScale = 1;   // reset for other tests
        });

        it("logicalWidth defaults to the bitmap; setLogicalSize overrides (#71)", () => {
            const slate: Slate = new Slate(createCanvas(400, 300));
            assert.strictEqual(slate.logicalWidth, 400);
            assert.strictEqual(slate.logicalHeight, 300);
            slate.setLogicalSize(680, 520);
            assert.strictEqual(slate.logicalWidth, 680);
            assert.strictEqual(slate.logicalHeight, 520);
        });

        it("recomputeFitScale = min(1, display/logical) — shrinks, never grows (#71)", () => {
            const slate: Slate = new Slate(createCanvas(340, 260));   // display = bitmap (node)
            // Logical smaller than display → no scaling (clamped to 1).
            slate.setLogicalSize(200, 150);
            slate.recomputeFitScale();
            assert.strictEqual(slate.viewScale, 1);
            // Logical larger than display → shrink to fit (the narrow-column case).
            slate.setLogicalSize(680, 520);
            slate.recomputeFitScale();
            almostEqual(slate.viewScale, 0.5, 0.001);   // min(340/680, 260/520)
        });

        it("the pick path maps display px → logical coords through the fit-scale (#71)", () => {
            const slate: Slate = new Slate(createCanvas(340, 260));
            (slate as any)._htmlCanvas = { getBoundingClientRect: () => ({ left: 0, top: 0 }) };
            slate.setLogicalSize(680, 520);
            slate.recomputeFitScale();   // F = 0.5
            // A click at display (100, 50) is logical (200, 100).
            assert.deepStrictEqual(slate._getCanvasPosition(100, 50), [200, 100]);
        });

        it("drag clamp uses the on-screen model range under the fit-scale (#71)", () => {
            const slate: Slate = new Slate(createCanvas(340, 260));
            toElements(slate, [
                { construction: E.Point.free, name: "A", params: [200, 100] },
            ]);
            slate.elements.forEach(e => { (e as any).vertexColor = "black"; e.update(); });
            const A = slate.lookupElement("A") as PointElement;
            slate.setLogicalSize(680, 520);
            slate.recomputeFitScale();   // F = 0.5 → on-screen model range [0,680]×[0,520]
            slate._onMouseDown(200, 100);
            slate._onMouseDrag(1000, 500);   // past the right edge
            slate._onMouseUp(1000, 500);
            almostEqual(A.x, 680, 0.5);   // clamped to displayWidth/F = logical width
            almostEqual(A.y, 500, 0.5);   // within range, unclamped
        });

        it("drag clamp shifts with the view offset (#107 maximized recenter)", () => {
            let slate: Slate = new Slate(createCanvas(200, 200));
            toElements(slate, [
                { construction: E.Point.free, name: "A", params: [100, 150] },
                { construction: E.Point.free, name: "B", params: [120, 150] },
            ]);
            slate.elements.forEach(e => { (e as any).vertexColor = "black"; e.update(); });
            const A = slate.lookupElement("A") as PointElement;
            // Shift the figure DOWN by 80px (as #107 centring does on a
            // maximized canvas). Model y = −40 is screen y = 40 → on-canvas.
            slate.setViewOffset(0, 80);
            slate._onMouseDown(100, 150);
            slate._onMouseDrag(100, -40);
            slate._onMouseUp(100, -40);
            // Pre-fix this pinned at y=0 (clamped to [0,h]); now [−80,120].
            almostEqual(A.y, -40, 0.5);
        });

        it("the pick path subtracts the view offset (drag stays on the real element)", () => {
            let slate: Slate = new Slate(createCanvas(200, 200));
            // Stub the DOM rect _getCanvasPosition reads.
            (slate as any)._htmlCanvas = { getBoundingClientRect: () => ({ left: 5, top: 7 }) };
            // No offset → just the rect subtraction.
            assert.deepStrictEqual(slate._getCanvasPosition(105, 207), [100, 200]);
            // With the figure slid by (30,-20), a click at the same screen
            // point resolves 30px left / 20px down in model space.
            slate.setViewOffset(30, -20);
            assert.deepStrictEqual(slate._getCanvasPosition(105, 207), [70, 220]);
        });

        it("visibleBounds spans every visible named element", () => {
            let slate: Slate = new Slate(createCanvas(300, 300));
            toElements(slate, triangle_data);
            slate.elements.forEach(e => e.update());
            const b = slate.visibleBounds()!;
            assert.ok(b);
            assert.strictEqual(b.minX, 50);
            assert.strictEqual(b.maxX, 150);
            assert.strictEqual(b.minY, 50);
            assert.strictEqual(b.maxY, 140);
        });

        it("visibleBounds grows to enclose a circle (centre ± radius)", () => {
            let slate: Slate = new Slate(createCanvas(400, 400));
            toElements(slate, [
                { construction: E.Point.free,    name: "A",   params: [150, 150] },
                { construction: E.Point.free,    name: "B",   params: [250, 150] },
                // centre A(150,150), radius |AB| = 100 → spans [50,250]².
                { construction: E.Circle.radius, name: "BCD", params: ["A", "B"] },
            ]);
            slate.elements.forEach(e => e.update());
            const b = slate.visibleBounds()!;
            assert.strictEqual(b.minX, 50);
            assert.strictEqual(b.maxX, 250);
            assert.strictEqual(b.minY, 50);
            assert.strictEqual(b.maxY, 250);
        });

        it("visibleBounds ignores hidden elements and returns null when empty", () => {
            let slate: Slate = new Slate(createCanvas(300, 300));
            // Only screen helpers present → no figure.
            assert.strictEqual(slate.visibleBounds(), null);
            toElements(slate, triangle_data);
            slate.elements.forEach(e => e.update());
            // Hide everything named → back to null.
            slate.elements.forEach(e => { if (e.name != null) e.visible = false; });
            assert.strictEqual(slate.visibleBounds(), null);
        });

        it("figureBounds spans hidden elements too (stable across visibility)", () => {
            let slate: Slate = new Slate(createCanvas(300, 400));
            toElements(slate, [
                { construction: E.Point.free, name: "A", params: [50, 50] },
                { construction: E.Point.free, name: "B", params: [150, 50] },
                { construction: E.Line.connect, name: "AB", params: ["A", "B"] },
                // A lone far point that defines the lower bound on its own.
                { construction: E.Point.free, name: "F", params: [50, 300] },
            ]);
            slate.elements.forEach(e => e.update());
            const full = slate.figureBounds()!;
            assert.strictEqual(full.maxY, 300);
            // Hide F — visibleBounds shrinks (no element reaches y=300),
            // figureBounds is unchanged.
            (slate.lookupElement("F") as PointElement).visible = false;
            assert.strictEqual(slate.visibleBounds()!.maxY, 50,
                "visibleBounds shrinks when F is hidden");
            assert.deepStrictEqual(slate.figureBounds(), full,
                "figureBounds unchanged by hiding F");
        });
    });

    describe("highlight event + alias names (#108)", () => {
        let triangle_data: IConstructionInfo[] = [
            { construction: E.Point.free,    name: "A",   params: [50, 50] },
            { construction: E.Point.free,    name: "B",   params: [150, 50] },
            { construction: E.Line.connect,  name: "AB",  params: ["A", "B"] },
            { construction: E.Circle.radius, name: "BCD", params: ["A", "B"] },
        ];

        it("namesFor returns the canonical name plus all its aliases", () => {
            let slate: Slate = new Slate(createCanvas(200, 200));
            toElements(slate, triangle_data);
            slate.addAliases({ "CDB": "BCD", "DBC": "BCD", "BA": "AB" });
            const bcd = slate.namesFor("BCD").sort();
            assert.deepStrictEqual(bcd, ["BCD", "CDB", "DBC"]);
            assert.deepStrictEqual(slate.namesFor("AB").sort(), ["AB", "BA"]);
            // An element with no aliases → just itself.
            assert.deepStrictEqual(slate.namesFor("A"), ["A"]);
        });

        it("dispatches geomlib:highlight only when the highlighted set changes", () => {
            if (typeof (global as any).CustomEvent !== "function") {
                (global as any).CustomEvent = class {
                    type: string; detail: any; bubbles: boolean;
                    constructor(type: string, opts: any) {
                        this.type = type; this.detail = opts && opts.detail;
                        this.bubbles = !!(opts && opts.bubbles);
                    }
                };
            }
            const canvas: any = createCanvas(200, 200);
            const events: any[] = [];
            canvas.dispatchEvent = (e: any) => { events.push(e); return true; };
            const slate = new Slate(canvas);   // inTest stays false → drawElements runs
            toElements(slate, triangle_data);
            slate.addAliases({ "CDB": "BCD" });
            slate.update();
            events.length = 0;   // drop the initial baseline dispatch

            // Highlight the circle → one event carrying its aliases.
            (slate.lookupElement("BCD") as any).emphasized = true;
            slate.update();
            assert.strictEqual(events.length, 1, "one event on change");
            assert.strictEqual(events[0].type, "geomlib:highlight");
            assert.deepStrictEqual(
                events[0].detail.highlighted.map((h: any) => h.name), ["BCD"]);
            assert.deepStrictEqual(
                events[0].detail.highlighted[0].aliases.sort(), ["BCD", "CDB"]);

            // No change → no further dispatch.
            slate.update();
            assert.strictEqual(events.length, 1, "no event when set unchanged");

            // Un-highlight → an event with the empty set.
            (slate.lookupElement("BCD") as any).emphasized = false;
            slate.update();
            assert.strictEqual(events.length, 2);
            assert.deepStrictEqual(events[1].detail.highlighted, []);
        });
    });
});
