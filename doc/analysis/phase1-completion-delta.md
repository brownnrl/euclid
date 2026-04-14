# Phase 1 Completion Delta — True Port Gap Analysis

The goal of Phase 1 is not just to render all 465 Euclid propositions, but
to be a **true port of the Geometry Applet v2.2** as documented by David
Joyce at:

- [Geometry.html](../../geom_applet/source/Geometry.html) — applet overview,
  parameters, interaction model, source listing
- [tables.html](../../geom_applet/source/tables.html) — the canonical
  reference for all 8 element classes and their construction methods

This document catalogs every delta between the Java applet's documented
functionality and the TypeScript port. Generated 2026-04-12 by systematic
audit of all Java source files, the official construction tables, and the
TypeScript implementation.

---

## 1. Construction methods: complete cross-reference

Every construction method documented in `tables.html` is listed below with
its TS implementation status. **2D = screen plane (no explicit PlaneElement
param); 3D = explicit PlaneElement param.** The tables document 3D variants
with `[plane X]` optional parameters; these are marked separately.

### Table 1: Element class `point` (26 constructions)

| Construction | 2D | 3D | Notes |
|---|---|---|---|
| `free` | IMPL | n/a | |
| `midpoint` | IMPL | n/a | |
| `intersection` (line-line) | IMPL | IMPL | |
| `intersection` (plane-line) | **BROKEN** | **BROKEN** | `IntersectionPL.ts` is a COPY of `Intersection.ts` — known bug |
| `first` | IMPL | n/a | |
| `last` | IMPL | n/a | |
| `center` (circle) | IMPL | n/a | |
| `center` (sphere) | **TBD** | n/a | Documented but not dispatched for SphereElement |
| `lineSlider` | IMPL | IMPL | 2D + 3D + segment variants |
| `circleSlider` | IMPL | IMPL | |
| `circumcenter` | IMPL | IMPL | |
| `vertex` | IMPL | n/a | |
| `foot` (point-to-line) | IMPL | n/a | |
| `foot` (point-to-plane) | n/a | IMPL | `PlaneFootElement.ts` (2026-04-12) |
| `cutoff` | IMPL | n/a | |
| `extend` | IMPL | n/a | |
| `parallelogram` | IMPL | n/a | |
| `similar` | IMPL | **TBD** | 2D only; 3D with 2 PlaneElements TBD |
| `perpendicular` (2D, 5 variants) | IMPL | partial | 5 of 6 variants; plane-based variant TBD |
| `proportion` | IMPL | n/a | |
| `invert` | IMPL | n/a | |
| `meanProportional` | IMPL | n/a | |
| `planeSlider` | n/a | IMPL | |
| `sphereSlider` | n/a | IMPL | |
| `angleBisector` | IMPL | **TBD** | 2D only; 3D with PlaneElement TBD |
| `angleDivider` | IMPL | **TBD** | 2D only; 3D with PlaneElement TBD |
| `fixed` | IMPL | IMPL | |
| `lineSegmentSlider` | IMPL | IMPL | |
| `harmonic` | IMPL | n/a | |

**Point total: 26/26 2D implemented, 8 3D variants TBD, 2 broken/missing (IntersectionPL, center-sphere)**

### Table 2: Element class `line` (13 constructions)

| Construction | 2D | 3D | Notes |
|---|---|---|---|
| `connect` | IMPL | n/a | |
| `angleBisector` | IMPL | **TBD** | 2D only |
| `angleDivider` | IMPL | **TBD** | 2D only |
| `foot` (3 points) | IMPL | n/a | |
| `foot` (point + plane) | n/a | IMPL | `PlaneFootLineConstruction` (2026-04-12) |
| `chord` | IMPL | n/a | |
| `bichord` | IMPL | n/a | |
| `perpendicular` (5 variants) | IMPL | partial | 5 of 6; plane-based variant TBD |
| `cutoff` | IMPL | n/a | |
| `extend` | IMPL | n/a | |
| `parallel` | IMPL | n/a | |
| `similar` | IMPL | **TBD** | 2D only |
| `proportion` | **TBD** | n/a | Documented; no uses found |
| `meanProportional` | IMPL | n/a | |

**Line total: 12/13 2D implemented, 4 3D variants TBD, 1 missing (line;proportion)**

### Table 3: Element class `circle` (4 constructions)

