# Contributing to geomlib

Thanks for your interest. A few notes for development.

## Setup

```sh
npm install
```

That's it.

## Running tests

```sh
npm run test:unit      # 137 unit tests — fast (~100 ms)
npm run test:snapshot  # 678 visual-regression tests against snapshot goldens
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

## Adding a new construction

See [doc/creating-constructions.md](doc/creating-constructions.md)
for the full recipe (element class, Construction class, Mocha test,
demo page).

## Architecture overview

[doc/architecture.md](doc/architecture.md) walks through the
implementation: the slate, type-counted construction dispatch, the
drag pipeline, and the `update()` contract.

## Licensing

The TypeScript code is MIT-licensed (see [LICENSE](LICENSE)). The
preserved Java reference materials under `geom_applet/` are © David
E. Joyce, included by permission — see [NOTICE.md](NOTICE.md) for
attribution details. Pull requests imply you agree to release your
contributions under the same MIT terms.
