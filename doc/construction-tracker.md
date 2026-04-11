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

- [ ] **`parallelogram`** — TBD
  - Java source: construct `Slate.java` or `Geometry.java` (4th vertex: D = A + C − B)
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

- [ ] **`parallel`** — TBD
  - Java source: `ParallelP.java`
  - Used in: I.22, I.27, I.37–I.40, II.8–II.9, II.11

- [ ] **`chord`** — TBD
  - Java source: `Chord.java`
  - Used in: I.12, II.5, II.14, III.1, III.5–III.6, III.8–III.9, III.12, III.15, III.17, III.34, III.36–III.37

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

- [ ] **`parallelogram`** — TBD
  - Java source: `PolygonElement.java`
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

- [ ] **`arc`** — TBD
  - Java source: `Arc.java` — computes circumcenter of three given points; draws arc through A, M, B
  - Used in: I.4, I.16, I.29, II.5–II.8, III.2, III.10, III.13, III.23–III.25, III.30

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
| `Sector.sector` | view/test/sector/sector.html | exists |
| All others | — | missing |
