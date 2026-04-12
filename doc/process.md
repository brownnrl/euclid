# Porting Process

Each session works through one construction type at a time: read the Java source,
port it to TypeScript, create a test view page, and optionally verify it against
the Java applet. Repeat until all constructions are done, then convert all books.

> **Getting here:** The normal entry point to this document is via
> [AGENTS.md](../AGENTS.md)'s "Session startup protocol", which reads the
> trackers, presents a ranked menu of TBD constructions, and hands control
> to Step 1 below once the user has picked. If you reached this document
> some other way (direct link, grep, etc.), scroll up to AGENTS.md and run
> that protocol first — it handles the "which construction do we even
> port next" question that Step 1 assumes has already been answered.

## Commit per step, with human review between steps

The steps below are designed to be **committed one at a time** on the feature branch.
After each step is finished, stop and commit that step's artifacts as a standalone
commit, then pause for a human to review the diff before moving on to the next step.

- An AI agent running this workflow **may** make file edits, run tests, and build
  the bundle autonomously *within* a single step.
- An AI agent running this workflow **must not** begin the next step until the
  human has reviewed and acknowledged the current step's commit.
- Commit messages should name the step and what landed
  (e.g. `sector-arc: step 4 — add ArcElement.ts`).
- **Do not add a `Co-Authored-By:` trailer** to commits on this repo, even when
  an AI agent authored the change. The human running the session is the author
  of record; the agent is a tool.
- If a step's work has to be redone after review, amend or revert on the feature
  branch — master never sees the in-progress commits.

The point is to keep the review granularity small: one file or one logical unit
per commit. A reviewer can catch "this update() has the wrong sign" or "this
signature list is in the wrong order for first-match-wins" at the step boundary
instead of after eight interleaved changes.

---

## Step 1 — Choose the next construction

Open [constructions-reference.md](constructions-reference.md) and find the highest-priority
TBD construction (sorted by Books I–III usage count at the bottom of that file).

Also check [proposition-tracker.md](proposition-tracker.md) to see which propositions
will become renderable once the construction is done — this gives useful test cases.

### Identifying a verifiable proposition instance

Before locking in a construction choice, verify that at least one Book I–III proposition
exists where the target construction appears and every element *before* it in the param list
uses only already-implemented constructions.

Search method:

```sh
grep -rl ";constructionname;" view/euclid-html/
```

For each candidate file, read the `<param name=e[N]>` lines in order. Starting from e[1],
check each construction type against the implementation tracker. Stop at the first element
that hits a TBD construction. If the target construction appears *before* that TBD element,
you have a verifiable test case. If not, consider whether the element directly before the
target is also something worth implementing first (the "unlock chain").

A proposition where the target construction is the *only* TBD construction is the ideal case.
If no such proposition exists for Books I–III, note this in the journal and rely on the
standalone test view page for visual verification instead.

Before locking in your pick, run `ls view/applet-tests/{type}/` to see which propositions
have already been copied into the repo as standalone applet HTML for nearby constructions.
If the same proposition naturally exercises both your target and an already-implemented
construction, prefer it — you can reuse the existing `inspiration.html` as a reference
rather than creating a fresh one from scratch.

### Create a feature branch off master

Once the construction and verifying proposition are locked in, cut a fresh feature
branch off `master` *before* touching any source files. One construction per branch
keeps the diff reviewable and makes it trivial to back out or rebase if the port
turns out wrong.

```sh
git checkout master
git pull --ff-only
git checkout -b feature/{type}-{construction}
```

Naming: `feature/point-vertex`, `feature/sector-arc`, `feature/line-chord`, etc. —
mirror the `{type};{construction}` pair from the HTML param format so the branch
name lines up with the tracker entry and the harness menu label.

Do this up front, not at commit time: all subsequent steps (new element class,
Construction subclass, test, `view/test/` page, `applet-tests/` pair, tracker and
journal updates) land on the feature branch, and master stays pristine until the
port is merged.

---

## Step 2 — Read the Java source

Open `geom_applet/source/{ConstructionName}.java`.

The Java class name maps directly to the construction name in the HTML param format.
For example, `parallelogram` construction → `Parallelogram.java`... but note that
the Java applet's construction-to-class mapping is in `Slate.java`. Check there if
the `.java` filename is unclear.

Things to note:
- Constructor arguments → these become the TypeScript `Construction.signature`
- `update()` body → this becomes the TypeScript element class `update()` method
- Parent element method calls (e.g. `toCircumcenter`, `normalize`, `unitVector`) →
  check if these exist on `PointElement` in `src/elements/point/PointElement.ts`

