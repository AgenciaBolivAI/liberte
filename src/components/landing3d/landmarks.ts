import * as THREE from "three";
import { LOUVRE, SACRE_COEUR, ARC, CAFE, SEINE, SEINE_WIDTH } from "./cityLayout";
import { auraTexture, glowTexture, cafeSignTexture } from "./textures";

/**
 * The landmark set. Simple geometry + warm floodlight tints + additive auras:
 * at night, silhouettes and glows carry the recognition, not detail.
 */

const WARM = new THREE.Color("#e8b45a");
const STONE = new THREE.Color("#3a4468");
const PALE = new THREE.Color("#9bcbef");

function aura(x: number, y: number, z: number, w: number, h: number, tint?: string): THREE.Sprite {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: auraTexture(256, tint ?? "255,206,120"),
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  s.position.set(x, y, z);
  s.scale.set(w, h, 1);
  return s;
}

/* ---------------- Louvre: palace wings + glowing glass pyramid ---------------- */

export function buildLouvre(): THREE.Group {
  const g = new THREE.Group();
  const wingMat = new THREE.MeshLambertMaterial({ color: STONE });

  const mkWing = (w: number, d: number, x: number, z: number, rot = 0) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(w, 7, d), wingMat);
    wing.position.set(x, 3.5, z);
    wing.rotation.y = rot;
    g.add(wing);
  };
  // U-shaped palace opening toward the pyramid court.
  mkWing(44, 8, 0, -14);
  mkWing(8, 26, -19, 0);
  mkWing(8, 26, 19, 0);

  // The glass pyramid — warm glow from inside, fresnel-bright edges.
  const pyrGeo = new THREE.ConeGeometry(7.4, 7.4, 4, 1, true);
  pyrGeo.rotateY(Math.PI / 4);
  const pyrMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color("#ffd894") } },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        float fresnel = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 1.6);
        vec3 col = uColor * (0.28 + fresnel * 1.1);
        gl_FragColor = vec4(col, 0.82);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const pyramid = new THREE.Mesh(pyrGeo, pyrMat);
  pyramid.position.set(0, 3.7, 6);
  g.add(pyramid);

  // Court glow under the pyramid + wing floodlight.
  g.add(aura(0, 2.5, 6, 26, 14));
  g.add(aura(0, 4, -12, 52, 16));

  g.position.set(LOUVRE.x, 0, LOUVRE.z);
  return g;
}

/* ---------------- Sacré-Cœur: white domes on the Montmartre hill ---------------- */

export function buildSacreCoeur(): THREE.Group {
  const g = new THREE.Group();
  // Everything except the hill goes in here so it can be scaled up for
  // legibility without inflating the hill (buildings sit on hillHeight()).
  const basilica = new THREE.Group();

  // The hill itself: a soft cone matching hillHeight's footprint.
  const hill = new THREE.Mesh(
    new THREE.ConeGeometry(55, SACRE_COEUR.y, 24, 1),
    new THREE.MeshBasicMaterial({ color: new THREE.Color("#0b0f22") }),
  );
  hill.position.set(0, SACRE_COEUR.y / 2 - 0.3, 0);
  g.add(hill);

  // Moonlit-white basilica material with a slight vertical gradient via vertex colors baked cheap:
  const domeMat = new THREE.MeshLambertMaterial({
    color: new THREE.Color("#dcebf7"),
    emissive: new THREE.Color("#33415f"),
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 10), domeMat);
  base.position.y = SACRE_COEUR.y + 3;
  basilica.add(base);

  const mkDome = (r: number, x: number, z: number, y: number) => {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(r, r, r * 1.4, 12), domeMat);
    drum.position.set(x, y + r * 0.7, z);
    basilica.add(drum);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(r, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      domeMat,
    );
    dome.position.set(x, y + r * 1.4, z);
    basilica.add(dome);
  };
  const top = SACRE_COEUR.y + 6;
  mkDome(3.4, 0, 0, top); // main dome
  mkDome(1.5, -6, -3, top);
  mkDome(1.5, 6, -3, top);
  mkDome(1.5, -6, 3, top);
  mkDome(1.5, 6, 3, top);
  // Campanile
  const camp = new THREE.Mesh(new THREE.BoxGeometry(2.6, 9, 2.6), domeMat);
  camp.position.set(-11, top + 3, 0);
  basilica.add(camp);

  // Scale for night-time legibility: silhouette first, proportion second.
  basilica.position.y = -SACRE_COEUR.y * 0.5;
  basilica.scale.setScalar(1.5);
  basilica.position.y += SACRE_COEUR.y * 0.5;
  g.add(basilica);

  // Floodlight halo — the basilica glows pale against the ink sky.
  g.add(aura(0, top * 1.4 + 8, 0, 60, 40, "195,220,245"));

  g.position.set(SACRE_COEUR.x, 0, SACRE_COEUR.z);
  return g;
}

/* ---------------- Arc de Triomphe ---------------- */

