# Architecture

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
│   └── SlateTest.ts              # Mocha test suite
├── geom_applet/
│   └── source/                   # Original Java source files (.java + .class)
├── view/
│   ├── euclid-html/              # Original Java applet HTML (Books I–XIII)
│   │   ├── booki/ … bookxiii/    # Per-book proposition HTML files
│   └── test/                     # TypeScript demo pages, one per construction type
│       ├── point/                # point/foot.html, point/intersection.html, …
│       ├── line/                 # line/bichord.html, line/perpendicular.html, …
│       ├── circle/               # circle/circle.html, circle/circumcircle.html
│       ├── poly/                 # poly/index.html
│       └── sector/               # sector/index.html
├── dist/
│   └── bundle.js                 # Webpack output (consumed by view/test/ HTML files)
└── AGENTS.md                     # Agent quick-start guide
```

---

## Data flow: from `init()` to canvas

```
geomlib.init({ canvasid, elements: [...] })
  └─ new Slate(canvas)
       ├─ creates screen plane (three FixedPoints + PlaneElement)
       └─ for each element spec:
            slate.createElement(construction, params, name)
              ├─ convertParams(params)        ← string → element lookup
              │                                 LineElement → two PointElements
              ├─ findConstruction(cm, params)  ← iterates constructions[], validateSignature()
              └─ Construction.construct(screen, params)
                   └─ returns [elementsForUpdate, newElement]
                        ├─ elementsForUpdate → pushed onto slate._elementsForUpdate
                        └─ newElement        → pushed onto slate._elements

slate.update()
  ├─ for each elem in _elementsForUpdate: elem.update()
  └─ drawElements()
       └─ for each elem in _elements:
            elem.drawFace() → elem.drawEdge() → elem.drawVertex() → elem.drawName()
```

Mouse/touch events call `movePick(x, y)` which translates the picked `PointElement`,
then calls `slate.update()` to redraw.

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

`Slate.findConstruction(cm, params)` iterates the exported `constructions` array
(`Constructions.ts`) and calls `validateSignature(cm, params)` on each entry.
The array is a spread-concatenation of 8 per-type arrays, each exported from
its `{Type}Constructions.ts` file (e.g., `pointConstructions` from
`point/PointConstructions.ts`).

`validateSignature` checks two things:
1. `construction.constructionMethod === cm` (the enum value matches)
2. `params` types match `construction.signature` (element types in order)

Because multiple `Construction` subclasses can share the same `constructionMethod`
enum value with different signatures (2D vs. 3D variants), the **first match wins**.
Insertion order in `constructions` is therefore significant — longer (3D) signatures
must come before shorter (2D) ones to avoid greedy prefix matching.

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

---

## `convertParams` — the param expansion step

Before a construction receives its `params`, `Slate.convertParams` transforms them:

1. **String → element lookup**: `"A"` → the `GeomElement` named `"A"` on the slate
2. **`LineElement` → two `PointElement`s**: if the looked-up element is a `LineElement`,
   it is replaced with `[lineElement._A, lineElement._B]` in the params array

This means the `params` array that arrives at `Construction.construct()` can be longer
than the original param list in the HTML. Construction `signature` arrays must reflect
the post-expansion types, not the raw HTML param count.

---

## Adding a new construction — the four-file checklist

1. **Element class**: `src/elements/{type}/FooElement.ts`
2. **Construction class**: new subclass in `src/elements/{type}/{Type}Constructions.ts`,
   add to the per-type `{type}Constructions` array at the bottom of the same file
3. **Test**: new `it(...)` block in `tests/SlateTest.ts`
4. **Demo page**: `view/test/{super_type}/{sub_type}.html`

The enum entry for the construction (e.g. `PointConstructions.foo = N`) already exists
for all documented constructions — check the enum definitions in `Constructions.ts`.

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

## Public API (`src/index.ts`)

```typescript
// Object form (structured)
geomlib.init({
    canvasid: "myCanvas",
    background: "#ffe9cd",
    title: "Proposition I.1",
    elements: [
        { name: "A", construction: E.Point.free, params: [125, 130] },
        { name: "B", construction: E.Point.free, params: [215, 130] },
        { name: "AB", construction: E.Line.connect, params: ["A", "B"] },
    ]
})

// String form (Java param format — can be mixed with object form)
geomlib.init({
    background: "35,19,100",
    title: "I.1",
    canvasid: "myCanvas",
    elements: [
        "A;point;free;125,130",
        "B;point;free;215,130",
        "AB;line;connect;A,B",
    ]
})
```

`E` is the construction enum accessor: `E.Point.free`, `E.Line.connect`, `E.Circle.radius`, etc.
`Align` is `{ ABOVE, BELOW, LEFT, RIGHT, CENTRAL }`.
`parseParam(s)` converts a Java param string to `IConstructionInfo`.

UI controls (reset, maximize, new window) are injected automatically by `init()`.
Keyboard shortcuts when canvas is focused: `r`/`space` = reset, `u`/`return` = new window, `m` = maximize.
