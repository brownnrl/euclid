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
