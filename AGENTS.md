# Euclid — Agent Guide

This is a TypeScript port of David Joyce's Java Geometry Applet (originally Clark University, 1996).
It renders interactive Euclidean geometry constructions on an HTML5 canvas.
The main task is implementing construction types one at a time until all propositions from Books I–XIII can be rendered.

## Read these first

- [doc/process.md](doc/process.md) — the step-by-step workflow for each session
- [doc/construction-tracker.md](doc/construction-tracker.md) — which constructions are done, which are TBD, platform-level bugs
- [doc/analysis/java-typescript-comparison.md](doc/analysis/java-typescript-comparison.md) — full Java↔TypeScript mapping, bugs found, easy wins list
- [doc/constructions-reference.md](doc/constructions-reference.md) — every construction: params, usage count, priority ranking

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

## Current priority (Books I–III)

See [doc/constructions-reference.md](doc/constructions-reference.md) for the full ranked list.
Top unimplemented constructions by proposition unlock count:

| Priority | Construction | Uses | Example proposition |
|----------|-------------|------|---------------------|
| 1 | `point;vertex` | 59 | I.2, I.9, I.33, I.47 |
| 2 | `point;parallelogram` | 48 | I.28, I.33, I.35, II.1 |
| 3 | `sector;arc` | 20 | I.4, I.16, II.5, III.2 |
| 4 | `line;chord` | 17 | I.12, III.1, III.5 |
| 5 | `polygon;quadrilateral` | 11 | I.43, II.2, II.4 |
| 6 | `polygon;equilateralTriangle` | 6 | I.2, I.9, I.10, I.11 |
| 7 | `line;parallel` | 9 | I.22, I.27, I.37–I.40 |
| 8 | `polygon;square` | 10 | I.46, I.47, II.2–II.11 |
| 9 | `point;similar` | 15 | I.23, I.24, I.26, III.14 |
| 10 | `polygon;parallelogram` | 18 | I.34, II.1, II.2 |
