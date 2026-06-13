import "mocha";
import * as assert from "assert";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo, init, slates} from "../src/index";
import {PointElement} from "../src/elements/point/PointElement";
import {ArcElement} from "../src/elements/sector/ArcElement";
import {AngleMarkerElement, DEFAULT_ANGLE_MARKER_RADIUS_PX,
        ANGLE_MARKER_RING_STEP} from "../src/elements/sector/AngleMarkerElement";
import {anglePalette} from "../src/Colors";
import {createCanvas} from "canvas";
import {almostEqual, toElements} from "./shared/testHelpers";

describe("sector", () => {

    // Book III, Prop 2 — arc through three points
    // A=(50,130), E=(70,210), B=(120,200)
    // Expected center: (86.667, 163.333), radius ≈ 49.554
    let arc_propIII2_data: IConstructionInfo[] = [
        { name: "A",   construction: E.Point.free,  params: [50, 130] },
        { name: "E",   construction: E.Point.free,  params: [70, 210] },
        { name: "B",   construction: E.Point.free,  params: [120, 200] },
        { name: "AEB", construction: E.Sector.arc, params: ["A", "E", "B"] },
    ];

    it("should compute the circumcenter of an arc through three points", () => {
        let slate = new Slate(createCanvas(260, 260));
        toElements(slate, arc_propIII2_data);
        slate.elements.forEach(e => e.update());
        let arc = slate.lookupElement("AEB") as ArcElement;
        almostEqual(arc._Center.x, 86.667, 0.01);
        almostEqual(arc._Center.y, 163.333, 0.01);
        let rA = arc._Center.distance(arc._A);
        let rM = arc._Center.distance(arc._M);
        let rB = arc._Center.distance(arc._B);
        almostEqual(rA, 49.554, 0.01);
        almostEqual(rM, 49.554, 0.01);
        almostEqual(rB, 49.554, 0.01);
    });

    it("should translate only the arc center, leaving A, M, B untouched", () => {
        let slate = new Slate(createCanvas(260, 260));
        toElements(slate, arc_propIII2_data);
        slate.elements.forEach(e => e.update());
        let arc = slate.lookupElement("AEB") as ArcElement;
        let cx0 = arc._Center.x;
        let cy0 = arc._Center.y;
        arc.translate(5, 7);
        almostEqual(arc._Center.x, cx0 + 5, 0.001);
        almostEqual(arc._Center.y, cy0 + 7, 0.001);
        let A = slate.lookupElement("A") as PointElement;
        let M = slate.lookupElement("E") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        almostEqual(A.x, 50,  0.001); almostEqual(A.y, 130, 0.001);
        almostEqual(M.x, 70,  0.001); almostEqual(M.y, 210, 0.001);
        almostEqual(B.x, 120, 0.001); almostEqual(B.y, 200, 0.001);
    });

    it("should rotate only the arc center around a pivot", () => {
        let slate = new Slate(createCanvas(260, 260));
        toElements(slate, arc_propIII2_data);
        slate.elements.forEach(e => e.update());
        let arc = slate.lookupElement("AEB") as ArcElement;
        let A = slate.lookupElement("A") as PointElement;
        // 90° CCW around A=(50,130): ac=0, as=1
        arc.rotate(A, 0, 1);
        almostEqual(arc._Center.x, 16.667, 0.01);
        almostEqual(arc._Center.y, 166.667, 0.01);
        let M = slate.lookupElement("E") as PointElement;
        let B = slate.lookupElement("B") as PointElement;
        almostEqual(A.x, 50,  0.001); almostEqual(A.y, 130, 0.001);
        almostEqual(M.x, 70,  0.001); almostEqual(M.y, 210, 0.001);
        almostEqual(B.x, 120, 0.001); almostEqual(B.y, 200, 0.001);
    });

    it("should create an arc with explicit plane (3D variant)", () => {
        let data: IConstructionInfo[] = [
            { name: "P1", construction: E.Point.fixed, params: [0, 0, 0] },
            { name: "P2", construction: E.Point.fixed, params: [100, 0, 0] },
            { name: "P3", construction: E.Point.fixed, params: [0, 100, 0] },
            { name: "plane", construction: E.Plane.threePoints, params: ["P1", "P2", "P3"] },
            { name: "A", construction: E.Point.fixed, params: [50, 130, 0] },
            { name: "M", construction: E.Point.fixed, params: [70, 210, 0] },
            { name: "B", construction: E.Point.fixed, params: [120, 200, 0] },
            { name: "arc", construction: E.Sector.arc, params: ["A", "M", "B", "plane"] },
        ];
        let slate = new Slate(createCanvas(400, 400));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        let arc = slate.lookupElement("arc");
        assert.ok(arc != null);
    });
});

