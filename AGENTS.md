# Euclid — Agent Guide

This is a TypeScript port of David Joyce's Java Geometry Applet (originally Clark University, 1996).
It renders interactive Euclidean geometry constructions on an HTML5 canvas.
The main task is implementing construction types one at a time until all propositions from Books I–XIII can be rendered.

## Read these first

- [doc/process.md](doc/process.md) — the 8-step workflow for each session
- [doc/construction-tracker.md](doc/construction-tracker.md) — which constructions are done, which are TBD, platform-level bugs
- [doc/proposition-tracker.md](doc/proposition-tracker.md) — which Book I–III propositions are renderable today, and what blocks each of the rest
- [doc/analysis/java-typescript-comparison.md](doc/analysis/java-typescript-comparison.md) — full Java↔TypeScript mapping, bugs found, easy wins list
- [doc/constructions-reference.md](doc/constructions-reference.md) — every construction: params, usage count, priority ranking
- [doc/journal.md](doc/journal.md) — dated session log; the top entry is always the canonical "what's next" handoff

## Session startup protocol

**This project's working cadence is one construction per session**, on its own
feature branch, following [doc/process.md](doc/process.md)'s 8-step workflow.
Sessions open with a cue phrase from the user, typically:

> "Read AGENTS.md and let's begin the process again."

