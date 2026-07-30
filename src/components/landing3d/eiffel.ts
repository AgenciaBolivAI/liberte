import * as THREE from "three";
import { EIFFEL, mulberry32 } from "./cityLayout";
import { glowTexture, auraTexture } from "./textures";

/**
 * The Eiffel Tower, entirely parametric — no model download.
 *
 * Silhouette: half-width f(y) = 12·e^(−y/34) + 0.6 (near-exponential taper,
 * close to the real profile). Below the second platform the four legs are
 * separate curved lattices; above, one tapering column. All struts live in a
 * single InstancedMesh; the gold "iron" glow is the material itself (the real
 * tower is floodlit amber at night), plus a Points layer of warm lamps and the
 * famous champagne SPARKLE as additive white points with random phases.
 */

const H = EIFFEL.height; // 90
const LEG_TOP = 45;

function halfWidth(y: number): number {
  return 12 * Math.exp(-y / 34) + 0.6;
}

type Strut = { pos: THREE.Vector3; quat: THREE.Quaternion; len: number; thick: number };

function strutBetween(a: THREE.Vector3, b: THREE.Vector3, thick: number): Strut {
  const dir = b.clone().sub(a);
  const len = dir.length();
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  );
  return { pos: a.clone().add(b).multiplyScalar(0.5), quat, len, thick };
}

function buildStruts(): Strut[] {
  const struts: Strut[] = [];
  const cornerDirs = [
    new THREE.Vector2(1, 1),
    new THREE.Vector2(1, -1),
    new THREE.Vector2(-1, 1),
    new THREE.Vector2(-1, -1),
  ].map((v) => v.normalize());

  // --- Four curved legs up to LEG_TOP ---
  const legSegs = 10;
  for (const dir of cornerDirs) {
    // Each leg is itself a small 4-cornered lattice around its curved centerline.
    const legPts: THREE.Vector3[][] = [];
    for (let s = 0; s <= legSegs; s++) {
      const y = (s / legSegs) * LEG_TOP;
      const w = halfWidth(y);
      const cx = dir.x * w;
      const cz = dir.y * w;
      const r = Math.max(0.5, 2.2 * (1 - y / (LEG_TOP * 1.35))); // leg cross-section shrinks
      legPts.push([
        new THREE.Vector3(cx - r, y, cz - r),
        new THREE.Vector3(cx + r, y, cz - r),
        new THREE.Vector3(cx + r, y, cz + r),
        new THREE.Vector3(cx - r, y, cz + r),
      ]);
    }
    for (let s = 0; s < legSegs; s++) {
      for (let k = 0; k < 4; k++) {
        // Vertical edge struts
        struts.push(strutBetween(legPts[s][k], legPts[s + 1][k], 0.32));
        // Diagonal cross-braces (alternate direction per level for the X look)
        const k2 = (k + 1) % 4;
        if ((s + k) % 2 === 0) struts.push(strutBetween(legPts[s][k], legPts[s + 1][k2], 0.16));
        else struts.push(strutBetween(legPts[s][k2], legPts[s + 1][k], 0.16));
      }
      // Horizontal ring every other segment
      if (s % 2 === 0) {
        for (let k = 0; k < 4; k++) {
          struts.push(strutBetween(legPts[s][k], legPts[s][(k + 1) % 4], 0.14));
        }
      }
    }
  }

  // --- Upper column: one tapering square lattice from LEG_TOP to H ---
  const colSegs = 8;
  const colPts: THREE.Vector3[][] = [];
  for (let s = 0; s <= colSegs; s++) {
    const y = LEG_TOP + (s / colSegs) * (H - LEG_TOP);
    const w = halfWidth(y);
    colPts.push([
      new THREE.Vector3(-w, y, -w),
      new THREE.Vector3(w, y, -w),
      new THREE.Vector3(w, y, w),
      new THREE.Vector3(-w, y, w),
    ]);
  }
  for (let s = 0; s < colSegs; s++) {
    for (let k = 0; k < 4; k++) {
      struts.push(strutBetween(colPts[s][k], colPts[s + 1][k], 0.3));
      const k2 = (k + 1) % 4;
      if ((s + k) % 2 === 0) struts.push(strutBetween(colPts[s][k], colPts[s + 1][k2], 0.14));
      else struts.push(strutBetween(colPts[s][k2], colPts[s + 1][k], 0.14));
      struts.push(strutBetween(colPts[s][k], colPts[s][(k + 1) % 4], 0.12));
    }
  }

  // --- Big arch braces between neighbouring legs near the ground (the arcs) ---
  for (let i = 0; i < 4; i++) {
    const a = cornerDirs[i];
    const b = cornerDirs[[1, 3, 0, 2][i]]; // adjacent corner
    for (let s = 0; s < 5; s++) {
      const t0 = s / 5;
      const t1 = (s + 1) / 5;
      const arc = (t: number) => {
        const y = 4 + Math.sin(t * Math.PI) * 12;
        const w = halfWidth(y) * 1.02;
        const x = THREE.MathUtils.lerp(a.x * w, b.x * w, t);
        const z = THREE.MathUtils.lerp(a.y * w, b.y * w, t);
        return new THREE.Vector3(x, y, z);
      };
      struts.push(strutBetween(arc(t0), arc(t1), 0.2));
    }
  }

  return struts;
}

