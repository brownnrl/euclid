# Architecture

> **Companion docs:**
> [api.md](api.md) is the reference for the public surface (every
> `init()` field, every `E.{Type}.{name}`, every color/align value).
> [creating-constructions.md](creating-constructions.md) is the
> step-by-step recipe for adding a new construction. This document is
> the implementation-level "how the pieces fit together."

## What this library is

`geomlib` is a TypeScript port of David E. Joyce's *Geometry Applet*
(Clark University, 1996, Java version 2.2). Joyce wrote it to
illustrate Euclid's *Elements* on the web; it renders interactive
Euclidean diagrams where the user can drag points and watch all
derived constructions follow. The original Java applet's overview
page is mirrored at
`geom_applet/source/Geometry.html` and its construction reference at
`geom_applet/source/tables.html`. We aim to be a faithful reimplementation
of those two contracts on top of the HTML5 `<canvas>` element.

A diagram is described by an ordered list of *elements*. Each element
belongs to one of **eight classes** — `point`, `line`, `circle`,
`polygon`, `sector`, `plane`, `sphere`, `polyhedron` — and is built
by one of that class's *construction methods*. Plane geometry uses the
first five classes; all eight are needed for solid geometry. Joyce's
`<param name=e[N] value="…">` schema and our
`elements: [{...}]` API are two surfaces over the same model.

### Interaction model

