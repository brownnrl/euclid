// Snapshot tests for the visibility primitive (issue #75).
//
// Builds a propI.1-shaped figure, calls Slate.setVisibleNames with
// different subsets, and golden-PNGs each scenario. Pushes entries
// into the shared snapshot report so a "visibility" category appears
// in tests/snapshots/report.html alongside "highlight".

import "mocha";
import * as path from "path";
import {assertSnapshot, buildScene, ReportEntry} from "./SnapshotHelper";
import {SlateConfig} from "./HtmlParamParser";
import {Slate} from "../src/Slate";
import {reportEntries, ensureReportFlushed} from "./sharedSnapshotReport";

const SNAPSHOT_DIR = path.join(__dirname, "snapshots");
const CATEGORY = "visibility";

ensureReportFlushed();

const TRIANGLE_CONFIG: SlateConfig = {
    width: 340,
    height: 260,
    background: "35,19,100",
    title: "I.1 visibility fixture",
    elements: [
        "A;point;free;125,130",
        "B;point;free;215,130",
        "AB;line;connect;A,B",
        "BCD;circle;radius;A,B",
        "ACE;circle;radius;B,A",
    ],
};

const scenarios: { name: string; visible: string[] | null }[] = [
    { name: "baseline",      visible: null },                              // all visible
    { name: "setup_only",    visible: ["A","B","AB"] },                    // points + line only
    { name: "circles_only",  visible: ["BCD","ACE"] },                     // circles only
];

describe("visibility snapshot (issue #75)", function() {
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
                beforeResult: { passed: false, isNew: false },
                dragResults: [],
            };

            let slate: Slate | null = null;
            try {
                slate = buildScene(TRIANGLE_CONFIG);
                if (scenario.visible !== null) {
                    slate.setVisibleNames(scenario.visible);
                }
                slate.update();
                const canvas = (slate as any)._canvas;

                const beforePath = path.join(fullSnapshotDir, "before.png");
                const beforeResult = assertSnapshot(canvas, beforePath);
                entry.beforeResult = beforeResult;

                if (!beforeResult.passed) {
                    throw new Error(`${testName} snapshot failed: ${beforeResult.diffPercent?.toFixed(2)}% pixels differ`);
                }
            } catch (e) {
                entry.error = (e as Error).message;
                throw e;
            } finally {
                // #154 — attribute whatever the slate complained about to
                // this scene, so report.html can show it per row.
                if (slate) entry.warnings = slate.diagnostics.map((d) => d.message);
                reportEntries.push(entry);
            }
        });
    }
});
