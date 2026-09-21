# Contributing to geomlib

Thanks for your interest. This file covers the mechanics — setup, tests, and
what a pull request should carry. The project's principles and roadmap, and
where a given kind of contribution belongs, are in
[doc/roadmap.md](doc/roadmap.md).

## Setup

```sh
npm install
```

That's it.

## Running tests

```sh
npm run test:unit      # 469 unit tests — fast (~220 ms)
npm run test:snapshot  # 705 visual-regression tests against snapshot goldens
npm test               # both (snapshot then unit)
```

### Snapshot goldens

Snapshot tests auto-create their golden PNGs on first run, so a fresh
clone just needs `npm test` to bootstrap. Goldens live under
`tests/snapshots/` and are gitignored — each contributor maintains
their own set locally.

To regenerate all goldens from scratch:

```sh
npm run snapshots:clean
npm test
```

## How a contribution works

**Start from an issue.** One issue per pull request. If there is no issue for
what you want to change, open one first — even a small one — so the reasoning
has a home. A first PR is best kept small; it lets both sides see how the other
works before anything larger.

**Fork and branch.** Branches are named for what they carry:
`fix/issue-173-hidpi-attr-sized-canvas`, `feature/issue-164-center-on`,
`docs/...`, `chore/...`. Pull requests are squash-merged, so a branch's commit
history is yours to arrange; the PR title becomes the commit subject on `main`.

**What a pull request carries.**

- *The cause, not just the change.* Say what was wrong and why, in the PR
  body. When the fix diverges from what the issue proposed, say why — the Java
  source under `geom_applet/source/` is the reference when the original
  applet's behaviour is the question.
- *Tests that were red first.* State that the new test fails without the fix.
  Unit tests live in `tests/*Test.ts`; a new test file must also be added to
  the `test:unit` and `coverage` scripts in `package.json`.
- *A view test for anything visible.* A page under `view/test/` that shows the
  before and after, and a row on `view/test/overview.html` with the issue
  linked. The bundle it loads is `dist/bundle.js` (`npm run bundle`).
- *A snapshot statement.* Run `npm run test:snapshot` and say what happened:
  "705/705, no golden moved", or which scenes changed and why. A change that
  alters a figure at rest needs a reason in the PR.
- *Docs in the same PR.* `doc/api.md`, `doc/animations-reference.md` and the
  others describe the code as it is; when the code moves, they move with it.

**Test counts** in `AGENTS.md`, `CONTRIBUTING.md` and `README.md` are updated at
release time, not per PR.

**Commit messages** are a subject line; a simple change needs no body. No
trailers.

**Content, decks and captions** — anything about a page on the site rather
than the library — belong in
[euclids-elements-lektor](https://github.com/brownnrl/euclids-elements-lektor);
see its [doc/process.md](https://github.com/brownnrl/euclids-elements-lektor/blob/main/doc/process.md)
for how a deck is built and reviewed.

## Adding a new construction

See [doc/creating-constructions.md](doc/creating-constructions.md)
for the full recipe (element class, Construction class, Mocha test,
demo page).

## Adding a new slide-transition animation

See [doc/creating-animations.md](doc/creating-animations.md) for the
parallel recipe (Animation subclass, registry entry, test, demo
annotation). The catalog of existing animations lives in
[doc/animations-reference.md](doc/animations-reference.md).

## Architecture overview

[doc/architecture.md](doc/architecture.md) walks through the
implementation: the slate, type-counted construction dispatch, the
drag pipeline, the `update()` contract, the slideshow surface, and
the animation orchestrator.

## Licensing

The TypeScript code is MIT-licensed (see [LICENSE](LICENSE)). The
preserved Java reference materials under `geom_applet/` are © David
E. Joyce, included by permission — see [NOTICE.md](NOTICE.md) for
attribution details. Pull requests imply you agree to release your
contributions under the same MIT terms.
