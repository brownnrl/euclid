// Animations targeting PointElement. See ../Animations.ts for the
// abstract base + registry mechanics.

import {Animation, AllAnimations, IAnimationStep, registerAnimation} from "../Animations";
import {GeomElement} from "../GeomElement";
import {Slate} from "../../Slate";
import {PointElement} from "./PointElement";
import {LineSlider} from "./LineSlider";

// A.Point.appear — the marker radius scales from 0 to its final value
// over a short duration. Args: none. Used as the simplest reveal for a
// point that lands at a constructed position (e.g. Joyce's "point C at
// which the circles cut").
export class PointAppearAnimation extends Animation {
    public animationMethod = AllAnimations.POINT_APPEAR;
    public name = "Point.appear";
    public elementType = PointElement;
    public defaultDurationMs = 350;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        return [{
            durationMs: this.defaultDurationMs,
            tick: (progress) => {
                target.drawProgress = progress;
            },
            finalise: () => {
                target.drawProgress = 1;
                target.visible = true;
            },
        }];
    }
}

// A.Point.slide — glide a slider point along its line to a target
// (the scripted counterpart of a reader dragging it). The point really
// travels its constraint and its dependents follow.
//
// Args (one of):
//   { to: number }       — a target parameter along A→B (0 = A, 1 = B;
//                          for a segment slider it's clamped to [0,1] by
//                          the slider's own projection). Default 1.
//   { to: "E" } / { toElement: "E" }  — a target ELEMENT (#122). At setup
//                          the named point is resolved via lookupElement,
//                          projected onto the slider's line (nearest point,
//                          clamped to the segment domain), and the slider
//                          glides there. Resolved at runtime, so it tracks
//                          a derived point (e.g. an intersection) even after
//                          the reader drags the givens. A non-resolvable /
//                          non-point name warns and stays put.
// Optional durationMs; default ~ a standard transition glide.
//
// elementType is LineSlider — covers both `lineSlider` and
// `lineSegmentSlider`. A non-slider target warns + falls through to
// instant (the registry contract).
export class PointSlideAnimation extends Animation {
    public animationMethod = AllAnimations.POINT_SLIDE;
    public name = "Point.slide";
    public elementType = LineSlider;
    public defaultDurationMs = 650;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        const slider = target as LineSlider;
        const toNum = args && typeof args.to === "number" ? args.to : null;
        // A string `to` (or the explicit `toElement`) names a target point.
        const toName: string | null = args
            ? (typeof args.to === "string" ? args.to
              : (typeof args.toElement === "string" ? args.toElement : null))
            : null;
        // Start + target positions are captured at setup time (after
        // any earlier-slide motion has settled), both on the line A→B,
        // so the lerp between them stays collinear and the slider's own
        // re-projection in update() is a no-op.
        let sx = 0, sy = 0, sz = 0;   // start
        let tx = 0, ty = 0, tz = 0;   // target = A + factor·(B−A)
        const apply = (p: number) => {
            slider.x = sx + (tx - sx) * p;
            slider.y = sy + (ty - sy) * p;
            slider.z = sz + (tz - sz) * p;
            // Drive dependents from the new position this frame.
            slate.update();
        };
        return [{
            durationMs: this.defaultDurationMs,
            setup: () => {
                // A slide is not a reveal — the point is already on
                // stage; undo the animator's reveal pre-zeroing.
                slider.drawProgress = 1;
                slider.visible = true;
                sx = slider.x; sy = slider.y; sz = slider.z;
                const A = (slider as any)._A as PointElement;
                const B = (slider as any)._B as PointElement;
                const segment = !!(slider as any)._segment;
                const dx = B.x - A.x, dy = B.y - A.y, dz = B.z - A.z;
                // factor along A→B that the slider will lerp to.
                let factor: number;
                if (toName != null) {
                    // Resolve the target element and project it onto the line.
                    const tgt = slate.lookupElement(toName) as PointElement;
                    if (tgt == null || !(tgt instanceof PointElement)) {
                        // #154 — was the one site with no typeof-console
                        // guard; reportDiagnostic owns that check now.
                        slate.reportDiagnostic({
                            code: "unresolvable-target",
                            key: "Point.slide|" + String(toName),
                            message: `Point.slide: target "${toName}" is not a resolvable point — staying put`,
                            detail: { animation: "Point.slide", to: String(toName) },
                        });
                        tx = sx; ty = sy; tz = sz;
                        return;
                    }
                    const denom = dx * dx + dy * dy + dz * dz;
                    factor = denom > 1e-9
                        ? ((tgt.x - A.x) * dx + (tgt.y - A.y) * dy + (tgt.z - A.z) * dz) / denom
                        : 0;
                    if (segment) factor = Math.max(0, Math.min(1, factor));
                } else {
                    factor = toNum != null ? toNum : 1;
                }
                tx = A.x + dx * factor;
                ty = A.y + dy * factor;
                tz = A.z + dz * factor;
            },
            tick: (progress) => { apply(progress); },
            finalise: () => {
                apply(1);
                slider.drawProgress = 1;
                slider.visible = true;
            },
        }];
    }
}

registerAnimation(new PointAppearAnimation());
registerAnimation(new PointSlideAnimation());
