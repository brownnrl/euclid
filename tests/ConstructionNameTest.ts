// getConstructionName round-trip (#161).
//
// The function maps a construction's numeric enum value back to a
// "Type.name" string, and is reached on exactly one path: the TypeError
// Slate.createElement throws when no construction matches the supplied
// params (src/Slate.ts). Because nothing but an error path calls it, a
// whole element type went unnamed for a long time without anyone noticing
// — Circle constructions (201-204) had no branch at all, so every circle
// was reported as "<Not Valid Construction>" in a message whose entire job
// is to tell you what you got wrong.
//
// These tests walk every enum rather than spot-checking, so the next range
// added cannot repeat it.

import "mocha";
import * as assert from "assert";
import {
    getConstructionName,
    PointConstructions, LineConstructions, CircleConstructions,
    PolygonConstructions, SectorConstructions, PlaneConstructions,
    SphereConstructions, PolyhedraConstructions,
} from "../src/elements/Constructions";

// Numeric members only — a TS numeric enum also carries reverse string keys.
function members(e: any): [string, number][] {
    return Object.keys(e)
        .filter((k) => typeof e[k] === "number")
        .map((k) => [k, e[k] as number] as [string, number]);
}

const ENUMS: [string, any][] = [
    ["Point", PointConstructions],
    ["Line", LineConstructions],
    ["Circle", CircleConstructions],
    ["Polygon", PolygonConstructions],
    ["Sector", SectorConstructions],
    ["Plane", PlaneConstructions],
    ["Sphere", SphereConstructions],
    ["Polyhedra", PolyhedraConstructions],
];

describe("getConstructionName (#161)", () => {

    it("names every construction in every enum", () => {
        const unnamed: string[] = [];
        for (const [type, e] of ENUMS) {
            for (const [key, value] of members(e)) {
                const got = getConstructionName(value);
                if (got !== type + "." + key) {
                    unnamed.push(`${type}.${key} (${value}) -> ${got}`);
                }
            }
        }
        assert.deepEqual(unnamed, [],
            "every construction must round-trip to Type.name — this message is " +
            "the only thing a caller sees when a construction fails to match");
    });

    it("names Circle constructions", () => {
        // The specific regression: the range chain jumped from 100-200
        // straight to 300-400, skipping 201-204 entirely.
        assert.equal(getConstructionName(CircleConstructions.radius), "Circle.radius");
        assert.equal(getConstructionName(CircleConstructions.circumcircle), "Circle.circumcircle");
        assert.equal(getConstructionName(CircleConstructions.invert), "Circle.invert");
        assert.equal(getConstructionName(CircleConstructions.intersection), "Circle.intersection");
    });

    it("leaves no gap between the type ranges", () => {
        // Ranges are hand-written as `N00 < cm && cm < N00+100`, so a whole
        // decade can be omitted silently. Assert each enum sits inside its
        // own hundred and that the hundreds are contiguous from 0.
        const spans = ENUMS.map(([type, e]) => {
            const vals = members(e).map(([, v]) => v);
            return { type, lo: Math.min(...vals), hi: Math.max(...vals) };
        });
        for (let i = 0; i < spans.length; i++) {
            const { type, lo, hi } = spans[i];
            const hundred = i * 100;
            assert.ok(lo > hundred && hi < hundred + 100,
                `${type} spans ${lo}-${hi}, outside its ${hundred}-${hundred + 100} band`);
        }
    });

    it("reports a value outside every range as invalid", () => {
        assert.equal(getConstructionName(99999 as any), "<Not Valid Construction>");
    });

    it("would catch a value sitting exactly on a range boundary", () => {
        // The comparisons are strict on both sides, so a member defined as
        // exactly 100/200/300/... would fall through to the invalid string.
        // Nothing does today (every enum starts at x01) — this pins that.
        const onBoundary: string[] = [];
        for (const [type, e] of ENUMS) {
            for (const [key, value] of members(e)) {
                if (value % 100 === 0) onBoundary.push(`${type}.${key} = ${value}`);
            }
        }
        assert.deepEqual(onBoundary, [],
            "a construction defined on a multiple of 100 would be unnamed, " +
            "because both range bounds are strict");
    });
});
