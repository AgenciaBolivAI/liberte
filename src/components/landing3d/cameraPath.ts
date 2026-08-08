import * as THREE from "three";
import { REAL } from "./geo";

/**
 * Flight choreography. Seven stops (one per landing section), each reached
 * through authored via-points on per-segment centripetal Catmull-Roms —
 * per-segment (not one global spline) so every stop frames its landmark
 * EXACTLY, and smootherstep easing gives zero velocity at stops, hiding
 * segment seams while the visitor reads the section.
 *
 * Two flights share the machinery: the PROCEDURAL one over our stylized night
 * city, and the REAL one over Google's photogrammetry of the actual Paris
 * (same anchor: Eiffel Tower at origin, y-up, north = −z — see geo.ts).
 */

type Vec3 = [number, number, number];
type Stop = { p: Vec3; t: Vec3; fov: number };

export type Flight = {
  stopCount: number;
  samplePose: (p: number, outPos: THREE.Vector3, outTarget: THREE.Vector3) => { fov: number };
  sampleHeading: (p: number) => number;
};

function v3(a: Vec3): THREE.Vector3 {
  return new THREE.Vector3(a[0], a[1], a[2]);
}

function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function makeFlight(stops: Stop[], vias: Record<number, Vec3[]>): Flight {
  const posCurves: THREE.CatmullRomCurve3[] = [];
  const tgtCurves: THREE.CatmullRomCurve3[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const segVias = vias[i + 1] ?? [];
    posCurves.push(
      new THREE.CatmullRomCurve3(
        [v3(stops[i].p), ...segVias.map(v3), v3(stops[i + 1].p)],
        false,
        "centripetal",
      ),
    );
    // Targets travel a simpler path: previous target → next target (via the
    // midpoint of the vias when present, so the gaze sweeps with the flight).
    const tgtVias =
      segVias.length > 0
        ? [v3(segVias[Math.floor(segVias.length / 2)]).setY(stops[i + 1].t[1] + 6)]
        : [];
    tgtCurves.push(
      new THREE.CatmullRomCurve3(
        [v3(stops[i].t), ...tgtVias, v3(stops[i + 1].t)],
        false,
        "centripetal",
      ),
    );
  }

  const stopCount = stops.length;

  const samplePose: Flight["samplePose"] = (p, outPos, outTarget) => {
    const clamped = Math.max(0, Math.min(stopCount - 1, p));
    const seg = Math.min(stopCount - 2, Math.floor(clamped));
    const t = smootherstep(clamped - seg);
    posCurves[seg].getPoint(t, outPos);
    tgtCurves[seg].getPoint(t, outTarget);
    const fov = THREE.MathUtils.lerp(stops[seg].fov, stops[seg + 1].fov, t);
    return { fov };
  };

  const _h1 = new THREE.Vector3();
  const _h2 = new THREE.Vector3();
  const _tmp = new THREE.Vector3();
  const sampleHeading: Flight["sampleHeading"] = (p) => {
    samplePose(p, _h1, _tmp);
    samplePose(p + 0.02, _h2, _tmp);
    return Math.atan2(_h2.x - _h1.x, _h2.z - _h1.z);
  };

  return { stopCount, samplePose, sampleHeading };
}

/* ------------------------- procedural night city ------------------------- */

const STOPS: Stop[] = [
  { p: [44, 58, 132], t: [0, 42, 4], fov: 60 }, // 0 hero — tower fills frame
  { p: [-46, 8, -106], t: [-60, 0, -134], fov: 55 }, // 1 months — Louvre pyramid
  { p: [60, 16, -80], t: [118, 2, -158], fov: 52 }, // 2 method — Sacré-Cœur crowns the top strip
  { p: [38, 11.2, 34], t: [0, 32, 0], fov: 55 }, // 3 AI — over the café tables to the tower
  { p: [44, 21, -98], t: [88, 8, -52], fov: 55 }, // 4 form — Arc de Triomphe
  { p: [26, 92, -30], t: [14, 0, -66], fov: 50 }, // 5 FAQ — above the roofs
  { p: [-34, 58, 226], t: [2, 34, -10], fov: 46 }, // 6 footer — panorama
];

