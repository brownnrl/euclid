/*----------------------------------------------------------------------+
|    Title:  SlateControls.ts                                           |
|    UI overlay for geometry diagrams: reset, maximize, new window.     |
|    Buttons are canvas-drawn icons overlaid on each Slate canvas.      |
|    Keyboard shortcuts match the original Java applet:                 |
|      r / space  → reset                                               |
|      u / return → new window                                          |
|      m          → maximize/minimize                                   |
+----------------------------------------------------------------------*/

import {Slate} from "./Slate";

interface IInitConfig {
    background: string;
    title: string;
    align?: number;
    canvasid?: string;
    pivot?: string;
    elements: any[];
}

const BTN_SIZE = 20;
const BTN_GAP = 4;
const BTN_MARGIN = 8;

// Minimal event-target interface so this helper is testable without a real
// `Window`. Browser `Window`, `Document`, and `Element` all satisfy it.
export interface IResizeTarget {
    addEventListener(type: "resize", listener: () => void): void;
    removeEventListener(type: "resize", listener: () => void): void;
}

/**
 * Attach `callback` to the target's "resize" event. Returns a teardown
 * function that removes the listener — call it to stop tracking.
 */
export function trackWindowResize(target: IResizeTarget, callback: () => void): () => void {
    const handler = () => callback();
    target.addEventListener("resize", handler);
    return () => target.removeEventListener("resize", handler);
}

export function createControls(slate: Slate, canvas: HTMLCanvasElement, config: IInitConfig): void {
    // Skip in headless/test environments
    if (!canvas.parentElement) return;

    let controls = new SlateControls(slate, canvas, config);
    controls.init();
}

class SlateControls {
    private _slate: Slate;
    private _canvas: HTMLCanvasElement;
    private _config: IInitConfig;
    private _wrapper: HTMLDivElement;
    private _maximized: boolean = false;
    private _savedStyles: {
        wrapperPosition: string;
        wrapperTop: string;
        wrapperLeft: string;
        wrapperWidth: string;
        wrapperHeight: string;
        wrapperZIndex: string;
        wrapperBackground: string;
        canvasStyleWidth: string;
        canvasStyleHeight: string;
        canvasAttrWidth: number;
        canvasAttrHeight: number;
    } = null;
    private _stopTrackingResize: (() => void) | null = null;

    constructor(slate: Slate, canvas: HTMLCanvasElement, config: IInitConfig) {
        this._slate = slate;
        this._canvas = canvas;
        this._config = config;
    }

    init(): void {
        this._wrapper = this.createWrapper();
        this.createButtons();
        this.addKeyboardShortcuts();
    }

    private createWrapper(): HTMLDivElement {
        let wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.display = "inline-block";

        // Insert wrapper before canvas, then move canvas into it
        this._canvas.parentElement.insertBefore(wrapper, this._canvas);
        wrapper.appendChild(this._canvas);

        // Make canvas focusable for keyboard shortcuts
        this._canvas.setAttribute("tabindex", "0");
        this._canvas.style.outline = "none"; // default no outline
        this._canvas.addEventListener("focus", () => {
            this._canvas.style.outline = "2px solid rgba(66,133,244,0.5)";
        });
        this._canvas.addEventListener("blur", () => {
            this._canvas.style.outline = "none";
        });

        return wrapper;
    }

    private createButtons(): void {
        let buttons = [
            { draw: drawResetIcon, action: () => this.onReset(), title: "Reset (r)" },
            { draw: drawMaximizeIcon, action: () => this.onMaximize(), title: "Maximize (m)" },
            { draw: drawNewWindowIcon, action: () => this.onNewWindow(), title: "New Window (u)" },
        ];

        for (let i = 0; i < buttons.length; i++) {
            let btn = document.createElement("button");
            btn.style.position = "absolute";
            btn.style.top = BTN_MARGIN + "px";
            btn.style.right = (BTN_MARGIN + i * (BTN_SIZE + BTN_GAP)) + "px";
            btn.style.width = BTN_SIZE + "px";
            btn.style.height = BTN_SIZE + "px";
            btn.style.padding = "0";
            btn.style.border = "none";
            btn.style.cursor = "pointer";
            btn.style.background = "rgba(0,0,0,0.12)";
            btn.style.borderRadius = "3px";
            btn.title = buttons[i].title;

            btn.addEventListener("mouseenter", () => {
                btn.style.background = "rgba(0,0,0,0.3)";
            });
            btn.addEventListener("mouseleave", () => {
                btn.style.background = "rgba(0,0,0,0.12)";
            });

            // Draw icon on a small canvas inside the button
            let iconCanvas = document.createElement("canvas");
            iconCanvas.width = BTN_SIZE;
            iconCanvas.height = BTN_SIZE;
            iconCanvas.style.display = "block";
            let ctx = iconCanvas.getContext("2d");
            buttons[i].draw(ctx, BTN_SIZE);
            btn.appendChild(iconCanvas);

            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                buttons[i].action();
                // Return focus to the main canvas after button click
                this._canvas.focus();
            });

