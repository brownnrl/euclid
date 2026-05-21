# geom_applet — preserved Java reference

This directory holds the original Java materials this TypeScript port
was built against. Nothing here is maintained as part of the live
library; everything is preserved verbatim for reference and
historical fidelity.

## Contents

| Path | What it is |
|---|---|
| [`Geometry.zip`](Geometry.zip) | David E. Joyce's original deployable applet archive. The file timestamps inside (1998-02-17 through 2000-10-31) are the actual ship dates of the bytecode — this is what visitors to Joyce's *Elements* pages loaded into their browser's Java plugin from 1998 until applets were retired. 104 KB. Unzip it to recover the historical `.class` files alongside their 1998 timestamps. |
| [`source/`](source/) | The Java source files Joyce wrote: 44 `.java` files plus `Geometry.html` (the applet's documentation page) and `tables.html` (the construction-method reference). The TypeScript port in [`../src/`](../src/) reimplements these classes. |
| [`compass_geometry/`](compass_geometry/) | Clean-mirror HTML of Joyce's compass-and-straightedge lecture series. Snapshot test fixtures — parsed by [`../tests/HtmlParamParser.ts`](../tests/HtmlParamParser.ts) to drive visual regression tests against this port. |
| [`round_geometry/`](round_geometry/) | Same role as `compass_geometry/`, for the spherical/round-geometry lecture series. |

## Why keep this?

Three reasons:

1. **Historical record.** Joyce's applet was originally hosted at Clark
   University from 1996 onward; he lost write-access to those files
   when he retired (his own words). The deployable
   archive isn't reliably recoverable from any other source if the
   Clark URL goes offline.
2. **Reproducibility audit.** A reader who suspects the TS port drifts
   from the original's behavior can compare against the Java sources
   here. Without this directory, that audit is much harder.
3. **Test fixtures.** The `compass_geometry/` and `round_geometry/`
   HTMLs drive part of the snapshot test suite. Removing them would
   silently drop visual-regression coverage for those construction
   categories.

## License and permission

The materials in this directory are © David E. Joyce, included by
his permission. See the top-level [NOTICE.md](../NOTICE.md) for the
exact text of his permission and the link to his Quora answer
granting it.

The TypeScript port that *uses* these materials (everything under
[`../src/`](../src/)) is MIT-licensed under joint copyright; see
[../LICENSE](../LICENSE).
