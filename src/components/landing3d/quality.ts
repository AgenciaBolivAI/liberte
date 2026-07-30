import { currentDevice } from "@/lib/device";

/**
 * Quality tiers for the 3D landing. Pure module — no three.js here, so it can
 * sit in the route's static import graph and run before the heavy chunk loads.
 *
 * "static" short-circuits WebGL entirely: reduced-motion users, browsers
 * without a usable context, and import failures all land on the CSS fallback.
 */
export type Tier = "high" | "mid" | "mobile" | "static";

export type TierParams = {
  dpr: [number, number];
  antialias: boolean;
  fpsCap: number;
  idleFpsCap: number;
  buildings: number;
  defense: number;
  lamps: number;
  trailDashes: number;
  towerLights: number;
  sparkles: number;
  stars: number;
  fogNear: number;
  fogFar: number;
};

export const TIER_PARAMS: Record<Exclude<Tier, "static">, TierParams> = {
  high: {
    dpr: [1, 2],
    antialias: true,
    fpsCap: 60,
    idleFpsCap: 60,
    buildings: 3200,
    defense: 260,
    lamps: 1600,
    trailDashes: 260,
    towerLights: 800,
    sparkles: 420,
    stars: 700,
    fogNear: 60,
    fogFar: 440,
  },
  mid: {
    dpr: [1, 1.5],
    antialias: true,
    fpsCap: 60,
    idleFpsCap: 60,
    buildings: 1800,
    defense: 160,
    lamps: 900,
    trailDashes: 160,
    towerLights: 500,
    sparkles: 260,
    stars: 400,
    fogNear: 50,
    fogFar: 330,
  },
  mobile: {
    dpr: [1, 1.25],
    antialias: false,
    fpsCap: 30,
    idleFpsCap: 20,
    buildings: 1000,
    defense: 90,
    lamps: 450,
    trailDashes: 90,
    towerLights: 320,
    sparkles: 140,
    stars: 250,
    fogNear: 40,
    fogFar: 260,
  },
};

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    // Free the probe context immediately; some mobile browsers cap them.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function detectTier(): Tier {
  if (typeof window === "undefined") return "static";
  // A reduced-motion request is a hard opt-out of the flight, not a hint.
  if (prefersReducedMotion()) return "static";
  if (!webglAvailable()) return "static";
  const device = currentDevice();
  if (device === "mobile") return "mobile";
  if (device === "tablet") return "mid";
  // Weak desktops (low reported memory) get the mid tier rather than stutter.
  const mem = (navigator as { deviceMemory?: number }).deviceMemory;
  if (typeof mem === "number" && mem <= 4) return "mid";
  return "high";
}

/**
 * Rolling frame-time monitor. Downgrade-only: once a device proves it can't
 * hold the budget we step it down and never back up (upgrading oscillates).
 * Steps: 1) DPR −0.25 (min 0.75) · 2) halve sparkles/lamps via drawRange.
 */
export class FpsGovernor {
  private samples: number[] = [];
  private warmupUntil: number;
  private step = 0;

  constructor(
    private onStepDown: (step: number) => void,
    now = performance.now(),
  ) {
    this.warmupUntil = now + 2000;
  }

  frame(deltaMs: number, now: number): void {
    if (now < this.warmupUntil || this.step >= 2) return;
    this.samples.push(deltaMs);
    if (this.samples.length < 90) return;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.samples = [];
    if (avg > 45) {
      this.step += 1;
      this.onStepDown(this.step);
    }
  }
}
