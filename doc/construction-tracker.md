# Construction Tracker

Tracks the implementation status of every construction type and its associated test view page.
Update this file after each session.

---

## Platform-level TODOs

These affect the library as a whole, independent of individual constructions.

- [ ] **`parseColor` bug** (`src/Colors.ts` line 31) — The condition
  `val == "none" || 0 || "0" || ""` always evaluates to `true` because the literal
  `"0"` is truthy. This means any color that isn't a named color, `null`, `"random"`,
  `"darker"`, `"brighter"`, or `"background"` silently returns `null` (transparent).
  Hex strings like `"#ff0000"` passed as element colors are silently dropped.
  Fix: change to `val == "none" || val == "0" || val === 0 || val == ""`

- [ ] **Numeric `0` color not handled in `init()`** (`src/index.ts`) — The Java applet
  uses integer `0` to mean transparent. `IConstructionInfo` types colors as `string?`
  but the Java convention passes the number `0`. The `parseColor` function takes a
  string; passing a number bypasses the null-check path and hits the buggy else-if.
  Fix: accept `string | number | null` in `IConstructionInfo` and normalize to `null`
  before calling `parseColor`.

- [ ] **`title` not rendered** (`src/index.ts` / `src/Slate.ts`) — `IInitialization`
  accepts a `title` field but `Slate.drawElements()` never draws it. The title appears
  in the original Java applet in a header region above the canvas.

- [ ] **Per-element `align` not settable via init()** (`src/index.ts`) — `IConstructionInfo`
  has no `align` field; all elements get the same `defaultAlign`. The Java applet supports
  per-element label placement.

- [ ] **Labels all use the same default orientation** (`src/elements/GeomElement.ts`) —
  In the TypeScript port every label is drawn at the same position relative to its vertex
  (currently below/at the default align direction). In the Java applet labels adapt to the
  geometry: a vertex at the top of a figure gets its label *above* the dot, a bottom vertex
  gets its label *below*, etc. Example: in the equilateral triangle test (propI10), the apex
  label "C" should sit above the vertex point, but in the port it sits below, making it harder
  to read and obscuring the vertex dot. Fix requires either: (a) a per-element `align` field in
  `IConstructionInfo` so callers can override placement, or (b) a heuristic in `drawName` that
  infers placement from the element's position relative to other elements.

- [ ] **Highlight colors not settable via init()** — `GeomElement` has
  `nameHighlightColor`, `vertexHighlightColor`, `edgeHighlightColor`, `faceHighlightColor`
  properties but `IConstructionInfo` exposes no way to set them. Currently only settable
  programmatically after `init()`.

- [ ] **`IntersectionPL.ts` is a copy of `Intersection.ts`** (`src/elements/point/IntersectionPL.ts`) —
  The file header says "Intersection.ts" and it exports a class named `Intersection` that does
  line–line intersection. Java `IntersectionPL.java` does **plane–line intersection** via
  `toIntersectionPL()` (which does exist on PointElement). File needs to be rewritten.

- [ ] **Missing `"gray"` color** (`src/Colors.ts`) — Java's color table includes `"gray"`;
  TypeScript has `"darkGray"` and `"lightGray"` but not `"gray"`. Propositions using `"gray"` for
  element colors will silently get the default color instead.

- [ ] **HSB color format not supported** (`src/Colors.ts`) — Java interprets `"h,s,b"` comma-
  separated triples as HSB (hue 0–360, sat/bri 0–100). TypeScript has `HSVtoRGB()` but
  `parseColor` does not detect this format. The original `view/euclid-html/` background params
  use this format (e.g. `"35,19,100"`).

- [ ] **`validateSignature` incomplete** (`src/elements/Constructions.ts` ~line 194) —
  Has a `// TODO: resume here` comment inside the switch statement, and
  `case ConstructionTypes.SphereElement: // TODO: break` is a stub. Signature
  validation may silently pass for mismatched sphere parameters.

- [ ] **`console.log(i)` in production** (`src/index.ts` line 46) — Debug logging
  left in `init()`. Remove before any public release.

- [ ] **`PerpendicularPlane` potential division by zero** (`src/elements/plane/PerpendicularPlane.ts`
  ~line 56) — Marked `// TODO: Check division by 0?` in the normalization step.

