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
import {Slate} from "../src/Slate";
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
export function buildScene(config: SlateConfig): Slate {
    let canvas = createCanvas(config.width, config.height);
    let slate = new Slate(canvas as unknown as HTMLCanvasElement);

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
            // Skip unparseable elements (e.g., unknown constructions)
            continue;
        }

        let element: GeomElement;
        try {
            element = slate.createElement(param.construction, param.params, param.name);
        } catch (e) {
            // Skip elements that fail to construct
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
    for (let element of slate.elements) element.drawFace(canvas as any);
    for (let element of slate.elements) element.drawEdge(canvas as any);
    for (let element of slate.elements) element.drawVertex(canvas as any);
    for (let element of slate.elements) element.drawName(canvas as any);
    return canvas;
}

// -----------------------------------------------------------------
// Find draggable points (up to maxCount)
// -----------------------------------------------------------------
export function findDraggablePoints(slate: Slate, maxCount: number = 5): PointElement[] {
    let draggables: PointElement[] = [];
    for (let elem of slate.elements) {
        if (elem instanceof PointElement && elem.draggable && elem.name) {
            draggables.push(elem);
            if (draggables.length >= maxCount) break;
        }
    }
    return draggables;
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

// -----------------------------------------------------------------
// HTML report generation
// -----------------------------------------------------------------
export interface ReportEntry {
    category: string;
    fileName: string;
    slateIndex: number;
    snapshotDir: string;     // relative to SNAPSHOT_DIR
    beforeResult: SnapshotResult;
    dragResults: {
        pointName: string;
        result: SnapshotResult;
    }[];
    error?: string;
}

export function generateReport(entries: ReportEntry[]): void {
    // Group by category
    let categories: {[key: string]: ReportEntry[]} = {};
    for (let entry of entries) {
        if (!categories[entry.category]) categories[entry.category] = [];
        categories[entry.category].push(entry);
    }

    let html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Snapshot Verification Report</title>
<style>
body { font-family: sans-serif; margin: 20px; background: #f5f5f5; }
h1 { color: #333; }
h2 { color: #555; cursor: pointer; }
h2:hover { text-decoration: underline; }
table { border-collapse: collapse; margin: 10px 0 20px; }
th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: center; font-size: 13px; }
th { background: #e8e8e8; }
img { max-width: 150px; max-height: 120px; border: 1px solid #ddd; }
.pass { background: #d4edda; }
.fail { background: #f8d7da; }
.new { background: #fff3cd; }
.error { background: #f8d7da; color: #721c24; }
.section { margin-bottom: 30px; }
details { margin: 5px 0; }
</style>
</head><body>
<h1>Snapshot Verification Report</h1>
<p>Generated: ${new Date().toISOString()}</p>
<p>Total slates: ${entries.length} |
   Passed: ${entries.filter(e => !e.error && e.beforeResult.passed).length} |
   New baselines: ${entries.filter(e => e.beforeResult.isNew).length} |
   Failed: ${entries.filter(e => !e.error && !e.beforeResult.passed).length} |
   Errors: ${entries.filter(e => e.error).length}</p>
`;

    for (let [cat, catEntries] of Object.entries(categories).sort()) {
        html += `<div class="section"><details open>
<summary><h2>${cat} (${catEntries.length} slates)</h2></summary>
<table>
<tr><th>Name</th><th>Slate</th><th>Before</th>`;
        // Add drag columns
        for (let i = 1; i <= 5; i++) html += `<th>Drag ${i}</th>`;
        html += `<th>Status</th></tr>\n`;

        for (let entry of catEntries) {
            let statusClass = entry.error ? "error" :
                entry.beforeResult.isNew ? "new" :
                entry.beforeResult.passed ? "pass" : "fail";
            let statusText = entry.error ? "ERROR" :
                entry.beforeResult.isNew ? "NEW" :
                entry.beforeResult.passed ? "PASS" : "FAIL";

            let relDir = entry.snapshotDir;
            html += `<tr class="${statusClass}">`;
            html += `<td>${entry.fileName}</td>`;
            html += `<td>slate${entry.slateIndex}</td>`;

            if (entry.error) {
                html += `<td colspan="7">${entry.error}</td>`;
            } else {
                // Before image
                html += `<td><img src="${relDir}/before.png" loading="lazy"></td>`;
                // Drag verify images
                for (let i = 0; i < 5; i++) {
                    if (i < entry.dragResults.length) {
                        let dr = entry.dragResults[i];
                        html += `<td><img src="${relDir}/drag${i+1}-verify.png" loading="lazy" title="${dr.pointName}"></td>`;
                    } else {
                        html += `<td>—</td>`;
                    }
                }
                html += `<td>${statusText}</td>`;
            }
            html += `</tr>\n`;
        }

        html += `</table></details></div>\n`;
    }

    html += `</body></html>`;

    let reportPath = path.join(SNAPSHOT_DIR, "report.html");
    fs.mkdirSync(path.dirname(reportPath), {recursive: true});
    fs.writeFileSync(reportPath, html);
}
