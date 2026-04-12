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
| `parallelogram` | **TBD** | `Geometry.java` | `Point A, Point B, Point C` | 4th vertex D of parallelogram ABCD (D = A+C−B) | ~48 | I.28 |
| `vertex` | **TBD** | `PolygonElement.java` | `Polygon P, int i` | i-th vertex of polygon P | ~59 | I.2 |
| `similar` | IMPL | `Similar.java` | `Point A, B, D, E, F [, Plane]` | Point H so △ABH ~ △DEF (2D) | ~15 | III.33 |
| `proportion` | **TBD** | `Proportion.java` | `Point A, B, C, D, E, F, G, H` | Point on GH s.t. AB:CD = EF:GI | ~4 | I.16 |
| `invert` | **TBD** | `InvertPoint.java` | `Point A, Circle B` | Inversion of A in circle B | 0 | — |
| `meanProportional` | **TBD** | `MeanProportional.java` | `Point A, B, C, D, E, F` | Point G on EF s.t. AB:CD = CD:EG | 0 | — |
| `planeSlider` | **TBD** | `PlaneSlider.java` | `Plane A, int x, int y, int z` | Point draggable on plane A | solid geometry | — |
| `sphereSlider` | **TBD** | `SphereSlider.java` | `Sphere A, int x, int y, int z` | Point draggable on sphere A | solid geometry | — |
| `angleBisector` | **TBD** | `AngleDivider.java` | `Point A, B, C [, Plane]` | Intersection of angle bisector of ∠BAC with BC | 0 | — |
| `angleDivider` | **TBD** | `AngleDivider.java` | `Point A, B, C [, Plane], int n` | 1/n division of angle | 0 | — |
| `harmonic` | **TBD** | `Harmonic.java` | `Point A, B, C, D` | Harmonic conjugate | 0 | — |

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
| `angleBisector` | **TBD** | `AngleDivider.java` | `Point A, B, C [, Plane]` | Bisector of angle ∠ABC | 0 | — |
| `angleDivider` | **TBD** | `AngleDivider.java` | `Point A, B, C [, Plane], int n` | 1/n division of ∠ABC as a line | 0 | — |
| `foot` | **TBD** | `PlaneFoot.java` | `Point A, Plane B` | Perpendicular from A to plane B | solid only | — |
| `similar` | **TBD** | `Similar.java` | `Point A, B, D, E, F [, Plane]` | Line corresponding to similar construction | 0 | — |
| `proportion` | **TBD** | `Proportion.java` | As point variant | Line form of proportion | 0 | — |
| `meanProportional` | **TBD** | `MeanProportional.java` | As point variant | Line form | 0 | — |

---

## Circle constructions

| Name | Status | Java source | Post-expansion signature | Description | I–III uses | Example |
|------|--------|-------------|--------------------------|-------------|------------|---------|
| `radius` | IMPL | — | `Point center, Point edge [, Point C]` | Circle with center and radius; 2-point (radius=\|center-edge\|) and 3-point (radius=\|edge-C\|) variants | ~60 | I.1 |
| `circumcircle` | IMPL | `Circumcircle.java` | `Point A, B, C [, Plane]` | Circle through three points (2D and 3D) | ~6 | III.25 |
| `invert` | **TBD** | `InvertCircle.java` | `Circle A, Circle B` | Inversion of circle A in circle B | 0 | — |

---

## Polygon constructions

| Name | Status | Java source | Post-expansion signature | Description | I–III uses | Example |
|------|--------|-------------|--------------------------|-------------|------------|---------|
| `triangle` | IMPL | `PolygonElement.java` | `Point A, B, C` | Triangle with vertices A, B, C | ~55 | I.1 |
| `quadrilateral` | IMPL | `Slate.java` (polygon case 2) | `Point A, B, C, D` | Quadrilateral ABCD | ~11 | I.43 |
| `parallelogram` | IMPL | `Slate.java` (case 6, reuses `Layoff`) | `Point A, B, C` | Parallelogram ABCD where D = A+(C−B) | ~18 | I.34 |
| `square` | IMPL | `RegularPolygon.java` (n=4) | `Point A, B` | Square on side AB | ~10 | I.46 |
| `equilateralTriangle` | **TBD** | `PolygonElement.java` | `Point A, B, C` | Equilateral triangle (alias for triangle with equal sides) | ~6 | I.2 |
| `similar` | **TBD** | `Similar.java` | `Point A, B, C, D, E, F` | Similar polygon construction | ~5 | III.24 |
| `application` | **TBD** | `Application.java` | Various | Application of area (parallelogram equal to triangle) | ~3 | I.44 |
| `regularPolygon` | **TBD** | `RegularPolygon.java` | `Point A, B, int n` | Regular n-gon on edge AB | 0 | — |
| `starPolygon` | **TBD** | `RegularPolygon.java` | `Point A, B, int n, int k` | Star polygon {n/k} | 0 | — |
| `pentagon` | **TBD** | `PolygonElement.java` | `Point A, B, C, D, E` | Pentagon | 0 | — |
| `hexagon` | **TBD** | `PolygonElement.java` | `Point A, B, C, D, E, F` | Hexagon | 0 | — |
| `octagon` | **TBD** | `PolygonElement.java` | `Point A, B, C, D, E, F, G, H` | Octagon | 0 | — |

