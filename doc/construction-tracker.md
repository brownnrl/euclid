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

- [x] **`similar`** — `src/elements/point/SimilarElement.ts`
  - Extends `PointElement`; constructor takes `(A, B, AP, D, E, F, Q)` where
    A/B are the first two vertices of the output triangle, D/E/F define the
    reference triangle, and AP/Q are the ambient planes (both default to
    screen in the 2D variant). `update()` calls `this.toSimilar(...)` which
    already exists on `PointElement`.
  - Java source: `Similar.java` — 10 lines, line-for-line port. The math
    lives in `PointElement.toSimilar()` which was ported in a prior session.
  - 2D variant only per the 2D-first policy; the 3D variant (with explicit
    PlaneElement params) remains TBD. No signature-ordering hazard since the
    2D (5 params) and 3D (7 params) lengths differ.
  - Mocha tests (2): isosceles right triangle (factor=1, C=(50,300)),
    non-isosceles right triangle (factor=0.5, C=(50,250)).
  - [x] test view: [view/test/point/similar.html](../view/test/point/similar.html) — defIII11
  - [x] applet-tests pair:
    [view/applet-tests/point/similar/{original,applet}.html](../view/applet-tests/point/similar/)
  - **Tracker correction**: the proposition-tracker had I.23, I.24, I.26,
    I.31, III.14 listed as needing `point;similar` — they actually use
    `polygon;similar` or `line;similar`. Corrected in this branch.
  - Used in (actual `point;similar`): I.42, III.33, III.34, plus
    III.26–III.29 (but those are blocked by 3-point `circle;radius` TBD)

- [x] **`proportion`** — `src/elements/point/ProportionElement.ts`
  - Extends `PointElement`; constructor takes 8 PointElements (S0,S1,T0,T1,
    U0,U1,V0,V1) defining four line segments. `update()` computes the point
    V' on V0V1 such that |S|:|T| = |U|:|V0V'|.
  - Java source: `Proportion.java` — 26 lines, line-for-line port.
  - Mocha test (1): fourth-proportional at expected position.
  - [x] test view: [view/test/point/proportion.html](../view/test/point/proportion.html) — standalone
  - [x] applet-tests pair:
    [view/applet-tests/point/proportion/{original,applet}.html](../view/applet-tests/point/proportion/)
  - Used in: I.16, I.29 (secondary applet variants)

- [x] **`angleBisector`** — `src/elements/Constructions.ts` (`AngleBisectorPointConstruction`)
  - Reuses `AngleDividerElement` with n=2. 2D variant (screen plane).
  - Java source: `AngleDivider.java` — full class port 2026-04-12.
  - No Books I–IV uses for the point variant (line variant used in IV.4, IV.13, IV.16)

- [x] **`angleDivider`** — `src/elements/Constructions.ts` (`AngleDividerPointConstruction`)
  - Reuses `AngleDividerElement` with variable n. 2D variant.
  - Java source: `AngleDivider.java`.
  - No Books I–IV uses found

- [ ] **`invert`** — TBD
  - Java source: `InvertPoint.java`
  - No Books I–X uses found

- [x] **`meanProportional`** — `src/elements/point/MeanProportionalElement.ts`
  - Extends `PointElement`. Geometric mean: |U'| = sqrt(|S|*|T|).
  - Java source: `MeanProportional.java` — 23 lines, line-for-line port.
  - Mocha test (1): geometric mean, proportion S:U'=U':T verified.
  - [x] test view: [view/test/point/meanProportional.html](../view/test/point/meanProportional.html)
  - [x] applet-tests pair:
    [view/applet-tests/point/meanProportional/{original,applet}.html](../view/applet-tests/point/meanProportional/)
  - Used in: VIII.20, VIII.26, X (33 props), XIII.2 — **35 props unblocked**

- [ ] **`planeSlider`** — TBD (solid geometry)
  - Java source: `PlaneSlider.java`

- [ ] **`sphereSlider`** — TBD (solid geometry)
  - Java source: `SphereSlider.java`

- [ ] **`harmonic`** — TBD
  - Java source: `Harmonic.java`
  - No Books I–XIII uses found in applet HTML

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

