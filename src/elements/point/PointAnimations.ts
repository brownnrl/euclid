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
// parameter `t` (the scripted counterpart of a reader dragging it).
// The point really travels its constraint and its dependents follow.
// Args: { to: number } — the target parameter along A→B (0 = A, 1 = B;
// for a segment slider it's clamped to [0,1] by the slider's own
// projection). Optional durationMs; default ~ a standard transition
// glide, resolved through the usual chain.
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
        const to = args && typeof args.to === "number" ? args.to : 1;
        // Start + target positions are captured at setup time (after
        // any earlier-slide motion has settled), both on the line A→B,
        // so the lerp between them stays collinear and the slider's own
        // re-projection in update() is a no-op.
        let sx = 0, sy = 0, sz = 0;   // start
        let tx = 0, ty = 0, tz = 0;   // target = A + t·(B−A)
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
                tx = A.x + (B.x - A.x) * to;
                ty = A.y + (B.y - A.y) * to;
                tz = A.z + (B.z - A.z) * to;
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
