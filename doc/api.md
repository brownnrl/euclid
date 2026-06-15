# Public API Reference

This document is the reference for the public surface of `geomlib` —
the TypeScript port of Dr. David E. Joyce's Geometry Applet (1996,
version 2.2). It
maps every accepted parameter, every construction enum value, and every
helper to its source location in `src/`, with the original Java applet
contract in `geom_applet/source/Geometry.html` and `tables.html` as the
authoritative behavior reference.

For "how the pieces fit together" see [architecture.md](architecture.md).
For "how to add a new construction" see
[creating-constructions.md](creating-constructions.md).

---

## Quick start

```html
<canvas id="myCanvas" style="width:340px; height:320px;"></canvas>
<script src="dist/bundle.js"></script>
<script>
let E = geomlib.E;
geomlib.init({
    background: "35,19,100",
    title: "I.1",
    canvasid: "myCanvas",
    pivot: "C",
    elements: [
        { name: "A",   construction: E.Point.free,   params: [125, 130] },
        { name: "B",   construction: E.Point.free,   params: [215, 130] },
        { name: "AB",  construction: E.Line.connect, params: ["A", "B"] },
        { name: "Ac",  construction: E.Circle.radius, params: ["A", "B"] },
        { name: "Bc",  construction: E.Circle.radius, params: ["B", "A"] },
        { name: "CD",  construction: E.Line.bichord, params: ["Bc", "Ac"] },
        { name: "C",   construction: E.Point.first,  params: ["CD"] },
        { name: "ABC", construction: E.Polygon.triangle, params: ["A","B","C"] },
    ],
});
</script>
```

The canvas can be any size. `init()` matches `canvas.width/height`
attributes to its `clientWidth/clientHeight` once at startup so the bitmap
resolution is sharp at the CSS size you set.

