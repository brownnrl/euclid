/*----------------------------------------------------------------------+
|    Snapshot test helper — render, compare, drag, and report.          |
|    Renders Slate scenes from SlateConfig, simulates drag interactions,|
|    compares against golden PNG baselines via pixelmatch, and generates |
|    an HTML report with before/after/verify images.                    |
+----------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";
import {PNG} from "pngjs";
const pixelmatch = require("pixelmatch");
import {createCanvas, Canvas} from "canvas";
import {Slate, promotedDrawOrder} from "../src/Slate";
import {PointElement} from "../src/elements/point/PointElement";
import {PlaneSlider} from "../src/elements/point/PlaneSlider";
import {parseColor, lighten} from "../src/Colors";
import {parseParam, IConstructionInfo} from "../src/index";
import {Align as align} from "../src/elements/GeomElement";
import {GeomElement} from "../src/elements/GeomElement";
import {SlateConfig} from "./HtmlParamParser";

const SNAPSHOT_DIR = path.join(__dirname, "snapshots");
const THRESHOLD = 0.1;
const FAIL_PERCENT = 0.5;

// -----------------------------------------------------------------
// Build a Slate from a SlateConfig (parsed from HTML)
// -----------------------------------------------------------------
export function buildScene(config: SlateConfig, label?: string): Slate {
    let canvas = createCanvas(config.width, config.height);
    let slate = new Slate(canvas as unknown as HTMLCanvasElement);
    // #154 — the fixture this scene came from. Diagnostics are mirrored to
    // the console during a test run, where "element 'b' failed to construct"
    // is unactionable without knowing which of ~650 fixtures produced it.
    const scene = label != null ? label + ": " : "";

    // Parse background
    let bgcolor = parseColor(config.background, "#ffffff", "#ffffff");
    slate.bgcolor = bgcolor;

    // Set font to match Java default
    GeomElement.setFont("Times New Roman", 18);

    for (let paramStr of config.elements) {
        let param: IConstructionInfo;
        try {
            param = parseParam(paramStr);
        } catch (e) {
            // #154 — was a silent skip. A fixture with an unparseable
            // element still renders, just missing a piece, so nothing ever
            // said so. Report it against the slate and the Warn column in
            // report.html picks it up.
            slate.reportDiagnostic({
                code: "unparseable-element",
                key: String(paramStr),
                message: scene + "could not parse element param: " + String(paramStr),
                detail: { param: String(paramStr) },
            });
            continue;
        }

        let element: GeomElement;
        try {
            element = slate.createElement(param.construction, param.params, param.name);
        } catch (e) {
            // #154 — likewise: a construction that throws leaves a hole in
            // the figure and used to do so silently.
            slate.reportDiagnostic({
                code: "construction-failed",
                key: String(param.name),
                message: scene + "element '" + String(param.name) + "' failed to construct: "
                    + String((e as Error).message),
                detail: { elem: String(param.name) },
            });
            continue;
        }

        element.align = align.CENTRAL;

        let defaultNameColor = element instanceof PointElement ? "black" : null;
        element.nameColor = parseColor(param.nameColor, defaultNameColor, bgcolor);

        let defaultVertexColor = element.draggable ?
            ((element instanceof PlaneSlider) ? "red" : "orange") : "black";
        element.vertexColor = parseColor(param.vertexColor, defaultVertexColor, bgcolor);
        element.edgeColor = parseColor(param.edgeColor, "black", bgcolor);

        let lighterColor = lighten(bgcolor);
        let defaultFaceColor = element.dimension == 2 ? lighterColor : null;
        element.faceColor = parseColor(param.faceColor, defaultFaceColor, bgcolor);
    }

    // Set pivot if specified
    if (config.pivot) {
        try {
            slate.setPivot(config.pivot);
        } catch (e) {
            // Ignore pivot errors (element may not exist)
        }
    }

    slate.update();
    return slate;
}

// -----------------------------------------------------------------
// Render the scene to its canvas
// -----------------------------------------------------------------
export function renderScene(slate: Slate): Canvas {
    let canvas = (slate as any)._canvas as Canvas;
    let ctx = canvas.getContext("2d");
    let w = canvas.width;
    let h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = slate.bgcolor;
    ctx.fillRect(0, 0, w, h);
    // Mirror Slate.drawElements' pass order INCLUDING the #140 promotion of
    // highlighted / mid-animation elements. Slate.drawElements early-returns
    // under inTest, so this is the only draw path the snapshot suite takes —
    // if it diverges, the goldens stop representing what a browser paints.
    const order = slate.highlightOnTop
        ? promotedDrawOrder(slate.elements) : slate.elements;
    for (let element of order) element.drawFace(canvas as any);
    for (let element of order) element.drawEdge(canvas as any);
    for (let element of order) element.drawVertex(canvas as any);
    for (let element of order) element.drawName(canvas as any);
    return canvas;
}

// -----------------------------------------------------------------
// Find draggable points worth exercising in the snapshot report.
//
// We only pick points that can meaningfully change the proportions of
// the drawing when dragged. In practice that means:
//   - has a name and is marked draggable (PlaneSlider / LineSlider /
//     CircleSlider / SphereSlider — free points become PlaneSliders)
//   - is rendered inside the visible canvas bounds
//
// The second rule filters out "helper anchors" like the ±1000-x points
// used in Book IX to define a number-line axis: dragging them either
// hit-tests to nothing (off-canvas) or just translates the frame,
// neither of which exercises the construction's geometry.
// -----------------------------------------------------------------
export function findDraggablePoints(
    slate: Slate,
    maxCount: number = 5,
    canvasWidth?: number,
    canvasHeight?: number
): PointElement[] {
    let draggables: PointElement[] = [];
    for (let elem of slate.elements) {
        if (!(elem instanceof PointElement)) continue;
        if (!elem.draggable || !elem.name) continue;
        if (canvasWidth != null && canvasHeight != null) {
            if (elem.x < 0 || elem.x > canvasWidth) continue;
            if (elem.y < 0 || elem.y > canvasHeight) continue;
        }
        draggables.push(elem);
        if (draggables.length >= maxCount) break;
    }
    return draggables;
}

// Snapshot a canvas's raw pixel bytes so we can compare them later
// without aliasing the live canvas buffer (renderScene mutates in place).
export function capturePixels(canvas: Canvas): Buffer {
    let ctx = canvas.getContext("2d");
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return Buffer.from(imageData.data);
}

// -----------------------------------------------------------------
// Simulate a drag: mousedown → mousemove → mouseup
// -----------------------------------------------------------------
export function simulateDrag(
    slate: Slate,
    from: [number, number],
    to: [number, number]
): void {
    (slate as any)._onMouseDown(from[0], from[1]);
    (slate as any)._onMouseDrag(to[0], to[1]);
    (slate as any)._onMouseUp(to[0], to[1]);
}

// -----------------------------------------------------------------
// Draw a verification image: the scene with a drag arrow overlaid
// -----------------------------------------------------------------
export function drawVerificationImage(
    canvas: Canvas,
    from: [number, number],
    to: [number, number],
    label: string
): Canvas {
    let w = canvas.width;
    let h = canvas.height;
    let verifyCanvas = createCanvas(w, h);
    let ctx = verifyCanvas.getContext("2d");

    ctx.drawImage(canvas, 0, 0);

    let [x1, y1] = from;
    let [x2, y2] = to;

    ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
    ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
    ctx.lineWidth = 2;

    // Arrow shaft
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead
    let angle = Math.atan2(y2 - y1, x2 - x1);
    let headLen = 10;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6),
               y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6),
               y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Start dot
    ctx.beginPath();
    ctx.arc(x1, y1, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Label
    ctx.font = "12px sans-serif";
    ctx.fillText(label, x1 + 8, y1 - 8);

    return verifyCanvas;
}

// -----------------------------------------------------------------
// Canvas → PNG conversion
// -----------------------------------------------------------------
function canvasToPNG(canvas: Canvas): PNG {
    let ctx = canvas.getContext("2d");
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let png = new PNG({width: canvas.width, height: canvas.height});
    png.data = Buffer.from(imageData.data);
    return png;
}

function savePNG(png: PNG, filePath: string): void {
    fs.mkdirSync(path.dirname(filePath), {recursive: true});
    fs.writeFileSync(filePath, PNG.sync.write(png));
}

function loadPNG(filePath: string): PNG | null {
    if (!fs.existsSync(filePath)) return null;
    return PNG.sync.read(fs.readFileSync(filePath));
}

// -----------------------------------------------------------------
// Snapshot comparison
// -----------------------------------------------------------------
export interface SnapshotResult {
    passed: boolean;
    isNew: boolean;
    diffPixels?: number;
    totalPixels?: number;
    diffPercent?: number;
}

export function assertSnapshot(
    canvas: Canvas,
    snapshotPath: string
): SnapshotResult {
    let actual = canvasToPNG(canvas);
    let golden = loadPNG(snapshotPath);

    if (golden == null) {
        savePNG(actual, snapshotPath);
        return {passed: true, isNew: true};
    }

    if (golden.width !== actual.width || golden.height !== actual.height) {
        savePNG(actual, snapshotPath.replace(".png", "-actual.png"));
        return {
            passed: false, isNew: false,
            diffPixels: golden.width * golden.height,
            totalPixels: golden.width * golden.height,
            diffPercent: 100
        };
    }

    let diffPng = new PNG({width: golden.width, height: golden.height});
    let diffPixels = pixelmatch(
        golden.data, actual.data, diffPng.data,
        golden.width, golden.height,
        {threshold: THRESHOLD}
    );

    let totalPixels = golden.width * golden.height;
    let diffPercent = (diffPixels / totalPixels) * 100;

    if (diffPercent > FAIL_PERCENT) {
        savePNG(actual, snapshotPath.replace(".png", "-actual.png"));
        savePNG(diffPng, snapshotPath.replace(".png", "-diff.png"));
        return {passed: false, isNew: false, diffPixels, totalPixels, diffPercent};
    }

    return {passed: true, isNew: false, diffPixels, totalPixels, diffPercent};
}

export function saveVerificationImage(canvas: Canvas, filePath: string): void {
    savePNG(canvasToPNG(canvas), filePath);
}

// Count differing pixels between two pre-captured pixel buffers.
// Uses pixelmatch's perceptual threshold (same as assertSnapshot) so
// antialiasing noise around a small shift doesn't swamp the count.
export function countDiffPixels(
    priorBytes: Buffer,
    currentCanvas: Canvas
): number {
    let expectedLen = currentCanvas.width * currentCanvas.height * 4;
    if (priorBytes.length !== expectedLen) return Infinity;
    let currentBytes = capturePixels(currentCanvas);
    let diffBuf = Buffer.alloc(expectedLen);
    return pixelmatch(
        priorBytes, currentBytes, diffBuf,
        currentCanvas.width, currentCanvas.height,
        {threshold: THRESHOLD}
    );
}

// -----------------------------------------------------------------
// HTML report generation
// -----------------------------------------------------------------
export interface ReportEntry {
    category: string;
    fileName: string;
    slateIndex: number;
    snapshotDir: string;     // relative to SNAPSHOT_DIR
    config: SlateConfig;     // used to rebuild a live slate in the browser
    beforeResult: SnapshotResult;
    dragResults: {
        pointName: string;
        result: SnapshotResult;
    }[];
    error?: string;
    // #154 — diagnostics the slate reported while this scene was built
    // and rendered. Report-only: nothing here fails a test, because CI
    // runs test:unit and never reaches the snapshot suite.
    warnings?: string[];
}

export function generateReport(entries: ReportEntry[]): void {
    // #67 — where the report should load geomlib from. The default is
    // relative to tests/snapshots/, which is the only place the report
    // normally lives. When the report is PUBLISHED somewhere else that path
    // no longer resolves (on the site today it points at /dist/bundle.js,
    // which 404s, so the live-slate modal silently fails), hence the
    // override: the publish step ships a copy of the bundle beside
    // report.html and sets this to "bundle.js".
    const bundleSrc = process.env.GEOMLIB_REPORT_BUNDLE_SRC || "../../dist/bundle.js";

    // Group by category
    let categories: {[key: string]: ReportEntry[]} = {};
    for (let entry of entries) {
        if (!categories[entry.category]) categories[entry.category] = [];
        categories[entry.category].push(entry);
    }

    // Build a map of slateKey -> SlateConfig for in-browser instantiation.
    // Key format matches the data-slate attribute we put on each image.
    let configMap: {[key: string]: SlateConfig} = {};
    for (let entry of entries) {
        let key = `${entry.category}/${entry.fileName}/slate${entry.slateIndex}`;
        configMap[key] = entry.config;
    }

    let html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Snapshot Verification Report</title>
<style>
body { font-family: sans-serif; margin: 20px; background: #f5f5f5; }
h1 { color: #333; }
h2 { color: #555; cursor: pointer; display: inline; font-size: 1.2em; }
h2:hover { text-decoration: underline; }
table { border-collapse: collapse; margin: 10px 0 20px; }
th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: center; font-size: 13px; }
th { background: #e8e8e8; }
img { max-width: 150px; max-height: 120px; border: 1px solid #ddd; }
.thumb { cursor: zoom-in; }
.thumb:hover { outline: 2px solid #3a80c4; }
.pass { background: #d4edda; }
.fail { background: #f8d7da; }
.new { background: #fff3cd; }
.error { background: #f8d7da; color: #721c24; }
.warn { background: #fff3cd; color: #7a5c00; font-weight: 600; }
.section { margin-bottom: 30px; }
details { margin: 5px 0; }

/* Modal backdrop */
.modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.65);
    display: none;
    align-items: center; justify-content: center;
    z-index: 1000;
    overflow: auto; padding: 20px;
}
.modal-backdrop.open { display: flex; }

