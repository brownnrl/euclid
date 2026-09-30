#!/usr/bin/env node
// Refuse to publish from anywhere but an up-to-date, clean `main`.
//
// 0.17.0 was published from its release branch before that branch merged,
// and a fix (#193) that had reached `main` in the meantime was left out of
// the tarball. The tag then had to be re-pointed to match what shipped.
// Publishing from `main` after the release PR merges is the only order in
// which the tarball, the tag and `main` are guaranteed to agree; this makes
// `npm publish` enforce it.
//
// Runs first in prepublishOnly. `npm publish --dry-run` runs it too (it is
// read-only). Override for a genuine emergency with
//   GEOMLIB_PUBLISH_FROM_BRANCH=1 npm publish
// and say why in the release notes.

const { execSync } = require("child_process");

function git(args) {
    return execSync("git " + args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function fail(msg) {
    console.error("\npublish guard: " + msg + "\n");
    process.exit(1);
}

if (process.env.GEOMLIB_PUBLISH_FROM_BRANCH === "1") {
    console.warn("publish guard: overridden by GEOMLIB_PUBLISH_FROM_BRANCH=1");
    process.exit(0);
}

let branch;
try { branch = git("rev-parse --abbrev-ref HEAD"); } catch (e) { fail("not a git checkout"); }
if (branch !== "main") {
    fail("on branch '" + branch + "', not 'main'.\n" +
         "  Merge the release PR first, then publish from main, so the tarball\n" +
         "  cannot drift from what main carries.");
}

const dirty = git("status --porcelain");
if (dirty) {
    fail("working tree is not clean:\n" + dirty.split("\n").map((l) => "  " + l).join("\n") +
         "\n  Commit or stash before publishing; the tarball is built from the tree.");
}

try { git("fetch --quiet origin main"); } catch (e) { fail("could not fetch origin/main: " + e.message); }
const head = git("rev-parse HEAD"), remote = git("rev-parse origin/main");
if (head !== remote) {
    const ahead = git("rev-list --count origin/main..HEAD");
    const behind = git("rev-list --count HEAD..origin/main");
    fail("main is not in sync with origin/main (" + ahead + " ahead, " + behind + " behind).\n" +
         "  git pull --ff-only, or push, so the published tree is the one on GitHub.");
}

const version = require(require("path").resolve(process.cwd(), "package.json")).version;
try {
    const tagged = git("tag -l v" + version);
    if (tagged) fail("tag v" + version + " already exists; bump the version before publishing again.");
} catch (e) { /* no tags is fine */ }

console.log("publish guard: on main at " + head.slice(0, 7) + ", clean, in sync with origin, v" + version + " untagged.");