export function buildEiffel(
  towerLightCount: number,
  sparkleCount: number,
): { group: THREE.Group; materials: THREE.ShaderMaterial[]; tick: (t: number) => void } {
  const group = new THREE.Group();
  const struts = buildStruts();

  // All struts in one InstancedMesh — self-lit amber "iron".
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#c8871e") });
  const mesh = new THREE.InstancedMesh(geo, mat, struts.length);
  const m = new THREE.Matrix4();
  struts.forEach((s, i) => {
    m.compose(s.pos, s.quat, new THREE.Vector3(s.thick, s.len, s.thick));
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  group.add(mesh);

  // Platforms at the real heights.
  const platMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#5c3d0e") });
  for (const [y, scale] of [
    [18, 1.5],
    [35, 1.35],
    [82, 1.25],
  ] as const) {
    const w = halfWidth(y) * scale;
    const plat = new THREE.Mesh(new THREE.BoxGeometry(w * 2, 0.45, w * 2), platMat);
    plat.position.y = y;
    group.add(plat);
  }
  // Antenna
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 8, 6), platMat);
  antenna.position.y = H + 3;
  group.add(antenna);

  // Warm lamp points sprinkled along the struts.
  const rnd = mulberry32(1889); // année de la tour
  const lampPos = new Float32Array(towerLightCount * 3);
  for (let i = 0; i < towerLightCount; i++) {
    const s = struts[Math.floor(rnd() * struts.length)];
    const t = rnd() - 0.5;
    const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(s.quat).multiplyScalar(s.len * t);
    lampPos[i * 3] = s.pos.x + dir.x;
    lampPos[i * 3 + 1] = s.pos.y + dir.y;
    lampPos[i * 3 + 2] = s.pos.z + dir.z;
  }
  const lampGeo = new THREE.BufferGeometry();
  lampGeo.setAttribute("position", new THREE.BufferAttribute(lampPos, 3));
  const lamps = new THREE.Points(
    lampGeo,
    new THREE.PointsMaterial({
      map: glowTexture(64, "#ffd27a"),
      color: new THREE.Color("#ffc25e"),
      size: 2.1,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }),
  );
  lamps.frustumCulled = false;
  group.add(lamps);

  // The champagne sparkle: white additive points, sharp random flashes.
  const spPos = new Float32Array(sparkleCount * 3);
  const spPhase = new Float32Array(sparkleCount);
  for (let i = 0; i < sparkleCount; i++) {
    const s = struts[Math.floor(rnd() * struts.length)];
    spPos[i * 3] = s.pos.x + (rnd() - 0.5) * 1.5;
    spPos[i * 3 + 1] = s.pos.y + (rnd() - 0.5) * s.len;
    spPos[i * 3 + 2] = s.pos.z + (rnd() - 0.5) * 1.5;
    spPhase[i] = rnd() * Math.PI * 2;
  }
  const spGeo = new THREE.BufferGeometry();
  spGeo.setAttribute("position", new THREE.BufferAttribute(spPos, 3));
  spGeo.setAttribute("aPhase", new THREE.BufferAttribute(spPhase, 1));
  const sparkleMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uMap: { value: glowTexture(64) } },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      uniform float uTime;
      varying float vFlash;
      void main() {
        // pow(...,24): each point is dark almost always, then flashes hard —
        // only a handful are lit at any instant, exactly like the real thing.
        vFlash = pow(max(0.0, sin(uTime * 2.1 + aPhase)), 24.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (3.0 + vFlash * 5.0) * (120.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      varying float vFlash;
      void main() {
        vec4 tex = texture2D(uMap, gl_PointCoord);
        gl_FragColor = vec4(vec3(1.0), tex.a * vFlash);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sparkles = new THREE.Points(spGeo, sparkleMat);
  sparkles.frustumCulled = false;
  group.add(sparkles);

  // Soft amber aura behind the tower — the bloom.
  const aura = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: auraTexture(256, "255,190,100"),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  aura.position.set(0, H * 0.45, 0);
  aura.scale.set(70, 95, 1);
  group.add(aura);

  // Red aircraft beacon on the antenna, slow blink (driven by uTime uniform).
  const beaconMat = new THREE.SpriteMaterial({
    map: glowTexture(64, "#ff5544"),
    color: new THREE.Color("#ff4433"),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const beacon = new THREE.Sprite(beaconMat);
  beacon.position.set(0, H + 7, 0);
  beacon.scale.setScalar(4);
  group.add(beacon);

  group.position.set(EIFFEL.x, 0, EIFFEL.z);

  const tick = (t: number) => {
    beaconMat.opacity = 0.25 + 0.75 * Math.max(0, Math.sin(t * 1.1));
  };
  return { group, materials: [sparkleMat], tick };
}
