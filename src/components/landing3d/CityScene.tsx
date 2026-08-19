import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TIER_PARAMS, type Tier } from "./quality";
import { buildCity } from "./buildings";
import { buildSky } from "./skyDome";
import { buildSeine } from "./seine";
import { buildEiffel } from "./eiffel";
import { buildLouvre, buildSacreCoeur, buildArc, buildBridges, buildCafe } from "./landmarks";
import { buildLamps, buildTrails, buildBateau } from "./lights";
import { CameraRig } from "./CameraRig";

/**
 * Assembles the whole night city once (all builders are plain three code) and
 * mounts it via <primitive>. One useFrame drives every uTime uniform + the
 * handful of imperative tickers (beacon blink, bateau-mouche).
 */
export function CityScene({ tier }: { tier: Exclude<Tier, "static"> }) {
  const params = TIER_PARAMS[tier];
  const scene = useThree((s) => s.scene);

  const built = useMemo(() => {
    const fog = {
      color: new THREE.Color("#131b36"),
      near: params.fogNear,
      far: params.fogFar,
    };
    scene.fog = new THREE.Fog(fog.color, fog.near, fog.far);
    scene.background = new THREE.Color("#0A1029");

    const root = new THREE.Group();

    // Moonlight + a whisper of ambient: Lambert landmarks get form from this;
    // the shader-driven city/tower ignore lights entirely.
    const moonlight = new THREE.DirectionalLight(new THREE.Color("#9bcbef"), 1.15);
    moonlight.position.set(-230, 330, -330);
    const ambient = new THREE.AmbientLight(new THREE.Color("#22304f"), 0.9);
    root.add(moonlight, ambient);
    const timeMats: THREE.ShaderMaterial[] = [];
    const tickers: ((t: number) => void)[] = [];

    const sky = buildSky(params.stars);
    root.add(sky.group);
    timeMats.push(...sky.materials);

    const city = buildCity(params.buildings, params.defense, fog);
    root.add(city.group);
    timeMats.push(...city.materials);

    const seine = buildSeine(fog);
    root.add(seine.group);
    timeMats.push(...seine.materials);

    const eiffel = buildEiffel(params.towerLights, params.sparkles);
    root.add(eiffel.group);
    timeMats.push(...eiffel.materials);
    tickers.push(eiffel.tick);

    // Landmarks, street lamps, car trails and the bateau are built in a SECOND
    // pass (see below). They are detail, not silhouette: none of them decide
    // what the hero frame looks like, and building them here kept the whole
    // city off screen while ~1600 lamp points and 260 trail quads were
    // generated on the main thread.

    // Ground plane so nothing floats over the void between blocks.
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(600, 40),
      new THREE.MeshBasicMaterial({ color: new THREE.Color("#070b1c") }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.6;
    root.add(ground);

    return { root, timeMats, tickers };
    // Built once per tier; tier never changes without a full remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  // Second pass — after the first frame is on screen. Pushed into the SAME
  // arrays the frame loop reads, so the new materials animate the moment they
  // exist, and everything is parented to `root` so disposal is unchanged.
  useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (cancelled) return;
      const { root, timeMats, tickers } = built;
      root.add(buildLouvre(), buildSacreCoeur(), buildArc(), buildBridges(), buildCafe());
      root.add(buildLamps(params.lamps));
      const trails = buildTrails(params.trailDashes);
      root.add(trails.mesh);
      timeMats.push(trails.material);
      const bateau = buildBateau();
      root.add(bateau.sprite);
      tickers.push(bateau.tick);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [built, params.lamps, params.trailDashes]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (const m of built.timeMats) {
      const u = m.uniforms.uTime;
      if (u) u.value = t;
    }
    for (const tick of built.tickers) tick(t);
  });

  return (
    <>
      <primitive object={built.root} />
      <CameraRig />
    </>
  );
}
