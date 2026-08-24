// Animation registry — parallel to Constructions but distinct purpose.
//
// A Construction builds an element once at init() time. An Animation
// describes how to *reveal* that element when a slide transitions:
// lines trace from one endpoint to the other, circles sweep an arc,
// polygons trace edges in order then fade in the face. Multiple
// animations can target the same element type — e.g. a Line might
// be revealed via the shorthand A.Line.straightEdgeConnect (pencil
// stroke A → B) or the long-form A.Line.compassTransfer (compass
// walks a radius from another line then drops the straightedge).
// Authors pick the right one per slide.
//
// Names follow the same `Type.method` shape as Constructions
// (E.Line.connect ↔ A.Line.straightEdgeConnect). The enum value is
// what authors pass; the human-readable name string is used for the
// string-form fallback (param strings) + console.warn diagnostics.

import {GeomElement} from "./GeomElement";
import {Slate} from "../Slate";

// Typed enum, parallel to AllConstructions. Numeric backing — typo-
// safe at compile time and cheap to compare at runtime.
export enum AllAnimations {
    INSTANT,
    POINT_APPEAR,
    POINT_INTERSECT,                 // future
    POINT_SLIDE,
    POINT_FOLLOW_PATH,
    LINE_STRAIGHT_EDGE_CONNECT,
    LINE_STRAIGHT_EDGE_EXTEND,
    LINE_COMPASS_TRANSFER,           // future
    CIRCLE_COMPASS,
    CIRCLE_COMPASS_EXPLICIT,         // future
    CIRCLE_COMPASS_TRANSFER,
    POLYGON_OUTLINE,
    POLYGON_OUTLINE_AND_FILL,
    POLYGON_SUPERPOSE,
    POLYGON_EQUILATERAL_BUILD,
    SECTOR_SWEEP,
    GROUP_CLONE_ASIDE,
}

// Typed constants object, mirroring E for constructions. Authors
// write `A.Circle.compass` instead of remembering the raw enum.
export const A = {
    Point: {
        appear:              AllAnimations.POINT_APPEAR,
        intersect:           AllAnimations.POINT_INTERSECT,           // future
        slide:               AllAnimations.POINT_SLIDE,
        followPath:          AllAnimations.POINT_FOLLOW_PATH,
    },
    Line: {
        straightEdgeConnect: AllAnimations.LINE_STRAIGHT_EDGE_CONNECT,
        straightEdgeExtend:  AllAnimations.LINE_STRAIGHT_EDGE_EXTEND,
        compassTransfer:     AllAnimations.LINE_COMPASS_TRANSFER,     // future
    },
    Circle: {
        compass:             AllAnimations.CIRCLE_COMPASS,
        compassExplicit:     AllAnimations.CIRCLE_COMPASS_EXPLICIT,   // future
        compassTransfer:     AllAnimations.CIRCLE_COMPASS_TRANSFER,   // I.2 (#127)
    },
    Polygon: {
        outline:             AllAnimations.POLYGON_OUTLINE,
        outlineAndFill:      AllAnimations.POLYGON_OUTLINE_AND_FILL,
        superpose:           AllAnimations.POLYGON_SUPERPOSE,
        equilateralBuild:    AllAnimations.POLYGON_EQUILATERAL_BUILD,    // I.1 (#127)
    },
    Sector: {
        sweep:               AllAnimations.SECTOR_SWEEP,
    },
    Group: {
        cloneAside:          AllAnimations.GROUP_CLONE_ASIDE,
    },
    instant:                 AllAnimations.INSTANT,
};

// One frame-driven step of an animation. An Animation.build() returns
// an array of these; the SlateAnimator drives each step's progress
// from 0 → 1 over its durationMs, then calls finalise().
export interface IAnimationStep {
    durationMs: number;

    // Setup hook fires once before the first tick. Used to hide the
    // target element (so visual proxies can render over its final
    // position without overlap) and to register ephemeral helper
    // elements via slate.addEphemeral.
    setup?: () => void;