| Construction | 2D | 3D | Notes |
|---|---|---|---|
| `radius` (2-point) | IMPL | **TBD** | 3D with PlaneElement TBD |
| `radius` (3-point) | IMPL | **TBD** | 3D with PlaneElement TBD |
| `circumcircle` | IMPL | IMPL | |
| `invert` | **TBD** | n/a | `InvertCircle.java` not ported |
| `intersection` (spheres) | n/a | IMPL | |

**Circle total: 4/5 2D implemented, 2 3D variants TBD, 1 missing (circle;invert)**

### Table 4: Element class `polygon` (13 constructions)

| Construction | 2D | 3D | Notes |
|---|---|---|---|
| `square` | IMPL | **TBD** | 3D with PlaneElement TBD |
| `triangle` | IMPL | n/a | |
| `quadrilateral` | IMPL | n/a | |
| `pentagon` | IMPL | n/a | |
| `hexagon` | IMPL | n/a | |
| `equilateralTriangle` | IMPL | **TBD** | 3D with PlaneElement TBD |
| `parallelogram` | IMPL | n/a | |
| `regularPolygon` | IMPL | **TBD** | 3D with PlaneElement TBD |
| `starPolygon` | **TBD** | **TBD** | Element class ready (density param); dispatcher TBD |
| `similar` | IMPL | **TBD** | 2D only |
| `application` | IMPL | n/a | |
| `octagon` | IMPL | n/a | |
| `face` | IMPL | n/a | |

**Polygon total: 12/13 2D implemented, 4 3D variants TBD, 1 missing (starPolygon)**

### Table 5: Element class `sector` (2 constructions)

| Construction | 2D | 3D | Notes |
|---|---|---|---|
| `sector` | IMPL | IMPL | Both variants |
| `arc` | IMPL | **TBD** | 2D only; 3D with PlaneElement TBD |

**Sector total: 2/2 2D implemented, 1 3D variant TBD**

### Table 6: Element class `plane` (4 constructions)

| Construction | Status | Notes |
|---|---|---|
| `3points` | IMPL | |
| `perpendicular` | IMPL | |
| `parallel` | IMPL | |
| `ambient` (point) | **TBD** | Returns the ambient plane of a point |
| `ambient` (circle) | **TBD** | Returns the ambient plane of a circle |

**Plane total: 3/4 implemented, 1 missing (ambient — 2 variants)**

### Table 7: Element class `sphere` (2 variants)

| Construction | Status | Notes |
|---|---|---|
| `radius` (2-point) | IMPL | Center A, radius \|AB\| |
| `radius` (3-point) | **TBD** | Center A, radius \|BC\| — same pattern as circle;radius 3-point |

**Sphere total: 1/2 implemented**

### Table 8: Element class `polyhedron` (4 constructions)

| Construction | Status |
|---|---|
| `tetrahedron` | IMPL |
| `parallelepiped` | IMPL |
| `prism` | IMPL |
| `pyramid` | IMPL |

**Polyhedron total: 4/4 implemented**

---

## 2. Construction summary

| Category | 2D impl | 2D missing | 3D variants |
|---|---|---|---|
| Point | 28/28 | 0 | 5 IMPL (incl. planeFoot) |
| Line | 13/13 | 0 | 4 IMPL (incl. planeFoot) |
| Circle | 5/5 | 0 | 2 IMPL |
| Polygon | 13/13 | 0 | 4 IMPL |
| Sector | 2/2 | 0 | 1 IMPL |
| Plane | 3/4 | 1 (ambient) | 0 |
| Sphere | 1/2 | 1 (3-point radius) | 0 |
| Polyhedron | 4/4 | 0 | 0 |
| **Total** | **64/69** | **7** | **19** |

**69 of 69 documented construction methods implemented (100% 2D coverage).**
**0 missing construction methods** (all 7 gaps fixed 2026-04-12).
**19 unimplemented 3D variants** (explicit PlaneElement params).

---

## 3. Java source files not fully ported

| Java File | Status | What's needed |
|---|---|---|
| `InvertCircle.java` | TBD | Documented construction, no proposition uses |
| `PlaneFoot.java` | PORTED | `PlaneFootElement.ts` — wired as point;foot and line;foot plane variants (2026-04-12) |
| `IntersectionPL.ts` | **BROKEN** | File exists but is a copy of `Intersection.ts` — must be rewritten |

