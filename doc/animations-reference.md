# Animations Reference

> *Available 0.6.0+.* Animations are slide-transition reveals — when a
> slide reveals a new element via [`slides`](api.md#slides--visibility),
> the matching `A.{Type}.{name}` entry on the slide's `transition.animations`
> array describes how the element draws in.

## Naming convention

Animations are accessed via `A.{Type}.{name}` in the TypeScript API:
`A.Point.appear`, `A.Line.straightEdgeConnect`, `A.Circle.compass`, etc.
Names follow the physical drawing instrument that the animation
imitates — `straightEdge*` for pencil-on-straightedge strokes,
`compass*` for centre-anchored arc sweeps, `appear` / `outline` for
the simplest fade-in / trace reveals.

The pattern parallels [`E.{Type}.{name}`](constructions-reference.md)
for constructions; the two registries are independent (a Construction
builds an element once at init-time, an Animation describes how to
*reveal* it on a slide transition).

The reserved bare name `A.instant` (no `Type` namespace) means
"no animation, finalise immediately" — use it on a slide entry to
suppress an inherited animation.

## Defaults and the resolution chain

Each animation ships sensible `defaultDurationMs` and/or `defaultRate`
constants. The effective duration for a given step resolves through
this chain (first hit wins):

1. `slide.transition.animations[i].durationMs` — per-slide override
2. `slate.animationConfig.durations[name]`
3. `slate.animationConfig.rates[name] × geometry`
4. animation's `defaultDurationMs`
5. animation's `defaultRate × geometry`
6. `600 ms` fallback

Rates are in `px/ms` for linear traces and `rad/ms` for arc sweeps.

## Status legend

| Status | Meaning |
|--------|---------|
| **IMPL** | Registered and shippable. Listed in `src/elements/{type}/{Type}Animations.ts`. |
| **TBD** | Reserved enum entry in `AllAnimations`; subclass not yet implemented (`findAnimation` falls back to instant + warns once). |

---

## Point animations

| Name | Status | Target | Args | Default | Visual |
|---|---|---|---|---|---|
| `A.Point.appear` | **IMPL** | `PointElement` | — | `350 ms` | Marker radius scales from 0 to its final value. The simplest reveal — used for points constructed at an intersection ("the point C at which the circles cut"). |
| `A.Point.intersect` | TBD | `PointElement` | — | — | Reserved. Brief flash on the intersecting curves before the dot lands. Will use ephemerals to render the flash. |

## Line animations

| Name | Status | Target | Args | Default rate | Visual |
|---|---|---|---|---|---|
| `A.Line.straightEdgeConnect` | **IMPL** | `LineElement` | — | `0.25 px/ms` | Pencil stroke from `A` toward `B`. The canonical straightedge between two existing points. Minimum duration `120 ms` so very short lines stay perceptible. |
| `A.Line.straightEdgeExtend` | **IMPL** | `LineElement` | — | `0.25 px/ms` | For `Line.extend` constructions where one endpoint sits on an existing line and the other is the projected new endpoint. v1 renders the same trace as `straightEdgeConnect`; future richer variants may pivot a straightedge guide first. |
| `A.Line.compassTransfer` | TBD | `LineElement` | `{ source: string, anchor?: 'A' \| 'B' }` | — | Reserved. Compass-walks a radius from another line onto this one. Hides the target line; spawns an ephemeral guide circle of radius `\|source\|` anchored at the target's endpoint, plus a pointer that travels the arc; `finalise()` removes helpers and reveals the target. |

## Circle animations

| Name | Status | Target | Args | Default | Visual |
|---|---|---|---|---|---|
| `A.Circle.compass` | **IMPL** | `CircleElement` | `{ startAngle?: number }` | rate `0.003 rad/ms`, fill cap `600 ms` | Strict two-step. **Step 1** — anchor at centre, pick up the pencil at the radius-defining point `B`, sweep `2π` back to the start (default `startAngle` = angle from centre to `B`, so the trace begins where a real compass would). **Step 2** — face fades in over the now-complete arc at ~half the sweep duration. Independent fields drive the two steps: `drawProgress` finalises to 1 before `faceAlpha` ticks 0 → 1, so the edge stays stable while the fill lands. A face-less circle (`faceColor` null) skips step 2 entirely — no dead time mid-cascade. |
| `A.Circle.compassExplicit` | TBD | `CircleElement` | — | — | Reserved. Same sweep as `compass`, but renders ephemeral compass arms (two short lines from centre to the pencil) during the trace. Good for early teaching propositions where the tool itself is part of the explanation. |

## Polygon animations

| Name | Status | Target | Args | Default | Visual |
|---|---|---|---|---|---|
| `A.Polygon.outline` | **IMPL** | `PolygonElement` | — | rate `0.25 px/ms`, min `180 ms` | Cascade-trace each edge in `V[]` order. `PolygonElement.drawEdge` partitions `drawProgress` across edges so a single `0 → 1` step traces every edge in sequence at the right per-edge proportion. |
| `A.Polygon.outlineAndFill` | **IMPL** | `PolygonElement` | — | outline rate `0.25 px/ms`, fill cap `500 ms` | Strict two-step. **Step 1** — outline trace (`drawProgress: 0 → 1`). **Step 2** — face fade-in (`faceAlpha: 0 → 1`) at ~half the outline's runtime. Fill is intentionally shorter than the outline — the eye has already absorbed the shape from the trace, so the fill should land quickly. A face-less polygon (`faceColor` null) skips step 2 entirely. |
| `A.Polygon.superpose` | **IMPL** | `PolygonElement` | `{ onto: string }` | translate `0.25 px/ms`, rotate `0.003 rad/ms`, hold `800 ms` | Euclid's superposition (I.4). An **ephemeral gold-outline ghost copy** of the target lifts off, translates so its vertex 0 lands on `onto`'s vertex 0, rotates about the landing point to lay side 0→1 onto the target side, holds a beat coinciding, then retraces both motions home. The real polygon never moves. `onto` must name a polygon with the same vertex count — anything else warns and no-ops. |

## Sector animations

| Name | Status | Target | Args | Default | Visual |
|---|---|---|---|---|---|
| `A.Sector.sweep` | **IMPL** | `SectorElement` (incl. `ArcElement`) | — | rate `0.003 rad/ms`, min `250 ms`, fill cap `500 ms` | The arc grows from the A arm toward the B arm (`drawProgress: 0 → 1`) — the angle-marker reveal. Two-step (sweep then face fade) when the sector has a face; a face-less sector skips the fill step. Zero-color sectors render in the gold emphasis stroke only while animating — the invisible angle-marker pattern. |

## Reserved / no-namespace

| Name | Status | Target | Args | Default | Visual |
|---|---|---|---|---|---|
| `A.instant` | **IMPL** | `GeomElement` (any) | — | `0 ms` | No-op finalise. Use on a slide entry to explicitly suppress an inherited animation, or fired automatically when an unknown name lookup fails (with a `console.warn` once per name). |

---

## Slide-side usage

The full slide DSL lives in [api.md § Animation](api.md#animation).
Quick reference:

```javascript
slides: [
    { text: "Describe the circle BCD with centre A and radius AB.",
      visible: ["AB","BCD","D"],
      transition: {
          animations: [
              { elem: "BCD", name: A.Circle.compass }
          ]
      },
      justifications: [{ ref: "I.Post.3" }]
    },
    { text: "Join the straight lines CA and CB from the point C.",
      visible: ["AB","BCD","ACE","C","AC","BC"],
      transition: {
          mode: "cascade",            // default; "parallel" also accepted
          animations: [
              { elem: "C",  name: A.Point.appear },
              { elem: "AC", name: A.Line.straightEdgeConnect },
              { elem: "BC", name: A.Line.straightEdgeConnect }
          ]
      }
    }
]
```

Cascade order = array order. An element revealed by the slide but not
listed in `animations` pops in instantly (matches the 0.5.0 behaviour);
authors annotate only the construction moments worth slowing down for.

## Global tuning via `animationConfig`

Drop every `Circle.compass` to ~70% speed without touching individual
slides:

```javascript
geomlib.init({
    canvasid: "canvas_0",
    elements: [ /* … */ ],
    slides:   [ /* … */ ],
    animationConfig: {
        rates: { [A.Circle.compass]: 0.0021 }
    }
});
```

Other knobs (`speedMultiplier`, `reducedMotion`, `cascadeGapMs`, the
full resolution chain) are documented in
[api.md § IAnimationConfig](api.md#ianimationconfig).

## See also

- [api.md § Animation](api.md#animation) — public surface used by
  slide authors.
- [creating-animations.md](creating-animations.md) — recipe for
  adding a new animation.
- [architecture.md § Animation & progress-based rendering](architecture.md#animation--progress-based-rendering-060)
  — implementation model.
- [constructions-reference.md](constructions-reference.md) — the
  parallel catalog for `E.{Type}.{name}` constructions.
