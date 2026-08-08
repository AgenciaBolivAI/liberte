import { Component, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { detectTier, realTilesKey, type Tier } from "./quality";
import { StaticCityFallback } from "./StaticCityFallback";

/**
 * The client boundary for the 3D landing.
 *
 * This file is statically imported by the landing route, so it must keep
 * three.js OUT of its import graph: the route module is evaluated inside the
 * Cloudflare Worker on every request (including the every-5-min new-build
 * poll). The `import.meta.env.SSR` guards below constant-fold both heavy
 * renderers away from the server bundle entirely.
 *
 * Renderer ladder (each step degrades to the next, never breaks the page):
 *   1. REAL Paris — Google Photorealistic 3D Tiles, only when a
 *      VITE_GOOGLE_3D_TILES_KEY is configured AND the device isn't a phone.
 *      Bad key / quota / network / slow tiles → step 2.
 *   2. Procedural night city (the stylized «Ville Lumière»).
 *      Chunk failure / repeated WebGL context loss → step 3.
 *   3. Static CSS night sky (also what reduced-motion and no-WebGL users get,
 *      and the instant first paint while any chunk downloads).
 */
type CityCanvasProps = { tier: Exclude<Tier, "static">; onFirstFrame: () => void };
type RealCanvasProps = CityCanvasProps & { apiToken: string; onFail: () => void };

type Mode = "boot" | "real" | "procedural" | "static";

/**
 * Warm the renderer chunk the instant this module is evaluated — i.e. during
 * hydration, while AuthGate is still waiting on its Supabase round-trip and
 * the intro splash is covering the screen. Without this the download only
 * began after the gate resolved and the component mounted, adding most of a
 * second of dead time before the city could start streaming.
 *
 * Fire-and-forget: the component still imports properly and handles failure;
 * this only primes the browser's module cache. Phones are excluded — they run
 * the procedural city, and pre-pulling the tiles renderer would waste data.
 */
if (typeof window !== "undefined" && !import.meta.env.SSR) {
  try {
    const tier = detectTier();
    if (tier !== "static") {
      if (realTilesKey() && tier !== "mobile") void import("./RealCityCanvas").catch(() => {});
      else void import("./CityCanvas").catch(() => {});
    }
  } catch {
    /* never let a warm-up stop the page from rendering */
  }
}

export function LandingCity() {
  const [tier, setTier] = useState<Tier | null>(null);
  const [mode, setMode] = useState<Mode>("boot");
  const [Procedural, setProcedural] = useState<ComponentType<CityCanvasProps> | null>(null);
  const [Real, setReal] = useState<ComponentType<RealCanvasProps> | null>(null);
  const contextLosses = useRef(0);
  const key = realTilesKey();

  // Decide the tier + target mode once, client-side only.
  useEffect(() => {
    const t = detectTier();
    setTier(t);
    if (t === "static") {
      setMode("static");
      return;
    }
    const wantReal = Boolean(key) && t !== "mobile";
    setMode(wantReal ? "real" : "procedural");
  }, [key]);

  // Load the renderer chunk the current mode needs.
  useEffect(() => {
    if (mode !== "real" && mode !== "procedural") return;
    let alive = true;
    if (!import.meta.env.SSR) {
      if (mode === "real" && Real === null) {
        import("./RealCityCanvas")
          .then((m) => {
            if (alive) setReal(() => m.RealCityCanvas);
          })
          .catch(() => {
            if (alive) setMode("procedural");
          });
      }
      if (mode === "procedural" && Procedural === null) {
        import("./CityCanvas")
          .then((m) => {
            if (alive) setProcedural(() => m.CityCanvas);
          })
          .catch(() => {
            // Chunk missing (stale deploy, offline) — the static sky is fine.
            if (alive) setMode("static");
          });
      }
    }
    return () => {
      alive = false;
    };
  }, [mode, Real, Procedural]);

  useEffect(() => {
    return () => {
      // Leaving the landing: drop the flag so other routes are unaffected.
      document.documentElement.removeAttribute("data-city");
    };
  }, []);

  // SSR and first client render: nothing (markup parity; host appears post-mount).
  if (tier === null || mode === "boot") return null;

  const markLive = () => document.documentElement.setAttribute("data-city", "on");
  const showStatic =
    mode === "static" ||
    (mode === "real" && Real === null) ||
    (mode === "procedural" && Procedural === null);

  return (
    <div aria-hidden className="fixed inset-0 z-0" onContextMenuCapture={(e) => e.preventDefault()}>
      {showStatic && <StaticCityFallback />}
      {mode === "real" && Real !== null && tier !== "static" && key && (
        <CityBoundary
          onContextLost={() => {
            contextLosses.current += 1;
            if (contextLosses.current >= 2) setMode("static");
          }}
        >
          <Real
            tier={tier as Exclude<Tier, "static">}
            apiToken={key}
            onFirstFrame={markLive}
            onFail={() => {
              // Real Paris unreachable — hand the flight to the night city.
              document.documentElement.removeAttribute("data-city");
              setMode("procedural");
            }}
          />
        </CityBoundary>
      )}
      {mode === "procedural" && Procedural !== null && tier !== "static" && (
        <CityBoundary
          onContextLost={() => {
            contextLosses.current += 1;
            if (contextLosses.current >= 2) setMode("static");
          }}
        >
          <Procedural tier={tier as Exclude<Tier, "static">} onFirstFrame={markLive} />
        </CityBoundary>
      )}
    </div>
  );
}

/** Catches render-time throws from the 3D subtree and reports context loss. */
class CityBoundary extends Component<
  { children: ReactNode; onContextLost: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // A crash inside the scene must never take the marketing page with it;
    // this boundary swaps to the static sky on its own (state.failed).
  }

  componentDidMount() {
    window.addEventListener("webglcontextlost", this.onLost, true);
  }

  componentWillUnmount() {
    window.removeEventListener("webglcontextlost", this.onLost, true);
  }

  private onLost = () => this.props.onContextLost();

  render() {
    if (this.state.failed) return <StaticCityFallback />;
    return this.props.children;
  }
}
