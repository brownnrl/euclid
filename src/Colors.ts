/*----------------------------------------------------------------------+
|    Color parsing and manipulation.                                    |
|    Matches the behavior of Java's Geometry.parseColor() exactly:      |
|      1. null / "none" / "0" / numeric 0  → null (transparent)         |
|      2. "random"                         → random pastel              |
|      3. "background"                     → bgcolor                    |
|      4. "brighter"                       → brighter(bgcolor)          |
|      5. "darker"                         → darker(bgcolor)            |
|      6. Named color (13 names)           → rgb string                 |
|      7. Hex integer "rrggbb"             → rgb string                 |
|      8. HSB comma triple "h,s,b"         → rgb string                 |
|      9. Fallback                         → null                       |
+----------------------------------------------------------------------*/

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
    // Named color lookup
    if (str in colors) return colors[str];
    // Hex integer (e.g. "ff0000" → rgb(255,0,0))
    // Java does: new Color(Integer.parseInt(str, 16))
    if (/^[0-9a-fA-F]+$/.test(str)) {
        let n = parseInt(str, 16);
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
