# geomlib

A TypeScript port of Dr. David E. Joyce's *Geometry Applet* (Clark
University, 1996, Java version 2.2). `geomlib` renders interactive
Euclidean geometry diagrams on an HTML5 `<canvas>`: drag a point, and
every construction that depends on it follows. The original Java applet
illustrated Euclid's *Elements*; this port does the same job in a
modern browser, no JVM required.

**See it in action:** [**euclids-elements.org**](https://www.euclids-elements.org/)
republishes Dr. Joyce's online edition of *Euclid's Elements* with
every diagram powered by this library — Books I–XIII plus compass /
spherical tutorials. Source lives at
[brownnrl/euclids-elements.org](https://github.com/brownnrl/euclids-elements.org).

The library exposes eight element classes — *point*, *line*, *circle*,
*polygon*, *sector*, *plane*, *sphere*, *polyhedron* — and the
~70 construction methods documented in the original applet's
[`tables.html`](geom_applet/source/tables.html). All 465 propositions
across Books I–XIII of the *Elements* are renderable.

On top of the construction layer the library also ships an optional
slideshow surface — per-element visibility, declarative `slides[]`,
a caption / justification overlay — and a slide-transition animation
registry where a circle can sweep in like a compass, a line can trace
like a straightedge, and a polygon can outline then fade in its fill.
Both layers are additive and default-off, so diagrams that don't opt
in render exactly as they always have.

## Installation

### Via CDN (no build step)

Include the bundle from unpkg or jsDelivr:

```html
<script src="https://unpkg.com/@brownnrl/geomlib@0.1.0/dist/bundle.js"></script>
<!-- or -->
<script src="https://cdn.jsdelivr.net/npm/@brownnrl/geomlib@0.1.0/dist/bundle.js"></script>
```

After loading, the library is available as `window.geomlib`. Pin the
version explicitly (as above) for stability; `@latest` works but moves
under your feet on every publish.

### Via npm

```sh
npm install @brownnrl/geomlib
```

Then bundle the published `dist/bundle.js` with your application, or
load it from `node_modules/@brownnrl/geomlib/dist/bundle.js` directly.

## Quick start

We'll construct Proposition I.1 — *an equilateral triangle on a given
finite straight line*. A `<canvas>` for the figure, the bundle, and a
`geomlib.init({...})` call with the ordered list of constructions:

```html
<canvas id="propI1" style="width:340px; height:240px;"></canvas>
<script src="https://unpkg.com/@brownnrl/geomlib@0.1.0/dist/bundle.js"></script>
<script>
const E = geomlib.E;
geomlib.init({
    background: "#ffe9cd",
    title: "Proposition I.1",
    canvasid: "propI1",
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

Drag **A** or **B** and the triangle ABC follows. Press `r` (or the
spacebar) to reset the diagram and `m` to maximize the canvas. For a
step-by-step walkthrough of this example, see
[doc/quickstart.md](doc/quickstart.md).

## Documentation

| Doc | Audience |
|---|---|
| [doc/quickstart.md](doc/quickstart.md) | First-time user. Builds Proposition I.1 line by line with prose explanations. |
| [doc/api.md](doc/api.md) | API reference. Every `init()` field, every `E.{Type}.{name}` construction, every `A.{Type}.{name}` animation, every accepted color value. |
| [doc/architecture.md](doc/architecture.md) | Implementation model. The slate, the construction dispatch, the drag pipeline, the slideshow surface, the animation orchestrator. |
| [doc/creating-constructions.md](doc/creating-constructions.md) | Adding a new construction type to the library. |
| [doc/creating-animations.md](doc/creating-animations.md) | Adding a new slide-transition animation. |
| [doc/constructions-reference.md](doc/constructions-reference.md) | Per-construction priority and usage frequency across Books I–III. |
| [doc/animations-reference.md](doc/animations-reference.md) | Catalog of every `A.*` animation — defaults, args, visual behaviour. |
| [doc/historical/](doc/historical/) | Project journal and the Java-to-TypeScript porting record. |

## Build, test, develop

```sh
npm install              # install dependencies (once)
npm run build            # compile TypeScript (no emit; type-check only)
npm test                 # run the full Mocha suite (unit + snapshot)
npm run test:unit        # unit tests only
npm run test:snapshot    # 700 rendered-pixel snapshot tests
npm run coverage         # tests + c8 code coverage report
npm run bundle           # webpack dev-mode bundle to dist/bundle.js
npm run bundle:prod      # webpack production (minified) bundle
python3 -m http.server   # serve view/test/* pages in a browser
```

`npm publish` runs `test:unit` + `bundle:prod` via `prepublishOnly`,
so the tarball always contains a fresh production-built bundle. Run
`npm publish --dry-run` to preview what would ship without publishing.

## Origin

Built atop Dr. David E. Joyce's (Professor Emeritus, Clark
University) [*Geometry Applet
v2.2*](http://aleph0.clarku.edu/~djoyce/java/Geometry/Geometry.html),
Java, 1996–1997. The original *Elements* applet pages at
[aleph0.clarku.edu](http://aleph0.clarku.edu/~djoyce/elements/elements.html)
have been mirrored at [euclids-elements.org](https://www.euclids-elements.org/),
with the static-image fallbacks replaced by live TypeScript
animations powered by `geomlib`.
