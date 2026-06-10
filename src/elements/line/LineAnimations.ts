// Animations targeting LineElement. See ../Animations.ts for the
// abstract base + registry mechanics.

import {Animation, AllAnimations, IAnimationStep, registerAnimation} from "../Animations";
import {GeomElement} from "../GeomElement";
import {Slate} from "../../Slate";
import {LineElement} from "./LineElement";

// Default trace rate in px/ms. A 200-px segment draws in 1 second at
// 0.2; faster speeds feel snappy for short construction lines.
const DEFAULT_LINE_RATE_PX_PER_MS = 0.5;

// Common helper: trace the target line from A toward B by driving
// drawProgress. Used by both StraightEdgeConnect (the canonical
// straightedge stroke between two existing points) and
// StraightEdgeExtend (same shape, just visually framed as extending
// past an endpoint instead of joining two existing ones).
function traceLine(target: LineElement, rate: number): IAnimationStep {
    // duration = length / rate, clamped low so an extremely short
    // line still gets a perceptible draw.
    const dx = target.B.x - target.A.x;
    const dy = target.B.y - target.A.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const durationMs = Math.max(120, length / rate);
    return {
        durationMs,
        tick: (progress) => { target.drawProgress = progress; },
        finalise: () => {
            target.drawProgress = 1;
            target.visible = true;
        },
    };
}

// A.Line.straightEdgeConnect — pencil stroke from A toward B.
// Args: none. Duration = length × default rate (0.5 px/ms).
export class LineStraightEdgeConnectAnimation extends Animation {
    public animationMethod = AllAnimations.LINE_STRAIGHT_EDGE_CONNECT;
    public name = "Line.straightEdgeConnect";
    public elementType = LineElement;
    public defaultRate = DEFAULT_LINE_RATE_PX_PER_MS;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        return [traceLine(target as LineElement, this.defaultRate)];
    }
}

// A.Line.straightEdgeExtend — for Line.extend constructions where one
// endpoint sits on an existing line and the other is the projected
// new endpoint. v1 renders the same trace as StraightEdgeConnect;
// future richer variants might pivot a straightedge guide against the
// existing line first.
export class LineStraightEdgeExtendAnimation extends Animation {
    public animationMethod = AllAnimations.LINE_STRAIGHT_EDGE_EXTEND;
    public name = "Line.straightEdgeExtend";
    public elementType = LineElement;
    public defaultRate = DEFAULT_LINE_RATE_PX_PER_MS;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        return [traceLine(target as LineElement, this.defaultRate)];
    }
}

registerAnimation(new LineStraightEdgeConnectAnimation());
registerAnimation(new LineStraightEdgeExtendAnimation());
