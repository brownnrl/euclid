# Project Journal

A running log of implementation sessions, newest entry at top.
Each entry records what was completed, what was discovered, and what comes next.

## Entry format

```
## YYYY-MM-DD — Short title

**Completed:**
- ...

**Discovered:**
- ...

**Next session:**
- ...
```

---

## 2026-04-11 — Implemented sector;arc + per-step review workflow + test infra fix

**Completed:**
- Restructured `doc/process.md` to institutionalize a per-step review workflow:
  each step is committed standalone on a feature branch and reviewed by a human
  before the next step begins. Added explicit "cut a `feature/{type}-{construction}`
  branch off master first" guidance to step 1, dropped the old optional step 4
  ("View in appletviewer") since it duplicated the mandatory step 7 harness run,
  and renumbered the remaining steps 1..8. Also added a "no `Co-Authored-By:`
  trailer on commits" rule to the preamble.
- Ported `sector;arc` as `src/elements/sector/ArcElement.ts` — a 2D port of
  `geom_applet/source/Arc.java`. Extends `SectorElement`; constructor takes
  `(A, M, B, Plane)` and creates a bare internal
  `_Center = new PointElement()` that `update()` recomputes every frame via
  `_Center.toCircumcenter(A, M, B)`. Ported **every method** Java overrides
  (update, translate, rotate) including the "arguably redundant" `_P.update()`
  call at the top of `update()` — per the new "no half-done ports" feedback
  rule (see memory/feedback_full_port.md).
- Wired `ArcConstruction` into the dispatch table at
  `src/elements/Constructions.ts` with 2D signature
  `[PointElement, PointElement, PointElement]`, dispatching to the existing
  `SectorConstructions.arc = 402` enum value.
- Three Mocha tests in `tests/SlateTest.ts` exercising `update()` (hand-computed
  circumcenter ≈ (86.667, 163.333) from propIII2 points), `translate()` isolation
  (center shifts, A/M/B untouched), and `rotate()` isolation (center rotates
  around a pivot, A/M/B untouched). 17/17 passing.
- Three-way harness pair:
  `view/applet-tests/sector/arc/{original,applet}.html` +
  `view/test/sector/arc.html`, all using propIII2 coordinates identical to the
  Mocha fixture `arc_propIII2_data`. Visual comparison confirmed: geometry
  matches between Java appletviewer and TS firefox; dragging free point E tracks
  the arc's circumcenter smoothly.
- **Platform fix** — solved the stale-`.js` test-shadowing bug (discovered
  during step 6 when my new Mocha tests silently failed to run). Root cause:
  `tsc` without `--noEmit` deposited compiled `.js` siblings next to every
  `.ts` file, and mocha picked up the stale `.js` instead of the fresh `.ts`.
  Fix: added `.mocharc.json` with `ts-node/register` and
  `spec: ["tests/**/*.ts"]`, switched `npm run build` to `tsc --noEmit`
  (pure type-check — matching what AGENTS.md has claimed all along), deleted
  56 vestigial `.js`/`.js.map` files from `src/` and `tests/` working trees.
  Full toolchain verified: `npm run build` clean, `npm test` → 17/17,
  `npx webpack` → `dist/bundle.js` in 1.3s. Zero new dependencies (ts-node
  was already installed).
- Book III renderable count: 14 → **18** (+III.2, III.23, III.25, III.30).

**Discovered:**
- **Face-color divergence from Java applet**: `src/index.ts:73` applies a
  default `faceColor = lighten(bgcolor)` to every element with `dimension == 2`.
  `ArcElement` has `dimension = 2` (matching Java), so without an explicit
  `faceColor` in the `IConstructionInfo`, the TS port renders a pale-cream
  pie-slice fill under the arc curve where Java shows an open curve. Joyce's
  propIII2 param string explicitly writes `;0;0;black;0` to suppress the
  default — we have no clean way to express this in `IConstructionInfo` today
  because numeric-`0` → null handling is already a known platform bug. Added
  as a new platform-level TODO in `doc/construction-tracker.md` with
  `sector;arc` cited as the first observed instance. **Not a geometry bug;
  purely cosmetic.**
- **I.4 is not unblocked by arc after all**: the proposition-tracker had
  I.4 listed as "NEEDS: sector;arc", but propI4.html's element e[6] is
  `CircAB;circle;radius;A,D,E;0;0;0;0` — a **3-point** `circle;radius` form
  ("circle at A with radius |DE|") that is TBD in TypeScript. The existing
  `CircleRadiusCenterConstruction` only has a 2-point signature. Tracker
  entry for I.4 corrected to call out this additional blocker.
- **ts-node was already a devDependency** at `package.json:32` (`^10.9.2`).
  This materially changed the right answer for the test-shadowing fix —
  Option 2 (mocha + ts-node) became the canonical choice over Option 1
  (pretest tsc) because no new dep was required.
