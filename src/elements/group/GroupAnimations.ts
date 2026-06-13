// Cross-type group animations. See ../Animations.ts for the abstract
// base + registry mechanics.

import {Animation, AllAnimations, IAnimationStep, registerAnimation} from "../Animations";
import {GeomElement} from "../GeomElement";
import {Slate} from "../../Slate";
import {PointElement} from "../point/PointElement";
import {LineElement} from "../line/LineElement";
import {PolygonElement} from "../polygon/PolygonElement";
import {LineSlider} from "../point/LineSlider";

const CLONE_ASIDE_RATE_PX_PER_MS = 0.4;
const CLONE_ASIDE_MIN_MS = 200;
// Below this canvas (≈ viewport, in presentation mode) width, skip the
// case-variant copies entirely — they're a desktop affordance for now.
// Phones in portrait fall under this; #99 will auto-place them where
// there is room and #71's scale-to-fit will make mobile viable.
const CLONE_ASIDE_DESKTOP_MIN_WIDTH = 520;

// A mutable clone vertex tracked against its snapshot base, so the
// animation can slide every clone point by the same offset.
interface ClonePoint { pt: PointElement; bx: number; by: number; }

// Snapshot one element into a bare render-copy (no construction refs;
// update() is a no-op) at its current geometry, returning the ghost
// plus the list of its mutable points. Supported v1 types: point,
// line, polygon. Unsupported types return null (skipped with a warn).
function snapshotElement(el: GeomElement): { ghost: GeomElement, pts: ClonePoint[] } | null {
    const bare = (src: PointElement): PointElement => {
        const p = new PointElement();
        p.x = src.x; p.y = src.y; p.z = src.z;
        return p;
    };
    // PolygonElement extends nothing point-like but has V[]; check it
    // before LineElement / PointElement so a polygon isn't mis-typed.
    if (el instanceof PolygonElement) {
        const ghost = new PolygonElement();
        const pts: ClonePoint[] = [];
        for (const v of el.V) {
            const p = bare(v);
            ghost.V.push(p);
            pts.push({ pt: p, bx: p.x, by: p.y });
        }
        ghost.edgeColor = el.edgeColor;
        ghost.faceColor = el.faceColor;
        ghost.faceAlpha = el.faceAlpha;
        ghost.nameColor = el.nameColor;
        ghost.vertexColor = el.vertexColor;
        return { ghost, pts };
    }
    if (el instanceof LineElement) {
        const a = bare(el.A);
        const b = bare(el.B);
        const ghost = new LineElement({ A: a, B: b });
        ghost.edgeColor = el.edgeColor;
        ghost.nameColor = el.nameColor;
        return { ghost, pts: [{ pt: a, bx: a.x, by: a.y }, { pt: b, bx: b.x, by: b.y }] };
    }
    if (el instanceof PointElement) {
        const p = bare(el);
        p.vertexColor = el.vertexColor;
        p.nameColor = el.nameColor;
        if (el.name != null) p.name = el.name;
        return { ghost: p, pts: [{ pt: p, bx: p.x, by: p.y }] };
    }
    return null;   // circle / sector / other — deferred
}

// A.Group.cloneAside — clone a sub-figure (a named set of elements, or
// "all") into displaced bare copies and slide them aside, where they
// PERSIST for the slide. Optionally vary a slider point first so each
// copy shows a different case (e.g. a trichotomy's "one of them is
// greater"). The real figure never moves.
//
// args:
//   dx, dy          pixel offset to displace the clone by
//   include         "all" (default) or an array of element names
//   vary?           { elem, to } — set a slider point to parameter t
//                   (A + t·(B−A); infinite-slider t can be < 0) before
//                   snapshotting, so the clone shows the varied figure;
//                   the real slider is restored afterward
//
// Lifecycle: the clones are ephemerals this animation does NOT remove —
// they stay until the next slide advance clears them (SlateControls
// .showSlide wipes leftover ephemerals on every transition). A
// fade-out on dismissal is a future polish (#94/#98).
//
// elementType is GeomElement: the entry's `elem` is a nominal anchor;
// the clone set comes from args.include.
export class GroupCloneAsideAnimation extends Animation {
    public animationMethod = AllAnimations.GROUP_CLONE_ASIDE;
    public name = "Group.cloneAside";
    public elementType = GeomElement;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        const dx = args && typeof args.dx === "number" ? args.dx : 0;
        const dy = args && typeof args.dy === "number" ? args.dy : 0;
        const include = args && args.include;
        const vary = args && args.vary;
        const durationMs = Math.max(CLONE_ASIDE_MIN_MS,
            Math.hypot(dx, dy) / CLONE_ASIDE_RATE_PX_PER_MS);

