// Snapshot tests for partial-geometry rendering driven by
// drawProgress. Issue #78.

import "mocha";
import * as path from "path";
import {assertSnapshot, buildScene, ReportEntry} from "./SnapshotHelper";
import {SlateConfig} from "./HtmlParamParser";
import {Slate} from "../src/Slate";
import {reportEntries, ensureReportFlushed} from "./sharedSnapshotReport";

const SNAPSHOT_DIR = path.join(__dirname, "snapshots");
const CATEGORY = "animation";

ensureReportFlushed();

const LINE_CONFIG: SlateConfig = {
    width: 340,
    height: 260,
    background: "35,19,100",
    title: "line trace progress",
    elements: [
        "A;point;free;60,130",
        "B;point;free;280,130",
        "AB;line;connect;A,B",
    ],
};

const CIRCLE_CONFIG: SlateConfig = {
    width: 340,
    height: 260,
    background: "35,19,100",
    title: "circle sweep progress",
    elements: [
        "A;point;free;170,130",
        "B;point;free;240,130",
        "BCD;circle;radius;A,B",
    ],
};

const TRIANGLE_CONFIG: SlateConfig = {
    width: 340,
    height: 260,
    background: "35,19,100",
    title: "polygon outline progress",
    elements: [
        "A;point;free;90,200",
        "B;point;free;250,200",
        "C;point;free;170,70",
        // Deterministic face color — "random" rolls a new pastel per
        // run, so goldens only match the run that created them (#84).
        "ABC;polygon;triangle;A,B,C;0;0;black;#ffb6c1",
    ],
};

const progressSteps = [0, 0.25, 0.5, 0.75, 1];

function runScenario(
    label: string,
    config: SlateConfig,
    elemName: string,
    extraSetup?: (elem: any) => void,
) {
    for (let i = 0; i < progressSteps.length; i++) {
        const p = progressSteps[i];
        const slateNum = i + 1;
        const fileName = label + "_progress_" + Math.round(p * 100);
        const snapshotDir = path.join(CATEGORY, fileName, "slate" + slateNum);
        const fullSnapshotDir = path.join(SNAPSHOT_DIR, snapshotDir);
        const testName = CATEGORY + "/" + fileName + "/slate" + slateNum;

        it("renders " + testName, function() {
            const entry: ReportEntry = {
                category: CATEGORY,
                fileName: fileName,
                slateIndex: slateNum,
                snapshotDir: snapshotDir,
                config: config,
                beforeResult: { passed: false, isNew: false },
                dragResults: [],
            };

            let slate: Slate | null = null;
            try {
                slate = buildScene(config);
                const elem = slate.lookupElement(elemName);
                if (elem == null) {
                    throw new Error("element " + elemName + " not found");
                }
                if (extraSetup) extraSetup(elem);
                elem.drawProgress = p;
                slate.update();
                const canvas = (slate as any)._canvas;

                const beforePath = path.join(fullSnapshotDir, "before.png");
                const beforeResult = assertSnapshot(canvas, beforePath);
                entry.beforeResult = beforeResult;
                if (!beforeResult.passed) {
                    throw new Error(
                        testName + " snapshot failed: " +
                        (beforeResult.diffPercent != null
                            ? beforeResult.diffPercent.toFixed(2) + "%"
                            : "n/a"));
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
}

describe("animation snapshot (issue #78)", function() {
    this.timeout(20000);

    describe("Line.drawEdge", () => runScenario("line", LINE_CONFIG, "AB"));

    // Set a non-zero startAngle so the partial arcs are visually
    // distinct (otherwise progress=0.25 just looks like a quarter
    // pointing east, easy to confuse with a slightly translated full
    // arc when eyeballing).
    describe("Circle.drawEdge", () =>
        runScenario("circle", CIRCLE_CONFIG, "BCD",
            (elem: any) => { elem.drawStartAngle = -Math.PI / 2; }));

    describe("Polygon.drawEdge", () => runScenario("triangle", TRIANGLE_CONFIG, "ABC"));
});
