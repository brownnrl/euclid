// Slide-transition animator. Drives Animation.build() steps over
// time via requestAnimationFrame, calling slate.drawElements() each
// frame so the per-element drawProgress drives the partial geometry.
// Cascade mode plays one step at a time in slide order; parallel
// mode runs them all concurrently.
//
// Owned lazily by a Slate (created on first animateTo() call) and
// reused across transitions; cancel() resolves the in-flight promise
// and finalises every active step so a rapid Next/Prev sequence
// preempts the previous animation cleanly.

import {Slate} from "./Slate";
import {findAnimation, IAnimationStep, Animation} from "./elements/Animations";
import {GeomElement} from "./elements/GeomElement";
import {ISlideAnimation} from "./index";

// Wrapped step with mutable progress state. The animator manages
// these; concrete Animations don't see them.
interface ActiveStep {
    step: IAnimationStep;
    elapsedMs: number;
    started: boolean;
    finalised: boolean;
}

// Wrapped per-target group of steps. Each ISlideAnimation entry maps
// to one Group, and Animation.build() returns the inner step list.
// Cascade mode runs groups in order; within a group, steps are always
// sequential (an Animation that wants edge-then-fade returns 2 steps).
interface ActiveGroup {
    target: GeomElement;
    steps: ActiveStep[];
    currentIndex: number;        // which step is in flight; advances as each finalises
    finishedAtMs?: number;       // when the last step finalised (for cascadeGapMs pacing)
}

// Time source: performance.now() when available (monotonic, high-res,
// unaffected by NTP adjustments and not subject to wall-clock skew).
// Falls back to Date.now() in headless environments without
// performance.now(). dt is computed from the diff between consecutive
// frames and clamped (see MAX_DT_MS) so background-tab pauses or
// long single-frame stalls don't cause the next frame to advance by
// a multi-second jump — hardware with different refresh rates
// (60 Hz / 120 Hz / 144 Hz) all see the same total wall-clock
// duration because progress is dt-driven, not frame-count driven.
const HAS_RAF = (typeof requestAnimationFrame === "function");
const NOW: () => number = (typeof performance !== "undefined" && performance.now)
    ? () => performance.now()
    : () => Date.now();
// Clamp per-frame dt. Prevents a backgrounded tab's accumulated
// pause-time from collapsing an entire animation into one frame on
// resume; also smooths very long single-frame stalls (e.g. GC pause).
// 100 ms = 6 frames at 60 Hz worth of catch-up — enough for normal
// jitter, small enough that a hidden tab resuming after 30 s doesn't
// blink through 30 s of construction in one paint.
const MAX_DT_MS = 100;

// Duration of the post-animation emphasis fade-out. Trims the visible
// "snap from 6 px to highlight thickness" into a smooth taper so the
// settle isn't jarring when the underlying element is also slide-
// highlighted (the polygon ABC over the highlighted AB / AC / BC is
// the canonical case).
const EMPHASIS_FADE_OUT_MS = 250;

export class SlateAnimator {
    private slate: Slate;
    // The currently-running set of groups. Empty when idle.
    private groups: ActiveGroup[] = [];
    private mode: "cascade" | "parallel" = "cascade";
    private resolveCurrent: (() => void) | null = null;
    // For cascade, this index points at the group currently playing.
    private cascadeIndex: number = 0;
    private rafId: number | null = null;
    private lastFrameMs: number = 0;
    // Emphasis fade-out phase tracking. After every group's last step
    // finalises, the animator enters this phase and ticks each target's
    // emphasisAmount from 1 → 0 over EMPHASIS_FADE_OUT_MS before
    // resolving the promise.
    private fadingOut: boolean = false;
    private fadeStartMs: number = 0;

    constructor(slate: Slate) {
        this.slate = slate;
    }

