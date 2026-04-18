/*----------------------------------------------------------------------+
|    Snapshot verification test suite                                   |
|    Auto-discovers all Java HTML files across euclid propositions,     |
|    definitions, compass geometry, and round geometry. For each        |
|    applet (slate), renders the scene, drags up to 5 points, and      |
|    compares against golden PNG baselines.                             |
+----------------------------------------------------------------------*/

import "mocha";
import * as assert from "assert";
import * as path from "path";
import {discoverAllHtmlFiles, HtmlFileResult} from "./HtmlParamParser";
import {
    buildScene, renderScene, findDraggablePoints, simulateDrag,
    drawVerificationImage, assertSnapshot, saveVerificationImage,
    generateReport, ReportEntry
} from "./SnapshotHelper";

const REPO_ROOT = path.resolve(__dirname, "..");
const SNAPSHOT_DIR = path.join(__dirname, "snapshots");

// Collect report entries across all tests
let reportEntries: ReportEntry[] = [];

// Discover all HTML files
let allFiles: HtmlFileResult[];
try {
    allFiles = discoverAllHtmlFiles(REPO_ROOT);
} catch (e) {
    allFiles = [];
}

describe("snapshot verification", function() {
    // Increase timeout — rendering 671 slates takes time
    this.timeout(300000);

    for (let fileResult of allFiles) {
        for (let slateIdx = 0; slateIdx < fileResult.slates.length; slateIdx++) {
            let config = fileResult.slates[slateIdx];
            let slateNum = slateIdx + 1;
            let testName = `${fileResult.category}/${fileResult.fileName}/slate${slateNum}`;
            let snapshotDir = path.join(
                fileResult.category,
                fileResult.fileName,
                `slate${slateNum}`
            );
            let fullSnapshotDir = path.join(SNAPSHOT_DIR, snapshotDir);

            it(`should render ${testName}`, function() {
                let entry: ReportEntry = {
                    category: fileResult.category,
                    fileName: fileResult.fileName,
                    slateIndex: slateNum,
                    snapshotDir: snapshotDir,
                    beforeResult: {passed: false, isNew: false},
                    dragResults: [],
                };

                try {
                    // Build and render the scene
                    let slate = buildScene(config);
                    let canvas = renderScene(slate);

                    // Snapshot the initial state
                    let beforePath = path.join(fullSnapshotDir, "before.png");
                    let beforeResult = assertSnapshot(canvas, beforePath);
                    entry.beforeResult = beforeResult;

                    assert.ok(beforeResult.passed,
                        `Before snapshot failed: ${beforeResult.diffPercent?.toFixed(2)}% pixels differ`);

                    // Find draggable points (up to 5)
                    let draggables = findDraggablePoints(slate, 5);

                    // Drag each point and verify
                    for (let i = 0; i < draggables.length; i++) {
                        let point = draggables[i];
                        let fromX = Math.round(point.x);
                        let fromY = Math.round(point.y);
                        let toX = fromX + 50;
                        let toY = fromY + 30;

                        // Clamp to canvas bounds
                        toX = Math.max(0, Math.min(toX, config.width));
                        toY = Math.max(0, Math.min(toY, config.height));

                        // Simulate drag
                        simulateDrag(slate, [fromX, fromY], [toX, toY]);

                        // Render after drag
                        let afterCanvas = renderScene(slate);

                        // Save after snapshot
                        let afterPath = path.join(fullSnapshotDir, `drag${i+1}-after.png`);
                        let afterResult = assertSnapshot(afterCanvas, afterPath);

                        // Generate verification image with arrow
                        let verifyCanvas = drawVerificationImage(
                            afterCanvas, [fromX, fromY], [toX, toY],
                            point.name || `point${i+1}`
                        );
                        let verifyPath = path.join(fullSnapshotDir, `drag${i+1}-verify.png`);
                        saveVerificationImage(verifyCanvas, verifyPath);

                        entry.dragResults.push({
                            pointName: point.name || `point${i+1}`,
                            result: afterResult,
                        });

                        assert.ok(afterResult.passed,
                            `Drag ${i+1} (${point.name}) snapshot failed: ${afterResult.diffPercent?.toFixed(2)}% pixels differ`);
                    }
                } catch (e) {
                    entry.error = (e as Error).message;
                    // Don't re-throw — record the error in the report
                    // but still mark the test as failed
                    if (!entry.error.includes("snapshot failed")) {
                        // Construction/rendering error, not a snapshot diff
                        // Still fail the test
                    }
                    throw e;
                } finally {
                    reportEntries.push(entry);
                }
            });
        }
    }

    // Generate the HTML report after all tests complete
    after(function() {
        if (reportEntries.length > 0) {
            generateReport(reportEntries);
            console.log(`\n  Report generated: tests/snapshots/report.html`);
            console.log(`  Total slates: ${reportEntries.length}`);
            console.log(`  Passed: ${reportEntries.filter(e => !e.error && e.beforeResult.passed).length}`);
            console.log(`  New baselines: ${reportEntries.filter(e => e.beforeResult.isNew).length}`);
            console.log(`  Errors: ${reportEntries.filter(e => e.error).length}`);
        }
    });
});
