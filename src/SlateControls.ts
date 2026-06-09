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
import {computeSlideState} from "./slideshow";

interface IInitConfig {
    background: string;
    title: string;
    align?: number;
    canvasid?: string;
    pivot?: string;
    elements: any[];
}

// Slate-controls icon sizing. Touch devices (coarse pointer) get
// roughly double-sized buttons so they hit the ~44px tap-target
// minimum from Apple/Material guidance. Mouse/trackpad keeps the
// compact 20px row that fits desktop.
function isCoarsePointer(): boolean {
    return typeof window !== "undefined"
        && typeof window.matchMedia === "function"
        && window.matchMedia("(pointer: coarse)").matches;
}
const BTN_SIZE = isCoarsePointer() ? 44 : 20;
const BTN_GAP = isCoarsePointer() ? 8 : 4;
const BTN_MARGIN = isCoarsePointer() ? 12 : 8;

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

    // Presentation-mode (slideshow) state. Caption + nav float over
    // the maximized canvas; no fullscreen overlay, no background takeover.
    private _presenting: boolean = false;
    private _presentationIndex: number = 0;
    private _presentationOverlay: HTMLDivElement | null = null;
    private _presentationCaption: HTMLDivElement | null = null;
    private _presentationJusts: HTMLDivElement | null = null;
    private _presentationCounter: HTMLSpanElement | null = null;
    private _presentationOnKey: ((e: KeyboardEvent) => void) | null = null;

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

        // Conditionally append a "▶ Present" button when the slate
        // carries any slides. Slates without slides see the same
        // three-button row as before — backwards-compatible.
        if (this._slate.slides.length > 0) {
            buttons.push({
                draw: drawPresentIcon,
                action: () => this.onPresent(),
                title: "Present (p)",
            });
        }

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
                case "p":
                case "P":
                    if (this._slate.slides.length > 0) {
                        e.preventDefault();
                        this.onPresent();
                    }
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

    // --- Presentation mode (slideshow) ---
    //
    // Opens the slate's slides as a step-through. The canvas itself
    // takes over the viewport via the existing maximize state (no
    // separate fullscreen overlay, no black takeover) — the caption
    // and nav controls float on top of the maximized canvas.

    private onPresent(): void {
        if (this._presenting) return;
        if (this._slate.slides.length === 0) return;
        if (!this._maximized) this.maximize();
        this.buildPresentationOverlay();
        this.bindPresentationKeys();
        this._presenting = true;
        this.showSlide(0);
    }

    private exitPresent(): void {
        if (!this._presenting) return;
        this.unbindPresentationKeys();
        this.removePresentationOverlay();
        this._slate.clearVisibility();
        for (let e of this._slate.elements) {
            e.shouldHighlight = false;
            e.emphasized = false;
        }
        this._slate.update();
        this._presenting = false;
    }

    private buildPresentationOverlay(): void {
        // Floating UI panel pinned to the bottom of the viewport.
        // Uses position: fixed and attaches to documentElement so it
        // can't be clipped by any wrapper, transformed parent, or
        // scrollable container — works the same on iOS Safari,
        // Samsung Internet, Android Chrome, and desktop. Solid white
        // (no transparency) so it's never mistaken for background;
        // bright box-shadow so the boundary reads.
        const overlay = document.createElement("div");
        overlay.className = "geomlib-presentation-overlay";
        overlay.style.position = "fixed";
        overlay.style.left = "0";
        overlay.style.right = "0";
        overlay.style.bottom = "0";
        overlay.style.margin = "0 auto";
        // Span the bottom of the viewport so the centred contents
        // can't render off-screen and there's nowhere for the panel
        // to "hide". The actual visible chrome is the inner column.
        overlay.style.maxWidth = "100vw";
        overlay.style.background = "#ffffff";
        overlay.style.color = "#222";
        overlay.style.borderTop = "1px solid rgba(0,0,0,0.18)";
        overlay.style.boxShadow = "0 -6px 18px rgba(0,0,0,0.18)";
        overlay.style.padding = "12px 16px calc(12px + env(safe-area-inset-bottom, 0px))";
        // Max possible z-index so nothing can stack above us.
        overlay.style.zIndex = "2147483647";
        overlay.style.fontFamily = "Georgia, 'Times New Roman', serif";
        overlay.style.touchAction = "manipulation";
        overlay.style.boxSizing = "border-box";
        overlay.style.textAlign = "center";

        const caption = document.createElement("div");
        caption.className = "geomlib-presentation-caption";
        caption.style.fontSize = "1.1rem";
        caption.style.lineHeight = "1.45";
        caption.style.textAlign = "center";
        caption.style.marginBottom = "6px";
        overlay.appendChild(caption);

        const justs = document.createElement("div");
        justs.className = "geomlib-presentation-justs";
        justs.style.fontSize = "0.85rem";
        justs.style.textAlign = "center";
        justs.style.opacity = "0.85";
        justs.style.minHeight = "1em";
        justs.style.marginBottom = "10px";
        overlay.appendChild(justs);

        const nav = document.createElement("div");
        nav.className = "geomlib-presentation-nav";
        nav.style.display = "flex";
        nav.style.gap = "10px";
        nav.style.alignItems = "center";
        nav.style.justifyContent = "center";

        const prevBtn = makePresentationButton("‹ Prev");
        const counter = document.createElement("span");
        counter.className = "geomlib-presentation-counter";
        counter.style.minWidth = "56px";
        counter.style.textAlign = "center";
        counter.style.opacity = "0.7";
        counter.style.fontSize = "0.9rem";
        const nextBtn = makePresentationButton("Next ›");
        const exitBtn = makePresentationButton("✕ Exit");
        exitBtn.style.marginLeft = "16px";

        prevBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.showSlide(this._presentationIndex - 1);
        });
        nextBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.showSlide(this._presentationIndex + 1);
        });
        exitBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.exitPresent();
        });

        nav.appendChild(prevBtn);
        nav.appendChild(counter);
        nav.appendChild(nextBtn);
        nav.appendChild(exitBtn);
        overlay.appendChild(nav);

        // Append to documentElement (html) — outside body — so a
        // mobile browser's odd body sizing can't clip us.
        document.documentElement.appendChild(overlay);
        this._presentationOverlay = overlay;
        this._presentationCaption = caption;
        this._presentationJusts = justs;
        this._presentationCounter = counter;
    }

    private removePresentationOverlay(): void {
        if (this._presentationOverlay && this._presentationOverlay.parentNode) {
            this._presentationOverlay.parentNode.removeChild(this._presentationOverlay);
        }
        this._presentationOverlay = null;
        this._presentationCaption = null;
        this._presentationJusts = null;
        this._presentationCounter = null;
    }

    private bindPresentationKeys(): void {
        const handler = (e: KeyboardEvent) => {
            if (!this._presenting) return;
            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault();
                    this.showSlide(this._presentationIndex - 1);
                    break;
                case "ArrowRight":
                case " ":
                    e.preventDefault();
                    this.showSlide(this._presentationIndex + 1);
                    break;
                case "Escape":
                    e.preventDefault();
                    this.exitPresent();
                    break;
            }
        };
        this._presentationOnKey = handler;
        document.addEventListener("keydown", handler);
    }

    private unbindPresentationKeys(): void {
        if (this._presentationOnKey) {
            document.removeEventListener("keydown", this._presentationOnKey);
            this._presentationOnKey = null;
        }
    }

    private showSlide(index: number): void {
        const slides = this._slate.slides;
        if (slides.length === 0) return;
        const clamped = Math.max(0, Math.min(slides.length - 1, index));
        this._presentationIndex = clamped;

        const state = computeSlideState(this._slate, slides, clamped);
        // Reset emphasis between slides so a sticky-tap on slide N
        // doesn't leak into N+1.
        for (let e of this._slate.elements) {
            if (e.name == null) continue;
            e.visible = state.visible.has(e.name);
            e.shouldHighlight = state.highlighted.has(e.name);
            e.emphasized = false;
        }
        this._slate.update();

        const slide = slides[clamped];
        if (this._presentationCaption) {
            this.renderCaptionText(this._presentationCaption, slide.text || "");
        }
        if (this._presentationCounter) {
            this._presentationCounter.textContent = (clamped + 1) + " / " + slides.length;
        }
        if (this._presentationJusts) {
            this._presentationJusts.innerHTML = "";
            const resolve = this._slate.resolveJustification;
            if (slide.justifications) {
                for (let i = 0; i < slide.justifications.length; i++) {
                    if (i > 0) {
                        const sep = document.createElement("span");
                        sep.textContent = " · ";
                        sep.style.opacity = "0.5";
                        this._presentationJusts.appendChild(sep);
                    }
                    const ref = slide.justifications[i].ref;
                    const url = resolve ? resolve(ref) : null;
                    if (url) {
                        const a = document.createElement("a");
                        a.href = url;
                        a.textContent = ref;
                        a.target = "_blank";
                        a.rel = "noopener";
                        a.style.color = "#0066cc";
                        this._presentationJusts.appendChild(a);
                    } else {
                        const span = document.createElement("span");
                        span.textContent = ref;
                        this._presentationJusts.appendChild(span);
                    }
                }
            }
        }
    }

    // Parse {NAME} tokens in caption text and emit interactive bold-
    // italic spans for any that resolve to a slate element (alias
    // lookups included). Unknown / unresolved refs render as plain
    // text with the braces stripped. Hover / pointerdown toggles
    // element.emphasized so the figure picks the ref up with an
    // extra-thick gold stroke.
    private renderCaptionText(host: HTMLElement, text: string): void {
        host.innerHTML = "";
        const re = /\{([A-Za-z][A-Za-z0-9'\-]*)\}/g;
        let lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
            if (m.index > lastIndex) {
                host.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
            }
            const name = m[1];
            const elem = this._slate.lookupElement(name);
            if (elem) {
                host.appendChild(this.buildCaptionRef(name, elem));
            } else {
                // Unknown — render plain so a typo doesn't surface as
                // raw "{XYZ}" to the reader.
                host.appendChild(document.createTextNode(name));
            }
            lastIndex = m.index + m[0].length;
        }
        if (lastIndex < text.length) {
            host.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
    }

    private buildCaptionRef(label: string, elem: import("./elements/GeomElement").GeomElement): HTMLSpanElement {
        const span = document.createElement("span");
        span.className = "geomlib-presentation-ref";
        span.textContent = label;
        span.style.fontWeight = "700";
        span.style.fontStyle = "italic";
        span.style.cursor = "pointer";
        span.style.borderBottom = "1px dotted currentColor";
        let sticky = false;
        const setEmph = (on: boolean) => {
            elem.emphasized = on;
            this._slate.update();
        };
        span.addEventListener("mouseenter", () => {
            if (!sticky) setEmph(true);
        });
        span.addEventListener("mouseleave", () => {
            if (!sticky) setEmph(false);
        });
        span.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            sticky = !sticky;
            span.classList.toggle("active", sticky);
            span.style.color = sticky ? "#b08800" : "";
            setEmph(sticky);
        });
        return span;
    }
}

