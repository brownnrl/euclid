// Animations targeting PointElement. See ../Animations.ts for the
// abstract base + registry mechanics.

import {Animation, AllAnimations, IAnimationStep, registerAnimation} from "../Animations";
import {GeomElement} from "../GeomElement";
import {Slate} from "../../Slate";
import {PointElement} from "./PointElement";

// A.Point.appear — the marker radius scales from 0 to its final value
// over a short duration. Args: none. Used as the simplest reveal for a
// point that lands at a constructed position (e.g. Joyce's "point C at
// which the circles cut").
export class PointAppearAnimation extends Animation {
    public animationMethod = AllAnimations.POINT_APPEAR;
    public name = "Point.appear";
    public elementType = PointElement;
    public defaultDurationMs = 200;

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

registerAnimation(new PointAppearAnimation());
