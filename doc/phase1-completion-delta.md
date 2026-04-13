# Phase 1 Completion Delta Report

All 465 propositions across Euclid's 13 books are now renderable. This
document catalogs what remains unported, partially ported, or missing
relative to the complete Java codebase.

Generated 2026-04-12 by systematic audit of all Java source files, Slate.java
dispatch cases, construction enum entries, and element class methods.

---

## 1. Java files not fully ported

### TBD (no TS equivalent)

| Java File | Status | Why deferred | Impact |
|---|---|---|---|
| `InvertCircle.java` | TBD | No Books I–XIII or supplementary page uses found | No propositions blocked |
| `PlaneFoot.java` | TBD | The 2D `line;foot` variant uses `Foot.ts` + `LineElement` dispatch instead; the solid-geometry variant (`PlaneFoot` for point-to-plane perpendicular foot) was never needed | No propositions blocked; solid-geometry `line;foot` with PlaneElement param would use this |

### PARTIAL (some functionality ported, gaps remain)

| Java File | TS Location | What's ported | What's missing |
|---|---|---|---|
| `IntersectionPL.java` | `src/elements/point/IntersectionPL.ts` | **File exists but is a COPY of Intersection.ts** (line–line intersection). Should implement plane–line intersection via `toIntersectionPL()` which DOES exist on `PointElement`. | The plane–line intersection dispatch is missing. The `point;intersection` with a PlaneElement param (Slate.java point case 2, choice 2) is not wired. This is a known platform bug documented in construction-tracker.md. |
| `Slate.java` | `src/Slate.ts` + `src/elements/Constructions.ts` | All construction dispatch logic ported. Canvas rendering, mouse handling, element lifecycle ported. | The Java `pivot` rotation feature (rotating the entire scene around a pivot point when dragging a non-draggable point) is not fully ported. The `reset()` method is not wired to any UI action. |

---

## 2. Construction enum entries without wired dispatchers

These enum values exist in `ConstructionTypes` or `*Constructions` enums
but have no matching `Construction` subclass registered in the
`constructions` array:

| Enum entry | Enum value | Why unwired | Used in HTML? |
|---|---|---|---|
| `LineConstructions.proportion` | 112 | No I–XIII proposition or supplementary page uses found | No |
| `CircleConstructions.invert` | 203 | `InvertCircle.java` is TBD | No |
| `PolygonConstructions.starPolygon` | 309 | `RegularPolygonElement.ts` already has the density param; just needs a `[Point, Point, Integer, Integer]` dispatcher | No proposition uses; some supplementary pages might |
| `PlaneConstructions.ambient` | 504 | The "ambient" plane (default screen plane) is handled implicitly by `Slate.ts` at initialization, not as a construction | No |

---

## 3. TBD stubs remaining in Constructions.ts

These `// TBD` comment blocks remain in the source. Some are 3D variants
of existing 2D constructions, others are genuinely unimplemented:

### 3D variants of existing 2D constructions

| Construction | 2D status | 3D TBD variant | Signature |
|---|---|---|---|
| `point;intersection` | IMPL (2D + existing 3D) | With PlaneElement param (Slate case 2, choice 2 — uses `IntersectionPL`) | `[Point, Point, Point, Point, Plane]` |
| `point;center` | IMPL (circle center) | Sphere center variant | `[SphereElement]` |
| `point;foot` | IMPL (2D) | Solid geometry: foot from point to plane (`PlaneFoot.java`) | `[Point, Plane]` |
| `line;foot` | IMPL (2D: `Foot` + `LineElement`) | Solid geometry: perpendicular from point to plane (`PlaneFoot.java`) | `[Point, Plane]` |
| `line;perpendicular` | IMPL (5 variants) | One additional solid-geometry variant exists in the TBD comments | `[Point, Plane, Point, Point]` |
| `circle;radius` | IMPL (2-point + 3-point 2D) | 3D 2-point variant with explicit PlaneElement | `[Point, Point, Plane]` |
| `sector;arc` | IMPL (2D) | 3D variant with PlaneElement | `[Point, Point, Point, Plane]` |
| `polygon;equilateralTriangle` | IMPL (2D) | 3D variant with PlaneElement | `[Point, Point, Plane]` |
| `point;angleBisector` | IMPL (2D) | 3D variant with PlaneElement | `[Point, Point, Point, Plane]` |
| `point;angleDivider` | IMPL (2D) | 3D variant with PlaneElement + Integer | `[Point, Point, Point, Plane, Integer]` |
| `line;angleBisector` | IMPL (2D) | 3D variant with PlaneElement | `[Point, Point, Point, Plane]` |
| `line;angleDivider` | IMPL (2D) | 3D variant with PlaneElement + Integer | `[Point, Point, Point, Plane, Integer]` |
| `point;similar` | IMPL (2D) | 3D variant with two PlaneElements | `[Point, Point, Plane, Point, Point, Point, Plane]` |
| `sphere;radius` | IMPL (2-point) | 3-point variant (center + 2 radius-defining points) | `[Point, Point, Point]` |

