#!/usr/bin/env node
// #142 — fail the publish if the bundle carries raw non-ASCII bytes.
//
// A <script src> with no charset of its own is decoded using the INCLUDING
// document's encoding. A consumer page that omits <meta charset> therefore
// renders any literal UTF-8 in our bundle as mojibake — geomlib's own
// presentation controls ("< Prev", "Next >", "X Exit") turn to gibberish
// because of the host page's markup, which we cannot fix from their side.
//
// webpack.config.js sets terser's `ascii_only` so those characters are
// emitted as escape sequences instead. This checks the actual artifact,
// because the obvious-looking fix does NOT work: escaping the characters in
// the TypeScript source is undone by tsc (which decodes the escape) and by
// the minifier (which re-normalises string escapes to the shortest form).
// Only the emit step decides, so only the emitted file is worth testing.

const fs = require("fs");
const path = require("path");

const bundle = path.join(__dirname, "..", "dist", "bundle.js");

if (!fs.existsSync(bundle)) {
    console.error(`check-bundle-ascii: ${bundle} not found — run \`npm run bundle:prod\` first.`);
    process.exit(1);
}

const buf = fs.readFileSync(bundle);
const offenders = [];
for (let i = 0; i < buf.length && offenders.length < 5; i++) {
    if (buf[i] > 127) {
        const line = buf.slice(0, i).toString("utf8").split("\n").length;
        const context = buf.slice(Math.max(0, i - 40), i + 40).toString("utf8");
        offenders.push(`  byte 0x${buf[i].toString(16)} at line ${line}: …${context}…`);
    }
}

if (offenders.length > 0) {
    console.error("check-bundle-ascii: bundle contains raw non-ASCII bytes.");
    console.error("Consumer pages without <meta charset> will render these as mojibake.");
    console.error("Check that `ascii_only` is still set on the minifier in webpack.config.js.\n");
    console.error(offenders.join("\n"));
    process.exit(1);
}

console.log(`check-bundle-ascii: OK — ${buf.length} bytes, all ASCII.`);