/* Modal window */
.modal {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    max-width: 95vw;
    padding: 16px 20px;
    position: relative;
}
.modal-close {
    position: absolute; top: 6px; right: 10px;
    background: none; border: none;
    font-size: 24px; line-height: 1;
    cursor: pointer; color: #888;
}
.modal-close:hover { color: #222; }
.modal-title { margin: 0 30px 12px 0; font-size: 16px; color: #333; }
.modal-subtitle { margin: 0 0 12px; font-size: 12px; color: #666; font-family: monospace; }

/* Image strip */
.strip {
    display: flex; gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
    margin-bottom: 16px;
    border-bottom: 1px solid #ddd;
}
.strip figure { margin: 0; text-align: center; flex-shrink: 0; }
.strip img {
    max-height: 180px; max-width: 240px;
    border: 1px solid #bbb; cursor: zoom-in;
    display: block;
}
.strip img:hover { outline: 2px solid #3a80c4; }
.strip figcaption { font-size: 11px; color: #555; margin-top: 2px; }

/* Live canvas area */
.live-area { text-align: center; }
.live-area canvas {
    border: 1px solid #bbb;
    background: #fff;
    max-width: 100%;
}
.live-hint {
    font-size: 11px; color: #666; margin: 8px 0 0;
}

/* Expanded image overlay (layer above modal) */
.lightbox-backdrop {
    position: fixed; inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: none;
    align-items: center; justify-content: center;
    z-index: 2000;
    cursor: zoom-out;
    padding: 20px;
}
.lightbox-backdrop.open { display: flex; }
.lightbox-backdrop img {
    max-width: 98vw; max-height: 98vh;
    border: 2px solid #fff;
}
</style>
</head><body>
<h1>Snapshot Verification Report</h1>
<p>Generated: ${new Date().toISOString()}</p>
<p>Total slates: ${entries.length} |
   Passed: ${entries.filter(e => !e.error && e.beforeResult.passed).length} |
   New baselines: ${entries.filter(e => e.beforeResult.isNew).length} |
   Failed: ${entries.filter(e => !e.error && !e.beforeResult.passed).length} |
   Errors: ${entries.filter(e => e.error).length} |
   Warnings: ${entries.filter(e => e.warnings && e.warnings.length).length}</p>
<p style="color:#555;font-size:13px">Click any image to open a live slate + image sequence. Click a strip image again to enlarge.</p>
`;

    // Each drag is rendered as a (move, verify) pair — clean after-state
    // plus the same state with the drag arrow overlaid for verification.
    const MAX_DRAG_PAIRS = 2;

    for (let [cat, catEntries] of Object.entries(categories).sort()) {
        html += `<div class="section"><details open>
<summary><h2>${cat} (${catEntries.length} slates)</h2></summary>
<table>
<tr><th>Name</th><th>Slate</th><th>Before</th>`;
        for (let i = 1; i <= MAX_DRAG_PAIRS; i++) {
            html += `<th>Drag ${i} Move</th><th>Drag ${i} Verify</th>`;
        }
        html += `<th>Warn</th><th>Status</th></tr>\n`;

        let dragColCount = MAX_DRAG_PAIRS * 2;
        let errorColspan = dragColCount + 3;  // +before +warn +status

        for (let entry of catEntries) {
            let statusClass = entry.error ? "error" :
                entry.beforeResult.isNew ? "new" :
                entry.beforeResult.passed ? "pass" : "fail";
            let statusText = entry.error ? "ERROR" :
                entry.beforeResult.isNew ? "NEW" :
                entry.beforeResult.passed ? "PASS" : "FAIL";

            let relDir = entry.snapshotDir;
            let slateKey = `${entry.category}/${entry.fileName}/slate${entry.slateIndex}`;
            html += `<tr class="${statusClass}">`;
            html += `<td>${entry.fileName}</td>`;
            html += `<td>slate${entry.slateIndex}</td>`;

            if (entry.error) {
                html += `<td colspan="${errorColspan}">${entry.error}</td>`;
            } else {
                html += `<td><img class="thumb" data-slate="${slateKey}" src="${relDir}/before.png" loading="lazy" alt="before"></td>`;
                for (let i = 0; i < MAX_DRAG_PAIRS; i++) {
                    if (i < entry.dragResults.length) {
                        let dr = entry.dragResults[i];
                        // Move image = with red arrow (shows the drag).
                        // Verify image = clean post-drag state (baseline).
                        html += `<td><img class="thumb" data-slate="${slateKey}" src="${relDir}/drag${i+1}-move.png" loading="lazy" title="${dr.pointName} (move)" alt="drag${i+1} move"></td>`;
                        html += `<td><img class="thumb" data-slate="${slateKey}" src="${relDir}/drag${i+1}-verify.png" loading="lazy" title="${dr.pointName} (verify)" alt="drag${i+1} verify"></td>`;
                    } else {
                        html += `<td>—</td><td>—</td>`;
                    }
                }
                const warns = entry.warnings || [];
                html += warns.length
                    ? `<td class="warn" title="${warns.join(" | ").replace(/"/g, "&quot;")}">${warns.length}</td>`
                    : `<td>-</td>`;
                html += `<td>${statusText}</td>`;
            }
            html += `</tr>\n`;
        }

        html += `</table></details></div>\n`;
    }

    // Modal + lightbox markup
    html += `
<div class="modal-backdrop" id="modal">
  <div class="modal">
    <button class="modal-close" id="modalClose" title="Close">&times;</button>
    <h3 class="modal-title" id="modalTitle"></h3>
    <p class="modal-subtitle" id="modalSubtitle"></p>
    <div class="strip" id="modalStrip"></div>
    <div class="live-area">
      <div id="liveSlateHost"></div>
      <p class="live-hint">Drag any orange/red point to interact.</p>
    </div>
  </div>
</div>

<div class="lightbox-backdrop" id="lightbox">
  <img id="lightboxImg" alt="">
</div>

<script src="${bundleSrc}"></script>
<script>
const CONFIGS = ${JSON.stringify(configMap)};
const ENTRIES = ${JSON.stringify(entries.map(e => ({
    category: e.category,
    fileName: e.fileName,
    slateIndex: e.slateIndex,
    snapshotDir: e.snapshotDir,
    dragPoints: e.dragResults.map(d => d.pointName),
})))};
const ENTRY_BY_KEY = {};
for (const e of ENTRIES) {
    ENTRY_BY_KEY[e.category + "/" + e.fileName + "/slate" + e.slateIndex] = e;
}

const modal = document.getElementById("modal");
const modalClose = document.getElementById("modalClose");
const modalTitle = document.getElementById("modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");
const modalStrip = document.getElementById("modalStrip");
const liveCanvas = document.getElementById("liveCanvas");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");

function openModal(slateKey) {
    const config = CONFIGS[slateKey];
    const entry = ENTRY_BY_KEY[slateKey];
    if (!config || !entry) return;

    modalTitle.textContent = entry.category + " / " + entry.fileName + " / slate" + entry.slateIndex;
    modalSubtitle.textContent = config.title || "";

    // Build image strip: before + for each drag, both the clean "move"
    // image and the with-arrow "verify" image (= a complete pair).
    modalStrip.innerHTML = "";
    const relDir = entry.snapshotDir;
    const images = [{src: relDir + "/before.png", label: "before"}];
    for (let i = 0; i < entry.dragPoints.length; i++) {
        const n = i + 1;
        const name = entry.dragPoints[i];
        // Move image (with arrow) shows the drag action; verify image is
        // the clean post-drag state used as the regression baseline.
        // Sequence reads: before → move → verify → move → verify.
        images.push({
            src: relDir + "/drag" + n + "-move.png",
            label: "drag " + n + " move (" + name + ")"
        });
        images.push({
            src: relDir + "/drag" + n + "-verify.png",
            label: "drag " + n + " verify"
        });
    }
    for (const im of images) {
        const fig = document.createElement("figure");
        const img = document.createElement("img");
        img.src = im.src;
        img.alt = im.label;
        img.addEventListener("click", () => openLightbox(im.src, im.label));
        const cap = document.createElement("figcaption");
        cap.textContent = im.label;
        fig.appendChild(img);
        fig.appendChild(cap);
        modalStrip.appendChild(fig);
    }

    // Tear down any previous live slate: geomlib.init wraps the canvas
    // in a controls div, so we can't just replaceChild on the host.
    // Wiping the host and dropping the slate reference is the safe path.
    destroyLiveSlate();

    const fresh = document.createElement("canvas");
    fresh.id = "liveCanvas";
    fresh.width = config.width;
    fresh.height = config.height;
    fresh.style.width = config.width + "px";
    fresh.style.height = config.height + "px";
    document.getElementById("liveSlateHost").appendChild(fresh);

    modal.classList.add("open");

    try {
        geomlib.init({
            canvasid: "liveCanvas",
            background: config.background,
            title: config.title || "",
            pivot: config.pivot,
            elements: config.elements,
        });
    } catch (err) {
        console.error("Failed to instantiate live slate:", err);
    }
}

function destroyLiveSlate() {
    const host = document.getElementById("liveSlateHost");
    if (host) host.innerHTML = "";
    // geomlib.slates is the module-level registry that init() pushes into.
    // Drop the most recent entry so the old Slate (and its event closures)
    // can be garbage-collected.
    if (typeof geomlib !== "undefined" && Array.isArray(geomlib.slates)) {
        geomlib.slates.pop();
    }
}

function closeModal() {
    modal.classList.remove("open");
    destroyLiveSlate();
}

function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.classList.add("open");
}

function closeLightbox() {
    lightbox.classList.remove("open");
    lightboxImg.src = "";
}

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
lightbox.addEventListener("click", closeLightbox);
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (lightbox.classList.contains("open")) closeLightbox();
        else if (modal.classList.contains("open")) closeModal();
    }
});

// Wire thumbnails in the report table
document.querySelectorAll("img.thumb").forEach(img => {
    img.addEventListener("click", () => {
        const key = img.getAttribute("data-slate");
        if (key) openModal(key);
    });
});
</script>
</body></html>`;

    let reportPath = path.join(SNAPSHOT_DIR, "report.html");
    fs.mkdirSync(path.dirname(reportPath), {recursive: true});
    fs.writeFileSync(reportPath, html);
}
