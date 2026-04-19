import "mocha";
import * as assert from "assert";
import {parseColor, brighter, darker, darken} from "../src/Colors";

describe("parseColor", () => {

    let bgcolor = "rgb(255,233,205)"; // #ffe9cd — the standard proposition background

    // 1. Transparent inputs → null
    it("should return null for null input (uses default)", () => {
        assert.equal(parseColor(null, "black", bgcolor), "black");
    });
    it("should return null for 'none'", () => {
        assert.equal(parseColor("none", "black", bgcolor), null);
    });
    it("should return null for string '0'", () => {
        assert.equal(parseColor("0", "black", bgcolor), null);
    });
    it("should return null for numeric 0", () => {
        assert.equal(parseColor(0, "black", bgcolor), null);
    });
    it("should return null for empty string", () => {
        assert.equal(parseColor("", "black", bgcolor), null);
    });

    // 2. Special keywords
    it("should return a random color for 'random'", () => {
        let c = parseColor("random", "black", bgcolor);
        assert.ok(c.startsWith("rgb("));
    });
    it("should return bgcolor for 'background'", () => {
        assert.equal(parseColor("background", "black", bgcolor), bgcolor);
    });
    it("should return a brighter color for 'brighter'", () => {
        let c = parseColor("brighter", "black", bgcolor);
        assert.ok(c.startsWith("rgb("));
        assert.notEqual(c, bgcolor);
    });
    it("should return a darker color for 'darker'", () => {
        let c = parseColor("darker", "black", bgcolor);
        assert.ok(c.startsWith("rgb("));
        assert.notEqual(c, bgcolor);
    });

    // 3. Named colors (all 13)
    it("should resolve all 13 named colors", () => {
        assert.equal(parseColor("black", null, bgcolor), "rgb(0,0,0)");
        assert.equal(parseColor("blue", null, bgcolor), "rgb(0,0,255)");
        assert.equal(parseColor("cyan", null, bgcolor), "rgb(0,255,255)");
        assert.equal(parseColor("darkGray", null, bgcolor), "rgb(64,64,64)");
        assert.equal(parseColor("gray", null, bgcolor), "rgb(128,128,128)");
        assert.equal(parseColor("green", null, bgcolor), "rgb(0,255,0)");
        assert.equal(parseColor("lightGray", null, bgcolor), "rgb(192,192,192)");
        assert.equal(parseColor("magenta", null, bgcolor), "rgb(255,0,255)");
        assert.equal(parseColor("orange", null, bgcolor), "rgb(255,200,0)");
        assert.equal(parseColor("pink", null, bgcolor), "rgb(255,175,175)");
        assert.equal(parseColor("red", null, bgcolor), "rgb(255,0,0)");
        assert.equal(parseColor("white", null, bgcolor), "rgb(255,255,255)");
        assert.equal(parseColor("yellow", null, bgcolor), "rgb(255,255,0)");
    });

    // 4. Hex color parsing
    it("should parse 6-digit hex 'ff0000' as red", () => {
        assert.equal(parseColor("ff0000", null, bgcolor), "rgb(255,0,0)");
    });
    it("should parse hex '0000ff' as blue", () => {
        assert.equal(parseColor("0000ff", null, bgcolor), "rgb(0,0,255)");
    });
    it("should parse hex 'ffffff' as white", () => {
        assert.equal(parseColor("ffffff", null, bgcolor), "rgb(255,255,255)");
    });

    // 5. HSB comma triple parsing
    it("should parse '35,19,100' (standard background) as warm peach", () => {
        // h=35/360, s=19/100, b=100/100
        let c = parseColor("35,19,100", null, bgcolor);
        assert.ok(c.startsWith("rgb("));
        // Should be approximately rgb(255,233,205) — the peach background
        let m = c.match(/rgb\((\d+),(\d+),(\d+)\)/);
        let r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
        // Java produces Color(255,233,206) for HSB(35/360, 19/100, 100/100)
        assert.ok(r >= 250 && r <= 255, `red ${r} should be ~255`);
        assert.ok(g >= 228 && g <= 238, `green ${g} should be ~233`);
        assert.ok(b >= 200 && b <= 210, `blue ${b} should be ~206`);
    });
    it("should parse '0,0,0' as black", () => {
        assert.equal(parseColor("0,0,0", null, bgcolor), "rgb(0,0,0)");
    });
    it("should parse '0,0,100' as white (full brightness, no saturation)", () => {
        let c = parseColor("0,0,100", null, bgcolor);
        assert.equal(c, "rgb(255,255,255)");
    });
    it("should parse '270,70,100' as a purple", () => {
        let c = parseColor("270,70,100", null, bgcolor);
        let m = c.match(/rgb\((\d+),(\d+),(\d+)\)/);
        let r = parseInt(m[1]), b = parseInt(m[3]);
        // Hue 270 = purple region, high saturation
        assert.ok(b > r, `blue ${b} should exceed red ${r} for purple`);
    });

    // 6. Unrecognized → null
    it("should return null for unrecognized input", () => {
        assert.equal(parseColor("notacolor", null, bgcolor), null);
    });
});

