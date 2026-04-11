# Porting Process

Each session works through one construction type at a time: read the Java source,
port it to TypeScript, create a test view page, and optionally verify it against
the Java applet. Repeat until all constructions are done, then convert all books.

---

## Step 1 — Choose the next construction

Open [constructions-reference.md](constructions-reference.md) and find the highest-priority
TBD construction (sorted by Books I–III usage count at the bottom of that file).

Also check [proposition-tracker.md](proposition-tracker.md) to see which propositions
will become renderable once the construction is done — this gives useful test cases.

---

## Step 2 — Read the Java source

Open `geom_applet/source/{ConstructionName}.java`.

The Java class name maps directly to the construction name in the HTML param format.
For example, `parallelogram` construction → `Parallelogram.java`... but note that
the Java applet's construction-to-class mapping is in `Slate.java`. Check there if
the `.java` filename is unclear.

Things to note:
- Constructor arguments → these become the TypeScript `Construction.signature`
- `update()` body → this becomes the TypeScript element class `update()` method
- Parent element method calls (e.g. `toCircumcenter`, `normalize`, `unitVector`) →
  check if these exist on `PointElement` in `src/elements/point/PointElement.ts`

---

## Step 3 — Find an example in `view/euclid-html`

Search any book (`booki/` through `bookxiii/`) for a proposition using the construction:

```sh
grep -rl ";constructionname;" view/euclid-html/
```

Pick a simple proposition with few elements as your test case.

Parse the `<param name=e[N] value="...">` lines. The format is:

```
"Name;type;constructionname;arg1,arg2,...;edgeColor;faceColor;vertexColor;nameColor"
```

The styling fields (after the geometric args) vary in count and can be ignored.
Numeric `0` means transparent/hidden; `random` means a random color.

> **LineElement expansion**: If a param arg is the name of a `LineElement`, it expands
> to its two endpoint `PointElement`s in `Slate.convertParams`. The construction
> signature must match the post-expansion types.

---

## Step 4 — View in appletviewer (optional but recommended)

Run the Docker Java 8 container to see the original behavior:

```sh
./run-euclid-applet.sh
# inside the container:
cd /usr/src/app/view/euclid-html/booki
appletviewer -J-Djava.security.manager \
  -J-Djava.security.policy=/usr/src/app/view/permissive.policy \
  propI1.html
```

Drag the free points and observe which elements move and how.
This is the ground truth for the construction's behavior.

If Docker/X11 is unavailable, fall back to the `.gif` static image alongside the HTML.

Goal: verify every ported construction against appletviewer at least once to "close out" the port.

---

## Step 5 — Implement the element class

Create `src/elements/{type}/FooElement.ts`.

```typescript
export class FooElement extends PointElement {
    private _a: PointElement;
    private _b: PointElement;

    constructor(a: PointElement, b: PointElement, screen: PlaneElement) {
        super();
        this.dimension = 0;  // 0=point, 1=line, 2=polygon/circle/sector
        this._a = a;
        this._b = b;
    }

    update() {
        // port the Java update() logic here
        // write this._x, this._y, this._z (for points)
        // or this._A, this._B (for lines — these are PointElements)
    }
}
```

`dimension` values:
- `0` — point (only vertex is drawn)
- `1` — line/circle (edge is drawn, no face)
- `2` — polygon/sector/filled circle (face + edge drawn)

---

## Step 6 — Write the Construction class

In `src/elements/Constructions.ts`, add a new `Construction` subclass:

```typescript
class FooConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.foo;
    signature = [ct.PointElement, ct.PointElement];  // post-expansion types

    construct(screen: PlaneElement, params: any[]): [GeomElement[], GeomElement] {
        const [a, b] = params as [PointElement, PointElement];
        const elem = new FooElement(a, b, screen);
        return [[elem], elem];   // [elementsForUpdate, newElement]
    }
}
```

Then add `new FooConstruction()` to the `constructions` array at the bottom of the file.

**If creating intermediate elements** (e.g. an internal circle used to compute a point),
push them into `elementsForUpdate` so Slate calls `update()` on them every frame.

**Signature variant ordering**: if you have both 2D and 3D variants, register the 3D
(longer signature) one first in the array — the 2D variant is a prefix match and
would otherwise greedily consume 3D param lists.

---

## Step 7 — Write a Mocha test

In `tests/SlateTest.ts`, add a test following the existing patterns.

Use the coordinate values from the original HTML params as inputs. Calculate the
expected output by hand or by reference to the Java computation:

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
    assert(almostEqual(F._x, 100));
    assert(almostEqual(F._y, 100));
});
```

Run with `npm test`. If time is short and the math is complex, it's acceptable to
skip the unit test and rely on visual verification in Step 8 — note this in the journal.

---

## Step 8 — Create the test view page

Create `view/test/{super_type}/{sub_type}.html`.

The naming convention:
- `{super_type}` = element category: `point`, `line`, `circle`, `poly`, `sector`, `plane`, `sphere`
- `{sub_type}` = construction name: `parallelogram`, `chord`, `arc`, etc.

**Always preserve the original Java `<applet>` block as an HTML comment** above the
TypeScript block. This keeps the original param format visible for reference:

```html
<html>
<head><title>Test View - Foo</title></head>
<body>
<canvas id="canvasId" style="width:400px; height:400px;"></canvas>
<script src="../../../../dist/bundle.js" type="text/javascript"></script>

<!--applet code=Geometry codebase="../../Geometry" archive=Geometry.zip width=340 height=260>
<img src="../booki/propI1.gif" alt="java applet or image">
<param name=background value="35,19,100">
<param name=e[1] value="A;point;free;60,100">
<param name=e[2] value="B;point;free;140,100">
<param name=e[3] value="F;point;foo;A,B">
</applet-->

<script type="text/javascript">
    let E = geomlib.E;
    let Align = geomlib.Align;
    geomlib.init({
        background: '#ffe9cd',
        title: "Foo construction",
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

Rebuild and verify visually:

```sh
npx webpack
python3 -m http.server
# open http://localhost:PORT/view/test/point/foo.html
```

Compare the diagram against appletviewer or the `.gif` image. Drag the free points
and verify that dependent elements update correctly.

---

## Step 9 — Update the tracker and journal

1. Mark the construction as **IMPL** in [constructions-reference.md](constructions-reference.md)
2. Check off any newly-renderable propositions in [proposition-tracker.md](proposition-tracker.md)
3. Append a dated entry to [journal.md](journal.md)

---

## Long-term goal

Once all construction types are implemented:
- Convert all 566 HTML files in `view/euclid-html/` (Books I–XIII) from Java `<param>` format
  to TypeScript `geomlib.init()` calls in a new `view/books/` folder
- Each book becomes a browsable set of interactive TypeScript diagrams
- The Java applet and Docker environment can then be retired
