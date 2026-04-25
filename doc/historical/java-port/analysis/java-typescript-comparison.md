# Java ↔ TypeScript Codebase Comparison

Full analysis of what has been ported from the Java applet (`geom_applet/source/`) to
TypeScript (`src/`), what is missing, and what differs in implementation.

---

## Quick-reference mapping table

| Java class | TypeScript file | Status | Notes |
|---|---|---|---|
| `Element.java` | `src/elements/GeomElement.ts` | ✅ ported | See differences §3 |
| `PointElement.java` | `src/elements/point/PointElement.ts` | ✅ ported | Methods match; see §4 |
| `LineElement.java` | `src/elements/line/LineElement.ts` | ✅ ported | |
| `CircleElement.java` | `src/elements/circle/CircleElement.ts` | ✅ ported | Ellipse drawing ported |
| `SectorElement.java` | `src/elements/sector/SectorElement.ts` | ✅ ported | |
| `PolygonElement.java` | `src/elements/polygon/PolygonElement.ts` | ⚠️ partial | Only `triangle` wired as a Construction; n-vertex constructors not mapped |
| `PlaneElement.java` | `src/elements/plane/PlaneElement.ts` | ✅ ported | |
| `SphereElement.java` | `src/elements/sphere/SphereElement.ts` | ✅ ported | |
| `PolyhedronElement.java` | _(missing)_ | ❌ missing | No TypeScript class; enum values 701–704 are TBD |
| `Geometry.java` (init/colors) | `src/index.ts` + `src/Colors.ts` | ⚠️ partial | HSB color format missing; `parseColor` bug; title not drawn; per-element align not supported |
| `Slate.java` | `src/Slate.ts` | ✅ ported | Hit tolerance differs (10 px Java → 50 px TS) |
| `FixedPoint.java` | `src/elements/point/FixedPoint.ts` | ✅ ported | |
| `PlaneSlider.java` | `src/elements/point/PlaneSlider.ts` | ⚠️ name collision | See §5.1 — TS `PlaneSlider` = Java's free point; Java's constrained `planeSlider` is TBD |
| `Midpoint.java` | `src/elements/point/Midpoint.ts` | ✅ ported | |
| `Foot.java` | `src/elements/point/Foot.ts` | ✅ ported | |
| `Intersection.java` | `src/elements/point/Intersection.ts` | ✅ ported | |
| `IntersectionPL.java` | `src/elements/point/IntersectionPL.ts` | ❌ wrong | File is a copy of `Intersection.ts`; Java does plane–line intersection, TS does line–line |
| `IntersectionSS.java` | _(missing)_ | ❌ missing | Sphere–sphere intersection circle; `CircleConstructions.intersection(204)` is TBD |
| `Layoff.java` | `src/elements/point/Layoff.ts` | ✅ ported | Used for both `extend` and `cutoff` constructions |
| `LineSlider.java` | `src/elements/point/LineSlider.ts` | ✅ ported | 3D, 2D, and segment variants |
| `CircleSlider.java` | `src/elements/point/CircleSlider.ts` | ✅ ported | |
| `SphereSlider.java` | _(missing)_ | ❌ missing | `toSphere()` exists in PointElement; TBD construction |
| `Perpendicular.java` | `src/elements/line/Perpendicular.ts` | ✅ ported | Line-for-line identical to Java |
| `PerpendicularPL.java` | `src/elements/line/PlanePerpendicularLine.ts` | ✅ ported | |
| `PlanePerpendicular.java` | `src/elements/plane/PerpendicularPlane.ts` | ✅ ported | |
| `PlaneFoot.java` | _(missing)_ | ❌ missing | `toPlane()` exists; trivial to port |
| `Bichord.java` | `src/elements/line/Bichord.ts` | ✅ ported | |
| `Chord.java` | _(missing)_ | ❌ missing | Needed for I.12, III.1 etc. |
| `ParallelP.java` | _(missing)_ | ❌ missing | Needed for I.22, I.27, I.37–I.40 |
| `Circumcircle.java` | `src/elements/circle/CircumcircleElement.ts` | ✅ ported | |
| `Arc.java` | _(missing)_ | ❌ missing | `toCircumcenter` exists; straightforward to port |
| `Similar.java` | _(missing)_ | ❌ missing | `toSimilar()` exists in PointElement; needs wrapper class |
| `AngleDivider.java` | _(missing)_ | ❌ missing | Covers both `angleBisector` (n=2) and `angleDivider` (n=N) |
| `Proportion.java` | _(missing)_ | ❌ missing | |
| `MeanProportional.java` | _(missing)_ | ❌ missing | |
| `Harmonic.java` | _(missing)_ | ❌ missing | Complex math |
| `InvertPoint.java` | _(missing)_ | ❌ missing | `toInvertPoint()` exists; needs wrapper |
| `InvertCircle.java` | _(missing)_ | ❌ missing | |
| `RegularPolygon.java` | _(missing)_ | ❌ missing | Covers both regular and star polygons |
| `Application.java` | _(missing)_ | ❌ missing | Area-scaling parallelogram |
| `Pyramid.java` | _(missing)_ | ❌ missing | Solid geometry |
| `Prism.java` | _(missing)_ | ❌ missing | Solid geometry |
| `Remote.java` | _(not needed)_ | N/A | Applet remote-control UI; not applicable to web port |
| `ClientFrame.java` | _(not needed)_ | N/A | Java AWT frame; not applicable |

