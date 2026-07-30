import * as THREE from "three";

/**
 * Runtime-generated CanvasTextures — the whole scene ships zero image assets.
 * The soft radial glow is the workhorse: additively-blended sprites with a
 * bright core and a wide falloff read as bloom without any postprocessing.
 */

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  return [c, ctx];
}

function toTexture(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 1;
  return t;
}

/** Soft round light dot: bright core, long gaussian-ish tail. */
export function glowTexture(
  size = 128,
  inner = "#ffffff",
  outer = "rgba(255,255,255,0)",
): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.18, inner);
  g.addColorStop(0.42, "rgba(255,240,210,0.32)");
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(c);
}

/** Wide elliptical aura for landmark floodlights (the fake bloom halo). */
export function auraTexture(size = 256, tint = "255,214,140"): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, `rgba(${tint},0.55)`);
  g.addColorStop(0.35, `rgba(${tint},0.22)`);
  g.addColorStop(1, `rgba(${tint},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(c);
}

/** Vertical smeared streaks — scrolled over the Seine as fake bank reflections. */
export function streakTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256, 64);
  ctx.fillStyle = "#03060f";
  ctx.fillRect(0, 0, 256, 64);
  const colors = ["255,214,140", "255,214,140", "255,196,110", "75,177,236", "155,203,239"];
  for (let i = 0; i < 90; i++) {
    const x = (i * 47) % 256;
    const w = 1 + ((i * 13) % 3);
    const col = colors[i % colors.length];
    const a = 0.1 + ((i * 29) % 20) / 100;
    const grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, `rgba(${col},0)`);
    grad.addColorStop(0.5, `rgba(${col},${a})`);
    grad.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, w, 64);
  }
  const t = toTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** The moon: pale disc with a wide cool halo. */
export function moonTexture(size = 256): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(size, size);
  const cx = size / 2;
  const halo = ctx.createRadialGradient(cx, cx, size * 0.1, cx, cx, cx);
  halo.addColorStop(0, "rgba(237,248,252,0.9)");
  halo.addColorStop(0.22, "rgba(155,203,239,0.35)");
  halo.addColorStop(1, "rgba(155,203,239,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(cx, cx, size * 0.11, 0, Math.PI * 2);
  ctx.fillStyle = "#f2f7fb";
  ctx.fill();
  // Two faint maria smudges so it reads as the moon, not a lamp.
  ctx.fillStyle = "rgba(155,180,210,0.35)";
  ctx.beginPath();
  ctx.arc(cx - size * 0.03, cx - size * 0.02, size * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + size * 0.035, cx + size * 0.03, size * 0.025, 0, Math.PI * 2);
  ctx.fill();
  return toTexture(c);
}

/** Warm script sign for the rooftop café. */
export function cafeSignTexture(): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(256, 64);
  ctx.clearRect(0, 0, 256, 64);
  ctx.font = "italic 700 34px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(255,214,140,0.9)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#ffe9b8";
  ctx.fillText("Café Liberté", 128, 34);
  return toTexture(c);
}
