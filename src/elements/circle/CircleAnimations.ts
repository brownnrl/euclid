// Animations targeting CircleElement. See ../Animations.ts for the
// abstract base + registry mechanics.

import {Animation, AllAnimations, IAnimationStep, registerAnimation} from "../Animations";
import {GeomElement} from "../GeomElement";
import {Slate} from "../../Slate";
import {CircleElement} from "./CircleElement";
import {PointElement} from "../point/PointElement";
import {LineElement} from "../line/LineElement";
import {PolygonElement} from "../polygon/PolygonElement";

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
        const fullRestore = () => {
            circle.faceAlpha = 1;
            circle.drawProgress = 1;
            circle.drawStartAngle = 0;
            circle.visible = true;
        };
        // Step 1 — edge sweep with the face hidden.
        const sweep: IAnimationStep = {
            durationMs: sweepMs,
            setup: () => {
                circle.drawStartAngle = explicitStart;
                circle.faceAlpha = 0;
                circle.drawProgress = 0;
            },
            tick: (progress) => { circle.drawProgress = progress; },
            finalise: () => { circle.drawProgress = 1; },
        };
        // A face-less circle has nothing to fade — scheduling the
        // fill step anyway would be pure dead time in the middle of
        // a cascade (#81). Run the sweep alone, with its finalise
        // doing the full restore.
        if (circle.faceColor == null) {
            sweep.finalise = fullRestore;
            return [sweep];
        }
        // Fill ~twice as fast as the sweep, capped by the class-level
        // default so a tiny circle doesn't yield a blink-of-an-eye fade.
        const fillMs = Math.min(sweepMs / 2, this.defaultDurationMs);
        return [
            sweep,
            // Step 2 — face fade-in over the now-complete arc.
            {
                durationMs: fillMs,
                tick: (progress) => { circle.faceAlpha = progress; },
                finalise: fullRestore,
            },
        ];
    }
}

registerAnimation(new CircleCompassAnimation());

// A.Circle.compassTransfer — Euclid I.2 (copy a length to a point) as one
// animation. The target is the declared RADIUS circle the deck keeps: a
// `circle;radius;P,C,D` (centre P, radius the length |CD| to copy). The
// macro reads P + the source CD straight off the target, draws the rigorous
// I.2 walk that justifies that radius — join, the two I.1 circles + the
// equilateral triangle, the two produced sides, and the two lay-off circles —
// nine steps, all transitory gold EPHEMERALS
// (created in step-1 setup, cleared in the last finalise), then reveals the
// circle. The result is a circle, so its scaffolding side is a free visual
// choice (args.side, default +1). A deck calls one entry instead of declaring
// and sequencing the ~8-element rig.
//
// Geometry (P = centre, C = near source end, D = far, r = |CD|):
//   T = equilateral apex of P,C        M = C + r·unit(C−T)   (CM = r, on circle(C,r))
//   N = T + (|TC|+r)·unit(P−T)         (PN = r, on circle(T,|TM|)) → the kept radius
const CIRCLE_TRANSFER_SWEEP_RATE = 0.0055;   // rad/ms — brisk for a long walk
const CIRCLE_TRANSFER_TRACE_RATE = 0.3;      // px/ms for the straightedge traces

function equilateralApex(A: PointElement, B: PointElement, side: number): { x: number, y: number } {
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    const dx = B.x - A.x, dy = B.y - A.y;
    const len = Math.hypot(dx, dy) || 1;
    const h = len * Math.sqrt(3) / 2;
    // perpendicular unit (rotate the base 90°), times the chosen side
    return { x: mx + side * h * (-dy / len), y: my + side * h * (dx / len) };
}

export class CircleCompassTransferAnimation extends Animation {
    public animationMethod = AllAnimations.CIRCLE_COMPASS_TRANSFER;
    public name = "Circle.compassTransfer";
    public elementType = CircleElement;
    public defaultRate = CIRCLE_TRANSFER_SWEEP_RATE;
    public defaultDurationMs = DEFAULT_CIRCLE_FILL_MS;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        const circ = target as CircleElement;
        const P = circ.Center;
        const s0 = circ.A, s1 = circ.B;
        const instant = (): IAnimationStep[] => [{
            durationMs: 0, tick: () => {},
            finalise: () => { circ.faceAlpha = 1; circ.drawProgress = 1; circ.visible = true; },
        }];
        // Need a radius defined by two distinct source points (the length to
        // copy), distinct from the centre — i.e. circle;radius;P,C,D.
        if (s0 == null || s1 == null || s0 === P || s1 === P || s0.distance(s1) < 1e-6) {
            slate.reportDiagnostic({
                code: "bad-animation-args",
                key: "Circle.compassTransfer|" + String(circ.name),
                message: "Circle.compassTransfer: needs a radius defined by two "
                    + "points distinct from the centre (circle;radius;centre,p1,p2) — skipping",
                detail: { animation: "Circle.compassTransfer", elem: String(circ.name) },
            });
            return instant();
        }
        const plane = (P as any).AP || circ.AP;
        const r = s0.distance(s1);
        // Near source end joins the centre; far end is the length's reach.
        const C = (P.distance(s0) <= P.distance(s1)) ? s0 : s1;
        const D = (C === s0) ? s1 : s0;
        const side = (args && (args.side === 1 || args.side === -1)) ? args.side : 1;