---

## Step 3 — Find an example in `view/euclid-html`

Search any book (`booki/` through `bookxiii/`) for a proposition using the construction:

```sh
grep -rl ";constructionname;" view/euclid-html/
```

Pick a simple proposition with few elements as your test case.

Parse the `<param name=e[N] value="...">` lines. The format is:

```
"Name;type;constructionname;arg1,arg2,...;edgeColor;faceColor;vertexColor;nameColor"
```

The styling fields (after the geometric args) vary in count and can be ignored.
Numeric `0` means transparent/hidden; `random` means a random color.

> **LineElement expansion**: If a param arg is the name of a `LineElement`, it expands
> to its two endpoint `PointElement`s in `Slate.convertParams`. The construction
> signature must match the post-expansion types.

**Save an `original.html` into applet-tests.** Once you have picked the proposition,
create `view/applet-tests/{type}/{construction}/original.html` — a single-applet
extraction of the source proposition. Copy the `<applet>...</applet>` block out of
`view/euclid-html/{book}/propXX.html` verbatim, wrap it in `<HTML><BODY>`, and adjust
the `codebase` to `../../..` (three levels up to `view/`, where `Geometry.zip` lives),
not the `codebase="../../Geometry"` that the proposition HTMLs use. This is the
"as Joyce drew it" reference; do not trim it. The companion `applet.html` (added in
Step 7) is the trimmed up-to-construction version that mirrors the TS test page.

---

## Step 4 — Implement the element class

Create `src/elements/{type}/FooElement.ts`.

```typescript
export class FooElement extends PointElement {
    private _a: PointElement;
    private _b: PointElement;

    constructor(a: PointElement, b: PointElement, screen: PlaneElement) {
        super();
        this.dimension = 0;  // 0=point, 1=line, 2=polygon/circle/sector
        this._a = a;
        this._b = b;
    }

    update() {
        // port the Java update() logic here
        // write this._x, this._y, this._z (for points)
        // or this._A, this._B (for lines — these are PointElements)
    }
}
```

`dimension` values:
- `0` — point (only vertex is drawn)
- `1` — line/circle (edge is drawn, no face)
- `2` — polygon/sector/filled circle (face + edge drawn)

---

## Step 5 — Write the Construction class

In `src/elements/Constructions.ts`, add a new `Construction` subclass:

```typescript
class FooConstruction extends Construction {
    constructionMethod: AllConstructions = PointConstructions.foo;
    signature = [ct.PointElement, ct.PointElement];  // post-expansion types

    construct(screen: PlaneElement, params: any[]): [GeomElement[], GeomElement] {
        const [a, b] = params as [PointElement, PointElement];
        const elem = new FooElement(a, b, screen);
        return [[elem], elem];   // [elementsForUpdate, newElement]
    }
}
```

Then add `new FooConstruction()` to the `constructions` array at the bottom of the file.

**If creating intermediate elements** (e.g. an internal circle used to compute a point),
push them into `elementsForUpdate` so Slate calls `update()` on them every frame.

**Signature variant ordering**: if you have both 2D and 3D variants, register the 3D
(longer signature) one first in the array — the 2D variant is a prefix match and
would otherwise greedily consume 3D param lists.

---

## Step 6 — Write a Mocha test

In `tests/SlateTest.ts`, add a test following the existing patterns.

Use the coordinate values from the original HTML params as inputs. Calculate the
expected output by hand or by reference to the Java computation:

```typescript
it('should compute foo correctly', () => {
    const data: IConstructionInfo[] = [
        { name: "A", construction: E.Point.free, params: [60, 100] },
        { name: "B", construction: E.Point.free, params: [140, 100] },
        { name: "F", construction: E.Point.foo,  params: ["A", "B"] },
    ];
    const slate = new Slate(createCanvas(400, 300));
    toElements(slate, data);
    slate.elements.forEach(e => e.update());
    const F = slate.elements[2] as PointElement;
    assert(almostEqual(F._x, 100));
    assert(almostEqual(F._y, 100));
});
```

Run with `npm test`. If time is short and the math is complex, it's acceptable to
skip the unit test and rely on visual verification in Step 7 — note this in the journal.

---

## Step 7 — Build the three-way comparison view (TS page + applet.html, then harness)

Each construction gets a triple of artifacts that are visually equivalent at rest and
exercised together by `./run_euclid_applet.sh`:

1. **Window 1 — `original.html`** — already saved in Step 3, the unmodified source
   proposition extracted to a single applet.
2. **Window 2 — `applet.html`** (this step) — the same view trimmed to focus on the
   construction, in Java applet `<param>` form.
