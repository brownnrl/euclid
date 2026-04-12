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

## 2026-04-12 — Implemented point;meanProportional — Books I–X COMPLETE

**Completed:**
- Ported `MeanProportional.java` as `src/elements/point/MeanProportionalElement.ts`
  (23 lines, line-for-line port). Computes the geometric mean: given
  segments S, T, U, finds the point U' on U where |U'| = sqrt(|S|*|T|)
  so that S:U' = U':T.
- Both point and line variants wired (`MeanProportionalPointConstruction`,
  `MeanProportionalLineConstruction`). Full Java class conversion.
- One Mocha test: geometric mean (sqrt(100*25)=50), proportion verified.
  38 → **39 passing**.
- **35 propositions unblocked** across Books VIII (2), X (33), XIII (via
  XIII.2). This is the single highest-impact construction port in the
  entire project.
- **Books I through X are now 100% renderable: 390/390.**
- Overall: 429 of 465 propositions renderable (**92%**). Only 36 remain
  blocked, all in Books XI–XIII (solid geometry constructions).

**Next session:**
- The remaining 36 blocked propositions all need solid-geometry
  constructions: `plane;3points` (the key blocker), `point;planeSlider`,
  `point;sphereSlider`, `polygon;face`, `polygon;octagon`,
  `circle;intersection`. These are the Phase 1 frontier.
- `plane;3points` is likely the highest-impact next port — it blocks
  propositions across all three remaining books.

---

## 2026-04-12 — Books V–X analysis — 391/465 renderable (84%), zero new code

**Completed:**
- Analyzed ALL remaining books (V through XIII) against the construction
  tracker. Extended the proposition tracker with per-proposition entries
  for Books V–X and summary-level analysis for Books XI–XIII.
- **Books V, VI, VII, IX**: all 133 propositions are ALREADY RENDERABLE
  using existing constructions. Zero new ports needed. These books cover
  proportion theory, similar figures, and number theory — none introduce
  constructions beyond what was ported for Books I–IV.
- **Book VIII**: 25 of 27 renderable; 2 blocked by `point;meanProportional`.
- **Book X**: 82 of 115 renderable; 33 blocked by `point;meanProportional`.
  `MeanProportional.java` is a single construction that would unblock
  **35 propositions** across Books VIII, X, and XIII at once.
- **Books XI–XIII** (solid geometry): preliminary analysis shows they need
  3D-specific constructions (`plane;3points`, `point;planeSlider`,
  `point;sphereSlider`, `polygon;face`, `polygon;octagon`,
  `circle;intersection`) that are the final frontier of Phase 1.
- Overall: **391 of 465 propositions (84%) are renderable** without any
  new code. Only 74 remain blocked.

**Discovered:**
- **`point;meanProportional` is the single highest-impact TBD construction
  remaining**: it blocks 35 propositions (2 in VIII, 33 in X, plus some in
  XIII). `MeanProportional.java` is 22 lines — a very quick port.
- Books V through IX were a mass unlock: the proportion-era constructions
  (`point;proportion`, `point;similar`, `point;parallelogram`) that were
  ported for Books I–IV turned out to be sufficient for 133 out of 138
  propositions in Books V–IX (96.4%).
- The solid-geometry books (XI–XIII) are the real Phase 1 frontier. They
  need `plane;3points` (the basic 3-point plane construction), slider
  constructions for planes and spheres, and some polygon variants. These
  will require actual 3D element classes.

**Next session:**
- **Top priority: `point;meanProportional`** — unblocks 35 propositions
  across 3 books. `MeanProportional.java` is 22 lines. Highest
  single-construction impact remaining in the entire project.
- After that: the solid-geometry constructions for Books XI–XIII.

---

## 2026-04-12 — AngleDivider + hexagon/pentagon — BOOK IV COMPLETE (16/16)

**Completed:**
- Ported `AngleDivider.java` as `src/elements/point/AngleDividerElement.ts`
  (24 lines, line-for-line port). The class n-sects angle BAC by rotating
  ray BA by θ/n around vertex A, then intersecting the rotated ray with
  line BC via `toIntersection()`. Both `angle()` and `toIntersection()`
  already existed on `PointElement`.
- Wired all four AngleDivider construction variants (full Java class
  conversion):
  - `AngleBisectorPointConstruction` (n=2, 3 points)
  - `AngleDividerPointConstruction` (variable n, 3 points + integer)
  - `AngleBisectorLineConstruction` (n=2, wraps in LineElement)
  - `AngleDividerLineConstruction` (variable n, wraps in LineElement)
- Wired `PentagonPolygonConstruction` (5-point pass-through) and
  `HexagonPolygonConstruction` (6-point pass-through), completing the
  polygon free-vertex series (triangle, quadrilateral, pentagon, hexagon).
- Two Mocha tests: line;angleBisector (right-angle bisector at (50,50)),
  point;angleBisector (same fixture, point-only). 36 → **38 passing**.
- **BOOK IV IS 100% RENDERABLE** (16/16). I–IV total: 112 → **115/115**.

**Discovered:**
- AngleDivider.java's constructor takes params in the order (B, A, C, AP, n)
  — the vertex A is the SECOND param, not the first. The Slate.java
  dispatch passes (P[0], P[1], P[2], screen, 2) where P[1] is the vertex.
  The `LineElement` wraps `(P[1], result)` — line from vertex to bisector
  point.