- Arc.java's internal `Center = new PointElement()` does NOT need to be
  registered on the slate. It is a coordinate holder; `Arc.update()` writes
  to it directly each frame. No entry in `elementsForUpdate`.
- `SectorElement.drawFace` in TS draws a pie slice composed of an arc curve
  plus line-to-Center-A-B — meaning arcs inherit pie-slice filling via the
  base class, which is why the default-faceColor bug manifests so visibly.

**Next session:**
- Top priority: `line;chord` (17 uses, I.12, III.1, III.5–III.6, III.8–III.9,
  III.12, III.15, III.17, III.34, III.36–III.37) — `Chord.java` is a modest
  port.
- Alternative: `polygon;parallelogram` (18 uses, reuses the same D=A+C−B
  formula as the point variant that already landed, just wraps it in a
  4-vertex polygon).
- Or: `point;similar` (15 uses, calls existing `toSimilar()` on
  `PointElement` — easy win, unlocks I.23, I.24, I.26, I.31, III.14, and
  half of Book III's similar-segment propositions).
- Optional follow-up for `sector;arc`: investigate whether the face-fill
  divergence can be fixed at the `ArcElement` level by overriding `drawFace`
  to always no-op (which would match Java behavior for arcs specifically),
  versus fixing it at the platform level by making `IConstructionInfo`
  accept `number | null` for color fields and fixing `parseColor`. The
  platform fix unblocks all future cases; the per-element override is a
  spot patch.

---

## 2026-04-10 — Implemented point;parallelogram

**Completed:**
- Added `ParallelogramConstruction` to `src/elements/Constructions.ts` — reuses existing `Layoff`
  class with `new Layoff(C, A, B, A, B)`, which computes D′ = C + (B − A)
- Registered in `constructions` array
- Wrote Mocha test (14 passing): verifies D′ = (190, 120) from propI28 input coordinates
- Created `view/test/point/parallelogram.html` based on propI28 params; draws all four sides

**Discovered:**
- Java dispatch is `case 13: new Layoff(P[0],P[1],P[2],P[1],P[2])` — the direction vector CD
  and length vector EF are both set to (A→B), so factor = AB/AB = 1 and the result is
  pure vector addition: D′ = C + (B − A). No new element class needed.
- Verifiable against propI28 e[5]; elements 1–4 are all free points and connect, both implemented.

**Next session:**
- `sector;arc` (20 uses) — needs `ArcElement.ts`; circumcenter of A,M,B then arc through them
- `line;chord` (17 uses) — `Chord.java`
- `polygon;parallelogram` (18 uses) — full polygon (4 vertices) using same D′ formula

---

## 2026-04-10 — Implemented polygon;equilateralTriangle

**Completed:**
- Created `src/elements/polygon/RegularPolygonElement.ts` — port of `RegularPolygon.java` (n=3)
- Added `EquilateralTriangleConstruction` to `Constructions.ts`; registered in `constructions` array
- Wrote Mocha test (13 passing): equilateral side-length equality + apex above base
- Created `view/test/poly/equilateralTriangle.html` mirroring propI10 params
- Updated `doc/process.md` with "Identifying a verifiable proposition instance" guidance
- I.9, I.10, I.11 are now fully renderable

**Discovered:**
- `RegularPolygon.java` builds all vertices iteratively: V[i] = V[i-2] rotated around V[i-1] by
  θ = π(n-2)/n. For n=3 this runs once, placing the apex at A rotated 60° around B.
- `PointElement.rotate(pivot, ac, as, plane?)` applies a 2D rotation matrix in screen coords
  when `plane.isScreen` is true.
- The 2D-first policy applies: signature `[PointElement, PointElement]` dispatches to screen plane
  only. The 3D variant `[PointElement, PointElement, PlaneElement]` remains TBD.

**Next session:**
- `sector;arc` (20 uses) — needs `ArcElement.ts`; computes circumcenter of A,M,B and draws arc
- `point;parallelogram` (48 uses) — D = A + C − B; very simple, no new element file needed
- `line;chord` (17 uses) — `Chord.java`

---

## 2026-04-10 — Implemented point;vertex

**Completed:**
- Created feature branch `feature/point-vertex`
- Added `PolygonElement` to `ConstructionTypes` enum in `src/elements/Constructions.ts`
- Added `PolygonElement` case to `Construction.validateSignature`
- Added `VertexConstruction` class — returns `polygon.V[n-1]` (1-based), no new element file needed
- Registered `new VertexConstruction()` in the `constructions` array
- Wrote Mocha test (12 passing)
- Created `view/test/point/vertex.html` test page

**Discovered:**
- `vertex` uses the "preexists" pattern from Java — it aliases an existing vertex point under a new
  name. `Slate.createElement` renames the element, so the old name is superseded by the new one.
  This is intentional and matches the Java applet's behavior.
- Adopted 2D-first policy: for constructions with both 2D and 3D variants, implement 2D first.

**Next session:**
- `point;parallelogram` (48 uses) — reuses `Layoff`, no new element file, very simple
- `sector;arc` (20 uses) — needs `ArcElement.ts` extending `SectorElement`; implement 2D variant first

---

## 2026-04-10 — Documentation created; project state surveyed

**Completed:**
- Created `doc/` folder with process, architecture, constructions reference, and construction tracker
- Created `AGENTS.md` at repo root for agent cold-start guidance
- Surveyed all 99 Book I–III propositions; identified 32 that are currently renderable
- Created `doc/proposition-tracker.md` (deferred — to be used after construction tracker is complete)

**Current state of the port (as of today):**

Implemented constructions (37 total):
- **Point**: `free`, `fixed` (2D+3D), `first`, `last`, `midpoint`, `intersection` (2 variants),
  `foot`, `extend`, `cutoff`, `center`, `circumcenter` (2D+3D), `lineSlider` (3 variants),
  `circleSlider` (2 variants), `perpendicular` (5 variants)
- **Line**: `connect`, `extend`, `perpendicular` (5 variants), `bichord`
- **Circle**: `radius`, `circumcircle` (2D+3D)
- **Polygon**: `triangle`
- **Sector**: `sector` (2 variants)
- **Plane**: `perpendicular`
- **Sphere**: `radius`

Not yet implemented (highlights by priority):
1. `point;vertex` — 59 uses in Books I–III; needed for I.2, I.9–I.11, I.33, I.47
2. `point;parallelogram` — 48 uses; needed for I.28, I.30, I.32–I.36, all of Book II
3. `polygon;parallelogram` — 18 uses; needed for Book II diagram shading
4. `sector;arc` — 20 uses; needed for I.4, I.16, III.2, III.23–III.25, III.30
5. `line;chord` — 17 uses; needed for I.12, III.1, III.5–III.6, III.8–III.9, III.12
6. `polygon;quadrilateral` — 11 uses; needed for I.43–I.46, Book II
7. `polygon;square` — 10 uses; needed for I.46–I.47, Book II.2–II.11
8. `point;similar` — 15 uses; needed for I.23, I.24, I.26, I.31, III.14, III.24–III.29

**Renderable today (32/99):**
Book I: I.1, I.3, I.5–I.8, I.13–I.15, I.17–I.21, I.25, I.48 (16 propositions)
Book II: II.12, II.13 (2 propositions)
Book III: III.3, III.4, III.7, III.11, III.13, III.16, III.18–III.22, III.31, III.32, III.35 (14 propositions)

**Existing test view pages** (`view/test/`):
- `circle/circle.html`, `circle/circumcircle.html`
- `line/bichord.html`, `line/perpendicular.html`
- `point/foot.html`, `point/intersection.html`
- `poly/index.html`
- `sector/index.html`
- `circumcenter_lineperp.html` (compound test)

**Architecture note — the Java source files:**
`geom_applet/source/` contains both `.java` and `.class` files for every construction.
The Java source is the primary reference for porting. Key files for next sessions:
- `Arc.java` — computes circumcenter of A, M, B and draws arc through the three points
- `Chord.java` — chord of a circle between two points
- `ParallelP.java` — parallel line through a given point
- `Geometry.java` or `Slate.java` — construction name → class mapping (for `parallelogram`)

**Discovered:**
- `foot` is implemented (via `FootPointConstruction`) but `chord` and `arc` are not
- `sector;arc` is distinct from `sector;sector` — arc is TBD despite sector being done
- `lineSegmentSlider` is implemented as a separate variant of `lineSlider`
- All 37 implemented constructions are registered in the `constructions` array at the
  bottom of `Constructions.ts`; the array order matters for 2D/3D variant resolution

**2026-04-10 update — Java↔TypeScript analysis completed:**
- Created `doc/analysis/java-typescript-comparison.md` with full class-by-class mapping
- **Bug found**: `IntersectionPL.ts` is a copy of `Intersection.ts` — does line–line intersection
  instead of plane–line intersection; needs rewrite (but `toIntersectionPL()` method exists)
- **Bug found**: `parseColor` else-if always true → hex colors for elements silently return null
- **Missing**: `"gray"` color name not in TypeScript color table
- **Missing**: HSB color format (`"35,19,100"`) from Java background params not parsed by TypeScript
- **`PlaneSlider` name collision**: TypeScript `PlaneSlider` = Java free point on screen; Java
  `PlaneSlider` (constrained to arbitrary plane) = TBD in TypeScript
- ~24 of ~65 Java constructions ported; ~41 remaining

**Next session options:**
1. Implement `point;parallelogram` (D = A+C−B; unlocks 48+ uses across Books I–II)
2. Implement `sector;arc` (10-line port of `Arc.java`; unlocks 20 propositions)