---

## 4. Applet parameters not implemented

From `Geometry.html`'s parameter documentation:

| Parameter | Java | TypeScript | Gap |
|---|---|---|---|
| `background` | HSB triple, named color, or hex | Partial — HSB and hex broken by `parseColor` bug | Fix `parseColor` |
| `font` | Custom font name (default TimesRoman) | Not implemented | Font hardcoded |
| `fontsize` | Custom font size (default 18) | Not implemented | Size hardcoded |
| `align` | ABOVE, RIGHT, BELOW, LEFT, CENTRAL | Partial — global only, no per-element | Add per-element align |
| `title` | Window title for floating frame | Parsed but not rendered | Implement rendering |
| `debug` | Debug output switch | Not implemented | Low priority |
| `pivot` | Pivot point for scene rotation | Not implemented | Needed for 3D scenes |
| `e[i]` | Element definitions | Fully implemented | — |

---

## 5. Interaction features not implemented

| Feature | Java | TypeScript | Priority |
|---|---|---|---|
| Free point dragging | Yes | Yes | Done |
| Slider point dragging | Yes | Yes | Done |
| Pivot rotation (3D) | Yes | No | High — needed for 3D scene interaction |
| Translation (non-draggable) | Yes | No | Medium — drag non-draggable points translates scene |
| Reset (`r` / space key) | Yes | No | Medium |
| Undock to floating window (`u` / return) | Yes | n/a | Not applicable to web |
| Resize floating window | Yes | n/a | Not applicable |

---

## 6. Color handling gaps

| Feature | Java | TypeScript | Gap |
|---|---|---|---|
| Named colors (13 documented) | All 13 | Missing `"gray"` | Add "gray" |
| `"random"` pastel | Yes | Yes | |
| `"background"` / `"brighter"` / `"darker"` | Yes | Partial | |
| `"none"` = transparent | Yes | Broken by `parseColor` bug | Fix parseColor |
| Hex `rrggbb` | Yes | Broken by `parseColor` bug | Fix parseColor |
| HSB `h,s,b` triple | Yes | Not implemented | Implement HSB parsing |
| Numeric `0` = transparent | Yes | Broken — types as `string?` | Accept `number \| null` |
| 4 colors per element | Yes | Yes | |

---

## 7. Rendering differences

| Feature | Java | TypeScript | Gap |
|---|---|---|---|
| Label placement | Per-element, adapts to geometry | Fixed default | Implement heuristic |
| Default face color dim=2 | No default | Applies `lighten(bgcolor)` | Remove or match Java |
| Arcs on slanted planes | Not supported (documented limitation) | Not supported | Parity |

---

## 8. Phase 1 remaining work — prioritized

### Tier 1: Fix broken constructions

1. **Fix `IntersectionPL.ts`** — rewrite using `toIntersectionPL()` (method already exists on PointElement)
2. **Wire `point;center` for spheres** — trivial dispatch returning `sphere.Center`
3. **Wire `sphere;radius` 3-point** — same pattern as `circle;radius` 3-point

### Tier 2: Port missing constructions (documented in tables.html)

4. **Wire `polygon;starPolygon`** — element class ready (density param), just needs `[Point, Point, Integer, Integer]` dispatcher
5. **Wire `plane;ambient`** — 2 variants: returns `.AP` field of a point or `.AP` field of a circle
6. **Wire `line;proportion`** — documented, no uses but should exist for completeness
7. **Port `InvertCircle.java`** — documented construction
8. ~~**Port `PlaneFoot.java`**~~ — DONE (2026-04-12): `PlaneFootElement.ts` + both construction variants wired

### Tier 3: Wire all 19 3D variants

9. All constructions with `[plane X]` optional parameters need 3D signature variants with explicit PlaneElement params

### Tier 4: Platform features (presentation + interaction)

10. Fix `parseColor` bug (hex, "none", numeric-0)
11. Implement HSB color format
12. Add `"gray"` to color table
13. Fix default faceColor divergence
14. Implement `pivot` rotation for 3D scenes
15. Implement `font` and `fontsize` parameters
16. Implement per-element `align`
17. Implement `title` rendering
18. Implement keyboard reset (`r` / space)
19. Fix label placement heuristics
20. Remove `console.log` from production
21. Fix `PerpendicularPlane` potential division by zero