- [x] **`angleBisector`** — `src/elements/Constructions.ts` (`AngleBisectorLineConstruction`)
  - Reuses `AngleDividerElement` (n=2) + `LineElement` wrapper. 2D variant.
  - Java source: `AngleDivider.java` — full class port 2026-04-12.
  - Mocha test (1): right-angle bisector at (50,50).
  - [x] test view: [view/test/line/angleBisector.html](../view/test/line/angleBisector.html) — propIV4
  - [x] applet-tests pair:
    [view/applet-tests/line/angleBisector/{original,applet}.html](../view/applet-tests/line/angleBisector/)
  - Used in: Book IV (IV.4, IV.13, IV.16)

- [x] **`angleDivider`** — `src/elements/Constructions.ts` (`AngleDividerLineConstruction`)
  - Reuses `AngleDividerElement` (variable n) + `LineElement` wrapper. 2D variant.
  - Java source: `AngleDivider.java`.
  - No Books I–IV uses found

- [x] **`foot`** (2D variant) — `src/elements/Constructions.ts` (`LineFootConstruction`)
  - No dedicated element class — reuses existing `Foot` + base `LineElement`.
    `construct()` creates `Foot(A, B, C)` (foot of perpendicular from A to
    line BC) then `new LineElement({A, B: foot})`.
  - Java source: `Slate.java` line case 3, choice 0. The solid-geometry
    variant (choice > 0, using `PlaneFoot`) remains TBD.
  - Mocha test (1): perpendicularity check (dot product = 0), foot coords.
  - [x] test view: [view/test/line/foot.html](../view/test/line/foot.html) — full propI47 (Pythagoras)
  - [x] applet-tests pair:
    [view/applet-tests/line/foot/{original,applet}.html](../view/applet-tests/line/foot/)
  - Used in: I.47 (Pythagoras' theorem)

- [x] **`cutoff`** — `src/elements/Constructions.ts` (`LineCutoffConstruction`)
  - Layoff+LineElement dispatch trick, same pattern as `line;extend`.
  - Mocha test (1): cutoff length verification.
  - Used in: compass geometry pages. No Books I–XIII proposition uses.

- [x] **`similar`** — `src/elements/Constructions.ts` (`SimilarLineConstruction`)
  - No new element class — reuses `SimilarElement` (from `point;similar`) +
    `LineElement` wrapper. `construct()` creates `SimilarElement(A,B,screen,D,E,F,screen)`
    then `LineElement(A, sim)`.
  - Java source: `Slate.java` line case 10.
  - Mocha test (1): line endpoint at the similar point.
  - [x] test view: [view/test/line/similar.html](../view/test/line/similar.html) — propI31
  - [x] applet-tests pair:
    [view/applet-tests/line/similar/{original,applet}.html](../view/applet-tests/line/similar/)
  - Used in: I.31

- [ ] **`proportion`** — TBD
  - Java source: `Proportion.java`
  - No Books I–XIII uses found in applet HTML (the line variant is unused)

- [x] **`meanProportional`** — `src/elements/Constructions.ts` (`MeanProportionalLineConstruction`)
  - Reuses `MeanProportionalElement` + `LineElement` wrapper.
  - Java source: `Slate.java` line case 12.
  - No standalone test view (covered by point variant test page).

---

## Circle constructions

- [x] **`radius`** — `src/elements/circle/CircleElement.ts` (via `CircleRadiusCenterConstruction`)
  - [x] test view: [view/test/circle/circle.html](../view/test/circle/circle.html)

- [x] **`circumcircle`** (2D + 3D) — `src/elements/circle/CircumcircleElement.ts`
  - [x] test view: [view/test/circle/circumcircle.html](../view/test/circle/circumcircle.html)

- [ ] **`invert`** — TBD
  - Java source: `InvertCircle.java`
  - No Books I–XIII uses found in applet HTML

- [ ] **`intersection`** — TBD
  - Java source: `IntersectionSS.java` (41 lines) — intersection of two spheres → circle
  - Blocks 2 propositions (XIII.15, XIII.17)

---

## Polygon constructions

- [x] **`triangle`** — `src/elements/polygon/PolygonElement.ts` (via `TrianglePolygonConstruction`)
  - [~] test view: [view/test/poly/triangle.html](../view/test/poly/triangle.html) — tests triangle among other elements; no standalone triangle page

- [x] **`quadrilateral`** — `src/elements/Constructions.ts` (`QuadrilateralPolygonConstruction`)
  - One-line subclass of `PolyConstruction` with 4-point signature.
    No new element class — `construct()` is inherited from `PolyConstruction`
    and passes all 4 points through to `new PolygonElement(ps)`.
  - Java source: `Slate.java` polygon case 2 → `new PolygonElement(P[0],P[1],P[2],P[3])`.
  - Mocha test (1): 4-vertex correctness from propI43-style coords.
  - [x] test view: [view/test/poly/quadrilateral.html](../view/test/poly/quadrilateral.html) — full propI43
  - [x] applet-tests pair:
    [view/applet-tests/poly/quadrilateral/{original,applet}.html](../view/applet-tests/poly/quadrilateral/)
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

- [x] **`square`** — `src/elements/Constructions.ts` (`SquarePolygonConstruction`)
  - Reuses `RegularPolygonElement` with n=4. Same pattern as
    `EquilateralTriangleConstruction` (n=3). No new element class.
  - Also completed the `RegularPolygonElement.ts` port by adding the
    optional `d` (density) parameter from `RegularPolygon.java`'s second
    constructor, per the "full Java class conversion" rule. This lays
    groundwork for `polygon;starPolygon` in a future session.
  - Java source: `Slate.java` polygon case 0 → `new RegularPolygon(A, B, screen, 4)`.
  - Mocha test (1): 4-vertex correctness from propI46 coords, all-sides-equal check.
  - [x] test view: [view/test/poly/square.html](../view/test/poly/square.html) — propI46
  - [x] applet-tests pair:
    [view/applet-tests/poly/square/{original,applet}.html](../view/applet-tests/poly/square/)
  - Used in: I.46–I.47, II.2–II.8, II.11

- [x] **`equilateralTriangle`** — `src/elements/polygon/RegularPolygonElement.ts` (via `EquilateralTriangleConstruction`)
  - 2D variant only (screen plane); 3D variant (`[PointElement, PointElement, PlaneElement]`) TBD
  - Java source: `RegularPolygon.java` with n=3; theta=π/3, cos=0.5, sin=√3/2
  - `update()`: V[2].to(V[0]).rotate(V[1], cos, sin, screen)
  - [x] test view: [view/test/poly/equilateralTriangle.html](../view/test/poly/equilateralTriangle.html) — mirrors propI10 params
  - Used in: I.2, I.9–I.11, III.10, III.24

- [x] **`similar`** — `src/elements/Constructions.ts` (`SimilarPolygonConstruction`)
  - No new element class — reuses `SimilarElement` (from `point;similar`) +
    `PolygonElement` wrapper. `construct()` creates `SimilarElement(A,B,screen,D,E,F,screen)`
    then `PolygonElement([A, B, sim])`.
  - Java source: `Slate.java` polygon case 9.
  - Mocha test (1): triangle vertices at expected similar-point location.
  - [x] test view: [view/test/poly/similar.html](../view/test/poly/similar.html) — propI23
  - [x] applet-tests pair:
    [view/applet-tests/poly/similar/{original,applet}.html](../view/applet-tests/poly/similar/)
  - Used in: I.23, I.24, I.26, III.14

- [x] **`application`** — `src/elements/polygon/ApplicationElement.ts`
  - Extends `PolygonElement`; constructor takes `(P polygon, A point, B point,
    C point)`. Creates a parallelogram ABEF with side AB, angle CAB, and
    area = P.area(). `update()` computes factor from area ratio then scales
    along AC to get V[3], with V[2] closing the parallelogram.
  - Java source: `Application.java` — 43 lines, line-for-line port.
  - Also added `area()` method to `PolygonElement.ts` (fan triangulation
    from V[0]) and fixed a pre-existing bug in `PointElement.length2()`
    (`this._z + this._z` → `this._z * this._z`).
  - Overrides `update()`, `translate()`, `rotate()`.
  - Mocha test (1): parallelogram area = input triangle area (4000).
  - [x] test view: [view/test/poly/application.html](../view/test/poly/application.html) — propI44
  - [x] applet-tests pair:
    [view/applet-tests/poly/application/{original,applet}.html](../view/applet-tests/poly/application/)
  - Used in: I.44, I.45, II.14 — **the final 3 propositions for 100% I–III**

- [x] **`regularPolygon`** — `src/elements/Constructions.ts` (`RegularPolygonConstruction`)
  - Reuses `RegularPolygonElement.ts` with variable n. 2D variant (screen plane).
    Signature `[PointElement, PointElement, Integer]`.
  - Registered BEFORE `SquarePolygonConstruction` and
    `EquilateralTriangleConstruction` in the constructions array (3-param
    signature is longer than 2-param, per signature-ordering rule).
  - Java source: `Slate.java` polygon case 7 → `new RegularPolygon(A, B, screen, n)`.
  - Mocha test (1): regular pentagon (n=5), all-sides-equal check.
  - [x] test view: [view/test/poly/regularPolygon.html](../view/test/poly/regularPolygon.html) — propIV11
  - [x] applet-tests pair:
    [view/applet-tests/poly/regularPolygon/{original,applet}.html](../view/applet-tests/poly/regularPolygon/)
  - Used in: Book IV (IV.11, IV.12, IV.13, IV.14, IV.16)

- [ ] **`starPolygon`** — TBD
  - Java source: `RegularPolygon.java` — element class ported with density
    param `d` (added 2026-04-12). Only the Construction dispatcher with
    `[PointElement, PointElement, Integer, Integer]` signature is needed.
  - No Books I–IV uses found

- [x] **`pentagon`** — `src/elements/Constructions.ts` (`PentagonPolygonConstruction`)
  - 5-point pass-through `PolyConstruction`. Same pattern as quadrilateral.
  - Used in: propIV11 variant 3 (star pentagon figure)

- [x] **`hexagon`** — `src/elements/Constructions.ts` (`HexagonPolygonConstruction`)
  - 6-point pass-through `PolyConstruction`. Same pattern as quadrilateral.
  - Used in: IV.15

- [x] **`octagon`** — `src/elements/Constructions.ts` (`OctagonPolygonConstruction`)
  - 8-point pass-through `PolyConstruction`. Same pattern as pentagon/hexagon.
  - Mocha test (1): 8-vertex correctness.
  - Used in: Book XII (XII.2, XII.10 sole-blocker; XII.11, XII.12 also need polyhedron)

- [ ] **`face`** — TBD
  - Returns the N-th face (a PolygonElement) of a PolyhedronElement.
    Same pattern as `point;vertex` (returns the N-th vertex of a polygon).
  - Needs `PolyhedronElement` base class ported first.
  - Java dispatch: `Slate.java` polygon case 12 → `((PolyhedronElement)E[0]).P[N[0]-1]`
  - Blocks 1 proposition (XII.7)

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

- [x] **`3points`** — `src/elements/Constructions.ts` (`Plane3PointsConstruction`)
  - No new element class — `PlaneElement.ts` already has the full constructor
    + `update()`. The dispatcher just creates `PlaneElement({A, B, C})`.
  - Mocha test (1): S/T/U frame verification for xy-plane.
  - Used in: Books XI–XIII (prerequisite for 22 propositions; 2 sole-blocker: XI.29, XI.38)

- [ ] **`parallel`** — TBD
  - Java source: `ParallelP.java` (26 lines) — parallel plane through a point
  - Blocks 3 propositions (XI.11, XI.26, XI.39)

- [ ] **`ambient`** — TBD (the default screen plane)
  - No Books I–XIII uses found in applet HTML

---

## Sphere constructions (solid geometry)

- [x] **`radius`** — `src/elements/sphere/SphereElement.ts`
  - no dedicated test page

---

## Polyhedra constructions (solid geometry)

- [ ] **`tetrahedron`** — TBD
  - Needs `PolyhedronElement.java` base class (78 lines) ported first
  - Blocks 7 propositions (XII.3–XII.5, XII.8–XII.9, XIII.13, XIII.15)
- [ ] **`parallelepiped`** — TBD
  - Needs `PolyhedronElement.java` base class ported first
  - Blocks 6 propositions (XI.37, XII.5, XII.9, XII.11, XII.12, XIII.15)
- [ ] **`prism`** — TBD (Java source: `Prism.java`, 41 lines)
  - Needs `PolyhedronElement.java` base class ported first
  - Blocks 3 propositions (XI.39, XII.7, XIII.14)
- [ ] **`pyramid`** — TBD (Java source: `Pyramid.java`, 11 lines)
  - Needs `PolyhedronElement.java` base class ported first
  - Blocks 3 propositions (XI.23, XII.6, XIII.14)

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
