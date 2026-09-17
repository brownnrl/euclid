// Sizing the canvas BITMAP for HiDPI displays (#71, #173).
//
// The bitmap (canvas.width/height) is set to the CSS display size × dpr so
// the figure renders on native device pixels. Coordinates stay in CSS px;
// Slate.drawElements scales the context by dpr.
//
// #173 — that is only correct when the CSS box is pinned INDEPENDENTLY of
// the bitmap. A canvas with no CSS width/height takes its layout size from
// its width/height ATTRIBUTES, which are the bitmap. So assigning the
// bitmap resizes the very box it was computed from: at dpr 1.5 a 340-wide
// canvas becomes 510 wide, and now bitmap == client rather than
// client × dpr. The figure paints 1.5× too large and every pick lands
// 1.5× off — silently, since it is just arithmetic. Each window resize
// compounds it (510 → 765 → 1147 …) until the container's max-width caps
// the box, which is why "resize the window" or "maximize" appeared to fix
// it. Invisible at dpr 1, where bitmap == client × 1 is already true.
//
// The site emits every figure attribute-sized, so this hit every HiDPI
// desktop visitor.

export interface IBitmapSync {
    displayWidth: number;      // CSS px the bitmap was sized from
    displayHeight: number;
    pinned: boolean;           // true when the CSS box had followed the
                               // attribute and had to be pinned
}

/**
 * Set the bitmap to displaySize × dpr without letting that assignment
 * move the display size.
 *
 * Detect-and-correct rather than always pinning: a canvas that CSS sizes
 * responsively keeps responding, because its box does not move when the
 * attribute changes and so is left alone. Only a box that DID follow the
 * attribute gets pinned, to exactly the size just measured.
 */
export function syncBitmapToDisplaySize(canvas: HTMLCanvasElement, dpr: number) : IBitmapSync {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const width = Math.round(cw * dpr), height = Math.round(ch * dpr);
    let pinned = false;

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        // Reading clientWidth forces layout, so this sees the new box.
        if (canvas.clientWidth !== cw || canvas.clientHeight !== ch) {
            canvas.style.width = cw + "px";
            canvas.style.height = ch + "px";
            pinned = true;
        }
    }
    return { displayWidth: cw, displayHeight: ch, pinned };
}

/** window.devicePixelRatio, or 1 headless. */
export function currentDpr() : number {
    return (typeof window !== "undefined" && window.devicePixelRatio) || 1;
}
