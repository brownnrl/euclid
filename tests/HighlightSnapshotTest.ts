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
// Entries are pushed into the shared report registry so they appear in
// tests/snapshots/report.html as a "highlight" category alongside
// "euclid", "compass", and "round".

import "mocha";
import * as path from "path";
import {assertSnapshot, buildScene, ReportEntry} from "./SnapshotHelper";
import {SlateConfig} from "./HtmlParamParser";
import {reportEntries, ensureReportFlushed} from "./sharedSnapshotReport";

const SNAPSHOT_DIR = path.join(__dirname, "snapshots");
const CATEGORY = "highlight";

ensureReportFlushed();

// propI.1 figure as parseParam strings, matching the on-site init().
// Background HSB 35,19,100 ≈ #FFE9CD — the cream theorem-box color the
// Lektor site uses, and the surface white-highlights are invisible on.
const TRIANGLE_CONFIG: SlateConfig = {
    width: 340,
    height: 260,
    background: "35,19,100",
    title: "I.1 highlight fixture",
    elements: [
        "A;point;free;125,130",
        "B;point;free;215,130",
        "AB;line;connect;A,B",
        "BCD;circle;radius;A,B",
        "ACE;circle;radius;B,A",
    ],
};

// #140 fixture — two segments that cross MID-SPAN, with the crossing
// line declared AFTER the one we highlight. In TRIANGLE_CONFIG the circles
// only meet AB at its endpoints, so it has no occlusion to catch; here the
// black CD runs straight over the middle of the gold AB. Without the
// z-order promotion the highlight is visibly chopped at the crossing.
const CROSSING_CONFIG: SlateConfig = {
    width: 340,
    height: 260,
    background: "35,19,100",
    title: "#140 crossing fixture",
    elements: [
        "A;point;free;60,60",
        "B;point;free;280,200",
        "AB;line;connect;A,B",
        "C;point;free;60,200",
        "D;point;free;280,60",
        "CD;line;connect;C,D",
    ],
};

// Each scenario flips shouldHighlight on a subset, renders, and
// snapshots. The fileName + scenario combine to form a unique key
// per ReportEntry.
const scenarios: { name: string; highlight: string[]; config?: SlateConfig; highlightOnTop?: boolean }[] = [
    { name: "baseline",         highlight: [] },
    { name: "highlight_line",   highlight: ["AB"] },
    { name: "highlight_circle", highlight: ["BCD"] },
    { name: "highlight_point",  highlight: ["A"] },
    // #140 — the highlighted AB is declared BEFORE the CD that crosses it,
    // so pre-#140 the gold stroke was chopped where CD painted over it.
    { name: "crossing_highlight_under", highlight: ["AB"], config: CROSSING_CONFIG },
    // Control: highlighting the later-declared CD needs no promotion to
    // read correctly — it already painted last. Guards against the
    // promotion disturbing the case that was already fine.
    { name: "crossing_highlight_over",  highlight: ["CD"], config: CROSSING_CONFIG },
    // The SAME scene as crossing_highlight_under with promotion switched
    // off — i.e. the pre-#140 rendering. Kept so the suite carries a
    // golden of the defect next to the golden of the fix: diff the two
    // PNGs (or view them side by side in report.html) and the only
    // differing pixels are where CD crosses the highlighted AB. Without
    // this scene the suite pins the new behaviour but never shows what
    // changed.
    { name: "crossing_no_promotion", highlight: ["AB"], config: CROSSING_CONFIG,
      highlightOnTop: false },
];

describe("highlight snapshot (issue #72)", function() {
    this.timeout(20000);

    for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        const slateNum = i + 1;
        const fileName = scenario.name;
        const config = scenario.config || TRIANGLE_CONFIG;
        const snapshotDir = path.join(CATEGORY, fileName, `slate${slateNum}`);
        const fullSnapshotDir = path.join(SNAPSHOT_DIR, snapshotDir);
        const testName = `${CATEGORY}/${fileName}/slate${slateNum}`;

        it(`should render ${testName}`, function() {
            const entry: ReportEntry = {
                category: CATEGORY,
                fileName: fileName,
                slateIndex: slateNum,
                snapshotDir: snapshotDir,
                config: config,
                beforeResult: {passed: false, isNew: false},
                dragResults: [],
            };

            try {
                const slate = buildScene(config);
                if (scenario.highlightOnTop != null) {
                    slate.highlightOnTop = scenario.highlightOnTop;
                }
                for (const name of scenario.highlight) {
                    const el = slate.lookupElement(name);
                    if (el) el.shouldHighlight = true;
                }
                slate.update();
                const canvas = (slate as any)._canvas;

                const beforePath = path.join(fullSnapshotDir, "before.png");
                const beforeResult = assertSnapshot(canvas, beforePath);
                entry.beforeResult = beforeResult;

                if (!beforeResult.passed) {
                    throw new Error(
                        `${testName} snapshot failed: ${beforeResult.diffPercent?.toFixed(2)}% pixels differ`
                    );
                }
            } catch (e) {
                entry.error = (e as Error).message;
                throw e;
            } finally {
                reportEntries.push(entry);
            }
        });
    }
});