    // Public entry point. Cancels any in-flight run, computes the
    // diff between current state and the target, builds steps for
    // every slide-listed animation, kicks off the rAF loop, and
    // returns a promise that resolves when every step has finalised
    // (or cancel() is called).
    run(
        targetVisible: Set<string>,
        targetHighlighted: Set<string>,
        slideAnimations: ISlideAnimation[],
        mode: "cascade" | "parallel",
    ): Promise<void> {
        // Preempt any in-flight run so the new transition starts cleanly.
        if (this.groups.length > 0) this.cancel();

        // Build the new groups from the slide's animation list, in
        // array order. Newly-visible elements without an explicit
        // animation entry pop in instantly (4b parity) — handled by
        // the caller before invoking run().
        const groups: ActiveGroup[] = [];
        const config = this.slate.animationConfig || {};
        const speedMul = config.speedMultiplier != null ? config.speedMultiplier : 1;
        const reduced = config.reducedMotion === true || speedMul === 0;
        for (const entry of slideAnimations || []) {
            const target = this.slate.lookupElement(entry.elem);
            if (target == null) {
                // #151 — say so. A silent skip here is how a stale target
                // survives a figure refactor: the animation entry stays in
                // the deck, resolves to nothing, and simply never plays.
                this.slate.reportDiagnostic({
                    code: "unknown-element",
                    key: String(entry.elem),
                    message: "animation targets '" + entry.elem +
                        "', but no element or alias resolves to it \u2014 " +
                        "the step is skipped. Check for a typo, or for a " +
                        "target left behind by a figure change.",
                    detail: { elem: entry.elem },
                });
                continue;
            }
            const animation: Animation | null = findAnimation(entry.name);
            if (animation == null) {
                // #154 — reported here rather than inside findAnimation,
                // which has no slate to attribute it to.
                this.slate.reportDiagnostic({
                    code: "unknown-animation",
                    key: String(entry.name),
                    message: "unknown animation '" + String(entry.name) +
                        "' \u2014 falling back to instant",
                    detail: { name: String(entry.name), elem: entry.elem },
                });
                continue;
            }
            // Type guard: console.warn-and-skip when the animation's
            // elementType doesn't match the actual target class.
            if (!(target instanceof (animation.elementType as any))) {
                this.slate.reportDiagnostic({
                    code: "animation-type-mismatch",
                    key: String(animation.name) + "|" + String(entry.elem),
                    message: "animation '" + animation.name +
                        "' targets " + (animation.elementType as any).name +
                        " but element '" + entry.elem + "' is " +
                        (target.constructor as any).name +
                        " \u2014 falling back to instant",
                    detail: { animation: String(animation.name), elem: entry.elem },
                });
                target.drawProgress = 1;
                target.visible = true;
                continue;
            }
            const builtSteps: IAnimationStep[] = animation.build(target, this.slate, entry.args || {}) || [];
            // Compute each step's resolved duration per the precedence
            // chain: entry.durationMs > config.durations[name] >
            // config.rates[name] > step.durationMs (already populated
            // by build() from the animation's defaults).
            const resolvedSteps: ActiveStep[] = builtSteps.map(step => ({
                step: {
                    ...step,
                    durationMs: resolveDuration(
                        step.durationMs,
                        entry.durationMs,
                        config.durations && config.durations[animation.name],
                    ),
                },
                elapsedMs: 0,
                started: false,
                finalised: false,
            }));
            groups.push({ target, steps: resolvedSteps, currentIndex: 0 });
        }

        // Visibility / highlight target state always applies — the
        // animation only governs HOW newly-visible elements appear.
        // Apply hidden / highlighted state synchronously; visible flips
        // are deferred for elements being animated because their setup
        // hook decides what to do with them.
        const animatedTargets = new Set<GeomElement>(groups.map(g => g.target));
        for (const e of this.slate.elements) {
            if (e.name == null) continue;
            const willBeVisible = targetVisible.has(e.name);
            const willBeHighlighted = targetHighlighted.has(e.name);
            if (animatedTargets.has(e)) {
                // Animation owns the visible flag during its run.
                // Deferred reveal (#83): the target stays hidden until
                // its own first step starts — drawProgress only gates
                // the edge, so a pre-revealed target would render its
                // face fill and name label at full strength while
                // earlier cascade steps play. _startStep flips it
                // visible; finalise() restores the final state on
                // every exit path.
                e.shouldHighlight = willBeHighlighted;
                e.drawProgress = 0;
                e.visible = false;
            } else {
                // Instant flip — matches 4b behaviour.
                e.visible = willBeVisible;
                e.shouldHighlight = willBeHighlighted;
                e.drawProgress = 1;
            }
        }

        // Reduced motion / speedMultiplier 0 / no groups: fast path.
        // Finalise everything synchronously and return a resolved
        // promise so the controller can flip the caption immediately.
        if (reduced || groups.length === 0) {
            for (const g of groups) {
                for (const as of g.steps) {
                    if (as.step.setup && !as.started) as.step.setup();
                    as.step.finalise();
                    as.finalised = true;
                }
            }
            // Don't blanket-clear ephemerals here: normal (animated)
            // completion never does, and transient helpers self-remove in
            // their own finalise() (e.g. superpose). Clearing would wipe an
            // animation's *persisted* ephemerals (a cloneAside case-variant
            // copy) for reduced-motion users only — #99.
            this.slate.drawElements();
            return Promise.resolve();
        }

        // NOTE: targets are emphasised in _startStep when their own step
        // begins (not here at run start), so an un-started cascade target
        // stays hidden until its turn — otherwise, since #100, a
        // hidden-but-emphasised target would draw fully from t=0 (#104).
        // The emphasis still makes the target's render pop over any
        // slide-highlighted siblings throughout its own animation.

        this.groups = groups;
        this.mode = mode;
        this.cascadeIndex = 0;
        this.lastFrameMs = NOW();
        return new Promise<void>(resolve => {
            this.resolveCurrent = resolve;
            this._kickoff();
            this._scheduleFrame();
        });
    }

