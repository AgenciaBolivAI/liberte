import * as THREE from "three";
import { AVENUES, SEINE, mulberry32, isExcluded } from "./cityLayout";
import { glowTexture } from "./textures";

/**
 * The living light of the city: street lamps, moving car-light trails along
 * the avenues, and one bateau-mouche gliding the Seine. 3 draw calls.
 */

function polylinePoint(
  line: [number, number][],
  t: number,
): { x: number; z: number; dx: number; dz: number } {
  const segs = line.length - 1;
  const ft = Math.min(0.9999, Math.max(0, t)) * segs;
  const i = Math.floor(ft);
  const lt = ft - i;
  const [ax, az] = line[i];
  const [bx, bz] = line[i + 1];
  return { x: ax + (bx - ax) * lt, z: az + (bz - az) * lt, dx: bx - ax, dz: bz - az };
}

/** Street lamps: along the avenues, the quays and scattered on the grid. */
export function buildLamps(count: number): THREE.Points {
  const rnd = mulberry32(1900);
  const pos = new Float32Array(count * 3);
  let n = 0;
  const place = (x: number, z: number) => {
    if (n >= count) return;
    pos[n * 3] = x;
    pos[n * 3 + 1] = 1.6;
    pos[n * 3 + 2] = z;
    n++;
  };
  // Avenues + quays first (they read as strings of pearls from above)…
  for (const a of AVENUES) {
    for (let i = 0; i < count * 0.08; i++) {
      const p = polylinePoint(a, rnd());
      const len = Math.hypot(p.dx, p.dz) || 1;
      const side = rnd() < 0.5 ? 1 : -1;
      place(p.x + (-p.dz / len) * 3 * side, p.z + (p.dx / len) * 3 * side);
    }
  }
  for (let i = 0; i < count * 0.18; i++) {
    const p = polylinePoint(SEINE, rnd());
    const len = Math.hypot(p.dx, p.dz) || 1;
    const side = rnd() < 0.5 ? 1 : -1;
    place(p.x + (-p.dz / len) * 9.5 * side, p.z + (p.dx / len) * 9.5 * side);
  }
  // …then the general fabric.
  let guard = 0;
  while (n < count && guard < count * 10) {
    guard++;
    const x = (rnd() - 0.5) * 380;
    const z = (rnd() - 0.5) * 440;
    if (isExcluded(x, z)) continue;
    place(x, z);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      map: glowTexture(64, "#ffd27a"),
      color: new THREE.Color("#e8b45a"),
      size: 2.4,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }),
  );
  pts.frustumCulled = false;
  return pts;
}

/**
 * Car-light trails: short stretched dashes advected along the avenue polylines
 * in the vertex shader. Outbound dashes are white-gold, inbound soft red —
 * from above they read as the moving arteries radiating from l'Étoile.
 */
export function buildTrails(dashCount: number): {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
} {
  // Pack avenue polylines into a uniform array (max 5 avenues × 3 points).
  const flat: number[] = [];
  for (const a of AVENUES) {
    const p0 = a[0];
    const p1 = a[1];
    const p2 = a[a.length - 1];
    flat.push(p0[0], p0[1], p1[0], p1[1], p2[0], p2[1]);
  }

  const geo = new THREE.PlaneGeometry(0.5, 2.6);
  geo.rotateX(-Math.PI / 2); // lie flat on the road
  const inst = new THREE.InstancedBufferGeometry();
  inst.index = geo.index;
  inst.attributes.position = geo.attributes.position;
  inst.attributes.uv = geo.attributes.uv;

  const rnd = mulberry32(2024);
  const aAvenue = new Float32Array(dashCount);
  const aOffset = new Float32Array(dashCount);
  const aSpeed = new Float32Array(dashCount);
  const aDir = new Float32Array(dashCount);
  const aLane = new Float32Array(dashCount);
  for (let i = 0; i < dashCount; i++) {
    aAvenue[i] = Math.floor(rnd() * AVENUES.length);
    aOffset[i] = rnd();
    aSpeed[i] = 0.014 + rnd() * 0.02;
    aDir[i] = rnd() < 0.5 ? 1 : -1;
    aLane[i] = (rnd() < 0.5 ? 1 : -1) * (0.8 + rnd() * 0.9);
  }
  inst.setAttribute("aAvenue", new THREE.InstancedBufferAttribute(aAvenue, 1));
  inst.setAttribute("aOffset", new THREE.InstancedBufferAttribute(aOffset, 1));
  inst.setAttribute("aSpeed", new THREE.InstancedBufferAttribute(aSpeed, 1));
  inst.setAttribute("aDir", new THREE.InstancedBufferAttribute(aDir, 1));
  inst.setAttribute("aLane", new THREE.InstancedBufferAttribute(aLane, 1));
  inst.instanceCount = dashCount;

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAvenues: { value: flat }, // 5 avenues × 6 floats
    },
    vertexShader: /* glsl */ `
      attribute float aAvenue;
      attribute float aOffset;
      attribute float aSpeed;
      attribute float aDir;
      attribute float aLane;
      uniform float uTime;
      uniform float uAvenues[30];
      varying float vDir;
      varying vec2 vUv;

      vec2 avenuePoint(int av, float t) {
        int base = av * 6;
        vec2 p0 = vec2(uAvenues[base], uAvenues[base + 1]);
        vec2 p1 = vec2(uAvenues[base + 2], uAvenues[base + 3]);
        vec2 p2 = vec2(uAvenues[base + 4], uAvenues[base + 5]);
        // Two-segment polyline, equal parameter split.
        return t < 0.5 ? mix(p0, p1, t * 2.0) : mix(p1, p2, (t - 0.5) * 2.0);
      }

      void main() {
        int av = int(aAvenue + 0.5);
        float t = fract(aOffset + uTime * aSpeed * aDir);
        vec2 c = avenuePoint(av, t);
        vec2 c2 = avenuePoint(av, min(0.999, t + 0.01));
        vec2 dir = normalize(c2 - c + vec2(0.0001));
        vec2 nrm = vec2(-dir.y, dir.x);
        vec2 world2 = c + nrm * aLane;
        // Orient the dash along the road: rotate local x/z by the direction.
        vec3 local = position;
        vec3 world = vec3(
          world2.x + local.x * nrm.x + local.z * dir.x,
          0.25,
          world2.y + local.x * nrm.y + local.z * dir.y
        );
        vDir = aDir;
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vDir;
      varying vec2 vUv;
      void main() {
        // Soft-edged dash; headlights white-gold, tail-lights red.
        float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x)
                   * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
        vec3 col = vDir > 0.0 ? vec3(1.0, 0.93, 0.72) : vec3(1.0, 0.32, 0.22);
        gl_FragColor = vec4(col, edge * 0.85);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const mesh = new THREE.Mesh(inst, mat);
  mesh.frustumCulled = false;
  return { mesh, material: mat };
}

/** One blue bateau-mouche gliding the river, forever. */
export function buildBateau(): { sprite: THREE.Sprite; tick: (t: number) => void } {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(64, "#9bd4ff"),
      color: new THREE.Color("#4bb1ec"),
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  sprite.scale.set(6, 2.2, 1);
  const tick = (t: number) => {
    const cycle = (t * 0.008) % 1;
    const p = polylinePoint(SEINE, cycle);
    sprite.position.set(p.x, 0.6, p.z);
  };
  tick(0);
  return { sprite, tick };
}
