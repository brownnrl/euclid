# Constructions Reference

## Naming convention

Constructions are accessed via `E.{Type}.{name}` in the TypeScript API:
`E.Point.free`, `E.Line.connect`, `E.Circle.radius`, etc.

In the original Java applet HTML params, the construction name appears as the third
semicolon-delimited field:
```
"Name;type;constructionname;arg1,arg2,...;edgeColor;..."
```

The Java source for each construction lives in `geom_applet/source/{Name}.java`.

## LineElement expansion rule

When a `LineElement` name is passed as a param, `Slate.convertParams` expands it
into **two `PointElement`s** (the line's endpoints). Construction `signature` arrays
must reflect these post-expansion types, not the raw HTML param count.

## Status legend

| Status | Meaning |
|--------|---------|
| **IMPL** | Fully implemented and registered in `constructions` array |
| **TBD** | Stub comment in `Constructions.ts`, not yet implemented |

---

## Point constructions

| Name | Status | Java source | Post-expansion signature | Description | I–III uses | Example |
|------|--------|-------------|--------------------------|-------------|------------|---------|
| `free` | IMPL | — | `int x, int y` | Freely draggable point | ~510 | I.1 |
| `fixed` | IMPL | `FixedPoint.java` | `int x, int y [, int z]` | Non-draggable fixed point (2D and 3D variants) | internal | — |
| `first` | IMPL | — | `Point A, Point B` | Returns point A (first endpoint of a line) | ~40 | I.1 |
| `last` | IMPL | — | `Point A, Point B` | Returns point B (last endpoint of a line) | ~73 | I.1 |
| `midpoint` | IMPL | `Midpoint.java` | `Point A, Point B` | Midpoint of segment AB | ~88 | I.10 |
| `intersection` | IMPL | `Intersection.java` | `Point A, B, C, D [, Plane]` | Intersection of lines AB and CD | ~62 | I.15 |
| `foot` | IMPL | `Foot.java` | `Point A, Point B, Point C` | Foot of perpendicular from A to line BC | ~8 | I.12 |
| `extend` | IMPL | `Layoff.java` | `Point A, B, C, D` | Point E on line AB so BE = CD | ~62 | I.3 |
| `cutoff` | IMPL | `Layoff.java` | `Point A, B, C, D` | Point E on line AB so AE = CD | ~45 | I.3 |
| `center` | IMPL | — | `Circle A` | Center of circle A | ~10 | III.1 |
| `circumcenter` | IMPL | — | `Point A, B, C [, Plane]` | Circumcenter of triangle ABC (2D and 3D variants) | ~2 | III.25 |
| `lineSlider` | IMPL | `LineSlider.java` | `Point A, B, int x, int y [, int z]` | Point draggable along line AB (2D, 3D, segment variants) | ~147 | I.14 |
| `circleSlider` | IMPL | `CircleSlider.java` | `Circle A, int x, int y [, int z]` | Point draggable along circle A | ~106 | I.4 |
| `perpendicular` | IMPL | `Perpendicular.java` | Various (5 signature variants) | Point D s.t. AD ⊥ AB and \|AD\| = \|EF\| | ~18 | I.11 |
| `parallelogram` | IMPL | `Slate.java` (case 13, reuses `Layoff`) | `Point A, Point B, Point C` | 4th vertex D of parallelogram ABCD (D = A+C−B) | ~48 | I.28 |
| `vertex` | IMPL | `Slate.java` (case 9) | `Polygon P, int i` | i-th vertex of polygon P | ~59 | I.2 |
| `similar` | IMPL | `Similar.java` | `Point A, B, D, E, F [, Plane]` | Point H so △ABH ~ △DEF (2D + 3D) | ~15 | III.33 |
| `proportion` | IMPL | `Proportion.java` | `Point S0,S1,T0,T1,U0,U1,V0,V1` | Point V' on V0V1 s.t. \|S\|:\|T\| = \|U\|:\|V0V'\| | ~4 | I.16 |
| `invert` | IMPL | `InvertPoint.java` | `Point A, Circle B` | Inversion of A in circle B | 0 | — |
| `meanProportional` | IMPL | `MeanProportional.java` | `Point A, B, C, D, E, F` | Point G on EF s.t. AB:CD = CD:EG | 0 | — |
| `planeSlider` | IMPL | `PlaneSlider.java` | `Plane A, int x, int y, int z` | Point draggable on plane A | solid geometry | — |
| `sphereSlider` | IMPL | `SphereSlider.java` | `Sphere A, int x, int y, int z` | Point draggable on sphere A | solid geometry | — |
| `angleBisector` | IMPL | `AngleDivider.java` (n=2) | `Point A, B, C [, Plane]` | Intersection of angle bisector of ∠BAC with BC | 0 | — |
| `angleDivider` | IMPL | `AngleDivider.java` | `Point A, B, C [, Plane], int n` | 1/n division of angle | 0 | — |
| `harmonic` | IMPL | `Harmonic.java` | `Point A, B, C, D` | Harmonic conjugate | 0 | — |

---

## Line constructions

| Name | Status | Java source | Post-expansion signature | Description | I–III uses | Example |
|------|--------|-------------|--------------------------|-------------|------------|---------|
| `connect` | IMPL | — | `Point A, Point B` | Line through A and B | ~510 | I.1 |
| `extend` | IMPL | `Layoff.java` | `Point A, B, C, D` | Line extending AB by length CD | ~62 | I.1 |
| `perpendicular` | IMPL | `Perpendicular.java` | Various (5 signature variants) | Line perpendicular to another | ~16 | I.11 |
| `bichord` | IMPL | `Bichord.java` | `Circle A, Circle B` | Line connecting two circle intersections | ~19 | I.1 |
| `parallel` | IMPL | `Slate.java` (case 9, reuses `Layoff`) | `Point A, Point B, Point C` | Line through A parallel and equal to line BC | ~14 | I.22 |
| `chord` | IMPL | `Chord.java` | `Point B, Point C, Circle A` | Chord of circle A cut by line BC | ~17 | I.12 |
| `angleBisector` | IMPL | `AngleDivider.java` (n=2) | `Point A, B, C [, Plane]` | Bisector of angle ∠ABC | 0 | IV.4 |
| `angleDivider` | IMPL | `AngleDivider.java` | `Point A, B, C [, Plane], int n` | 1/n division of ∠ABC as a line | 0 | — |
| `foot` | IMPL | `PlaneFoot.java` | `Point A, Plane B` | Perpendicular from A to plane B | solid only | XI.26 |
| `similar` | IMPL | `Similar.java` | `Point A, B, D, E, F [, Plane]` | Line AH where △ABH ∼ △DEF (2D + 3D) | ~1 | I.31 |
| `proportion` | IMPL | `Proportion.java` | As point variant | Line form of proportion | 0 | — |
| `meanProportional` | IMPL | `MeanProportional.java` | As point variant | Line form | 0 | — |

---

## Circle constructions

| Name | Status | Java source | Post-expansion signature | Description | I–III uses | Example |
|------|--------|-------------|--------------------------|-------------|------------|---------|
| `radius` | IMPL | — | `Point center, Point edge [, Point C]` | Circle with center and radius; 2-point (radius=\|center-edge\|) and 3-point (radius=\|edge-C\|) variants | ~60 | I.1 |
| `circumcircle` | IMPL | `Circumcircle.java` | `Point A, B, C [, Plane]` | Circle through three points (2D and 3D) | ~6 | III.25 |
| `invert` | IMPL | `InvertCircle.java` | `Circle A, Circle B` | Inversion of circle A in circle B | 0 | — |

---

## Polygon constructions

| Name | Status | Java source | Post-expansion signature | Description | I–III uses | Example |
|------|--------|-------------|--------------------------|-------------|------------|---------|
| `triangle` | IMPL | `PolygonElement.java` | `Point A, B, C` | Triangle with vertices A, B, C | ~55 | I.1 |
| `quadrilateral` | IMPL | `Slate.java` (polygon case 2) | `Point A, B, C, D` | Quadrilateral ABCD | ~11 | I.43 |
| `parallelogram` | IMPL | `Slate.java` (case 6, reuses `Layoff`) | `Point A, B, C` | Parallelogram ABCD where D = A+(C−B) | ~18 | I.34 |
| `square` | IMPL | `RegularPolygon.java` (n=4) | `Point A, B` | Square on side AB | ~10 | I.46 |
| `equilateralTriangle` | IMPL | `RegularPolygon.java` (n=3) | `Point A, B [, Plane]` | Equilateral triangle on side AB (2D + 3D) | ~6 | I.2 |
| `similar` | IMPL | `Similar.java` | `Point A, B, D, E, F [, Plane]` | Triangle ABH where △ABH ∼ △DEF (2D + 3D) | ~5 | I.23 |
| `application` | IMPL | `Application.java` | `Polygon P, Point A, B, C` | Parallelogram with side AB, angle CAB, area = P.area() | ~3 | I.44 |
| `regularPolygon` | IMPL | `RegularPolygon.java` | `Point A, B [, Plane], int n` | Regular n-gon on edge AB (2D + 3D) | 0 | IV.11 |
| `starPolygon` | IMPL | `RegularPolygon.java` | `Point A, B, int n, int k` | Star polygon {n/k} with density param | 0 | — |
| `pentagon` | IMPL | `PolygonElement.java` | `Point A, B, C, D, E` | Pentagon (5 free vertices) | 0 | — |
| `hexagon` | IMPL | `PolygonElement.java` | `Point A, B, C, D, E, F` | Hexagon (6 free vertices) | 0 | — |
| `octagon` | IMPL | `PolygonElement.java` | `Point A, B, C, D, E, F, G, H` | Octagon (8 free vertices) | 0 | XII.2 |
| `path` | IMPL 2026-06 | (new) | `Point A, B, … (≥2)` | An **open** path (polyline) — an ordered run of connected segments A→B→… that does **not** close back to the first point (unlike a polygon). A one-dimensional connected route, drawn and highlightable as **one** element, so a prose ref to the whole route (e.g. "the path AEB") lights every segment together. No fill. (#121) | 0 | I.20 Guide (Heron's bent line) |
| `curvedTriangle` | IMPL 2026-06 | (new) | `Point A, B, C, Carrier ab, bc, ca` | A triangle whose three sides are circular arcs — an elliptic or hyperbolic triangle (both have circular-arc sides). Takes 3 vertices and 3 **side carriers** (the "lines" the sides lie on): each carrier is a `circle` (→ minor arc side, **clipped to the vertices** so it stops at the corners, unlike the full great-circle arc) or a `line` (→ straight side, e.g. a disk diameter). It *is* the three side-segments — drawing/highlighting them itself as **one** element (hovering "triangle ABC" lights the curved sides gold), and filling the interior when a `faceColor` is set. Carriers reach the construction intact: lines are normally expanded to endpoints, but this construction opts out via `keepsLineElements`. (A general curved polygon is a later generalisation.) (#119) | 0 | I.16 Guide (elliptic) |

---

## Sector constructions

| Name | Status | Java source | Post-expansion signature | Description | I–III uses | Example |
|------|--------|-------------|--------------------------|-------------|------------|---------|
| `sector` | IMPL | `SectorElement.java` | `Point A, B, C [, Plane]` | Circular sector from center through A and B (2 variants) | ~8 | I.9 |
| `arc` | IMPL | `Arc.java` | `Point A, M, B [, Plane]` | Arc of circle passing through A, M, B (M is on the arc, 2D + 3D) | ~20 | I.4 |
| `angleMarker` | IMPL | — (geomlib 0.8.0) | `Point V, P1, P2 [, int radiusPx]` | Interior angle marker at V — element-chosen radius (default 22px, clamped to 0.45× shorter arm), auto-interior, translucent palette fill | slideshows | I.5 |
| `angleMarkerReflex` | IMPL | — (geomlib 0.8.0) | `Point V, P1, P2 [, int radiusPx]` | As `angleMarker` but the major (reflex, >180°) arc; for rare teaching cases | rare | III.20 |

---

## Plane constructions (solid geometry)

| Name | Status | Java source | Post-expansion signature | Description |
|------|--------|-------------|--------------------------|-------------|
| `perpendicular` | IMPL | `PlanePerpendicular.java` | `Point A, B, C, D, E` | Plane perpendicular to another |
| `3points` | IMPL | `PlaneElement.java` | `Point A, B, C` | Plane through three points |
| `parallel` | IMPL | `ParallelP.java` | `Plane A, Point B` | Plane through B parallel to plane A |
| `ambient` | IMPL | `Slate.java` (case 3) | `Point A` or `Circle A` | The ambient plane of a point or circle |

---

## Sphere constructions (solid geometry)

| Name | Status | Java source | Post-expansion signature | Description |
|------|--------|-------------|--------------------------|-------------|
| `radius` | IMPL | `SphereElement.java` | `Point center, Point edge` | Sphere with given center and surface point |

---

## Polyhedra constructions (solid geometry)

| Name | Status | Java source | Description |
|------|--------|-------------|-------------|
| `tetrahedron` | IMPL | `Slate.java` (case 0) | Tetrahedron from 4 points (triangle base + Pyramid) |
| `parallelepiped` | IMPL | `Slate.java` (case 1) | Parallelepiped from 4 points (Layoff + Prism) |
| `prism` | IMPL | `Prism.java` | Prism with polygon base + direction vector |
| `pyramid` | IMPL | `Pyramid.java` | Pyramid with polygon base + apex point |

---

## Implementation priority (Books I–III) — ALL COMPLETE

All 69 constructions implemented as of 2026-04-12. All 465 propositions
across Books I–XIII are renderable. This table is historical reference.

| Priority | Construction | I–III uses | Status |
|----------|-------------|------------|--------|
| 1 | `point;vertex` | 59 | IMPL 2026-04-10 |
| 2 | `point;parallelogram` | 48 | IMPL 2026-04-10 |
| 3 | `polygon;parallelogram` | 18 | IMPL 2026-04-11 |
| 4 | `sector;arc` | 20 | IMPL 2026-04-11 |
| 5 | `line;chord` | 17 | IMPL 2026-04-11 |
| 6 | `polygon;quadrilateral` | 11 | IMPL 2026-04-12 |
| 7 | `polygon;square` | 10 | IMPL 2026-04-12 |
| 8 | `point;similar` | 15 | IMPL 2026-04-12 |
| 9 | `polygon;equilateralTriangle` | 6 | IMPL 2026-04-12 |
| 10 | `line;parallel` | 9 | IMPL 2026-04-11 |
| 11 | `polygon;similar` | 5 | IMPL 2026-04-12 |
| 12 | `point;proportion` | 4 | IMPL 2026-04-12 |
| 13 | `polygon;application` | 3 | IMPL 2026-04-12 |
