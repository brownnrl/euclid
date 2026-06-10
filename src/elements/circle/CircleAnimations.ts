// Animations targeting CircleElement. See ../Animations.ts for the
// abstract base + registry mechanics.

import {Animation, AllAnimations, IAnimationStep, registerAnimation} from "../Animations";
import {GeomElement} from "../GeomElement";
import {Slate} from "../../Slate";
import {CircleElement} from "./CircleElement";

// Default sweep rate in radians/ms. Calibrated for unhurried teaching:
// a full circle (2π) draws in ≈ 2 seconds at 0.003 rad/ms. Authors who
// want a faster compass raise the rate via
// slate.animationConfig.rates["Circle.compass"].
const DEFAULT_ARC_RATE_RAD_PER_MS = 0.003;

// A.Circle.compass — anchor at centre, pick up the pencil at the
// radius-defining point B, sweep 2π back to the start. Args:
// { startAngle?: number } — default is computed from the angle from
// centre to B so the trace begins where a real compass would.
//
// Strict two-step sequence (mirrors A.Polygon.outlineAndFill):
//   1. Edge sweep: drawProgress 0 → 1 over 2π / rate.
//   2. Face fade-in: faceAlpha 0 → 1 over ~half the sweep duration.
// The edge stays fully drawn through step 2 because drawProgress
// finalises to 1 before the fade-in starts, and faceAlpha is the
// independent driver for drawFace's globalAlpha.
const DEFAULT_CIRCLE_FILL_MS = 600;
export class CircleCompassAnimation extends Animation {
    public animationMethod = AllAnimations.CIRCLE_COMPASS;
    public name = "Circle.compass";
    public elementType = CircleElement;
    public defaultRate = DEFAULT_ARC_RATE_RAD_PER_MS;
    public defaultDurationMs = DEFAULT_CIRCLE_FILL_MS;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        const circle = target as CircleElement;
        const explicitStart = (args && typeof args.startAngle === "number")
            ? args.startAngle
            : Math.atan2(circle.B.y - circle.Center.y, circle.B.x - circle.Center.x);
        const sweepMs = (2 * Math.PI) / this.defaultRate;
        // Fill ~twice as fast as the sweep, capped by the class-level
        // default so a tiny circle doesn't yield a blink-of-an-eye fade.
        const fillMs = Math.min(sweepMs / 2, this.defaultDurationMs);
        return [
            // Step 1 — edge sweep with the face hidden.
            {
                durationMs: sweepMs,
                setup: () => {
                    circle.drawStartAngle = explicitStart;
                    circle.faceAlpha = 0;
                    circle.drawProgress = 0;
                },
                tick: (progress) => { circle.drawProgress = progress; },
                finalise: () => { circle.drawProgress = 1; },
            },
            // Step 2 — face fade-in over the now-complete arc.
            {
                durationMs: fillMs,
                tick: (progress) => { circle.faceAlpha = progress; },
                finalise: () => {
                    circle.faceAlpha = 1;
                    circle.drawProgress = 1;
                    circle.drawStartAngle = 0;
                    circle.visible = true;
                },
            },
        ];
    }
}

registerAnimation(new CircleCompassAnimation());
