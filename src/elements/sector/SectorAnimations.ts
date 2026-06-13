// Animations targeting SectorElement (and its ArcElement subclass).
// See ../Animations.ts for the abstract base + registry mechanics.

import {Animation, AllAnimations, IAnimationStep, registerAnimation} from "../Animations";
import {GeomElement} from "../GeomElement";
import {Slate} from "../../Slate";
import {SectorElement} from "./SectorElement";

// Same sweep rate as Circle.compass so an angle arc feels like the
// same instrument; a typical quarter-turn marker (~π/2) sweeps in
// ~500 ms. Min duration keeps a narrow angle from blinking past.
const DEFAULT_SWEEP_RATE_RAD_PER_MS = 0.003;
const MIN_SWEEP_MS = 250;
const DEFAULT_SECTOR_FILL_MS = 500;

// A.Sector.sweep — the arc grows from the A arm toward the B arm by
// driving drawProgress. Args: none. Duration = |arcAngle| / rate.
//
// Two-step when the sector has a face (sweep then face fade-in,
// mirroring Circle.compass); a face-less sector skips the fill step
// entirely (#81 pattern) — which is the common case for zero-color
// angle markers that render gold only while animating.
export class SectorSweepAnimation extends Animation {
    public animationMethod = AllAnimations.SECTOR_SWEEP;
    public name = "Sector.sweep";
    public elementType = SectorElement;
    public defaultRate = DEFAULT_SWEEP_RATE_RAD_PER_MS;
    public defaultDurationMs = DEFAULT_SECTOR_FILL_MS;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        const sector = target as SectorElement;
        // arcSpan() reflects what's actually drawn (the major arc for a
        // reflex marker), so the duration matches the visible sweep.
        const arcAngle = sector.arcSpan();
        const sweepMs = Math.max(MIN_SWEEP_MS, arcAngle / this.defaultRate);
        const fullRestore = () => {
            sector.faceAlpha = 1;
            sector.drawProgress = 1;
            sector.visible = true;
        };
        const sweep: IAnimationStep = {
            durationMs: sweepMs,
            setup: () => {
                sector.faceAlpha = 0;
                sector.drawProgress = 0;
            },
            tick: (progress) => { sector.drawProgress = progress; },
            finalise: () => { sector.drawProgress = 1; },
        };
        if (sector.faceColor == null) {
            sweep.finalise = fullRestore;
            return [sweep];
        }
        const fillMs = Math.min(sweepMs / 2, this.defaultDurationMs);
        return [
            sweep,
            {
                durationMs: fillMs,
                tick: (progress) => { sector.faceAlpha = progress; },
                finalise: fullRestore,
            },
        ];
    }
}

registerAnimation(new SectorSweepAnimation());
