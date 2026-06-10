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
// Duration: 2π / rate. Default rate 0.005 rad/ms (full circle ≈ 1.25s).
export class CircleCompassAnimation extends Animation {
    public animationMethod = AllAnimations.CIRCLE_COMPASS;
    public name = "Circle.compass";
    public elementType = CircleElement;
    public defaultRate = DEFAULT_ARC_RATE_RAD_PER_MS;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        const circle = target as CircleElement;
        // Pick the natural start angle from centre→B, unless the slide
        // explicitly overrides via args.startAngle.
        const explicitStart = (args && typeof args.startAngle === "number")
            ? args.startAngle
            : Math.atan2(circle.B.y - circle.Center.y, circle.B.x - circle.Center.x);
        const durationMs = (2 * Math.PI) / this.defaultRate;
        return [{
            durationMs,
            setup: () => {
                circle.drawStartAngle = explicitStart;
            },
            tick: (progress) => {
                circle.drawProgress = progress;
            },
            finalise: () => {
                circle.drawProgress = 1;
                circle.drawStartAngle = 0;
                circle.visible = true;
            },
        }];
    }
}

registerAnimation(new CircleCompassAnimation());