- [ ] **Default `faceColor` for `dimension == 2` elements diverges from Java applet**
  (`src/index.ts` line 73) — `init()` applies a default `faceColor = lighten(bgcolor)` to
  any element whose `dimension == 2`, so `SectorElement` / `ArcElement` / polygons / filled
  circles all pick up a pale-fill auto-face when the caller does not set `faceColor`
  explicitly. The Java applet leaves face-color unset unless the param string specifies
  one, so Joyce's propositions that wanted an open arc wrote `;0;0;…;0` to explicitly
  suppress the (Java-side?) default. We can currently work around it in `IConstructionInfo`
  only by passing a non-null string that `parseColor` interprets as transparent — but the
  numeric-0 → null path is itself blocked by the `parseColor` bug at line 31 and by
  `IConstructionInfo` not accepting `number | null` for color fields. Full fix needs all
  three platform TODOs (this one + parseColor + numeric-0 handling in `init()`) resolved
  together so a caller can write `faceColor: 0` or `faceColor: null` and get an open face.
  - **First observed instance**: `sector;arc` in `view/test/sector/arc.html` renders a
    pale-cream pie slice from `_Center → A → B → _Center` where Java's
    [view/applet-tests/sector/arc/applet.html](../view/applet-tests/sector/arc/applet.html)
    shows just the open arc curve. Geometry is identical; only the default fill differs.
    Documented in the three-way harness comparison on 2026-04-11.

---

## Point constructions

- [x] **`free`** — `src/elements/point/PlaneSlider.ts`
  - no dedicated test page (used implicitly in every test view)

- [x] **`fixed`** (2D + 3D) — `src/elements/point/FixedPoint.ts`
  - no dedicated test page (used internally in Slate screen setup)

- [x] **`first`** — (returned directly in `FirstPointConstruction`)
  - no dedicated test page

- [x] **`last`** — (returned directly in `LastPointConstruction`)
  - no dedicated test page

- [x] **`midpoint`** — `src/elements/point/Midpoint.ts`
  - no dedicated test page

- [x] **`intersection`** — `src/elements/point/Intersection.ts`
  - [x] test view: [view/test/point/intersection.html](../view/test/point/intersection.html)

- [x] **`foot`** — `src/elements/point/Foot.ts`
  - [x] test view: [view/test/point/foot.html](../view/test/point/foot.html) — adapted from Book X lemma

- [x] **`extend`** — `src/elements/point/Layoff.ts` (shared with `cutoff`)
  - no dedicated test page

- [x] **`cutoff`** — `src/elements/point/Layoff.ts`
  - no dedicated test page

- [x] **`center`** — (returned directly in `CircleCenterConstruction`)
  - no dedicated test page

- [x] **`circumcenter`** (2D + 3D) — (computed inside `CircumcenterConstruction`)
  - [~] test view: [view/test/circumcenter_lineperp.html](../view/test/circumcenter_lineperp.html) — compound test with line perpendicular; no standalone page

- [x] **`lineSlider`** (3D, 2D, segment variants) — `src/elements/point/LineSlider.ts`
  - no dedicated test page

- [x] **`circleSlider`** — `src/elements/point/CircleSlider.ts`
  - [~] tested in [view/test/sector/sector.html](../view/test/sector/sector.html) — no standalone page

- [x] **`perpendicular`** (5 signature variants) — `src/elements/point/Perpendicular*.ts`
  - [~] tested in [view/test/circumcenter_lineperp.html](../view/test/circumcenter_lineperp.html) — no standalone page

- [x] **`parallelogram`** — `src/elements/Constructions.ts` (`ParallelogramConstruction`, reuses `Layoff`)
  - `new Layoff(C, A, B, A, B)` computes D′ = C + (B − A); factor=1 so it reduces to pure vector addition
  - Java dispatch: `case 13: element[eCount] = new Layoff(P[0],P[1],P[2],P[1],P[2])`
  - [x] test view: [view/test/point/parallelogram.html](../view/test/point/parallelogram.html) — based on propI28 params; shows the completed parallelogram ABCA→D′
  - Used in: I.28, I.30, I.32–I.36, I.37–I.41, I.42–I.43, all of Book II

- [x] **`vertex`** — `src/elements/Constructions.ts` (`VertexConstruction`)
  - Returns `polygon.V[n-1]` (1-based index); no new element file needed
  - Also added `PolygonElement` to `ConstructionTypes` enum and `validateSignature`
  - [x] test view: [view/test/point/vertex.html](../view/test/point/vertex.html)
  - Used in: I.2, I.9–I.11, I.23–I.24, I.26, I.33–I.34, I.36, I.41–I.47, Book II, III.14, III.24–III.25

