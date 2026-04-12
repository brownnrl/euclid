# Proposition Tracker

Tracks the port status of all propositions across Euclid's Elements.

## Status key

| Mark | Meaning |
|------|---------|
| `[x]` | Complete — all constructions implemented, test view page created, verified against appletviewer |
| `[~]` | Renderable — all constructions implemented, needs test view page and/or visual verification |
| `[ ]` | Blocked — one or more constructions not yet implemented (blockers listed after NEEDS:) |

## Summary

| Scope | Total | Renderable (`[~]`) | Complete (`[x]`) |
|-------|-------|--------------------|------------------|
| Book I | 48 | **48** | 0 |
| Book II | 14 | **14** | 0 |
| Book III | 37 | **37** | 0 |
| **I–III total** | **99** | **99** | **0** |
| Books IV–XIII | ~365 | — | — |

Update the summary table after each session.

---

## Book I

- [~] I.1 — To construct an equilateral triangle on a given finite straight line.
- [~] I.2 — To place a straight line equal to a given straight line with one end at a given point. (`polygon;equilateralTriangle`, `point;vertex` landed 2026-04-10; tracker drift fixed 2026-04-12.)
- [~] I.3 — To cut off from the greater of two given unequal straight lines a straight line equal to the less.
- [~] I.4 — If two triangles have two sides equal to two sides respectively… (SAS congruence). (3-point `circle;radius` landed 2026-04-12; `sector;arc` landed 2026-04-11; tracker drift fixed 2026-04-12.)
- [~] I.5 — In isosceles triangles the angles at the base equal one another.
- [~] I.6 — If in a triangle two angles equal one another, then the sides opposite the equal angles also equal one another.
- [~] I.7 — Given two straight lines constructed from the ends of a straight line and meeting in a point…
- [~] I.8 — If two triangles have the two sides equal to two sides respectively, and also have the base equal to the base… (SSS congruence).
- [~] I.9 — To bisect a given rectilinear angle. (`polygon;equilateralTriangle`, `point;vertex` landed 2026-04-10; tracker drift fixed 2026-04-12.)
- [~] I.10 — To bisect a given finite straight line. (`polygon;equilateralTriangle`, `point;vertex` landed 2026-04-10; tracker drift fixed 2026-04-12.)
- [~] I.11 — To draw a straight line at right angles to a given straight line from a given point on it. (`polygon;equilateralTriangle`, `point;vertex` landed 2026-04-10; tracker drift fixed 2026-04-12.)
- [~] I.12 — To draw a straight line perpendicular to a given infinite straight line from a given point not on it. (`line;chord` landed 2026-04-11; test page at view/test/line/chord.html uses these exact params.)
- [~] I.13 — If a straight line stands on a straight line, then it makes either two right angles or angles whose sum equals two right angles.
- [~] I.14 — If with any straight line, and at a point on it, two straight lines not lying on the same side make the sum of the adjacent angles equal to two right angles, then the two straight lines are in a straight line with one another.
- [~] I.15 — If two straight lines cut one another, then they make the vertical angles equal to one another.
- [~] I.16 — In any triangle, if one of the sides is produced, then the exterior angle is greater than either of the interior and opposite angles. (`point;proportion` landed 2026-04-12; `sector;arc` landed 2026-04-11. Note: the primary applet variant doesn't use point;proportion; only the secondary elliptic-geometry variant does.)
- [~] I.17 — In any triangle the sum of any two angles is less than two right angles.
- [~] I.18 — In any triangle the angle opposite the greater side is greater.
- [~] I.19 — In any triangle the side opposite the greater angle is greater.
- [~] I.20 — In any triangle the sum of any two sides is greater than the remaining one.
- [~] I.21 — If from the ends of one of the sides of a triangle two straight lines are constructed meeting within the triangle…
- [~] I.22 — To construct a triangle out of three straight lines which equal three given straight lines. (`line;parallel` landed 2026-04-11.)
- [~] I.23 — To construct a rectilinear angle equal to a given rectilinear angle on a given straight line and at a point on it. (`polygon;similar` landed 2026-04-12.)
- [~] I.24 — If two triangles have two sides equal to two sides respectively, but have one of the angles contained by the equal straight lines greater than the other… (`polygon;similar` landed 2026-04-12.)
- [~] I.25 — If two triangles have two sides equal to two sides respectively, but have the base greater than the base…
- [~] I.26 — If two triangles have two angles equal to two angles respectively, and one side equal to one side… (AAS/ASA congruence). (`polygon;similar` landed 2026-04-12.)
- [~] I.27 — If a straight line falling on two straight lines makes the alternate angles equal to one another, then the straight lines are parallel. (`line;parallel` landed 2026-04-11.)
- [~] I.28 — If a straight line falling on two straight lines makes the exterior angle equal to the interior and opposite angle on the same side… (`point;parallelogram` landed 2026-04-10; tracker drift fixed 2026-04-12.)
- [~] I.29 — A straight line falling on parallel straight lines makes the alternate angles equal to one another… (`point;parallelogram` landed 2026-04-10; `point;proportion` landed 2026-04-12. Primary applet variant doesn't use point;proportion.)
- [~] I.30 — Straight lines parallel to the same straight line are also parallel to one another. (`point;parallelogram` landed 2026-04-10; tracker drift fixed 2026-04-12.)
- [~] I.31 — To draw a straight line through a given point parallel to a given straight line. (`line;similar` landed 2026-04-12.)
- [~] I.32 — In any triangle, if one of the sides is produced, then the exterior angle equals the sum of the two interior and opposite angles… (`point;parallelogram` landed 2026-04-10; tracker drift fixed 2026-04-12.)
- [~] I.33 — Straight lines which join the ends of equal and parallel straight lines in the same directions are themselves equal and parallel. (`point;parallelogram`, `point;vertex` landed 2026-04-10; tracker drift fixed 2026-04-12.)
- [~] I.34 — In parallelogrammic areas the opposite sides and angles equal one another, and the diameter bisects the areas. (`point;parallelogram`, `point;vertex`, `polygon;parallelogram` all landed by 2026-04-11.)
- [~] I.35 — Parallelograms which are on the same base and in the same parallels equal one another. (`point;parallelogram` landed 2026-04-10; tracker drift fixed 2026-04-12.)
- [~] I.36 — Parallelograms which are on equal bases and in the same parallels equal one another. (`point;parallelogram`, `point;vertex` landed 2026-04-10; tracker drift fixed 2026-04-12.)
- [~] I.37 — Triangles which are on the same base and in the same parallels equal one another. (`line;parallel`, `point;parallelogram` both landed 2026-04-11.)
- [~] I.38 — Triangles which are on equal bases and in the same parallels equal one another. (`line;parallel`, `point;parallelogram` both landed 2026-04-11.)
- [~] I.39 — Equal triangles which are on the same base and on the same side are also in the same parallels. (`line;parallel` landed 2026-04-11.)
- [~] I.40 — Equal triangles which are on equal bases and on the same side are also in the same parallels. (`line;parallel` landed 2026-04-11.)
- [~] I.41 — If a parallelogram has the same base with a triangle and is in the same parallels, then the parallelogram is double the triangle. (`point;parallelogram`, `point;vertex` landed 2026-04-10; tracker drift fixed 2026-04-12.)
- [~] I.42 — To construct a parallelogram equal to a given triangle in a given rectilinear angle. (`point;parallelogram`, `point;similar` both landed by 2026-04-12.)
- [~] I.43 — In any parallelogram the complements of the parallelograms about the diameter equal one another. (`point;parallelogram`, `polygon;quadrilateral`, `point;vertex` all landed by 2026-04-12.)
- [~] I.44 — To a given straight line in a given rectilinear angle, to apply a parallelogram equal to a given triangle. (All blockers landed by 2026-04-12: `polygon;application` was the final one.)
- [~] I.45 — To construct a parallelogram equal to a given rectilinear figure in a given rectilinear angle. (All blockers landed by 2026-04-12.)
- [~] I.46 — To describe a square on a given straight line. (`polygon;quadrilateral`, `polygon;square`, `point;vertex` all landed by 2026-04-12.)
- [~] I.47 — In right-angled triangles the square on the side opposite the right angle equals the sum of the squares on the sides containing the right angle. (Pythagoras' theorem. `line;foot` 2D variant landed 2026-04-12; `polygon;square`, `point;vertex` already landed.)
- [~] I.48 — If in a triangle the square on one of the sides equals the sum of the squares on the remaining two sides of the triangle, then the angle contained by the remaining two sides of the triangle is right.

---

## Book II

- [~] II.1 — If there are two straight lines, and one of them is cut into any number of segments whatever, then the rectangle contained by the two straight lines equals the sum of the rectangles contained by the uncut straight line and each of the segments. (All blockers landed by 2026-04-12. Verified against HTML: uses polygon;parallelogram, point;parallelogram, point;vertex, cutoff, perpendicular.)
- [~] II.2 — If a straight line is cut at random, then the sum of the rectangles contained by the whole and each of the segments equals the square on the whole. (All blockers landed by 2026-04-12. Verified: uses polygon;square, polygon;quadrilateral, point;parallelogram, point;vertex.)
- [~] II.3 — If a straight line is cut at random, then the rectangle contained by the whole and one of the segments equals the sum of the rectangle contained by the segments and the square on the aforesaid segment. (All blockers landed by 2026-04-12. Verified: uses polygon;parallelogram, polygon;square, point;vertex.)
- [~] II.4 — If a straight line is cut at random, then the square on the whole equals the sum of the squares on the segments plus twice the rectangle contained by the segments. (All blockers landed by 2026-04-12. Verified: uses polygon;parallelogram, polygon;quadrilateral, polygon;square, point;parallelogram, point;vertex, intersection.)
- [~] II.5 — If a straight line is cut into equal and unequal segments, then the rectangle contained by the unequal segments of the whole together with the square on the straight line between the points of section equals the square on the half. (All blockers landed by 2026-04-12. Verified: uses polygon;square, polygon;quadrilateral, point;parallelogram, sector;arc.)
- [~] II.6 — If a straight line is bisected and a straight line is added to it in a straight line… (All blockers landed by 2026-04-12. Verified: uses polygon;square, polygon;quadrilateral, point;parallelogram, sector;arc.)
- [~] II.7 — If a straight line is cut at random, then the sum of the square on the whole and that on one of the segments… (All blockers landed by 2026-04-12. Verified: uses polygon;square, polygon;parallelogram, point;parallelogram, sector;arc.)
- [~] II.8 — If a straight line is cut at random, then four times the rectangle contained by the whole and one of the segments plus the square on the remaining segment… (All blockers landed by 2026-04-12. Verified: uses polygon;square, polygon;quadrilateral, line;parallel, point;parallelogram, point;vertex.)
- [~] II.9 — If a straight line is cut into equal and unequal segments, then the sum of the squares on the unequal segments of the whole is double… (`polygon;parallelogram`, `polygon;quadrilateral`, `line;parallel`, `point;parallelogram` all landed by 2026-04-12.)
- [~] II.10 — If a straight line is bisected, and a straight line is added to it in a straight line… (All blockers landed by 2026-04-12. Verified: uses polygon;parallelogram, circle;radius, line;bichord, line;perpendicular — no polygon;square needed.)
- [~] II.12 — In obtuse-angled triangles the square on the side opposite the obtuse angle is greater than the sum of the squares on the sides containing the obtuse angle…
- [~] II.13 — In acute-angled triangles the square on the side opposite the acute angle is less than the sum of the squares on the sides containing the acute angle…
- [~] II.11 — To cut a given straight line so that the rectangle contained by the whole and one of the segments equals the square on the remaining segment. (All blockers landed by 2026-04-12. Verified: uses polygon;parallelogram, polygon;square, line;parallel, line;perpendicular, line;bichord, circle;radius.)
- [~] II.14 — To construct a square equal to a given rectilinear figure. (All blockers landed by 2026-04-12: `polygon;application` was the final one.)

---

## Book III

- [~] III.1 — To find the center of a given circle. (`line;chord` landed 2026-04-11.)
- [~] III.2 — If two points are taken at random on the circumference of a circle, then the straight line joining the points falls within the circle. (sector;arc landed 2026-04-11; test page at view/test/sector/arc.html uses these exact params.)
- [~] III.3 — If a straight line passing through the center of a circle bisects a straight line not passing through the center, then it also cuts it at right angles; and if it cuts it at right angles, then it also bisects it.
- [~] III.4 — If in a circle two straight lines which do not pass through the center cut one another, then they do not bisect one another.
- [~] III.5 — If two circles cut one another, then they do not have the same center. (`line;chord` landed 2026-04-11.)
- [~] III.6 — If two circles touch one another, then they do not have the same center. (`line;chord` landed 2026-04-11.)
- [~] III.7 — If on the diameter of a circle a point is taken which is not the center of the circle, and from the point straight lines fall upon the circle, then that is greatest on which passes through the center…
- [~] III.8 — If a point is taken outside a circle and from the point straight lines are drawn through to the circle… (`line;chord` landed 2026-04-11.)
- [~] III.9 — If a point is taken within a circle, and more than two equal straight lines fall from the point on the circle, then the point taken is the center of the circle. (`line;chord` landed 2026-04-11.)
- [~] III.10 — A circle does not cut a circle at more than two points. (`polygon;equilateralTriangle`, `point;vertex` already landed; `line;chord` landed 2026-04-11.)
- [~] III.11 — If two circles touch one another internally, and their centers are taken, then the straight line joining their centers, being produced, falls on the point of contact of the circles.
- [~] III.12 — If two circles touch one another externally, then the straight line joining their centers passes through the point of contact. (`line;chord` landed 2026-04-11.)
- [~] III.13 — A circle does not touch another circle at more than one point whether it touches it internally or externally.
- [~] III.14 — Equal straight lines in a circle are equally distant from the center, and those which are equally distant from the center equal one another. (`polygon;similar` landed 2026-04-12.)
- [~] III.15 — Of straight lines in a circle the diameter is greatest, and of the rest the nearer to the center is always greater than the more remote. (`line;chord` landed 2026-04-11.)
- [~] III.16 — The straight line drawn at right angles to the diameter of a circle from its end will fall outside the circle…
- [~] III.17 — From a given point to draw a straight line touching a given circle. (`line;chord` landed 2026-04-11.)
- [~] III.18 — If a straight line touches a circle, and a straight line is joined from the center to the point of contact, the straight line so joined will be perpendicular to the tangent.
- [~] III.19 — If a straight line touches a circle, and from the point of contact a straight line is drawn at right angles to the tangent, the center of the circle will be on the straight line so drawn.
- [~] III.20 — In a circle the angle at the center is double the angle at the circumference when the angles have the same circumference as base.
- [~] III.21 — In a circle the angles in the same segment equal one another.
- [~] III.22 — The sum of the opposite angles of quadrilaterals in circles equals two right angles.
- [~] III.23 — On the same straight line there cannot be constructed two similar and unequal segments of circles on the same side. (sector;arc landed 2026-04-11.)
- [~] III.24 — Similar segments of circles on equal straight lines equal one another. (3-point `circle;radius`, `point;similar`, `polygon;equilateralTriangle`, `point;vertex`, `sector;arc` all landed by 2026-04-12.)
- [~] III.25 — Given a segment of a circle, to describe the complete circle of which it is a segment. (sector;arc landed 2026-04-11.)
- [~] III.26 — In equal circles equal angles stand on equal circumferences whether they stand at the centers or at the circumferences. (3-point `circle;radius` + `point;similar` both landed 2026-04-12.)
- [~] III.27 — In equal circles angles standing on equal circumferences equal one another whether they stand at the centers or at the circumferences. (3-point `circle;radius` + `point;similar` both landed 2026-04-12.)
- [~] III.28 — In equal circles equal straight lines cut off equal circumferences, the greater circumference equals the greater and the less equals the less. (3-point `circle;radius` + `point;similar` both landed 2026-04-12.)
- [~] III.29 — In equal circles straight lines that cut off equal circumferences are equal. (3-point `circle;radius` + `point;similar` both landed 2026-04-12.)
- [~] III.30 — To bisect a given circumference. (sector;arc landed 2026-04-11.)
- [~] III.31 — In a circle the angle in the semicircle is right, that in a greater segment less than a right angle, and that in a less segment greater than a right angle…
- [~] III.32 — If a straight line touches a circle, and from the point of contact there is drawn across, in the circle, a straight line cutting the circle, then the angles which it makes with the tangent equal the angles in the alternate segments of the circle.
- [~] III.33 — On a given straight line to describe a segment of a circle admitting an angle equal to a given rectilinear angle. (`point;similar` landed 2026-04-12.)
- [~] III.34 — From a given circle to cut off a segment admitting an angle equal to a given rectilinear angle. (`point;similar` landed 2026-04-12; `line;chord` landed 2026-04-11.)
- [~] III.35 — If in a circle two straight lines cut one another, then the rectangle contained by the segments of the one equals the rectangle contained by the segments of the other.
- [~] III.36 — If a point is taken outside a circle and two straight lines fall from it on the circle, and if one of them cuts the circle and the other touches it… (`line;chord` landed 2026-04-11.)
- [~] III.37 — If a point is taken outside a circle and from the point there fall on the circle two straight lines… (`line;chord` landed 2026-04-11.)

---

## Books IV–XIII (future scope)

These books will be converted once all construction types are fully implemented.

| Book | Propositions | Topic |
|------|-------------|-------|
| IV | 16 | Inscribed and circumscribed figures |
| V | 25 | Theory of proportion (Eudoxus) |
| VI | 33 | Similar figures |
| VII | 39 | Number theory — divisibility |
| VIII | 27 | Geometric sequences |
| IX | 36 | More number theory |
| X | 115 | Incommensurable magnitudes |
| XI | 39 | Solid geometry — planes, parallelepipeds |
| XII | 18 | Measurement of figures (method of exhaustion) |
| XIII | 18 | Regular solids (Platonic solids) |

Source HTML: `view/euclid-html/bookiv/` through `view/euclid-html/bookxiii/`