3. **Window 3 — `view/test/{type}/{sub}.html`** (this step) — the same view in the
   TypeScript port.

Windows 2 and 3 must render the same diagram at rest. Any divergence is a porting bug
in the TS element class, *not* something to paper over by tweaking `applet.html`.

### 8a. Create the TypeScript test view page

Create `view/test/{super_type}/{sub_type}.html`. Where possible, use the params from a
verifiable proposition instance (identified in Step 1) so the visual matches a real
proposition's diagram. Naming convention:
- `{super_type}` = element category: `point`, `line`, `circle`, `poly`, `sector`, `plane`, `sphere`
- `{sub_type}` = construction name: `parallelogram`, `chord`, `arc`, etc.

```html
<html>
<head><title>Test View - Foo</title></head>
<body>
<canvas id="canvasId" style="width:400px; height:400px;"></canvas>
<script src="../../../../dist/bundle.js" type="text/javascript"></script>
<script type="text/javascript">
    let E = geomlib.E;
    let Align = geomlib.Align;
    geomlib.init({
        background: '#ffe9cd',
        title: "Foo construction",
        canvasid: "canvasId",
        elements: [
            { name: "A", construction: E.Point.free, params: [60, 100] },
            { name: "B", construction: E.Point.free, params: [140, 100] },
            { name: "F", construction: E.Point.foo,  params: ["A", "B"] },
        ]
    });
</script>
</body>
</html>
```

Rebuild the bundle (`npx webpack`) so the page can render — the harness in 8c uses
the live `dist/bundle.js`.

### 8b. Create the applet.html companion

Hand-translate the TS `geomlib.init({ elements: [...] })` block back into Java applet
`<param>` format and save it as `view/applet-tests/{type}/{construction}/applet.html`.
This file is window 2 of the harness; it must produce the same diagram as the TS test
page in 8a using identical free-point coordinates.

```html
<HTML><HEAD><TITLE>{type};{construction} — applet form of view/test/{type}/{sub}.html</TITLE></HEAD>
<BODY BGCOLOR=ffe9cd>
<!-- TS:       view/test/{type}/{sub}.html -->
<!-- ORIGINAL: view/applet-tests/{type}/{construction}/original.html (propXX) -->
<applet code=Geometry codebase=../../.. archive=Geometry.zip width=400 height=400>
<param name=background value="35,19,100">
<param name=title value="...">
<param name=e[1] value="A;point;free;60,100">
<param name=e[2] value="B;point;free;140,100">
<param name=e[3] value="F;point;foo;A,B">
</applet>
</BODY></HTML>
```

The `<!-- TS: ... -->` header line is **load-bearing**: `run_euclid_applet.sh` greps it
out to know which TS page to open in firefox. Use a single space after `TS:` and a
repo-relative path (no leading `./` or `/`). The `<!-- ORIGINAL: ... -->` line is
informational only — the harness finds `original.html` by sibling-file convention.

The `codebase=../../..` resolves three levels up to `view/`, where `Geometry.zip` lives.
This is different from the `codebase="../../Geometry"` used by the proposition HTMLs in
`view/euclid-html/` — don't copy that path verbatim.

### 8c. Run the three-way harness and verify all three windows agree

Start a static dev server at the repo root in another terminal, then run the harness:

```sh
python3 -m http.server 8000
./run_euclid_applet.sh
# pick the {type};{construction} entry you just added
```

