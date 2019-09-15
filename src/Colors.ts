

export const colors : {[colorName: string]: string} =
{
    "black": "rgb(0,0,0)",
    "blue": "rgb(0,0,255)",
    "cyan": "rgb(0,255,255)",
    "darkGray": "rgb(64,64,64)",
    "green": "rgb(0,255,0)",
    "lightGray": "rgb(192,192,192)",
    "magenta": "rgb(255,0,255)",
    "orange": "rgb(255,200,0)",
    "pink": "rgb(255,175,175)",
    "white": "rgb(255,255,255)",
    "yellow": "rgb(255,255,0)"
};

export function parseColor(val: string, dfault: string, bgcolor: string) : string {
    if (val == "random") {
        return randomColor();
    } else if (val == "darker") {
        return darken(bgcolor);
    } else if (val == "brighter") {
        return lighten(bgcolor);
    } else if (val == "background") {
        return bgcolor;
    } else if (val in colors) {
        return colors[val];
    } else if (val == null) {
        return dfault;
    } else {
        return val;
    }
}

export function randomColor() : string {
    let c = HSVtoRGB(Math.random(), Math.random(), 1.0);
    return `rgb(${c.r},${c.g},${c.b})`;
}

export function lighten(col: string) {
    return LightenDarkenColor(col);
}

export function darken(col: string) {
    return LightenDarkenColor(col, false);
}

function LightenDarkenColor(col: string, lighten: boolean = true) {
    let usePound = false;

    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }

    let num = parseInt(col,16);

    let r = (num >> 16);
    let b = ((num >> 8) & 0x00FF);
    let g = (num & 0x0000FF);

    let amt = Math.max(r,g,b);
    if (lighten) {
        let validAmts = [255-r, 255-g, 255-b].filter(x => x != 0);
        amt = Math.max(...validAmts);
        amt = Math.round(Math.random() * amt);
    } else {
        amt = -Math.round(Math.random() * amt);
    }

    r += amt;
    g += amt;
    b += amt;

    if (r > 255) r = 255;
    else if  (r < 0) r = 0;

    if (b > 255) b = 255;
    else if  (b < 0) b = 0;

    if (g > 255) g = 255;
    else if (g < 0) g = 0;

    return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
}

// see https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
/* accepts parameters
 * h  Object = {h:x, s:y, v:z}
 * OR
 * h, s, v
*/
function HSVtoRGB(h: number, s: number, v: number) {
    let r, g, b, i, f, p, q, t;

    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
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


// see https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex: string) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r: number, g: number, b: number) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
