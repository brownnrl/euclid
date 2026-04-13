# Java Port Tracker

Maps every `.java` file in `geom_applet/source/` to its TypeScript
implementation status. Updated as constructions are ported.

## Status legend

| Status | Meaning |
|--------|---------|
| **PORTED** | Fully ported — all constructors and methods converted to TypeScript |
| **PARTIAL** | Some functionality ported; remaining work noted |
| **TBD** | Not yet ported; construction stubs may exist in `Constructions.ts` |
| **N/A** | Java applet infrastructure with no TypeScript equivalent needed |

---

## Element base classes

| Java File | Status | TS Location | Notes |
|---|---|---|---|
| `Element.java` | PORTED | `src/elements/GeomElement.ts` | Base class for all geometry elements. TS name differs (GeomElement). |
| `CircleElement.java` | PORTED | `src/elements/circle/CircleElement.ts` | Both 2-point and 3-point constructors (optional `A` param added 2026-04-12). |
| `LineElement.java` | PORTED | `src/elements/line/LineElement.ts` | Base line class; `translate`/`rotate` are no-op stubs (overridden in subclasses). |
| `PlaneElement.java` | PORTED | `src/elements/plane/PlaneElement.ts` | |
| `PointElement.java` | PORTED | `src/elements/point/PointElement.ts` | All vector ops, `toSimilar`, `toCircumcenter`, `toLine`, `toCircle`, `toIntersection`, `toInvertPoint`, `rotate`, `angle`, etc. Bug fix 2026-04-12: `length2()` had `+` instead of `*` for z component. |
| `PolygonElement.java` | PORTED | `src/elements/polygon/PolygonElement.ts` | `area()` method added 2026-04-12. |
| `SectorElement.java` | PORTED | `src/elements/sector/SectorElement.ts` | |
| `SphereElement.java` | PORTED | `src/elements/sphere/SphereElement.ts` | |
| `PolyhedronElement.java` | PORTED | `src/elements/polyhedron/PolyhedronElement.ts` | Base class for 3D polyhedra. Ported 2026-04-12. |

---

## Point constructions

| Java File | Status | TS Location | Notes |
|---|---|---|---|
| `CircleSlider.java` | PORTED | `src/elements/point/CircleSlider.ts` | 2D + 3D variants. |
| `FixedPoint.java` | PORTED | `src/elements/point/FixedPoint.ts` | 2D + 3D variants. |
| `Foot.java` | PORTED | `src/elements/point/Foot.ts` | Perpendicular foot from point to line. Also used by `LineFootConstruction` (2D line;foot dispatch). |
| `Intersection.java` | PORTED | `src/elements/point/Intersection.ts` | Line–line intersection, 2D + 3D. |
| `IntersectionPL.java` | PARTIAL | `src/elements/point/IntersectionPL.ts` | **File exists but is a copy of Intersection.ts** — documented as a known platform bug in construction-tracker.md. Should implement plane–line intersection via `toIntersectionPL()` (which does exist on PointElement). |
| `Layoff.java` | PORTED | `src/elements/point/Layoff.ts` | Core utility for `extend`, `cutoff`, `parallelogram`, `line;parallel`, `line;extend`. |
| `LineSlider.java` | PORTED | `src/elements/point/LineSlider.ts` | 2D, 3D, and segment variants. |
| `Midpoint.java` | PORTED | `src/elements/point/Midpoint.ts` | |
| `Perpendicular.java` | PORTED | `src/elements/point/Perpendicular*.ts` + `src/elements/line/Perpendicular.ts` | 5 signature variants across point and line constructions. |
| `PlaneSlider.java` | PORTED | `src/elements/point/PlaneSlider.ts` | Used for `point;free` (screen plane) and `point;planeSlider` (non-screen planes, wired 2026-04-12). |
| `Proportion.java` | PORTED | `src/elements/point/ProportionElement.ts` | Fourth proportional. Ported 2026-04-12. |
| `Similar.java` | PORTED | `src/elements/point/SimilarElement.ts` | All three type variants ported: `SimilarPointConstruction`, `SimilarLineConstruction`, `SimilarPolygonConstruction` (all in Constructions.ts). Ported 2026-04-12. |
| `AngleDivider.java` | PORTED | `src/elements/point/AngleDividerElement.ts` | All four variants ported 2026-04-12: point/line × bisector/divider. Used in Book IV (IV.4, IV.13, IV.16). |
| `Harmonic.java` | PORTED | `src/elements/point/HarmonicElement.ts` | Harmonic conjugate. 2D (complex arithmetic) + 3D (midpoint reflection) cases. Ported 2026-04-12. Used in round geometry pages. |
| `InvertPoint.java` | PORTED | `src/elements/point/InvertPointElement.ts` | Point inversion in circle. Ported 2026-04-12. Used in compass + round geometry pages. |
| `MeanProportional.java` | PORTED | `src/elements/point/MeanProportionalElement.ts` | Geometric mean. Both point and line variants wired. Ported 2026-04-12. Unblocked 35 propositions (VIII, X, XIII). |
| `SphereSlider.java` | PORTED | `src/elements/point/SphereSliderElement.ts` | Point slider on sphere surface. Ported 2026-04-12. |

