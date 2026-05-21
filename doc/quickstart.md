# Quick Start

Build your first interactive Euclidean diagram with `geomlib`. By the
end of this page you'll have Euclid's Proposition I.1 — *to construct
an equilateral triangle on a given finite straight line* — rendered
and draggable in a browser.

## What you're going to build

Two free points **A** and **B** with the triangle **ABC** built on
top, where **C** is the apex of an equilateral triangle on side AB.
Drag A or B and the triangle follows; the construction stays correct
because the geometry is recomputed from first principles every frame.

## The skeleton

A `geomlib` page needs three things: a `<canvas>` to draw into, the
compiled bundle, and a single `geomlib.init()` call.

```html
<!DOCTYPE html>
<html>
<head><title>Proposition I.1</title></head>
<body>
<canvas id="propI1" style="width:340px; height:240px;"></canvas>
<script src="dist/bundle.js"></script>
<script>
geomlib.init({
    canvasid: "propI1",
    background: "#ffe9cd",
    elements: [ /* your construction list goes here */ ],
});
</script>
</body>
</html>
```

The CSS size on the canvas (340×240 here) sets both the drawing
surface and the bitmap resolution — `init()` matches one to the
other so the result stays sharp.

## Naming the free points

Every diagram begins with one or more **free points** — the points
the user can drag around. The original Geometry Applet drew red dots
for these; `geomlib` follows the same convention.

```javascript
const E = geomlib.E;
geomlib.init({
    canvasid: "propI1",
    background: "#ffe9cd",
    elements: [
        { name: "A", construction: E.Point.free, params: [125, 130] },
        { name: "B", construction: E.Point.free, params: [215, 130] },
    ],
});
```

`E.Point.free` is the construction; `params: [125, 130]` are the
initial pixel coordinates. Each element gets a `name` so later
constructions can reference it.

Load the page and you'll see two red dots labeled A and B, both
draggable.

## Connecting them

The first move in Proposition I.1 is to draw the segment AB.
That's `E.Line.connect`:

```javascript
{ name: "AB", construction: E.Line.connect, params: ["A", "B"] },
```

`params: ["A", "B"]` references the two free points by name.

## The two circles

Next come "the circle BCD with center A and radius AB" and "the
circle ACE with center B and radius BA." In `geomlib` that's
`E.Circle.radius` — center first, edge point second:

```javascript
{ name: "Ac", construction: E.Circle.radius, params: ["A", "B"] },
{ name: "Bc", construction: E.Circle.radius, params: ["B", "A"] },
```

Drag A and watch both circles re-derive: `Ac`'s center moves with A,
and `Bc`'s radius (which is |B − A|) recomputes.

## Where the circles meet

The two circles cross in two places. The line through both crossing
points is the **bichord**:

```javascript
{ name: "CD", construction: E.Line.bichord, params: ["Bc", "Ac"] },
```

`bichord` is one of `geomlib`'s built-in constructions for finding
common chords of two circles. (`Ac` and `Bc` are the *circles*, not
the centers — `bichord` takes circle elements directly.)

The first endpoint of that line is the apex of our equilateral
triangle — we name it **C**:

```javascript
{ name: "C", construction: E.Point.first, params: ["CD"] },
```

`E.Point.first` returns the first endpoint of an existing line. (The
matching `E.Point.last` returns the other end.)

## The triangle

Finally, the triangle:

```javascript
{ name: "ABC", construction: E.Polygon.triangle, params: ["A", "B", "C"] },
```

## Putting it together

```html
<canvas id="propI1" style="width:340px; height:240px;"></canvas>
<script src="dist/bundle.js"></script>
<script>
const E = geomlib.E;
geomlib.init({
    canvasid: "propI1",
    background: "#ffe9cd",
    title: "Proposition I.1",
    pivot: "C",
    elements: [
        { name: "A",   construction: E.Point.free,    params: [125, 130] },
        { name: "B",   construction: E.Point.free,    params: [215, 130] },
        { name: "AB",  construction: E.Line.connect,  params: ["A", "B"] },
        { name: "Ac",  construction: E.Circle.radius, params: ["A", "B"] },
        { name: "Bc",  construction: E.Circle.radius, params: ["B", "A"] },
        { name: "CD",  construction: E.Line.bichord,  params: ["Bc", "Ac"] },
        { name: "C",   construction: E.Point.first,   params: ["CD"] },
        { name: "ABC", construction: E.Polygon.triangle, params: ["A","B","C"] },
    ],
});
</script>
```

Two new options snuck into that final version:

- **`title: "Proposition I.1"`** — appears as the window title if you
  pop the diagram into its own window.
- **`pivot: "C"`** — sets a rotation/scale center. If a user grabs a
  *non*-draggable point (like the line AB or the circle Ac) and
  drags, the whole diagram rotates and scales around C instead of
  translating. This matches the original Geometry Applet's behavior.

## What you can do now

With the page loaded:

| Action | Result |
|---|---|
| Drag **A** or **B** | The whole construction follows. The triangle stays equilateral. |
| Drag a non-free point (the line, a circle) | The diagram rotates/scales around the pivot **C**. |
| Press **r** or **space** | Reset to the initial configuration. |
| Press **m** | Maximize the canvas to fill the viewport. |
| Press **u** or **return** | Pop the figure into a new browser window. |

The reset/maximize/new-window controls also appear as small icon
buttons at the top-right of the canvas.

## What about the other shorter form?

`geomlib` accepts the original Java `<param>` strings directly,
which is convenient when porting one of the applet's pages:

```javascript
elements: [
    "A;point;free;125,130",
    "B;point;free;215,130",
    "AB;line;connect;A,B",
    "Ac;circle;radius;A,B",
    "Bc;circle;radius;B,A",
    "CD;line;bichord;Bc,Ac",
    "C;point;first;CD",
    "ABC;polygon;triangle;A,B,C",
],
```

Both forms produce the same diagram, and you can mix them in the same
`elements` array. The string form is often handier when copy-pasting
from one of the original `<applet>` tags.

## Where to go from here

- **More constructions.** [api.md](api.md) catalogs every available
  construction across all eight element classes — perpendiculars,
  midpoints, polygons, arcs, planes, spheres, polyhedra. Each entry
  shows its TypeScript form, its Java equivalent, and its
  arguments.
- **Understanding the model.** [architecture.md](architecture.md)
  explains how `geomlib` actually works internally — the slate, the
  construction dispatcher, the drag pipeline.
- **Extending the library.** If a construction you need isn't
  there, [creating-constructions.md](creating-constructions.md)
  walks through adding one.