- [ ] **`similar`** — TBD
  - Java source: `Similar.java`
  - Used in: I.23–I.24, I.26, I.31, I.42, I.44–I.45, III.14, III.24–III.29, III.33–III.34

- [ ] **`proportion`** — TBD
  - Java source: `Proportion.java`
  - Used in: I.16, I.29

- [ ] **`angleBisector`** — TBD
  - Java source: `AngleDivider.java`
  - No Books I–III uses

- [ ] **`angleDivider`** — TBD
  - Java source: `AngleDivider.java`
  - No Books I–III uses

- [ ] **`invert`** — TBD
  - Java source: `InvertPoint.java`
  - No Books I–III uses

- [ ] **`meanProportional`** — TBD
  - Java source: `MeanProportional.java`
  - No Books I–III uses

- [ ] **`planeSlider`** — TBD (solid geometry)
  - Java source: `PlaneSlider.java`

- [ ] **`sphereSlider`** — TBD (solid geometry)
  - Java source: `SphereSlider.java`

- [ ] **`harmonic`** — TBD
  - Java source: `Harmonic.java`
  - No Books I–III uses

---

## Line constructions

- [x] **`connect`** — `src/elements/line/LineElement.ts` (via `LineConnectConstruction`)
  - no dedicated test page (used implicitly in every test view)

- [x] **`extend`** — `src/elements/line/LineElement.ts` (via `LineExtendConstruction`)
  - no dedicated test page

- [x] **`perpendicular`** (5 signature variants) — `src/elements/line/Perpendicular*.ts`
  - [x] test view: [view/test/line/perpendicular.html](../view/test/line/perpendicular.html)
  - [~] also tested in [view/test/circumcenter_lineperp.html](../view/test/circumcenter_lineperp.html)

- [x] **`bichord`** — `src/elements/line/Bichord.ts`
  - [x] test view: [view/test/line/bichord.html](../view/test/line/bichord.html)

- [x] **`parallel`** — `src/elements/Constructions.ts` (`LineParallelConstruction`)
  - No dedicated element class — reuses existing `Layoff` + base `LineElement`,
    mirroring the dispatch trick from `Slate.java` case 9. `construct()` creates
    `Layoff(A, B, C, B, C)` → D = A + (C−B), then `new LineElement({A, B: D})`.
    Same pattern as `LineExtendConstruction`.
  - **Not** `ParallelP.java` — that file is `PlaneElement.parallel` (solid geometry).
    The line construction has no dedicated Java class; it's dispatched inline in
    Slate.java.
  - Mocha tests (2): update correctness (D = A + (C−B), direction and length
    equality verified), recompute after moving input point C.
  - [x] test view: [view/test/line/parallel.html](../view/test/line/parallel.html) — exercises the construction 3 times (2 horizontal + 1 diagonal)
  - [x] applet-tests pair:
    [view/applet-tests/line/parallel/{original,applet}.html](../view/applet-tests/line/parallel/)
  - Used in: I.22, I.27, I.37–I.40, II.8–II.9, II.11

- [x] **`chord`** — `src/elements/line/Chord.ts`
  - Extends `LineElement`; constructor takes `(D, E, C)` where D/E are the two
    `PointElement` endpoints of the input line (post-`LineElement` expansion)
    and C is the `CircleElement`. Allocates internal `_A`/`_B` PointElements
    sharing `C.AP` as the chord's own endpoints.
  - Java source: `Chord.java` — 23 lines, line-for-line port. `update()`:
    project center to line (foot of ⊥), compute half-chord length
    `s = √(r² − d²)`, derive `A` from D via vector formula, then
    `B := 2·foot − A` (reflection trick). NaN-sentinels both endpoints
    when `d² > r²` (line misses circle).
  - 2D variant only per the 2D-first policy; `Chord.java` has only one
    signature so there is no 3D variant to defer.
  - Mocha tests (4): `update()` against propI12 hand-computed expectations
    (chord.A ≈ (82.540, 180), chord.B ≈ (237.460, 180), both on the circle),
    `d² > r²` NaN-path, `translate()` isolation, `rotate()` isolation —
    all in `tests/SlateTest.ts`.
  - [x] test view: [view/test/line/chord.html](../view/test/line/chord.html) — full propI12
  - [x] applet-tests pair:
    [view/applet-tests/line/chord/{original,applet}.html](../view/applet-tests/line/chord/)
  - Used in: I.12, II.5, II.14, III.1, III.5–III.6, III.8–III.9, III.10
    (no longer blocked), III.12, III.15, III.17, III.34, III.36–III.37

