import "mocha";
import * as assert from "assert";
import {createCanvas} from "canvas";
import {Slate} from "../src/Slate";
import {parseParam} from "../src/index";
import {SectorElement} from "../src/elements/sector/SectorElement";

// #172 — A.Sector.sweep ran backwards for one arm order: the arc opened
// complete and shrank. Measured the way the report did: dark-pixel count
// at three progress values, both arm orders, several spans.
function scene(arms: string): { slate: Slate, sector: SectorElement, canvas: any } {
    const canvas: any = createCanvas(300, 300);
    const slate = new Slate(canvas);
    slate.inTest = true;
    const mk = (spec: string) => {
        const i = parseParam(spec);
        const el = slate.createElement(i.construction, i.params, i.name);
        el.nameColor = null; el.vertexColor = null;
        return el;
    };
    mk("G;point;free;150,150");
    mk("P;point;free;250,150");
    mk("Q;point;free;150,50");
    const sector = mk("S;sector;sector;" + arms) as SectorElement;
    sector.edgeColor = "black"; sector.faceColor = null;
    slate.update();
    return { slate, sector, canvas };
}

function ink(canvas: any): number {
    const d = canvas.getContext("2d").getImageData(0, 0, 300, 300).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 128 && d[i + 3] > 0) n++;
    return n;
}

// Paint through drawEdge on a fresh canvas — the method that changed, and
// the one A.Sector.sweep drives — rather than the slate's frame loop.
function inkAt(arms: string, progress: number): number {
    const { sector } = scene(arms);
    const canvas: any = createCanvas(300, 300);
    sector.drawProgress = progress;
    sector.drawEdge(canvas);
    return ink(canvas);
}

describe("sector sweep direction (#172)", () => {

    for (const arms of ["G,P,Q", "G,Q,P"]) {
        it("grows monotonically for arms " + arms, () => {
            const a0 = inkAt(arms, 0), a25 = inkAt(arms, 0.25),
                  a50 = inkAt(arms, 0.5), a75 = inkAt(arms, 0.75), a1 = inkAt(arms, 1);
            const seq = [a0, a25, a50, a75, a1];
            for (let k = 1; k < seq.length; k++) {
                assert.ok(seq[k] >= seq[k - 1],
                    "ink must never decrease as progress advances: " + JSON.stringify(seq));
            }
            assert.ok(a50 < a1, "mid-sweep must be less than the finished arc: " + JSON.stringify(seq));
        });
    }

    it("the two arm orders draw complementary arcs — the applet's contract", () => {
        // One order draws the 90° arc, the other its 270° complement; the
        // author orders the arms to pick the side (SectorElement.java adds
        // 360° to a negative sweep). The fix must not change which.
        const a = scene("G,P,Q").sector.arcSpan(), b = scene("G,Q,P").sector.arcSpan();
        assert.ok(Math.abs(a + b - 2 * Math.PI) < 1e-9, "spans sum to a full turn");
        assert.ok(Math.abs(Math.min(a, b) - Math.PI / 2) < 1e-9, "one of them is the 90°");
        assert.ok(inkAt("G,P,Q", 1) !== inkAt("G,Q,P", 1), "and the finished renders differ");
    });

    it("arcSpan reports the drawn sweep, so the complement is timed for 270°", () => {
        const spans = [scene("G,P,Q").sector.arcSpan(), scene("G,Q,P").sector.arcSpan()];
        assert.ok(Math.max(...spans) > Math.PI, "the complement order must time itself for the major arc");
    });

    it("a 180° sector no longer opens as a full circle", () => {
        // II.14's semicircle: at 180° the two sides are the same size, so
        // only the animation showed it — a full circle unwinding to a half.
        for (const arms of ["G,P,R", "G,R,P"]) {
            const canvas: any = createCanvas(300, 300);
            const slate = new Slate(canvas); slate.inTest = true;
            const mk = (spec: string) => { const i = parseParam(spec);
                const el = slate.createElement(i.construction, i.params, i.name);
                el.nameColor = null; el.vertexColor = null; return el; };
            mk("G;point;free;150,150"); mk("P;point;free;250,150"); mk("R;point;free;50,150");
            const s = mk("S;sector;sector;" + arms) as SectorElement;
            s.edgeColor = "black"; s.faceColor = null; slate.update();
            const c1: any = createCanvas(300, 300), c2: any = createCanvas(300, 300);
            s.drawProgress = 0.1; s.drawEdge(c1); const early = ink(c1);
            s.drawProgress = 1;   s.drawEdge(c2); const full = ink(c2);
            assert.ok(early < full * 0.5,
                arms + ": at 10% the arc should be a small stub, not near-complete (" + early + " vs " + full + ")");
        }
    });
});