**Next session:**
- Analyze Book V and expand the proposition tracker. Book V covers the
  theory of proportion (Eudoxus) — 25 propositions. Since these are about
  ratio and proportion, they may use constructions we already have
  (`point;proportion`, `point;similar`) or may introduce new ones.
- Continue the book-by-book Phase 1 expansion toward Books VI–XIII.

---

## 2026-04-12 — Implemented polygon;regularPolygon — first Book IV construction

**Completed:**
- Wired `RegularPolygonConstruction` in `src/elements/Constructions.ts` —
  a 2D dispatcher with signature `[PointElement, PointElement, Integer]`
  that creates `RegularPolygonElement(a, b, screen, n)` for variable n.
  No new element class needed — `RegularPolygonElement.ts` was already
  fully ported (including density parameter) during the polygon;square
  session. Total new code: ~10 lines.
- Registered BEFORE `SquarePolygonConstruction` and
  `EquilateralTriangleConstruction` in the constructions array (3-param
  signature first, per signature-ordering rule).
- One Mocha test: regular pentagon (n=5), all-5-sides-equal check.
  35 → **36 passing**.
- Test page + applet companion using propIV11 variant 1 (inscribed
  pentagon with circumcircle and diagonals).
- Book IV renderable count: 10 → **13** (+IV.11, IV.12, IV.14).
  I–IV total: 109 → **112**.

**Discovered:**
- IV.13 and IV.16 still need `line;angleBisector` in addition to
  `polygon;regularPolygon` (which just landed).
- propIV11 has 3 applet variants: variant 2 uses `point;angleBisector`
  (TBD) and variant 3 uses `polygon;pentagon` (TBD) — but variant 1
  renders fully with just `polygon;regularPolygon`.

**Next session:**
- `line;angleBisector` (`AngleDivider.java`) — unblocks IV.4, IV.13, IV.16
  (3 remaining Book IV blockers). Real porting work.
- Then `polygon;hexagon` — trivial pass-through, unblocks IV.15.
- After those 2: Book IV complete (16/16). Analyze Book V next.

---

## 2026-04-12 — Scope extension: all-books coverage + Java port tracker

**Completed:**
- Corrected project phase descriptions in AGENTS.md and doc/process.md.
  Phase 1 now explicitly covers **all books (I–XIII)**, not just I–III.
  Books I–III reaching 99/99 was a milestone, not the end of Phase 1.
  Inserted a new Phase 2 (presentation bug fixes) between construction
  porting and HTML conversion. Phase numbering is now:
  1. Port all Java constructions (book-by-book, I through XIII)
  2. Fix presentation bugs (colors, labels, behavioral parity)
  3. HTML conversions (566 files from Java params to TS init calls)
  4. Retire the Java toolchain
- Created `doc/java-port-tracker.md` — maps all 44 `.java` files in
  `geom_applet/source/` to their TypeScript implementation status (PORTED,
  PARTIAL, TBD, N/A), with TS file locations, deviation notes, and
  remaining work per file. 27 fully ported, 3 partial, 9 TBD, 3 N/A,
  2 TBD base classes.
- Extended `doc/proposition-tracker.md` with Book IV (16 propositions).
  10 already renderable using existing constructions; 6 blocked by 3 TBD
  constructions: `polygon;regularPolygon` (5 props), `line;angleBisector`
  (3 props + 1 indirect), `polygon;hexagon` (1 prop).
- Updated `doc/construction-tracker.md` with Book IV blocker analysis:
  noted which TBD constructions each Book IV proposition needs and how
  many props each would unblock.

**Discovered:**
- `polygon;regularPolygon` is the highest-priority Book IV blocker (5
  propositions), and the element class `RegularPolygonElement.ts` is
  **already fully ported** (including the star-polygon density parameter
  from the polygon;square session). Only the Construction dispatcher
  with variable-n signature `[PointElement, PointElement, Integer]` is
  needed — trivial to wire.
- `polygon;pentagon` (5 free vertices) is NOT needed for Book IV — propIV11
  uses `polygon;regularPolygon;A,B,5` (computed regular pentagon), not
  `polygon;pentagon;A,B,C,D,E` (5 free vertices).
- `polygon;hexagon` (6 free vertices) IS needed for IV.15 as a pass-through
  PolyConstruction, same trivial pattern as quadrilateral.

**Next session:**
- Top priority: `polygon;regularPolygon` — unblocks 5 Book IV props,
  element class already ported, just needs a Construction dispatcher.
  Trivially easy.
- Then: `line;angleBisector` (`AngleDivider.java`) — unblocks 4 Book IV
  props. Real porting work.
- Then: `polygon;hexagon` — trivial pass-through, unblocks IV.15.
- After Book IV is fully covered: analyze Book V and continue the cycle.

---

## 2026-04-12 — Implemented polygon;application — 99/99 BOOKS I–III COMPLETE

**Completed:**
- Ported `polygon;application` as `src/elements/polygon/ApplicationElement.ts`
  — a port of `Application.java` (43 lines). Extends `PolygonElement`.
  Creates a parallelogram ABEF with side AB, angle CAB, whose area equals
  the input polygon P's area. `update()` computes
  `factor = |P.area()| / (2 * area(A, B, C))`, scales along AC to get
  V[3], then closes the parallelogram at V[2] = B + V[3] - A. Overrides
  `update()`, `translate()`, `rotate()`.
