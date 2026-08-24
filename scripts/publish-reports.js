#!/usr/bin/env node
// Publish the coverage and snapshot reports to their own repo, which
// GitHub Pages serves (#67).
//
// Why a separate repo rather than a gh-pages branch here: the snapshot
// report is ~42 MB of PNGs — roughly three times the entire history of
// this repository — and `git clone` fetches every ref by default. Putting
// it on a branch of this repo would make every contributor download
// artifacts they never need. `--single-branch` avoids that but is not the
// default and cannot be imposed on anyone.
//
// Publishing is a single ORPHAN commit, force-pushed: the reports repo
// replaces its contents each time instead of accumulating a 42 MB delta
// per release.
//
// Run via `npm run reports:publish`, or automatically from `postpublish`
// after a successful `npm publish`.

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const REPO = path.join(__dirname, "..");
const REPORTS_REMOTE = process.env.GEOMLIB_REPORTS_REMOTE
    || "git@github.com:brownnrl/geomlib-reports.git";
const REPORTS_BRANCH = process.env.GEOMLIB_REPORTS_BRANCH || "main";

const argv = process.argv.slice(2);
const noSnapshots = argv.includes("--no-snapshots");
const dryRun = argv.includes("--dry-run")
    // npm sets this for `npm publish --dry-run`; without the check the
    // postpublish hook would force-push on a rehearsal.
    || process.env.npm_config_dry_run === "true";

function log(msg) { console.log("publish-reports: " + msg); }

// A publish that already succeeded must not be reported as failed because
// the report push didn't work. Say so loudly, exit 0.
function bail(msg) {
    console.error("publish-reports: " + msg);
    console.error("publish-reports: reports NOT published (the npm publish itself was unaffected).");
    process.exit(0);
}

