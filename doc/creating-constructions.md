# Creating a New Construction

This guide walks through adding a new construction type to the port —
the four files you'll touch and the contracts your new code must
satisfy. It's the operational counterpart to
[architecture.md](architecture.md), which explains *why* things are
shaped the way they are.

If you're porting a construction from Joyce's Java applet (which is the
default expectation), the canonical reference for what the construction
should *do* is `geom_applet/source/{ConstructionName}.java`, with the
public-facing description at `geom_applet/source/tables.html`.
The corresponding row of [api.md's construction tables](api.md#construction-tables)
shows which `E.{Type}.{name}` slot the construction occupies and what
its argument list looks like *after* `LineElement` expansion.

For the broader workflow (branch off main, commit each step
separately, three-way harness verification), see
[process.md](process.md).

---

## Prerequisites — read these once

| Doc | Why |
|---|---|
| [architecture.md § Element class hierarchy](architecture.md#element-class-hierarchy) | Where your new element class fits. |
| [architecture.md § The `update()` contract](architecture.md#the-update-contract) | Hard rules for `update()`. |
| [architecture.md § Construction dispatch](architecture.md#construction-dispatch-the-constructions-array) | How `validateSignature` matches by type counts. |
| [architecture.md § convertParams](architecture.md#convertparams--the-type-sort-step) | Why `LineElement` names show up in `params` as two endpoint points. |
| [api.md § Construction tables](api.md#construction-tables) | The construction slot you're filling. |

---

## The four files

For a new construction `E.Foo.bar`, you'll touch:

1. **Element class** — `src/elements/{type}/BarElement.ts` (or `Bar.ts`,
   matching the Java filename)
2. **Construction class** — appended to the existing
   `src/elements/{type}/{Type}Constructions.ts`
3. **Mocha test** — appended to the existing `tests/{Type}Test.ts`
4. **Demo page** — `view/test/{type}/{sub}.html`

For three-way harness verification (recommended), also add:

5. **Harness pair** — `view/applet-tests/{type}/{cons}/original.html`
   (verbatim Joyce extract) and `applet.html` (trimmed Java form
   matching the TS demo). See [process.md § Step 7](process.md) for
   the full harness recipe.

---

## Step 1 — Read the Java source

`geom_applet/source/{Name}.java` is the source of truth for
behavior. Note:

- **Constructor signature** → which parents the element holds. These
  become the `Construction.signature`'s type counts.
- **`update()` body** → the math your TS `update()` must mirror. Most
  ports are line-for-line; the `PointElement` helpers (`toCircumcenter`,
  `toLine`, `toCircle`, `toIntersection`, `toInvertPoint`, `toSimilar`,
  `rotate`, `angle`, etc.) already exist and match Java exactly.
- **Dispatch case in `Slate.java`** → which `Construction` class to
  build and what signature it carries. The cases at lines 396-723
  enumerate every construction; line 73-122 has the
  construction-name-to-index lookup tables.

Convert *all* constructors and methods in one pass — see
[process.md § Step 2 "Full Java class conversion rule"](process.md).

---

## Step 2 — The element class

Skeleton at `src/elements/{type}/BarElement.ts`:

```typescript
import {PointElement} from "./PointElement";
import {PlaneElement} from "../plane/PlaneElement";

export class BarElement extends PointElement {   // or LineElement, etc.
    private _A: PointElement;
    private _B: PointElement;
    private _AP: PlaneElement;

    constructor(a: PointElement, b: PointElement, plane: PlaneElement) {
        super();
        this.dimension = 0;     // 0=point, 1=line/circle, 2=polygon/sector/filled
        this._A = a;
        this._B = b;
        this._AP = plane;
    }

    update(): void {
        // Read this._A, this._B, this._AP only.
        // Write this._x, this._y, this._z (for point) or
        //       this._A, this._B (for line, in subclasses)
        //       …etc.
    }
}
```

### Hard rules from the `update()` contract

1. **Idempotent.** Calling `update()` twice in a row must produce the
   same coordinates. No accumulation.
2. **Read only stored parents.** Don't read other slate elements by
   name or look up the slate.
3. **Write only own coords.** Don't push to global lists, don't mutate
   parents.
4. **No side effects.** No DOM access, no `console.log`, no random.

The full contract is in
[architecture.md § The `update()` contract](architecture.md#the-update-contract).

### `dimension` controls draw layers

| `dimension` | Drawn layers |
|---|---|
| `0` (point) | `vertex`, `name` |
| `1` (line, edge of circle) | `edge`, `name` |
| `2` (polygon, sector, filled circle) | `face`, `edge`, `name` |

If your element draws a fill, set `dimension = 2`; if just a stroke,
`1`; if just a dot/label, `0`.

### Container elements: `rotate()` and `translate()` — the preexists footgun

If your new element *holds* sub-points that aren't free `PlaneSlider`s
(e.g. a Bichord holds its own two endpoint `PointElement`s), and you
override `rotate()` / `translate()` to call those methods on the
sub-points, **those sub-points must NOT also be iterated by the outer
loop in `rotateCoordinates` / `translateCoordinates`** or they'll be
moved twice. The mechanism that prevents this is the `preexists` flag
described in
[architecture.md § Drag pipeline](architecture.md#drag-pipeline-movepick--translatecoordinates--rotatecoordinates).
The current heuristic is coarse; if your element's sub-points show
double-movement under rotation around a pivot, see the open
`preexists` item in
[construction-tracker.md § Platform-level TODOs](construction-tracker.md#platform-level-todos).

---

## Step 3 — The Construction class

Appended to `src/elements/{type}/{Type}Constructions.ts`:

```typescript
import {Construction, ConstructionSignature, AllConstructions,
        PointConstructions, GeomElementsForUpdate} from "../Constructions";
import {GeomElement} from "../GeomElement";
import {PlaneElement} from "../plane/PlaneElement";
import {PointElement} from "./PointElement";
import {BarElement} from "./BarElement";

export class BarPointConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.bar;
    signature: ConstructionSignature = {
        points: 2, elements: 0, integers: 0,
    };

    construct(screen: PlaneElement,
              P: PointElement[], E: GeomElement[], N: number[]
             ): [GeomElementsForUpdate, GeomElement] {
        let g = new BarElement(P[0], P[1], screen);
        return [[g], g];
    }
}
```

Then add `new BarPointConstruction()` to the file's exported
`{type}Constructions` array.

### Signature counts are *post*-`convertParams`

`P[]` holds `PointElement`s **after `LineElement` expansion**. If
Joyce's Java HTML param is `"D;point;foo;AB,C"` where `AB` is a line,
`convertParams` puts `[AB._A, AB._B, C]` into `P[]` and your signature
should be `{ points: 3, … }`, not 2.

### Optional planes / 3D variants — multiple Construction classes

If `tables.html` shows a construction with `[plane X]` (optional plane
for the 3D form), register **two** Construction classes — one with
`elements: 0` (2D, uses screen plane) and one with `elements: 1,
elementTypes: [PlaneElement]` (3D, takes the plane explicitly).
Type-counted dispatch handles both because the counts differ. See
[architecture.md § Construction dispatch](architecture.md#construction-dispatch-the-constructions-array)
for the ordering rule (only matters when counts are identical).

### `[elementsForUpdate, newElement]` return contract

`construct()` returns a tuple:

- `newElement`: the element being created (also the value `params: ["…"]`
  references resolve to in later constructions).
- `elementsForUpdate`: the list of elements `Slate` will call
  `update()` on every frame.

If your construction creates **intermediate** elements that aren't the
return value but need per-frame `update()` (e.g. `CircumcenterConstruction`
internally builds a `CircumcircleElement` and returns its center), put
them in `elementsForUpdate`. If they're missing, they never recompute
and the dependent element drifts on stale coords.

---

## Step 4 — Mocha test

Appended to `tests/{Type}Test.ts` (point tests in `PointTest.ts`,
line tests in `LineTest.ts`, …; slate-level integration tests stay in
`SlateTest.ts`):

```typescript
it("should compute foo correctly", () => {
    let data: IConstructionInfo[] = [
        { name: "A", construction: E.Point.free, params: [60, 100] },
        { name: "B", construction: E.Point.free, params: [140, 100] },
        { name: "F", construction: E.Point.foo,  params: ["A", "B"] },
    ];
    let slate = new Slate(createCanvas(400, 300));
    toElements(slate, data);
    slate.elements.forEach(e => e.update());

    let F = slate.lookupElement("F") as PointElement;
    almostEqual(F.x, expectedX, 0.001);
    almostEqual(F.y, expectedY, 0.001);
});
```

Use input coordinates that match a known proposition (e.g. propI12
for `line;chord`) so the expected output can be hand-derived from the
geometry. `tests/shared/testHelpers.ts` exports `toElements`,
`almostEqual`, and friends.

For container elements with `rotate`/`translate` overrides, also add
isolation tests — see e.g. `tests/SectorTest.ts`'s arc tests for the
pattern (`should translate only the arc center, leaving A, M, B
untouched` and `should rotate only the arc center around a pivot`).

---

## Step 5 — Demo page

`view/test/{type}/{sub}.html`. Pattern:

```html
<html>
<head><title>Test View - Foo</title></head>
<body>
<canvas id="canvasId" style="width:400px; height:400px;"></canvas>
<script src="../../../dist/bundle.js"></script>

<!--applet code=Geometry archive=Geometry.zip width=400 height=400>
<param name=background value="35,19,100">
<param name=e[1] value="A;point;free;60,100">
<param name=e[2] value="B;point;free;140,100">
<param name=e[3] value="F;point;foo;A,B">
</applet-->

<script>
let E = geomlib.E;
geomlib.init({
    background: "35,19,100",
    canvasid: "canvasId",
    elements: [
        { name: "A", construction: E.Point.free, params: [60, 100] },
        { name: "B", construction: E.Point.free, params: [140, 100] },
        { name: "F", construction: E.Point.foo,  params: ["A", "B"] },
    ],
});
</script>
</body></html>
```

Preserving the original Java `<applet>` block as an HTML comment is
a project convention — it lets the next person to maintain this page
diff against Joyce's exact param list.

Rebuild the bundle (`npx webpack`) and verify in a browser
(`python3 -m http.server`).

---

## Step 6 — Three-way harness verification (optional but recommended)

For visual A/B/C verification (Java original ↔ Java up-to-construction
↔ TS port), drop a pair of files into `view/applet-tests/{type}/{cons}/`:
`original.html` and `applet.html`. The harness in `run_euclid_applet.sh`
auto-discovers them. See [process.md § Step 7](process.md) for the full
recipe and the `<!-- TS: ... -->` header convention.

---

## Tracker updates

Once the construction is verified, update three trackers:

- `doc/constructions-reference.md` — flip the row from TBD to IMPL,
  link to your test page.
- `doc/proposition-tracker.md` — check off any propositions your new
  construction unblocks (use the proposition-tracker NEEDS lines as
  a starting point; verify against the actual `<param>` list).
- `doc/construction-tracker.md` — flip the per-construction status
  and append any new platform-level findings.
- `doc/journal.md` — append a dated entry following the
  Completed/Discovered/Next-session template.

For the PR body template, see
[process.md § Step 8 "Pull request body template"](process.md).

---

## Common pitfalls

| Symptom | Likely cause |
|---|---|
| `Construction not found for "X" Foo.bar with params P=[…] E=[…] N=[…]` | Signature counts don't match what `convertParams` produced. Check for `LineElement` expansion in your inputs and adjust `signature.points`. |
| Element renders correctly at first but drifts on drag | Intermediate element you created inside `construct()` isn't in `elementsForUpdate`. |
| Element draws on top of itself with growing artifacts under pivot rotation | Container element's `rotate()` is moving sub-points that the outer loop is *also* moving — preexists tracking gap. See the [drag pipeline](architecture.md#drag-pipeline-movepick--translatecoordinates--rotatecoordinates) and the open `preexists` item in [construction-tracker.md](construction-tracker.md#platform-level-todos). |
| 2D test passes, 3D variant matches a 2D-shaped param list and crashes | Two Construction classes for the same `constructionMethod` with overlapping signatures and the wrong order. Type counts should disambiguate; double-check `signature.points/elements/integers`. |
| Free point picks the wrong neighbor | Check `vertexColor` is non-null on the points you want pickable; `closestVisiblePoint` filters by visibility. |