- Added `area()` method to `PolygonElement.ts` (fan triangulation from
  V[0]) to support this construction — per the full Java class conversion
  rule.
- **Fixed pre-existing bug in `PointElement.length2()`**: `this._z + this._z`
  was addition instead of multiplication (`* this._z`). This made
  `length2()` return `x² + y² + 2z` instead of `x² + y² + z²`, breaking
  `PointElement.area()` via `cross().length()`. The bug was latent because
  most geometry code uses `distance2()` (correct), not `length2()`.
  ApplicationElement is the first construction to call `P.area()`.
- One Mocha test: parallelogram area = input triangle area (4000),
  computed vertices verified. 34 → **35 passing**.
- **ALL 99 PROPOSITIONS IN BOOKS I–III ARE NOW RENDERABLE.**
  - Book I: 48/48 (100%)
  - Book II: 14/14 (100%)
  - Book III: 37/37 (100%)
  - **I–III total: 99/99 (100%)**

**Discovered:**
- `PointElement.length2()` had a typo from the original TS port: `+` instead
  of `*` for the z component. This is a one-character fix with large
  potential impact on any 3D geometry that uses `length()` or `area()`.
  All existing 2D constructions were unaffected because z=0, and most
  code paths use `distance2()` (which was correct).

**Phase 1 complete.** Per AGENTS.md, the project transitions to Phase 2:
proposition HTML conversion (converting all 566 proposition HTMLs in
`view/euclid-html/` from Java `<param>` format to TypeScript
`geomlib.init()` calls in a new `view/books/` folder).

---

## 2026-04-12 — Implemented point;proportion + drift fix — 96/99

**Completed:**
- Ported `point;proportion` as `src/elements/point/ProportionElement.ts` —
  a port of `Proportion.java` (26 lines). Takes 8 PointElements defining
  four line segments S, T, U, V and computes the point V' on V0V1 such
  that |S|:|T| = |U|:|V0V'|. `update()` body is 4 lines: compute factor
  from distance² ratios, apply to the V direction vector.
- `ProportionPointConstruction` wired with signature `[PointElement × 8]`.
  One Mocha test with clean collinear coords (factor=0.2, result at (40,0)).
  33 → **34 passing**.
- **Drift fix for 5 more propositions**: I.2, I.4, I.9, I.10, I.11 —
  all had blockers that were already IMPL from earlier sessions (I.2/I.9/
  I.10/I.11 needed polygon;equilateralTriangle + point;vertex, both IMPL
  since 2026-04-10; I.4 needed 3-point circle;radius, IMPL since earlier
  today). Verified all against actual HTML params.
- Book I: 39 → **46** (+2 proportion + 5 drift). I–III total: 89 → **96**.
- **Only 3 propositions remain blocked**: I.44, I.45, II.14 — all need
  `polygon;application`.

**Discovered:**
- propI16 and propI29 each have dual applet variants. Their primary
  variants were already renderable (no point;proportion needed). Only the
  secondary "elliptic geometry" variants use point;proportion.

**Next session:**
- `polygon;application` — the FINAL construction. Landing it would make
  I.44, I.45, II.14 renderable, reaching **99/99 = 100%** for Books I–III.

---

## 2026-04-12 — Implemented polygon;similar + line;similar — BOOK III COMPLETE

**Completed:**
- Ported `polygon;similar` as `SimilarPolygonConstruction` and
  `line;similar` as `SimilarLineConstruction` in
  `src/elements/Constructions.ts`. Both reuse the existing `SimilarElement`
  (from the `point;similar` session) as an intermediate, wrapping it in a
  `PolygonElement([A, B, sim])` or `LineElement(A, sim)` respectively. Same
  dispatch-trick pattern. No new element class for either.
- Two Mocha tests: polygon;similar creates a 3-vertex triangle,
  line;similar creates a line from A to the similar point. 31 → **33
  passing**.
- Test pages + applet companions for both: propI23 (polygon;similar) and
  propI31 (line;similar).
- **Tracker drift fix**: verified HTML param lists for I.28, I.30, I.32,
  I.33, I.35, I.36, I.41 — all had been renderable since `point;parallelogram`
  landed on 2026-04-10 but were never flipped. Fixed all 7.
- **BOOK III IS 100% RENDERABLE**: III.14 was the last remaining `[ ]`
  entry; it uses `polygon;similar` which just landed. 37/37 propositions
  now at `[~]`.
- Book I: 28 → **39** (+4 similar + 7 drift fix + I.31). Book III: 36 →
  **37** (COMPLETE). I–III total: 77 → **89** (90%).

**Discovered:**
- I.33 was another drift candidate not in the original list — both its
  blockers (`point;parallelogram`, `point;vertex`) were IMPL since
  2026-04-10. Fixed alongside the other 6.
- The `Similar.java` port is now fully complete across all three type
  variants: point (session 4), line (this session), polygon (this session).
  All share the same `SimilarElement` intermediate.