describe("brighter / darker", () => {

    it("brighter should increase RGB components", () => {
        let c = brighter("rgb(100,100,100)");
        let m = c.match(/rgb\((\d+),(\d+),(\d+)\)/);
        let r = parseInt(m[1]);
        assert.ok(r > 100, `brighter(100) = ${r} should be > 100`);
        // Java: floor(100 / 0.7) = 142
        assert.equal(r, 142);
    });

    it("brighter should handle black (all zeros)", () => {
        let c = brighter("rgb(0,0,0)");
        // Java: ceil(1.0 / (1.0 - 0.7)) = ceil(3.333) = 4
        assert.equal(c, "rgb(4,4,4)");
    });

    it("brighter should cap at 255", () => {
        let c = brighter("rgb(200,200,200)");
        let m = c.match(/rgb\((\d+),(\d+),(\d+)\)/);
        let r = parseInt(m[1]);
        assert.ok(r <= 255, `brighter(200) = ${r} should be <= 255`);
    });

    it("darker should reduce RGB components by factor 0.7", () => {
        let c = darker("rgb(100,100,100)");
        // Java: floor(100 * 0.7) = 70
        assert.equal(c, "rgb(70,70,70)");
    });

    it("darker should handle black", () => {
        let c = darker("rgb(0,0,0)");
        assert.equal(c, "rgb(0,0,0)");
    });

    it("brighter should work with HSB triple input", () => {
        // "35,19,100" → rgb(~255,~233,~206) → brighter clamps near 255
        let c = brighter("35,19,100");
        assert.ok(c.startsWith("rgb("), `expected rgb string, got: ${c}`);
    });

    it("darker should work with named color input", () => {
        let c = darker("red");
        // red = rgb(255,0,0) → darker = rgb(178,0,0)
        assert.equal(c, "rgb(178,0,0)");
    });

    // Internal parseRGB gaps reached only via brighter/darker.

    it("darken() should delegate to darker() for a given color", () => {
        assert.equal(darken("rgb(200,100,50)"), darker("rgb(200,100,50)"));
    });

    it("brighter() should accept a 6-digit hex string via parseRGB", () => {
        // "ff8040" → rgb(255,128,64). brighter(...) recomputes per component
        // and produces a valid rgb() result.
        let out = brighter("ff8040");
        assert.ok(/^rgb\(\d+,\d+,\d+\)$/.test(out),
            `brighter('ff8040') should return an rgb() string, got '${out}'`);
    });

    it("brighter() should return the input unchanged when it's unparseable", () => {
        // parseRGB returns null → brighter returns col unchanged.
        assert.equal(brighter("not-a-color"), "not-a-color");
    });
});