---

## 1. Framework layer: `Geometry.java` + `Slate.java` → `index.ts` + `Slate.ts` + `Colors.ts`

### 1.1 Color parsing (`Geometry.java::parseColor` → `Colors.ts::parseColor`)

Java supports the following color formats; TypeScript support noted:

| Format | Java example | TypeScript |
|--------|-------------|------------|
| Named color | `"black"`, `"red"` | ✅ supported |
| `"none"` → transparent | `"none"` | ✅ supported |
| `"random"` | `"random"` | ✅ supported |
| `"darker"` / `"brighter"` | relative to bgcolor | ✅ supported |
| `"background"` | matches bgcolor | ✅ supported |
| Hex string | `"#FF8800"` | ❌ **BUG** — silently returns `null` (see §5.3) |
| HSB tuple | `"120,50,100"` | ❌ **missing** — Java interprets comma-separated triples as HSB(hue 0–360, sat 0–100, bri 0–100) |
| Integer `0` | `0` (transparent) | ❌ **partial** — not cleanly handled when passed as a JS number |

**Missing named color:** Java has `"gray"` in its color table; TypeScript `colors` object omits it (has `"darkGray"` and `"lightGray"` but not `"gray"`).

### 1.2 Element parameter parsing (`Geometry.java::parseElement` → `index.ts::init`)

Java param string format: `"name;class;method;data[;nameColor[;vertexColor[;edgeColor[;faceColor]]]]"`

Java features not yet in TypeScript:
- **Per-element `align`**: Java calls `parseAlign()` for each element and stores it. TypeScript `IConstructionInfo` has no `align` field — all elements share one `defaultAlign`.
- **`font` / `fontsize` parameters**: Java supports applet-level `font` and `fontsize` params; TypeScript has a static `_font = "italic 10pt Times New Roman"` string with no override path.
- **`stage` / `init` parameters**: Java supports progressive construction loading in stages. TypeScript has no equivalent.

### 1.3 Title rendering

`IInitialization.title` is accepted but never rendered. Java draws the title string in a header area above the canvas. TypeScript `Slate.drawElements()` makes no reference to `title`.

### 1.4 Mouse interaction

| Behavior | Java | TypeScript |
|----------|------|------------|
| Hit-test tolerance | 10 pixels | 50 pixels |
| Drag threshold | any movement | `< 1.0` pixel threshold in `movePick` |
| Double buffer | yes (off-screen image) | no (direct canvas clear+redraw) |

### 1.5 Debug / misc

- Java has a `debug` applet param. TypeScript has a `console.log(i)` hardcoded in `init()` (line 46 of `index.ts`) — should be removed.
- Java supports a floating window (keystroke `'u'`), reset (`'r'` / space). TypeScript has no keyboard handling.

---

## 2. Element base class: `Element.java` → `GeomElement.ts`

Largely equivalent. Key differences:

| Feature | Java | TypeScript |
|---------|------|------------|
| Field name | `dragable` | `draggable` (typo fixed) |
| Highlight colors | not present | added: `nameHighlightColor`, `vertexHighlightColor`, etc. |
| `pixelTolerance` | n/a | added (default 50) |
| `hitTest()` | not present | added (default returns false) |
| Font | per-instance via applet params | static class field |
| `drawEdge` static helper | `static drawEdge(g, color, x0, y0, x1, y1)` | not present (drawing is always on instance) |

---

