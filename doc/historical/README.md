# Historical Documentation

This folder records the project's history. **For current
documentation — how to use the library, the API reference, the
architecture — go up one level to [`doc/`](../).**

## Contents

| Path | What it is |
|---|---|
| [`journal.md`](journal.md) | Dated session log running from the project's first TS commits through the post-port phases. The newest entry is at the top; each entry records what was completed, what was discovered, and what comes next. |
| [`java-port/`](java-port/) | The Java→TypeScript porting record. Trackers, analysis, the porting workflow, the per-construction status. The porting itself completed 2026-04-12. See that folder's README for an index. |

## Why a separate folder?

The euclid project began as a Java→TypeScript porting effort:
implement Joyce's *Geometry Applet* construction by construction
until every proposition in Euclid's *Elements* could be rendered.
That work is finished. The trackers, the porting process doc, and
the per-construction status notes were written for that era —
useful as a record of what happened, but no longer the documents a
new contributor or library consumer should start with.

The current `doc/` folder is the present-tense library reference:
quickstart, API, architecture, how to add a new construction. The
material in this folder is preserved alongside it for anyone
wanting to read the porting history or trace a decision back to its
origin.
