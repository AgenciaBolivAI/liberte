import * as THREE from "three";

/**
 * Real-Paris geodesy. Google's Photorealistic 3D Tiles arrive in ECEF (earth-
 * centered) coordinates; this module produces the ONE matrix that plants the
 * real Eiffel Tower at our scene origin, +y up, north toward −z — so the whole
 * flight rig, sky and sparkle overlays work unchanged on the real city.
 *
 * Scale: the real tower is ~330 m; our procedural one is 90 units. s = 90/330
 * keeps every camera height/FOV in the choreography meaningful.
 */

export const SCALE = 90 / 330; // world units per meter

// WGS84
const A = 6378137;
const E2 = 6.69437999014e-3;

export const ANCHOR = {
  lat: 48.85837, // Tour Eiffel
  lon: 2.294481,
  /** Ellipsoidal height of ground level at the tower (≈ geoid 44 m + alt 34 m). */
  height: 78,
};

const DEG = Math.PI / 180;

function ecef(latDeg: number, lonDeg: number, h: number): THREE.Vector3 {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const n = A / Math.sqrt(1 - E2 * sinLat * sinLat);
  return new THREE.Vector3(
    (n + h) * cosLat * Math.cos(lon),
    (n + h) * cosLat * Math.sin(lon),
    (n * (1 - E2) + h) * sinLat,
  );
}

/**
 * Matrix that maps tile ECEF coordinates into our local frame:
 * anchor → origin, x = east, y = up, z = south. Uniformly scaled by SCALE.
 */
export function tilesToLocalMatrix(): THREE.Matrix4 {
  const lat = ANCHOR.lat * DEG;
  const lon = ANCHOR.lon * DEG;
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const sinLon = Math.sin(lon);
  const cosLon = Math.cos(lon);

  const up = new THREE.Vector3(cosLat * cosLon, cosLat * sinLon, sinLat);
  const east = new THREE.Vector3(-sinLon, cosLon, 0);
  const north = new THREE.Vector3().crossVectors(up, east);
  const origin = ecef(ANCHOR.lat, ANCHOR.lon, ANCHOR.height);

  // ECEF-from-local basis: x=east, y=up, z=−north (right-handed), then invert.
  const m = new THREE.Matrix4().makeBasis(east, up, north.clone().negate());
  m.setPosition(origin);
  m.invert();
  return new THREE.Matrix4().makeScale(SCALE, SCALE, SCALE).multiply(m);
}

/** Ground-level offset of a landmark relative to the anchor, in local units. */
export function geoToLocal(latDeg: number, lonDeg: number, heightM = 0): [number, number, number] {
  // Equirectangular around the anchor — sub-meter accurate at city scale.
  const northM = (latDeg - ANCHOR.lat) * DEG * A;
  const eastM = (lonDeg - ANCHOR.lon) * DEG * A * Math.cos(ANCHOR.lat * DEG);
  return [eastM * SCALE, heightM * SCALE, -northM * SCALE];
}

/* Real landmark positions (local units; y = height above tower-base ground). */
export const REAL = {
  eiffel: [0, 0, 0] as [number, number, number],
  louvre: geoToLocal(48.861057, 2.335931, 0), // ~(828, ·, −82) east along the Seine
  sacreCoeur: geoToLocal(48.886705, 2.343104, 95), // on the Montmartre butte
  arc: geoToLocal(48.873792, 2.295028, 0), // ~(11, ·, −468) due north
  concorde: geoToLocal(48.865633, 2.321236, 0), // via point on the river route
  invalides: geoToLocal(48.856613, 2.312622, 0),
  operaGarnier: geoToLocal(48.87206, 2.331864, 0),
  trocadero: geoToLocal(48.861596, 2.288974, 0),
};
