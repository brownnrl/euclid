# Java → TypeScript Port Record

Documentation from the project's porting era. **Phase 1 (porting all
Joyce-applet construction methods) completed 2026-04-12** with all 69
documented constructions implemented, all 19 3D signature variants
wired, all 44 Java source files ported, and all 465 propositions
across Books I–XIII renderable.

The dated record of how that happened is in
[`../journal.md`](../journal.md).

## What's in here

| File | What it tracked |
|---|---|
| [`java-to-typescript-port-process.md`](java-to-typescript-port-process.md) | The 8-step workflow each porting session followed. Originally `process.md` — renamed because its scope is specifically the Java→TS porting cadence. |
| [`construction-tracker.md`](construction-tracker.md) | Implementation status of every construction type and its associated test view page; platform-level TODOs. |
| [`proposition-tracker.md`](proposition-tracker.md) | Per-proposition renderability status across Books I–XIII. |
| [`java-port-tracker.md`](java-port-tracker.md) | Mapping from every `.java` file in `geom_applet/source/` to its TypeScript implementation status. |
| [`creating-constructions.md`](creating-constructions.md) | The Java-port-era version of the "add a new construction" guide. The current TS-only version is at [`../../creating-constructions.md`](../../creating-constructions.md). |
| [`analysis/`](analysis/) | Time-stamped analysis notes generated during the port: a Java↔TS comparison, the type-counted dispatch migration plan, a post-Phase-1 completion delta, and meta-analysis of development velocity. Snapshots of thinking at the time, not living documents. |

## How to read this folder

If you're looking for *when* something happened, start with
[`../journal.md`](../journal.md). If you're looking at *what got
ported and how*, start with `java-port-tracker.md` and follow the
links into the per-construction notes. If you're looking for
*why* a particular implementation choice was made (e.g.
type-counted dispatch instead of positional matching), the
`analysis/` folder is where the rationale was written down at the
time.
