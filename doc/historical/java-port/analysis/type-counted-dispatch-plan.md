# Type-Counted Dispatch — Matching Java's Parameter Handling

## Background

The Java Geometry Applet (Slate.java) separates construction parameters
by type during parsing, storing them in three separate arrays:
- `P[]` — all PointElements (including LineElement endpoint expansions)
- `E[]` — all other elements (CircleElement, PlaneElement, SphereElement, etc.)
- `N[]` — all integers

Constructions then access parameters by type-specific index (e.g.,
`P[0]`, `E[0]`, `N[0]`) rather than positional index. The order of
parameters in the HTML param string is irrelevant — only the type
counts matter for signature matching.

The TypeScript port originally used positional dispatch: `convertParams`
preserves the order from the param string, and `validateSignature` does
a zip comparison (`params[i]` against `signature[i]`). This means
`E,Vplane,D,B` (point, plane, point, point) fails to match any
positional signature because the plane appears between points.

This document records the analysis and plan for switching to Java's
type-counted dispatch approach.

## Discovery

While converting the icosahedron showcase from `Geometry.html` to a
TypeScript test page using the `parseParam()` string API, we found that
raw Java param strings cannot be pasted directly:

```
dec;polygon;regularPolygon;L,E,10,Vplane   ← Java: integer before plane
Q;point;perpendicular;E,Vplane,D,B         ← Java: plane between points
```

Java handles these because it separates by type: `L,E,10,Vplane` becomes
`P=[L,E]`, `E=[Vplane]`, `N=[10]`, and the construction accesses
`RegularPolygon(P[0], P[1], E[0], N[0])` regardless of original order.

We also discovered a signature bug in `PointPerpendicular5Construction`
(5 entries including an extra PlaneElement, but `construct()` only uses
4 params) — a consequence of the positional system making signatures
error-prone when types are interleaved.

## What the change achieves

1. **Raw Java param strings work directly** — `parseParam()` and Phase 3
   HTML conversions become simple copy-paste operations
2. **~37 fewer construction classes** — variant classes that differ only
   in where a PlaneElement appears in the signature can merge (102 → ~65)
3. **Less fragile signatures** — no more "signature variant ordering rule"
   where longer signatures must be registered before shorter ones
4. **Matches Java exactly** — the dispatch semantics are identical to
   `Slate.java selectDataChoice` (lines 344-393)

## Implementation approach

### Phase 1: Change `convertParams` to sort by type

After resolving string names to elements and expanding LineElements,
sort the resolved params into `{P[], E[], N[]}`. The construction
dispatch receives these three arrays instead of a single `params: any[]`.

### Phase 2: Change `validateSignature` to count types

Instead of zip-comparing positions, count how many Points, Elements,
and Integers are in the params and compare against the signature's
type counts. For Element subtypes (CircleElement vs PlaneElement vs
SphereElement), check `instanceof` on the E[] entries.

### Phase 3: Change `construct()` to receive P/E/N arrays

Each construction's `construct()` accesses params by type-specific index.
This mirrors Java's `createElement(c, m, choice, P[], E[], N[])`.

### Phase 4: Merge variant classes

Classes sharing the same `constructionMethod` enum that differ only in
whether a PlaneElement appears (2D vs 3D) collapse into one class with
an if/else on `E.length`. Five PointPerpendicular variants collapse into
one class with a switch on type counts.

## Java reference: `selectDataChoice` (Slate.java lines 344-393)

```java
int selectDataChoice(String data, String datachoices[][],
    PointElement p[], Element e[], int n[], StringBuffer message) {
  StringTokenizer t = new StringTokenizer(data, ",");
  int pcount=0, ecount=0, ncount=0;
  while (t.hasMoreTokens()) {
    String next = t.nextToken();
    try {
      n[ncount] = Integer.parseInt(next);
      ncount++;
    } catch (NumberFormatException exc) {
      Element elt = lookupElement(next);
      if (elt.inClass("PointElement"))
        p[pcount++] = (PointElement)elt;
      else if (elt.inClass("LineElement")) {
        p[pcount++] = ((LineElement)elt).A;
        p[pcount++] = ((LineElement)elt).B;
      } else
        e[ecount++] = elt;
    }
  }
  // match against datachoices by counting types...
}
```

## Estimated class reduction

| Package | Before | After | Saved |
|---------|--------|-------|-------|
| Point   | 43     | ~28   | ~15   |
| Line    | 21     | ~14   | ~7    |
| Circle  | 6      | ~4    | ~2    |
| Polygon | 18     | ~12   | ~6    |
| Sector  | 4      | ~2    | ~2    |
| Plane   | 5      | ~3    | ~2    |
| Sphere  | 2      | ~1    | ~1    |
| Polyhedron | 4   | 4     | 0     |
| **Total** | **102** | **~68** | **~34** |

## Risk assessment

This is a large refactoring that touches every construction class. Each
class's `construct()` method changes from positional `params[i]` access
to type-sorted `P[i]`/`E[i]`/`N[i]` access. All 116 Mocha tests that
exercise constructions will need updating.

Mitigation: implement one type at a time (point, then line, etc.) with
build+test between each. The type-sorting can be done in `convertParams`
while construct() methods are updated incrementally.

Generated: 2026-04-18
