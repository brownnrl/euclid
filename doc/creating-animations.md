# Creating a New Animation

A guide for adding a new slide-transition animation to `geomlib`. The
files you'll touch and the contracts your new code must satisfy.

This is the operational counterpart to
[architecture.md § Animation & progress-based rendering](architecture.md#animation--progress-based-rendering-060).
The catalog of existing animations, with each one's default rate and
visual behaviour, lives in [animations-reference.md](animations-reference.md).
The Construction analogue is [creating-constructions.md](creating-constructions.md);
the two recipes have the same shape on purpose.

---

## Prerequisites

Skim these once before you start:

| Doc | Why |
|---|---|
| [architecture.md § Animation & progress-based rendering](architecture.md#animation--progress-based-rendering-060) | The lifecycle and the per-element progress fields. |
| [architecture.md § Slide transitions & visibility](architecture.md#slide-transitions--visibility-050) | How a slide reveals an element and how `animateTo` resolves the animation. |
| [api.md § Animation](api.md#animation) | The public `A.{Type}.{name}` accessor and `IAnimationConfig`. |
| [animations-reference.md](animations-reference.md) | The slot you're filling. |

---

## The four files

For a new animation `A.Foo.bar` targeting `FooElement`, you'll touch:

1. **Enum + accessor entry** — `src/elements/Animations.ts` (add to
   `AllAnimations` and the `A` typed-constants object).
2. **Animation subclass** — appended to
   `src/elements/{type}/{Type}Animations.ts` (or a new file there if
   none exists yet for the type).
3. **Mocha test** — appended to `tests/AnimationTest.ts`.
4. **Demo annotation** — a slide entry in
   `view/test/slideshow/{some}.html` exercising the new animation.

---

## Step 1 — Enum + accessor entry

In `src/elements/Animations.ts`, add the enum value alongside its
siblings (keep the `Type.method` grouping) and the typed-constants
entry on the `A` object:

```typescript
export enum AllAnimations {
    // …existing…
    FOO_BAR,
}

export const A = {
    // …existing…
    Foo: {
        bar: AllAnimations.FOO_BAR,
    },
};
```

The numeric backing means a typo is caught at compile time. The
human-readable name (used in `console.warn` diagnostics and the
string-form param fallback) is the `name` field on the Animation
subclass itself — see step 2.

---

## Step 2 — The Animation subclass

Skeleton in `src/elements/{type}/{Type}Animations.ts`:

```typescript
import {Animation, AllAnimations, IAnimationStep, registerAnimation} from "../Animations";
import {GeomElement} from "../GeomElement";
import {Slate} from "../../Slate";
import {FooElement} from "./FooElement";

const DEFAULT_FOO_BAR_RATE = 0.003;   // tune per the visual feel

export class FooBarAnimation extends Animation {
    public animationMethod = AllAnimations.FOO_BAR;
    public name = "Foo.bar";
    public elementType = FooElement;
    public defaultRate = DEFAULT_FOO_BAR_RATE;
    // public defaultDurationMs = 600;   // alternative to rate; pick one

    public build(target: GeomElement, slate: Slate, args: any): IAnimationStep[] {
        const elem = target as FooElement;
        // Compute step duration(s) from geometry × default rate.
        const durationMs = /* … */;
        return [{
            durationMs,
            setup: () => {
                // (Optional.) Hide the target, register ephemeral
                // helpers, snapshot any field you'll restore in finalise.
                elem.drawProgress = 0;
            },
            tick: (progress) => {
                // Drive the per-frame visual change.
                elem.drawProgress = progress;
            },
            finalise: () => {
                // MUST: leave the target in its final visible state.
                // MUST: remove every ephemeral the setup added.
                elem.drawProgress = 1;
                elem.visible = true;
            },
        }];
    }
}

registerAnimation(new FooBarAnimation());
```

### Hard rules from the lifecycle

1. **`finalise` is the contract.** It runs on completion **and** on
   cancel (Next/Prev mid-animation, `cancel()`). It MUST restore the
   target to its final visible state (`visible = true`,
   `drawProgress = 1`, any type-specific fields like `faceAlpha = 1` or
   `drawStartAngle = 0`) and remove every ephemeral helper added in
   `setup`. A leak here visually corrupts every subsequent slide.

2. **`build()` is pure.** It must not mutate the target — only return
   the step list. The first mutation is `setup()` on the first step.

3. **Default values matter.** When `drawProgress = 1`, `faceAlpha = 1`,
   `emphasisAmount = 0` everywhere, the render path produces the
   pre-animation bit-for-bit output. Don't add a new progress field
   that defaults to a non-identity value.

4. **Rate vs duration.** Either set `defaultDurationMs` (fixed-time
   animation — e.g. `A.Point.appear` is always 350 ms regardless of
   marker size) or `defaultRate` and compute `durationMs` from
   geometry inside `build()` (e.g. `A.Line.straightEdgeConnect`
   takes longer on a longer line). Pick whichever lets the consumer
   override the right knob via `animationConfig`.

### Multi-step animations

Return more than one step from `build()` for strict sequences. The
animator cascades them — step `i+1`'s `setup` doesn't fire until step
`i`'s `finalise` has run. The canonical examples are
`PolygonOutlineAndFillAnimation` and `CircleCompassAnimation`: outline
the perimeter / sweep the arc first (`drawProgress: 0 → 1`), then
fade the face in (`faceAlpha: 0 → 1`) as a separate step.

A two-step sequence is the right shape when the second visual phase
depends on the first being **fully** complete — driving them off the
same field (e.g. trying to share `drawProgress` for edge trace and
face fill) is a kludge and looks wrong.

### Ephemeral helpers

For richer animations, register `GeomElement`-typed helpers with
`slate.addEphemeral(elem)` in `setup()` and `slate.removeEphemeral(elem)`
in `finalise()`. They render on top of `_elements` in the same
`face → edge → vertex → name` pass order, don't appear in
`lookupElement`, and `slate.clearEphemerals()` wipes them as a safety
net on cancel.

The v1 vocabulary (Point.appear, Line.straightEdgeConnect,
Circle.compass, Polygon.outline, Polygon.outlineAndFill) doesn't need
ephemerals — they just drive the target's own `drawProgress` and
`faceAlpha`. The future `compassTransfer` and `compassExplicit`
animations are where ephemerals earn their keep.

---

## Step 3 — The Mocha test

Appended to `tests/AnimationTest.ts`:

```typescript
it("A.Foo.bar — drives drawProgress 0 → 1", () => {
    const slate = makeSlate();
    const target = makeFooElement(slate, /* args */);
    const animation = findAnimation(A.Foo.bar)!;
    const steps = animation.build(target, slate, {});

    expect(steps).to.have.length(1);
    const step = steps[0];

    step.setup?.();
    expect(target.drawProgress).to.equal(0);

    step.tick(0.5, 8, step.durationMs);
    expect(target.drawProgress).to.be.closeTo(0.5, 1e-6);

    step.finalise();
    expect(target.drawProgress).to.equal(1);
    expect(target.visible).to.equal(true);
});
```

For multi-step animations also assert the inter-step transition: after
step 0's `finalise`, the field it drove should be at its terminal
value before step 1's `setup` fires.

If the animation registers ephemerals, also assert
`slate.ephemerals.length` is back to zero after `finalise`.

---

## Step 4 — The demo annotation

`view/test/slideshow/{some}.html` — add a slide whose `transition`
references the new animation:

```html
<script>
const A = geomlib.A, E = geomlib.E;
geomlib.init({
    canvasid: "canvas_0",
    elements: [ /* … */ ],
    slides: [
        // …
        { text: "Reveal Foo with the bar motion.",
          visible: ["Foo"],
          transition: {
              animations: [
                  { elem: "Foo", name: A.Foo.bar }
              ]
          },
        },
    ],
});
</script>
```

Rebuild the bundle and walk the slide in a browser:

```sh
npx webpack
python3 -m http.server
# open http://localhost:8000/view/test/slideshow/{some}.html
# press "p" or click ▶ Present, step to your slide
```

Confirm the animation looks right under: normal page-load, throttled
4× CPU in DevTools (clamp keeps timing consistent), and with system
"Reduce motion" enabled (animation should jump to its final state).

---

## Common pitfalls

| Symptom | Likely cause |
|---|---|
| Slide leaves the target invisible | `finalise` didn't set `visible = true`. The animator's fade-out phase won't help — only the animation knows whether it hid the target in `setup`. |
| Subsequent slide renders with the target dim / partial | `finalise` didn't reset `drawProgress = 1` (or `faceAlpha = 1`, `drawStartAngle = 0` for circles). |
| Ephemeral guides linger after Next | `finalise` didn't call `slate.removeEphemeral` on each helper. `clearEphemerals()` runs on cancel but not on normal completion. |
| Animation jumps to final immediately | Either `findAnimation` returned `null` (typo in `name` — the registry warns once to console), or the element type doesn't match `elementType` (also warns once). |
| Speed differs wildly across machines | Step driven off frame count instead of `progress`. Always drive visual change from the `progress: 0 → 1` argument, never from raw frame counts. |
| Two-step animation flickers between steps | Step 0's `finalise` didn't pin the relevant field to its terminal value before step 1 ticked. The animator cascades these atomically — if you see a flash, finalise pinned the wrong field. |

---

## See also

- [api.md § Animation](api.md#animation) — public surface for animation
  authors writing slide DSL.
- [animations-reference.md](animations-reference.md) — catalog of
  existing animations.
- [architecture.md](architecture.md) — the implementation model
  behind this guide.