Three kinds of points exist on a slate, distinguished by how the user
can drag them (matching the Java applet's behavior):

- **Free points** (red by default, drawn via `PlaneSlider`). Freely
  draggable in their ambient plane. The rest of the diagram tracks.
- **Sliding points** (orange by default — `LineSlider`, `CircleSlider`,
  `PlaneSlider` on a non-screen plane, `SphereSliderElement`). Draggable,
  but motion is constrained to a parent line/circle/plane/sphere.
- **Computed / fixed points** (black by default, or green when used as
  a *pivot*). Not directly draggable — but grabbing one fires the
  drag pipeline's *translate* or *rotate-around-pivot* branch instead
  of moving the point itself, so the whole scene shifts or rotates.

The `r` / `space` keyboard shortcut (also exposed as a SlateControls
button) calls `Slate.reset()` to restore every element to its
construction-time position. `m` toggles maximize, `u` / `return`
opens the same scene in a new window.

### Element schema (one HTML param ↔ one `IConstructionInfo`)

```
"Name;type;construction;arg1,arg2,…[;nameColor[;vertexColor[;edgeColor[;faceColor]]]]"
```

- **Name** — slate-unique identifier for later references.
- **type** — one of the eight element classes.
- **construction** — the construction method within that class
  (`free`, `midpoint`, `bichord`, …). The full catalog is
  [api.md § Construction tables](api.md#construction-tables).
- **args** — comma-separated. Strings reference earlier elements by
  name; numbers are integer coordinates or counts. A `LineElement`
  named in args auto-expands to its two endpoint `PointElement`s
  (Joyce's "Special note 1": any time two points are needed, one line
  may be given instead).
- **colors** (all optional, in order): name, vertex, edge, face. Up to
  four layers per element. See [Colors](#colors) for the parser rules.

Slate-level params (set on `init()`, not per element):
`background`, `title`, `align`, `pivot`, `font`, `fontsize`. The
applet's `debug` flag is not implemented in the TS port.

### Source-file mapping (Java → TypeScript)

| Java class (Geometry.html §Source files) | TS file |
|---|---|
| `Geometry.java` (applet entry) | `src/index.ts` |
| `Slate.java` (canvas + dispatch + drag) | `src/Slate.ts` (rendering on `<canvas>`) + `src/elements/Constructions.ts` (dispatch) |
| `Element.java` | `src/elements/GeomElement.ts` |
| `PointElement.java` (+ 17 subclasses) | `src/elements/point/*.ts` |
| `LineElement.java` (+ Bichord, Chord, Perpendicular, PlanePerpendicular) | `src/elements/line/*.ts` |
| `CircleElement.java` (+ Circumcircle, InvertCircle, IntersectionSS) | `src/elements/circle/*.ts` |
| `PolygonElement.java` (+ Application, RegularPolygon) | `src/elements/polygon/*.ts` |
| `SectorElement.java` (+ Arc) | `src/elements/sector/*.ts` |
| `PlaneElement.java` (+ ParallelP, PerpendicularPL) | `src/elements/plane/*.ts` |
| `SphereElement.java` | `src/elements/sphere/SphereElement.ts` |
| `PolyhedronElement.java` (+ Prism, Pyramid) | `src/elements/polyhedron/*.ts` |
| `ClientFrame.java` (Java AWT detached frame) | replaced by SlateControls' "new window" button (`src/SlateControls.ts`) |
| `Remote.java` (applet remote-control) | not ported |

The full porting status is recorded in
[historical/java-port/java-port-tracker.md](historical/java-port/java-port-tracker.md);
the porting completed 2026-04-12 and its trackers, journal, and
analysis notes live under [historical/](historical/).

---

## Repository layout

```
euclid/
├── src/
│   ├── index.ts                  # Public API: init(), parseParam(), E enum, Align
│   ├── Slate.ts                  # Canvas manager, element orchestration, mouse events
│   ├── SlateControls.ts          # UI overlay: reset, maximize, new window buttons
│   ├── Colors.ts                 # Color parsing: parseColor(), brighter(), darker()
│   └── elements/
│       ├── GeomElement.ts        # Abstract base class for all geometry
│       ├── Constructions.ts      # Enums, abstract Construction, registration array (262 lines)
│       ├── point/                # PointElement subclasses + PointConstructions.ts
│       ├── line/                 # LineElement subclasses + LineConstructions.ts
│       ├── circle/               # CircleElement subclasses + CircleConstructions.ts
│       ├── polygon/              # PolygonElement subclasses + PolygonConstructions.ts
│       ├── sector/               # SectorElement subclasses + SectorConstructions.ts
│       ├── plane/                # PlaneElement subclasses + PlaneConstructions.ts
│       ├── sphere/               # SphereElement + SphereConstructions.ts
│       └── polyhedron/           # PolyhedronElement, Prism, Pyramid + PolyhedronConstructions.ts
├── tests/
│   ├── {Circle,Line,Plane,Point,Polygon,Polyhedron,Sector,Sphere,Slate}Test.ts
│   │                              # Per-element-type unit suites (split 2026-04-18)
│   ├── ColorsTest.ts, ParseParamTest.ts
│   ├── SnapshotTest.ts            # Auto-discovers HTML scenes, drags points,
│   │                              #   diffs against tests/snapshots/ goldens
│   ├── SnapshotHelper.ts          # Render + drag + pixel-diff utilities
│   ├── HtmlParamParser.ts         # Loads Java <applet>/<param> HTML into Slate config
│   ├── shared/dragScenes.ts       # Reusable scenes for slate-drag tests
│   └── snapshots/                 # Golden PNGs (one per slate)
├── geom_applet/
│   ├── source/                   # Original Java source files (*.java + Geometry.html + tables.html)
│   └── Geometry.zip              # Original 1998 deployable applet archive (preserved as-is)
├── view/
│   ├── euclid-html/              # Original Joyce HTML pages, Books I–XIII (snapshot test fixtures)
│   ├── compass_geometry/         # Joyce compass-series scenes (snapshot test fixtures)
│   ├── round_geometry/           # Joyce spherical-geometry scenes (snapshot test fixtures)
│   └── test/{type}/{sub}.html    # TypeScript demo pages, one per construction
├── dist/
│   └── bundle.js                 # Webpack output (consumed by view/test/ HTML files)
└── AGENTS.md                     # Agent quick-start guide
```

---

## Data flow: from `init()` to canvas

```
geomlib.init({ canvasid, elements: [...], pivot?, background?, title?, … })
  └─ new Slate(canvas)
       ├─ creates screen plane (three FixedPoints + PlaneElement)
       └─ for each element spec (object form OR Java param string):
            (parseParam if string) → IConstructionInfo
            slate.createElement(construction, params, name)
              ├─ convertParams(params) ← string → element lookup; sorts into
              │                          SortedParams { P[], E[], N[] }
              │                          (LineElement names expand to their
              │                           two endpoint PointElements in P)
              ├─ findConstruction(cm, sp) ← iterates constructions[], picks the
              │                              first whose validateSignature() matches
              │                              by type counts (and elementTypes if set)
              └─ Construction.construct(screen, P, E, N)
                   └─ returns [elementsForUpdate, newElement]
                        ├─ elementsForUpdate → pushed onto slate._elementsForUpdate
                        └─ newElement        → pushed onto slate._elements

  ├─ if config.pivot: slate.setPivot(config.pivot)
  ├─ slate.update()
  │     ├─ for each elem in _elementsForUpdate: elem.update()
  │     └─ drawElements()
  │          └─ for each elem in _elements:
  │               elem.drawFace() → elem.drawEdge() → elem.drawVertex() → elem.drawName()
  └─ createControls(slate, canvas, config)   ← injects reset/maximize/new-window
                                                buttons + keyboard shortcuts on top
                                                of the canvas (src/SlateControls.ts)
```

Mouse/touch events call `movePick(x, y)`; see "Drag pipeline" below.

---

## Drag pipeline: `movePick` / `translateCoordinates` / `rotateCoordinates`

`Slate.movePick(c, d)` routes a drag to one of three branches based on
what was picked and the scene state:

1. **Draggable point** (`PlaneSlider`, `LineSlider`, `CircleSlider`,
   `SphereSliderElement`, `FixedPoint` with `draggable=true`).
   → `pick.drag(c, d)` writes the new coords, then
   `updateCoordinates(picki)` calls `.update()` on every element after
   the picked one so derived elements recompute from the moved parent.

2. **Non-draggable point whose ambient plane has a `pivot` set, and
   the pick isn't the pivot itself.** → `rotateCoordinates(c, d)`.
   Computes `(ac, as)` = the scale + rotation factor that maps the
   pick's old position to the new mouse position (both expressed
   relative to the pivot in the ambient plane's (S, T) basis). Then:
     - Iterate `_elements` (not `_elementsForUpdate` — the latter is a
       subset) and call `.rotate(pivot, ac, as)` on each non-preexists
       entry, matching Java's full-`element[]` walk in `Slate.java`
       843-845.
     - Call `this.update()` afterward. This re-derives any element
       whose container didn't move it directly — most importantly,
       `Layoff` points returned by `point;last` on a `line;extend`-made
       LineElement (the bare LineElement's `rotate()` is a no-op so
       nothing moves the Layoff via the container path). Re-deriving
       from the rotated parents gives the correct post-rotation
       position because the rotation is linear. Java doesn't need this
       step because its `element[]` holds duplicate entries for shared
       objects and the Layoff gets rotated directly via its
       non-preexists entry — see
       [historical/java-port/construction-tracker.md](historical/java-port/construction-tracker.md)'s
       *preexists* item for the full rationale.

3. **Non-draggable point with no applicable pivot.** →
   `translateCoordinates(dx, dy)` moves every non-preexists element
   by `(dx, dy)` and calls `.update()`.

**Key invariants:**
- Both `rotateCoordinates` and `translateCoordinates` iterate
  `_elements`, not `_elementsForUpdate`. The latter is for `update()`
  propagation only.
- `preexists` is set on a `GeomElement` when `createElement` finds it
  already in `_elements` before the construction push — i.e. it's a
  re-reference (first/last/center/vertex/etc.) to something a prior
  construction added. Java sets it explicitly in
  `Slate.java` cases 3/4/5/8/9/15; the TS heuristic is coarser but
  aligns for the common Layoff case and works for the bichord endpoint
  case after the #43 update-after-rotate fix.
- Rotation and translation **do not** commute with `update()` for
  container elements that move their own points (Bichord, Chord,
  Perpendicular, Circumcircle, RegularPolygon, Application, InvertCircle,
  SphereIntersection). Their `rotate`/`translate` methods call
  `.rotate`/`.translate` on owned sub-points, and those owned points
  must NOT also be iterated by the outer loop — hence the preexists
  skip. Getting this mapping right is the recurring footgun in this
  codebase.

---

## The `screen` plane

`Slate`'s constructor creates three `FixedPoint`s (`screen_origin`, `screen_x`, `screen_y`)
and a `PlaneElement` from them named `screen`. The plane's orthonormal basis vectors
(S, T, U) map the screen coordinate system.

This `screen` plane is passed as the first argument to every `Construction.construct()` call.
2D constructions use it as their implicit plane of operation. 3D constructions receive an
explicit plane from the construction parameters.

---

## Construction dispatch: the `constructions` array

`Slate.findConstruction(cm, sp)` iterates the exported `constructions` array
(`Constructions.ts`) and calls `validateSignature(cm, sp)` on each entry.
The array is a spread-concatenation of 8 per-type arrays, each exported from
its `{Type}Constructions.ts` file (e.g., `pointConstructions` from
`point/PointConstructions.ts`).

Dispatch is **type-counted**, mirroring Java's `selectDataChoice` in
`Slate.java` 344-393. A `ConstructionSignature` is an object with numeric
counts plus an optional subtype list:

```typescript
{ points: number, elements: number, integers: number, elementTypes?: Function[] }
```

`validateSignature` checks:

1. `construction.constructionMethod === cm` (the enum value matches)
2. `sp.P.length === sig.points`, `sp.E.length === sig.elements`,
   `sp.N.length === sig.integers` (post-`convertParams` type counts match)
3. If `sig.elementTypes` is set, each `sp.E[i] instanceof sig.elementTypes[i]`

Because dispatch is by counts (not positional types), the source HTML param
order is irrelevant — `"E,Vplane,D,B"` and `"E,D,B,Vplane"` both match
`{ points: 3, elements: 1, elementTypes: [PlaneElement] }`. See
[historical/java-port/analysis/type-counted-dispatch-plan.md](historical/java-port/analysis/type-counted-dispatch-plan.md)
for the migration rationale.

Because multiple `Construction` subclasses can share the same
`constructionMethod` enum value, the **first match wins**. Insertion
order matters **only** when two subclasses have *identical*
`(points, elements, integers)` counts but differ in `elementTypes` —
then the more specific (subtype-narrowed) signature must come first
so it's checked before a more permissive sibling. With distinct counts
(typical of 2D vs. 3D variants), order is irrelevant.

---

## Element class hierarchy

```
GeomElement (abstract — src/elements/GeomElement.ts)
  ├─ PointElement      (src/elements/point/PointElement.ts)
  │    ├─ PlaneSlider           (free draggable point)
  │    ├─ FixedPoint            (non-draggable; 2D and 3D variants)
  │    ├─ Midpoint
  │    ├─ LineSlider            (constrained to a line; 2D, 3D, segment)
  │    ├─ CircleSlider          (constrained to a circle)
  │    ├─ SphereSliderElement   (constrained to a sphere)
  │    ├─ Intersection          (line-line intersection; 2D and 3D)
  │    ├─ PlaneIntersection     (plane-line intersection)
  │    ├─ Foot                  (perpendicular foot from point to line)
  │    ├─ PlaneFootElement      (perpendicular foot from point to plane)
  │    ├─ Layoff                (extend/cutoff — geometric layoff)
  │    ├─ SimilarElement        (similar triangle point)
  │    ├─ ProportionElement     (fourth proportional)
  │    ├─ MeanProportionalElement (geometric mean)
  │    ├─ AngleDividerElement   (angle bisector/divider)
  │    ├─ HarmonicElement       (harmonic conjugate)
  │    └─ InvertPointElement    (inversion in a circle)
  ├─ LineElement        (src/elements/line/LineElement.ts)
  │    ├─ Perpendicular         (5 signature variants)
  │    ├─ PlanePerpendicularLine
  │    ├─ Bichord               (common chord of two circles)
  │    └─ Chord                 (chord cut by a line)
  ├─ CircleElement      (src/elements/circle/CircleElement.ts)
  │    ├─ CircumcircleElement
  │    ├─ InvertCircleElement   (circle inversion)
  │    └─ SphereIntersectionElement (intersection of two spheres)
  ├─ PolygonElement     (src/elements/polygon/PolygonElement.ts)
  │    ├─ RegularPolygonElement (square, equilateral triangle, regular n-gon, star)
  │    └─ ApplicationElement    (area-preserving parallelogram)
  ├─ SectorElement      (src/elements/sector/SectorElement.ts)
  │    └─ ArcElement
  ├─ PlaneElement       (src/elements/plane/PlaneElement.ts)
  │    ├─ PerpendicularPlane
  │    └─ ParallelPlane
  ├─ SphereElement      (src/elements/sphere/SphereElement.ts)
  └─ PolyhedronElement  (src/elements/polyhedron/PolyhedronElement.ts)
       ├─ PyramidElement
       └─ PrismElement
```

---

## Key `GeomElement` properties

| Property | Type | Purpose |
|----------|------|---------|
| `dimension` | `number` | 0=point, 1=line/circle, 2=polygon/sector/filled — controls which draw layers fire |
| `nameColor` | `string\|null` | Color for the label; null = don't draw |
| `vertexColor` | `string\|null` | Color for the vertex dot |
| `edgeColor` | `string\|null` | Color for the line/arc |
| `faceColor` | `string\|null` | Fill color for polygons and sectors |
| `highlight*` | `string\|null` | Highlight-state override colors |
| `align` | `Align` | Label placement: ABOVE / BELOW / LEFT / RIGHT / CENTRAL |

---

## The `update()` contract

Every `GeomElement.update()` must:
- Be **idempotent** — callable multiple times with the same result
- Read **only** from stored parent element references (set in the constructor)
- Write **only** to the element's own coordinate properties
- **Not** push into any global list or trigger side effects

Elements are called in construction-order (insertion order into `_elementsForUpdate`),
which matches the declaration order in the user's `elements` array. Parents always
appear before children, so a child's `update()` always sees fresh parent coordinates.

For `PointElement` subclasses: write `this._x`, `this._y`, `this._z`.
For `LineElement` subclasses: write `this._A._x/y/z` and `this._B._x/y/z`
(the two endpoint `PointElement`s stored on the line element).

### `reset()` vs. `update()`

`update()` recomputes from current parents. `reset()` restores an element
to its construction-time state — `PlaneSlider.reset()` rewinds to its
`_initx/_inity/_initz`, `LineSlider.reset()` to its initial `t`, and so on.
`Slate.reset()` calls `elem.reset()` on every element and then `slate.update()`,
which is what the reset button (and the `r`/`space` keyboard shortcut) on each
SlateControls overlay invokes. After dragging, `update()` keeps showing the
*current* dragged state; `reset()` rewinds the whole scene to where `init()`
left it.

---

## `convertParams` — the type-sort step

Before `findConstruction` looks anything up, `Slate.convertParams(params)`
walks the raw `params` array and returns `SortedParams { P, E, N }`:

1. **String → element lookup**: `"A"` is replaced with the slate's element
   named `"A"`.
2. **Bucket by type**:
   - `PointElement` instances → `P[]`
   - `LineElement` instances → expanded to their two endpoint
     `PointElement`s, both pushed into `P[]`
   - all other elements (Circle, Plane, Sphere, Polygon, Polyhedron) → `E[]`
   - numbers → `N[]`

`Construction.construct()` then receives `(screen, P, E, N)` — three
already-sorted arrays, not a single mixed list. Signatures match by the
*counts* of these arrays, not by positional types; see the dispatch
section above.

---

## Adding a new construction

The four files (element class, construction class, test, demo page),
the contracts each must satisfy, and the common pitfalls to watch
for live in [creating-constructions.md](creating-constructions.md).
The enum entries (`PointConstructions.foo = N`, etc.) already exist
for every construction Joyce documents in `tables.html`; the slot for
your work is in `src/elements/{type}/{Type}Constructions.ts`.

---

## Colors

`parseColor(s)` in `Colors.ts` handles:
- Named CSS colors: `"black"`, `"red"`, etc.
- Hex: `"#ffe9cd"`
- RGB string from Java: `"35,19,100"` (the background param format)
- `"random"` — picks a random color
- `"darker"` / `"brighter"` — relative to previous color
- Numeric `0` — treated as `null` (transparent, don't draw this layer)

Null color for a draw layer means `draw{Edge,Face,Vertex,Name}` is skipped entirely.

---

## Public API — see [api.md](api.md)

The full reference for every `init()` field, every `E.{Type}.{name}`,
every accepted color/align value, and every public `Slate` method is
in **[api.md](api.md)**. That doc is the canonical mapping back to
Joyce's `Geometry.html` parameter contract and `tables.html`
construction catalog.

The high-level shape: `init()` takes an `IInitialization` object with
slate-level params (`background`, `title`, `pivot`, `font`, `fontsize`,
`align`, `canvasid`) and an `elements: (IConstructionInfo | string)[]`
ordered list. Each element entry can be a structured object —

```typescript
{ name: "A", construction: E.Point.free, params: [125, 130] }
```

— or a raw Java `<param value=…>` string —

```typescript
"A;point;free;125,130"
```

— and the two forms can be mixed in the same `elements` array.
`parseParam(s)` is the public converter.

`init()` also calls `createControls()` from `src/SlateControls.ts`,
which wraps the canvas and adds the reset / maximize / new-window
button overlay plus keyboard shortcuts (`r`/`space`, `u`/`return`,
`m`). See [api.md § SlateControls](api.md#slatecontrols-ui-overlay).
