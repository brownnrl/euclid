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


// #137 — move a point ALONG A PATH for illustration.
//
// Point.slide answers "put this slider at that value"; this answers "watch
// this point travel". The motivating case is I.31's construction guide: the
// apex A must stay on one side of DC, and dragging it across selects the
// mirror intersection so the "parallel" stops being parallel. The deck could
// only invite a manual drag. This animates the trip and brings A back, so the
// hypothesis fails visibly without the reader having to do anything.
//
// The path always begins at the point's CURRENT position — the point sets
// off from where it stands rather than teleporting to a path start.
//
//   { elem: "A", name: A.Point.followPath, args: { via: [[240, 210]] } }
//   { elem: "A", name: A.Point.followPath, args: { via: ["E2"] } }
//   { elem: "P", name: A.Point.followPath, args: { along: "CD", settle: true } }
//   { elem: "A", name: A.Point.followPath, args: { arc: { center: "DC" } } }
//
// args:
//   via     waypoint list — a straight-leg path. Each entry is an element
//           name (its position is read at setup) or an [x, y] / [x, y, z]
//           literal.
//   along   sugar for a line/segment: appends its two endpoints as waypoints.
//   arc     swing the point around a centre instead of walking legs:
//             center  element name, or [x, y]. A POINT is used as-is; a
//                     LINE uses its MIDPOINT, so `center: "DC"` means
//                     "swing about the middle of DC" without declaring a
//                     midpoint element.
//             radius  optional; defaults to the point's CURRENT distance
//                     from the centre, so the point starts on its own arc
//                     and the figure is not disturbed at t=0.
//             sweep   degrees to travel, default 180. Sign picks direction.
//           An arc reads far better than a dogleg for "carry this point to
//           the other side": swinging A about the midpoint of DC sweeps it
//           across the line along a natural path rather than a V.
//   settle  false (default) — an out-and-back: the point traverses the path
//           over the first half and retraces it over the second, finishing
//           exactly where it started. This is what "purely illustrative"
//           means, and it is why a constrained point is left undisturbed.
//           true — the point ends at the far end of the path.
//
// Note on constrained points: a slider re-projects itself onto its own locus
// in update(), so driving one off its line does nothing useful. This is aimed
// at free points, which is also the case the illustration wants.
export class PointFollowPathAnimation extends Animation {
    public animationMethod = AllAnimations.POINT_FOLLOW_PATH;
    public name = "Point.followPath";
    public elementType = PointElement;
    public defaultDurationMs = 1200;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        const pt = target as PointElement;
        const settle = !!(args && args.settle);

        // Waypoints resolved at setup, so earlier slides' motion has settled.
        let path: number[][] = [];
        let seg: number[] = [];      // cumulative length at each waypoint
        let total = 0;
        // Arc mode (args.arc): centre, radius and the angular span, all
        // resolved at setup for the same reason.
        let arcOn = false;
        let cx = 0, cy = 0, cz = 0, radius = 0, a0 = 0, sweepRad = 0;

        const at = (t: number): number[] => {
            if (arcOn) {
                const a = a0 + sweepRad * Math.max(0, Math.min(1, t));
                return [cx + radius * Math.cos(a), cy + radius * Math.sin(a), cz];
            }
            if (path.length < 2) return path[0] || [pt.x, pt.y, pt.z];
            if (total <= 1e-9) return path[0];
            const d = Math.max(0, Math.min(1, t)) * total;
            let i = 1;
            while (i < seg.length - 1 && seg[i] < d) i++;
            const span = seg[i] - seg[i - 1];
            const local = span > 1e-9 ? (d - seg[i - 1]) / span : 0;
            const a = path[i - 1], b = path[i];
            return [a[0] + (b[0] - a[0]) * local,
                    a[1] + (b[1] - a[1]) * local,
                    a[2] + (b[2] - a[2]) * local];
        };

        const apply = (t: number) => {
            const q = at(t);
            pt.x = q[0]; pt.y = q[1]; pt.z = q[2];
            // Drive dependents from the new position this frame — the whole
            // point is watching the construction react.
            slate.update();
        };