**Next session:**
- Remaining Book I blockers: `point;proportion` (I.16, I.29),
  `polygon;application` (I.44, I.45, II.14), `line;foot` 3D variant
  (no I–III uses).
- Consider a sweep to audit every remaining `[ ]` entry in Book I against
  actual HTML params — the drift fix pattern suggests more may be hiding.

---

## 2026-04-12 — Implemented 3-point circle;radius variant

**Completed:**
- Added `CircleRadius3PointConstruction` to `src/elements/Constructions.ts`
  — a new signature variant `[PointElement × 3]` for the existing
  `circle;radius` construction. The 3-point form creates a circle at
  center=P[0] with radius=|P[1]−P[2]| (distance between two arbitrary
  points, not from center to edge). Registered BEFORE the 2-point variant
  per the signature-ordering rule (longer signature first).
- Updated `CircleElement.ts` to support an optional `A` parameter in the
  constructor interface, per the "full Java class conversion" rule: when
  `A` is provided, `radius = A.distance(B)` (3-point form); when omitted,
  `A = Center` (2-point form, backward-compatible).
- One Mocha test: propIII26 coords (center H=(340,115), radius-defining
  points G=(120,115) and A=(75,30), expected radius ≈ 96.177). 30 → **31
  passing**.
- Test page + applet companion using the full propIII26 — two equal circles
  (left = 2-point, right = 3-point form), inscribed triangles, sectors,
  and the similar-point construction for vertex F.
- Book III renderable count: 31 → **36** (+III.24, III.26, III.27, III.28,
  III.29). I–III total: 72 → **77**.

**Discovered:**
- propIII24's `circle;radius;C,AB` param has `AB` as a LineElement, which
  expands to 2 PointElements — making it a 3-point circle;radius call
  (center C, radius=|A−B|). The LineElement expansion rule from AGENTS.md
  applies here too.
- The 3D variants (2-point with explicit PlaneElement, 3-point with
  explicit PlaneElement) remain TBD — deferred per 2D-first policy.

**Next session:**
- `polygon;similar` + `line;similar` (unlocks I.23, I.24, I.26, I.31,
  III.14 = +5). Share `Similar.java` with `point;similar`.
- Tracker drift fix for I.28, I.30, I.32, I.35, I.36, I.41 (should be
  renderable since `point;parallelogram` has been IMPL since 2026-04-10).
- `point;proportion` (4 I–III uses, unlocks I.16, I.29).

---

## 2026-04-12 — Implemented line;foot (2D) — Pythagoras unlocked

**Completed:**
- Ported `line;foot` (2D variant) as `LineFootConstruction` in
  `src/elements/Constructions.ts`. **No new element class** — reuses
  existing `Foot` class + base `LineElement` wrapper. Same dispatch-trick
  pattern as `line;parallel`, `line;extend`, and `line;chord`.
  `construct()` creates `Foot(A, B, C)` then `LineElement(A, foot)`.
  Total new code: ~10 lines.
- One Mocha test: foot-of-perpendicular coords + dot-product-zero
  perpendicularity check. 29 → **30 passing**.
- Test page + applet companion using the full propI47 — **Pythagoras'
  theorem**: right triangle ABC on a semicircle, three squares on the
  sides, the perpendicular AL from A to DE (the target `line;foot`),
  and auxiliary lines AD, CF, BK, AE. 22 elements.
- Book I renderable count: 27 → **28** (+I.47). I–III total: 71 → **72**.

**Discovered:**
- The solid-geometry variant (`PlaneFoot.java`, `line;foot` with point +
  plane params) remains TBD. Only the 2D variant (3 points, dispatched
  via `Slate.java` case 3 choice 0) was ported in this session.

**Next session:**
- High-impact: 3-point `circle;radius` variant (unlocks III.24,
  III.26–III.29 = +5 Book III props).
- Or: `polygon;similar` + `line;similar` (unlocks I.23, I.24, I.26, I.31,
  III.14 = +5 mixed).
- Also consider checking the proposition-tracker drift noted in
  earlier journal entries for I.28, I.30, I.32, I.35, I.36, I.41 —
  these listed `point;parallelogram` as their sole blocker but
  `point;parallelogram` has been IMPL since 2026-04-10.

---

## 2026-04-12 — Implemented polygon;square — MASSIVE Book II unlock

**Completed:**
- Ported `polygon;square` as `SquarePolygonConstruction` in
  `src/elements/Constructions.ts`. Reuses `RegularPolygonElement` with
  n=4, same pattern as `EquilateralTriangleConstruction` (n=3). 2D variant
  only (screen plane); 3D variant deferred per 2D-first policy.
- Also completed the `RegularPolygonElement.ts` port by adding the optional
  `d` (density) parameter from `RegularPolygon.java`'s second constructor,
  per the newly codified "full Java class conversion" rule (added to
  `doc/process.md` step 2 in this branch). The density parameter defaults
  to 1, so existing `equilateralTriangle` tests pass unchanged. This lays
  groundwork for `polygon;starPolygon` in a future session — when that
  construction is picked, the element class is already complete.
- One Mocha test: 4-vertex square correctness from propI46 coords
  (A=(50,190), B=(170,190) → E=(170,70), D=(50,70), side=120, all-sides-
  equal check). 28 → **29 passing** (cumulative).