- [ ] **`angleBisector`** — TBD
  - Java source: `AngleDivider.java`
  - No Books I–III uses

- [ ] **`angleDivider`** — TBD
  - Java source: `AngleDivider.java`
  - No Books I–III uses

- [ ] **`foot`** (line-to-plane, solid geometry) — TBD
  - Java source: `PlaneFoot.java`

- [ ] **`similar`** — TBD
  - Java source: `Similar.java`
  - No Books I–III uses

- [ ] **`proportion`** — TBD
  - Java source: `Proportion.java`
  - No Books I–III uses

- [ ] **`meanProportional`** — TBD
  - Java source: `MeanProportional.java`
  - No Books I–III uses

---

## Circle constructions

- [x] **`radius`** — `src/elements/circle/CircleElement.ts` (via `CircleRadiusCenterConstruction`)
  - [x] test view: [view/test/circle/circle.html](../view/test/circle/circle.html)

- [x] **`circumcircle`** (2D + 3D) — `src/elements/circle/CircumcircleElement.ts`
  - [x] test view: [view/test/circle/circumcircle.html](../view/test/circle/circumcircle.html)

- [ ] **`invert`** — TBD
  - Java source: `InvertCircle.java`
  - No Books I–III uses

---

## Polygon constructions

- [x] **`triangle`** — `src/elements/polygon/PolygonElement.ts` (via `TrianglePolygonConstruction`)
  - [~] test view: [view/test/poly/triangle.html](../view/test/poly/triangle.html) — tests triangle among other elements; no standalone triangle page

- [ ] **`quadrilateral`** — TBD
  - Java source: `PolygonElement.java`
  - Used in: I.43–I.46, II.2, II.4–II.6, II.8–II.9, II.14

- [x] **`parallelogram`** — `src/elements/Constructions.ts` (`ParallelogramPolygonConstruction`)
  - No dedicated element class — reuses existing `Layoff` + base `PolygonElement`.
    `construct()` creates `Layoff(A, B, C, B, C)` → D = A + (C−B), then
    `new PolygonElement([A, B, C, D])`. Same Layoff dispatch trick as
    `Slate.java` case 6 (not `PolygonElement.java` — the Java class is just
    the polygon renderer, not the parallelogram-specific logic).
  - Mocha tests (2): 4th vertex correctness from propI34 coords
    (D = (210,175)), vertex extraction via `point;vertex;CABD,4`, and
    opposite-side-length equality.
  - [x] test view: [view/test/poly/parallelogram.html](../view/test/poly/parallelogram.html) — propI34
  - [x] applet-tests pair:
    [view/applet-tests/poly/parallelogram/{original,applet}.html](../view/applet-tests/poly/parallelogram/)
  - Used in: I.34–I.36, I.41, II.1–II.11

- [ ] **`square`** — TBD
  - Java source: `PolygonElement.java`
  - Used in: I.46–I.47, II.2–II.8, II.11

- [x] **`equilateralTriangle`** — `src/elements/polygon/RegularPolygonElement.ts` (via `EquilateralTriangleConstruction`)
  - 2D variant only (screen plane); 3D variant (`[PointElement, PointElement, PlaneElement]`) TBD
  - Java source: `RegularPolygon.java` with n=3; theta=π/3, cos=0.5, sin=√3/2
  - `update()`: V[2].to(V[0]).rotate(V[1], cos, sin, screen)
  - [x] test view: [view/test/poly/equilateralTriangle.html](../view/test/poly/equilateralTriangle.html) — mirrors propI10 params
  - Used in: I.2, I.9–I.11, III.10, III.24

- [ ] **`similar`** — TBD
  - Java source: `Similar.java`
  - Used in: III.23–III.24, III.26–III.29

- [ ] **`application`** — TBD
  - Java source: `Application.java`
  - Used in: I.44–I.45, II.14

- [ ] **`regularPolygon`** — TBD
  - Java source: `RegularPolygon.java`
  - No Books I–III uses

