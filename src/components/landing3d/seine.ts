import * as THREE from "three";
import { SEINE, SEINE_WIDTH } from "./cityLayout";
import { streakTexture, auraTexture } from "./textures";

/**
 * The Seine: a dark ribbon following the river polyline, with scrolling
 * smeared light-streaks (fake reflections of the banks) and micro-sparkle.
 * Plus one stretched golden quad under the Eiffel — its reflection.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying float vFogDepth;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vFogDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform sampler2D uStreaks;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec2 vUv;
  varying float vFogDepth;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec3 col = vec3(0.012, 0.024, 0.06); // deep ink water
    // Two scrolling streak layers, slightly different speeds = shimmer.
    vec2 uv1 = vec2(vUv.x * 3.0, vUv.y * 8.0 + uTime * 0.015);
    vec2 uv2 = vec2(vUv.x * 5.0 + 0.37, vUv.y * 12.0 - uTime * 0.021);
    col += texture2D(uStreaks, uv1).rgb * 0.55;
    col += texture2D(uStreaks, uv2).rgb * 0.35;
    // Micro-sparkle: rare bright pinpoints that pop in and out.
    vec2 cell = floor(vUv * vec2(160.0, 900.0));
    float h = hash(cell);
    float tw = pow(max(0.0, sin(uTime * 1.4 + h * 44.0)), 30.0);
    col += vec3(1.0, 0.92, 0.7) * step(0.985, h) * tw * 1.6;

    float fogF = smoothstep(uFogNear, uFogFar, vFogDepth);
    col = mix(col, uFogColor, fogF * 0.85);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function buildSeine(fog: { color: THREE.Color; near: number; far: number }): {
  group: THREE.Group;
  materials: THREE.ShaderMaterial[];
} {
  const group = new THREE.Group();

  // Ribbon strip along the polyline.
  const pts = SEINE.map(([x, z]) => new THREE.Vector2(x, z));
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const dir = next.clone().sub(prev).normalize();
    const nrm = new THREE.Vector2(-dir.y, dir.x).multiplyScalar(SEINE_WIDTH * 0.5);
    const v = i / (pts.length - 1);
    positions.push(pts[i].x - nrm.x, -0.4, pts[i].y - nrm.y);
    positions.push(pts[i].x + nrm.x, -0.4, pts[i].y + nrm.y);
    uvs.push(0, v, 1, v);
    if (i < pts.length - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uStreaks: { value: streakTexture() },
      uFogColor: { value: fog.color },
      uFogNear: { value: fog.near },
      uFogFar: { value: fog.far },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });
  group.add(new THREE.Mesh(geo, mat));

  // The tower's golden reflection: a long soft quad on the water near the tower.
  const refl = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 60),
    new THREE.MeshBasicMaterial({
      map: auraTexture(128, "255,206,120"),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  refl.rotation.x = -Math.PI / 2;
  refl.position.set(-15, -0.3, 5);
  refl.scale.set(1, 1.6, 1);
  group.add(refl);

  return { group, materials: [mat] };
}