const VIAS: Record<number, Vec3[]> = {
  1: [
    [8, 26, 84],
    [-15, 7, -20],
    [-24, 6, -85],
  ], // dive + skim the Seine to the Louvre
  2: [
    [-20, 22, -150],
    [40, 34, -170],
  ], // bank over the right-bank rooftops
  3: [
    [94, 26, -92],
    [64, 16, -18],
  ], // glide down across the chimneys
  4: [
    [52, 13, 6],
    [96, 15, -34],
    [92, 17, -84],
  ], // sweep around the Arc
  5: [[30, 40, -60]], // straight climb
  6: [[-6, 84, 90]], // long pull-back across the river
};

export const proceduralFlight = makeFlight(STOPS, VIAS);

// Legacy aliases (CameraRig defaults + tests reference these).
export const STOP_COUNT = proceduralFlight.stopCount;
export const samplePose = proceduralFlight.samplePose;
export const sampleHeading = proceduralFlight.sampleHeading;

/* --------------------------- the REAL Paris ---------------------------- */

// Real geography is much bigger (Louvre ≈ 3 km east = ~830 units), so the legs
// between stops become fast, high glides and every stop keeps a respectful
// distance — Google's photogrammetry is gorgeous from 150 m out and melty wax
// up close, especially the tower lattice.

function off(base: Vec3, dx: number, dy: number, dz: number): Vec3 {
  return [base[0] + dx, base[1] + dy, base[2] + dz];
}

const R = REAL;

// Framing rule learned from the first pass: a steep top-down view of
// photogrammetry reads as an aerial MAP, not a city — landmarks vanish into
// the roofscape. Every stop therefore sits low enough (shallow pitch) that its
// landmark breaks the skyline, and far enough that the mesh stays crisp.
// 1 unit ≈ 3.67 m, so these offsets are ~200-400 m out and 70-160 m up.
const REAL_STOPS: Stop[] = [
  // 0 hero — over the Champ de Mars, the real tower filling the frame.
  { p: [52, 68, 138], t: [0, 46, 0], fov: 60 },
  // 1 months — low across the Seine so the palace wings + pyramid court read.
  { p: off(R.louvre, -46, 17, 62), t: off(R.louvre, 0, 6, 0), fov: 55 },
  // 2 method — level with the dome: the basilica against the sky on its butte.
  { p: off(R.sacreCoeur, -58, 6, 88), t: off(R.sacreCoeur, 0, 15, 0), fov: 52 },
  // 3 AI — the tower three-quarter, whole silhouette inside the frame.
  { p: [66, 40, 100], t: [0, 48, 0], fov: 55 },
  // 4 form — l'Étoile: high enough for the twelve avenues, low enough to see
  //   the Arc itself standing in the middle of them.
  { p: off(R.arc, -95, 15, 72), t: off(R.arc, 0, 10, 0), fov: 55 },
  // 5 FAQ — above the Right Bank but tilted to keep sky and horizon in shot.
  { p: off(R.operaGarnier, -42, 52, 96), t: off(R.operaGarnier, 14, 10, -95), fov: 50 },
  // 6 footer — the grand pull-back over the river, tower center frame.
  { p: [-140, 150, 560], t: [40, 40, -60], fov: 46 },
];

const REAL_VIAS: Record<number, Vec3[]> = {
  1: [[30, 40, 60], off(R.invalides, 20, 22, 10), off(R.concorde, -30, 18, 20)], // sweep east along the river: Invalides → Concorde → Louvre
  2: [off(R.operaGarnier, -40, 60, 30)], // climb over the Opéra toward the butte
  3: [off(R.trocadero, 30, 50, -20)], // swing back via Trocadéro
  4: [[-60, 40, -160], off(R.arc, -90, 36, -20)], // curl into the orbit from the south-west
  5: [off(R.arc, 60, 120, 60)],
  6: [[-40, 190, 240]],
};

export const realFlight = makeFlight(REAL_STOPS, REAL_VIAS);