### Genuinely unimplemented

| Construction | Status | Notes |
|---|---|---|
| `polygon;starPolygon` | TBD | Element class supports it (density param `d` on `RegularPolygonElement`); needs dispatcher with `[Point, Point, Integer, Integer]` |
| `circle;invert` | TBD | `InvertCircle.java` not ported. No proposition or supplementary uses. |
| `plane;ambient` | TBD | Handled implicitly by `Slate.ts` screen plane. May not need explicit construction. |

---

## 4. Known platform bugs and deviations

These are documented in `doc/construction-tracker.md` Platform-level TODOs
but repeated here for completeness:

| Bug | File | Description |
|---|---|---|
| `parseColor` bug | `src/Colors.ts:31` | `val == "none" \|\| 0 \|\| "0" \|\| ""` always true. Hex color strings silently dropped. |
| Numeric `0` color | `src/index.ts` | Java's integer `0` = transparent. TS `IConstructionInfo` types colors as `string?`. |
| `title` not rendered | `src/index.ts` / `src/Slate.ts` | `IInitialization` accepts title but `drawElements()` never draws it. |
| Per-element `align` | `src/index.ts` | No `align` field in `IConstructionInfo`. All elements get `defaultAlign`. |
| Labels all same orientation | `src/elements/GeomElement.ts` | Java adapts label placement per geometry; TS uses fixed default. |
| Highlight colors | `IConstructionInfo` | Not settable via `init()`. |
| `IntersectionPL.ts` is wrong | `src/elements/point/IntersectionPL.ts` | Copy of `Intersection.ts`, not plane–line intersection. |
| Missing `"gray"` color | `src/Colors.ts` | Java has `"gray"`; TS has `"darkGray"` and `"lightGray"` only. |
| HSB color format | `src/Colors.ts` | Java interprets `"h,s,b"` comma-separated triples. TS does not. |
| `validateSignature` | `src/elements/Constructions.ts` | Has a `// TODO: resume here` comment. |
| Default `faceColor` divergence | `src/index.ts:73` | TS applies `lighten(bgcolor)` to `dimension==2` elements; Java doesn't default a face color. |
| `console.log(i)` in production | `src/index.ts:46` | Debug logging left in `init()`. |
| `PerpendicularPlane` div-by-zero | `src/elements/plane/PerpendicularPlane.ts:56` | Marked `// TODO: Check division by 0?`. |

---

## 5. Java Slate.java features not ported

| Feature | Java location | TS status | Notes |
|---|---|---|---|
| `pivot` rotation | `Slate.java:824–843` | Not ported | When a non-draggable point is dragged, Java rotates the entire scene around a `pivot` point on the element's ambient plane. TS ignores this gesture. |
| `reset()` on elements | `Element.java:reset()` | Partially ported | Some elements have `reset()` methods, but no UI action triggers them (Java uses applet restart). |
| `preexists` array | `Slate.java` | Handled by `createElement` name override | Java's `preexists` marks elements that should adopt the name of the construction. TS handles this via `g.name = name` in `createElement`. |
| `pivot` param | HTML `<param name=pivot>` | Not parsed | The Java applet's `pivot` param designates a point for scene rotation. TS `init()` ignores it. |
| `align` param | HTML `<param name=align>` | Parsed but limited | Global `defaultAlign` is set; per-element align not supported. |
| `inClass()` | `Element.java` | Replaced by `instanceof` | Java's string-based class checking replaced by TS `instanceof`. |

---

## 6. Summary

### What's done

- **465/465** propositions renderable across all 13 books
- **37/44** Java files fully ported (PORTED status)
- **3/44** partially ported (IntersectionPL, PerpendicularPL, Slate)
- **1/44** TBD with no proposition impact (InvertCircle)
- **3/44** N/A (Java infrastructure: Geometry, ClientFrame, Remote)
- **51 Mocha tests** passing
- **~30 three-way harness test pages** created

### What remains for Phase 2 (presentation bugs)

1. Fix `parseColor` bug (affects all hex colors)
2. Fix numeric-0 color handling (affects transparency)
3. Add HSB color format support
4. Add `"gray"` to color table
5. Fix default `faceColor` divergence for `dimension==2` elements
6. Implement `title` rendering
7. Add per-element `align` support
8. Fix label placement heuristics
9. Remove `console.log` from production
10. Fix `IntersectionPL.ts` (currently a copy of the wrong file)
11. Implement `pivot` rotation for 3D scenes

### What remains for completeness (not blocking propositions)

1. Wire `polygon;starPolygon` dispatcher (element class ready)
2. Port `InvertCircle.java` (no proposition uses)
3. Wire 3D variants of existing 2D constructions (14 variants listed above)
4. Port `PlaneFoot.java` for solid-geometry `line;foot` / `point;foot` 3D
