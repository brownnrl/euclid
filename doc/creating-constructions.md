# Creating a New Construction

A guide for adding a new construction type to `geomlib`. The four files
you'll touch and the contracts your new code must satisfy.

This is the operational counterpart to [architecture.md](architecture.md),
which explains *why* the library is shaped the way it is. The catalog of
existing constructions, with the exact arguments each one accepts, lives
in [api.md](api.md#construction-tables).

---

## Prerequisites

Skim these once before you start:

| Doc | Why |
|---|---|
| [architecture.md § Element class hierarchy](architecture.md#element-class-hierarchy) | Where your new element class fits. |
| [architecture.md § The `update()` contract](architecture.md#the-update-contract) | Hard rules every `update()` must follow. |
| [architecture.md § Construction dispatch](architecture.md#construction-dispatch-the-constructions-array) | How `validateSignature` matches by type counts. |
| [architecture.md § convertParams](architecture.md#convertparams--the-type-sort-step) | Why a `LineElement` name in `params` arrives as two `PointElement`s. |
| [api.md § Construction tables](api.md#construction-tables) | The `E.{Type}.{name}` slot you're filling. |

---

## The four files

For a new construction `E.Foo.bar`, you'll touch:

1. **Element class** — `src/elements/{type}/BarElement.ts`
2. **Construction class** — appended to
   `src/elements/{type}/{Type}Constructions.ts`
3. **Mocha test** — appended to `tests/{Type}Test.ts`
4. **Demo page** — `view/test/{type}/{sub}.html`

Optional fifth: a three-way comparison harness pair under
`view/applet-tests/{type}/{cons}/` if you want side-by-side visual
verification against a reference rendering.

---

## Step 1 — The element class

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
        // Read this._A, this._B, this._AP.
        // Write this._x, this._y, this._z (for point) or
        //       this._A, this._B (for line subclasses)
        // The math goes here.
    }
}
```

### Hard rules from the `update()` contract

1. **Idempotent.** Calling `update()` twice in a row must produce the
   same coordinates. No accumulation, no random.
2. **Read only stored parents.** Don't reach back to the slate or look
   up other elements by name.
3. **Write only own coords.** Don't push to global lists, don't mutate
   parents.
4. **No side effects.** No DOM access, no `console.log`.

Full contract:
[architecture.md § The `update()` contract](architecture.md#the-update-contract).

### `dimension` controls draw layers

| `dimension` | Layers drawn |
|---|---|
| `0` (point) | `vertex`, `name` |
| `1` (line, circle edge) | `edge`, `name` |
| `2` (polygon, sector, filled circle) | `face`, `edge`, `name` |

If your element draws a fill, set `dimension = 2`; just a stroke, `1`;
just a dot/label, `0`.

### Container elements: `rotate()` and `translate()`

If your new element *holds* sub-points (e.g. a `Bichord` owns its own
two endpoint `PointElement`s) and you override `rotate()` / `translate()`
to call those methods on the sub-points, those sub-points must NOT also
be iterated by the outer loop in `Slate.rotateCoordinates` /
`translateCoordinates` or they'll be moved twice. The `preexists` flag
exists to suppress that double-movement; see
[architecture.md § Drag pipeline](architecture.md#drag-pipeline-movepick--translatecoordinates--rotatecoordinates).

---

## Step 2 — The Construction class

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

### `ConstructionSignature` — match by type counts

```typescript
interface ConstructionSignature {
    points: number;
    elements: number;
    integers: number;
    elementTypes?: Function[];   // per-slot subtype check on E[]
}
```

`Slate.convertParams` sorts the raw `params` into `SortedParams { P, E, N }`:
- `P[]` holds `PointElement`s. **`LineElement` names auto-expand to
  their two endpoint `PointElement`s** — both go into `P[]`.
- `E[]` holds non-point elements (Circle, Plane, Sphere, Polygon,
  Polyhedron).
- `N[]` holds numbers.

So `signature.points: 2, elements: 0` matches anything that, after
expansion, produces exactly two points and no other elements. Order
within each array doesn't matter for matching — `validateSignature`
compares counts, not positions.

### `elementTypes` — narrowing the `E[]` slots

When two constructions share the same enum value AND identical
`(points, elements, integers)` counts but accept different element
*kinds* (e.g. `point;center` accepts either a `Circle` or a `Sphere`),
list the per-slot constructor in `elementTypes`:

```typescript
class CircleCenterConstruction extends Construction {
    signature = { points: 0, elements: 1, integers: 0,
                  elementTypes: [CircleElement] };
    // ...
}

class SphereCenterConstruction extends Construction {
    signature = { points: 0, elements: 1, integers: 0,
                  elementTypes: [SphereElement] };
    // ...
}
```

`validateSignature` does `sp.E[i] instanceof sig.elementTypes[i]` for
each slot. This is the only situation in which **insertion order in
the per-type `Constructions` array matters** — when counts collide,
the first match wins, so the more specific (subtype-narrowed)
signature must come first.

### 2D vs. 3D variants

Many constructions accept an optional plane (`[plane X]` in the API
table) for the 3D form. Register **two** Construction classes:

```typescript
// 2D: uses the screen plane implicitly
class FooPointConstruction extends Construction {
    signature = { points: 2, elements: 0, integers: 0 };
    construct(screen, P, E, N) { return [...new FooElement(P[0], P[1], screen)]; }
}

// 3D: takes the plane as an explicit element argument
class FooPointConstruction3d extends Construction {
    signature = { points: 2, elements: 1, integers: 0,
                  elementTypes: [PlaneElement] };
    construct(screen, P, E, N) { return [...new FooElement(P[0], P[1], E[0])]; }
}
```

The two have different `elements` counts, so type-counted dispatch
disambiguates them automatically. Order doesn't matter here.

### Return contract: `[elementsForUpdate, newElement]`

`construct()` returns a tuple:

- `newElement` — the element being created. Later constructions that
  reference this element by name resolve to this object.
- `elementsForUpdate` — every element the slate should call `update()`
  on each frame.

If your construction creates **intermediate** elements that aren't the
returned value but still need per-frame `update()` (e.g. a wrapper
construction that builds an inner element and projects from it), put
them in `elementsForUpdate`. Missing one means it never recomputes,
and any element that depends on it drifts on stale coordinates.

---

## Step 3 — The Mocha test

Appended to `tests/{Type}Test.ts`. Tests are split per element type
— point tests in `PointTest.ts`, line tests in `LineTest.ts`, etc.;
slate-level integration tests stay in `SlateTest.ts`.

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

`tests/shared/testHelpers.ts` exports `toElements`, `almostEqual`, and
related utilities.

For container elements with `rotate`/`translate` overrides, also add
isolation tests — e.g. "should rotate around a pivot without
double-moving owned sub-points." See `tests/SectorTest.ts`'s arc tests
for the pattern.

---

## Step 4 — The demo page

`view/test/{type}/{sub}.html`:

```html
<html>
<head><title>Test View - Foo</title></head>
<body>
<canvas id="canvasId" style="width:400px; height:400px;"></canvas>
<script src="../../../dist/bundle.js"></script>
<script>
let E = geomlib.E;
geomlib.init({
    background: "#ffe9cd",
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

Rebuild the bundle and load in a browser to verify visually:

```sh
npx webpack
python3 -m http.server
# open http://localhost:8000/view/test/{type}/{sub}.html
```

---

## Common pitfalls

| Symptom | Likely cause |
|---|---|
| `Construction not found for "X" Foo.bar with params P=[…] E=[…] N=[…]` | Signature counts don't match what `convertParams` produced. Most often: a `LineElement` name in `params` expanded into two points and your `signature.points` is one too small. |
| Element renders correctly initially but drifts on drag | An intermediate element constructed inside `construct()` isn't in the returned `elementsForUpdate`. The element exists on the slate but never recomputes. |
| Element grows / scales under pivot rotation | Container element's `rotate()` is moving sub-points that the outer rotation loop is *also* moving — the preexists flag isn't suppressing the double-movement. See [architecture.md § Drag pipeline](architecture.md#drag-pipeline-movepick--translatecoordinates--rotatecoordinates). |
| 2D test passes; 3D variant matches the wrong dispatcher | Two Construction classes with the same `constructionMethod` and overlapping signatures. Type counts (`points`, `elements`, `integers`) should differ between 2D and 3D variants. If they truly are identical, narrow with `elementTypes` and put the more specific one first. |
| Free point can't be picked / dragged | `closestVisiblePoint` filters by non-null `vertexColor`. If the point's `vertexColor` is `null` (or `0`), it isn't pickable. |

---

## See also

- [api.md](api.md) — full catalog of existing constructions, every
  `E.{Type}.{name}` slot and its argument list.
- [architecture.md](architecture.md) — the implementation model behind
  this guide.
- [historical/java-port/creating-constructions.md](historical/java-port/creating-constructions.md)
  — the Java-port-era version of this guide, for anyone curious about
  how new constructions were ported from the original Java applet.
