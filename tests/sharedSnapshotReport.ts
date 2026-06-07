// Shared accumulator for snapshot report entries.
//
// Both SnapshotTest.ts (the per-figure auto-discovery suite) and
// HighlightSnapshotTest.ts (issue #72 highlight rendering) push their
// outcomes here so report.html ends up with every category in one
// place. The mocha root `after` hook fires once after the last
// describe block in the run, regardless of which file registered it.

import {ReportEntry, generateReport} from "./SnapshotHelper";

export const reportEntries: ReportEntry[] = [];

let registered = false;

// Idempotent: safe to call from every test file that pushes entries.
export function ensureReportFlushed(): void {
    if (registered) return;
    registered = true;
    after(function() {
        if (reportEntries.length === 0) return;
        generateReport(reportEntries);
        const passed = reportEntries.filter(e => !e.error && e.beforeResult.passed).length;
        const isNew  = reportEntries.filter(e => e.beforeResult.isNew).length;
        const errors = reportEntries.filter(e => e.error).length;
        console.log(`\n  Report generated: tests/snapshots/report.html`);
        console.log(`  Total slates: ${reportEntries.length}`);
        console.log(`  Passed: ${passed}`);
        console.log(`  New baselines: ${isNew}`);
        console.log(`  Errors: ${errors}`);
    });
}
