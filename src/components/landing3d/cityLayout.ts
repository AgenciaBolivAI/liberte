/**
 * The map of our Paris. Pure data + deterministic PRNG — no three.js, so the
 * layout logic is unit-testable and the same seed always builds the same city.
 *
 * Units: 1 ≈ 3.3 m. Eiffel Tower at the origin, +z toward the viewer's start.
 */

export const EIFFEL = { x: 0, z: 0, height: 90 } as const;
export const LOUVRE = { x: -58, z: -132 } as const;
export const SACRE_COEUR = { x: 118, y: 16, z: -158 } as const;
export const ARC = { x: 72, z: -64 } as const;
export const CAFE = { x: 30, y: 9, z: 26 } as const;
export const DEFENSE = { x: -150, z: 60 } as const;

/** The Seine, flowing roughly south→north on the tower's west side. */
export const SEINE: [number, number][] = [
  [-80, -210],
  [-48, -150],
  [-28, -95],
  [-14, -30],
  [-16, 40],
  [-40, 120],
  [-70, 220],
];
export const SEINE_WIDTH = 14;

/** Avenues radiating from l'Étoile (the Arc) — car-light trails run on these. */
export const AVENUES: [number, number][][] = [
  // Champs-Élysées equivalent, toward the Louvre
  [
    [ARC.x, ARC.z],
    [12, -104],
    [-40, -128],
  ],
  // Toward the river / tower
  [
    [ARC.x, ARC.z],
    [40, -20],
    [14, 14],
  ],
  // North
  [
    [ARC.x, ARC.z],
    [92, -120],
    [104, -146],
  ],
  // East
  [
    [ARC.x, ARC.z],
    [130, -52],
    [170, -44],
  ],
  // South-east sweep
  [
    [ARC.x, ARC.z],
    [96, 8],
    [120, 60],
  ],
];

/** Montmartre: a soft hill the Sacré-Cœur sits on. */
export function hillHeight(x: number, z: number): number {
  const dx = x - SACRE_COEUR.x;
  const dz = z - SACRE_COEUR.z;
  const d2 = dx * dx + dz * dz;
  const r = 55;
  if (d2 > r * r) return 0;
  const t = 1 - Math.sqrt(d2) / r;
  return SACRE_COEUR.y * t * t * (3 - 2 * t) * 0.999;
}

/** Deterministic PRNG — same city on every visit, every device. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function distToPolyline(x: number, z: number, line: [number, number][]): number {
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const [ax, az] = line[i];
    const [bx, bz] = line[i + 1];
    const abx = bx - ax;
    const abz = bz - az;
    const len2 = abx * abx + abz * abz || 1;
    let t = ((x - ax) * abx + (z - az) * abz) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = ax + abx * t - x;
    const pz = az + abz * t - z;
    best = Math.min(best, px * px + pz * pz);
  }
  return Math.sqrt(best);
}

const LANDMARK_PADS: { x: number; z: number; r: number }[] = [
  { x: EIFFEL.x, z: EIFFEL.z, r: 30 },
  { x: LOUVRE.x, z: LOUVRE.z, r: 30 },
  { x: SACRE_COEUR.x, z: SACRE_COEUR.z, r: 22 },
  { x: ARC.x, z: ARC.z, r: 16 },
  { x: CAFE.x, z: CAFE.z, r: 0 }, // café sits ON a building — no exclusion
];

export function isExcluded(x: number, z: number): boolean {
  if (distToPolyline(x, z, SEINE) < SEINE_WIDTH * 0.5 + 4) return true;
  for (const a of AVENUES) if (distToPolyline(x, z, a) < 4.5) return true;
  for (const p of LANDMARK_PADS) {
    const dx = x - p.x;
    const dz = z - p.z;
    if (dx * dx + dz * dz < p.r * p.r) return true;
  }
  return false;
}

export type BuildingInstance = {
  x: number;
  z: number;
  y: number;
  w: number;
  h: number;
  d: number;
  rot: number;
  seed: number;
};

/** Haussmann-ish jittered grid. Deterministic; count-limited per tier. */
export function generateBuildings(count: number, seed = 20260730): BuildingInstance[] {
  const rnd = mulberry32(seed);
  const out: BuildingInstance[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 12) {
    guard++;
    const gx = Math.floor(rnd() * 50) - 25;
    const gz = Math.floor(rnd() * 58) - 29;
    const x = gx * 8 + (rnd() - 0.5) * 4.6;
    const z = gz * 8 + (rnd() - 0.5) * 4.6;
    if (Math.abs(x) > 200 || Math.abs(z) > 230) continue;
    if (isExcluded(x, z)) continue;
    // Haussmann fabric: mostly 4-8, occasionally taller toward the edges.
    const edge = Math.min(1, (Math.abs(x) + Math.abs(z)) / 300);
    const h = 4 + rnd() * 4 + (rnd() < 0.06 ? rnd() * 10 * edge : 0);
    out.push({
      x,
      z,
      y: hillHeight(x, z),
      w: 4.4 + rnd() * 3.2,
      h,
      d: 4.4 + rnd() * 3.2,
      rot: (rnd() - 0.5) * 0.14,
      seed: rnd(),
    });
  }
  return out;
}

/** The La Défense cluster: taller slabs, cool blue windows, far background. */
export function generateDefense(count: number, seed = 777): BuildingInstance[] {
  const rnd = mulberry32(seed);
  const out: BuildingInstance[] = [];
  for (let i = 0; i < count; i++) {
    const x = DEFENSE.x + (rnd() - 0.5) * 70;
    const z = DEFENSE.z + (rnd() - 0.5) * 70;
    out.push({
      x,
      z,
      y: 0,
      w: 5 + rnd() * 5,
      h: 14 + rnd() * 22,
      d: 5 + rnd() * 5,
      rot: (rnd() - 0.5) * 0.2,
      seed: rnd(),
    });
  }
  return out;
}