The harness auto-discovers your new `applet.html` on the next run (no script edits) and
spawns three windows in parallel: `original.html` in appletviewer (containerised),
`applet.html` in appletviewer (containerised), and the TS test page in firefox against
`localhost:8000` (also containerised — the `euclid-firefox` image — using an isolated
chromeless profile that hides the tab bar, nav bar, and titlebar so it tiles cleanly
under xmonad/i3/sway and never disturbs the user's regular host firefox).

Compare:
- **Window 2 vs window 3** — must be visually identical at rest. Drag a free point in
  one and the other should track. If they diverge, debug the TS element class.
- **Window 1 vs window 2** — window 1 carries the full surrounding proposition for
  context; window 2 strips it down to just the construction. Use this to sanity-check
  that the `applet.html` trim didn't lose anything semantically important.

Press Ctrl-C in the harness terminal to teardown all three windows.

If Docker/X11 is unavailable, fall back to comparing the TS page against the `.gif`
image alongside the proposition HTML in `view/euclid-html/`.

---

## Step 8 — Update the tracker and journal, then draft the PR body

1. Mark the construction as **IMPL** in [constructions-reference.md](constructions-reference.md)
2. Check off any newly-renderable propositions in [proposition-tracker.md](proposition-tracker.md)
3. Mark the construction as **IMPL** in [construction-tracker.md](construction-tracker.md) and link the
   test view + applet-tests pair, the same way the existing IMPL entries do
4. Append a dated entry to [journal.md](journal.md) following the
   `Completed / Discovered / Next session` template at the top of that file
5. Commit the four doc updates as `{type}-{construction}: step 8 — tracker + journal updates`
6. **Draft the pull request body** (see below). The agent generates the
   markdown; the human pushes the branch and opens the PR on GitHub.
   Do NOT use `git push` or `gh pr create` from the agent — pushing a branch
   and opening a PR are shared-state actions that the human owns.

### Pull request body template

After the step 8 commit lands, the agent should output a single fenced
markdown block — ready for the human to copy directly into GitHub's PR
description field. The block should be a self-contained summary of what
the branch ships, structured as follows:

````markdown
## Summary

One sentence naming the construction ported, the verifying proposition,
and the headline impact (e.g. "Adds `line;chord` (port of `Chord.java`),
verified end-to-end against propI12; unlocks 12 new renderable
propositions across Books I and III.").

## What's in this branch

A bulleted list of the per-step commits, each in the form
`<short-sha> <commit subject>` so a reviewer can scan the history at a
glance. Include any out-of-band commits (e.g. a platform hardening
commit landed mid-port) and call out *why* they're in this branch
rather than a separate one.

## Construction details

- **Element class**: `src/elements/{type}/{Name}Element.ts` (or the file
  the port lives in if it's not a standalone class) — one sentence on
  what it extends and what its `update()` does.
- **Construction class**: `{Name}Construction` in
  `src/elements/Constructions.ts` — note the post-`LineElement`-expansion
  signature and any 2D/3D variant ordering hazard.
- **Java source**: `geom_applet/source/{Name}.java` (line count, fidelity
  of port — line-for-line vs. structural rewrite vs. anything else).

## Tests

- Mocha test count delta (e.g. "17 → 21 passing") and a one-line
  description of each new test.
- Note any test cases that exercise NaN sentinels, degenerate cases,
  or `translate`/`rotate` isolation.

## Verification

Tick boxes the human can check off when reviewing:

- [ ] `npm run build` clean
- [ ] `npm test` passes (N/N)
- [ ] `npx webpack` rebuilds `dist/bundle.js`
- [ ] Three-way harness (`./run_euclid_applet.sh` → pick `{type};{construction}`)
      shows windows 2 and 3 visually identical at rest
- [ ] Drag interactions on key free points behave as expected
      (call out the specific drags that exercise the construction)

## Newly renderable propositions

A flat list (or short table) of every proposition flipped from `[ ]` to
`[~]` in `doc/proposition-tracker.md` by this PR, plus the updated
Book-by-Book summary counts so a reviewer can sanity-check the deltas.

## Discovered / out of scope

Anything found while doing the port that *isn't* fixed in this branch:
proposition-tracker NEEDS-line drift, platform bugs, follow-up
opportunities, etc. Each item should say what was found and why it's
deferred. Mirrors the journal entry's `Discovered` section but trimmed
to the parts a reviewer needs to know about.
````

Style notes for the agent:

- Keep the body under ~200 lines. Long PRs are fine; a long *PR body* just
  duplicates the journal entry. The journal is the canonical record;
  the PR body is the reviewer's index into it.
- Always wrap the whole block in a fenced ` ```markdown ` tag so the human
  can lift it cleanly. Don't include any prose outside the fence.
- Reference commits by short SHA (`git log --oneline master..HEAD`),
  files by repo-relative path. Skip the `Co-Authored-By:` trailer — same
  rule as commits on this repo.
- If the harness check was not performed (e.g. Docker/X11 unavailable
  in the agent's environment), mark its checkbox as `[ ]` and add a
  one-line note explaining what fallback was used (e.g. compared
  against the `.gif` snapshot in `view/euclid-html/{book}/`).

After the agent prints the PR body block, it should stop. The human runs
`git push -u origin feature/{type}-{construction}` and creates the PR
themselves on GitHub, pasting the body block into the description.

---

## Long-term goal

Once all construction types are implemented:
- Convert all 566 HTML files in `view/euclid-html/` (Books I–XIII) from Java `<param>` format
  to TypeScript `geomlib.init()` calls in a new `view/books/` folder
- Each book becomes a browsable set of interactive TypeScript diagrams
- The Java applet and Docker environment can then be retired
