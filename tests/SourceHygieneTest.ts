// #141 — a raw control byte in a source file makes tooling treat it as
// binary: `grep` returns nothing for that file (silently, not as an error),
// and `git diff` reports "Bin <n> -> <m> bytes" instead of a reviewable
// diff. A NUL used as a sentinel value in src/Slate.ts cost exactly that,
// hiding the largest file in the library from a whole-tree search.
//
// Sentinels are fine — write them as escape sequences so the source stays
// plain text.

import "mocha";
import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";

const SRC = path.join(__dirname, "..", "src");

function tsFiles(dir: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...tsFiles(p));
        else if (entry.name.endsWith(".ts")) out.push(p);
    }
    return out;
}

describe("source hygiene (#141)", () => {
    it("no source file contains a raw control byte", () => {
        const offenders: string[] = [];
        for (const file of tsFiles(SRC)) {
            const buf = fs.readFileSync(file);
            for (let i = 0; i < buf.length; i++) {
                const b = buf[i];
                // Allow tab (9), LF (10), CR (13); reject the rest of C0.
                const isControl = b < 9 || b === 11 || b === 12 || (b >= 14 && b <= 31);
                if (isControl) {
                    const line = buf.slice(0, i).toString("utf8").split("\n").length;
                    offenders.push(`${path.relative(SRC, file)}:${line} (byte 0x${b.toString(16)})`);
                    break;
                }
            }
        }
        assert.deepEqual(offenders, [],
            "write control characters as escape sequences — a raw one makes the file " +
            "look binary to grep and git diff");
    });
});