## 3. `PointElement.java` → `src/elements/point/PointElement.ts`

All major vector methods are ported. Complete method-level comparison:

| Method | Java | TypeScript | Notes |
|--------|------|------------|-------|
| `to(P)` | mutates self → P.x/y/z | `to(p)` same | ✅ |
| `plus(P)` | `this += P` | same | ✅ |
| `minus(P)` | `this -= P` | same | ✅ |
| `times(s)` | `this *= s` | same | ✅ |
| `sum(A,B)` | static, new point | static | ✅ |
| `difference(A,B)` | static | static | ✅ |
| `product(A,s)` | static | static | ✅ |
| `dot(A,B)` | static | static | ✅ |
| `cross(A,B)` | static | static | ✅ |
| `triple(A,B,C)` | static | static | ✅ |
| `length()` / `length2()` | instance | instance | ✅ |
| `distance(P)` / `distance2(P)` | instance | instance | ✅ |
| `toLine(A,B,segment)` | projects to line | same | ✅ |
| `toPlane(P)` | projects to plane via S,T | same | ✅ |
| `uptoPlane(P)` | vertical projection to plane | same | ✅ |
| `toCircle(C)` | projects to circle | same | ✅ |
| `toSphere(Center,radius)` | projects to sphere | same | ✅ |
| `toCircumcenter(A,B,C)` | circumcenter of triangle | same | ✅ |
| `toIntersection(A,B,C,D,P)` | line–line intersection | same | ✅ |
| `toIntersectionPL(P,D,E)` | plane–line intersection | same | ✅ |
| `toInvertPoint(A,C)` | circle inversion | same | ✅ |
| `toSimilar(A,B,AP,D,E,F,Q)` | similar-triangle vertex | same | ✅ |
| `angle(B,C,P)` | angle BAC in plane P | same | ✅ |
| `rotate(pivot,ac,as)` | scale+rotate | same | ✅ |
| `rotate(pivot,ac,as,plane)` | 3D rotate in plane | same | ✅ |

All PointElement math methods are present. The infrastructure for porting nearly every missing construction already exists.

---

## 4. Line, Circle, Sector, Polygon, Plane, Sphere elements

### 4.1 `LineElement` — ✅ equivalent

Both store two `PointElement`s (A, B). Drawing draws a line from A to B.

### 4.2 `CircleElement` — ✅ equivalent

Both store Center, A, B and a plane. Both support tilted-ellipse drawing for 3D perspective (major/minor axis projection). Java uses `Component` graphics; TypeScript uses Canvas 2D context.

### 4.3 `SectorElement` — ✅ equivalent

Both draw an arc from A to B relative to Center using `atan2`. TypeScript adds `_updateThroughPoint()` helper.

### 4.4 `PolygonElement` — ⚠️ partial

Java has explicit constructors for 3, 4, 5, 6, 7, 8 vertices. TypeScript takes a generic array. The TypeScript construction system only has `TrianglePolygonConstruction` wired up; the other polygon variants (quadrilateral, parallelogram, square, equilateralTriangle, etc.) have enum values but no `Construction` subclass.

**Vertex access (`vertex` construction):** Java `PolygonElement` stores `V[]` and any construction can access `V[i]` directly. TypeScript `PolygonElement` also stores `V: PointElement[]` but the `vertex` construction (which returns `V[i]` for a named polygon) is TBD.

### 4.5 `PlaneElement` — ✅ equivalent

Both store three points (A, B, C) and compute orthonormal basis (S, T, U) on `update()`. Both support `pivot` for rotation.

### 4.6 `SphereElement` — ✅ ported

Both store Center and a radius point. `drawEdge`/`drawFace` draw the 2D circle projection.

### 4.7 `PolyhedronElement` — ❌ missing

Java has `PolyhedronElement.java` with an array of polygon faces. No TypeScript equivalent exists. All four polyhedra constructions (701–704) are TBD.

---

## 5. Known bugs and implementation discrepancies

### 5.1 `PlaneSlider` naming collision

| | Java | TypeScript |
|-|------|------------|
| `PlaneSlider.java` | Point constrained to an **arbitrary** plane — used for the `planeSlider` construction | Not implemented; `PointConstructions.planeSlider(20)` is TBD |
| `PlaneSlider.ts` | **Free draggable point** on the **screen** plane — used for the `free` construction | Implements `PointConstructions.free(1)` |

