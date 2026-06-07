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

// Each scenario flips shouldHighlight on a subset, renders, and
// snapshots. The fileName + scenario combine to form a unique key
// per ReportEntry.
const scenarios: { name: string; highlight: string[] }[] = [
    { name: "baseline",         highlight: [] },
    { name: "highlight_line",   highlight: ["AB"] },
    { name: "highlight_circle", highlight: ["BCD"] },
    { name: "highlight_point",  highlight: ["A"] },
];

describe("highlight snapshot (issue #72)", function() {
    this.timeout(20000);

    for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        const slateNum = i + 1;
        const fileName = scenario.name;
        const snapshotDir = path.join(CATEGORY, fileName, `slate${slateNum}`);
        const fullSnapshotDir = path.join(SNAPSHOT_DIR, snapshotDir);
        const testName = `${CATEGORY}/${fileName}/slate${slateNum}`;

        it(`should render ${testName}`, function() {
            const entry: ReportEntry = {
                category: CATEGORY,
                fileName: fileName,
                slateIndex: slateNum,
                snapshotDir: snapshotDir,
                config: TRIANGLE_CONFIG,
                beforeResult: {passed: false, isNew: false},
                dragResults: [],
            };

            try {
                const slate = buildScene(TRIANGLE_CONFIG);
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