            // Store reference for maximize icon swap
            if (i === 1) {
                (this as any)._maxBtn = btn;
                (this as any)._maxIconCanvas = iconCanvas;
            }

            this._wrapper.appendChild(btn);
        }
    }

    private addKeyboardShortcuts(): void {
        this._canvas.addEventListener("keydown", (e: KeyboardEvent) => {
            switch (e.key) {
                case "r":
                case "R":
                case " ":
                    e.preventDefault();
                    this.onReset();
                    break;
                case "u":
                case "U":
                case "Enter":
                    e.preventDefault();
                    this.onNewWindow();
                    break;
                case "m":
                case "M":
                    e.preventDefault();
                    this.onMaximize();
                    break;
            }
        });
    }

    private onReset(): void {
        this._slate.reset();
    }

    private onMaximize(): void {
        if (this._maximized) {
            this.minimize();
        } else {
            this.maximize();
        }
    }

    private maximize(): void {
        // Save current styles AND canvas width/height attributes. The attrs
        // are the canvas bitmap resolution; resizeAndRedraw() overwrites them
        // to match the maximized CSS size, so minimize() must restore them.
        this._savedStyles = {
            wrapperPosition: this._wrapper.style.position,
            wrapperTop: this._wrapper.style.top,
            wrapperLeft: this._wrapper.style.left,
            wrapperWidth: this._wrapper.style.width,
            wrapperHeight: this._wrapper.style.height,
            wrapperZIndex: this._wrapper.style.zIndex,
            wrapperBackground: this._wrapper.style.background,
            canvasStyleWidth: this._canvas.style.width,
            canvasStyleHeight: this._canvas.style.height,
            canvasAttrWidth: this._canvas.width,
            canvasAttrHeight: this._canvas.height,
        };

        // Maximize wrapper to fill viewport
        this._wrapper.style.position = "fixed";
        this._wrapper.style.top = "0";
        this._wrapper.style.left = "0";
        this._wrapper.style.width = "100vw";
        this._wrapper.style.height = "100vh";
        this._wrapper.style.zIndex = "9999";
        this._wrapper.style.background = "white";

        // Expand canvas to fill wrapper
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";

        this.resizeAndRedraw();
        this._maximized = true;
        this.updateMaximizeIcon();

        // Track window resize so the canvas bitmap stays in sync with the
        // wrapper's 100vw × 100vh CSS size. Without this the bitmap stays
        // at its maximize-time dimensions while the CSS display follows
        // viewport changes, and the diagram visibly stretches/squishes.
        this._stopTrackingResize = trackWindowResize(window, () => this.resizeAndRedraw());
    }

    private minimize(): void {
        if (!this._savedStyles) return;

        // Stop tracking window resize before restoring saved layout.
        if (this._stopTrackingResize) {
            this._stopTrackingResize();
            this._stopTrackingResize = null;
        }

        // Restore saved styles
        this._wrapper.style.position = this._savedStyles.wrapperPosition;
        this._wrapper.style.top = this._savedStyles.wrapperTop;
        this._wrapper.style.left = this._savedStyles.wrapperLeft;
        this._wrapper.style.width = this._savedStyles.wrapperWidth;
        this._wrapper.style.height = this._savedStyles.wrapperHeight;
        this._wrapper.style.zIndex = this._savedStyles.wrapperZIndex;
        this._wrapper.style.background = this._savedStyles.wrapperBackground;

        this._canvas.style.width = this._savedStyles.canvasStyleWidth;
        this._canvas.style.height = this._savedStyles.canvasStyleHeight;

        // Restore the canvas bitmap resolution to match its pre-maximize
        // intrinsic size. Without this, the canvas keeps the enlarged
        // width/height attributes from the maximize pass and (when style
        // width/height are empty) falls back to those attrs for its CSS
        // size — leaving the diagram rendered full-width.
        this._canvas.width = this._savedStyles.canvasAttrWidth;
        this._canvas.height = this._savedStyles.canvasAttrHeight;

        this.resizeAndRedraw();
        this._maximized = false;
        this._savedStyles = null;
        this.updateMaximizeIcon();
    }

    private resizeAndRedraw(): void {
        // Sync canvas internal resolution to CSS size
        let w = this._canvas.clientWidth;
        let h = this._canvas.clientHeight;
        if (this._canvas.width !== w || this._canvas.height !== h) {
            this._canvas.width = w;
            this._canvas.height = h;
        }
        this._slate.update();
    }

    private updateMaximizeIcon(): void {
        let iconCanvas = (this as any)._maxIconCanvas as HTMLCanvasElement;
        let btn = (this as any)._maxBtn as HTMLButtonElement;
        if (!iconCanvas) return;
        let ctx = iconCanvas.getContext("2d");
        ctx.clearRect(0, 0, BTN_SIZE, BTN_SIZE);
        if (this._maximized) {
            drawMinimizeIcon(ctx, BTN_SIZE);
            btn.title = "Minimize (m)";
        } else {
            drawMaximizeIcon(ctx, BTN_SIZE);
            btn.title = "Maximize (m)";
        }
    }

    private onNewWindow(): void {
        // Find the bundle.js script path from the current page
        let scripts = document.querySelectorAll("script[src]");
        let bundleSrc = "bundle.js";
        for (let i = 0; i < scripts.length; i++) {
            let src = (scripts[i] as HTMLScriptElement).src;
            if (src.indexOf("bundle.js") >= 0) {
                bundleSrc = src;
                break;
            }
        }

        // Override the config's canvasid so geomlib.init() targets the
        // new window's canvas (id="canvasId"), not the source page's canvas
        // which doesn't exist in the new document. Without the override,
        // init() would look up this._config.canvasid (e.g. "canvas_0") in
        // the new document, get null, and throw in resizeCanvasToDisplaySize.
        let newWinConfig = Object.assign({}, this._config, { canvasid: "canvasId" });
        let configJSON = JSON.stringify(newWinConfig);
        let title = this._config.title || "Geometry";

        // Open maximized: use full screen dimensions, canvas fills viewport
        let html = `<!DOCTYPE html>
<html><head><title>${title}</title></head>
<body style="margin:0;padding:0;overflow:hidden;">
<canvas id="canvasId" style="width:100vw;height:100vh;"></canvas>
<script src="${bundleSrc}"><\/script>
<script>geomlib.init(${configJSON});<\/script>
</body></html>`;

        let newWin = window.open("", "_blank");
        if (newWin) {
            newWin.document.write(html);
            newWin.document.close();
        }
    }
}