- **Massive proposition unlock**: verified ALL remaining Book II
  propositions against their actual HTML param lists. Every one of
  II.1–II.11 now has all its construction blockers resolved. Only
  II.14 remains blocked (needs `polygon;application`).
  - Book I: 26 → **27** (+I.46).
  - Book II: 3 → **13** (+II.1, II.2, II.3, II.4, II.5, II.6, II.7,
    II.8, II.10, II.11). Only II.14 remains blocked.
  - Book III: 31 (unchanged).
  - I–III total: 60 → **71** (+11). **Largest single-session jump.**

**Discovered:**
- **I.47 needs `line;foot` (2D variant), not just polygon;square**: the
  tracker was missing this blocker. propI47 e[16] uses `line;foot;A,D,E`
  which dispatches to `Foot(A,D,E) + LineElement(A,foot)` in Java —
  a 2D variant, not the solid-geometry `PlaneFoot`. The existing `Foot`
  class is already IMPL; only the `LineFootConstruction` wrapper (same
  Layoff+LineElement dispatch pattern) is needed. Corrected the tracker.
- **II.10 doesn't need polygon;square at all**: the tracker listed it
  as needing polygon;square, but the actual HTML uses polygon;parallelogram
  (no square). Corrected.
- **"Full Java class conversion" rule codified**: added to `doc/process.md`
  step 2. When porting a Java source file, convert ALL constructor
  signatures in one pass (e.g. the density parameter for star polygons)
  rather than deferring unused variants.
- I.46 was a cleaner verifier than I.47 (which needs `line;foot`).
  Used I.46 for the test page and applet pair instead.

**Next session:**
- High-impact: `line;foot` 2D variant (would unblock I.47 — Pythagoras!
  A 2-line dispatch: Foot+LineElement, same pattern as line;parallel).
- Or: 3-point `circle;radius` variant (unlocks III.24, III.26–III.29).
- Or: `polygon;similar` + `line;similar` (unlocks I.23, I.24, I.26, I.31,
  III.14).

---

## 2026-04-12 — Implemented polygon;quadrilateral

**Completed:**
- Ported `polygon;quadrilateral` as `QuadrilateralPolygonConstruction` in
  `src/elements/Constructions.ts`. **One-line subclass** of
  `PolyConstruction` — identical pattern to `TrianglePolygonConstruction`
  but with a 4-point signature. No new element class; the inherited
  `construct()` body (`new PolygonElement(ps)`) handles everything. Total
  new code: 4 lines.
- One Mocha test: 4-vertex correctness. 27 → **28 passing** (cumulative).
- Test page + applet companion using the full propI43 (15 elements:
  parallelogram ABCD, diagonal slider K, two complement quadrilaterals
  HDFK and EBGK). Exercises `polygon;quadrilateral` twice.
- Book I renderable count: 25 → **26** (+I.43). Book II: 2 → **3**
  (+II.9 — both polygon;parallelogram and polygon;quadrilateral now landed,
  verified against actual propII9 HTML params). I–III total: 58 → **60**.

**Discovered:**
- PropII.9 has two applet variants. The first doesn't use
  `polygon;quadrilateral` at all (it was already renderable from earlier
  ports). The second uses it at e[8]/e[23]/e[24] and is now fully
  renderable.
- This was the fastest construction port yet: ~4 lines of code, no new
  file, step 4 collapsed entirely. The "dispatch trick in Slate.java"
  pattern first seen with `line;parallel` and `polygon;parallelogram`
  reduces even further here to a pure pass-through.

**Next session:**
- Top priority: `polygon;square` (10 I–III uses, I.47 viable verifier,
  `RegularPolygonElement` n=4 mirrors `equilateralTriangle`). Landing it
  would unblock a large cluster of Book II propositions (II.1–II.8, II.11,
  II.14 all need polygon;square).
- High-impact alternative: 3-point `circle;radius` variant (would unblock
  III.24, III.26–III.29 = 5 Book III props).
- Also valuable: `polygon;similar` + `line;similar` (share `Similar.java`
  source, would unblock I.23, I.24, I.26, I.31, III.14).

---

## 2026-04-12 — Implemented point;similar + major tracker NEEDS-line corrections

**Completed:**
- Ported `point;similar` as `src/elements/point/SimilarElement.ts` — a port
  of `Similar.java` (10 lines). Extends `PointElement`; constructor takes
  `(A, B, AP, D, E, F, Q)` and `update()` calls `this.toSimilar(...)` which
  was already ported on `PointElement`. The math computes the point C such
  that △ABC ∼ △DEF by rotating B around A by the angle ∠EDF and scaling by
  |DF|/|DE|.
- `SimilarPointConstruction` wired into `Constructions.ts` with 2D signature
  `[PointElement × 5]`, dispatching to `PointConstructions.similar = 15`.
  Both planes default to `screen`. 3D variant (explicit PlaneElement params)
  deferred per 2D-first policy; no signature-ordering hazard since 2D (5
  params) and 3D (7 params) lengths differ.
- Two Mocha tests: isosceles right triangle (θ=π/2, factor=1, C=(50,300))
  and non-isosceles right triangle (θ=π/2, factor=0.5, C=(50,250)).
  25 → **27 passing** (cumulative).
