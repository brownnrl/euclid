import "mocha";
import * as assert from "assert";
import {createCanvas} from "canvas";
import {syncBitmapToDisplaySize} from "../src/CanvasSizing";
import {init, slates} from "../src/index";

// A canvas the way the browser lays one out: with no CSS width/height the
// box FOLLOWS the width/height attributes; with CSS set, the box is the CSS.
// This is the behaviour that turned a HiDPI bitmap assignment into a
// feedback loop (#173).
function fakeCanvas(attrW: number, attrH: number, cssW?: number, cssH?: number): any {
    const c: any = {
        width: attrW, height: attrH,
        style: { width: cssW != null ? cssW + "px" : "", height: cssH != null ? cssH + "px" : "" },
    };
    Object.defineProperty(c, "clientWidth",  { get: () => c.style.width  ? parseFloat(c.style.width)  : c.width });
    Object.defineProperty(c, "clientHeight", { get: () => c.style.height ? parseFloat(c.style.height) : c.height });
    return c;
}

describe("HiDPI bitmap sizing (#173)", () => {

    it("the fixture reproduces the bug under the old assignment", () => {
        // Prove the fake models the browser before trusting a pass: the
        // naive bitmap = client × dpr compounds on every call.
        const c = fakeCanvas(340, 260);
        for (let n = 0; n < 3; n++) {
            c.width = Math.round(c.clientWidth * 1.5);
            c.height = Math.round(c.clientHeight * 1.5);
        }
        assert.ok(c.clientWidth > 1000,
            "340 -> 510 -> 765 -> 1148: the box chased the attribute, got " + c.clientWidth);
    });

    it("pins an attribute-sized box so the bitmap is client x dpr", () => {
        const c = fakeCanvas(340, 260);
        const r = syncBitmapToDisplaySize(c, 1.5);
        assert.equal(c.width, 510);
        assert.equal(c.height, 390);
        assert.equal(c.clientWidth, 340, "the display size must not move");
        assert.equal(c.clientHeight, 260);
        assert.equal(c.style.width, "340px");
        assert.equal(c.style.height, "260px");
        assert.equal(r.pinned, true);
        assert.deepEqual([r.displayWidth, r.displayHeight], [340, 260]);
    });

    it("is idempotent — repeated syncs cannot compound", () => {
        // Every window resize calls this; the first cut grew the canvas by
        // dpr on each one until the container capped it.
        const c = fakeCanvas(340, 260);
        for (let n = 0; n < 5; n++) syncBitmapToDisplaySize(c, 1.5);
        assert.equal(c.width, 510);
        assert.equal(c.clientWidth, 340);
    });

    it("leaves a CSS-sized box alone", () => {
        // A canvas the page sizes with CSS keeps that arrangement; nothing
        // is pinned because nothing moved.
        const c = fakeCanvas(340, 260, 300, 229);
        const r = syncBitmapToDisplaySize(c, 1.5);
        assert.equal(c.width, 450);
        assert.equal(c.clientWidth, 300);
        assert.equal(c.style.width, "300px", "unchanged");
        assert.equal(r.pinned, false);
    });

    it("does nothing at dpr 1", () => {
        // The reason this went unnoticed: bitmap == client x 1 already.
        const c = fakeCanvas(340, 260);
        const r = syncBitmapToDisplaySize(c, 1);
        assert.equal(c.width, 340);
        assert.equal(c.style.width, "", "no pin when nothing moved");
        assert.equal(r.pinned, false);
    });

    it("works through init(): a click on A picks A at dpr 1.5", () => {
        // End to end on a real node-canvas, laid out like the site emits
        // it (attributes only), on a 150%-scaled display.
        const canvas: any = createCanvas(340, 260);
        canvas.style = { width: "", height: "" };
        Object.defineProperty(canvas, "clientWidth",
            { get: () => canvas.style.width ? parseFloat(canvas.style.width) : canvas.width });
        Object.defineProperty(canvas, "clientHeight",
            { get: () => canvas.style.height ? parseFloat(canvas.style.height) : canvas.height });
        canvas.getBoundingClientRect = () =>
            ({ left: 0, top: 0, width: canvas.clientWidth, height: canvas.clientHeight });
        canvas.parentElement = null;          // skip createControls

        const savedDoc = (global as any).document, savedWin = (global as any).window;
        (global as any).document = { getElementById: (id: string) => id === "hidpi" ? canvas : null };
        (global as any).window = { devicePixelRatio: 1.5 };
        try {
            init({
                background: "35,19,100", title: "hidpi", canvasid: "hidpi",
                elements: ["A;point;free;125,130", "B;point;free;215,130", "AB;line;connect;A,B"],
            });
            const s: any = slates[slates.length - 1];
            assert.equal(canvas.width, 510, "bitmap is client x dpr");
            assert.equal(canvas.clientWidth, 340, "display size held");
            assert.equal(s.logicalWidth, 340);
            assert.equal(s.displayWidth, 340);
            assert.equal(s.viewScale, 1);

            // The symptom: before the fix this resolved to (187.5, 195),
            // 88px from A, outside the 30px grab radius.
            const [mx, my] = s._getCanvasPosition(125, 130);
            assert.deepEqual([mx, my], [125, 130]);
            s._onMouseDown(mx, my);
            assert.ok(s._pick != null && s._pick.name === "A",
                "a click on A must pick A, got " + (s._pick && s._pick.name));
        } finally {
            if (savedDoc === undefined) delete (global as any).document; else (global as any).document = savedDoc;
            if (savedWin === undefined) delete (global as any).window;   else (global as any).window = savedWin;
        }
    });
});