// --- Icon drawing functions ---
// All draw on a size×size canvas with 3px padding

function drawResetIcon(ctx: CanvasRenderingContext2D, size: number): void {
    let cx = size / 2;
    let cy = size / 2;
    let r = size * 0.32;
    let pad = 2;

    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 1.5;

    // Circular arc (270 degrees)
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI * 0.5, Math.PI * 0.75);
    ctx.stroke();

    // Arrowhead at the end of the arc
    let endAngle = Math.PI * 0.75;
    let ax = cx + r * Math.cos(endAngle);
    let ay = cy + r * Math.sin(endAngle);
    let headLen = 4;
    let a1 = endAngle + Math.PI * 0.3;
    let a2 = endAngle + Math.PI * 0.9;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + headLen * Math.cos(a1), ay + headLen * Math.sin(a1));
    ctx.lineTo(ax + headLen * Math.cos(a2), ay + headLen * Math.sin(a2));
    ctx.closePath();
    ctx.fill();
}

function drawMaximizeIcon(ctx: CanvasRenderingContext2D, size: number): void {
    let pad = 4;
    let s = size - pad * 2;

    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 1.5;

    // Top-right outward arrow
    let ax = pad + s * 0.55;
    let ay = pad + s * 0.45;
    let bx = pad + s;
    let by = pad;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 5, by);
    ctx.lineTo(bx, by + 5);
    ctx.closePath();
    ctx.fill();

    // Bottom-left outward arrow
    ax = pad + s * 0.45;
    ay = pad + s * 0.55;
    bx = pad;
    by = pad + s;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 5, by);
    ctx.lineTo(bx, by - 5);
    ctx.closePath();
    ctx.fill();
}

function drawMinimizeIcon(ctx: CanvasRenderingContext2D, size: number): void {
    let pad = 4;
    let s = size - pad * 2;

    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 1.5;

    // Top-right inward arrow
    let ax = pad + s;
    let ay = pad;
    let bx = pad + s * 0.55;
    let by = pad + s * 0.45;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 5, by);
    ctx.lineTo(bx, by - 5);
    ctx.closePath();
    ctx.fill();

    // Bottom-left inward arrow
    ax = pad;
    ay = pad + s;
    bx = pad + s * 0.45;
    by = pad + s * 0.55;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 5, by);
    ctx.lineTo(bx, by + 5);
    ctx.closePath();
    ctx.fill();
}

function drawNewWindowIcon(ctx: CanvasRenderingContext2D, size: number): void {
    let pad = 4;
    let s = size - pad * 2;

    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 1.5;

    // Small rectangle (the window)
    let rx = pad;
    let ry = pad + s * 0.3;
    let rw = s * 0.65;
    let rh = s * 0.7;
    ctx.strokeRect(rx, ry, rw, rh);

    // Arrow pointing up-right out of the rectangle
    let arrowStartX = pad + s * 0.4;
    let arrowStartY = pad + s * 0.6;
    let arrowEndX = pad + s;
    let arrowEndY = pad;
    ctx.beginPath();
    ctx.moveTo(arrowStartX, arrowStartY);
    ctx.lineTo(arrowEndX, arrowEndY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.lineTo(arrowEndX - 5, arrowEndY);
    ctx.lineTo(arrowEndX, arrowEndY + 5);
    ctx.closePath();
    ctx.fill();
}
