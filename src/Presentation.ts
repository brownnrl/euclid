// Fullscreen slideshow presentation mode for a Slate.
//
// Consumers populate Slate.slides via init(); SlateControls renders a
// "▶ Present" button when slides exist; clicking the button calls
// enterPresentation(slate). The overlay walks Next / Prev through the
// slides, hiding canvas elements not relevant to the current slide
// while keeping free/draggable construction points interactive so the
// reader can deform the figure mid-proof.
//
// One overlay at a time, page-globally — entering presentation on a
// second slate while one is already active first exits the first.
//
// Design notes:
//   - The overlay's DOM moves the slate's canvas into it (cloning would
//     break geomlib's event listeners). On exit the canvas is moved
//     back to its original parent at its original sibling position.
//   - Inline styles only so the library works against any host page.
//     A consumer can theme via CSS targeting the .geomlib-presentation
//     class hooks if desired.
//   - HTML5 Fullscreen is requested when available; the CSS overlay is
//     itself fullscreen-shaped, so a rejection or unsupported browser
//     just renders as a position:fixed layer.
//   - Text content is set via textContent (not innerHTML) to avoid
//     accidentally injecting host-controlled HTML. Justification refs
//     route through the consumer-supplied resolveJustification
//     callback; a returned URL becomes <a href=...>, otherwise the
//     ref renders as <span>.

import {Slate, ResolveJustification} from "./Slate";
import {ISlide} from "./index";

// Module-level tracking — only one presentation overlay can be active
// at a time across the page.
let active: ActivePresentation | null = null;

interface ActivePresentation {
    slate: Slate;
    overlay: HTMLDivElement;
    parent: Node;
    nextSibling: Node | null;
    captionEl: HTMLDivElement;
    justsEl: HTMLDivElement;
    counterEl: HTMLSpanElement;
    index: number;
    onKey: (e: KeyboardEvent) => void;
    onFsChange: () => void;
}

// Compute the visible + highlighted name sets for slide `index` given
// the rules:
//   - visible inherits from the previous slide if omitted;
//     "hide all at start" applies when no earlier slide ever declared
//     visible (initial state is the empty set).
//   - highlighted clears each slide (defaults to []).
//   - Every draggable element on the slate is auto-unioned into
//     visible — free construction points always stay interactive.
//   - Every highlighted name is auto-unioned into visible — you can't
//     highlight what isn't drawn.
//
// Exported so SlideTest can exercise the rule purely with data — no DOM.
export function computeSlideState(
    slate: Slate,
    slides: ISlide[],
    index: number,
): { visible: Set<string>, highlighted: Set<string> } {
    // Walk back through earlier slides to find the most recent
    // explicit `visible` array.
    let baseVisible: string[] = [];
    for (let i = index; i >= 0; i--) {
        if (slides[i].visible != null) {
            baseVisible = slides[i].visible;
            break;
        }
    }
    const visible = new Set<string>(baseVisible);

    const slide = slides[index];
    const highlighted = new Set<string>(slide.highlighted || []);

    // Auto-union: draggable elements + highlighted elements always
    // visible.
    for (const e of slate.elements) {
        if (e.draggable && e.name != null) visible.add(e.name);
    }
    // Set iteration with for-of needs downlevelIteration on some
    // webpack configs; forEach is safe across targets.
    highlighted.forEach(name => visible.add(name));

    return { visible, highlighted };
}

// Apply a slide's effective state to the slate: flip every named
// element's visibility per the visible set, every named element's
// shouldHighlight per the highlighted set, then redraw.
function applySlide(
    slate: Slate,
    slides: ISlide[],
    index: number,
): void {
    const { visible, highlighted } = computeSlideState(slate, slides, index);
    for (const e of slate.elements) {
        if (e.name == null) continue;
        e.visible = visible.has(e.name);
        e.shouldHighlight = highlighted.has(e.name);
    }
    slate.update();
}

