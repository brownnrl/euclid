// Diagnostics (#154) — the per-slate record behind the on-canvas badge.
//
// The DOM half (badge element, icon drawing) is not covered here: the repo
// has no jsdom. That is deliberate rather than a gap — every DECISION the
// badge makes (which severity wins, whether to show anything at all) lives
// in this pure layer, and the DOM half only reads it.

import "mocha";
import * as assert from "assert";
import {createCanvas} from "canvas";
import {Slate} from "../src/Slate";
import {E, init, slates} from "../src/index";
import {A, findAnimation} from "../src/elements/Animations";
import {computeSlideState} from "../src/slideshow";
import {
    DiagnosticLog, worstSeverity, dedupeKeyOf, diagnosticEventDetail,
} from "../src/Diagnostics";

describe("diagnostics (#154)", () => {

    function slate(): Slate {
        const s = new Slate(createCanvas(200, 200) as any);
        s.inTest = true;
        return s;
    }

    // console is mirrored by reportDiagnostic; capture it so the suite
    // stays quiet and so we can assert on what reaches it.
    function capture<T>(fn: () => T): { result: T; warns: string[]; errors: string[] } {
        const warns: string[] = [], errors: string[] = [];
        const w = console.warn, e = console.error;
        console.warn = (...a: any[]) => { warns.push(a.join(" ")); };
        console.error = (...a: any[]) => { errors.push(a.join(" ")); };
        try { return { result: fn(), warns, errors }; }
        finally { console.warn = w; console.error = e; }
    }

    describe("DiagnosticLog", () => {
        it("records a diagnostic and reports it as new", () => {
            const log = new DiagnosticLog();
            const rec = log.report({ code: "x", message: "bad thing" }, 1000);
            assert.ok(rec != null);
            assert.equal(rec!.severity, "warning", "warning is the default severity");
            assert.equal(rec!.count, 1);
            assert.equal(log.count, 1);
        });

        it("dedupes by key and returns null on a repeat", () => {
            const log = new DiagnosticLog();
            assert.ok(log.report({ code: "x", message: "same" }, 1) != null);
            assert.equal(log.report({ code: "x", message: "same" }, 2), null,
                "a repeat returns null so the caller knows not to log again");
            assert.equal(log.count, 1, "still one distinct diagnostic");
            assert.equal(log.entries[0].count, 2, "but the occurrence counter advanced");
        });

        it("separates entries that differ only by key", () => {
            const log = new DiagnosticLog();
            log.report({ code: "x", message: "m", key: "a" }, 1);
            log.report({ code: "x", message: "m", key: "b" }, 2);
            assert.equal(log.count, 2,
                "an explicit key is what lets one message class track several elements");
        });

        it("tracks the worst severity, and error outranks warning", () => {
            const log = new DiagnosticLog();
            assert.equal(log.severity, null, "clean log has no severity");
            log.report({ code: "w", message: "warn" }, 1);
            assert.equal(log.severity, "warning");
            log.report({ code: "e", message: "err", severity: "error" }, 2);
            assert.equal(log.severity, "error");
            log.report({ code: "w2", message: "another warn" }, 3);
            assert.equal(log.severity, "error", "a later warning must not demote it");
        });

        it("clear() empties it completely", () => {
            const log = new DiagnosticLog();
            log.report({ code: "x", message: "m" }, 1);
            log.clear();
            assert.equal(log.count, 0);
            assert.equal(log.severity, null);
            assert.ok(log.report({ code: "x", message: "m" }, 2) != null,
                "and the dedupe memory is cleared too, so it can report again");
        });

        it("entries are a copy, so a caller can't mutate the log", () => {
            const log = new DiagnosticLog();
            log.report({ code: "x", message: "m" }, 1);
            log.entries.length = 0;
            assert.equal(log.count, 1);
        });
    });

    describe("worstSeverity / dedupeKeyOf", () => {
        it("treats null as clean", () => {
            assert.equal(worstSeverity(null, null), null);
            assert.equal(worstSeverity(null, "warning"), "warning");
            assert.equal(worstSeverity("warning", null), "warning");
        });
        it("ranks error above warning either way round", () => {
            assert.equal(worstSeverity("warning", "error"), "error");
            assert.equal(worstSeverity("error", "warning"), "error");
        });
        it("falls back to the message when no key is given", () => {
            assert.equal(dedupeKeyOf({ code: "c", message: "m" }),
                         dedupeKeyOf({ code: "c", message: "m" }));
            assert.notEqual(dedupeKeyOf({ code: "c", message: "m" }),
                            dedupeKeyOf({ code: "c", message: "other" }));
        });
        it("keeps severities in separate buckets", () => {
            assert.notEqual(
                dedupeKeyOf({ code: "c", message: "m" }),
                dedupeKeyOf({ code: "c", message: "m", severity: "error" }),
                "the same text as a warning and as an error are different facts");
        });
    });

    describe("Slate reporting", () => {
        it("records and mirrors to the console", () => {
            const s = slate();
            const { warns } = capture(() =>
                s.reportDiagnostic({ code: "x", message: "something is off" }));
            assert.equal(s.diagnostics.length, 1);
            assert.equal(warns.length, 1);
            assert.ok(warns[0].indexOf("[geomlib] ") === 0,
                "the console keeps the prefix; the stored record does not");
            assert.equal(s.diagnostics[0].message, "something is off");
        });

        it("sends errors to console.error, not console.warn", () => {
            const s = slate();
            const { warns, errors } = capture(() =>
                s.reportDiagnostic({ code: "x", message: "fatal", severity: "error" }));
            assert.equal(errors.length, 1);
            assert.equal(warns.length, 0);
            assert.equal(s.diagnosticSeverity, "error");
        });

        it("mirrors to the console only on first occurrence", () => {
            const s = slate();
            const { warns } = capture(() => {
                s.reportDiagnostic({ code: "x", message: "same" });
                s.reportDiagnostic({ code: "x", message: "same" });
                s.reportDiagnostic({ code: "x", message: "same" });
            });
            assert.equal(warns.length, 1, "no console spam on repeats");
            assert.equal(s.diagnostics[0].count, 3, "but every occurrence is counted");
        });

        it("latches: a diagnostic survives reset()", () => {
            const s = slate();
            capture(() => s.reportDiagnostic({ code: "x", message: "m" }));
            s.reset();
            assert.equal(s.diagnostics.length, 1,
                "reset() is called internally by minimize() and presentation exit; " +
                "clearing there would discard construction-time diagnostics that " +
                "never fire again");
        });

        it("clears only on the explicit clearDiagnostics()", () => {
            const s = slate();
            capture(() => s.reportDiagnostic({ code: "x", message: "m" }));
            s.clearDiagnostics();
            assert.equal(s.diagnostics.length, 0);
            assert.equal(s.diagnosticSeverity, null);
        });

        it("notifies listeners, and unsubscribe stops them", () => {
            const s = slate();
            let calls = 0;
            const off = s.onDiagnosticsChanged(() => { calls++; });
            capture(() => s.reportDiagnostic({ code: "x", message: "m" }));
            assert.equal(calls, 1);
            capture(() => s.reportDiagnostic({ code: "x", message: "m" }));
            assert.equal(calls, 1, "a deduped repeat is not a change");
            s.clearDiagnostics();
            assert.equal(calls, 2, "clearing is a change, so the badge can un-render");
            off();
            capture(() => s.reportDiagnostic({ code: "y", message: "n" }));
            assert.equal(calls, 2);
        });

        it("a throwing listener cannot break reporting", () => {
            const s = slate();
            s.onDiagnosticsChanged(() => { throw new Error("listener blew up"); });
            capture(() => s.reportDiagnostic({ code: "x", message: "m" }));
            assert.equal(s.diagnostics.length, 1);
        });
    });

    // The question this feature has to get right: on a page of several
    // figures, each canvas must own its own diagnostics.
    describe("per-canvas attribution", () => {
        it("keeps two slates' diagnostics entirely separate", () => {
            const a = slate(), b = slate();
            capture(() => a.reportDiagnostic({ code: "x", message: "only on A" }));
            assert.equal(a.diagnostics.length, 1);
            assert.equal(b.diagnostics.length, 0, "B is a different figure");
            assert.equal(a.diagnosticSeverity, "warning");
            assert.equal(b.diagnosticSeverity, null,
                "so B's canvas shows no badge at all");
        });

        it("does NOT suppress the same message on a second slate", () => {
            // Regression guard for the bug this replaced: dedupe used to be
            // module-global (Animations.ts warnedUnknown, GroupAnimations.ts
            // warnedUnsupported), so the FIRST figure to hit a bad name
            // silenced every other figure on the page — the warning arrived
            // attributed to the wrong canvas, or not at all.
            const a = slate(), b = slate();
            const { warns } = capture(() => {
                a.reportDiagnostic({ code: "unknown-animation", key: "Foo", message: "unknown animation 'Foo'" });
                b.reportDiagnostic({ code: "unknown-animation", key: "Foo", message: "unknown animation 'Foo'" });
            });
            assert.equal(warns.length, 2, "each figure reports its own copy");
            assert.equal(a.diagnostics.length, 1);
            assert.equal(b.diagnostics.length, 1);
        });

        it("clearing one slate leaves the other's intact", () => {
            const a = slate(), b = slate();
            capture(() => {
                a.reportDiagnostic({ code: "x", message: "m" });
                b.reportDiagnostic({ code: "x", message: "m" });
            });
            a.clearDiagnostics();
            assert.equal(a.diagnostics.length, 0);
            assert.equal(b.diagnostics.length, 1);
        });

        it("attributes a real animation diagnostic to the slate that owns it", () => {
            // End-to-end through the actual animation path rather than a
            // direct reportDiagnostic call.
            const a = slate(), b = slate();
            for (const s of [a, b]) {
                s.createElement(E.Point.free, [10, 10], "A");
                s.createElement(E.Point.free, [90, 90], "B");
                s.createElement(E.Line.connect, ["A", "B"], "AB");
                s.update();
            }
            capture(() => {
                a.animateTo(
                    new Set(["A", "B", "AB"]),
                    new Set(),
                    [{ elem: "GHOST", name: "Line.straightEdgeConnect" }],
                    "cascade",
                );
            });
            assert.equal(a.diagnostics.length, 1, "A owns the bad target");
            assert.equal(a.diagnostics[0].code, "unknown-element");
            assert.equal(b.diagnostics.length, 0, "B never mentioned it");
        });
    });


    // The gap the demo page exposed: a dead animation target used to stay
    // invisible until a viewer advanced to the offending slide, which is
    // exactly the case nobody notices. Decks are now checked at load.
    describe("init-time deck validation", () => {

        function initWith(canvasid: string, slides: any[]): Slate {
            const canvas: any = createCanvas(200, 200);
            canvas.id = canvasid;
            const savedDoc = (global as any).document;
            (global as any).document = {
                getElementById: (id: string) => (id === canvasid ? canvas : null),
            };
            try {
                init({
                    background: "0,0,100", title: canvasid, canvasid: canvasid,
                    elements: [
                        { name: "A", construction: E.Point.free, params: [10, 10] },
                        { name: "B", construction: E.Point.free, params: [90, 90] },
                        { name: "AB", construction: E.Line.connect, params: ["A", "B"] },
                    ],
                    slides: slides,
                });
                return slates[slates.length - 1];
            } finally {
                if (savedDoc === undefined) delete (global as any).document;
                else (global as any).document = savedDoc;
            }
        }

        it("reports a dead animation target at load, before any slide runs", () => {
            let s!: Slate;
            capture(() => {
                s = initWith("d1", [
                    { text: "one", visible: ["AB"] },
                    { text: "two", visible: ["AB"], transition: { animations: [
                        { elem: "GHOST", name: "Line.straightEdgeConnect" },
                    ] } },
                ]);
            });
            assert.equal(s.diagnostics.length, 1,
                "the badge must appear on load, not only once someone presses p");
            assert.equal(s.diagnostics[0].code, "unknown-element");
            assert.ok(s.diagnostics[0].message.indexOf("slide 2") >= 0,
                "and it should say which slide: " + s.diagnostics[0].message);
        });

        it("reports an unresolvable name in a slide set at load", () => {
            let s!: Slate;
            capture(() => {
                s = initWith("d2", [{ text: "one", visible: ["AB"], highlighted: ["NOPE"] }]);
            });
            assert.equal(s.diagnostics.length, 1);
            assert.equal(s.diagnostics[0].code, "unknown-slide-name");
        });

        it("stays silent for a deck whose names all resolve", () => {
            let s!: Slate;
            capture(() => {
                s = initWith("d3", [
                    { text: "one", visible: ["A", "B", "AB"], highlighted: ["AB"] },
                    { text: "two", visible: ["A", "B", "AB"], transition: { animations: [
                        { elem: "AB", name: "Line.straightEdgeConnect" },
                    ] } },
                ]);
            });
            assert.equal(s.diagnostics.length, 0, "a clean deck must stay clean");
            assert.equal(s.diagnosticSeverity, null, "so no badge is created at all");
        });

        it("resolves aliases, so a valid alias is not flagged", () => {
            let s!: Slate;
            capture(() => {
                const canvas: any = createCanvas(200, 200);
                canvas.id = "d4";
                const savedDoc = (global as any).document;
                (global as any).document = {
                    getElementById: (id: string) => (id === "d4" ? canvas : null),
                };
                try {
                    init({
                        background: "0,0,100", title: "d4", canvasid: "d4",
                        elements: [
                            { name: "A", construction: E.Point.free, params: [10, 10] },
                            { name: "B", construction: E.Point.free, params: [90, 90] },
                            { name: "AB", construction: E.Line.connect, params: ["A", "B"] },
                        ],
                        aliases: { "BA": "AB" },
                        slides: [{ text: "one", visible: ["BA"], highlighted: ["BA"] }],
                    });
                    s = slates[slates.length - 1];
                } finally {
                    if (savedDoc === undefined) delete (global as any).document;
                    else (global as any).document = savedDoc;
                }
            });
            assert.equal(s.diagnostics.length, 0,
                "aliases resolve in slide sets since #151; the checker must agree");
        });
    });


    // #159 — names a MACRO animation creates at run time.
    //
    // compassTransfer's `keepCircles` registers its circles inside the
    // animation's own setup, so they do not exist when the figure is built.
    // Deck validation runs at build time, so without a declaration those
    // names look like typos and a correct deck gets a warning badge — which
    // is exactly what happened to I.23's ten-circle count slide, the whole
    // reason keepCircles exists. The danger was that the obvious "fix" is to
    // delete the names, which breaks the deck.
    describe("deferred macro names (#159)", () => {

        function initWith(canvasid: string, extra: any): Slate {
            const canvas: any = createCanvas(300, 300);
            canvas.id = canvasid;
            const savedDoc = (global as any).document;
            (global as any).document = {
                getElementById: (id: string) => (id === canvasid ? canvas : null),
            };
            try {
                init(Object.assign({
                    background: "0,0,100", title: canvasid, canvasid: canvasid,
                    elements: [
                        { name: "P", construction: E.Point.free, params: [60, 200] },
                        { name: "C", construction: E.Point.free, params: [160, 200] },
                        { name: "D", construction: E.Point.free, params: [220, 180] },
                        { name: "K", construction: E.Circle.radius, params: ["P", "C", "D"] },
                    ],
                }, extra));
                return slates[slates.length - 1];
            } finally {
                if (savedDoc === undefined) delete (global as any).document;
                else (global as any).document = savedDoc;
            }
        }

        // A deck shaped like I.23: a transfer that keeps its circles, and a
        // later slide that addresses them.
        const KEPT = ["Ka", "Kc", "Kc2", "KT"];
        const transferSlides = (lateNames: string[]) => [
            { text: "one", visible: ["K"] },
            { text: "transfer", visible: ["K"], transition: { animations: [
                { elem: "K", name: A.Circle.compassTransfer,
                  args: { keepCircles: KEPT } },
            ] } },
            { text: "count them", visible: ["K"].concat(lateNames),
              highlighted: lateNames },
        ];

        it("an animation declares nothing by default", () => {
            const anim = findAnimation(A.Line.straightEdgeConnect)!;
            assert.deepEqual(anim.declaredNames({}), [],
                "only a macro that creates elements needs to opt in");
        });

        it("compassTransfer declares its keepCircles", () => {
            const anim = findAnimation(A.Circle.compassTransfer)!;
            assert.deepEqual(anim.declaredNames({ keepCircles: KEPT }), KEPT);
            assert.deepEqual(anim.declaredNames({}), [],
                "no keepCircles means nothing is claimed");
        });

        it("ignores empty or non-string entries in keepCircles", () => {
            const anim = findAnimation(A.Circle.compassTransfer)!;
            assert.deepEqual(
                anim.declaredNames({ keepCircles: ["Ka", "", null, 7, "KT"] }),
                ["Ka", "KT"]);
        });

        it("the slate records and reports declared names", () => {
            const s = new Slate(createCanvas(100, 100) as any);
            s.inTest = true;
            assert.equal(s.isDeferredName("Ka"), false);
            s.declareDeferredNames(["Ka", "KT"]);
            assert.ok(s.isDeferredName("Ka"));
            assert.ok(s.isDeferredName("KT"));
            assert.equal(s.isDeferredName("nope"), false);
            assert.equal(s.lookupElement("Ka"), null,
                "declaring a name must NOT conjure the element — only the " +
                "validators are told, the slate stays honest");
        });

        it("a later slide may address the kept names without a warning", () => {
            let s!: Slate;
            capture(() => { s = initWith("m1", { slides: transferSlides(KEPT) }); });
            assert.deepEqual(s.diagnostics.map((d) => d.message), [],
                "this is the I.23 case: the deck is correct and must stay quiet");
        });

        it("an animation may target a kept name without a warning", () => {
            let s!: Slate;
            capture(() => {
                s = initWith("m2", { slides: [
                    { text: "one", visible: ["K"] },
                    { text: "transfer", visible: ["K"], transition: { animations: [
                        { elem: "K", name: A.Circle.compassTransfer,
                          args: { keepCircles: KEPT } },
                    ] } },
                    { text: "re-show one", visible: ["K", "Ka"],
                      transition: { animations: [
                          { elem: "Ka", name: A.Circle.compass },
                      ] } },
                ] });
            });
            assert.deepEqual(s.diagnostics.map((d) => d.code), []);
        });

        it("STILL reports a name no macro claimed", () => {
            // The fix must not become a blanket amnesty: a real typo in the
            // same deck has to survive it.
            let s!: Slate;
            capture(() => {
                s = initWith("m3", { slides: transferSlides(["Ka", "Kc", "TYPO"]) });
            });
            const names = s.diagnostics.map((d) => (d.detail as any).name);
            assert.ok(names.indexOf("TYPO") >= 0,
                "an unclaimed name must still be reported: " + JSON.stringify(names));
            assert.equal(names.indexOf("Ka"), -1, "but the claimed ones stay quiet");
        });

        it("computeSlideState does not report a deferred name either", () => {
            // A viewer can jump straight to a late slide, before the macro
            // that creates the names has run.
            const s = new Slate(createCanvas(200, 200) as any);
            s.inTest = true;
            s.createElement(E.Point.free, [10, 10], "A");
            s.update();
            s.declareDeferredNames(["Ka"]);
            const { warns } = capture(() =>
                computeSlideState(s, [{ text: "", visible: ["A", "Ka"] }], 0));
            assert.deepEqual(warns, []);
        });
    });

    describe("event payload", () => {
        it("carries the record, the worst severity and the count", () => {
            const log = new DiagnosticLog();
            const rec = log.report({ code: "x", message: "m" }, 1)!;
            const d = diagnosticEventDetail(log, rec);
            assert.equal(d.diagnostic, rec);
            assert.equal(d.severity, "warning");
            assert.equal(d.count, 1);
        });

        it("uses a null diagnostic to mean 'cleared'", () => {
            const log = new DiagnosticLog();
            log.report({ code: "x", message: "m" }, 1);
            log.clear();
            const d = diagnosticEventDetail(log, null);
            assert.equal(d.diagnostic, null);
            assert.equal(d.severity, null,
                "so a listener can un-render without special-casing");
            assert.equal(d.count, 0);
        });
    });
});