        const t = equilateralApex(P, C, side);
        const T = new PointElement(); T.x = t.x; T.y = t.y; (T as any).AP = plane;
        const TC = Math.hypot(C.x - t.x, C.y - t.y) || 1;
        // M = C + r·unit(C − T); N = T + (TC + r)·unit(P − T)
        const u1x = (C.x - t.x) / TC, u1y = (C.y - t.y) / TC;
        const M = new PointElement(); M.x = C.x + r * u1x; M.y = C.y + r * u1y; (M as any).AP = plane;
        const TP = Math.hypot(P.x - t.x, P.y - t.y) || 1;
        const u2x = (P.x - t.x) / TP, u2y = (P.y - t.y) / TP;
        const N = new PointElement(); N.x = t.x + (TC + r) * u2x; N.y = t.y + (TC + r) * u2y; (N as any).AP = plane;

        // Transitory gold scaffolding (bare ephemerals).
        const join  = new LineElement({ A: P, B: C });
        const tri   = new PolygonElement(); tri.V = [P, C, T];
        const prodM = new LineElement({ A: C, B: M });   // produced side, C → M
        const prodN = new LineElement({ A: P, B: N });   // produced side, P → N (carries the result)
        const circC  = new CircleElement({ C: C, B: D, AP: plane });   // circle(C, r): thru D and M
        const circT  = new CircleElement({ C: T, B: M, AP: plane });   // circle(T, |TM|): thru M and N
        const circEp = new CircleElement({ C: P, B: C, AP: plane });   // I.1 circle: centre P thru C
        const circEc = new CircleElement({ C: C, B: P, AP: plane });   // I.1 circle: centre C thru P
        const transitory: GeomElement[] = [join, tri, prodM, prodN];
        // The four construction circles, in walk order (2 equilateral, 2 lay-off).
        const circles: CircleElement[] = [circEp, circEc, circC, circT];
        for (const e of (transitory as GeomElement[]).concat(circles)) {
            (e as any).edgeColor = null; (e as any).faceColor = null;
            (e as any).nameColor = null; (e as any).vertexColor = null;
            e.emphasized = true;   // paints in the gold highlight stroke
        }
        // keepCircles: name the four circles so they persist as real, named
        // elements (rather than being wiped on slide advance) — a later slide
        // can re-show / count them. Order matches I.23's [t1Ka, t1Kc, t1Kc2, t1KT].
        const keepNames: string[] | null =
            (args && Array.isArray(args.keepCircles)) ? args.keepCircles : null;
        if (keepNames) circles.forEach((c, i) => { if (keepNames[i]) c.name = String(keepNames[i]); });
        const isKept = (c: CircleElement) => keepNames != null && c.name != null;

        const sweepMs = (2 * Math.PI) / this.defaultRate;
        const traceMs = (a: PointElement, b: PointElement) =>
            Math.max(120, a.distance(b) / CIRCLE_TRANSFER_TRACE_RATE);
        const lineStep = (ln: LineElement, ms: number): IAnimationStep => ({
            durationMs: ms,
            setup: () => { ln.drawProgress = 0; },
            tick: (p) => { ln.drawProgress = p; },
            finalise: () => { ln.drawProgress = 1; },
        });
        const sweepStep = (c: CircleElement): IAnimationStep => ({
            durationMs: sweepMs,
            setup: () => { c.drawStartAngle = Math.atan2(c.B.y - c.Center.y, c.B.x - c.Center.x); c.drawProgress = 0; },
            tick: (p) => { c.drawProgress = p; },
            finalise: () => { c.drawProgress = 1; },
        });
        // Clear the transitory scaffolding; kept circles persist (the slideshow's
        // visible-set hides them on advance and can re-show them for a count).
        const clearScaffold = () => {
            for (const e of transitory) slate.removeEphemeral(e);
            for (const c of circles) if (!isKept(c)) slate.removeEphemeral(c);
        };

        // Step 1 — join P→C; also registers all scaffolding and hides the
        // result circle until the reveal.
        const step1 = lineStep(join, traceMs(P, C));
        step1.setup = () => {
            circ.drawProgress = 0; circ.faceAlpha = 0;   // result stays dark until reveal
            for (const e of transitory) { slate.addEphemeral(e); (e as any).drawProgress = 0; }
            for (const c of circles) {
                c.drawProgress = 0;
                if (isKept(c)) {
                    slate.addElement(c);                 // persist as a real, named element
                    slate.setInitiallyHidden(c.name!);   // keep it out of the post-presentation figure
                    c.visible = true;                    // but show it now, through the walk
                } else {
                    slate.addEphemeral(c);
                }
            }
            join.drawProgress = 0;
        };

        const steps: IAnimationStep[] = [
            step1,
            // Steps 2,3 — the two I.1 compass circles that fix the equilateral apex.
            sweepStep(circEp),
            sweepStep(circEc),
            // Step 4 — the equilateral triangle PCT traces.
            { durationMs: traceMs(P, C) + traceMs(C, T),
              setup: () => { tri.drawProgress = 0; },
              tick: (p) => { tri.drawProgress = p; },
              finalise: () => { tri.drawProgress = 1; } },
            // Steps 5,6 — produce the two sides.
            lineStep(prodM, traceMs(C, M)),
            lineStep(prodN, traceMs(P, N)),
            // Steps 7,8 — the two lay-off compass circles.
            sweepStep(circC),
            sweepStep(circT),
        ];
        // Step 7 — reveal the result radius circle, clearing the scaffold as it lands.
        const reveal: IAnimationStep = {
            durationMs: sweepMs,
            setup: () => {
                circ.drawStartAngle = Math.atan2(circ.B.y - P.y, circ.B.x - P.x);
                circ.drawProgress = 0; circ.faceAlpha = 0; circ.visible = true;
            },
            tick: (p) => { circ.drawProgress = p; },
            finalise: () => { circ.drawProgress = 1; circ.faceAlpha = 1; circ.visible = true; clearScaffold(); },
        };
        steps.push(reveal);
        return steps;
    }
}

registerAnimation(new CircleCompassTransferAnimation());