- Test page + applet companion using defIII11 (similar circle segments):
  two circles with sectors and triangles, where F on the right circle is
  computed via point;similar to be the similar-triangle vertex.
- **Major proposition-tracker corrections**: cross-checked every I–III
  proposition that the tracker listed as needing `point;similar` against
  the actual HTML param lists. Found 5 WRONG NEEDS lines:
  - I.23: uses `polygon;similar` (e[12]), NOT `point;similar`
  - I.24: uses `polygon;similar` (e[11]), NOT `point;similar`
  - I.26: uses `polygon;similar` (e[8]), NOT `point;similar`
  - I.31: uses `line;similar` (e[7]), NOT `point;similar`
  - III.14: uses `polygon;similar` (e[7]), NOT `point;similar`
  All five corrected in this branch. This is the systematic resolution
  of the tracker-drift bug flagged in the line;chord journal entry.
- Also corrected III.26–III.29: these DO use `point;similar` (now landed)
  but are STILL blocked by the 3-point `circle;radius` variant (TBD) at
  their respective e[7] elements.
- Book I renderable count: 24 → **25** (+I.42). Book III: 29 → **31**
  (+III.33, III.34). I–III total: 55 → **58**.

**Discovered:**
- **Clean verifiers DO exist for `point;similar`**: the "no clean verifier"
  claim from the startup menu was wrong. defIII11 and propIII33 both have
  `point;similar` with all preceding elements IMPL. The false claim arose
  because the tracker pointed at I.23/I.31 (which use polygon/line;similar)
  rather than at the actual point;similar propositions.
- **3-point `circle;radius` is the next big blocker**: III.26–III.29 and
  III.24 all use a 3-point `circle;radius` form (`circle at A with radius
  |BC|`) that is TBD. This was first noted in the I.4 correction during
  the sector;arc session (2026-04-11). Landing it would unblock 5 Book III
  propositions at once.
- **Proposition-tracker drift was worse than expected**: 5 of the ~15
  propositions listed as needing `point;similar` didn't actually use it.
  The `Similar.java` class handles point, line, AND polygon variants via
  the same Java source, and the tracker naively assumed they all mapped to
  `point;similar`. Future tracker entries should grep the actual HTML
  `<param>` lines to confirm the `type;construction` pair, not just the
  construction name.

**Next session:**
- Top priority: `polygon;quadrilateral` (11 I–III uses, I.43 sole-TBD
  verifier, trivially easy — extends `PolyConstruction` with a 4-point
  signature). Or `polygon;square` (10 uses, I.47 viable, RegularPolygon
  n=4).
- High-impact alternative: 3-point `circle;radius` variant (would unblock
  III.24, III.26–III.29 = 5 Book III props at once; needs a new signature
  variant on `CircleRadiusCenterConstruction`).
- Also consider `polygon;similar` and `line;similar` which share the same
  `Similar.java` source — porting them would unblock I.23, I.24, I.26,
  I.31, III.14.

---

## 2026-04-11 — Implemented polygon;parallelogram (3rd warm-cache port)

**Completed:**
- Ported `polygon;parallelogram` as `ParallelogramPolygonConstruction` in
  `src/elements/Constructions.ts`. **No new element class** — `Slate.java`
  case 6 dispatches the construction as a `Layoff` trick:
  `Layoff(A, B, C, B, C)` → D = A + (C−B), then
  `new PolygonElement([A, B, C, D])`. Same pattern as `line;parallel` and
  `point;parallelogram`. Total new code: 12 lines of Construction class.
- Two Mocha tests: 4th vertex correctness from propI34 coords
  (C=(50,175), A=(90,50), B=(250,50) → D=(210,175)), vertex extraction
  via `point;vertex;CABD,4`, and opposite-side-length equality. 23 → **25
  passing** (cumulative).
- Three-way harness pair using the full propI34 figure (6 elements:
  3 free vertices + polygon;parallelogram + vertex + diagonal BC).
- Book I renderable count: 23 → **24** (+I.34). I–III total: 54 → **55**.

