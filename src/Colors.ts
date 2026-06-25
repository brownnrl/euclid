/*----------------------------------------------------------------------+
|    Color parsing and manipulation.                                    |
|    Matches the behavior of Java's Geometry.parseColor() exactly:      |
|      1. null / "none" / "0" / numeric 0  → null (transparent)         |
|      2. "random"                         → random pastel              |
|      3. "background"                     → bgcolor                    |
|      4. "brighter"                       → brighter(bgcolor)          |
|      5. "darker"                         → darker(bgcolor)            |
|      6. Named color (CSS set, case-insensitive; 5 Java exceptions)    |
|      7. Hex integer "rrggbb"             → rgb string                 |
|      8. HSB comma triple "h,s,b"         → rgb string                 |
|      9. Fallback                         → null                       |
+----------------------------------------------------------------------*/

// The original 13 Java AWT named colors, with their exact (camelCase)
// spellings. Kept as the back-compat fast path: existing fixtures/decks use
// these exact names, so every current render resolves here, byte-identically.
// Five of these DELIBERATELY differ from W3C/CSS and keep the Java values —
// green, orange, pink, darkGray, lightGray (#125). cssColors below also pins
// those five (under their lowercase keys) so case-insensitive lookups agree.
export const colors : {[colorName: string]: string} =
{
    "black": "rgb(0,0,0)",
    "blue": "rgb(0,0,255)",
    "cyan": "rgb(0,255,255)",
    "darkGray": "rgb(64,64,64)",
    "gray": "rgb(128,128,128)",
    "green": "rgb(0,255,0)",
    "lightGray": "rgb(192,192,192)",
    "magenta": "rgb(255,0,255)",
    "orange": "rgb(255,200,0)",
    "pink": "rgb(255,175,175)",
    "red": "rgb(255,0,0)",
    "white": "rgb(255,255,255)",
    "yellow": "rgb(255,255,0)"
};