    // Drop the during-animation emphasis bumps from every group target.
    // Called once on completion or cancel so the slide settles back
    // into its plain highlight / not-highlighted steady state.
    private _clearAnimatedEmphasis(): void {
        for (const g of this.groups) {
            g.target.emphasized = false;
        }
    }

    // Cancel any in-flight run: finalise every step that started, wipe
    // ephemerals as a safety net, resolve the pending promise.
    cancel(): void {
        if (this.groups.length === 0) return;
        for (const g of this.groups) {
            for (let i = 0; i < g.steps.length; i++) {
                const as = g.steps[i];
                if (as.finalised) continue;
                // Run setup if we never got to it, so finalise sees a
                // consistent post-setup state.
                if (as.step.setup && !as.started) {
                    as.step.setup();
                    as.started = true;
                }
                as.step.finalise();
                as.finalised = true;
            }
        }
        this._clearAnimatedEmphasis();
        this.slate.clearEphemerals();
        this.slate.drawElements();
        this.groups = [];
        this.fadingOut = false;
        if (this.rafId != null && typeof cancelAnimationFrame === "function") {
            cancelAnimationFrame(this.rafId);
        }
        this.rafId = null;
        if (this.resolveCurrent) {
            this.resolveCurrent();
            this.resolveCurrent = null;
        }
    }

    // Fire any pending setup() hooks for the steps that are about to
    // tick on the very first frame.
    private _kickoff(): void {
        if (this.mode === "cascade") {
            this._startGroupIndex(0);
        } else {
            // Parallel: start the first step of every group at once.
            for (const g of this.groups) {
                this._startStep(g, 0);
            }
        }
    }

    private _startGroupIndex(idx: number): void {
        if (idx >= this.groups.length) return;
        this._startStep(this.groups[idx], 0);
    }

    private _startStep(g: ActiveGroup, stepIdx: number): void {
        if (stepIdx >= g.steps.length) return;
        const as = g.steps[stepIdx];
        if (as.started) return;
        // Deferred reveal (#83): the target was held invisible through
        // any earlier cascade steps; it appears the moment its own
        // first step begins. The emphasis bump is applied here too (not
        // at run start) so an un-started cascade target stays hidden —
        // since #100 a hidden-but-emphasised element would otherwise
        // draw fully from t=0 (#104). setup() runs after this, so an
        // animation that hides the target to render ephemeral proxies
        // instead can still do so.
        if (stepIdx === 0) {
            g.target.visible = true;
            g.target.emphasized = true;
        }
        if (as.step.setup) as.step.setup();
        as.started = true;
        g.currentIndex = stepIdx;
    }

    private _scheduleFrame(): void {
        if (HAS_RAF) {
            this.rafId = requestAnimationFrame(now => this._frame(now));
        } else {
            // No rAF (tests, node): synthesize a frame ~16ms in the
            // future via setTimeout. Mocha tests stub this differently.
            const t = NOW() + 16;
            this.rafId = (setTimeout(() => this._frame(t), 16) as any);
        }
    }

