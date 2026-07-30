import * as THREE from "three";
import { moonTexture, glowTexture } from "./textures";
import { mulberry32 } from "./cityLayout";

/** Night sky: gradient dome, twinkling stars, one moon. 3 draw calls. */

const DOME_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DOME_FRAG = /* glsl */ `
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    vec3 zenith = vec3(0.039, 0.063, 0.161);   // #0A1029
    vec3 horizon = vec3(0.239, 0.333, 0.537);  // #3D5589
    vec3 col = mix(horizon, zenith, pow(h, 0.55));
    // Warm city-glow band hugging the horizon.
    float band = exp(-vDir.y * vDir.y * 55.0);
    col += vec3(0.30, 0.22, 0.10) * band * 0.55;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const STAR_VERT = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime;
  varying float vAlpha;
  void main() {
    float tw = 0.55 + 0.45 * sin(uTime * 0.8 + aPhase);
    vAlpha = tw;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize;
    gl_Position = projectionMatrix * mv;
  }
`;

const STAR_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying float vAlpha;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(vec3(0.92, 0.96, 1.0), tex.a * vAlpha * 0.85);
  }
`;

export function buildSky(starCount: number): {
  group: THREE.Group;
  materials: THREE.ShaderMaterial[];
} {
  const group = new THREE.Group();

  const dome = new THREE.Mesh(
    new THREE.IcosahedronGeometry(620, 2),
    new THREE.ShaderMaterial({
      vertexShader: DOME_VERT,
      fragmentShader: DOME_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    }),
  );
  dome.renderOrder = -10;
  group.add(dome);

  // Stars above the horizon only.
  const rnd = mulberry32(42);
  const pos = new Float32Array(starCount * 3);
  const phase = new Float32Array(starCount);
  const size = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    const theta = rnd() * Math.PI * 2;
    const y = 0.12 + rnd() * 0.85;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    pos[i * 3] = Math.cos(theta) * r * 590;
    pos[i * 3 + 1] = y * 590;
    pos[i * 3 + 2] = Math.sin(theta) * r * 590;
    phase[i] = rnd() * Math.PI * 2;
    size[i] = 1.2 + rnd() * 2.2;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  starGeo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  starGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uMap: { value: glowTexture(64) } },
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.renderOrder = -9;
  stars.frustumCulled = false;
  group.add(stars);

  // The moon, high to the south-east.
  const moon = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: moonTexture(),
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
  );
  moon.position.set(-230, 330, -330);
  moon.scale.setScalar(115);
  moon.renderOrder = -8;
  group.add(moon);

  return { group, materials: [starMat] };
}