The TypeScript class named `PlaneSlider` is what the Java applet would call a "free point on screen". The Java `PlaneSlider` (constrained to a non-screen plane) has no TypeScript equivalent yet.

### 5.2 `parseColor` always-true else-if bug

In `src/Colors.ts` line 31:
```typescript
} else if (val == "none" || 0 || "0" || "") {   // BUG
    return null;
```

The conditions `0`, `"0"`, and `""` are literal values, not comparisons against `val`. Because `"0"` is truthy in JavaScript, the entire condition is always true. Any color that does not match the earlier branches (named colors, `"random"`, `"darker"`, etc.) silently returns `null`.

**Impact:** Hex color strings (e.g. `edgeColor: "#ff0000"`) passed to element properties via `init()` are silently dropped. The final `return val` fallthrough (which would pass hex strings through correctly) is unreachable.

**Fix:**
```typescript
} else if (val == "none" || val == "0" || val === 0 || val == "") {
    return null;
} else {
    return val;  // hex strings, rgb() strings, etc. pass through
}
```

### 5.3 `IntersectionPL.ts` is a copy of `Intersection.ts`

`src/elements/point/IntersectionPL.ts` has the header `Title: Intersection.ts` and exports a class named `Intersection` (not `IntersectionPL`). It implements line–line intersection via `toIntersection(A,B,C,D,AP)`.

Java `IntersectionPL.java` implements **plane–line intersection** via `toIntersectionPL(AP, A, B)`, which is an entirely different operation.

This file needs to be rewritten. The `PointElement.toIntersectionPL()` method exists, so the math is available.

### 5.4 `parseColor` missing HSB format

Java `Geometry.java` interprets a comma-separated triple `"h,s,b"` where h∈[0,360], s∈[0,100], b∈[0,100] as HSB color. Several proposition HTML files use this format for background colors (e.g. `background value="35,19,100"`).

TypeScript `Colors.ts` has `HSVtoRGB()` already defined but `parseColor` does not detect or handle the `"r,g,b"` / `"h,s,b"` format. This means any Java HTML that is directly ported without converting the background color will silently display no background.

**Note:** The current `view/test/` files use hex strings for `background` (e.g. `'#ffe9cd'`), so this doesn't affect existing TypeScript test pages. But the `view/euclid-html/` proposition pages use the Java format.

---

## 6. Construction-by-construction mapping

### 6.1 Point constructions

| Java dispatch | TypeScript Construction class | Status |
|---|---|---|
| `point.free` | `FreePointConstruction` → `PlaneSlider(screen, x, y, 0)` | ✅ |
| `point.fixed` | `FixedPoint2dConstruction`, `FixedPoint3dConstruction` | ✅ |
| `point.first` | `FirstPointConstruction` | ✅ |
| `point.last` | `LastPointConstruction` | ✅ |
| `point.midpoint` | `MidPointConstruction` → `Midpoint(A,B)` | ✅ |
| `point.intersection` | `IntersectionConstruction`, `IntersectionConstructionScreen` | ✅ |
| `point.foot` | `FootPointConsturction` [sic] → `Foot(A,B,C)` | ✅ (typo in class name) |
| `point.extend` | `ExtendConstruction` → `Layoff(B, A, B, C, D)` | ✅ |
| `point.cutoff` | `CutoffConstruction` → `Layoff(A, A, B, C, D)` | ✅ |
| `point.center` | `CircleCenterConstruction` → returns `circle.Center` | ✅ |
| `point.circumcenter` | `CircumcenterConstruction`, `CircumcenterConstruction2d` | ✅ |
| `point.lineSlider` | `LineSliderConstruction` (3D), `LineSlider2dConstruction` (2D) | ✅ |
| `point.lineSegmentSlider` | `LineSliderSegmentConstruction` | ✅ |
| `point.circleSlider` | `CircleSliderConstruction` (3D), `CircleSliderConstruction2dPoint` (2D) | ✅ |
| `point.perpendicular` | `PointPerpendicular1–5Construction` | ✅ |
| `point.vertex` | _(missing)_ | ❌ TBD — returns `polygon.V[i]` |
| `point.parallelogram` | _(missing)_ | ❌ TBD — `D = A + C - B` |
| `point.similar` | _(missing)_ | ❌ TBD — calls existing `toSimilar()` |
| `point.proportion` | _(missing)_ | ❌ TBD — `Proportion.java` |
| `point.invert` | _(missing)_ | ❌ TBD — calls existing `toInvertPoint()` |
| `point.meanProportional` | _(missing)_ | ❌ TBD |
| `point.planeSlider` | _(missing)_ | ❌ TBD — `toPlane()` exists |
| `point.sphereSlider` | _(missing)_ | ❌ TBD — `toSphere()` exists |
| `point.angleBisector` | _(missing)_ | ❌ TBD — `angle()` and `rotate()` exist |
| `point.angleDivider` | _(missing)_ | ❌ TBD — same as angleBisector with n |
| `point.harmonic` | _(missing)_ | ❌ TBD — complex math |
| _(plane-line intersection)_ | `IntersectionPL.ts` | ❌ wrong file (§5.4) |