// The full W3C/CSS named-color set (CSS Color Module Level 4), lowercase keys,
// looked up case-insensitively (#125). Static literal — NO runtime dependency.
// FIVE entries deviate from the CSS value to preserve geomlib/Java AWT history
// (marked GEOMLIB below); `grey`-spelling aliases are included. New names take
// their standard CSS rgb. Authors can now write crimson/teal/gold/navy/etc.
// instead of falling through to silent-null.
export const cssColors : {[colorName: string]: string} =
{
    "aliceblue": "rgb(240,248,255)", "antiquewhite": "rgb(250,235,215)",
    "aqua": "rgb(0,255,255)", "aquamarine": "rgb(127,255,212)",
    "azure": "rgb(240,255,255)", "beige": "rgb(245,245,220)",
    "bisque": "rgb(255,228,196)", "black": "rgb(0,0,0)",
    "blanchedalmond": "rgb(255,235,205)", "blue": "rgb(0,0,255)",
    "blueviolet": "rgb(138,43,226)", "brown": "rgb(165,42,42)",
    "burlywood": "rgb(222,184,135)", "cadetblue": "rgb(95,158,160)",
    "chartreuse": "rgb(127,255,0)", "chocolate": "rgb(210,105,30)",
    "coral": "rgb(255,127,80)", "cornflowerblue": "rgb(100,149,237)",
    "cornsilk": "rgb(255,248,220)", "crimson": "rgb(220,20,60)",
    "cyan": "rgb(0,255,255)", "darkblue": "rgb(0,0,139)",
    "darkcyan": "rgb(0,139,139)", "darkgoldenrod": "rgb(184,134,11)",
    "darkgray": "rgb(64,64,64)", "darkgrey": "rgb(64,64,64)",          // GEOMLIB (CSS: 169,169,169)
    "darkgreen": "rgb(0,100,0)", "darkkhaki": "rgb(189,183,107)",
    "darkmagenta": "rgb(139,0,139)", "darkolivegreen": "rgb(85,107,47)",
    "darkorange": "rgb(255,140,0)", "darkorchid": "rgb(153,50,204)",
    "darkred": "rgb(139,0,0)", "darksalmon": "rgb(233,150,122)",
    "darkseagreen": "rgb(143,188,143)", "darkslateblue": "rgb(72,61,139)",
    "darkslategray": "rgb(47,79,79)", "darkslategrey": "rgb(47,79,79)",
    "darkturquoise": "rgb(0,206,209)", "darkviolet": "rgb(148,0,211)",
    "deeppink": "rgb(255,20,147)", "deepskyblue": "rgb(0,191,255)",
    "dimgray": "rgb(105,105,105)", "dimgrey": "rgb(105,105,105)",
    "dodgerblue": "rgb(30,144,255)", "firebrick": "rgb(178,34,34)",
    "floralwhite": "rgb(255,250,240)", "forestgreen": "rgb(34,139,34)",
    "fuchsia": "rgb(255,0,255)", "gainsboro": "rgb(220,220,220)",
    "ghostwhite": "rgb(248,248,255)", "gold": "rgb(255,215,0)",
    "goldenrod": "rgb(218,165,32)", "gray": "rgb(128,128,128)",
    "grey": "rgb(128,128,128)", "green": "rgb(0,255,0)",              // GEOMLIB (CSS: 0,128,0)
    "greenyellow": "rgb(173,255,47)", "honeydew": "rgb(240,255,240)",
    "hotpink": "rgb(255,105,180)", "indianred": "rgb(205,92,92)",
    "indigo": "rgb(75,0,130)", "ivory": "rgb(255,255,240)",
    "khaki": "rgb(240,230,140)", "lavender": "rgb(230,230,250)",
    "lavenderblush": "rgb(255,240,245)", "lawngreen": "rgb(124,252,0)",
    "lemonchiffon": "rgb(255,250,205)", "lightblue": "rgb(173,216,230)",
    "lightcoral": "rgb(240,128,128)", "lightcyan": "rgb(224,255,255)",
    "lightgoldenrodyellow": "rgb(250,250,210)",
    "lightgray": "rgb(192,192,192)", "lightgrey": "rgb(192,192,192)",  // GEOMLIB (CSS: 211,211,211)
    "lightgreen": "rgb(144,238,144)", "lightpink": "rgb(255,182,193)",
    "lightsalmon": "rgb(255,160,122)", "lightseagreen": "rgb(32,178,170)",
    "lightskyblue": "rgb(135,206,250)", "lightslategray": "rgb(119,136,153)",
    "lightslategrey": "rgb(119,136,153)", "lightsteelblue": "rgb(176,196,222)",
    "lightyellow": "rgb(255,255,224)", "lime": "rgb(0,255,0)",
    "limegreen": "rgb(50,205,50)", "linen": "rgb(250,240,230)",
    "magenta": "rgb(255,0,255)", "maroon": "rgb(128,0,0)",
    "mediumaquamarine": "rgb(102,205,170)", "mediumblue": "rgb(0,0,205)",
    "mediumorchid": "rgb(186,85,211)", "mediumpurple": "rgb(147,112,219)",
    "mediumseagreen": "rgb(60,179,113)", "mediumslateblue": "rgb(123,104,238)",
    "mediumspringgreen": "rgb(0,250,154)", "mediumturquoise": "rgb(72,209,204)",
    "mediumvioletred": "rgb(199,21,133)", "midnightblue": "rgb(25,25,112)",
    "mintcream": "rgb(245,255,250)", "mistyrose": "rgb(255,228,225)",
    "moccasin": "rgb(255,228,181)", "navajowhite": "rgb(255,222,173)",
    "navy": "rgb(0,0,128)", "oldlace": "rgb(253,245,230)",
    "olive": "rgb(128,128,0)", "olivedrab": "rgb(107,142,35)",
    "orange": "rgb(255,200,0)",                                       // GEOMLIB (CSS: 255,165,0)
    "orangered": "rgb(255,69,0)", "orchid": "rgb(218,112,214)",
    "palegoldenrod": "rgb(238,232,170)", "palegreen": "rgb(152,251,152)",
    "paleturquoise": "rgb(175,238,238)", "palevioletred": "rgb(219,112,147)",
    "papayawhip": "rgb(255,239,213)", "peachpuff": "rgb(255,218,185)",
    "peru": "rgb(205,133,63)", "pink": "rgb(255,175,175)",            // GEOMLIB (CSS: 255,192,203)
    "plum": "rgb(221,160,221)", "powderblue": "rgb(176,224,230)",
    "purple": "rgb(128,0,128)", "rebeccapurple": "rgb(102,51,153)",
    "red": "rgb(255,0,0)", "rosybrown": "rgb(188,143,143)",
    "royalblue": "rgb(65,105,225)", "saddlebrown": "rgb(139,69,19)",
    "salmon": "rgb(250,128,114)", "sandybrown": "rgb(244,164,96)",
    "seagreen": "rgb(46,139,87)", "seashell": "rgb(255,245,238)",
    "sienna": "rgb(160,82,45)", "silver": "rgb(192,192,192)",
    "skyblue": "rgb(135,206,235)", "slateblue": "rgb(106,90,205)",
    "slategray": "rgb(112,128,144)", "slategrey": "rgb(112,128,144)",
    "snow": "rgb(255,250,250)", "springgreen": "rgb(0,255,127)",
    "steelblue": "rgb(70,130,180)", "tan": "rgb(210,180,140)",
    "teal": "rgb(0,128,128)", "thistle": "rgb(216,191,216)",
    "tomato": "rgb(255,99,71)", "turquoise": "rgb(64,224,208)",
    "violet": "rgb(238,130,238)", "wheat": "rgb(245,222,179)",
    "white": "rgb(255,255,255)", "whitesmoke": "rgb(245,245,245)",
    "yellow": "rgb(255,255,0)", "yellowgreen": "rgb(154,205,50)"
};