// Render the slide's caption + justifications into the overlay panels.
function renderCaption(
    slide: ISlide,
    captionEl: HTMLDivElement,
    justsEl: HTMLDivElement,
    counterEl: HTMLSpanElement,
    index: number,
    total: number,
    resolve: ResolveJustification | null,
): void {
    captionEl.textContent = slide.text || "";
    justsEl.innerHTML = "";
    if (slide.justifications) {
        for (let i = 0; i < slide.justifications.length; i++) {
            if (i > 0) {
                const sep = document.createElement("span");
                sep.textContent = " · ";
                sep.style.opacity = "0.5";
                justsEl.appendChild(sep);
            }
            const ref = slide.justifications[i].ref;
            const url = resolve ? resolve(ref) : null;
            if (url) {
                const a = document.createElement("a");
                a.href = url;
                a.textContent = ref;
                a.style.color = "#FFD700";
                a.style.textDecoration = "underline";
                justsEl.appendChild(a);
            } else {
                const span = document.createElement("span");
                span.textContent = ref;
                justsEl.appendChild(span);
            }
        }
    }
    counterEl.textContent = (index + 1) + " / " + total;
}

// Build the overlay DOM. Inline styles so the library works against
// any host page without requiring host CSS.
function buildOverlay(canvas: HTMLCanvasElement): {
    overlay: HTMLDivElement;
    canvasWrap: HTMLDivElement;
    captionEl: HTMLDivElement;
    justsEl: HTMLDivElement;
    counterEl: HTMLSpanElement;
    prevBtn: HTMLButtonElement;
    nextBtn: HTMLButtonElement;
    exitBtn: HTMLButtonElement;
} {
    const overlay = document.createElement("div");
    overlay.className = "geomlib-presentation";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(20,20,20,0.97)";
    overlay.style.zIndex = "9999";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.color = "#fefefe";
    overlay.style.fontFamily = "Georgia, 'Times New Roman', serif";

    const canvasWrap = document.createElement("div");
    canvasWrap.className = "geomlib-presentation-canvas";
    canvasWrap.style.flex = "1 1 auto";
    canvasWrap.style.display = "flex";
    canvasWrap.style.alignItems = "center";
    canvasWrap.style.justifyContent = "center";
    canvasWrap.style.padding = "20px";
    canvasWrap.style.minHeight = "0";
    canvasWrap.style.background = "#fff";
    canvasWrap.style.borderRadius = "4px";
    canvasWrap.style.margin = "20px";
    canvasWrap.style.maxWidth = "min(900px, 90vw)";
    canvasWrap.style.maxHeight = "70vh";
    overlay.appendChild(canvasWrap);

    const footer = document.createElement("div");
    footer.className = "geomlib-presentation-footer";
    footer.style.flex = "0 0 auto";
    footer.style.maxWidth = "min(800px, 90vw)";
    footer.style.textAlign = "center";
    footer.style.padding = "0 20px 20px";
    overlay.appendChild(footer);

    const captionEl = document.createElement("div");
    captionEl.className = "geomlib-presentation-caption";
    captionEl.style.fontSize = "1.25rem";
    captionEl.style.lineHeight = "1.4";
    captionEl.style.marginBottom = "8px";
    footer.appendChild(captionEl);

    const justsEl = document.createElement("div");
    justsEl.className = "geomlib-presentation-justs";
    justsEl.style.fontSize = "0.9rem";
    justsEl.style.opacity = "0.85";
    footer.appendChild(justsEl);

    const nav = document.createElement("nav");
    nav.className = "geomlib-presentation-nav";
    nav.style.flex = "0 0 auto";
    nav.style.display = "flex";
    nav.style.gap = "16px";
    nav.style.alignItems = "center";
    nav.style.padding = "12px 20px 24px";
    overlay.appendChild(nav);

    const prevBtn = makeNavButton("‹ Prev");
    const counterEl = document.createElement("span");
    counterEl.className = "geomlib-presentation-counter";
    counterEl.style.minWidth = "60px";
    counterEl.style.textAlign = "center";
    counterEl.style.opacity = "0.8";
    const nextBtn = makeNavButton("Next ›");
    const exitBtn = makeNavButton("✕ Exit");
    exitBtn.style.marginLeft = "32px";
    nav.appendChild(prevBtn);
    nav.appendChild(counterEl);
    nav.appendChild(nextBtn);
    nav.appendChild(exitBtn);

    return { overlay, canvasWrap, captionEl, justsEl, counterEl, prevBtn, nextBtn, exitBtn };
}