- [ ] **`starPolygon`** — TBD
  - Java source: `RegularPolygon.java`
  - No Books I–III uses

- [ ] **`pentagon`** — TBD
  - Java source: `PolygonElement.java`
  - No Books I–III uses

- [ ] **`hexagon`** — TBD
  - Java source: `PolygonElement.java`
  - No Books I–III uses

- [ ] **`octagon`** — TBD
  - Java source: `PolygonElement.java`
  - No Books I–III uses

---

## Sector constructions

- [x] **`sector`** (2 signature variants) — `src/elements/sector/SectorElement.ts`
  - [x] test view: [view/test/sector/sector.html](../view/test/sector/sector.html)

- [x] **`arc`** — `src/elements/sector/ArcElement.ts`
  - Extends `SectorElement`; constructor takes `(A, M, B, Plane)` and creates a bare
    internal `_Center = new PointElement()` that `update()` recomputes every frame via
    `_Center.toCircumcenter(A, M, B)`. Overrides `translate`/`rotate` to move only
    `_Center` (A, M, B are independent slate elements).
  - Java source: `Arc.java` — 23 lines, line-for-line port.
  - 2D variant only per the 2D-first policy; the 3D variant
    `[PointElement, PointElement, PointElement, PlaneElement]` remains TBD. When
    added, MUST be registered BEFORE `ArcConstruction` in the `constructions` array
    (signature variant ordering rule).
  - Mocha tests (3): circumcenter of propIII2 points, `translate()` isolation,
    `rotate()` isolation — all in `tests/SlateTest.ts`.
  - [x] test view: [view/test/sector/arc.html](../view/test/sector/arc.html) — propIII2
  - [x] applet-tests pair:
    [view/applet-tests/sector/arc/{original,applet}.html](../view/applet-tests/sector/arc/)
  - **Known cosmetic divergence from Java applet**: the TS port renders a pale-cream
    pie-slice fill under the arc curve where the Java applet shows an open curve. This
    is the default-faceColor bug documented above — *not* a geometry bug. Dragging E
    tracks the arc's circumcenter smoothly and matches Java behavior.
  - Used in: I.4 (blocked — see below), I.16, II.5–II.8, III.2, III.10, III.13,
    III.23–III.25, III.30

---

## Plane constructions (solid geometry)

- [x] **`perpendicular`** — `src/elements/plane/PerpendicularPlane.ts`
  - no dedicated test page

- [ ] **`3points`** — TBD
  - Java source: `PlaneElement.java`

- [ ] **`parallel`** — TBD

- [ ] **`ambient`** — TBD (the default screen plane)

---

## Sphere constructions (solid geometry)

- [x] **`radius`** — `src/elements/sphere/SphereElement.ts`
  - no dedicated test page

---

## Polyhedra constructions (solid geometry)

- [ ] **`tetrahedron`** — TBD
- [ ] **`parallelepiped`** — TBD
- [ ] **`prism`** — TBD (Java source: `Prism.java`)
- [ ] **`pyramid`** — TBD (Java source: `Pyramid.java`)

---

## Test view page coverage summary

| Construction | Test page | Status |
|---|---|---|
| `Point.free` | (used in all pages) | implicit |
| `Point.intersection` | view/test/point/intersection.html | exists |
| `Point.foot` | view/test/point/foot.html | exists |
| `Point.vertex` | view/test/point/vertex.html | exists |
| `Point.circumcenter` | view/test/circumcenter_lineperp.html | compound |
| `Point.circleSlider` | view/test/sector/sector.html | compound |
| `Point.perpendicular` | view/test/circumcenter_lineperp.html | compound |
| `Line.connect` | (used in all pages) | implicit |
| `Line.perpendicular` | view/test/line/perpendicular.html | exists |
| `Line.bichord` | view/test/line/bichord.html | exists |
| `Circle.radius` | view/test/circle/circle.html | exists |
| `Circle.circumcircle` | view/test/circle/circumcircle.html | exists |
| `Polygon.triangle` | view/test/poly/triangle.html | compound |
| `Polygon.equilateralTriangle` | view/test/poly/equilateralTriangle.html | exists |
| `Point.parallelogram` | view/test/point/parallelogram.html | exists |
| `Sector.sector` | view/test/sector/sector.html | exists |
| `Sector.arc` | view/test/sector/arc.html | exists |
| All others | — | missing |
