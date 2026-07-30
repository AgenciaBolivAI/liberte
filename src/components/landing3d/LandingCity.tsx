import { Component, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { detectTier, type Tier } from "./quality";
import { StaticCityFallback } from "./StaticCityFallback";

/**
 * The client boundary for the 3D night-flight.
 *
 * This file is statically imported by the landing route, so it must keep
 * three.js OUT of its import graph: the route module is evaluated inside the
 * Cloudflare Worker on every request (including the every-5-min new-build
 * poll), and a top-level three import would ship ~600 KB into the worker. The
 * `import.meta.env.SSR` guard below constant-folds the dynamic import away
 * from the server bundle entirely.
 *
 * Failure ladder: reduced-motion / no WebGL → static. Chunk load fails →
 * static (our own try/catch, so client.tsx's preload-error hard-reload can
 * fire at most once for the stale-deploy case and never loops). Two WebGL
 * context losses → static.
 */
type CityCanvasProps = { tier: Exclude<Tier, "static">; onFirstFrame: () => void };

export function LandingCity() {
  const [tier, setTier] = useState<Tier | null>(null);
  const [Canvas3D, setCanvas3D] = useState<ComponentType<CityCanvasProps> | null>(null);
  const contextLosses = useRef(0);

  useEffect(() => {
    // Runs only on the client, after hydration — SSR renders nothing below.
    const t = detectTier();
    setTier(t);
    if (t === "static") return;
    let alive = true;
    if (!import.meta.env.SSR) {
      import("./CityCanvas")
        .then((m) => {
          if (alive) setCanvas3D(() => m.CityCanvas);
        })
        .catch(() => {
          // Chunk missing (stale deploy, offline) — the static sky is fine.
          if (alive) setTier("static");
        });
    }
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      // Leaving the landing: drop the flag so other routes are unaffected.
      document.documentElement.removeAttribute("data-city");
    };
  }, []);

  // SSR and first client render: nothing (markup parity, canvas host appears post-mount).
  if (tier === null) return null;

  const showStatic = tier === "static" || Canvas3D === null;

  return (
    <div aria-hidden className="fixed inset-0 z-0" onContextMenuCapture={(e) => e.preventDefault()}>
      {showStatic && <StaticCityFallback />}
      {tier !== "static" && Canvas3D !== null && (
        <CityBoundary
          onContextLost={() => {
            contextLosses.current += 1;
            if (contextLosses.current >= 2) setTier("static");
          }}
        >
          <Canvas3D
            tier={tier}
            onFirstFrame={() => document.documentElement.setAttribute("data-city", "on")}
          />
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