    // Called each frame with progress ∈ [0, 1]. Typically sets
    // target.drawProgress = progress; richer animations may also tick
    // ephemeral helpers.
    tick: (progress: number, dtMs: number, totalMs: number) => void;

    // Called on cancel, skip, or normal completion. Animations MUST:
    //   1. Remove every ephemeral helper they added.
    //   2. Restore the target element to its final visible state
    //      (target.visible = true, drawProgress = 1).
    finalise: () => void;
}

// Abstract base class for all animations. Concrete subclasses live in
// the per-element-type sibling files (PointAnimations.ts,
// LineAnimations.ts, CircleAnimations.ts, PolygonAnimations.ts).
export abstract class Animation {
    // Enum value the animation registers under. Mirrors Construction's
    // `constructionMethod: AllConstructions` field shape.
    public abstract animationMethod: AllAnimations;

    // Human-readable name in the same `Type.method` shape Construction
    // uses ("Line.straightEdgeConnect", "Circle.compass", …).
    public abstract name: string;

    // Element class the animation can animate. animateTo validates
    // the target before calling build(); a mismatch emits a
    // console.warn and falls through to Instant.
    public abstract elementType: Function;

    // Per-animation default duration AND rate. Whichever the slate's
    // animationConfig overrides wins. Null on both means build()
    // computes its own duration from geometry × default rate.
    public defaultDurationMs?: number;
    public defaultRate?: number;

    public abstract build(target: GeomElement, slate: Slate, args: any): IAnimationStep[];

    // #159 — names this animation CREATES at run time, given its args.
    //
    // A macro animation can register new, name-addressable elements partway
    // through a walk: compassTransfer's `keepCircles` is the case in point,
    // and a later slide legitimately addresses those names. Deck validation
    // (#154) runs when the figure is BUILT, so without this those names look
    // like typos and a correct deck gets a warning badge.
    //
    // Declaring them here lets the validator accept a name before it exists,
    // while still catching genuine typos and stale targets. Default: none,
    // so an animation that creates nothing needs no change.
    public declaredNames(args: any): string[] { return []; }
}

// InstantAnimation — the registry's fallback. Used explicitly via
// A.instant on a slide entry to suppress an inherited animation, or
// implicitly when an unknown name lookup fails. Just finalises the
// target to its full-rendered state.
export class InstantAnimation extends Animation {
    public animationMethod = AllAnimations.INSTANT;
    public name = "instant";
    public elementType = GeomElement;

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        return [{
            durationMs: 0,
            tick: () => {},
            finalise: () => {
                target.drawProgress = 1;
                target.visible = true;
            },
        }];
    }
}

// Module-level registry. Subclass files call registerAnimation(new X())
// at import time so the registry is populated by the time any consumer
// looks anything up.
const animationsByEnum: Map<AllAnimations, Animation> = new Map();
const animationsByName: Map<string, Animation> = new Map();

export function registerAnimation(a: Animation): void {
    animationsByEnum.set(a.animationMethod, a);
    animationsByName.set(a.name, a);
}

// Accepts either the enum value or the string name; returns the
// registered Animation or null when the name doesn't resolve.
//
// Pure lookup: it does NOT report an unknown name. #154 moved that to
// the caller (SlateAnimator.run), which holds the slate the diagnostic
// belongs to. That also retired a module-global "already warned" Set
// which suppressed the warning for every OTHER slate on the page once
// any one slate hit the same bad name.
export function findAnimation(ref: AllAnimations | string): Animation | null {
    let a: Animation | undefined;
    if (typeof ref === "string") {
        a = animationsByName.get(ref);
    } else {
        a = animationsByEnum.get(ref);
    }
    return a ?? null;
}

// Register the always-present Instant. Concrete animations in
// PointAnimations.ts / LineAnimations.ts / … register themselves the
// same way when their modules are imported.
registerAnimation(new InstantAnimation());
