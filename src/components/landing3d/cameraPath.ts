import * as THREE from "three";

/**
 * The flight path. Seven stops (one per landing section), each reached through
 * authored via-points on a per-segment centripetal Catmull-Rom — per-segment
 * (not one global spline) so every stop frames its landmark EXACTLY, and
 * smootherstep easing gives zero velocity at stops, hiding segment seams while
 * the visitor reads the section.
 */

type Stop = { p: [number, number, number]; t: [number, number, number]; fov: number };

// Camera position (p), lookAt target (t), fov — per flight stop.
const STOPS: Stop[] = [
  { p: [44, 58, 132], t: [0, 42, 4], fov: 60 }, // 0 hero — tower fills frame
  { p: [-46, 8, -106], t: [-60, 0, -134], fov: 55 }, // 1 months — Louvre pyramid
  { p: [60, 16, -80], t: [118, 2, -158], fov: 52 }, // 2 method — Sacré-Cœur crowns the top strip
  { p: [38, 11.2, 34], t: [0, 32, 0], fov: 55 }, // 3 AI — over the café tables to the tower
  { p: [44, 21, -98], t: [88, 8, -52], fov: 55 }, // 4 form — Arc de Triomphe
  { p: [26, 92, -30], t: [14, 0, -66], fov: 50 }, // 5 FAQ — above the roofs
  { p: [-34, 58, 226], t: [2, 34, -10], fov: 46 }, // 6 footer — panorama
];

// Via points shaping the move INTO each stop (world coords).
const VIAS: Record<number, [number, number, number][]> = {
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

function v3(a: [number, number, number]): THREE.Vector3 {
  return new THREE.Vector3(a[0], a[1], a[2]);
}

const posCurves: THREE.CatmullRomCurve3[] = [];
const tgtCurves: THREE.CatmullRomCurve3[] = [];
for (let i = 0; i < STOPS.length - 1; i++) {
  const vias = VIAS[i + 1] ?? [];
  posCurves.push(
    new THREE.CatmullRomCurve3(
      [v3(STOPS[i].p), ...vias.map(v3), v3(STOPS[i + 1].p)],
      false,
      "centripetal",
    ),
  );
  // Targets travel a simpler path: previous target → next target (via the
  // midpoint of the vias when present, so the gaze sweeps with the flight).
  const tgtVias =
    vias.length > 0 ? [v3(vias[Math.floor(vias.length / 2)]).setY(STOPS[i + 1].t[1] + 6)] : [];
  tgtCurves.push(
    new THREE.CatmullRomCurve3(
      [v3(STOPS[i].t), ...tgtVias, v3(STOPS[i + 1].t)],
      false,
      "centripetal",
    ),
  );
}

export const STOP_COUNT = STOPS.length;

function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Sample the flight at progress p ∈ [0, STOP_COUNT−1]. Allocation-free. */
export function samplePose(
  p: number,
  outPos: THREE.Vector3,
  outTarget: THREE.Vector3,
): { fov: number } {
  const clamped = Math.max(0, Math.min(STOP_COUNT - 1, p));
  const seg = Math.min(STOP_COUNT - 2, Math.floor(clamped));
  const raw = clamped - seg;
  const t = smootherstep(raw);
  posCurves[seg].getPoint(t, outPos);
  tgtCurves[seg].getPoint(t, outTarget);
  const fov = THREE.MathUtils.lerp(STOPS[seg].fov, STOPS[seg + 1].fov, t);
  return { fov };
}

/** Flight heading at p (for banking). Cheap finite difference. */
const _h1 = new THREE.Vector3();
const _h2 = new THREE.Vector3();
const _tmp = new THREE.Vector3();
export function sampleHeading(p: number): number {
  samplePose(p, _h1, _tmp);
  samplePose(p + 0.02, _h2, _tmp);
  return Math.atan2(_h2.x - _h1.x, _h2.z - _h1.z);
}
