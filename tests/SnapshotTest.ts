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
    ReportEntry, countDiffPixels, capturePixels
} from "./SnapshotHelper";
import {Slate} from "../src/Slate";
import {reportEntries, ensureReportFlushed} from "./sharedSnapshotReport";

const REPO_ROOT = path.resolve(__dirname, "..");
const SNAPSHOT_DIR = path.join(__dirname, "snapshots");

ensureReportFlushed();

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
                    config: config,
                    beforeResult: {passed: false, isNew: false},
                    dragResults: [],
                };

                let slate: Slate | null = null;
                try {
                    // Build and render the scene
                    slate = buildScene(config);
                    let canvas = renderScene(slate);

                    // Snapshot the initial state
                    let beforePath = path.join(fullSnapshotDir, "before.png");
                    let beforeResult = assertSnapshot(canvas, beforePath);
                    entry.beforeResult = beforeResult;

                    assert.ok(beforeResult.passed,
                        `Before snapshot failed: ${beforeResult.diffPercent?.toFixed(2)}% pixels differ`);

                    // Only drag on-canvas draggable points — off-canvas
                    // anchors like the ±1000-x helpers in Book IX are either
                    // invisible (unpickable) or just translate the frame.
                    // Pool 10 candidates so we can keep trying when early
                    // ones fail the visual-significance check below.
                    let candidates = findDraggablePoints(slate, 10, config.width, config.height);

                    // A drag is "worth recording" only if it visibly changes
                    // the rendering by at least this much. Sliders that only
                    // move their own endpoint, or that propagate to a distant
                    // proportion-point shifting a handful of pixels, fall
                    // below this floor — dragging them produces near-identical
                    // thumbnails and is noise for this report. 2% is roughly
                    // the visible threshold at 150-px thumbnail size.
                    let totalPixels = config.width * config.height;
                    let minDiffPixels = Math.max(200, Math.floor(totalPixels * 0.02));

                    let priorBytes = capturePixels(canvas);  // snapshot initial pixels
                    let recorded = 0;                         // count of meaningful drags

                    // Cap at 2 meaningful drags so every drag is shown as a
                    // complete (move, verify) pair in the report — total of
                    // 5 images per slate (1 before + 2 pairs), always ending
                    // on a verify image.
                    for (let point of candidates) {
                        if (recorded >= 2) break;

                        let fromX = Math.round(point.x);
                        let fromY = Math.round(point.y);
                        let toX = fromX + 50;
                        let toY = fromY + 30;

                        toX = Math.max(0, Math.min(toX, config.width));
                        toY = Math.max(0, Math.min(toY, config.height));

                        let origX = point.x;
                        let origY = point.y;

                        simulateDrag(slate, [fromX, fromY], [toX, toY]);
                        let afterCanvas = renderScene(slate);

                        if (countDiffPixels(priorBytes, afterCanvas) < minDiffPixels) {
                            // Visually insignificant change — revert this
                            // drag so subsequent candidates see the original
                            // scene state, then move on.
                            let nowX = Math.round(point.x);
                            let nowY = Math.round(point.y);
                            simulateDrag(slate, [nowX, nowY], [Math.round(origX), Math.round(origY)]);
                            renderScene(slate);
                            continue;
                        }

                        recorded++;
                        let dragNum = recorded;

                        // The clean post-drag canvas is the verification
                        // baseline — that's what we compare against in
                        // future runs. The arrow-annotated version is the
                        // "move" image, a visual showing which drag was
                        // performed (not compared, just displayed).
                        let verifyPath = path.join(fullSnapshotDir, `drag${dragNum}-verify.png`);
                        let verifyResult = assertSnapshot(afterCanvas, verifyPath);

                        let moveCanvas = drawVerificationImage(
                            afterCanvas, [fromX, fromY], [toX, toY],
                            point.name || `point${dragNum}`
                        );
                        let movePath = path.join(fullSnapshotDir, `drag${dragNum}-move.png`);
                        saveVerificationImage(moveCanvas, movePath);

                        entry.dragResults.push({
                            pointName: point.name || `point${dragNum}`,
                            result: verifyResult,
                        });

                        priorBytes = capturePixels(afterCanvas);

                        assert.ok(verifyResult.passed,
                            `Drag ${dragNum} (${point.name}) snapshot failed: ${verifyResult.diffPercent?.toFixed(2)}% pixels differ`);
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
                    // #154 — attribute whatever the slate complained about to
                    // this scene, so report.html can show it per row.
                    if (slate) entry.warnings = slate.diagnostics.map((d) => d.message);
                    reportEntries.push(entry);
                }
            });
        }
    }

    // Report generation moved into ./sharedSnapshotReport so other
    // snapshot-style suites (e.g. HighlightSnapshotTest) can contribute
    // categories to the same report.html.
});
