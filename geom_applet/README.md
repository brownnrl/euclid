# geom_applet — preserved Java reference

This directory holds the original Java materials this TypeScript port
was built against. Nothing here is maintained as part of the live
library; everything is preserved verbatim for reference and
historical fidelity.

## Contents

| Path | What it is |
|---|---|
| [`Geometry.zip`](Geometry.zip) | Dr. David E. Joyce's original deployable applet archive. The file timestamps inside (1998-02-17 through 2000-10-31) are the actual ship dates of the bytecode — this is what visitors to the *Elements* pages loaded into their browser's Java plugin from 1998 until applets were retired. 104 KB. Unzip it to recover the historical `.class` files alongside their 1998 timestamps. |
| [`source/`](source/) | The Java source files written for the original Geometry Applet: 44 `.java` files plus `Geometry.html` (the applet's documentation page) and `tables.html` (the construction-method reference). The TypeScript port in [`../src/`](../src/) reimplements these classes. |

The clean-mirror HTML of Dr. Joyce's compass-and-straightedge and
spherical-geometry lecture series live one level up at
[`../view/compass_geometry/`](../view/compass_geometry/) and
[`../view/round_geometry/`](../view/round_geometry/) — they're
snapshot test fixtures parsed by [`../tests/HtmlParamParser.ts`](../tests/HtmlParamParser.ts),
grouped under `view/` with the other HTML scene catalogs rather than
with the Java reference here.

## Why keep this?

Two reasons:

1. **Historical record.** The original Geometry Applet was hosted at
   Clark University from 1996 onward; Dr. Joyce lost write-access to
   those files when he retired (his own words). The deployable
   archive isn't reliably recoverable from any other source if the
   Clark URL goes offline.
2. **Reproducibility audit.** A reader who suspects the TS port drifts
   from the original's behavior can compare against the Java sources
   here. Without this directory, that audit is much harder.

## License and permission

The materials in this directory are © David E. Joyce, included by
his permission. See the top-level [NOTICE.md](../NOTICE.md) for the
exact text of his permission and the link to his Quora answer
granting it.

The TypeScript port that *uses* these materials (everything under
[`../src/`](../src/)) is MIT-licensed under joint copyright; see
[../LICENSE](../LICENSE).
