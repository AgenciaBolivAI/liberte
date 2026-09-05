/**
 * Run REAL server code from a plain .mjs script.
 *
 * The suite could only ever grep `src/**` as text, which is why a transcription
 * that returned Portuguese and a TTS that spoke English both shipped: every
 * assert was about what the source *said*, never about what the code *did*.
 * rolldown is already a dependency (Vite 8 uses it), so bundling a module to
 * ESM and importing it costs nothing and lets tests call the actual functions.
 *
 * Usage:
 *   const ai = await loadServerLib("src/lib/ai.ts");
 *   await ai.transcribeFr(base64, "audio/mpeg");
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const cache = new Map();
const dirs = [];

export async function loadServerLib(entry) {
  const hit = cache.get(entry);
  if (hit) return hit;
  const { build } = await import("rolldown");
  const dir = mkdtempSync(join(tmpdir(), "liberte-lib-"));
  dirs.push(dir);
  const out = join(dir, "bundle.mjs");
  await build({
    input: entry,
    output: { file: out, format: "esm" },
    platform: "node",
    // Quiet: rolldown warns about the browser/server split in these modules,
    // which is expected and not what we are testing.
    onwarn() {},
  });
  const mod = await import(pathToFileURL(out).href);
  cache.set(entry, mod);
  return mod;
}

/** Remove the temp bundles. Safe to call more than once. */
export function cleanupServerLibs() {
  for (const d of dirs.splice(0)) {
    try {
      rmSync(d, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
}