### 6.2 Line constructions

| Java dispatch | TypeScript Construction class | Status |
|---|---|---|
| `line.connect` | `LineConnectConstruction` → `LineElement(A, B)` | ✅ |
| `line.extend` | `LineExtendConstruction` → `LineElement` via `Layoff` | ✅ |
| `line.perpendicular` | `LinePerpendicular1–5Construction` | ✅ |
| `line.bichord` | `BichordConstruction` → `Bichord(C1, C2)` | ✅ |
| `line.chord` | _(missing)_ | ❌ TBD — `Chord.java` |
| `line.parallel` | _(missing)_ | ❌ TBD — `ParallelP.java` |
| `line.angleBisector` | _(missing)_ | ❌ TBD — `AngleDivider.java` |
| `line.angleDivider` | _(missing)_ | ❌ TBD |
| `line.foot` | _(missing)_ | ❌ TBD — `PlaneFoot.java` (solid geometry) |
| `line.similar` | _(missing)_ | ❌ TBD |
| `line.proportion` | _(missing)_ | ❌ TBD |
| `line.meanProportional` | _(missing)_ | ❌ TBD |
| `line.cutoff` | _(missing)_ | ❌ TBD (enum 108 exists) |

### 6.3 Circle constructions

| Java dispatch | TypeScript Construction class | Status |
|---|---|---|
| `circle.radius` | `CircleRadiusCenterConstruction` → `CircleElement(A, B, screen)` | ✅ |
| `circle.circumcircle` | `CircumcircleConstruction`, `CircumcircleConstruction2d` | ✅ |
| `circle.invert` | _(missing)_ | ❌ TBD — `InvertCircle.java` |
| `circle.intersection` | _(missing)_ | ❌ TBD — `IntersectionSS.java` (sphere–sphere) |

### 6.4 Polygon constructions

| Java dispatch | TypeScript Construction class | Status |
|---|---|---|
| `polygon.triangle` | `TrianglePolygonConstruction` → `PolygonElement([A,B,C])` | ✅ |
| `polygon.quadrilateral` | _(missing)_ | ❌ TBD |
| `polygon.parallelogram` | _(missing)_ | ❌ TBD |
| `polygon.square` | _(missing)_ | ❌ TBD |
| `polygon.equilateralTriangle` | _(missing)_ | ❌ TBD (same as triangle in TS) |
| `polygon.similar` | _(missing)_ | ❌ TBD — `Similar.java` |
| `polygon.application` | _(missing)_ | ❌ TBD — `Application.java` |
| `polygon.regularPolygon` | _(missing)_ | ❌ TBD — `RegularPolygon.java` |
| `polygon.starPolygon` | _(missing)_ | ❌ TBD — `RegularPolygon.java` |
| `polygon.pentagon` | _(missing)_ | ❌ TBD |
| `polygon.hexagon` | _(missing)_ | ❌ TBD |
| `polygon.octagon` | _(missing)_ | ❌ TBD |
| `polygon.face` | _(missing)_ | ❌ TBD (solid geometry) |

**Note:** `polygon.quadrilateral` through `polygon.octagon` are simply `PolygonElement` with N
vertices. Since `PolygonElement` already accepts a vertex array, these constructions only need a
`Construction` subclass each — the element class is already there.

### 6.5 Sector constructions

| Java dispatch | TypeScript Construction class | Status |
|---|---|---|
| `sector.sector` | `SectorConstruction`, `Sector2Construction` | ✅ |
| `sector.arc` | _(missing)_ | ❌ TBD — `Arc.java` calls `toCircumcenter(A,M,B)`; infrastructure exists |

### 6.6 Plane constructions

