/*----------------------------------------------------------------------+
|    Title:  Diagnostics.ts                                             |
|    Per-slate diagnostic records (#154).                               |
|                                                                        |
|    geomlib fails quietly by design: an animation whose target does    |
|    not resolve is skipped, a slide name that matches nothing is       |
|    ignored. That keeps a bad deck rendering, but it also means the    |
|    only evidence is a console line nobody has open. This module is    |
|    the record of what went wrong, so a slate can show a badge and a   |
|    consumer can read the list.                                        |
|                                                                        |
|    Deliberately free of any DOM or Slate import: every decision the   |
|    badge makes (which severity wins, whether to show anything at      |
|    all) is made here, where it can be unit-tested without a browser.  |
+----------------------------------------------------------------------*/

export type DiagnosticSeverity = "warning" | "error";

// Ordering for "error supersedes warning". One place, so the badge and
// the page-wide aggregator can't disagree about which is worse.
export const SEVERITY_RANK: { [k: string]: number } = { warning: 1, error: 2 };

export interface IDiagnostic {
    severity: DiagnosticSeverity;
    // Stable machine-readable class ("unknown-animation", "init-failed").
    // The badge must not parse English, and a consumer filtering by kind
    // shouldn't have to regex prose.
    code: string;
    // Human text, WITHOUT the "[geomlib] " prefix — the console mirror
    // adds that, so the stored message stays clean for a UI to render.
    message: string;
    detail?: { [k: string]: any };
    // Time of FIRST occurrence. Useful for ordering; note it makes the
    // record nondeterministic, so drop it before serialising in a test.
    at: number;
    // How many times this dedupe key fired, including the first.
    count: number;
}

export interface IDiagnosticInput {
    code: string;
    message: string;
    severity?: DiagnosticSeverity;      // default "warning"
    detail?: { [k: string]: any };
    // Dedupe discriminator. Defaults to the message, but naming the
    // varying part explicitly ("the element name") keeps the key stable
    // when the wording of the message changes.
    key?: string;
}

export function dedupeKeyOf(input: IDiagnosticInput): string {
    const sev = input.severity != null ? input.severity : "warning";
    const k = input.key != null ? input.key : input.message;
    return sev + "|" + input.code + "|" + k;
}

/** The worse of two severities; null means "clean". */
export function worstSeverity(
    a: DiagnosticSeverity | null,
    b: DiagnosticSeverity | null,
): DiagnosticSeverity | null {
    if (a == null) return b;
    if (b == null) return a;
    return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

/**
 * An append-only log of what a slate has complained about.
 *
 * Never evicts: a diagnostic reported on slide 4 is still there on slide
 * 5, so a warning cannot scroll past unnoticed. Cleared only explicitly.
 */
export class DiagnosticLog {

    private _entries: IDiagnostic[] = [];
    private _byKey: { [key: string]: IDiagnostic } = {};
    private _worst: DiagnosticSeverity | null = null;

    /**
     * Record a diagnostic. Returns the new record, or null when this key
     * has already been seen — so a caller can mirror to the console only
     * on first occurrence, which is what the old per-module dedupe flags
     * were doing, except now scoped to one slate instead of the page.
     */
    report(input: IDiagnosticInput, now: number): IDiagnostic | null {
        const key = dedupeKeyOf(input);
        const existing = this._byKey[key];
        if (existing != null) {
            existing.count++;
            return null;
        }
        const rec: IDiagnostic = {
            severity: input.severity != null ? input.severity : "warning",
            code: input.code,
            message: input.message,
            at: now,
            count: 1,
        };
        if (input.detail != null) rec.detail = input.detail;
        this._byKey[key] = rec;
        this._entries.push(rec);
        this._worst = worstSeverity(this._worst, rec.severity);
        return rec;
    }

    get entries(): IDiagnostic[] {
        return this._entries.slice();
    }

    /** Worst severity recorded, or null when the slate is clean. */
    get severity(): DiagnosticSeverity | null {
        return this._worst;
    }

    /** Distinct diagnostics (not total occurrences). */
    get count(): number {
        return this._entries.length;
    }

    clear(): void {
        this._entries = [];
        this._byKey = {};
        this._worst = null;
    }
}

/**
 * Payload for the `geomlib:diagnostic` CustomEvent. Extracted so the
 * event's shape is testable without a DOM — the dispatch site is then
 * just a capability guard plus a wrap.
 *
 * `diagnostic` is null when the log was cleared, so a listener can
 * un-render without special-casing.
 */
export function diagnosticEventDetail(
    log: DiagnosticLog,
    d: IDiagnostic | null,
): { diagnostic: IDiagnostic | null; severity: DiagnosticSeverity | null; count: number } {
    return { diagnostic: d, severity: log.severity, count: log.count };
}