---

## Line constructions

| Java File | Status | TS Location | Notes |
|---|---|---|---|
| `Bichord.java` | PORTED | `src/elements/line/Bichord.ts` | Common chord of two circles. |
| `Chord.java` | PORTED | `src/elements/line/Chord.ts` | Chord of circle cut by a line. Ported 2026-04-11. |
| `PlaneFoot.java` | TBD | — | Foot of perpendicular from point to plane (solid geometry). The 2D `line;foot` variant uses `Foot.ts` + LineElement dispatch instead. |
| `PerpendicularPL.java` | PARTIAL | `src/elements/line/PlanePerpendicularLine.ts` + `src/elements/plane/PerpendicularPlane.ts` | Java class was split across two TS files for the plane-perpendicular construction. |

---

## Circle constructions

| Java File | Status | TS Location | Notes |
|---|---|---|---|
| `Circumcircle.java` | PORTED | `src/elements/circle/CircumcircleElement.ts` | 2D + 3D variants. |
| `InvertCircle.java` | TBD | — | Circle inversion in another circle. No Books I–IV uses found. |
| `IntersectionSS.java` | TBD | — | Intersection of two spheres (yields a circle). Solid geometry (Books XI–XIII). |

---

## Polygon constructions

| Java File | Status | TS Location | Notes |
|---|---|---|---|
| `Application.java` | PORTED | `src/elements/polygon/ApplicationElement.ts` | Application of area. Ported 2026-04-12. |
| `RegularPolygon.java` | PORTED | `src/elements/polygon/RegularPolygonElement.ts` | Both regular and star-polygon constructors (density `d` param added 2026-04-12). Used by `equilateralTriangle` (n=3) and `square` (n=4). The `regularPolygon` (variable n) and `starPolygon` (variable n,d) Construction dispatchers are still TBD. |

---

## Sector constructions

| Java File | Status | TS Location | Notes |
|---|---|---|---|
| `Arc.java` | PORTED | `src/elements/sector/ArcElement.ts` | 2D variant. Ported 2026-04-11. |

---

## Plane constructions

| Java File | Status | TS Location | Notes |
|---|---|---|---|
| `PlanePerpendicular.java` | PORTED | `src/elements/plane/PerpendicularPlane.ts` | |
| `ParallelP.java` | PORTED | `src/elements/plane/ParallelPlane.ts` | Parallel plane through a point. Ported 2026-04-12. NOT `line;parallel` — that uses Layoff dispatch. |

---

## 3D / Polyhedra constructions

| Java File | Status | TS Location | Notes |
|---|---|---|---|
| `Prism.java` | PORTED | `src/elements/polyhedron/PrismElement.ts` | Prism construction. 41 lines. Ported 2026-04-12. |
| `Pyramid.java` | PORTED | `src/elements/polyhedron/PyramidElement.ts` | Pyramid construction. 11 lines. Ported 2026-04-12. |

---

## Java applet infrastructure (no TS equivalent needed)

| Java File | Status | Notes |
|---|---|---|
| `Geometry.java` | N/A | Java applet main entry point. TS equivalent is `src/index.ts`. |
| `ClientFrame.java` | N/A | Java Swing/AWT UI component. No TS equivalent. |
| `Remote.java` | N/A | Applet remote communication. No TS equivalent. |
| `Slate.java` | PARTIAL | Construction dispatch logic ported to `src/elements/Constructions.ts`. Rendering logic replaced by HTML5 Canvas in `src/Slate.ts`. The Java construction-name-to-index mapping tables at lines 69–122 are the authoritative reference for dispatch. |

---

## Summary

| Status | Count | Files |
|--------|-------|-------|
| PORTED | 36 | Core element classes + all ported constructions (incl. Prism ported 2026-04-12) |
| PARTIAL | 3 | IntersectionPL, PerpendicularPL, Slate |
| TBD | 2 | InvertCircle, PlaneFoot |
| TBD (plane/circle) | 2 | ParallelP (plane;parallel), IntersectionSS (circle;intersection) |
| N/A | 3 | Geometry, ClientFrame, Remote |
| **Total** | **44** | |