**Discovered:**
- **Proposition-tracker drift for `point;parallelogram`-era props**:
  I.28, I.30, I.32, I.35, I.36, I.41 all list `point;parallelogram`
  as their sole remaining blocker, but `point;parallelogram` has been
  IMPL since 2026-04-10. These should have been flipped to `[~]` when
  that construction landed. Did not fix in this branch to keep scope
  tight; should be verified against actual HTML params and corrected
  in a future tracker-touching session (same class of tracker-drift
  bug that's recurred several times now).
- **`polygon;quadrilateral` now has a viable verifier**: with
  `polygon;parallelogram` landed, I.43 (which uses both) now has
  `polygon;quadrilateral` as its sole remaining TBD. This makes it a
  clean pick for a near-future session.

**Next session:**
- Top priority: `polygon;square` (10 I–III uses, I.47 viable verifier,
  `RegularPolygonElement` n=4 mirrors `equilateralTriangle`. 2D-first.)
- Alternative: `polygon;quadrilateral` (11 uses, now has I.43 as a
  viable verifier since polygon;parallelogram just landed).
- Deferred: `point;similar` (15 uses, no clean verifier — see
  line;chord journal entry).

---

## 2026-04-11 — Implemented line;parallel (warm-cache session)

**Completed:**
- Ported `line;parallel` as `LineParallelConstruction` in
  `src/elements/Constructions.ts`. **No new element class** — the Java
  applet has no dedicated `ParallelLine.java`; `Slate.java` case 9
  dispatches `line;parallel` as a `Layoff` trick:
  `Layoff(A, B, C, B, C)` → D = A + (C−B), then `new LineElement(A, D)`.
  The TS port mirrors this exactly, creating a `Layoff` intermediate
  (pushed into `elementsForUpdate` so it recomputes each frame) and a
  `LineElement({A: ps[0], B: lo})`. Same pattern as the existing
  `LineExtendConstruction`. Total new code: 12 lines of Construction class
  + 2 lines in the `constructions` array.
- Two Mocha tests: `update()` correctness (D = A + (C−B), direction and
  length equality to BC), recompute after mutating input point C. 21 → **23
  passing** (cumulative from line;chord in the same session).
- Three-way harness pair: the TS test page exercises `line;parallel` three
  times (two horizontal parallels B0B3/C0C3 to A0A3, one diagonal parallel
  RS to PQ) to confirm both trivial and non-trivial direction cases.
  propI22's `original.html` carries the full 32-element proposition for
  context.
- Book I renderable count: 17 → **23** (+I.22, I.27, I.37, I.38, I.39,
  I.40). I–III total: 48 → **54**.

**Discovered:**
- **`ParallelP.java` is a plane construction, not a line construction.**
  The constructions-reference table listed `ParallelP.java` as the Java
  source for `line;parallel`. This is wrong: `ParallelP.java`
  `extends PlaneElement` and implements `plane;parallel` (solid geometry).
  `line;parallel` has no dedicated Java class — it's a dispatch trick
  at `Slate.java:574-577` (case 9) that reuses `Layoff` and wraps in a
  `LineElement`. Both the Java source citation and the param-order
  description in `doc/constructions-reference.md` have been corrected in
  this branch.
- **Same-session warm-cache speedup**: this was the second construction
  ported in a single chat session (the first being `line;chord`). The
  startup protocol ran off cached context: zero file re-reads, two git
  commands, straight to the top-5 menu. Step 2 (read Java source) was
  the only "real" work in the exploration phase, and it immediately
  revealed the `ParallelP.java` mislabeling — catching it before any
  code was committed, not at step 4. Total wall time from "user picks
  construction" to "step 8 committed" was significantly shorter than
  the cold-start line;chord port.
- **Step 4 collapse precedent**: when the Java applet implements a
  construction as an inline dispatch trick in `Slate.java` rather than a
  dedicated class, step 4 of the process (write element class) produces no
  commit. The construction class in step 5 absorbs the entire code
  change. This happened previously with `point;parallelogram` (which also
  reuses Layoff via inline dispatch) and now with `line;parallel`. Future
  sessions hitting the same pattern can collapse steps 4 and 5 without
  ceremony.

**Next session:**
- Top priority: `polygon;parallelogram` (18 I–III uses, sole-TBD verifier
  in I.34, reuses D=A+C−B from `Layoff` — wraps the formula in a
  4-vertex polygon class modeled on `TrianglePolygonConstruction`).
- Alternative: `polygon;square` (10 uses, I.47 viable,
  `RegularPolygonElement` n=4 mirrors `equilateralTriangle`). 2D-first.
- Deferred: `point;similar` (15 uses but no clean Book I–III verifier —
  the tracker's NEEDS lines are inaccurate, see the line;chord journal
  entry's Discovered section for details).

---

## 2026-04-11 — Implemented line;chord + tsconfig noEmit hardening

**Completed:**
- Ported `line;chord` as `src/elements/line/Chord.ts` — a 2D port of
  `geom_applet/source/Chord.java` (23-line file). Extends `LineElement`;
  constructor takes `(D, E, C)` where D/E are the two `PointElement`
  endpoints of the input line (post-`LineElement` expansion) and C is the
  `CircleElement`. Allocates internal `_A`/`_B` PointElements sharing
  `C.AP` as the chord's own endpoints. Ported every method Java overrides
  (`update`, `translate`, `rotate`) per the no-half-done-ports rule. The
  Java→TS adjustment for `C.radius2()` → `this.C.radius2` (TS getter).
- `update()` ports the seven-line Java algorithm verbatim: project center
  to line via `_B.toLine(D, E, false)`, half-chord length `s = √(r² − d²)`,
  derive `_A` from D via `_A.to(D).minus(_B).times(factor).plus(_B)`, then
  `_B := 2·foot − _A` (the reflection trick that gives the second
  intersection). NaN-sentinels both endpoints when `d² > r²` (line misses
  circle). Fallback to E when D coincides with the foot (factor explodes
  past 1e10).
- Wired `ChordConstruction` into `src/elements/Constructions.ts` with the
  post-expansion signature `[PointElement, PointElement, CircleElement]`,
  dispatching to the existing `LineConstructions.chord = 105` enum value.
  Registered next to `BichordConstruction` in the `constructions` array.
- Four Mocha tests in `tests/SlateTest.ts`: `update()` against propI12
  hand-computed expectations (chord.A ≈ (82.540, 180), chord.B ≈
  (237.460, 180), both endpoints on the circle within 0.001), `d² > r²`
  NaN-path (shifted C far above the line), `translate()` isolation
  (chord endpoints shift, inputs untouched), `rotate()` isolation
  (90° CCW around input A). 17/17 → **21/21 passing**.
- Three-way harness pair:
  `view/applet-tests/line/chord/{original,applet}.html` +
  `view/test/line/chord.html`, all using full propI12 (15 elements:
  free A/B/C/D, line AB, circle EFG, chord EG, midpoint H, perpendicular
  CH, chord FF' along CH, F apex). The test page exercises `line;chord`
  twice — once with line AB cutting circle EFG, once with line CH cutting
  the same circle — providing a built-in cross-check.
- **Platform fix** — added `"noEmit": true` to `tsconfig.json`'s
  `compilerOptions` as a hardening measure. The 2026-04-11 sector-arc
  fix had relied on `npm run build` passing `--noEmit` and on
  `.mocharc.json` forcing ts-node, but neither stops VS Code's TypeScript
  language server from running its own background `tsc` and emitting
  sourceMap-enabled `.js` siblings into `src/` and `tests/`. Those
  shadow the `.ts` files via Node's require resolution and silently
  break mocha runs. Discovered the recurrence while running step 6 of
  this port: 56 stale `.js` files dated 19:34 (before this session
  began) blocked all four new chord tests with "Construction not found"
  — ts-node never saw the updated `Constructions.ts` because Node's
  require found `Constructions.js` first. Deleting the 56 files unblocked
  the run; setting `noEmit: true` at the tsconfig level prevents any
  `tsc` invocation (CLI, VS Code TS server, anything that reads
  `tsconfig.json`) from re-emitting them. Webpack's ts-loader is
  unaffected (it emits to `dist/bundle.js` via its own pipeline), and
  ts-node compiles in-memory and is unaffected. This is a strictly
  stronger fix than the 2026-04-11 mitigation, which it supersedes.
- Book I renderable count: 16 → **17** (+I.12). Book III renderable
  count: 18 → **29** (+III.1, III.5, III.6, III.8, III.9, III.10,
  III.12, III.15, III.17, III.36, III.37). I–III total: 36 → **48**.

**Discovered:**
- **Proposition-tracker NEEDS-line bug for `point;similar`**: during the
  startup-protocol top-5 menu computation, I cross-checked the tracker's
  "I.23/I.24/I.26/I.31 NEEDS `point;similar`" lines against the actual
  HTML param lists. propI23.html uses `polygon;similar` (e[12]) and
  propI31.html uses `line;similar` (e[7]) — neither is the `point;similar`
  variant. Same class of error as the I.4 correction in the prior
  2026-04-11 entry: the tracker's NEEDS lines drifted from what the
  actual proposition HTMLs reference. Out of scope for this branch
  (see federated-splashing-adleman.md plan), but worth fixing in the
  next session that touches the proposition tracker, especially since
  it materially affects whether `point;similar` is the right "next port"
  pick (no clean Book I–III verifier exists for it as written).
- **Stale `.js` shadow recurs without tsconfig-level prevention**:
  the previous session's `npm run build` → `tsc --noEmit` change and
  `.mocharc.json` ts-node registration are necessary but not sufficient.
  Anything that reads `tsconfig.json` and runs `tsc` (notably the VS
  Code TS language server) will keep emitting `.js` siblings unless
  the *config itself* says noEmit. Now that the config is hardened, the
  manual cleanup step from the 2026-04-11 sector-arc session shouldn't
  be needed again.
- Chord.java's `factor < 1e10` fallback branch handles the degenerate
  case where the input line endpoint D coincides with the perpendicular
  foot of the circle's center — `D.distance(B) ≈ 0` makes `factor`
  blow up, so the code reaches for E instead. Worth knowing but
  unlikely to bite in practice; left as a verbatim port.
- The `B := 2·foot − A` reflection trick at the end of `update()` is
  the cleanest way to get the second chord endpoint without recomputing
  the foot or running the vector formula twice. Bichord doesn't need
  this trick because it computes both intersections symmetrically by
  rotating around the circle center; chord computes one endpoint and
  reflects.

**Next session:**
- Top priority: `polygon;parallelogram` (18 I–III uses, sole-TBD verifier
  in I.34, reuses the D=A+C−B formula from `point;parallelogram` already
  landed via Layoff). Expected to be a wrap-the-formula-in-a-4-vertex-
  polygon job, not a fresh algorithmic port.
- Alternative: `polygon;square` (10 uses, I.47 viable since e[1]–e[6]
  are all IMPL even though full-prop rendering still needs `line;foot`
  later). Pattern matches `equilateralTriangle`'s `RegularPolygonElement`
  with n=4.
- Alternative: `line;parallel` (9 uses, I.22 clean verifier with all
  preceding elements IMPL). New `ParallelP.java` port to a new
  `src/elements/line/ParallelLine.ts`.
- Deferred / not recommended yet: `point;similar` (15 uses but no clean
  Book I–III verifier — the prop-tracker NEEDS lines are incorrect, see
  Discovered above). Either fix the prop-tracker first, or build a
  standalone test page rather than relying on a verifying proposition.
- Also worth correcting in a future tracker-touching session: the
  I.31 NEEDS line should say `line;similar`, not `point;similar`.

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
