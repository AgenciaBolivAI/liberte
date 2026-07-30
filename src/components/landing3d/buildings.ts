import * as THREE from "three";
import { generateBuildings, generateDefense, type BuildingInstance } from "./cityLayout";

/**
 * The whole city fabric in TWO draw calls.
 *
 * One InstancedMesh of unit boxes; the fragment shader paints a window grid in
 * METRIC space (object-space position × the instance's world scale), so window
 * size is constant regardless of building size — nothing stretches. A hash of
 * (instance seed, window cell) decides which windows are lit; lit cells get a
 * warm gold emissive with per-window intensity jitter and a very slow flicker.
 */

const VERT = /* glsl */ `
  attribute float aSeed;
  attribute vec3 aScale;
  varying vec3 vLocal;   // metric object-space position (already scaled)
  varying vec3 vNormalW;
  varying float vSeed;
  varying float vHeight;
  varying float vFogDepth;
  void main() {
    vLocal = position * aScale;
    vSeed = aSeed;
    vHeight = aScale.y;
    vNormalW = normalize(mat3(instanceMatrix) * normal);
    vec4 world = instanceMatrix * vec4(position, 1.0);
    vec4 mv = viewMatrix * world;
    vFogDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uBodyColor;
  uniform vec3 uWindowColor;
  uniform float uLitRatio;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec3 vLocal;
  varying vec3 vNormalW;
  varying float vSeed;
  varying float vHeight;
  varying float vFogDepth;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    // Ink body with a slight vertical gradient (ambient city glow from below).
    float up = clamp(vLocal.y / max(vHeight, 0.001) + 0.5, 0.0, 1.0);
    vec3 col = uBodyColor * (0.55 + 0.45 * up);

    // Windows only on the vertical faces.
    if (abs(vNormalW.y) < 0.5) {
      // Choose the facade axis: x-facing walls grid on (z,y), z-facing on (x,y).
      vec2 facade = abs(vNormalW.x) > abs(vNormalW.z) ? vLocal.zy : vLocal.xy;
      vec2 cellSize = vec2(1.15, 1.35);
      vec2 cell = floor(facade / cellSize);
      vec2 f = fract(facade / cellSize);
      // Window pane occupies the middle of the cell.
      float pane = step(0.22, f.x) * step(f.x, 0.78) * step(0.25, f.y) * step(f.y, 0.72);
      float h = hash(cell + vec2(vSeed * 913.0, vSeed * 517.0));
      float lit = step(1.0 - uLitRatio, h);
      // Per-window brightness jitter + a very slow breathing flicker.
      float glow = 0.55 + 0.45 * hash(cell + vec2(7.3, vSeed * 91.0));
      float flicker = 0.9 + 0.1 * sin(uTime * 0.7 + h * 40.0);
      col += uWindowColor * pane * lit * glow * flicker * 1.6;
    }

    // Standard linear fog.
    float fogF = smoothstep(uFogNear, uFogFar, vFogDepth);
    col = mix(col, uFogColor, fogF);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export type CityFabric = {
  mesh: THREE.InstancedMesh;
  material: THREE.ShaderMaterial;
};

function buildInstanced(
  instances: BuildingInstance[],
  windowColor: THREE.Color,
  litRatio: number,
  fog: { color: THREE.Color; near: number; far: number },
): CityFabric {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0); // pivot at the base

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBodyColor: { value: new THREE.Color("#0d1226") },
      uWindowColor: { value: windowColor },
      uLitRatio: { value: litRatio },
      uFogColor: { value: fog.color },
      uFogNear: { value: fog.near },
      uFogFar: { value: fog.far },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });

  const mesh = new THREE.InstancedMesh(geo, mat, instances.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const seeds = new Float32Array(instances.length);
  const scales = new Float32Array(instances.length * 3);

  instances.forEach((b, i) => {
    q.setFromAxisAngle(up, b.rot);
    m.compose(new THREE.Vector3(b.x, b.y, b.z), q, new THREE.Vector3(b.w, b.h, b.d));
    mesh.setMatrixAt(i, m);
    seeds[i] = b.seed;
    scales[i * 3] = b.w;
    scales[i * 3 + 1] = b.h;
    scales[i * 3 + 2] = b.d;
  });

  geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
  geo.setAttribute("aScale", new THREE.InstancedBufferAttribute(scales, 3));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false; // one interleaved city, always mostly visible
  return { mesh, material: mat };
}

export function buildCity(
  buildingCount: number,
  defenseCount: number,
  fog: { color: THREE.Color; near: number; far: number },
): { group: THREE.Group; materials: THREE.ShaderMaterial[] } {
  const group = new THREE.Group();
  const paris = buildInstanced(
    generateBuildings(buildingCount),
    new THREE.Color("#eac55b"),
    0.28,
    fog,
  );
  const defense = buildInstanced(
    generateDefense(defenseCount),
    new THREE.Color("#4bb1ec"),
    0.4,
    fog,
  );
  group.add(paris.mesh, defense.mesh);
  return { group, materials: [paris.material, defense.material] };
}