    private _frame(nowMs: number): void {
        if (this.groups.length === 0) return;
        const config = this.slate.animationConfig || {};
        const speedMul = config.speedMultiplier != null ? config.speedMultiplier : 1;
        const cascadeGap = config.cascadeGapMs || 0;
        // Real elapsed wall-clock dt, clamped to MAX_DT_MS so a
        // backgrounded tab or long GC pause doesn't fast-forward
        // through the rest of the animation in a single frame.
        let rawDt = nowMs - this.lastFrameMs;
        if (rawDt < 0) rawDt = 0;
        if (rawDt > MAX_DT_MS) rawDt = MAX_DT_MS;
        const dt = rawDt * speedMul;
        this.lastFrameMs = nowMs;

        // Advance the active step(s).
        if (this.mode === "cascade") {
            this._tickCascade(dt, nowMs, cascadeGap);
        } else {
            this._tickParallel(dt, nowMs);
        }

        // Always redraw so partial geometry shows up. Ephemerals
        // drawn alongside permanent elements.
        this.slate.drawElements();

        // Once every step's tick has finalised, enter the fade-out
        // phase: tick each target's emphasisAmount from 1 → 0 over
        // EMPHASIS_FADE_OUT_MS, redrawing each frame. Only resolves
        // once the fade completes.
        if (this._allFinalised()) {
            if (!this.fadingOut) {
                this.fadingOut = true;
                this.fadeStartMs = nowMs;
            }
            const fadeElapsed = nowMs - this.fadeStartMs;
            const fp = fadeElapsed >= EMPHASIS_FADE_OUT_MS
                ? 1 : fadeElapsed / EMPHASIS_FADE_OUT_MS;
            const ea = 1 - fp;
            for (const g of this.groups) {
                g.target.emphasisAmount = ea;
            }
            this.slate.drawElements();
            if (fp >= 1) {
                this._clearAnimatedEmphasis();
                this.groups = [];
                this.fadingOut = false;
                this.rafId = null;
                if (this.resolveCurrent) {
                    this.resolveCurrent();
                    this.resolveCurrent = null;
                }
                return;
            }
            this._scheduleFrame();
            return;
        }
        this._scheduleFrame();
    }

    private _tickCascade(dt: number, nowMs: number, cascadeGap: number): void {
        // Advance the current cascade group's current step. When it
        // finalises, optionally wait cascadeGapMs before advancing
        // either to the next step in the same group or to the next
        // group's first step.
        while (this.cascadeIndex < this.groups.length) {
            const g = this.groups[this.cascadeIndex];
            const as = g.steps[g.currentIndex];
            if (!as) {
                this.cascadeIndex += 1;
                if (this.cascadeIndex < this.groups.length) {
                    this._startStep(this.groups[this.cascadeIndex], 0);
                }
                continue;
            }
            // Honour cascadeGap between groups.
            if (as.finalised) {
                if (g.finishedAtMs == null) g.finishedAtMs = nowMs;
                if (nowMs - g.finishedAtMs < cascadeGap) return;
                // Advance.
                if (g.currentIndex + 1 < g.steps.length) {
                    this._startStep(g, g.currentIndex + 1);
                } else {
                    this.cascadeIndex += 1;
                    if (this.cascadeIndex < this.groups.length) {
                        this._startStep(this.groups[this.cascadeIndex], 0);
                    }
                }
                continue;
            }
            // Tick this step.
            this._tickStep(g.target, as, dt, nowMs);
            return;   // one step per frame in cascade mode
        }
    }

    private _tickParallel(dt: number, nowMs: number): void {
        for (const g of this.groups) {
            const as = g.steps[g.currentIndex];
            if (!as) continue;
            if (as.finalised) {
                if (g.currentIndex + 1 < g.steps.length) {
                    this._startStep(g, g.currentIndex + 1);
                }
                continue;
            }
            this._tickStep(g.target, as, dt, nowMs);
        }
    }

    private _tickStep(target: GeomElement, as: ActiveStep, dt: number, nowMs: number): void {
        if (!as.started) {
            if (as.step.setup) as.step.setup();
            as.started = true;
        }
        as.elapsedMs += dt;
        const total = as.step.durationMs;
        let p = total > 0 ? as.elapsedMs / total : 1;
        if (p > 1) p = 1;
        if (p < 0) p = 0;
        as.step.tick(p, dt, as.elapsedMs);
        if (p >= 1) {
            as.step.finalise();
            as.finalised = true;
        }
    }

    private _allFinalised(): boolean {
        for (const g of this.groups) {
            for (const as of g.steps) {
                if (!as.finalised) return false;
            }
        }
        return true;
    }
}

// Resolution order, top-down, returning the first defined non-undefined.
function resolveDuration(stepDefault: number, slideOverride?: number, configOverride?: number): number {
    if (slideOverride != null) return slideOverride;
    if (configOverride != null) return configOverride;
    return stepDefault;
}