// Issue #91 — angle markers compute their own fixed radius (not the
// vertex-to-arm distance), auto-orient to the interior arc, and take a
// translucent palette color by default.
describe("angle marker (issue #91)", () => {

    // Vertex B at origin-ish, one short arm and one long arm, so a
    // distance-based radius would differ wildly between markers.
    function markerSlate(extra: IConstructionInfo[] = []): Slate {
        const data: IConstructionInfo[] = [
            { name: "A",     construction: E.Point.free, params: [100, 60] },   // up
            { name: "B",     construction: E.Point.free, params: [100, 260] },  // vertex
            { name: "Cnear", construction: E.Point.free, params: [160, 260] },  // 60px arm
            { name: "Cfar",  construction: E.Point.free, params: [560, 260] },  // 460px arm
            ...extra,
        ];
        const slate = new Slate(createCanvas(600, 320));
        toElements(slate, data);
        slate.elements.forEach(e => e.update());
        return slate;
    }

    it("radius is the fixed default, independent of arm length", () => {
        const slate = markerSlate([
            { name: "mNear", construction: E.Sector.angleMarker, params: ["B", "A", "Cnear"] },
            { name: "mFar",  construction: E.Sector.angleMarker, params: ["B", "A", "Cfar"] },
        ]);
        const mNear = slate.lookupElement("mNear") as AngleMarkerElement;
        const mFar  = slate.lookupElement("mFar")  as AngleMarkerElement;
        // Both arms are >= 60px, so 0.45*shorter (>=27) doesn't clamp
        // below the 22px default. A distance radius would be 200 vs 460.
        almostEqual(mNear.radius(), DEFAULT_ANGLE_MARKER_RADIUS_PX, 0.001);
        almostEqual(mFar.radius(),  DEFAULT_ANGLE_MARKER_RADIUS_PX, 0.001);
    });

    it("clamps to 0.45x the shorter arm when arms are short", () => {
        // Vertex P with a tiny 20px arm → 0.45*20 = 9 < 22 default.
        const slate = new Slate(createCanvas(200, 200));
        toElements(slate, [
            { name: "P",  construction: E.Point.free, params: [100, 100] },
            { name: "Q",  construction: E.Point.free, params: [120, 100] },  // 20px
            { name: "R",  construction: E.Point.free, params: [100, 160] },  // 60px
            { name: "m",  construction: E.Sector.angleMarker, params: ["P", "Q", "R"] },
        ]);
        slate.elements.forEach(e => e.update());
        const m = slate.lookupElement("m") as AngleMarkerElement;
        almostEqual(m.radius(), 20 * 0.45, 0.001);
    });

    it("respects an explicit px radius override", () => {
        const slate = markerSlate([
            { name: "m", construction: E.Sector.angleMarker, params: ["B", "A", "Cfar", 14] },
        ]);
        const m = slate.lookupElement("m") as AngleMarkerElement;
        almostEqual(m.radius(), 14, 0.001);
    });

    it("auto-orients to the interior arc regardless of arm order", () => {
        const slate = markerSlate([
            { name: "m1", construction: E.Sector.angleMarker, params: ["B", "A", "Cnear"] },
            { name: "m2", construction: E.Sector.angleMarker, params: ["B", "Cnear", "A"] },
        ]);
        const interior = (name: string): number => {
            const m = slate.lookupElement(name) as any;
            return m._Center.angle(m._A, m._B, m._P);  // signed; < 0 = interior
        };
        // A is straight up from B, Cnear straight right: interior = 90°.
        assert.ok(interior("m1") < 0, "m1 should render the interior arc");
        assert.ok(interior("m2") < 0, "m2 (arms swapped) should too");
        almostEqual(Math.abs(interior("m1")), Math.PI / 2, 1e-6);
        almostEqual(Math.abs(interior("m2")), Math.PI / 2, 1e-6);
    });

    it("recomputes the arc endpoints onto the radius when an arm moves", () => {
        const slate = markerSlate([
            { name: "m", construction: E.Sector.angleMarker, params: ["B", "A", "Cnear"] },
        ]);
        const m = slate.lookupElement("m") as any;
        const B = slate.lookupElement("B") as PointElement;
        // _A sits at radius along the B→A direction (straight up).
        almostEqual(B.distance(m._A), m.radius(), 1e-6);
        almostEqual(B.distance(m._B), m.radius(), 1e-6);
        // Move the vertex; after update the endpoints follow it.
        B.x = 150; B.y = 250;
        slate.elements.forEach((e: any) => e.update());
        almostEqual(B.distance(m._A), m.radius(), 1e-6);
    });

    // Records the fillStyle + globalAlpha at each fill() call so we can
    // see the transition flash add a second (gold) fill over the wedge.
    function fillRecordingCanvas(slate: Slate) {
        const real = (slate as any).canvas;
        const fills: Array<{style: any, alpha: number}> = [];
        const ctx: any = new Proxy(real.getContext("2d"), {
            get(t, p) {
                if (p === "fill") return () => fills.push({ style: t.fillStyle, alpha: t.globalAlpha });
                const v = t[p];
                return typeof v === "function" ? v.bind(t) : v;
            },
            set(t, p, v) { t[p] = v; return true; },
        });
        return { canvas: { getContext: () => ctx } as any, fills };
    }

    it("flashes the whole wedge with the highlight color while emphasised", () => {
        const slate = markerSlate([
            { name: "m", construction: E.Sector.angleMarker, params: ["B", "A", "Cnear"] },
        ]);
        const m = slate.lookupElement("m") as AngleMarkerElement;
        m.faceColor = "rgb(59,110,165)";

        // Not emphasised: one fill (the palette face), no flash.
        m.emphasisAmount = 0;
        let r = fillRecordingCanvas(slate);
        m.drawFace(r.canvas);
        assert.strictEqual(r.fills.length, 1);

        // Emphasised: a second fill with the gold highlight color,
        // alpha scaling with emphasisAmount.
        m.emphasisAmount = 1;
        r = fillRecordingCanvas(slate);
        m.drawFace(r.canvas);
        assert.strictEqual(r.fills.length, 2);
        // node-canvas echoes fillStyle back lowercased.
        assert.strictEqual(
            String(r.fills[1].style).toLowerCase(),
            m.faceHighlightColor.toLowerCase());
        assert.ok(r.fills[1].alpha > 0 && r.fills[1].alpha <= 1);
    });

    it("plain sectors do not flash their face", () => {
        const slate = new Slate(createCanvas(300, 300));
        toElements(slate, [
            { name: "O", construction: E.Point.free, params: [100, 100] },
            { name: "U", construction: E.Point.free, params: [180, 100] },
            { name: "V", construction: E.Point.free, params: [100, 180] },
            { name: "S", construction: E.Sector.sector, params: ["O", "U", "V"] },
        ]);
        slate.elements.forEach(e => e.update());
        const s = slate.lookupElement("S") as any;
        s.faceColor = "rgb(0,0,255)";
        s.emphasisAmount = 1;
        const r = fillRecordingCanvas(slate);
        s.drawFace(r.canvas);
        assert.strictEqual(r.fills.length, 1);  // no flash overlay
    });

    it("reflex markers sweep the major arc (2pi minus the interior)", () => {
        const slate = markerSlate([
            { name: "mi", construction: E.Sector.angleMarker,       params: ["B", "A", "Cnear"] },
            { name: "mr", construction: E.Sector.angleMarkerReflex, params: ["B", "A", "Cnear"] },
        ]);
        const mi = slate.lookupElement("mi") as AngleMarkerElement;
        const mr = slate.lookupElement("mr") as AngleMarkerElement;
        // Interior here is 90°; the reflex twin spans 270°.
        almostEqual(mi.arcSpan(), Math.PI / 2, 1e-6);
        almostEqual(mr.arcSpan(), 2 * Math.PI - Math.PI / 2, 1e-6);
        assert.strictEqual(mr.reflex, true);
        assert.strictEqual(mi.reflex, false);
    });

    it("ringIndex bumps the radius by the ring step", () => {
        const slate = markerSlate([
            { name: "m", construction: E.Sector.angleMarker, params: ["B", "A", "Cfar"] },
        ]);
        const m = slate.lookupElement("m") as AngleMarkerElement;
        const base = m.radius();
        m.ringIndex = 2;
        almostEqual(m.radius(), base + 2 * ANGLE_MARKER_RING_STEP, 0.001);
    });

    // Palette defaults are applied by init() (not the bare toElements
    // helper), so these drive the real init() path with a fake DOM.
    function withFakeDOM<T>(fn: (canvasId: string) => T): T {
        const canvasId = "amk_canvas";
        const fake = createCanvas(600, 320) as any;
        fake.id = canvasId;
        fake.style = {};
        fake.getBoundingClientRect = () => ({ width: 600, height: 320 });
        fake.addEventListener = () => {};
        (global as any).window = global;
        (global as any).document = {
            getElementById: (id: string) => (id === canvasId ? fake : null),
        };
        (global as any).HTMLCanvasElement = function() {};
        try { return fn(canvasId); }
        finally {
            delete (global as any).window;
            delete (global as any).document;
            delete (global as any).HTMLCanvasElement;
        }
    }

    const baseMarkerElements = [
        "A;point;free;100,60",
        "B;point;free;100,260",
        "Cnear;point;free;160,260",
        "Cfar;point;free;560,260",
    ];

    it("assigns translucent palette colors in construction order", () => {
        withFakeDOM((canvasid) => {
            slates.length = 0;
            init({
                canvasid, background: "0,0,100", title: "t",
                elements: [
                    ...baseMarkerElements,
                    "m0;sector;angleMarker;B,A,Cnear",
                    "m1;sector;angleMarker;B,Cnear,Cfar",
                ],
            });
            const slate = slates[0];
            const m0 = slate.lookupElement("m0") as AngleMarkerElement;
            const m1 = slate.lookupElement("m1") as AngleMarkerElement;
            assert.strictEqual(m0.edgeColor, anglePalette[0].edge);
            assert.strictEqual(m0.faceColor, anglePalette[0].face);
            assert.strictEqual(m1.edgeColor, anglePalette[1].edge);
            assert.strictEqual(m1.faceColor, anglePalette[1].face);
        });
    });

    it("lets an author override the marker face color", () => {
        withFakeDOM((canvasid) => {
            slates.length = 0;
            init({
                canvasid, background: "0,0,100", title: "t",
                elements: [
                    ...baseMarkerElements,
                    "m;sector;angleMarker;B,A,Cnear;0;0;0;red",
                ],
            });
            const m = slates[0].lookupElement("m") as AngleMarkerElement;
            assert.strictEqual(m.faceColor, "rgb(255,0,0)");
        });
    });

    // #100 — marker initial visibility.
    it("hides angle markers in the static figure by default", () => {
        withFakeDOM((canvasid) => {
            slates.length = 0;
            init({
                canvasid, background: "0,0,100", title: "t",
                elements: [...baseMarkerElements, "m;sector;angleMarker;B,A,Cnear"],
            });
            const m = slates[0].lookupElement("m") as AngleMarkerElement;
            assert.strictEqual(m.visible, false);
            assert.ok(slates[0].initiallyHidden.has("m"));
        });
    });

    it("shows angle markers when init({ showAngles: true })", () => {
        withFakeDOM((canvasid) => {
            slates.length = 0;
            init({
                canvasid, background: "0,0,100", title: "t", showAngles: true,
                elements: [...baseMarkerElements, "m;sector;angleMarker;B,A,Cnear"],
            } as any);
            const m = slates[0].lookupElement("m") as AngleMarkerElement;
            assert.strictEqual(m.visible, true);
            assert.ok(!slates[0].initiallyHidden.has("m"));
        });
    });

    it("initiallyHidden hides any named element; clearVisibility keeps it hidden", () => {
        withFakeDOM((canvasid) => {
            slates.length = 0;
            init({
                canvasid, background: "0,0,100", title: "t", showAngles: true,
                initiallyHidden: ["Cfar"],
                elements: [...baseMarkerElements, "m;sector;angleMarker;B,A,Cnear"],
            } as any);
            const slate = slates[0];
            const cfar = slate.lookupElement("Cfar")!;
            const m = slate.lookupElement("m")!;
            assert.strictEqual(cfar.visible, false);  // explicitly hidden
            assert.strictEqual(m.visible, true);       // showAngles on
            // Presentation makes everything visible, then exit restores
            // the baseline: Cfar hidden again, m still shown.
            slate.setVisibleNames(slate.elements.map(e => e.name!).filter(Boolean));
            assert.strictEqual(cfar.visible, true);
            slate.clearVisibility();
            assert.strictEqual(cfar.visible, false);
            assert.strictEqual(m.visible, true);
        });
    });

    it("a hidden element still renders when highlighted/emphasised (#100 hover-reveal)", () => {
        const slate = new Slate(createCanvas(400, 400));
        toElements(slate, [
            { name: "O", construction: E.Point.free, params: [100, 100] },
            { name: "P", construction: E.Point.free, params: [180, 100] },
            { name: "Q", construction: E.Point.free, params: [100, 180] },
            { name: "S", construction: E.Sector.sector, params: ["O", "P", "Q"] },
        ]);
        slate.elements.forEach(e => e.update());
        const s = slate.lookupElement("S") as any;
        s.edgeColor = "#000000";
        s.visible = false;

        // Hidden + not lit → no draw.
        let r = recordingArcs(slate);
        s.drawEdge(r.canvas);
        assert.strictEqual(r.arcs.length, 0);

        // Hidden but highlighted (hovered) → draws.
        s.shouldHighlight = true;
        r = recordingArcs(slate);
        s.drawEdge(r.canvas);
        assert.strictEqual(r.arcs.length, 1);
    });
});

// Minimal arc recorder for the hover-reveal test.
function recordingArcs(slate: Slate) {
    const real = (slate as any).canvas;
    const arcs: any[] = [];
    const ctx: any = new Proxy(real.getContext("2d"), {
        get(t, p) {
            if (p === "arc") return () => arcs.push(1);
            const v = t[p];
            return typeof v === "function" ? v.bind(t) : v;
        },
        set(t, p, v) { t[p] = v; return true; },
    });
    return { canvas: { getContext: () => ctx } as any, arcs };
}