| Java dispatch | TypeScript Construction class | Status |
|---|---|---|
| `plane.perpendicular` | `PerpendicularPlaneConstruction` → `PerpendicularPlane(A, B)` | ✅ |
| `plane.3points` | _(missing)_ | ❌ TBD — `PlaneElement(A, B, C)` already works; just needs Construction |
| `plane.parallel` | _(missing)_ | ❌ TBD — `ParallelP.java` (outputs PlaneElement) |
| `plane.ambient` | _(missing)_ | ❌ TBD — returns screen plane |

### 6.7 Sphere constructions

| Java dispatch | TypeScript Construction class | Status |
|---|---|---|
| `sphere.radius` | `SphereRadiusConstruction` → `SphereElement(center, B)` | ✅ |

### 6.8 Polyhedra constructions

| Java dispatch | TypeScript Construction class | Status |
|---|---|---|
| `polyhedron.tetrahedron` | _(missing)_ | ❌ TBD |
| `polyhedron.parallelepiped` | _(missing)_ | ❌ TBD |
| `polyhedron.prism` | _(missing)_ | ❌ TBD — `Prism.java` |
| `polyhedron.pyramid` | _(missing)_ | ❌ TBD — `Pyramid.java` |

---

## 7. Easy wins (missing but infrastructure exists)

These constructions are TBD but the mathematical infrastructure is already present in `PointElement.ts`. Each should require only a small wrapper class and a `Construction` subclass:

| Construction | Existing method to call | Estimated effort |
|---|---|---|
| `point;invert` | `toInvertPoint(A, C)` | minimal |
| `point;similar` | `toSimilar(A, B, AP, D, E, F, Q)` | minimal |
| `point;planeSlider` | `toPlane(AP)` | minimal |
| `point;sphereSlider` | `toSphere(Center, radius)` | minimal |
| `point;angleBisector` | `angle()` + `rotate()` | small — port `AngleDivider.java` |
| `sector;arc` | `toCircumcenter(A, M, B)` | minimal — `Arc.java` is 10 lines |
| `plane;3points` | `PlaneElement(A, B, C)` already works | minimal — just a Construction wrapper |
| `plane;ambient` | return `screen` | trivial |
| `line;foot` | `PlaneFoot.java`: `to(A).toPlane(AP)` | minimal |
| `polygon;triangle` through `polygon;octagon` | `PolygonElement(vertices[])` already works | minimal per variant |
| `point;vertex` | `polygon.V[i]` | small |
| `point;parallelogram` | `D = A + C - B` | small |
| `line;parallel` | port `ParallelP.java` | small |
| `line;chord` | port `Chord.java` | small |
| `line;chord` | port `Chord.java` | small |

---

## 8. Constructions requiring new math (not yet in PointElement)

These require non-trivial porting work beyond just wrapping existing methods:

| Construction | Java class | What needs implementing |
|---|---|---|
| `point;proportion` | `Proportion.java` | `factor = sqrt(dist(T)·dist(U) / (dist(S)·dist(V)))` — new |
| `point;meanProportional` | `MeanProportional.java` | Geometric mean formula — new |
| `point;harmonic` | `Harmonic.java` | Complex number conjugate formula — new |
| `circle;invert` | `InvertCircle.java` | Circle inversion math (`d² = dist²(centers)`, `r² = radius²`) |
| `circle;intersection` | `IntersectionSS.java` | Sphere–sphere intersection circle — new |
| `polygon;application` | `Application.java` | Area-scaling parallelogram — new |
| `polygon;regularPolygon` | `RegularPolygon.java` | Iterative rotation of vertices — new |
| `polygon;similar` | `Similar.java` (polygon form) | Needs polygon-level similar transform |
| Polyhedra | `Pyramid.java`, `Prism.java` | New `PolyhedronElement` class + construction |
| `point;angleDivider` | `AngleDivider.java` | Angle n-section + rotate + intersect |

---

## 9. Summary counts

| Category | Java constructions | TypeScript implemented | Missing / TBD |
|---|---|---|---|
| Point | ~25 | 14 | ~11 |
| Line | ~13 | 4 | ~9 |
| Circle | 4 | 2 | 2 |
| Polygon | 12 | 1 | 11 |
| Sector | 2 | 1 | 1 |
| Plane | 4 | 1 | 3 |
| Sphere | 1 | 1 | 0 |
| Polyhedra | 4 | 0 | 4 |
| **Total** | **~65** | **~24** | **~41** |

Plus platform-level gaps: HSB color format, per-element align, title rendering, `IntersectionPL` file needs rewrite.