// Button styling shared by the four nav buttons in the presentation
// overlay. Matches the soft, light visual of the surrounding panel.
function makePresentationButton(label: string): HTMLButtonElement {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.background = "rgba(0,0,0,0.08)";
    b.style.color = "#222";
    b.style.border = "1px solid rgba(0,0,0,0.15)";
    b.style.borderRadius = "4px";
    // Min 44px tap target per Apple HIG / Material guidance; the
    // wider padding also gives Pro Max thumbs some breathing room.
    b.style.padding = "10px 16px";
    b.style.minHeight = "44px";
    b.style.cursor = "pointer";
    b.style.fontFamily = "inherit";
    b.style.fontSize = "1rem";
    b.style.touchAction = "manipulation";
    b.addEventListener("mouseenter", () => { b.style.background = "rgba(0,0,0,0.16)"; });
    b.addEventListener("mouseleave", () => { b.style.background = "rgba(0,0,0,0.08)"; });
    return b;
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

function drawPresentIcon(ctx: CanvasRenderingContext2D, size: number): void {
    // Right-pointing play triangle, centred. The button is square so a
    // little leftward bias visually centres the optical mass.
    let pad = size * 0.28;
    let leftX = pad - 1;
    let rightX = size - pad + 2;
    let topY = pad;
    let bottomY = size - pad;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.beginPath();
    ctx.moveTo(leftX, topY);
    ctx.lineTo(leftX, bottomY);
    ctx.lineTo(rightX, size / 2);
    ctx.closePath();
    ctx.fill();
}