// Default color cycle for angle markers (#91). Each entry pairs a
// solid edge color with a translucent face twin so concurrent markers
// read as distinct, readable wedges. Hues are spread and deliberately
// avoid gold (#FFD700, the highlight color) so an emphasized marker
// still contrasts against its own fill. init() assigns these in
// construction order; authors can override per element.
export const anglePalette : {edge: string, face: string}[] =
[
    { edge: "rgb(59,110,165)",  face: "rgba(59,110,165,0.30)"  },  // blue
    { edge: "rgb(63,142,79)",   face: "rgba(63,142,79,0.30)"   },  // green
    { edge: "rgb(122,79,163)",  face: "rgba(122,79,163,0.30)"  },  // purple
    { edge: "rgb(194,90,60)",   face: "rgba(194,90,60,0.30)"   },  // orange-red
    { edge: "rgb(46,139,139)",  face: "rgba(46,139,139,0.30)"  },  // teal
    { edge: "rgb(163,60,122)",  face: "rgba(163,60,122,0.30)"  }   // magenta
];

export function parseColor(val: string | number, dfault: string, bgcolor: string) : string {
    // Handle numeric 0 (from IConstructionInfo where vertexColor: 0)
    if (val === 0) return null;
    // Handle null/undefined → use default
    if (val == null) return dfault;

    let str = String(val);
    // Transparent keywords
    if (str === "none" || str === "0" || str === "") return null;
    // Special keywords
    if (str === "random") return randomColor();
    if (str === "background") return bgcolor;
    if (str === "brighter") return brighter(bgcolor);
    if (str === "darker") return darker(bgcolor);
    // Named color lookup — exact (the 13 back-compat camelCase spellings)
    // first, then the full CSS set case-insensitively (#125).
    if (str in colors) return colors[str];
    let lower = str.toLowerCase();
    if (lower in cssColors) return cssColors[lower];
    // Hex color (e.g. "ff0000" or "#ffe9cd" → rgb(...))
    // Java does: new Color(Integer.parseInt(str, 16))
    // Also handle CSS #-prefixed hex which Java doesn't use but our
    // test pages do (e.g. background: '#ffe9cd')
    let hex = str.replace(/^#/, "");
    if (/^[0-9a-fA-F]+$/.test(hex)) {
        let n = parseInt(hex, 16);
        if (!isNaN(n)) {
            let r = (n >> 16) & 0xFF;
            let g = (n >> 8) & 0xFF;
            let b = n & 0xFF;
            return `rgb(${r},${g},${b})`;
        }
    }
    // HSB comma triple (e.g. "35,19,100" → h=35/360, s=19/100, b=100/100)
    let parts = str.split(",");
    if (parts.length === 3) {
        let h = parseInt(parts[0]) / 360.0;
        let s = parseInt(parts[1]) / 100.0;
        let b = parseInt(parts[2]) / 100.0;
        if (!isNaN(h) && !isNaN(s) && !isNaN(b)) {
            let c = HSVtoRGB(h, s, b);
            return `rgb(${c.r},${c.g},${c.b})`;
        }
    }
    // Fallback — unrecognized
    return null;
}

export function randomColor() : string {
    let c = HSVtoRGB(Math.random(), Math.random(), 1.0);
    return `rgb(${c.r},${c.g},${c.b})`;
}

// Java Color.brighter() — factor 0.7
// Each component: if 0 → 3; elif < 3 → 3; else min(component/0.7, 255)
export function brighter(col: string) : string {
    let rgb = parseRGB(col);
    if (rgb == null) return col;
    let FACTOR = 0.7;
    let threshold = Math.ceil(1.0 / (1.0 - FACTOR)); // = 4
    let r = rgb.r === 0 ? threshold : Math.min(Math.floor(rgb.r / FACTOR), 255);
    let g = rgb.g === 0 ? threshold : Math.min(Math.floor(rgb.g / FACTOR), 255);
    let b = rgb.b === 0 ? threshold : Math.min(Math.floor(rgb.b / FACTOR), 255);
    if (r < threshold) r = threshold;
    if (g < threshold) g = threshold;
    if (b < threshold) b = threshold;
    return `rgb(${r},${g},${b})`;
}

// Java Color.darker() — factor 0.7
// Each component: floor(component * 0.7)
export function darker(col: string) : string {
    let rgb = parseRGB(col);
    if (rgb == null) return col;
    let FACTOR = 0.7;
    let r = Math.floor(rgb.r * FACTOR);
    let g = Math.floor(rgb.g * FACTOR);
    let b = Math.floor(rgb.b * FACTOR);
    return `rgb(${r},${g},${b})`;
}

// Keep old names as aliases for backward compatibility with index.ts
export function lighten(col: string) : string {
    return brighter(col);
}

export function darken(col: string) : string {
    return darker(col);
}

// Parse an rgb(...) string or hex color into {r, g, b} components.
// Handles: "rgb(r,g,b)", "#rrggbb", "rrggbb", named colors, HSB triples
function parseRGB(col: string) : {r: number, g: number, b: number} | null {
    if (col == null) return null;
    // rgb(r,g,b) format
    let m = col.match(/^rgb\((\d+),(\d+),(\d+)\)$/);
    if (m) return {r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3])};
    // Named color → resolve to rgb then re-parse
    if (col in colors) return parseRGB(colors[col]);
    // #rrggbb or rrggbb hex
    let hex = col.replace(/^#/, "");
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
        let n = parseInt(hex, 16);
        return {r: (n >> 16) & 0xFF, g: (n >> 8) & 0xFF, b: n & 0xFF};
    }
    // HSB comma triple — parse it to get RGB
    let parts = col.split(",");
    if (parts.length === 3) {
        let h = parseInt(parts[0]) / 360.0;
        let s = parseInt(parts[1]) / 100.0;
        let b = parseInt(parts[2]) / 100.0;
        if (!isNaN(h) && !isNaN(s) && !isNaN(b)) {
            return HSVtoRGB(h, s, b);
        }
    }
    return null;
}

// see https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
function HSVtoRGB(h: number, s: number, v: number) : {r: number, g: number, b: number} {
    let r: number, g: number, b: number;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}
