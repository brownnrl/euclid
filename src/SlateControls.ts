/*----------------------------------------------------------------------+
|    Title:  SlateControls.ts                                           |
|    UI overlay for geometry diagrams: reset, maximize, present.        |
|    Buttons are canvas-drawn icons overlaid on each Slate canvas.      |
|    Keyboard shortcuts:                                                 |
|      r / space  → reset                                               |
|      m          → maximize/minimize                                   |
|      p          → present (when the slate has slides)                 |
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

// Slate-controls icon sizing. The historical default is 20 px; touch
// devices (coarse pointer) get a slightly tighter 15-px row per author
// preference — small enough to stay out of the diagram, still hittable
// with a fingertip.
function isCoarsePointer(): boolean {
    return typeof window !== "undefined"
        && typeof window.matchMedia === "function"
        && window.matchMedia("(pointer: coarse)").matches;
}
const BTN_SIZE = isCoarsePointer() ? 18 : 20;
const BTN_GAP = isCoarsePointer() ? 4 : 4;
const BTN_MARGIN = isCoarsePointer() ? 7 : 8;

// #69 — keep the control buttons hidden until the canvas/wrapper is
// hovered or focused, so a page full of diagrams isn't cluttered with a
// button row on every one. CSS-only (`:hover` / `:focus-within`), no
// per-frame JS; `opacity` keeps the buttons in the layout (no reflow) and
// fades them. Injected once per document. Touch users tap the canvas
// first, which focuses it and reveals the controls.
const CONTROLS_STYLE_ID = "geomlib-controls-style";
function ensureControlsStyle(): void {
    if (typeof document === "undefined") return;
    if (document.getElementById(CONTROLS_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = CONTROLS_STYLE_ID;
    style.textContent =
        ".geomlib-wrapper>button{opacity:0;transition:opacity .15s ease-in-out}" +
        ".geomlib-wrapper:hover>button,.geomlib-wrapper:focus-within>button{opacity:1}";
    (document.head || document.documentElement).appendChild(style);
}

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
    // Single-pin sticky for caption {NAME} refs: only one element may be
    // emphasized at a time. Clicking another ref clears the prior pin
    // before stickying the new one; hover is suppressed while a pin is
    // active so the sticky element stays the dominant one.
    private _stickyRefSpan: HTMLSpanElement | null = null;
    private _stickyRefElem: import("./elements/GeomElement").GeomElement | null = null;

    constructor(slate: Slate, canvas: HTMLCanvasElement, config: IInitConfig) {
        this._slate = slate;
        this._canvas = canvas;
        this._config = config;
    }

    init(): void {
        this._wrapper = this.createWrapper();
        this.createButtons();
        this.addKeyboardShortcuts();
        // Track window resize for the lifetime of the slate (#71): an inline
        // responsive canvas (`max-width:100%`) must re-fit on orientation
        // flip / column resize, not only while maximized. resizeAndRedraw
        // re-syncs the bitmap, recomputes the fit-scale, and redraws.
        this._stopTrackingResize = trackWindowResize(window, () => this.resizeAndRedraw());
    }

    private createWrapper(): HTMLDivElement {
        ensureControlsStyle();   // #69 — hover/focus reveal stylesheet (once)
        let wrapper = document.createElement("div");
        wrapper.className = "geomlib-wrapper";
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

        // Set the flag BEFORE resizeAndRedraw so its centring pass (#107)
        // sees the maximized state and slides the figure to centre.
        this._maximized = true;
        this.resizeAndRedraw();
        this.updateMaximizeIcon();
        // Window-resize tracking is persistent (set up in init), so the
        // maximized 100vw × 100vh canvas already re-syncs on viewport change.
    }

    private minimize(): void {
        if (!this._savedStyles) return;
        // Resize tracking stays active (persistent since init) so the inline
        // canvas keeps re-fitting after we restore it.

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

        // Clear the flag BEFORE resizeAndRedraw so its centring pass (#107)
        // restores the figure to its authored position.
        this._maximized = false;
        this.resizeAndRedraw();
        this._savedStyles = null;
        this.updateMaximizeIcon();
        // Exiting the maximized view also resets the construction to its
        // authored state — same as the reset (r) control — so any dragging
        // done while maximized / presenting is undone on the way out (#107).
        this._slate.reset();
    }

    private resizeAndRedraw(): void {
        // Sync the canvas BITMAP to CSS size × dpr so it stays crisp on
        // HiDPI and after CSS scaling (#71). drawElements scales the context
        // by dpr; coordinates stay in CSS px.
        const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
        let w = Math.round(this._canvas.clientWidth * dpr);
        let h = Math.round(this._canvas.clientHeight * dpr);
        if (this._canvas.width !== w || this._canvas.height !== h) {
            this._canvas.width = w;
            this._canvas.height = h;
        }
        this._slate.recomputeFitScale();   // #71 — F = min(1, display/logical)
        this._applyCentring();
        this._slate.update();
    }

    // #107 — when maximized (via the control or presentation), slide the
    // whole figure to the centre of the enlarged canvas; when not maximized,
    // restore the authored position (translate 0; the fit-scale handles
    // responsive sizing). Recomputed on every resize so it stays centred as
    // the window changes. figureBounds() is in logical coords, so the centre
    // target is computed in display px through the fit-scale F (#71).
    private _applyCentring(): void {
        if (!this._maximized) { this._slate.clearViewOffset(); return; }
        const b = this._slate.figureBounds();
        if (b == null) { this._slate.clearViewOffset(); return; }
        const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
        const F = this._slate.viewScale;
        // T (display px) so F·figureCentre + T lands at the display centre.
        this._slate.setViewOffset(this._slate.displayWidth / 2 - F * cx,
                                  this._slate.displayHeight / 2 - F * cy);
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
        // #114 — centre ONCE on entering presentation (covers the case
        // where we were already maximized, so maximize() didn't run). Slide
        // advances no longer re-centre.
        this._applyCentring();
        this.buildPresentationOverlay();
        this.bindPresentationKeys();
        this._presenting = true;
        this.showSlide(0);
    }

    private exitPresent(): void {
        if (!this._presenting) return;
        this.unbindPresentationKeys();
        this.clearStickyRef();
        this.removePresentationOverlay();
        // #115 — leave presentation mode but STAY in the maximized view,
        // keeping the viewer's manipulation. Only the maximize control
        // un-maximizes (and that's what resets — see minimize()). Drop the
        // parked case-variant ephemerals + the walk's highlight/visibility
        // state, but keep the current view offset (the centre set on enter)
        // and any dragged positions.
        if (this._slate.animator != null) this._slate.animator.cancel();
        this._slate.clearEphemerals();
        this._slate.clearVisibility();
        for (let e of this._slate.elements) {
            e.shouldHighlight = false;
            e.emphasized = false;
        }
        this._presenting = false;
        this._slate.update();
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
        // Drop any sticky pin from the previous slide — its span
        // belongs to the prior caption and is about to be replaced
        // anyway.
        this.clearStickyRef();
        // Wipe any ephemerals a prior slide left parked (e.g. a
        // translateAside case-variant clone that persisted for its
        // slide). The animated branch's animateTo→cancel also clears
        // ephemerals, but an instant transition wouldn't — so clear
        // here on every advance.
        this._slate.clearEphemerals();
        // #114 — do NOT re-centre per slide; the figure is centred once on
        // enter (onPresent / maximize) and stays put so a viewer dragging
        // mid-walk isn't yanked back. An autoPlace transition (#99) still
        // eases from the current (centred) offset out to its case layout.

        const slide = slides[clamped];
        const transition = slide.transition;
        const animations = transition && transition.animations;
        const mode: "cascade" | "parallel" =
            (transition && transition.mode === "parallel") ? "parallel" : "cascade";
        // Clear per-element emphasis on every transition so a previous
        // slide's hover state doesn't carry forward.
        for (let e of this._slate.elements) e.emphasized = false;

        if (animations && animations.length > 0) {
            // Animated transition — slate.animateTo flips visibility +
            // highlight per-element and runs the configured Animation
            // for each entry. Newly-visible elements without an entry
            // pop in instantly (handled inside animateTo).
            this._slate.animateTo(state.visible, state.highlighted, animations, mode);
        } else {
            // Instant transition (4b behaviour) — flip every element
            // synchronously, no rAF loop.
            for (let e of this._slate.elements) {
                if (e.name == null) continue;
                e.visible = state.visible.has(e.name);
                e.shouldHighlight = state.highlighted.has(e.name);
                e.drawProgress = 1;
            }
            this._slate.update();
        }

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
    //
    // Display override (#90): {DISPLAY|element} renders DISPLAY but
    // binds the highlight to `element` — for prose names that collide
    // with another element's name, e.g. "the angle {ABC|angBint}"
    // where the bare token would resolve to the triangle ABC.
    private renderCaptionText(host: HTMLElement, text: string): void {
        host.innerHTML = "";
        const re = /\{([A-Za-z][A-Za-z0-9'\-]*)(?:\|([A-Za-z][A-Za-z0-9'\-]*))?\}/g;
        let lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
            if (m.index > lastIndex) {
                host.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
            }
            const display = m[1];
            const target = m[2] != null ? m[2] : m[1];
            const elem = this._slate.lookupElement(target);
            if (elem) {
                host.appendChild(this.buildCaptionRef(display, elem));
            } else {
                // Unknown — render plain so a typo doesn't surface as
                // raw "{XYZ}" to the reader.
                host.appendChild(document.createTextNode(display));
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
        span.addEventListener("mouseenter", () => {
            // Hover does nothing while a sticky pin is active — the
            // pinned element should remain the sole highlighted ref.
            if (this._stickyRefSpan != null) return;
            elem.emphasized = true;
            this._slate.update();
        });
        span.addEventListener("mouseleave", () => {
            if (this._stickyRefSpan != null) return;
            elem.emphasized = false;
            this._slate.update();
        });
        span.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const wasThis = this._stickyRefSpan === span;
            this.clearStickyRef();
            if (!wasThis) this.setStickyRef(span, elem);
            this._slate.update();
        });
        return span;
    }

    // Drop the active sticky pin (if any): release the pinned
    // element's emphasis flag and reset the span's visual state.
    private clearStickyRef(): void {
        if (this._stickyRefSpan != null) {
            this._stickyRefSpan.classList.remove("active");
            this._stickyRefSpan.style.color = "";
        }
        if (this._stickyRefElem != null) {
            this._stickyRefElem.emphasized = false;
        }
        this._stickyRefSpan = null;
        this._stickyRefElem = null;
    }

    // Pin a new sticky ref. Call clearStickyRef() first if another
    // ref is currently pinned.
    private setStickyRef(span: HTMLSpanElement, elem: import("./elements/GeomElement").GeomElement): void {
        span.classList.add("active");
        span.style.color = "#b08800";
        elem.emphasized = true;
        this._stickyRefSpan = span;
        this._stickyRefElem = elem;
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
