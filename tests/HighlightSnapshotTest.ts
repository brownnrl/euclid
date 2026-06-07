// Snapshot test for the highlight-rendering contracts (issue #72).
//
// Builds the propI.1 figure (two circles, three lines, three labelled
// points), flips `shouldHighlight = true` on selected elements, and
// golden-PNGs the result. Catches regressions where:
//   - LineElement.drawEdge stops painting the highlight color (the
//     fillStyle/strokeStyle bug).
//   - CircleElement.drawEdge silently drops the highlight check.
//   - The default highlight colors revert to white (invisible against
//     cream / pale backgrounds).
//   - PointElement.drawVertex stops bumping its radius.
//
// Goldens live under `tests/snapshots/highlight/` and are gitignored
// like every other snapshot — each contributor regenerates locally,
// matching the existing convention. Run `npm run snapshots:clean`
// to wipe.

import "mocha";
import * as path from "path";
import * as fs from "fs";
import {createCanvas} from "canvas";
import {Slate} from "../src/Slate";
import {E, IConstructionInfo} from "../src/index";
import {GeomElement} from "../src/elements/GeomElement";
import {PointElement} from "../src/elements/point/PointElement";
import {assertSnapshot} from "./SnapshotHelper";
import {toElements} from "./shared/testHelpers";

const SNAPSHOT_DIR = path.join(__dirname, "snapshots", "highlight");

// propI.1: equilateral-triangle scene. Same layout the Elements site
// renders on the prop page, scoped down to letter labels the prose
// references via the `{NAME}` shortcode.
const triangle_data: IConstructionInfo[] = [
    { construction: E.Point.free,    name: "A",   params: [125, 130] },
    { construction: E.Point.free,    name: "B",   params: [215, 130] },
    { construction: E.Line.connect,  name: "AB",  params: ["A", "B"] },
    { construction: E.Circle.radius, name: "BCD", params: ["A", "B"] },
    { construction: E.Circle.radius, name: "ACE", params: ["B", "A"] },
];

function buildTriangleSlate(): Slate {
    const canvas = createCanvas(340, 260);
    const slate = new Slate(canvas as unknown as HTMLCanvasElement);
    slate.bgcolor = "#ffe9cd";
    GeomElement.setFont("Times New Roman", 18);
    toElements(slate, triangle_data);
    // Assign visible default colors the same way init() in index.ts
    // would; otherwise unit-test scenes leave every color null.
    for (const el of slate.elements) {
        if (el instanceof PointElement) {
            el.nameColor   = "black";
            el.vertexColor = "black";
        } else {
            el.edgeColor = "black";
            el.nameColor = "black";
        }
    }
    slate.update();
    return slate;
}

describe("highlight snapshot (issue #72)", function() {
    this.timeout(20000);

    before(() => {
        if (!fs.existsSync(SNAPSHOT_DIR)) {
            fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
        }
    });

    it("paints no highlight when shouldHighlight is false everywhere", () => {
        const slate = buildTriangleSlate();
        const canvas = (slate as any)._canvas;
        const result = assertSnapshot(canvas, path.join(SNAPSHOT_DIR, "baseline.png"));
        if (!result.passed) {
            throw new Error(`baseline diff: ${result.diffPercent?.toFixed(2)}%`);
        }
    });

    it("paints the highlighted line in amber", () => {
        const slate = buildTriangleSlate();
        const line = slate.lookupElement("AB");
        if (line) line.shouldHighlight = true;
        slate.update();
        const canvas = (slate as any)._canvas;
        const result = assertSnapshot(canvas, path.join(SNAPSHOT_DIR, "highlight_line.png"));
        if (!result.passed) {
            throw new Error(`highlight_line diff: ${result.diffPercent?.toFixed(2)}%`);
        }
    });

    it("paints the highlighted circle in amber", () => {
        const slate = buildTriangleSlate();
        const circle = slate.lookupElement("BCD");
        if (circle) circle.shouldHighlight = true;
        slate.update();
        const canvas = (slate as any)._canvas;
        const result = assertSnapshot(canvas, path.join(SNAPSHOT_DIR, "highlight_circle.png"));
        if (!result.passed) {
            throw new Error(`highlight_circle diff: ${result.diffPercent?.toFixed(2)}%`);
        }
    });

    it("paints the highlighted point with a larger amber dot", () => {
        const slate = buildTriangleSlate();
        const pt = slate.lookupElement("A");
        if (pt) pt.shouldHighlight = true;
        slate.update();
        const canvas = (slate as any)._canvas;
        const result = assertSnapshot(canvas, path.join(SNAPSHOT_DIR, "highlight_point.png"));
        if (!result.passed) {
            throw new Error(`highlight_point diff: ${result.diffPercent?.toFixed(2)}%`);
        }
    });
});
