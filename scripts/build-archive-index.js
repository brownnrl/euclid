#!/usr/bin/env node
// Build the fixture index consumed by view/test/archive-viewer.html.
//
// A browser cannot list a directory, so the viewer needs a manifest of the
// archival pages to offer lookup over. This walks the same four directories
// the snapshot suite discovers (tests/HtmlParamParser.ts discoverAllHtmlFiles)
// and records, per page, the path, its category, and how many <applet>
// blocks it holds.
//
// Regenerate with `npm run archive:index` after adding or removing fixtures.

const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const ROOTS = [
    "view/euclid-html",
    "view/compass_geometry",
    "view/round_geometry",
    "view/test",
];
const OUT = path.join(REPO, "view/test/archive-index.json");

function walk(dir, acc) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch (_) { return acc; }
    for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, acc);
        else if (e.name.endsWith(".html")) acc.push(p);
    }
    return acc;
}

// Mirror HtmlParamParser's category rules so the viewer groups pages the
// same way the snapshot report does.
function categoryOf(rel) {
    if (rel.includes("compass_geometry")) return "compass";
    if (rel.includes("round_geometry")) return "round";
    if (rel.includes("view/test")) {
        const m = rel.match(/view\/test\/([^/]+)\//);
        return m ? `test/${m[1]}` : "test";
    }
    const m = rel.match(/book(\w+)/i);
    return m ? `euclid/book${m[1].toUpperCase()}` : "euclid/other";
}

const pages = [];
for (const root of ROOTS) {
    for (const abs of walk(path.join(REPO, root), [])) {
        const rel = path.relative(REPO, abs).split(path.sep).join("/");
        let html = "";
        try { html = fs.readFileSync(abs, "utf-8"); } catch (_) { continue; }
        // view/test pages keep the original applet block commented out
        // beside the TS init() call; the parser un-comments it, so count both.
        const uncommented = html.replace(/<!--(applet[\s\S]*?<\/applet)-->/gi, "<$1>");
        const applets = (uncommented.match(/<applet[^>]*>/gi) || []).length;
        const inits = (html.match(/geomlib\.init\s*\(/g) || []).length;
        if (applets === 0 && inits === 0) continue;
        pages.push({
            // Relative to view/test/, which is where the viewer lives.
            path: "../" + rel.replace(/^view\//, ""),
            repoPath: rel,
            name: path.basename(rel, ".html"),
            category: categoryOf(rel),
            applets,
            inits,
        });
    }
}

pages.sort((a, b) => a.repoPath.localeCompare(b.repoPath));
fs.writeFileSync(OUT, JSON.stringify({ generated: pages.length, pages }, null, 1) + "\n");
console.log(`build-archive-index: ${pages.length} pages -> ${path.relative(REPO, OUT)}`);