---

## Sector constructions

| Name | Status | Java source | Post-expansion signature | Description | I–III uses | Example |
|------|--------|-------------|--------------------------|-------------|------------|---------|
| `sector` | IMPL | `SectorElement.java` | `Point A, B, C [, Plane]` | Circular sector from center through A and B (2 variants) | ~8 | I.9 |
| `arc` | **TBD** | `Arc.java` | `Point A, M, B [, Plane]` | Arc of circle passing through A, M, B (M is on the arc) | ~20 | I.4 |

---

## Plane constructions (solid geometry)

| Name | Status | Java source | Post-expansion signature | Description |
|------|--------|-------------|--------------------------|-------------|
| `perpendicular` | IMPL | `PlanePerpendicular.java` | `Point A, B, C, D, E` | Plane perpendicular to another |
| `3points` | **TBD** | `PlaneElement.java` | `Point A, B, C` | Plane through three points |
| `parallel` | **TBD** | — | `Plane A, Point B` | Plane through B parallel to plane A |
| `ambient` | **TBD** | — | — | The default screen plane |

---

## Sphere constructions (solid geometry)

| Name | Status | Java source | Post-expansion signature | Description |
|------|--------|-------------|--------------------------|-------------|
| `radius` | IMPL | `SphereElement.java` | `Point center, Point edge` | Sphere with given center and surface point |

---

## Polyhedra constructions (solid geometry)

| Name | Status | Java source | Description |
|------|--------|-------------|-------------|
| `tetrahedron` | **TBD** | — | Regular tetrahedron |
| `parallelepiped` | **TBD** | — | Parallelepiped |
| `prism` | **TBD** | `Prism.java` | Prism |
| `pyramid` | **TBD** | `Pyramid.java` | Pyramid |

---

## Implementation priority (Books I–III)

Ranked by number of propositions in Books I–III that use each construction.
Implementing higher-priority constructions unlocks the most propositions.

| Priority | Construction | I–III uses | Propositions unlocked (sample) |
|----------|-------------|------------|--------------------------------|
| 1 | `point;vertex` | 59 | I.2, I.9, I.10, I.11, I.33, I.34, I.41, I.47 |
| 2 | `point;parallelogram` | 48 | I.28, I.30, I.32–I.36, I.37–I.41, II.1–II.11 |
| ~~3~~ | ~~`polygon;parallelogram`~~ — IMPL 2026-04-11 | 18 | I.34, I.35, II.1–II.11 |
| 4 | `sector;arc` | 20 | I.4, I.16, I.29, II.5–II.8, III.2, III.23–III.25, III.30 |
| ~~5~~ | ~~`line;chord`~~ — IMPL 2026-04-11 | 17 | I.12, III.1, III.5, III.6, III.8–III.9, III.10, III.12, III.15, III.17, III.36, III.37 |
| ~~6~~ | ~~`polygon;quadrilateral`~~ — IMPL 2026-04-12 | 11 | I.43–I.45, II.2, II.4–II.6, II.8–II.9, II.14 |
| ~~7~~ | ~~`polygon;square`~~ — IMPL 2026-04-12 | 10 | I.46, I.47, II.1–II.8, II.11 |
| ~~8~~ | ~~`point;similar`~~ — IMPL 2026-04-12 | 15 | I.42, III.33, III.34 (actual point;similar); I.23, I.24, I.26, I.31, III.14 were polygon/line;similar (corrected) |
| 9 | `polygon;equilateralTriangle` | 6 | I.2, I.9, I.10, I.11, III.10, III.24 |
| ~~10~~ | ~~`line;parallel`~~ — IMPL 2026-04-11 | 9 | I.22, I.27, I.37–I.40, II.8–II.9, II.11 |
| 11 | `polygon;similar` | 5 | III.23, III.24, III.26–III.29 |
| 12 | `point;proportion` | 4 | I.16, I.29 |
| 13 | `polygon;application` | 3 | I.44, I.45, II.14 |