        return [{
            durationMs: this.defaultDurationMs,
            setup: () => {
                // A journey is not a reveal — the point is already on stage.
                pt.drawProgress = 1;
                pt.visible = true;
                path = [[pt.x, pt.y, pt.z]];

                const push = (entry: any) => {
                    if (Array.isArray(entry) && entry.length >= 2) {
                        path.push([Number(entry[0]), Number(entry[1]),
                                   entry.length > 2 ? Number(entry[2]) : 0]);
                        return;
                    }
                    if (typeof entry === "string") {
                        const el = slate.lookupElement(entry);
                        if (el instanceof PointElement) {
                            path.push([el.x, el.y, el.z]);
                            return;
                        }
                        slate.reportDiagnostic({
                            code: "unresolvable-target",
                            key: "Point.followPath|" + entry,
                            message: `Point.followPath: waypoint "${entry}" is not a `
                                + `resolvable point — skipping it`,
                            detail: { animation: "Point.followPath", waypoint: entry },
                        });
                        return;
                    }
                    slate.reportDiagnostic({
                        code: "bad-animation-args",
                        key: "Point.followPath|waypoint",
                        message: "Point.followPath: a waypoint must be an element name "
                            + "or an [x, y] pair — skipping it",
                        detail: { animation: "Point.followPath" },
                    });
                };

                // --- arc mode ---------------------------------------
                const arc = args && args.arc;
                if (arc) {
                    let c: number[] | null = null;
                    if (Array.isArray(arc.center) && arc.center.length >= 2) {
                        c = [Number(arc.center[0]), Number(arc.center[1]),
                             arc.center.length > 2 ? Number(arc.center[2]) : 0];
                    } else if (typeof arc.center === "string") {
                        const el = slate.lookupElement(arc.center) as any;
                        if (el instanceof PointElement) {
                            c = [el.x, el.y, el.z];
                        } else if (el && el.A instanceof PointElement
                                      && el.B instanceof PointElement) {
                            // A line names its MIDPOINT, so `center: "DC"`
                            // reads as "swing about the middle of DC".
                            c = [(el.A.x + el.B.x) / 2, (el.A.y + el.B.y) / 2,
                                 (el.A.z + el.B.z) / 2];
                        }
                    }
                    if (c == null) {
                        slate.reportDiagnostic({
                            code: "bad-animation-args",
                            key: "Point.followPath|arc.center|" + String(arc.center),
                            message: `Point.followPath: arc.center ("${arc.center}") is not `
                                + `a point, a line, or an [x, y] pair — ignoring the arc`,
                            detail: { animation: "Point.followPath", center: String(arc.center) },
                        });
                    } else {
                        cx = c[0]; cy = c[1]; cz = c[2];
                        const dx0 = pt.x - cx, dy0 = pt.y - cy;
                        // Default radius is where the point already is, so
                        // t=0 leaves the figure exactly as authored.
                        const cur = Math.sqrt(dx0 * dx0 + dy0 * dy0);
                        radius = typeof arc.radius === "number" ? arc.radius : cur;
                        a0 = Math.atan2(dy0, dx0);
                        const deg = typeof arc.sweep === "number" ? arc.sweep : 180;
                        sweepRad = deg * Math.PI / 180;
                        if (radius <= 1e-9) {
                            slate.reportDiagnostic({
                                code: "bad-animation-args",
                                key: "Point.followPath|arc.radius",
                                message: "Point.followPath: arc radius is zero (the point sits "
                                    + "on the centre) — staying put",
                                detail: { animation: "Point.followPath" },
                            });
                        } else {
                            arcOn = true;
                        }
                    }
                }

                if (args && Array.isArray(args.via)) args.via.forEach(push);
                if (args && typeof args.along === "string") {
                    const line = slate.lookupElement(args.along) as any;
                    if (line && line.A instanceof PointElement && line.B instanceof PointElement) {
                        push([line.A.x, line.A.y, line.A.z]);
                        push([line.B.x, line.B.y, line.B.z]);
                    } else {
                        slate.reportDiagnostic({
                            code: "bad-animation-args",
                            key: "Point.followPath|along|" + String(args.along),
                            message: `Point.followPath: args.along ("${args.along}") is not a `
                                + `line with two endpoints — ignoring it`,
                            detail: { animation: "Point.followPath", along: String(args.along) },
                        });
                    }
                }

                if (!arcOn && path.length < 2) {
                    slate.reportDiagnostic({
                        code: "bad-animation-args",
                        key: "Point.followPath|" + String(pt.name),
                        message: "Point.followPath: no usable path (give args.via, "
                            + "args.along or args.arc) — staying put",
                        detail: { animation: "Point.followPath", elem: String(pt.name) },
                    });
                }

                // Arc-length parameterisation, so a long leg takes
                // proportionally longer than a short one.
                seg = [0]; total = 0;
                for (let i = 1; i < path.length; i++) {
                    const a = path[i - 1], b = path[i];
                    total += Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2
                                     + (b[2] - a[2]) ** 2);
                    seg.push(total);
                }
            },
            // settle=false traverses out over the first half and retraces
            // over the second, so the point lands exactly where it began.
            tick: (progress) => {
                apply(settle ? progress
                             : (progress < 0.5 ? progress * 2 : (1 - progress) * 2));
            },
            finalise: () => {
                // Snap to the exact endpoint rather than whatever the last
                // frame happened to compute.
                apply(settle ? 1 : 0);
                pt.drawProgress = 1;
                pt.visible = true;
            },
        }];
    }
}

registerAnimation(new PointAppearAnimation());
registerAnimation(new PointSlideAnimation());
registerAnimation(new PointFollowPathAnimation());
