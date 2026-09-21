# Philosophy and roadmap

Where this project comes from, the principles it works by, and where it is
going — for anyone deciding whether and how to contribute. The mechanics of a
pull request are in [CONTRIBUTING.md](../CONTRIBUTING.md).

## What this is

In 1996 Dr. David E. Joyce of Clark University published *Euclid's Elements*
on the web with a Java applet that made every figure live: drag a point and the
construction follows. Java applets stopped running in browsers, and the figures
went still. With Dr. Joyce's permission, this project restores them.

Two repositories carry the work:

| Repository | What it holds |
|---|---|
| **euclid** (this one) — `@brownnrl/geomlib` | A TypeScript port of the applet's construction model, rendering on an HTML5 canvas, with a slideshow layer for walking a proof step by step. |
| [**euclids-elements-lektor**](https://github.com/brownnrl/euclids-elements-lektor) | The site at [euclids-elements.org](https://www.euclids-elements.org/): Dr. Joyce's text and figures for all thirteen books, plus the proposition slide decks that use the library. |

A library issue belongs here; a page, a deck, or a caption belongs there. The
two are developed side by side, and a library release is usually followed by a
site pin bump within days.

## Principles

**Fidelity to the source.** Every page's text and every figure's construction
originate in Dr. Joyce's site. The library reproduces the original Geometry
Applet's construction model rather than reinterpreting it, and when behaviour
is in doubt the Java source under `geom_applet/source/` — and the `harness/propI4`
branch, which can still run the Java 8 applet — are the reference. Divergences
are deliberate and written down. When a bug report proposed changing which side
of a sector an arm order draws (#172), the Java source showed that arm order
picking the side was the applet's contract, and the fix left it alone.

**Preserve first, modernize on top.** Every addition is additive and default-off.
A figure at rest renders bit-for-bit as it did before the change (to the best
of our ability to do so, and faithful to the source texts); the snapshot
goldens enforce that on every pull request. New capability — animation,
diagnostics, centring, responsive sizing — attaches beside the original
behaviour, never in place of it. This ordering is also the roadmap's: the corpus
is made complete and stable before anything is built on top of it.

**Everything AI touches is reviewed by a person.** AI assistance is used
throughout — in converting pages, in authoring decks, in the library itself.
The guardrails are fixed: content comes only from the source text; every
converted page and every deck gets human review before it is published; guides
and commentary are written by a person. In the library, the arbiter is the
test: a fix is shown red before it is shown green, anything visible gets a page
under `view/test/`, and a claim about rendering is measured outside the browser
rather than taken from a screenshot.

**Archival fixtures are mirrors, not ours to tidy.** The pages under
`view/euclid-html/`, `view/compass_geometry/` and `view/round_geometry/` are
Dr. Joyce's originals, kept verbatim as snapshot input. Where one carries a
defect from 1996 (#156), it is documented, not silently repaired.

**Diagnostics over silence.** When the library cannot resolve something — a
name a slide refers to, a colour it does not recognise, an animation target a
refactor left behind — it says so, on the canvas and in the console, rather
than drawing nothing (#154). A deck author should never have to guess why a
figure is blank.

## Roadmap

### Near term — preservation

- **Publish Books II–XIII as decks, a book at a time.** Book I is complete and
  published; Book II's decks are done; Book III is underway. This is the site
  repository's work, and each book tends to surface a few library issues, which
  are fixed and released as they come.
- **Close the diagnostics gaps the decks keep finding**: the default opaque
  face that whites out neighbours when highlighted (#182), a slideshow title
  (#187), whatever the next book turns up.
- **Decide the archival-defect policy** (#156) and the default label size
  (#70): both are questions of what fidelity means, not of code.

### Longer term — modernization, discussed first

Each of these is a design conversation in its issue before it is code. The
principle above — additive, default-off, static renders unchanged — applies to
all of them.

- **Touch gestures** (#57): two-finger rotate and pinch. The mechanics are
  known; what the gestures should *mean* for a construction is not settled.
- **A constraint / hypothesis system** (#128): let a deck state a
  proposition's hypotheses and have the figure report when a drag breaks them.
- **An accessible rendering surface.** The elements already draw through a
  backend-agnostic seam (`drawName` / `drawFace` / `drawEdge` / `drawVertex`,
  each taking a `SlateCanvas`), so an SVG/DOM renderer is possible in
  principle. It would have to keep the canvas path bit-for-bit and the
  headless snapshot suite deterministic. WebGL was considered and set aside:
  the figures are small, labels are central, and a GPU path would put the
  goldens at risk for no visible gain.

### Beyond Euclid

The same approach — a faithful conversion of a source text, live figures,
human-written guides — is intended for other classical texts, in roughly this
order:

1. Apollonius of Perga, *Conics* (Heath's translation).
2. Hilbert, *Foundations of Geometry* (Townsend's translation).

with short guides and commentary connecting sections back to Euclid where that
applies, and forward to modern geometry where someone qualified is willing to
write it. Then other texts, by the same process.

## Getting involved

- **A first pull request should be small** — one issue, a clear cause, a test
  that was red before the fix. It is the fastest way for both sides to see how
  the other works.
- **Preservation issues are open to anyone**: the issue list is the queue, and
  a comment claiming one is enough.
- **Modernization issues want a conversation first**: propose the design in
  the issue and wait for agreement before writing code.
- **Reviewing decks or content, or learning to convert a text**, happens in
  the site repository — start with its
  [deck process](https://github.com/brownnrl/euclids-elements-lektor/blob/main/doc/process.md)
  and [conventions](https://github.com/brownnrl/euclids-elements-lektor/blob/main/doc/conventions.md).
  Students interested in the history of mathematics are welcome there; no
  programming is needed to review a deck against Dr. Joyce's text.