When that cue arrives (or any paraphrase of it — "let's do another
construction", "start a new port", etc.), execute **this protocol in order**
and **do not start implementing** until the user has picked a construction:

1. Read [doc/process.md](doc/process.md) — the 8-step workflow may have been
   refined since you last ran it.
2. Read [doc/construction-tracker.md](doc/construction-tracker.md) —
   especially the **Platform-level TODOs** at the top (anything new might
   block the next port) and the per-construction IMPL/TBD status.
3. Read the priority ranking table at the bottom of
   [doc/constructions-reference.md](doc/constructions-reference.md).
4. Read the **top entry only** of [doc/journal.md](doc/journal.md). The most
   recent session's "Next session" block is the canonical handoff; you do
   not need to read older entries unless the top one explicitly points at them.
5. Run `git status` and `git log --oneline master..HEAD` on whatever branch
   the user is on. **If an in-flight `feature/*` branch exists, offer to
   resume it** rather than start a new one; unfinished work from a prior
   session should not be silently abandoned.
6. Present a **top-5 ranked menu** of TBD constructions to the user, formatted
   as a table with these columns:

   | # | Construction | I–III uses | Difficulty | Verifying prop | Notes |
   |---|---|---|---|---|---|

   - **Difficulty** is a judgment call based on whether `PointElement.toX()`
     math already exists, whether there are 2D/3D variants, whether a new
     `*Element.ts` class is needed or the construction reuses an existing
     one, and whether intermediate elements need to be pushed into
     `elementsForUpdate`.
     [doc/analysis/java-typescript-comparison.md](doc/analysis/java-typescript-comparison.md)
     §7 ("Easy wins") is the canonical reference for what infrastructure
     already exists.
   - **Verifying prop** is the simplest Book I–III proposition that exercises
     the construction *and* whose preceding elements are all IMPL — ideally
     one where the target is the ONLY TBD blocker. **Verify this claim
     against the proposition's actual param list**; the proposition-tracker's
     NEEDS lines have been known to miss blockers (see the I.4 correction
     in the 2026-04-11 journal entry). If no clean verifying prop exists for
     Books I–III, say so explicitly so the user can decide whether to
     proceed with a standalone test page instead.
   - **Notes** should flag any infrastructure prerequisites still missing
     (e.g., "needs new math on `PointElement`" vs. "wraps existing
     `toSimilar()`"), and any signature-ordering hazards if a related
     variant already exists.

7. **Stop.** Wait for the user to pick before doing anything else. Do not
   begin Step 1 of `doc/process.md` until the user has explicitly chosen.
   If the user asks for a recommendation, give one **with reasoning** but
   still defer to them for the final call.

### Project phase

As of this writing the project is in **Phase 1: porting remaining Java
constructions to TypeScript.** This phase continues until
[doc/construction-tracker.md](doc/construction-tracker.md) shows every
construction as IMPL. ~24 of ~65 Java constructions were ported before this
protocol was formalized; the remaining ~40 are tracked one-per-session.
**Until Phase 1 completes, the session startup protocol above is the
default onboarding for every fresh session.**

After Phase 1 completes the project transitions to:

- **Phase 2 — proposition HTML conversion.** Convert all 566 proposition
  HTMLs in `view/euclid-html/` from Java `<param>` format to TypeScript
  `geomlib.init()` calls in a new `view/books/` folder. The working unit
  becomes "one proposition" instead of "one construction" but the
  per-step-commit + feature-branch + human-review workflow is unchanged.
- **Phase 3 — retire the Java toolchain.** `run_euclid_applet.sh` and both
  `Containerfile*` files go away; `view/euclid-html/` and `Geometry.zip`
  can be archived or deleted; the `geom_applet/source/*.java` reference
  tree becomes read-only history.

If the startup protocol finds Phase 1 complete (zero TBDs in the tracker),
**flag this to the user first** so they can confirm the transition rather
than quietly changing cadence.

## Key files

| File | Role |
|------|------|
| `src/elements/Constructions.ts` | All construction classes + the `constructions` registration array |
| `src/Slate.ts` | Canvas manager — `convertParams`, `findConstruction`, `createElement`, `update` |
| `src/elements/GeomElement.ts` | Abstract base class for all geometry |
| `src/index.ts` | Public API — `init()`, `E` enum accessor, `Align`, `Color` |
| `tests/SlateTest.ts` | Mocha test suite (patterns to follow) |
| `geom_applet/source/` | **Original Java source files** — primary reference for porting |
| `view/euclid-html/booki/` … `bookxiii/` | Original Java applet HTML (Books I–XIII) |
| `view/test/{type}/{subtype}.html` | TypeScript test/demo pages, one per construction |

## Build, test, view

```sh
npm run build           # compile TypeScript
npm test                # run Mocha tests (tests/SlateTest.ts)
npx webpack             # bundle to dist/bundle.js
python3 -m http.server  # then open http://localhost:PORT/view/test/...
```

## Three-way construction comparison harness

Requires Linux + X11 + Docker + a `python3 -m http.server 8000` running at the
repo root. Both docker images must be built once (firefox runs in its own
container, not on the host, so the user's regular firefox is never disturbed):

```sh
docker build -f Containerfile         -t euclid-applet:latest  .
docker build -f Containerfile.firefox -t euclid-firefox:latest .
```

Then run the harness from the host:

```sh
./run_euclid_applet.sh
```

You pick a `{type};{construction}` entry from the menu and the script pops three
windows side by side:

1. **ORIGINAL appletviewer** — Joyce's full proposition in the Java applet
   (`view/applet-tests/{type}/{construction}/original.html`)
2. **UP-TO appletviewer** — same proposition trimmed to focus on the construction,
   in the Java applet (`view/applet-tests/{type}/{construction}/applet.html`)
3. **TypeScript firefox (chromeless)** — same trimmed view in the TS port
   (`view/test/{type}/{sub}.html` from `localhost:8000`)

Windows 2 and 3 should be visually equivalent at rest; any divergence is a
porting bug in the TS element class. Window 1 carries the full surrounding
proposition for context.

Each per-construction folder under `view/applet-tests/` has exactly two files:

- **`original.html`** — single-applet extraction of the source proposition,
  unmodified except for the `codebase=../../..` path. Window #1 above.
- **`applet.html`** — hand-translation of the TS test page back into Java applet
  `<param>` format. Window #2 above. Carries a `<!-- TS: ... -->` header comment
  pointing at the matching `view/test/...` page so the harness knows what to
  open in firefox; this header is **load-bearing** — don't drop it.

Adding a new construction is just dropping `original.html` and `applet.html`
into the right folder; the script auto-discovers them on the next run, no edits
needed.

If Docker/X11 is unavailable, each proposition under `view/euclid-html/` has a
fallback `.gif` image alongside the HTML file.

## Original HTML param format

```
<param name=e[N] value="Name;type;constructionname;arg1,arg2,...;edgeColor;faceColor;vertexColor;nameColor">
```

- `type` is the element category: `point`, `line`, `circle`, `polygon`, `sector`
- `constructionname` maps to a `Construction` subclass in `Constructions.ts`
- Styling fields after the geometric args (colors) can be ignored when porting
- A numeric `0` color means transparent/hidden

---

## CRITICAL: LineElement expansion

When a `LineElement` name is passed as a parameter (e.g. `"AB"` where AB is a line),
`Slate.convertParams` **expands it into its two endpoint `PointElement`s**.

This means a param like `params: ["AB"]` arrives at `Construction.construct()` as
`[pointA, pointB]` — two elements, not one.

**Construction `signature` arrays must reflect the post-expansion types.**

Example: `LinePerpendicular1Construction` takes a line name in the HTML but declares
`signature = [ct.PointElement, ct.PointElement, ct.PointElement]` (the two line endpoints + the point).

---

## CRITICAL: `[elementsForUpdate, newElement]` return contract

`Construction.construct()` returns `[elementsForUpdate: GeomElement[], newElement: GeomElement]`.

- `newElement` is the element being created
- `elementsForUpdate` is the list of elements `Slate` will call `update()` on every frame

**If your construction creates an intermediate element** (e.g. `CircumcenterConstruction` creates
an internal `CircumcircleElement`), that element MUST appear in `elementsForUpdate`.
If it does not, it will never recompute and the dependent element will use stale data.

---

## CRITICAL: Signature variant ordering

Multiple `Construction` subclasses can share the same `constructionMethod` enum value
with different signatures (e.g. a 2D and 3D variant of the same construction).

`findConstruction()` returns the **first match** in the `constructions` array.

**Register the longer (3D) signature before the shorter (2D) signature.**
Otherwise the 2D variant will greedily match 3D param lists.

---

## How to implement a new construction

### Step 1: Read the Java source

Open `geom_applet/source/{ConstructionName}.java`. Understand:
- What constructor arguments it takes (these become the `Construction.signature`)
- What `update()` computes (this becomes the element class `update()` method)
- What parent element methods it calls (e.g. `toCircumcenter`, `normalize`)

### Step 2: Create the element class

Create `src/elements/{type}/FooElement.ts`:

```typescript
export class FooElement extends PointElement {   // or LineElement, etc.
    private _parentA: PointElement;
    private _parentB: PointElement;

    constructor(a: PointElement, b: PointElement, screen: PlaneElement) {
        super();
        this.dimension = 0;   // 0=point, 1=line, 2=polygon/circle/sector
        this._parentA = a;
        this._parentB = b;
    }

    update() {
        // compute and write this._x, this._y, this._z from parent elements
    }
}
```

### Step 3: Write the Construction class (in `Constructions.ts`)

```typescript
class FooConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.foo;
    signature = [ct.PointElement, ct.PointElement];   // post-expansion types

    construct(screen: PlaneElement, params: any[]): [GeomElement[], GeomElement] {
        const [a, b] = params as [PointElement, PointElement];
        const elem = new FooElement(a, b, screen);
        return [[elem], elem];
    }
}
```

Then add `new FooConstruction()` to the `constructions` array at the bottom of the file.

The enum entry (e.g. `PointConstructions.foo = 14`) already exists for most constructions.
Check the `PointConstructions`, `LineConstructions`, etc. enums near the top of `Constructions.ts`.

### Step 4: Add a Mocha test

In `tests/SlateTest.ts`, follow the pattern of existing tests:

```typescript
it('should compute foo correctly', () => {
    const data: IConstructionInfo[] = [
        { name: "A", construction: E.Point.free, params: [60, 100] },
        { name: "B", construction: E.Point.free, params: [140, 100] },
        { name: "F", construction: E.Point.foo,  params: ["A", "B"] },
    ];
    const slate = new Slate(createCanvas(400, 300));
    toElements(slate, data);
    slate.elements.forEach(e => e.update());
    const F = slate.elements[2] as PointElement;
    assert(almostEqual(F._x, expectedX));
    assert(almostEqual(F._y, expectedY));
});
```

Use coordinate values from the original HTML param positions as test inputs.

### Step 5: Create the test view page

Create `view/test/{super_type}/{sub_type}.html`.

**Pattern** (see `view/test/point/foot.html`): preserve the original Java `<applet>` block
as an HTML comment above the TypeScript `geomlib.init()` block:

```html
<html>
<head><title>Test View - Foo</title></head>
<body>
<canvas id="canvasId" style="width:400px; height:400px;"></canvas>
<script src="../../../../dist/bundle.js" type="text/javascript"></script>

<!--applet code=Geometry ...>
<param name=e[1] value="A;point;free;60,100">
<param name=e[2] value="B;point;free;140,100">
<param name=e[3] value="F;point;foo;A,B">
</applet-->

<script type="text/javascript">
    let E = geomlib.E;
    geomlib.init({
        background: '#ffe9cd',
        canvasid: "canvasId",
        elements: [
            { name: "A", construction: E.Point.free, params: [60, 100] },
            { name: "B", construction: E.Point.free, params: [140, 100] },
            { name: "F", construction: E.Point.foo,  params: ["A", "B"] },
        ]
    });
</script>
</body>
</html>
```

Rebuild and verify: `npx webpack && python3 -m http.server`

---

## Current priority

See [doc/constructions-reference.md](doc/constructions-reference.md)'s priority
ranking table for the full live list, and
[doc/construction-tracker.md](doc/construction-tracker.md) for the
per-construction IMPL/TBD status. The session startup protocol above will
compute the current top-5 ranked menu from these files at session boot —
there is no hardcoded priority list in this document, because a static
list drifts out of sync with the trackers after every port.