        // Resolve the elements to clone. "all" / missing → every named,
        // visible, non-screen element; otherwise the explicit name list.
        const sources: GeomElement[] = [];
        if (Array.isArray(include)) {
            for (const nm of include) {
                const e = slate.lookupElement(String(nm));
                if (e != null) sources.push(e);
            }
        } else {
            for (const e of slate.elements) {
                if (e.name != null && e.visible && !e.name.startsWith("screen")) {
                    sources.push(e);
                }
            }
        }

        let cloned: ClonePoint[] = [];
        // Effective offset — clamped in setup to keep the clone's
        // bounding box within the canvas so a copy never slides out of
        // the visible extents.
        let edx = dx, edy = dy;

        const setOffset = (p: number) => {
            for (const c of cloned) {
                c.pt.x = c.bx + edx * p;
                c.pt.y = c.by + edy * p;
            }
        };

        return [{
            durationMs,
            setup: () => {
                // The real figure stays fully on stage — cloneAside is
                // not a reveal. Undo the animator's pre-zeroing of the
                // anchor target (it sets drawProgress = 0 on every
                // animated target's element).
                target.drawProgress = 1;
                target.visible = true;
                // Optionally vary a slider, recompute the real figure,
                // snapshot, then restore — so the clone captures the
                // varied geometry without disturbing the live figure.
                let slider: LineSlider | null = null;
                let sx = 0, sy = 0, sz = 0;
                if (vary && vary.elem != null && typeof vary.to === "number") {
                    const s = slate.lookupElement(String(vary.elem));
                    if (s instanceof LineSlider) {
                        slider = s;
                        sx = s.x; sy = s.y; sz = s.z;
                        const A = (s as any)._A as PointElement;
                        const B = (s as any)._B as PointElement;
                        s.x = A.x + (B.x - A.x) * vary.to;
                        s.y = A.y + (B.y - A.y) * vary.to;
                        s.z = A.z + (B.z - A.z) * vary.to;
                        slate.update();
                    }
                }

                // Snapshot into a temp set first (don't commit yet — the
                // desktop-only fit check below decides whether to show).
                const temp: { ghost: GeomElement, pts: ClonePoint[] }[] = [];
                let warnedSkip = false;
                for (const el of sources) {
                    const snap = snapshotElement(el);
                    if (snap == null) {
                        if (!warnedSkip && typeof console !== "undefined" && console.warn) {
                            console.warn("[geomlib] Group.cloneAside: skipping "
                                + "unsupported element type (" + el.name + ")");
                            warnedSkip = true;
                        }
                        continue;
                    }
                    temp.push(snap);
                }

                if (slider != null) {
                    slider.x = sx; slider.y = sy; slider.z = sz;
                    slate.update();
                }

                // Figure bbox (clone base coords == figure coords).
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                for (const t of temp) for (const c of t.pts) {
                    if (c.bx < minX) minX = c.bx; if (c.bx > maxX) maxX = c.bx;
                    if (c.by < minY) minY = c.by; if (c.by > maxY) maxY = c.by;
                }
                const bw = maxX - minX, bh = maxY - minY;

                const MARGIN = 6;
                const canvas: any = (slate as any).canvas;
                const W = canvas ? canvas.width : 0;
                const H = canvas ? canvas.height : 0;

                // Desktop-only: skip case-variant copies on a narrow
                // (mobile) viewport — there isn't room to lay them out.
                if (W && W < CLONE_ASIDE_DESKTOP_MIN_WIDTH) return;

                // Clamp the requested offset so the copy stays inside the
                // canvas (respect direction; only reduce magnitude).
                edx = dx; edy = dy;
                if (W && H && temp.length > 0) {
                    if (minX + edx < MARGIN) edx = MARGIN - minX;
                    if (maxX + edx > W - MARGIN) edx = (W - MARGIN) - maxX;
                    if (minY + edy < MARGIN) edy = MARGIN - minY;
                    if (maxY + edy > H - MARGIN) edy = (H - MARGIN) - maxY;
                }

                // Desktop-only fit guard: only show the copy if, after
                // clamping, it clears the original figure (no overlap) on
                // at least one axis. On a canvas too narrow to place it
                // clear (mobile), skip the copy entirely — case-variants
                // are a desktop affordance for now (#99 will auto-place
                // them in the available area). A single point always
                // clears (bw/bh = 0).
                const CLEAR_GAP = 8;
                const clears = temp.length === 0
                    || Math.abs(edx) >= bw + CLEAR_GAP
                    || Math.abs(edy) >= bh + CLEAR_GAP
                    || (bw === 0 && bh === 0);
                if (!clears) return;   // no room — skip

                for (const t of temp) {
                    slate.addEphemeral(t.ghost);
                    cloned = cloned.concat(t.pts);
                }
            },
            tick: (p) => { setOffset(p); },
            // Persist parked at the offset; the next slide advance clears.
            finalise: () => { setOffset(1); },
        }];
    }
}

registerAnimation(new GroupCloneAsideAnimation());
