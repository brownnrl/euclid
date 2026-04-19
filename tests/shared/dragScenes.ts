/*----------------------------------------------------------------------+
|    Shared scenes for slate drag-coordinate tests                       |
|    (translateCoordinates / rotateCoordinates via simulated drags).     |
+----------------------------------------------------------------------*/

import {createCanvas} from "canvas";
import {Slate} from "../../src/Slate";
import {E, IConstructionInfo} from "../../src/index";
import {PointElement} from "../../src/elements/point/PointElement";
import {toElements} from "./testHelpers";

// propIV5a-style 2D scene: triangle ABC with circumcenter F.
// Dragging the midpoint D (non-draggable) exercises Slate.movePick's
// rotate branch (with pivot F) or translate branch (without pivot),
// propagating rotate()/translate() onto every element type in the scene.
export let pivotScene_data: IConstructionInfo[] = [
    { name: "A",       construction: E.Point.free,         params: [140, 40] },
    { name: "B",       construction: E.Point.free,         params: [50, 180] },
    { name: "C",       construction: E.Point.free,         params: [200, 180] },
    { name: "circABC", construction: E.Circle.circumcircle,params: ["A","B","C"] },
    { name: "triABC",  construction: E.Polygon.triangle,   params: ["A","B","C"] },
    { name: "D",       construction: E.Point.midpoint,     params: ["A","B"] },
    { name: "F",       construction: E.Point.center,       params: ["circABC"] },
    { name: "AF",      construction: E.Line.connect,       params: ["A","F"] },
];

export function buildPivotScene(): Slate {
    let slate = new Slate(createCanvas(250, 250));
    toElements(slate, pivotScene_data);
    // Picks use closestVisiblePoint which filters on vertexColor; buildScene
    // sets this in the snapshot path — do it here too.
    for (let e of slate.elements) {
        if (e instanceof PointElement) e.vertexColor = "black";
    }
    slate.elements.forEach(e => e.update());
    return slate;
}

// propXI11-style 3D scene: exercises FixedPoint, PerpendicularPlane,
// ParallelPlane, Perpendicular (point), LineSlider, PlaneSlider on a
// non-screen plane, and the 3D foot-of-perpendicular Foot element.
export let scene3d_data: IConstructionInfo[] = [
    { name: "origin",  construction: E.Point.free,          params: [120, 160] },
    { name: "x",       construction: E.Point.fixed,         params: [280, 160, 100] },
    { name: "yzplane", construction: E.Plane.perpendicular, params: ["origin","x"] },
    { name: "y",       construction: E.Point.planeSlider,   params: ["yzplane", -90, 260, 40] },
    { name: "xyplane", construction: E.Plane.threePoints,   params: ["origin","x","y"] },
    { name: "z1",      construction: E.Point.perpendicular, params: ["origin","y","yzplane"] },
    { name: "z",       construction: E.Point.lineSlider,    params: ["origin","z1",50,50,100] },
    { name: "Oz",      construction: E.Line.connect,        params: ["origin","z"] },
    { name: "ceiling", construction: E.Plane.parallel,      params: ["xyplane","z"] },
    { name: "A",       construction: E.Point.planeSlider,   params: ["ceiling", 140, 100, 180] },
    { name: "B",       construction: E.Point.planeSlider,   params: ["xyplane", 208, 270, 140] },
    { name: "C",       construction: E.Point.planeSlider,   params: ["xyplane", 245, 190, 80] },
    { name: "BC",      construction: E.Line.connect,        params: ["B","C"] },
    { name: "D",       construction: E.Point.foot,          params: ["A","BC"] },
    // point;perpendicular variant 5: point A, plane P, points C, D.
    // Constructs a PlanePerpendicularLine internally.
    { name: "Pperp",   construction: E.Point.perpendicular, params: ["B","xyplane","B","C"] },
];

export function buildScene3d(): Slate {
    let slate = new Slate(createCanvas(330, 330));
    toElements(slate, scene3d_data);
    for (let e of slate.elements) {
        if (e instanceof PointElement) e.vertexColor = "black";
    }
    slate.elements.forEach(e => e.update());
    return slate;
}

// Grab-bag scene covering the construction types whose translate() /
// rotate() methods were the long tail in the coverage report: RegularPolygon,
// Application, InvertCircle, SphereIntersection, CircleSlider, SphereSlider,
// Sector, Prism, Parallelepiped, Bichord.
export let specialized_data: IConstructionInfo[] = [
    { name: "A",    construction: E.Point.free,              params: [50, 50] },
    { name: "B",    construction: E.Point.free,              params: [140, 50] },
    { name: "C",    construction: E.Point.free,              params: [100, 140] },
    { name: "D",    construction: E.Point.free,              params: [50, 180] },
    { name: "c1",   construction: E.Circle.radius,           params: ["A","B"] },
    { name: "c2",   construction: E.Circle.radius,           params: ["B","A"] },
    { name: "bich", construction: E.Line.bichord,            params: ["c1","c2"] },
    { name: "P",    construction: E.Point.circleSlider,      params: ["c1", 120, 30] },
    { name: "inv",  construction: E.Circle.invert,           params: ["c1","c2"] },
    { name: "s1",   construction: E.Sphere.radius,           params: ["A","B"] },
    { name: "s2",   construction: E.Sphere.radius,           params: ["B","A"] },
    { name: "sInt", construction: E.Circle.intersection,     params: ["s1","s2"] },
    { name: "Q",    construction: E.Point.sphereSlider,      params: ["s1", 90, 70, 50] },
    { name: "reg",  construction: E.Polygon.regularPolygon,  params: ["A","B", 5] },
    { name: "poly", construction: E.Polygon.triangle,        params: ["A","B","C"] },
    { name: "app",  construction: E.Polygon.application,     params: ["poly", "A", "B", "C"] },
    { name: "sec",  construction: E.Sector.sector,           params: ["A","B","C"] },
    { name: "pep",  construction: E.Polyhedra.parallelepiped,params: ["A","B","C","D"] },
    { name: "M",    construction: E.Point.midpoint,          params: ["A","B"] },  // pick target
];

export function buildSpecializedScene(): Slate {
    let slate = new Slate(createCanvas(300, 300));
    toElements(slate, specialized_data);
    for (let e of slate.elements) {
        if (e instanceof PointElement) e.vertexColor = "black";
    }
    slate.elements.forEach(e => e.update());
    return slate;
}