function makeNavButton(label: string): HTMLButtonElement {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.background = "rgba(255,255,255,0.12)";
    b.style.color = "#fefefe";
    b.style.border = "none";
    b.style.borderRadius = "3px";
    b.style.padding = "8px 16px";
    b.style.cursor = "pointer";
    b.style.fontFamily = "inherit";
    b.style.fontSize = "1rem";
    b.addEventListener("mouseenter", () => { b.style.background = "rgba(255,255,255,0.24)"; });
    b.addEventListener("mouseleave", () => { b.style.background = "rgba(255,255,255,0.12)"; });
    return b;
}

export function enterPresentation(slate: Slate): void {
    if (active) exitPresentation();
    if (!slate.slides || slate.slides.length === 0) return;

    const canvas = slate.canvas as HTMLCanvasElement;
    const parent = canvas.parentNode;
    if (!parent) return;
    const nextSibling = canvas.nextSibling;

    const ui = buildOverlay(canvas);
    // Move the actual canvas (not a clone) so its event listeners,
    // slate reference, and rendering state all keep working.
    ui.canvasWrap.appendChild(canvas);
    document.body.appendChild(ui.overlay);

    const state: ActivePresentation = {
        slate,
        overlay: ui.overlay,
        parent,
        nextSibling,
        captionEl: ui.captionEl,
        justsEl: ui.justsEl,
        counterEl: ui.counterEl,
        index: 0,
        onKey: null as any,
        onFsChange: null as any,
    };
    active = state;

    const slides = slate.slides;
    const resolve = slate.resolveJustification;

    const show = (i: number) => {
        const clamped = Math.max(0, Math.min(slides.length - 1, i));
        state.index = clamped;
        applySlide(slate, slides, clamped);
        renderCaption(slides[clamped], ui.captionEl, ui.justsEl, ui.counterEl, clamped, slides.length, resolve);
    };

    ui.prevBtn.addEventListener("click", () => show(state.index - 1));
    ui.nextBtn.addEventListener("click", () => show(state.index + 1));
    ui.exitBtn.addEventListener("click", () => exitPresentation());

    state.onKey = (e: KeyboardEvent) => {
        switch (e.key) {
            case "ArrowLeft":
                e.preventDefault();
                show(state.index - 1);
                break;
            case "ArrowRight":
            case " ":
                e.preventDefault();
                show(state.index + 1);
                break;
            case "Escape":
                e.preventDefault();
                exitPresentation();
                break;
        }
    };
    document.addEventListener("keydown", state.onKey);

    // Watch for the user pressing Esc to exit fullscreen — keep the
    // overlay open in that case (CSS overlay is already fullscreen-
    // shaped), but the user may want a second Esc to exit. We bind
    // exit to the Escape key directly above so that path covers both.
    state.onFsChange = () => {};

    show(0);

    // Best-effort HTML5 Fullscreen request. Failure is fine — the CSS
    // overlay covers the viewport regardless.
    if (typeof ui.overlay.requestFullscreen === "function") {
        ui.overlay.requestFullscreen().catch(() => {});
    }
}

export function exitPresentation(): void {
    if (!active) return;
    const state = active;
    active = null;

    document.removeEventListener("keydown", state.onKey);

    // Restore visibility + clear highlights on every element, then
    // redraw so the canvas looks like the inline default again.
    state.slate.clearVisibility();
    for (const e of state.slate.elements) e.shouldHighlight = false;
    state.slate.update();

    // Move the canvas back to its stashed DOM position.
    const canvas = state.slate.canvas as HTMLCanvasElement;
    if (state.nextSibling) {
        state.parent.insertBefore(canvas, state.nextSibling);
    } else {
        state.parent.appendChild(canvas);
    }

    // Drop the overlay.
    if (state.overlay.parentNode) {
        state.overlay.parentNode.removeChild(state.overlay);
    }

    // Exit fullscreen if we were in it.
    if (document.fullscreenElement && typeof document.exitFullscreen === "function") {
        document.exitFullscreen().catch(() => {});
    }
}
