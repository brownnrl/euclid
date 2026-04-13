# Development Velocity Analysis

A retrospective analysis of the Euclid project's development history,
comparing human-only, ChatGPT-assisted, and Claude-assisted eras.

Generated from `git log` data on 2026-04-12.

---

## Project timeline

| Era | Dates | Duration | Commits | Tools used |
|---|---|---|---|---|
| **Era 1** | Aug–Sep 2019 | ~6 weeks | 51 | Manual (human only) |
| *(gap)* | Oct 2019 – Aug 2023 | ~4 years | 0 | — |
| **Era 2** | Aug 2023 – Aug 2024 | ~12 months | 19 | ChatGPT (Docker/applet infrastructure) |
| *(gap)* | Sep 2024 – Mar 2025 | ~7 months | 0 | — |
| **Era 3** | Mar–Jun 2025 | ~3 months | 5 | Manual (minor fixes) |
| *(gap)* | Jul 2025 – Apr 2026 | ~9 months | 0 | — |
| **Era 4** | Apr 10–12, 2026 | **~49 hours** | 150 | Claude Code (Opus 4.6) |

---

## Lines of code by era

### TypeScript source (*.ts) only

| Era | TS lines added | TS lines removed | Net | Commits |
|---|---|---|---|---|
| Era 1 (Manual) | +3,936 | -1,076 | +2,860 | 51 |
| Era 2 (ChatGPT) | +1,746 | -360 | +1,386 | 19 |
| Era 3 (Intermission) | +45 | -0 | +45 | 5 |
| Era 4 (Claude) | +2,612 | -137 | +2,475 | 150 |

### All text files (ts + md + html + json)

| Era | Total lines added | Commits |
|---|---|---|
| Era 1 (Manual) | +61,687 | 51 |
| Era 2 (ChatGPT) | +4,155 | 19 |
| Era 3 (Intermission) | +9,724 | 5 |
| Era 4 (Claude) | +15,628 | 150 |

*Note: Era 1's large total includes the initial Java source files copied into
the repo, view/euclid-html/ proposition pages (566 files), and other bulk
content. The TS source lines (+3,936) are the actual port work.*

---

## Functional output by era

### Era 1: Manual port (Aug–Sep 2019, ~6 weeks)

- Ported the core element classes: PointElement, LineElement, CircleElement,
  PolygonElement, SectorElement, PlaneElement, SphereElement
- Ported ~24 construction types (of 69 total)
- Built the Slate canvas manager, init() API, and basic rendering
- Created the first test pages
- **No proposition tracking, no systematic verification**
- Approximate working days: ~30 (weekday evenings + weekends over 6 weeks)

### Era 2: ChatGPT-assisted infrastructure (2023–2024)

- Dockerized the Java applet for containerized comparison
- Built the three-way comparison harness (`run_euclid_applet.sh`)
- Created the firefox-in-Docker chromeless viewer
- Added Containerfile and Containerfile.firefox
- Minor code fixes
- **0 new construction types ported**
- Approximate working sessions: ~10–15

### Era 3: Pre-AI intermission (2025)

- 5 commits over 3 months — minor maintenance
- **0 new construction types ported**

### Era 4: Claude Code sessions (Apr 10–12, 2026)

In approximately **49 wall-clock hours** (first commit 2026-04-10 21:38,
last commit 2026-04-12 22:52), with the human sleeping, eating, and doing
other things in between:

- **29 PRs merged** (#1 through #29)
- **~45 construction types ported** (from ~24 to 69)
- **465/465 propositions renderable** (from ~32 to 465)
- **58 Mocha tests** (from 11 to 58)
- **~30 three-way harness test pages** created
- Created doc/process.md, AGENTS.md, all tracker files
- Analyzed all 13 books of Euclid's Elements
- Downloaded and archived compass + round geometry supplementary pages
- Fixed 4 pre-existing bugs (length2, parseColor stale-JS, sphere rendering, 2D picking)
- Built the complete java-port-tracker, proposition-tracker, construction-tracker

---

## Velocity comparison

### Lines of TS source per calendar day

| Era | TS lines added | Calendar days | Lines/day |
|---|---|---|---|
| Era 1 (Manual) | 3,936 | ~42 | **~94** |
| Era 2 (ChatGPT) | 1,746 | ~365 | **~5** |
| Era 4 (Claude) | 2,612 | **~2** | **~1,306** |

### Construction types ported per calendar day

| Era | Constructions ported | Calendar days | Constructions/day |
|---|---|---|---|
| Era 1 (Manual) | ~24 | ~42 | **~0.6** |
| Era 2 (ChatGPT) | 0 | ~365 | **0** |
| Era 4 (Claude) | ~45 | ~2 | **~22.5** |

### Propositions unlocked per calendar day

| Era | Props unlocked | Calendar days | Props/day |
|---|---|---|---|
| Era 1 (Manual) | ~32 | ~42 | **~0.8** |
| Era 4 (Claude) | ~433 | ~2 | **~216** |

---

## Qualitative observations

### What AI changed

1. **Systematic process**: The human-AI pair established a repeatable 8-step
   workflow (process.md) that made each construction port predictable. The
   human focused on selecting which construction to port next and reviewing
   diffs; the AI handled the mechanical work of reading Java, writing TS,
   creating tests, updating trackers, and drafting PRs.

2. **Warm-cache acceleration**: Within a single chat session, subsequent
   construction ports got dramatically faster as the AI retained context
   about the codebase, the process, and the patterns. The first port
   (line;chord) took ~38 minutes; later ports (line;parallel,
   polygon;parallelogram) took ~5 minutes each.

3. **Cross-referencing at scale**: The AI could grep all 566 proposition
   HTML files, cross-reference against the construction tracker, and verify
   NEEDS lines against actual params — work that would have taken hours
   manually. This caught multiple tracker-drift errors.

4. **Documentation discipline**: Every port produced a journal entry,
   tracker updates, test page, applet companion, and PR body. The human
   would likely not have maintained this level of documentation solo.

### What the human provided

1. **Direction and priorities**: The human chose which construction to port
   next, decided scope boundaries, and corrected the AI's understanding
   of the project's goals (e.g., "true port of the Geometry Applet, not
   just proposition renderability").

2. **Quality gates**: Visual verification via the three-way harness,
   catching rendering bugs (sphere drawing), interaction bugs (3D picking),
   and process gaps (missing test pages).

3. **Architectural decisions**: The 2D-first policy, the per-step review
   workflow, the "full Java class conversion" rule, and the branch-per-
   construction discipline.

4. **Infrastructure**: The Docker comparison harness, the CI environment,
   and the original 2019 port that gave the AI a codebase to build on.

### What neither could have done alone

- The human alone had worked on this project intermittently for 7 years
  without completing the construction port (24/69 constructions in 6 weeks
  of active work, then stalled for years).
- The AI alone could not have built the Docker harness, verified visual
  output, or made the strategic decisions about what "done" means.
- Together, they completed Phase 1 in approximately 2 calendar days of
  focused collaboration.

---

## Methodology notes

- Commit timestamps are used as-is from `git log`. The human was not
  working continuously during the entire 49-hour window; there were
  breaks for sleep, meals, and other activities.
- "Lines added" counts come from `git log --numstat` filtered to *.ts
  files, excluding merge commits.
- Construction counts are approximate, based on the number of distinct
  `constructionMethod` assignments in Constructions.ts before and after
  each era.
- The "Era 1" figures include the initial skeleton setup, webpack config,
  and other infrastructure alongside the actual port work.
- ChatGPT usage in Era 2 was primarily for Docker/infrastructure guidance,
  not for TypeScript code generation.
