import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { TIER_PARAMS, FpsGovernor, type Tier } from "./quality";
import { CityScene } from "./CityScene";

/**
 * The only module that mounts WebGL. Frame loop is OURS (frameloop="never" +
 * advance): 60 fps on desktop, 30 on phones (20 after 8 s of idle), zero when
 * the tab is hidden — sparkles and trails animate without scroll, so a demand
 * loop would freeze the city, and an uncapped loop would cook phones.
 */
export function CityCanvas({
  tier,
  onFirstFrame,
}: {
  tier: Exclude<Tier, "static">;
  onFirstFrame: () => void;
}) {
  const params = TIER_PARAMS[tier];

  return (
    <Canvas
      frameloop="never"
      dpr={params.dpr}
      gl={{
        antialias: params.antialias,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      camera={{ fov: 60, near: 0.5, far: 1400 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <FrameDriver tier={tier} onFirstFrame={onFirstFrame} />
      <CityScene tier={tier} />
    </Canvas>
  );
}

function FrameDriver({
  tier,
  onFirstFrame,
}: {
  tier: Exclude<Tier, "static">;
  onFirstFrame: () => void;
}) {
  const advance = useThree((s) => s.advance);
  const gl = useThree((s) => s.gl);
  const setDpr = useThree((s) => s.setDpr);
  const params = TIER_PARAMS[tier];
  const firstFrameSent = useRef(false);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastActivity = performance.now();
    let running = true;
    let dprStep = 0;

    const governor = new FpsGovernor((step) => {
      // Live downgrade: pull DPR down a notch per step. Never upgrades back.
      dprStep = step;
      const current = Math.min(window.devicePixelRatio || 1, params.dpr[1]);
      setDpr(Math.max(0.75, current - 0.25 * step));
    });

    const onActivity = () => {
      lastActivity = performance.now();
    };
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("pointermove", onActivity, { passive: true });

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const loop = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      const idle = now - lastActivity > 8000;
      const cap = idle ? params.idleFpsCap : params.fpsCap;
      const minDelta = 1000 / cap - 2;
      const delta = now - last;
      if (delta < minDelta) return;
      last = now;
      governor.frame(delta, now);
      advance(now / 1000);
      if (!firstFrameSent.current) {
        firstFrameSent.current = true;
        onFirstFrame();
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("pointermove", onActivity);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // dprStep intentionally unused after set — governor state lives in closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advance, gl, setDpr, onFirstFrame, params.fpsCap, params.idleFpsCap]);

  return null;
}
