import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { TIER_PARAMS, type Tier } from "./quality";
import { FrameDriver } from "./CityCanvas";
import { RealParis } from "./RealParis";

/**
 * Canvas shell for the real-Paris tiles mode. Same governed frame loop and GL
 * settings as the procedural canvas; only the scene differs. Loaded lazily by
 * LandingCity ONLY when a Google tiles key exists and the tier allows it.
 */
export function RealCityCanvas({
  tier,
  apiToken,
  onFirstFrame,
  onFail,
}: {
  tier: Exclude<Tier, "static">;
  apiToken: string;
  onFirstFrame: () => void;
  onFail: () => void;
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
        gl.toneMappingExposure = 0.88;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <FrameDriver tier={tier} onFirstFrame={() => {}} />
      <RealParis tier={tier} apiToken={apiToken} onReady={onFirstFrame} onFail={onFail} />
    </Canvas>
  );
}