function git(args, cwd) {
    return execFileSync("git", args, { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
}

// Recursive copy that skips names we never want to ship.
function copyTree(src, dest, skip) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        const base = path.basename(src);
        if (skip && skip.has(base)) return 0;
        fs.mkdirSync(dest, { recursive: true });
        let n = 0;
        for (const entry of fs.readdirSync(src)) {
            n += copyTree(path.join(src, entry), path.join(dest, entry), skip);
        }
        return n;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return 1;
}

function humanSize(bytes) {
    if (bytes > 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
    if (bytes > 1024) return Math.round(bytes / 1024) + " KB";
    return bytes + " B";
}

function treeSize(dir, skip) {
    let total = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (skip && skip.has(entry.name)) continue;
        const p = path.join(dir, entry.name);
        total += entry.isDirectory() ? treeSize(p, skip) : fs.statSync(p).size;
    }
    return total;
}

// ---- what we're shipping ---------------------------------------------
const coverageDir = path.join(REPO, "coverage");
const snapshotDir = path.join(REPO, "tests", "snapshots");
const reportHtml = path.join(snapshotDir, "report.html");
const bundle = path.join(REPO, "dist", "bundle.js");

if (!fs.existsSync(path.join(coverageDir, "index.html"))) {
    bail("no coverage report found — run `npm run coverage` first.");
}
if (!noSnapshots && !fs.existsSync(reportHtml)) {
    bail("no snapshot report found — run `npm run test:snapshot` first, "
       + "or pass --no-snapshots.");
}
if (!noSnapshots && !fs.existsSync(bundle)) {
    bail("dist/bundle.js is missing — run `npm run bundle` first "
       + "(the report needs it for the live-slate modal).");
}

const version = require(path.join(REPO, "package.json")).version;

if (dryRun) {
    log("dry run — nothing will be pushed.");
    log("would publish geomlib " + version + " reports to "
        + REPORTS_REMOTE + " (" + REPORTS_BRANCH + ")");
    log("  coverage/            " + humanSize(treeSize(coverageDir, new Set(["tmp"]))) + " (tmp/ excluded)");
    if (!noSnapshots) {
        log("  snapshots/report.html " + humanSize(fs.statSync(reportHtml).size));
        log("  snapshots/ PNG tree   " + humanSize(treeSize(snapshotDir)));
    } else {
        log("  snapshots/           skipped (--no-snapshots)");
    }
    process.exit(0);
}

// ---- assemble ---------------------------------------------------------
const work = fs.mkdtempSync(path.join(os.tmpdir(), "geomlib-reports-"));
let pushed = false;
try {
    log("assembling in " + work);
    git(["init", "--quiet", "-b", REPORTS_BRANCH], work);
    git(["remote", "add", "origin", REPORTS_REMOTE], work);

    // coverage/ — skip tmp/, which is raw c8 V8 JSON, not part of the report.
    const covFiles = copyTree(coverageDir, path.join(work, "coverage"), new Set(["tmp"]));
    log("coverage: " + covFiles + " files");

    let snapFiles = 0;
    if (!noSnapshots) {
        const outSnap = path.join(work, "snapshots");
        // The PNG tree, preserving <category>/<file>/slateN/ — report.html
        // references those paths relative to itself.
        snapFiles += copyTree(snapshotDir, outSnap, new Set([".git"]));
        // The bundle, beside report.html, so the directory is self-contained.
        fs.copyFileSync(bundle, path.join(outSnap, "bundle.js"));
        snapFiles++;
        // The report's <script src> must match where we just put it. It is
        // baked in at generate time, so rewrite rather than regenerate.
        const target = path.join(outSnap, "report.html");
        const html = fs.readFileSync(target, "utf-8");
        const fixed = html.replace(/(<script src=")[^"]*bundle\.js(")/, "$1bundle.js$2");
        if (fixed === html && html.indexOf('src="bundle.js"') === -1) {
            log("WARNING: could not rewrite the report's bundle path — "
              + "the live-slate modal may not work.");
        }
        fs.writeFileSync(target, fixed);
        log("snapshots: " + snapFiles + " files");
    }

    fs.writeFileSync(path.join(work, "index.html"), landingPage(version, !noSnapshots));
    fs.writeFileSync(path.join(work, ".nojekyll"), "");   // serve _-prefixed paths verbatim

    git(["add", "-A"], work);
    git(["-c", "user.name=geomlib", "-c", "user.email=noreply@example.com",
         "commit", "--quiet", "-m", "reports for geomlib " + version], work);
    log("pushing to " + REPORTS_REMOTE + " (" + REPORTS_BRANCH + ")");
    git(["push", "--force", "origin", REPORTS_BRANCH], work);
    pushed = true;
} catch (err) {
    const detail = (err.stderr && err.stderr.toString().trim()) || String(err);
    bail("push failed: " + detail);
} finally {
    try { fs.rmSync(work, { recursive: true, force: true }); } catch (_) {}
}

if (pushed) {
    log("published geomlib " + version + " reports.");
    log("  https://brownnrl.github.io/geomlib-reports/coverage/");
    if (!noSnapshots) log("  https://brownnrl.github.io/geomlib-reports/snapshots/report.html");
}

function landingPage(version, withSnapshots) {
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>geomlib reports</title>
<style>
 body{font-family:sans-serif;max-width:44rem;margin:3rem auto;padding:0 1rem;color:#222;line-height:1.5}
 h1{margin-bottom:.2rem} .v{color:#666;font-size:.9rem}
 li{margin:.6rem 0} code{background:#f3f3f3;padding:0 3px;border-radius:3px}
</style></head><body>
<h1>geomlib reports</h1>
<p class="v">Generated from <a href="https://github.com/brownnrl/euclid">brownnrl/euclid</a>
at version <b>${version}</b>. Republished on each <code>npm publish</code>.</p>
<ul>
<li><a href="coverage/"><b>Code coverage</b></a> — <code>c8</code> output for the TypeScript source.</li>
${withSnapshots ? '<li><a href="snapshots/report.html"><b>Snapshot regression report</b></a> — every construction scene the library renders, with drag interactions. Click a thumbnail for a live, draggable slate.</li>' : ""}
</ul>
</body></html>
`;
}
