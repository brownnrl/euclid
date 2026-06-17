# geomlib — Agent Guide

`geomlib` is a TypeScript library that renders interactive Euclidean
constructions on an HTML5 `<canvas>` — a port of Dr. David E. Joyce's
(Professor Emeritus, Clark University) 1996 Java *Geometry Applet*.
Published to npm as **@brownnrl/geomlib**. The converted *Elements*
site (where the library will be consumed) lives in a separate
content-site repo targeted at
[euclids-elements.org](https://www.euclids-elements.org/).

## Project status

Library is **post-porting, publish-ready**. There is no longer a
"next construction to port" backlog or session-startup ritual.

- All 69 construction methods (with 19 3D variants) are implemented.
- 277 unit tests + 700 snapshot tests pass.
- 0.4.0 shipped cross-highlighting (`emphasized` / `emphasisAmount`
  + `lookupElement`); 0.5.0 shipped the slideshow surface
  (`slides`, `setVisibleNames`, `addAlias`, `resolveJustification`,
  SlateControls overlay); 0.6.0 shipped slide-transition animations
  (`A.{Type}.{name}` registry, `drawProgress`, `SlateAnimator`,
  `slate.animateTo`); 0.7.0 added `A.Sector.sweep` + `A.Polygon.superpose`
  with the `SectorElement` render upgrade; 0.7.1 added `deferDraggables`
  + the `{DISPLAY|element}` caption token override. All additive and
  default-off — every pre-existing render path is bit-for-bit unchanged.
- npm publish pipeline is wired: `prepublishOnly` runs `test:unit`
  + `bundle:prod`. `npm publish --dry-run` previews the tarball.
- MIT-licensed, joint copyright (Joyce 1996–2020, Brown 2019–2026).
  Dr. Joyce's permission text + Quora source recorded in
  [NOTICE.md](NOTICE.md).

Ongoing work is library maintenance: bug fixes, doc edits, occasional
new constructions outside Books I–XIII, new animations as future
propositions need them, snapshot or test refinements, and publish-time
polish. Approach those like normal feature work (branch, PR, review)
— no special cadence.

## Read these first

- [doc/quickstart.md](doc/quickstart.md) — walkthrough building
  Proposition I.1.
- [doc/api.md](doc/api.md) — full public API reference (every
  `E.{Type}.{name}` construction, every `A.{Type}.{name}` animation,
  and every `init()` field).
- [doc/architecture.md](doc/architecture.md) — implementation model:
  slate, dispatch, drag pipeline, the `update()` contract, slideshow,
  and animation orchestration.
- [doc/creating-constructions.md](doc/creating-constructions.md) —
  recipe for adding a new construction (element class, Construction
  class, test, demo page).
- [doc/creating-animations.md](doc/creating-animations.md) — recipe
  for adding a new slide-transition animation.
- [doc/constructions-reference.md](doc/constructions-reference.md) +
  [doc/animations-reference.md](doc/animations-reference.md) —
  catalogs of every `E.*` construction and `A.*` animation.
- [CONTRIBUTING.md](CONTRIBUTING.md) — test/snapshot/bundle commands.
- [NOTICE.md](NOTICE.md) — Dr. Joyce's permission + license posture.

The porting-era trackers and the dated session journal live under
[doc/historical/](doc/historical/) — frozen, read-only history.

## Repo layout

```
src/                      TypeScript library source (54 files)
  Constructions.ts        Enums, abstract Construction base, registration array
  elements/{type}/        Per-type element classes + Constructions
  Slate.ts                Canvas manager, dispatch, drag pipeline
  SlateControls.ts        UI overlay (reset/maximize/present)
  Colors.ts               parseColor(), brighter/darker/HSB/hex
  index.ts                Public API — init(), parseParam(), E, Align, Color

tests/                    Mocha suites
  {Type}Test.ts           Per-element unit tests (137 cases total)
  SnapshotTest.ts         Auto-discovers HTML scenes, renders, diffs PNGs
  HtmlParamParser.ts      Parses <applet> blocks from HTML test fixtures

view/                     HTML test fixtures + demos
  euclid-html/            Original Geometry Applet HTML, Books I–XIII (snapshot input)
  compass_geometry/       Compass-series scenes (snapshot input)
  round_geometry/         Spherical-geometry scenes (snapshot input)
  test/{type}/*.html      Per-construction TS demo pages

geom_applet/              Java reference (read-only)
  source/                 *.java + Geometry.html + tables.html
  Geometry.zip            1998 deployable archive (preserved)

doc/                      Current user-facing docs
doc/historical/           Porting-era trackers + journal (read-only)
dist/                     Webpack output (gitignored, shipped to npm)
```

## Build, test, bundle

```sh
npm install              # one-time
npm run build            # tsc --noEmit (typecheck only)
npm run test:unit        # 277 unit tests (~110 ms)
npm run test:snapshot    # 700 snapshot tests; auto-creates goldens on first run
npm test                 # both
npm run bundle           # dev-mode bundle to dist/bundle.js
npm run bundle:prod      # production (minified) bundle, ~125 kB
npm publish --dry-run    # preview tarball without publishing
```

Goldens under `tests/snapshots/**/*.png` are gitignored — each
contributor regenerates locally. `npm run snapshots:clean` wipes
them; the next `npm test` re-creates from scratch.

## CRITICAL contracts (when touching element code)

### LineElement expansion

When a `LineElement` name appears in `params`, `Slate.convertParams`
**expands it to its two endpoint `PointElement`s**. So
`params: ["AB"]` arrives at `construct()` as `[pointA, pointB]` —
two elements, not one. Signature counts (`{ points, elements,
integers }`) must reflect the post-expansion form.

### `[dependencyElements, newElement]` return contract

`Construction.construct()` returns
`[dependencyElements: GeomElement[], newElement: GeomElement]`.
Any intermediate element your construction creates (e.g.
`CircumcenterConstruction` builds an internal `CircumcircleElement`)
MUST appear in `dependencyElements` — otherwise it never gets
added to the slate's element list, never recomputes, and dependents
drift on stale data. (Historically this first return value was called
`elementsForUpdate` and maintained as a separate array on the slate;
since #45 the slate iterates `_elements` directly.)

### Signature variant ordering

Multiple Construction subclasses can share the same
`constructionMethod` enum value. `findConstruction()` returns the
**first match**. When two variants have identical `(points,
elements, integers)` counts but differ in `elementTypes`, register
the more specific one first. (Distinct counts — typical of 2D vs.
3D — match unambiguously; order is irrelevant.)

### `preexists` and the drag pipeline

Container elements (Bichord, Chord, Perpendicular, Circumcircle,
RegularPolygon, Application, InvertCircle, SphereIntersection) own
sub-points and override `rotate()`/`translate()` to move them
directly. Those owned sub-points must NOT also be iterated by the
outer drag-pipeline loop — the `preexists` flag suppresses the
double-move. Full rationale in
[doc/architecture.md § Drag pipeline](doc/architecture.md#drag-pipeline-movepick--translatecoordinates--rotatecoordinates).

## Adding a new construction

See [doc/creating-constructions.md](doc/creating-constructions.md)
for the full recipe — the 4 files (element class, Construction
class, Mocha test, demo page), the contracts above, and the common
pitfalls.

The enum entries for every construction documented in the original
applet's `tables.html` already exist in `src/elements/Constructions.ts`.

## Original HTML param format

Many test fixtures (`view/euclid-html/`, `view/compass_geometry/`,
`view/round_geometry/`) still carry the original Java applet's
`<param>` strings:

```
<param name=e[N] value="Name;type;constructionname;arg1,arg2,...;nameColor;vertexColor;edgeColor;faceColor">
```

- `type`: `point`, `line`, `circle`, `polygon`, `sector`, `plane`,
  `sphere`, `polyhedron`.
- `constructionname` maps to a `Construction` subclass.
- Color fields are optional; numeric `0` means transparent/skip.
- `HtmlParamParser.ts` reads this format directly; new test fixtures
  can reuse it via `parseParam()` in the public API.

## What this repo doesn't contain

- The converted *Elements* proposition pages (Dr. Joyce's narrative
  text + TS-canvas init calls) live in a separate content-site repo
  targeted at euclids-elements.org. Phase 3 (HTML conversion) was
  completed there.
- The Java↔TypeScript visual comparison harness (docker, applet
  viewer, X11) was retired. The snapshot test suite is the
  ongoing regression mechanism.
