/*----------------------------------------------------------------------+
|    HTML Param Parser — extracts applet configurations from Java HTML   |
|    Reads <applet> blocks and their <param> tags, producing configs     |
|    compatible with the TS geomlib.init() / buildScene() API.           |
+----------------------------------------------------------------------*/

import * as fs from "fs";
import * as path from "path";

export interface SlateConfig {
    width: number;
    height: number;
    background: string;
    title: string;
    pivot?: string;
    elements: string[];  // parseParam-compatible strings
}

export interface HtmlFileResult {
    filePath: string;
    fileName: string;          // e.g., "propI1"
    category: string;          // e.g., "euclid/bookI", "compass", "round"
    slates: SlateConfig[];     // one per <applet> block
}

// Deterministic color to replace "random" — cycles through a fixed palette
const FIXED_COLORS = [
    "200,70,90",   // blue-ish
    "30,70,90",    // orange-ish
    "120,70,90",   // green-ish
    "280,70,90",   // purple-ish
    "60,70,90",    // yellow-ish
    "330,70,90",   // pink-ish
    "180,70,90",   // cyan-ish
    "0,70,90",     // red-ish
];
let colorIndex = 0;

function nextFixedColor(): string {
    let color = FIXED_COLORS[colorIndex % FIXED_COLORS.length];
    colorIndex++;
    return color;
}

function replaceRandomColors(value: string): string {
    // Split on semicolons to find color fields (positions 4-7 in the param format)
    let parts = value.split(";");
    if (parts.length <= 4) return value;
    // Color fields start at index 4: nameColor, vertexColor, edgeColor, faceColor
    for (let i = 4; i < parts.length; i++) {
        if (parts[i].toLowerCase() === "random") {
            parts[i] = nextFixedColor();
        }
    }
    return parts.join(";");
}

// Parse a single <applet>...</applet> block into a SlateConfig
function parseAppletBlock(block: string): SlateConfig | null {
    // Extract width and height from <applet> tag
    let widthMatch = block.match(/width\s*=\s*(\d+)/i);
    let heightMatch = block.match(/height\s*=\s*(\d+)/i);
    let width = widthMatch ? parseInt(widthMatch[1]) : 400;
    let height = heightMatch ? parseInt(heightMatch[1]) : 400;

    // Extract all <param> tags
    // Match both quoted and unquoted param values:
    //   <param name=background value="35,19,100">
    //   <param name=pivot value=C>
    let paramRegex = /<param\s+name\s*=\s*(\S+)\s+value\s*=\s*(?:"([^"]*)"|(\S+?))\s*>/gi;
    let match: RegExpExecArray | null;
    let background = "35,19,100";
    let title = "";
    let pivot: string | undefined;
    let elements: {index: number, value: string}[] = [];

    while ((match = paramRegex.exec(block)) !== null) {
        let name = match[1].toLowerCase();
        let value = match[2] || match[3]; // group 2 = quoted, group 3 = unquoted

        if (name === "background") {
            background = value;
        } else if (name === "title") {
            title = value;
        } else if (name === "pivot") {
            pivot = value;
        } else {
            // Match e[N] pattern
            let eMatch = name.match(/^e\[(\d+)\]$/);
            if (eMatch) {
                let idx = parseInt(eMatch[1]);
                elements.push({index: idx, value: replaceRandomColors(value)});
            }
        }
    }

    if (elements.length === 0) return null;

    // Sort by index and extract values
    elements.sort((a, b) => a.index - b.index);
    let elementStrings = elements.map(e => e.value);

    return { width, height, background, title, pivot, elements: elementStrings };
}

// Parse an HTML file and extract all applet configurations
export function parseHtmlFile(filePath: string): HtmlFileResult {
    let content = fs.readFileSync(filePath, "utf-8");
    let fileName = path.basename(filePath, ".html");

    // Determine category from path
    let category: string;
    if (filePath.includes("compass_geometry")) {
        category = "compass";
    } else if (filePath.includes("round_geometry")) {
        category = "round";
    } else {
        // Euclid books: extract bookN from path
        let bookMatch = filePath.match(/book(\w+)/i);
        category = bookMatch ? `euclid/book${bookMatch[1].toUpperCase()}` : "euclid/other";
    }

    // Reset color index for each file so colors are deterministic per-file
    colorIndex = 0;

    // Split into applet blocks
    // Handle both multi-line and single-line applet blocks
    let slates: SlateConfig[] = [];
    let appletRegex = /<applet[^>]*>[\s\S]*?<\/applet>/gi;
    let appletMatch: RegExpExecArray | null;

    while ((appletMatch = appletRegex.exec(content)) !== null) {
        let config = parseAppletBlock(appletMatch[0]);
        if (config != null) {
            slates.push(config);
        }
    }

    return { filePath, fileName, category, slates };
}

// Discover all HTML files with applets across all source directories
export function discoverAllHtmlFiles(repoRoot: string): HtmlFileResult[] {
    let results: HtmlFileResult[] = [];
    let dirs = [
        { base: path.join(repoRoot, "view/euclid-html"), pattern: /\.(html)$/ },
        { base: path.join(repoRoot, "geom_applet/compass_geometry"), pattern: /\.html$/ },
        { base: path.join(repoRoot, "geom_applet/round_geometry"), pattern: /\.html$/ },
    ];

    for (let dir of dirs) {
        if (!fs.existsSync(dir.base)) continue;
        let files = findHtmlFiles(dir.base, dir.pattern);
        for (let file of files) {
            let result = parseHtmlFile(file);
            if (result.slates.length > 0) {
                results.push(result);
            }
        }
    }

    return results;
}

function findHtmlFiles(dir: string, pattern: RegExp): string[] {
    let files: string[] = [];
    let entries = fs.readdirSync(dir, { withFileTypes: true });
    for (let entry of entries) {
        let fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...findHtmlFiles(fullPath, pattern));
        } else if (pattern.test(entry.name)) {
            files.push(fullPath);
        }
    }
    return files.sort();
}
