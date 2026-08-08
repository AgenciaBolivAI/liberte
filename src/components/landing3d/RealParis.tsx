import { createElement, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { TilesRenderer, TilesPlugin, TilesAttributionOverlay } from "3d-tiles-renderer/r3f";
import {
  GoogleCloudAuthPlugin,
  GLTFExtensionsPlugin,
  TilesFadePlugin,
  TileCompressionPlugin,
} from "3d-tiles-renderer/plugins";
import { tilesToLocalMatrix } from "./geo";
import { buildSky } from "./skyDome";
import { buildTowerGlow } from "./eiffel";
import { realFlight } from "./cameraPath";
import { CameraRig } from "./CameraRig";
import { TIER_PARAMS, type Tier } from "./quality";

/**
 * The REAL Paris: Google Photorealistic 3D Tiles (actual photogrammetry of the
 * city) streamed into the same rig the procedural city uses — anchor matrix
 * plants the real Eiffel Tower at our origin, y-up, north = −z.
 *
 * Google captured Paris in daylight, so we grade it to twilight: every tile
 * material is tinted toward dusk once on load, our night sky/stars/moon wrap
 * the horizon, fog adds atmospheric depth, and the champagne sparkles + red
 * beacon are layered over the real tower.
 *
 * Contract with LandingCity: call onReady() when the tileset actually starts
 * rendering (that's when the CSS sky cross-fades away), onFail() if the key is
 * bad / quota dead / network broken — the procedural night city takes over.
 */

// Google captures Paris in bright daylight. A gentle tint still read as noon
// up close (only distance fog sold the dusk), so this is a deep blue-hour
// multiply: dark enough that near tiles match the graded horizon.
const DUSK_TINT = new THREE.Color(0.24, 0.3, 0.54);

export function RealParis({
  tier,
  apiToken,
  onReady,
  onFail,
}: {
  tier: Exclude<Tier, "static">;
  apiToken: string;
  onReady: () => void;
  onFail: () => void;
}) {
  const scene = useThree((s) => s.scene);
  const params = TIER_PARAMS[tier];
  const readySent = useRef(false);
  const errorCount = useRef(0);
  const failed = useRef(false);
  const models = useRef(0);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Progressive detail: stream a coarse city first so something real appears
  // fast, then sharpen. errorTarget is "allowed screen-space error" — higher
  // means fewer, cruder tiles, so the first wave is a fraction of the bytes.
  const [detail, setDetail] = useState<"coarse" | "fine">("coarse");
  // Sharper on both ends than the first attempt: 55 was blurry enough to look
  // broken, and the jump from it popped. With TilesFadePlugin dissolving the
  // steps, a modest spread reads as "focusing", not "loading".
  const FINE = tier === "high" ? 10 : 16;
  const COARSE = tier === "high" ? 26 : 34;

  const fail = () => {
    if (!failed.current) {
      failed.current = true;
      onFail();
    }
  };

  // No tileset within 18s (bad key, blocked network, dead quota) → fall back.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!readySent.current) fail();
    }, 18000);
    return () => {
      clearTimeout(t);
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dracoLoader = useMemo(() => {
    const d = new DRACOLoader();
    d.setDecoderPath("/draco/");
    return d;
  }, []);

  const anchorMatrix = useMemo(() => tilesToLocalMatrix(), []);

  const overlays = useMemo(() => {
    scene.fog = new THREE.Fog(new THREE.Color("#1b2444"), 70, 1000);
    scene.background = new THREE.Color("#0A1029");

    const root = new THREE.Group();
    const timeMats: THREE.ShaderMaterial[] = [];
    const tickers: ((t: number) => void)[] = [];

    const sky = buildSky(params.stars);
    root.add(sky.group);
    timeMats.push(...sky.materials);

    const glow = buildTowerGlow(params.sparkles);
    root.add(glow.group);
    timeMats.push(...glow.materials);
    tickers.push(glow.tick);

    return { root, timeMats, tickers };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (const m of overlays.timeMats) {
      const u = m.uniforms.uTime;
      if (u) u.value = t;
    }
    for (const tick of overlays.tickers) tick(t);
  });

  const reveal = () => {
    if (readySent.current) return;
    readySent.current = true;
    if (revealTimer.current) clearTimeout(revealTimer.current);
    onReady();
  };

  // The tileset JSON arriving means "the key works", NOT "there is a city to
  // look at" — revealing here dissolved the painted sky into an empty void for
  // a second or two. Hold the sky until actual geometry is on screen (or until
  // a backstop timer, so a sparse view can never wedge the reveal).
  const onLoadTileset = () => {
    if (!readySent.current && revealTimer.current === null) {
      revealTimer.current = setTimeout(reveal, 6000);
    }
  };

  const onLoadError = () => {
    errorCount.current += 1;
    // A few tile hiccups are normal on flaky wifi; a storm of them (or any
    // before the root arrived) means the mode is dead.
    if (errorCount.current > 8 || !readySent.current) fail();
  };

  const onLoadModel = (e: { scene: THREE.Object3D }) => {
    models.current += 1;
    if (models.current >= 8) reveal();
    if (models.current >= 14 && detail === "coarse") setDetail("fine");

    // Twilight grade: baked-daylight tile textures are unlit
    // (KHR_materials_unlit → MeshBasicMaterial); multiplying the material
    // color darkens and cools them toward dusk.
    e.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial | undefined;
      if (mat && "color" in mat && !mat.userData.duskGraded) {
        mat.userData.duskGraded = true;
        mat.color.multiply(DUSK_TINT);
      }
    });
  };

  /**
   * createElement, NOT JSX — deliberately.
   *
   * The dev-only TanStack devtools plugin rewrites every JSX opening tag to add
   * a `data-tsd-source="file:line:col"` attribute. TilesRenderer/TilesPlugin
   * funnel unknown props through `useDeepOptions`, which treats a dash as a
   * property PATH — so `data-tsd-source` is walked as `tiles.data.tsd.source`
   * and throws "Cannot read properties of undefined (reading 'tsd')", killing
   * the whole scene in dev (it worked in prod, which is the worst kind of bug).
   * The transform only touches JSX nodes, so building these elements manually
   * keeps real-Paris mode working in dev and prod alike.
   */
  const tiles = createElement(
    TilesRenderer,
    {
      errorTarget: detail === "coarse" ? COARSE : FINE,
      // Dash keys are this library's nested-property syntax (lruCache.maxSize).
      // A generous cache means scrolling back to an earlier stop re-renders
      // instantly instead of re-fetching tiles we already paid for.
      "lruCache-minSize": 900,
      "lruCache-maxSize": 1600,
      "lruCache-maxBytesSize": 400 * 1024 * 1024,
      // Google serves many small tiles; more sockets in flight = faster fill.
      "downloadQueue-maxJobs": tier === "high" ? 12 : 8,
      "parseQueue-maxJobs": tier === "high" ? 4 : 2,
      onLoadTileset,
      onLoadError,
      onLoadModel,
    } as ComponentProps<typeof TilesRenderer>,
    createElement(TilesPlugin, {
      key: "auth",
      plugin: GoogleCloudAuthPlugin,
      args: [{ apiToken, autoRefreshToken: true }],
    }),
    createElement(TilesPlugin, {
      key: "gltf",
      plugin: GLTFExtensionsPlugin,
      args: [{ dracoLoader }],
    }),
    // Cross-fades every level-of-detail swap. Without it each refinement pops
    // in hard, which reads as the city "re-loading" every time you scroll.
    createElement(TilesPlugin, {
      key: "fade",
      plugin: TilesFadePlugin,
      args: [{ fadeDuration: 400, fadeRootTiles: true, maximumFadeOutTiles: 60 }],
    }),
    // Packs tile attributes down so the cache holds far more of the city in
    // GPU memory — fewer evictions, so revisiting a stop doesn't re-stream it.
    createElement(TilesPlugin, {
      key: "compress",
      plugin: TileCompressionPlugin,
    }),
    createElement(TilesAttributionOverlay, { key: "attribution" }),
  );

  return (
    <>
      <primitive object={overlays.root} />
      <group matrixAutoUpdate={false} matrix={anchorMatrix}>
        {tiles}
      </group>
      <CameraRig flight={realFlight} idleDrift={false} />
    </>
  );
}