export function buildArc(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: STONE.clone().lerp(WARM, 0.15) });

  const pillarL = new THREE.Mesh(new THREE.BoxGeometry(3.4, 12, 6), mat);
  pillarL.position.set(-4.4, 6, 0);
  const pillarR = pillarL.clone();
  pillarR.position.x = 4.4;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(12.2, 4.6, 6), mat);
  lintel.position.set(0, 14.3, 0);
  g.add(pillarL, pillarR, lintel);

  // Warm glow inside the opening + a floodlight wash at the base.
  g.add(aura(0, 6, 0, 12, 12));
  g.add(aura(0, 2, 0, 30, 10));

  g.position.set(ARC.x, 0, ARC.z);
  g.rotation.y = -0.5; // face the Champs-Élysées avenue
  return g;
}

/* ---------------- Bridges over the Seine ---------------- */

export function buildBridges(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: STONE });

  // Place bridges across two segments of the river.
  const spots = [2, 4]; // segment indices of SEINE
  for (const i of spots) {
    const [ax, az] = SEINE[i];
    const [bx, bz] = SEINE[i + 1];
    const mx = (ax + bx) / 2;
    const mz = (az + bz) / 2;
    const angle = Math.atan2(bx - ax, bz - az);
    const bridge = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(SEINE_WIDTH + 10, 0.8, 4), mat);
    deck.position.y = 1.6;
    bridge.add(deck);
    // Arches: three shallow boxes below the deck
    for (const off of [-7, 0, 7]) {
      const arch = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.2, 3.4), mat);
      arch.position.set(off, 0.7, 0);
      bridge.add(arch);
    }
    // Lamps on the parapet
    for (const off of [-8, -3, 3, 8]) {
      const lamp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTexture(64, "#ffd27a"),
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      lamp.position.set(off, 2.8, 0);
      lamp.scale.setScalar(2.6);
      bridge.add(lamp);
    }
    bridge.position.set(mx, 0, mz);
    bridge.rotation.y = angle + Math.PI / 2;
    g.add(bridge);
  }
  return g;
}

/* ---------------- The rooftop café (the AI-tutor stop) ---------------- */

export function buildCafe(): THREE.Group {
  const g = new THREE.Group();
  const roofMat = new THREE.MeshLambertMaterial({ color: new THREE.Color("#141a33") });
  const woodMat = new THREE.MeshLambertMaterial({ color: new THREE.Color("#4a3620") });

  // Host building + terrace slab.
  const host = new THREE.Mesh(new THREE.BoxGeometry(14, CAFE.y, 12), roofMat);
  host.position.y = CAFE.y / 2;
  g.add(host);
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(13, 0.35, 11),
    new THREE.MeshLambertMaterial({ color: new THREE.Color("#1c2440") }),
  );
  slab.position.y = CAFE.y + 0.18;
  g.add(slab);

  // Chimney cluster + glowing dormer.
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 1.2), roofMat);
  chimney.position.set(-5, CAFE.y + 1.3, -4);
  g.add(chimney, chimney.clone().translateX(1.6));
  const dormer = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.6, 0.4),
    new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd894") }),
  );
  dormer.position.set(4.6, CAFE.y + 1, -5.3);
  g.add(dormer);

  // Tables + stools.
  for (const [tx, tz] of [
    [-3, 1.5],
    [0.5, -1],
    [3.4, 2],
    [-0.5, 3.4],
  ] as const) {
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 10), woodMat);
    table.position.set(tx, CAFE.y + 1.05, tz);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 6), woodMat);
    leg.position.set(tx, CAFE.y + 0.7, tz);
    g.add(table, leg);
    for (const a of [0.9, 2.4, 4.2]) {
      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.45, 8), woodMat);
      stool.position.set(tx + Math.cos(a) * 1.1, CAFE.y + 0.55, tz + Math.sin(a) * 1.1);
      g.add(stool);
    }
  }

  // String lights: two poles + a sagging catenary of warm bulbs.
  const poleMat = new THREE.MeshLambertMaterial({ color: new THREE.Color("#222a4a") });
  const poleA = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.2, 6), poleMat);
  poleA.position.set(-5.6, CAFE.y + 1.9, 4.6);
  const poleB = poleA.clone();
  poleB.position.set(5.6, CAFE.y + 1.9, -4.2);
  g.add(poleA, poleB);

  const bulbTex = glowTexture(64, "#ffd88f");
  const a = new THREE.Vector3(-5.6, CAFE.y + 3.4, 4.6);
  const b = new THREE.Vector3(5.6, CAFE.y + 3.4, -4.2);
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const p = a.clone().lerp(b, t);
    p.y -= Math.sin(t * Math.PI) * 1.1; // sag
    const bulb = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: bulbTex,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    bulb.position.copy(p);
    bulb.scale.setScalar(1.3);
    g.add(bulb);
  }

  // The sign.
  const sign = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: cafeSignTexture(), transparent: true, depthWrite: false }),
  );
  sign.position.set(0, CAFE.y + 4.6, 0);
  sign.scale.set(8, 2, 1);
  g.add(sign);

  // Warm ambient wash over the terrace.
  g.add(aura(0, CAFE.y + 2.2, 0, 22, 12));

  g.position.set(CAFE.x, 0, CAFE.z);
  return g;
}