`elements:` accepts either object form (above) or the original Java
`<param>` strings — see [`parseParam()`](#parseparam) below.

---

## Top-level exports — `dist/bundle.js`

When loaded via the webpack UMD bundle, everything is on the global
`geomlib`. When imported via TypeScript:

```typescript
import { init, parseParam, E, Align, slates, Color,
         IInitialization, IConstructionInfo } from "geomlib";
```

| Export | File | Description |
|---|---|---|
| `init(config)` | `src/index.ts` | Build a slate from an `IInitialization` config. Reads the canvas by `canvasid`, sets up the screen plane, instantiates each element in order, and injects the SlateControls UI overlay. |
| `parseParam(s)` | `src/index.ts` | Convert a Java applet `<param value="…">` string into an `IConstructionInfo` object. |
| `E` | `src/elements/Constructions.ts` | Construction enum accessor: `E.Point.free`, `E.Line.connect`, `E.Circle.radius`, … See the [construction tables](#construction-tables) below. |
| `Align` | `src/elements/GeomElement.ts` | Label-placement enum: `ABOVE`, `BELOW`, `LEFT`, `RIGHT`, `CENTRAL`. |
| `Color` | `src/Colors.ts` | Color helpers (`parseColor`, `lighten`, `darken`, `randomColor`). |
| `slates: Slate[]` | `src/index.ts` | Mutable array of every Slate instance `init()` has created. Each call to `init()` appends one. Multiple canvases on the same page get one entry each. |
| `IInitialization` | `src/index.ts` | TypeScript type of `init()`'s argument. |
| `IConstructionInfo` | `src/index.ts` | TypeScript type of one element entry inside `elements:`. |

---

## `init(config: IInitialization)`

Defined at [src/index.ts:97](../src/index.ts#L97). Builds one
`Slate` per call.

### `IInitialization` fields

```typescript
interface IInitialization {
    background : string;
    title : string;
    align? : Align;
    canvasid? : string;
    pivot?: string;
    font?: string;
    fontsize?: number;
    elements: (IConstructionInfo | string)[];
    // 0.4.0+ — name aliases (Joyce's "circle CDB" ≡ "circle BCD" etc.)
    aliases?: {[from: string]: string};
    // 0.5.0+ — slideshow / presentation mode
    slides?: ISlide[];
    resolveJustification?: (ref: string) => string | null | undefined;
    // 0.6.0+ — slide-transition animation
    animationConfig?: IAnimationConfig;
    // 0.7.1+ — draggables exempt from the slideshow auto-union
    deferDraggables?: string[];
    // 0.9.0+ — elements that start hidden in the static figure
    initiallyHidden?: string[];
    // 0.9.0+ — show angle markers in the static figure (default: hidden)
    showAngles?: boolean;
}
```

| Field | Java applet param | Default | Description |
|---|---|---|---|
| `background` | `background` | `"#ffffff"` | Canvas fill. Same string grammar as element colors — see [Colors](#colors). HSB triples like `"35,19,100"` are valid. |
| `title` | `title` | `""` | A label for the diagram. Stored on the Slate; not currently rendered on the canvas itself. |
| `align` | `align` | `Align.CENTRAL` | Default label placement applied to every element. CENTRAL chooses ABOVE/BELOW/LEFT/RIGHT dynamically based on the label's quadrant relative to the canvas center. |
| `canvasid` | (none — applet's host element) | `"canvasid"` | DOM `id` of the `<canvas>` to draw into. |
| `pivot` | `pivot` | (no pivot) | Name of a point used as the rotation/scale center when the user drags a non-draggable point. Two-part form `"P,plane"` pivots on a non-screen plane (3D). See [Drag pipeline](architecture.md#drag-pipeline-movepick--translatecoordinates--rotatecoordinates). |
| `font` | `font` | `"Times New Roman"` | Font family for element labels. Set globally on `GeomElement` via `GeomElement.setFont()`. Java default is `"TimesRoman"`. |
| `fontsize` | `fontsize` | `18` | Pixel size for the label font. |
| `elements` | `e[1]`, `e[2]`, … | (required) | Ordered list of element specs. May mix `IConstructionInfo` objects and Java param strings. |
| `aliases` | — | `{}` | Secondary element names that resolve to a canonical element. See [Slides & visibility](#slides--visibility). |
| `deferDraggables` | — | `[]` | 0.7.1+. Draggable element names excluded from the slideshow's every-slide auto-union — they follow slide `visible` sets like any other element. For draggables the proof introduces mid-walk. |
| `initiallyHidden` | — | `[]` | 0.9.0+. Element names that start hidden (`visible = false`) in the static figure. Revealed by a slide's `visible` set, or when the element is slide-highlighted / its `{NAME}` ref is hovered. `clearVisibility()` (presentation exit) restores this baseline. |
| `showAngles` | — | `false` | 0.9.0+. Show angle markers (`E.Sector.angleMarker` / `angleMarkerReflex`) in the static figure. Default `false`: markers are hidden initially — Euclid's source diagram draws no angle arcs — and appear during the slide walk or on hover. |
| `slides` | — | `[]` | Optional slideshow walk-through. When present, SlateControls shows a "▶ Present" button. See [Slides & visibility](#slides--visibility). |
| `resolveJustification` | — | `null` | Callback that maps a symbolic justification ref (e.g. `"I.Post.3"`) to a URL string. See [Slides & visibility](#slides--visibility). |
| `animationConfig` | — | `{}` | Per-animation rate / duration overrides, `speedMultiplier`, `reducedMotion`. See [Animation](#animation). |

`debug` from the Java applet is not implemented in the TS port.

### `IConstructionInfo` (one element)

```typescript
interface IConstructionInfo {
    name: string;
    construction: AllConstructions;     // E.Point.free, E.Line.connect, …
    params: any[];
    nameColor?: string | number;
    vertexColor?: string | number;
    edgeColor?: string | number;
    faceColor?: string | number;
}
```

| Field | Java field | Description |
|---|---|---|
| `name` | the leading `Name` in `"Name;type;cons;…"` | Identifier used to reference this element from later constructions. Must be unique per slate. |
| `construction` | the `type;construction` pair | A value from the `E` enum. Selects the dispatcher. |
| `params` | the comma-separated `arg1,arg2,…` field | Mixed array of strings (element names) and numbers. Strings are looked up on the slate; if they resolve to a `LineElement`, that line is auto-expanded into its two endpoint `PointElement`s in the parameter list. See [convertParams](architecture.md#convertparams--the-type-sort-step). |
| `nameColor` | 1st color field | Color of the rendered name label. |
| `vertexColor` | 2nd color field | Color of the vertex dot (point) or vertices (polygon corners). |
| `edgeColor` | 3rd color field | Color of the line/arc/edge layer. |
| `faceColor` | 4th color field | Fill color for filled shapes (polygon, sector, filled circle). |

If a color field is omitted, a sensible default is chosen at
[src/index.ts:122-136](../src/index.ts#L122) based on the element type
(see [Colors](#colors) below).

### Defaults applied per element

After each element is constructed, `init()` sets:

- `element.align = config.align` (default `Align.CENTRAL`).
- `element.nameColor` — `"black"` for points, `null` for everything else,
  unless overridden by the `nameColor` field.
- `element.vertexColor` — `"red"` for free `PlaneSlider` points,
  `"orange"` for other draggable points, `"black"` for non-draggable,
  unless overridden.
- `element.edgeColor` — `"black"` unless overridden.
- `element.faceColor` — a `lighten(background)` shade for 2D-dimension
  elements (polygons, sectors, filled circles), `null` for 0D/1D, unless
  overridden.

Numeric `0` in a color field means "transparent / don't draw this layer"
— the corresponding `draw…()` call short-circuits.

---

## `parseParam(s: string)`

Defined at [src/index.ts:46](../src/index.ts#L46). Converts a Java applet
`<param value="…">` string into one `IConstructionInfo`.

### Format

```
"Name;type;construction;arg1,arg2,…[;nameColor[;vertexColor[;edgeColor[;faceColor]]]]"
```

Fields are separated by `;`. The fourth field uses `,` to separate args.

| Position | Field | Example |
|---|---|---|
| 0 | `Name` | `M` |
| 1 | `type` | `point` (mapped to enum class `Point`) |
| 2 | `construction` | `midpoint` (mapped to enum value `E.Point.midpoint`) |
| 3 | `args` (CSV) | `A,B` (each piece becomes an entry in `params[]`) |
| 4 | `nameColor` | `0` or `"black"` or `"#ff00ff"` |
| 5 | `vertexColor` | as above |
| 6 | `edgeColor` | as above |
| 7 | `faceColor` | as above |

### Type → enum mapping

```typescript
"point"      → E.Point
"line"       → E.Line
"circle"     → E.Circle
"polygon"    → E.Polygon
"sector"     → E.Sector
"plane"      → E.Plane
"sphere"     → E.Sphere
"polyhedron" → E.Polyhedra        // note: Java says "polyhedron",
                                  //       TS enum is "Polyhedra"
```

Construction names match Java exactly **except** Java's `3points`
(plane construction) maps to `E.Plane.threePoints` — JavaScript
identifiers can't start with a digit.

### Args parsing

Each CSV entry in field 3 is converted: numeric strings (per
`Number()`) become `number`s, everything else stays a `string`. So
`"A,B,150,140"` becomes `["A","B",150,140]`.

### Mixing object and string forms

`init({ elements: [...] })` accepts both at once:

```javascript
geomlib.init({
    background: "35,19,100",
    canvasid: "myCanvas",
    elements: [
        "A;point;free;125,130",                                 // string
        { name: "B", construction: E.Point.free, params: [215, 130] },  // object
        "AB;line;connect;A,B",                                  // string
    ],
});
```

The string form is convenient when porting a Java HTML page — copy
each `<param value="…">` value directly into the elements array.

---

## `E` — construction enum accessor

`E` is a fixed object (not a function) exporting the eight construction
enums:

```typescript
E.Point      // PointConstructions
E.Line       // LineConstructions
E.Circle     // CircleConstructions
E.Polygon    // PolygonConstructions
E.Sector     // SectorConstructions
E.Plane      // PlaneConstructions
E.Sphere     // SphereConstructions
E.Polyhedra  // PolyhedraConstructions     (note: not "Polyhedron")
```

Each is a string-keyed numeric enum. `E.Point.free === 1`,
`E.Line.connect === 101`, `E.Circle.radius === 201`, etc. The numeric
ranges are 1-99 (point), 101-199 (line), 201-299 (circle), 301-399
(polygon), 401-499 (sector), 501-599 (plane), 601-699 (sphere),
701-799 (polyhedron), so the type can be recovered from the value.

The construction tables below list every legal `E.{Type}.{name}`.

---

## `Align`

```typescript
enum Align {
    ABOVE  = 0,
    RIGHT  = 1,
    BELOW  = 2,
    LEFT   = 3,
    CENTRAL = 4,   // default
}
```

`init({ align: Align.CENTRAL })` is the Java applet's default. CENTRAL
places each label dynamically away from the canvas center based on the
quadrant the element occupies. ABOVE/RIGHT/BELOW/LEFT are static.

Per-element align overrides are not yet supported (`IConstructionInfo`
has no `align` field). Tracked under platform TODOs in
[historical/java-port/construction-tracker.md](historical/java-port/construction-tracker.md).

---

## Colors

`parseColor(s, defaultColor, bgcolor)` at
[src/Colors.ts](../src/Colors.ts) accepts every form Java's
`Geometry.html` documents:

| Input | Result |
|---|---|
| Named CSS color (`"black"`, `"red"`, `"darkGray"`, …) | Java's color table values, exact RGB. Includes the Java additions `"darkGray"`, `"lightGray"`, `"gray"`. |
| 6-hex-digit `#rrggbb` or `rrggbb` | The exact RGB. |
| Comma-triple `"H,S,B"` (e.g. `"35,19,100"`) | HSB; H ∈ 0–360, S/B ∈ 0–100. Matches the Java applet's `Color.getHSBColor()` semantics. |
| `"random"` | Random pastel each call. |
| `"background"` | `bgcolor`. |
| `"brighter"` | `lighten(bgcolor)` — Java's `Color.brighter()`, factor 0.7. |
| `"darker"` | `darken(bgcolor)` — Java's `Color.darker()`, factor 0.7. |
| `"none"` | `null` (the corresponding draw layer is skipped). |
| Number `0` | `null` (the Java applet's "transparent" sentinel). |
| `null` / `undefined` | `defaultColor`. |

Each element has four color slots: name, vertex, edge, face. A `null`
value means "skip drawing this layer." The default for face on
non-2D-dimension elements is `null` — points and lines have no fill.

---

## Slides & visibility

> *Available 0.5.0+. The library covers two distinct surfaces here — a
> raw per-element visibility primitive that any consumer can use, and a
> data-driven slideshow on top of it that renders its own UI.*

### Per-element visibility

```typescript
class GeomElement {
    visible: boolean;            // default true
}

class Slate {
    setVisibleNames(names: string[]): void;
    clearVisibility(): void;
}
```

Setting `element.visible = false` makes every per-type draw method
short-circuit — the element stops drawing but stays in the slate's
`_elements` list, so dependents that read its coordinates still work
(e.g. a hidden mid-construction circle whose intersection point is
still shown). `Slate.setVisibleNames(["A","AB"])` flips every *named*
element's flag according to set membership; `clearVisibility()`
restores every element to `visible = true`.

Unnamed elements (intermediate construction outputs) are not touched
by `setVisibleNames`.

### Name aliases

```typescript
class Slate {
    addAlias(from: string, to: string): void;
    addAliases(aliases: {[from: string]: string}): void;
}
```

`init({ aliases: { "CDB": "BCD", "BA": "AB" } })` registers symbolic
synonyms — Joyce's prose refers to the same circle as both *BCD* and
*CDB*. After a direct-name miss, `Slate.lookupElement()` follows the
alias map once. Aliases never appear in `_elements`; the slate stays
the same size whether or not you register them.

### Slideshow data on `init()`

```typescript
interface ISlideJust { ref: string; }

interface ISlideAnimation {           // 0.6.0+; see Animation below
    elem: string;
    name: AllAnimations | string;
    args?: any;
    durationMs?: number;
}

interface ISlideTransition {
    mode?: "cascade" | "parallel";    // default "cascade"
    animations?: ISlideAnimation[];   // 0.6.0+
}

interface ISlide {
    text: string;
    visible?: string[];               // inherits from previous if omitted
    highlighted?: string[];           // defaults to []; clears each slide
    justifications?: ISlideJust[];
    transition?: ISlideTransition;    // 0.6.0+
}
```

Each slide is a *declarative* state — what's visible, what's
highlighted, the caption text, and any marginal justification
references. The presentation controller diffs the current state
against the target on each Next / Prev and applies it.

Resolution rules:

- `visible` **inherits** from the most recent earlier slide that
  declared it. Authors only re-specify on state change.
- `highlighted` **defaults to `[]`** (clears between slides). A
  highlight must be re-listed every slide it should appear on.
- Every `draggable` element on the slate is **auto-unioned** into the
  visible set on every slide — free construction points stay
  interactive while the reader walks the proof. Names listed in
  `init({ deferDraggables: [...] })` (0.7.1+) are exempt: they follow
  slide `visible` sets like any other element, for draggables the
  proof introduces mid-walk ("Take an arbitrary point F").
- Highlighted elements are auto-unioned into visible (can't highlight
  what isn't drawn).

Captions go through a small markup pass: `{NAME}` tokens become
clickable bold-italic spans tied to the matching slate element.
`{DISPLAY|element}` (0.7.1+) renders DISPLAY but binds to `element` —
for prose names that collide with another element's name ("the angle
{ABC|angBint}" where bare `{ABC}` would resolve to the triangle).
Hover / tap on a span flips `element.emphasisAmount` so the element
pops with a thicker stroke; tapping pins a single sticky reference at
a time.

### Justification refs

```typescript
type ResolveJustification =
    (ref: string) => string | null | undefined;

class Slate {
    resolveJustification: ResolveJustification | null;
}
```

Slide entries carry symbolic `justifications: [{ ref: "I.Post.3" }]`.
URLs are resolved at render time by the consumer-provided callback
(`init({ resolveJustification: r => myMap[r] })`) so refs don't go
stale when target pages move. Returning `null` / `undefined` makes
the reference render as plain text.

### Public Slate surface

```typescript
class Slate {
    canvas: SlateCanvas;                // public getter (0.4.0+)
    slides: ISlide[];                   // (0.5.0+)
}
```

`Slate.canvas` exposes the underlying `HTMLCanvasElement` so consumer
glue can do DOM-relative reasoning (e.g. compare position against a
prose span on a multi-canvas page).

### Slate view offset

```typescript
class Slate {
    get viewOffsetX(): number;          // (0.10.0+)
    get viewOffsetY(): number;
    setViewOffset(x: number, y: number): void;
    clearViewOffset(): void;
    visibleBounds(): { minX, maxX, minY, maxY } | null;
    figureBounds(): { minX, maxX, minY, maxY } | null;   // (0.11.0+)
    namesFor(canonical: string): string[];               // (0.11.0+)
}
```

A **translate-only** offset (no scale) applied to every drawn element
and ephemeral; the pick path subtracts it (and the drag clamp shifts with
it), so the figure stays draggable under the offset. Default `(0, 0)` is a
no-op — every pre-existing render path is unchanged. `A.Group.cloneAside`'s
`autoPlace` uses it to slide the figure to the canvas centre (#99).

`visibleBounds()` is the bbox of the *visible* named figure; `figureBounds()`
(0.11.0+) is the bbox of *all* named elements regardless of visibility — a
stable centre that doesn't drift as a presentation reveals/hides elements.

**Maximized-view recenter (#107, #114, #115).** When the canvas is
maximized — via the control or by entering presentation — the figure is
centred with this offset (translate only). It centres **once** on enter
and **not** on each slide advance, so a viewer dragging a point mid-walk
isn't yanked back (#114); an `autoPlace` case slide still eases from the
centred offset out to its layout with no jump. **Exiting presentation
(`Esc`) leaves the walk but stays maximized**, keeping the viewer's
manipulation (#115). Only the **minimize** control un-maximizes, and that
is what restores the inline view + runs `reset()`.

### `geomlib:highlight` event (#108, 0.11.0+)

When the set of highlighted elements (`shouldHighlight || emphasized`)
changes, a slate dispatches a `CustomEvent("geomlib:highlight")` on its
canvas (bubbling), so a page can bind highlighting **bidirectionally** —
e.g. light up every prose reference to an element the moment it's
highlighted by any source (a `{NAME}` hover, a slide's `highlighted` set).

```typescript
canvas.addEventListener("geomlib:highlight", (ev) => {
    // ev.detail.highlighted: Array<{ name: string, aliases: string[] }>
    // `aliases` = the canonical name + every alias resolving to it,
    // so a ref spelled "CDB" matches the highlighted "BCD".
});
```

Fires only when the set *changes* (not per frame / per `emphasisAmount`
fade) and is idempotent, so a listener that highlights text spans creates
no feedback loop. No-op when the canvas can't dispatch DOM events.

### What renders this

`SlateControls` (the slate-overlay UI) adds a fourth button — the
play-triangle — whenever `slate.slides.length > 0`. Pressing it (or
the `p` keyboard shortcut) maximises the canvas and floats a soft
white caption panel at the bottom of the viewport with the slide
text, justification links, and prev / counter / next / exit buttons.
Arrow keys (← / →), `Esc`, and tapping a `{NAME}` ref all do what
you'd expect.

The overlay is purely library-side — no host CSS required.

---

## Animation

> *Available 0.6.0+. Builds on the slideshow: when a slide reveals a
> new element, an Animation can draw it in compass-and-straightedge
> style instead of popping it into existence. Animations live in their
> own named registry parallel to constructions, so they're additive
> and don't disturb existing consumers.*

### `A` — animation enum accessor

```typescript
A.Point      // PointAnimations
A.Line       // LineAnimations
A.Circle     // CircleAnimations
A.Polygon    // PolygonAnimations
A.Sector     // SectorAnimations (0.7.0+)
A.Group      // cross-type group animations (0.9.0+; cloneAside autoPlace + variants 0.10.0+)
A.instant    // no-op finalise (suppress an inherited animation)
```

Each method is a value from `AllAnimations`. Names follow the
physical drawing instrument — `A.Line.straightEdgeConnect`,
`A.Circle.compass`, `A.Polygon.outlineAndFill`. See
[animations-reference.md](animations-reference.md) for every legal
value.

### Slide-side annotation

```javascript
transition: {
    mode: "cascade",                         // default "cascade"; "parallel" also accepted
    animations: [
        { elem: "BCD", name: A.Circle.compass },
        { elem: "CE",  name: A.Line.straightEdgeConnect, durationMs: 800 },
        { elem: "ABC", name: A.Polygon.outlineAndFill },
        { elem: "C",   name: A.instant }      // suppress an inherited animation
    ]
}
```

Cascade order = array order. An element revealed by the slide but
**not** listed in `animations` pops in instantly (matches the 0.5.0
behaviour). The slate-level animationConfig has no "default per
element type" hook — animations are strictly opt-in per slide.

### `IAnimationConfig`

```typescript
interface IAnimationConfig {
    rates?:   { [animationName: string]: number };  // px/ms or rad/ms
    durations?: { [animationName: string]: number };
    cascadeGapMs?: number;       // pause between cascaded steps; default 0
    speedMultiplier?: number;    // 1.0 default; 0 = jump-to-final
    reducedMotion?: boolean;     // default reads prefers-reduced-motion CSS
}
```

Lets a consumer dial all `Circle.compass` animations 30% slower
without touching individual slides:

```javascript
animationConfig: { rates: { [A.Circle.compass]: 0.0021 } }
```

Resolution chain for an animation step's effective duration:
slide-entry `durationMs` → `config.durations[name]` →
`config.rates[name] × geometry` → animation's `defaultDurationMs` →
animation's `defaultRate × geometry`.

`reducedMotion: true` (or `speedMultiplier === 0`) short-circuits to
synchronous finalise — every animation jumps to its end state.

### Per-element animation properties

```typescript
class GeomElement {
    drawProgress: number;          // [0, 1]; default 1 (fully drawn)
    emphasisAmount: number;        // [0, 1]; default 0; replaces the old `emphasized` bool
}

class CircleElement extends GeomElement {
    drawStartAngle: number;        // default 0; arc sweep start
    faceAlpha: number;             // default 1; independent of drawProgress
}

class PolygonElement extends GeomElement {
    faceAlpha: number;             // default 1; independent of drawProgress
}
```

Default values reproduce the pre-animation render path bit-for-bit
on every consumer. Animations tick these fields through `[0, 1]`
during slide transitions and reset them in `finalise()`.

### `Slate.animateTo()` — the controller seam

```typescript
class Slate {
    animationConfig: IAnimationConfig;
    animator: SlateAnimator | null;        // lazy-created
    addEphemeral(e: GeomElement): void;
    removeEphemeral(e: GeomElement): void;
    clearEphemerals(): void;
    animateTo(
        targetVisible: Set<string>,
        targetHighlighted: Set<string>,
        slideAnimations: ISlideAnimation[],
        mode: "cascade" | "parallel",
    ): Promise<void>;
}
```

The slideshow controller (`SlateControls.showSlide`) computes the
target state and calls `animateTo()`; the promise resolves when every
animated step has finalised. Calling `animateTo` while a previous run
is in flight implicitly cancels it (`animator.cancel()` finalises every
started step + clears ephemerals + resolves the prior promise).

The `_ephemerals` list is for animation-local helpers — compass arms,
guide circles, straightedge bars. They render on top of `_elements`
in the same `face → edge → vertex → name` pass order, don't appear
in `lookupElement`, and never survive a `cancel()`.

### `IAnimationStep` shape

```typescript
interface IAnimationStep {
    durationMs: number;
    setup?: () => void;       // fires once before the first tick
    tick: (progress: number, dtMs: number, totalMs: number) => void;
    finalise: () => void;     // runs on completion, cancel, or skip
}
```

Each Animation's `build()` returns one or more steps. The animator
calls `setup()` once when the step is about to start (hide the target
element, register ephemeral helpers); `tick()` each frame with
clamped progress; `finalise()` always runs at the end (restore the
target's visible state, clean up ephemerals).

### What renders this

`SlateAnimator` (`src/SlateAnimator.ts`) owns a `requestAnimationFrame`
loop on `performance.now()`. `dt` is clamped to 100 ms per frame so a
backgrounded tab or long GC pause can't fast-forward the rest of the
animation into one paint — 60 / 120 / 144 Hz displays all see the
same wall-clock duration.

After every step finalises, the animator enters a 250 ms emphasis
fade-out phase: every animated target's `emphasisAmount` ticks 1 → 0
so the post-animation settle-back from full-emphasis stroke to
slide-highlight stroke is a smooth taper, not a snap.

### Adding new animations

The recipe (animation subclass, registry import, test, demo)
parallels [creating-constructions.md](creating-constructions.md);
see [creating-animations.md](creating-animations.md).

---

## Construction tables

Eight tables, one per element class. Each row shows the TypeScript API
form, the Java `<param>` form, what arguments the construction takes
(post-`LineElement` expansion — see
[convertParams](architecture.md#convertparams--the-type-sort-step)), and
what it produces.

Conventions:

- Lowercase italic `a`/`b`/`c` denote points; uppercase italic letters
  match the original applet's `tables.html`.
- `[plane X]` means the plane is optional — when omitted, the screen
  plane is used and the construction is 2D. When present, the
  construction is 3D.
- Constructions marked **3D-only** can only be used in solid geometry.
- `LineElement` references in `params` auto-expand to two
  `PointElement`s. So `params: ["AB", "C"]` where `AB` is a line is
  equivalent to `params: ["A", "B", "C"]`.

### Point — `E.Point.{name}`

| TS API | Java construction | Construction data | Description |
|---|---|---|---|
| `E.Point.free` | `point;free` | integers `x, y` | Freely draggable point in the screen plane at `(x, y, 0)`. |
| `E.Point.fixed` | `point;fixed` | integers `x, y, [z]` | Fixed (non-draggable) point at `(x, y, z)`. |
| `E.Point.midpoint` | `point;midpoint` | points `A, B` | Midpoint of segment AB. |
| `E.Point.intersection` | `point;intersection` | points `A, B, C, D, [plane E]` | Intersection of lines AB and CD in plane E. |
| `E.Point.intersection` | `point;intersection` (3D-only) | plane `A`, points `B, C` | Intersection of plane A and line BC. |
| `E.Point.first` | `point;first` | points `A, B` (or one line) | The first endpoint A. Returns an existing point reference (preexists). |
| `E.Point.last` | `point;last` | points `A, B` (or one line) | The last endpoint B. Returns an existing point reference (preexists). |
| `E.Point.center` | `point;center` | circle `A` | Center of circle A (preexists). |
| `E.Point.center` | `point;center` (3D-only) | sphere `A` | Center of sphere A (preexists). |
| `E.Point.lineSlider` | `point;lineSlider` | points `A, B`, ints `x, y, [z]` | Point that slides along line AB. |
| `E.Point.circleSlider` | `point;circleSlider` | circle `A`, ints `x, y, [z]` | Point that slides along circle A. |
| `E.Point.circumcenter` | `point;circumcenter` | points `A, B, C, [plane D]` | Center of the circle through A, B, C. |
| `E.Point.vertex` | `point;vertex` | polygon `A`, integer `i` | i-th vertex of polygon A (1-indexed; preexists). |
| `E.Point.foot` | `point;foot` | points `A, B, C` | Foot of perpendicular from A to line BC. |
| `E.Point.foot` | `point;foot` (3D-only) | point `A`, plane `B` | Foot of perpendicular from A to plane B. |
| `E.Point.cutoff` | `point;cutoff` | points `A, B, C, D` | Point E on AB so that AE = CD. |
| `E.Point.extend` | `point;extend` | points `A, B, C, D` | Point E on AB so that BE = CD (extends past B by length CD). |
| `E.Point.parallelogram` | `point;parallelogram` | points `A, B, C` | 4th vertex D of parallelogram ABCD; D = A + (C − B). |
| `E.Point.similar` | `point;similar` | points `A, B, D, E, F, [planes C, G]` | Point H so that △ABH (in C) is similar to △DEF (in G). |
| `E.Point.perpendicular` | `point;perpendicular` | points `A, B, [plane C]` | Point D so AD ⊥ AB and \|AD\| = \|AB\|. |
| `E.Point.perpendicular` | `point;perpendicular` | points `A, B, D, E, [plane C]` | Point F so AF ⊥ AB and \|AF\| = \|DE\|. |
| `E.Point.perpendicular` | `point;perpendicular` (3D-only) | points `A, C, D`, plane `B` | Point E on the line ⊥ B through A so dist(E, B) = \|CD\|. |
| `E.Point.proportion` | `point;proportion` | 8 points `A…H` | Point I on GH so AB:CD = EF:GI. |
| `E.Point.invert` | `point;invert` | point `A`, circle `B` | Image of A inverted in B. |
| `E.Point.meanProportional` | `point;meanProportional` | 6 points `A…F` | Point G on EF so AB:CD = CD:EG. |
| `E.Point.planeSlider` | `point;planeSlider` (3D-only) | plane `A`, ints `x, y, z` | Point that slides on plane A. |
| `E.Point.sphereSlider` | `point;sphereSlider` (3D-only) | sphere `A`, ints `x, y, z` | Point that slides on sphere A. |
| `E.Point.angleBisector` | `point;angleBisector` | points `A, B, C, [plane D]` | Intersection of the bisector of ∠BAC with line BC. |
| `E.Point.angleDivider` | `point;angleDivider` | points `A, B, C, [plane D]`, integer `n` | Point E on BC so ∠BAE = ∠BAC/n. |
| `E.Point.lineSegmentSlider` | `point;lineSegmentSlider` | points `A, B`, ints `x, y, [z]` | Sliding point clamped to segment AB. |
| `E.Point.harmonic` | `point;harmonic` | points `B, C, D` | Harmonic conjugate of B w.r.t. C and D. |

### Line — `E.Line.{name}`

| TS API | Java construction | Construction data | Description |
|---|---|---|---|
| `E.Line.connect` | `line;connect` | points `A, B` | Line through A and B. |
| `E.Line.angleBisector` | `line;angleBisector` | points `A, B, C, [plane D]` | Line AE bisecting ∠BAC with E on BC. |
| `E.Line.angleDivider` | `line;angleDivider` | points `A, B, C, [plane D]`, integer `n` | Line AE so ∠BAE = ∠BAC/n. |
| `E.Line.foot` | `line;foot` | points `A, B, C` | Line AD ⊥ BC in the screen plane. |
| `E.Line.foot` | `line;foot` (3D-only) | point `A`, plane `B` | Line AD ⊥ plane B with D on B. |
| `E.Line.chord` | `line;chord` | points `A, B`, circle `C` | Chord of circle C cut by line AB. |
| `E.Line.bichord` | `line;bichord` | circles `A, B` | Common chord through the two intersection points of A and B. |
| `E.Line.perpendicular` | `line;perpendicular` | points `A, B, [plane C]` | Line AD ⊥ AB with \|AD\| = \|AB\|. |
| `E.Line.perpendicular` | `line;perpendicular` | points `A, B, D, E, [plane C]` | Line AF ⊥ AB with \|AF\| = \|DE\|. |
| `E.Line.perpendicular` | `line;perpendicular` (3D-only) | points `A, C, D`, plane `B` | Line EF ⊥ plane B through A, length \|CD\|, E on B. |
| `E.Line.cutoff` | `line;cutoff` | points `A, B, C, D` | Line AE = CD along AB. |
| `E.Line.extend` | `line;extend` | points `A, B, C, D` | Line BE = CD extending past B; A, B, E collinear. |
| `E.Line.parallel` | `line;parallel` | points `A, B, C` | Line AD parallel and equal to BC. |
| `E.Line.similar` | `line;similar` | points `A, B, D, E, F, [planes C, G]` | Line AH where △ABH ∼ △DEF. |
| `E.Line.proportion` | `line;proportion` | 8 points | Line GI along GH so AB:CD = EF:GI. |
| `E.Line.meanProportional` | `line;meanProportional` | 6 points | Line EG along EF so AB:CD = CD:EG. |

### Circle — `E.Circle.{name}`

| TS API | Java construction | Construction data | Description |
|---|---|---|---|
| `E.Circle.radius` | `circle;radius` | points `A, B, [plane C]` | Circle, center A, radius \|AB\|. |
| `E.Circle.radius` | `circle;radius` | points `A, B, C, [plane D]` | Circle, center A, radius \|BC\|. |
| `E.Circle.circumcircle` | `circle;circumcircle` | points `A, B, C, [plane D]` | Circle through A, B, C. |
| `E.Circle.invert` | `circle;invert` | circles `A, B` | Image of A inverted in B. |
| `E.Circle.intersection` | `circle;intersection` (3D-only) | spheres `A, B` | Circle at intersection of A and B. |

### Polygon — `E.Polygon.{name}`

| TS API | Java construction | Construction data | Description |
|---|---|---|---|
| `E.Polygon.square` | `polygon;square` | points `A, B, [plane C]` | Square on side AB. |
| `E.Polygon.triangle` | `polygon;triangle` | points `A, B, C` | Triangle ABC. |
| `E.Polygon.quadrilateral` | `polygon;quadrilateral` | points `A, B, C, D` | Quadrilateral ABCD. |
| `E.Polygon.pentagon` | `polygon;pentagon` | 5 points | Pentagon (free vertices). |
| `E.Polygon.hexagon` | `polygon;hexagon` | 6 points | Hexagon (free vertices). |
| `E.Polygon.equilateralTriangle` | `polygon;equilateralTriangle` | points `A, B, [plane C]` | Equilateral triangle on side AB. |
| `E.Polygon.parallelogram` | `polygon;parallelogram` | points `A, B, C` | Parallelogram ABCD with D = A + (C − B). |
| `E.Polygon.regularPolygon` | `polygon;regularPolygon` | points `A, B`, integer `n`, `[plane C]` | Regular n-gon on side AB. |
| `E.Polygon.starPolygon` | `polygon;starPolygon` | points `A, B`, integers `n, d` | Star polygon {n/d} on side AB. |
| `E.Polygon.similar` | `polygon;similar` | points `A, B, D, E, F, [planes C, G]` | Triangle ABH ∼ DEF. |
| `E.Polygon.application` | `polygon;application` | polygon `A`, points `B, C, D` | Parallelogram of equal area to A, with side BC and angle BCD. |
| `E.Polygon.octagon` | `polygon;octagon` | 8 points | Octagon (free vertices). |
| `E.Polygon.face` | `polygon;face` (3D-only) | polyhedron `A`, integer `n` | n-th face of polyhedron A (preexists). |

### Sector — `E.Sector.{name}`

| TS API | Java construction | Construction data | Description |
|---|---|---|---|
| `E.Sector.sector` | `sector;sector` | points `A, B, C, [plane D]` | Sector with center A, radial points B and C. |
| `E.Sector.arc` | `sector;arc` | points `A, B, C, [plane D]` | Arc through A, B, C — the circumcircle's arc, drawn as a sector. |
| `E.Sector.angleMarker` | `sector;angleMarker` | points `V, P1, P2, [int radiusPx]` | 0.8.0+. Marks the **interior** angle P1-V-P2 with a small wedge whose radius the element chooses (default 22px, clamped to 0.45× the shorter arm) — independent of arm length, and auto-oriented to the interior so arm order doesn't matter. Defaults to a translucent palette fill + colored edge (cycled per marker); overridable per element. |
| `E.Sector.angleMarkerReflex` | `sector;angleMarkerReflex` | points `V, P1, P2, [int radiusPx]` | 0.8.0+. Same as `angleMarker` but draws the **major (reflex, > 180°)** arc. Euclid avoids reflex angles, so this is for rare teaching cases (a III.20-style central angle); interior is the default. |

### Plane — `E.Plane.{name}` (all 3D-only)

| TS API | Java construction | Construction data | Description |
|---|---|---|---|
| `E.Plane.threePoints` | `plane;3points` | points `A, B, C` | Plane through A, B, C. |
| `E.Plane.perpendicular` | `plane;perpendicular` | points `A, B` | Plane through A perpendicular to AB. |
| `E.Plane.parallel` | `plane;parallel` | plane `A`, point `B` | Plane through B parallel to A. |
| `E.Plane.ambient` | `plane;ambient` | point `A` (or circle `A`) | Ambient plane of A (preexists). |

> **Naming gotcha:** Java says `plane;3points`, the TS enum key is
> `threePoints` (JavaScript identifiers can't start with a digit).
> `parseParam` rewrites `"3points"` to `"threePoints"` internally so the
> string form still works.

### Sphere — `E.Sphere.{name}` (3D-only)

| TS API | Java construction | Construction data | Description |
|---|---|---|---|
| `E.Sphere.radius` | `sphere;radius` | points `A, B` | Sphere, center A, radius \|AB\|. |
| `E.Sphere.radius` | `sphere;radius` | points `A, B, C` | Sphere, center A, radius \|BC\|. |

### Polyhedron — `E.Polyhedra.{name}` (all 3D-only)

| TS API | Java construction | Construction data | Description |
|---|---|---|---|
| `E.Polyhedra.tetrahedron` | `polyhedron;tetrahedron` | points `A, B, C, D` | Tetrahedron with the four vertices. |
| `E.Polyhedra.parallelepiped` | `polyhedron;parallelepiped` | points `A, B, C, D` | Parallelepiped with edges AB, AC, AD. |
| `E.Polyhedra.prism` | `polyhedron;prism` | polygon `A`, points `B, C` | Prism with base A and side edges parallel and equal to BC. |
| `E.Polyhedra.pyramid` | `polyhedron;pyramid` | polygon `A`, point `B` | Pyramid with base A and apex B. |

> **Enum-key gotcha:** Java says `polyhedron;…`, the TS enum is
> `Polyhedra` (no `n`). `parseParam` handles the mapping
> automatically; if you're constructing `IConstructionInfo` objects by
> hand, use `E.Polyhedra.…`.

---

## `Slate` — runtime methods

`init()` returns nothing; the constructed `Slate` is appended to
`geomlib.slates`. To call methods on it post-init:

```javascript
let slate = geomlib.slates[geomlib.slates.length - 1];
```

The publicly-useful methods, all defined in
[src/Slate.ts](../src/Slate.ts):

| Method | Description |
|---|---|
| `slate.lookupElement(name)` | Return the `GeomElement` named `name`, or `null`. |
| `slate.elements` | Read-only view of all elements (in construction order). |
| `slate.update()` | Walk `_elements` calling `update()`, then redraw. Use after directly mutating an element's coords. |
| `slate.reset()` | Restore every element to its construction-time position (sliders rewind to their initial coords) and redraw. Same action as the SlateControls reset button (`r` / `space`). |
| `slate.setPivot(name)` | Set the rotation pivot. `"P"` for screen-plane pivot, `"P,plane"` for a 3D pivot on a non-screen plane. See [Drag pipeline](architecture.md#drag-pipeline-movepick--translatecoordinates--rotatecoordinates). |
| `slate.bgcolor` | Get or set the canvas background color. |

Lower-level methods (`createElement`, `convertParams`, `findConstruction`,
`movePick`, `translateCoordinates`, `rotateCoordinates`,
`updateCoordinates`) are described in
[architecture.md](architecture.md).

---

## SlateControls (UI overlay)

`init()` automatically calls `createControls(slate, canvas, config)`
from [src/SlateControls.ts](../src/SlateControls.ts), which wraps the
canvas in a relative-positioned `<div>` and overlays icon buttons at
the top-right:

| Button | Keyboard | Action |
|---|---|---|
| Reset (circular arrow) | `r` or `space` | `slate.reset()`. |
| Maximize (expand arrows) | `m` | Toggle: fill the viewport (position fixed, 100vw / 100vh, z-index 9999) or restore. |
| Present (play triangle) | `p` | Only when the slate has slides — step through the slideshow. |

The controls are **hidden by default and fade in on canvas hover or
keyboard focus** (`:hover` / `:focus-within`), so a page of many
diagrams isn't cluttered with a button row on each (#69). Keyboard
shortcuts only fire when the canvas itself has focus. The overlay can be
skipped (e.g. for headless rendering) by passing a canvas whose
`parentElement` is `null`.

---

## Example: porting an original applet HTML page

The original `<applet>` block:

```html
<applet code=Geometry archive=Geometry.zip width=340 height=320>
<param name=background value="35,19,100">
<param name=title value="I.2">
<param name=e[1] value="A;point;free;160,190">
<param name=e[2] value="B;point;free;190,160">
<param name=e[3] value="C;point;free;180,90">
<param name=e[4] value="BC;line;connect;B,C">
<param name=e[5] value="DAB;polygon;equilateralTriangle;A,B;0;0;0;0">
<param name=e[6] value="D;point;vertex;DAB,3;black;green">
<param name=pivot value="D">
</applet>
```

Becomes:

```html
<canvas id="myCanvas" width="340" height="320"></canvas>
<script src="dist/bundle.js"></script>
<script>
geomlib.init({
    background: "35,19,100",
    title: "I.2",
    canvasid: "myCanvas",
    pivot: "D",
    elements: [
        "A;point;free;160,190",
        "B;point;free;190,160",
        "C;point;free;180,90",
        "BC;line;connect;B,C",
        "DAB;polygon;equilateralTriangle;A,B;0;0;0;0",
        "D;point;vertex;DAB,3;black;green",
    ],
});
</script>
```

The full Phase 3 conversion of all 566 *Elements* propositions has
been done already; the output lives in the separate content-site
repository served at [euclids-elements.org](https://euclids-elements.org).
