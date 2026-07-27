/**
 * Turn AI-authored JSON into display text — safely.
 *
 * THE BUG THIS EXISTS FOR (teacher screenshot, 2026-07-26): the student report
 * rendered "[object Object]" three times under «Pronunciación». The model was
 * asked for an array of strings but returned the shape it was SHOWN in the
 * payload — {palabra, escuchado, objetivo, tip} — and `String({})` is
 * "[object Object]", which went straight to the teacher's screen. Prompts are
 * a request, never a guarantee: every AI-authored value must be coerced at the
 * boundary, and these helpers NEVER emit "[object Object]".
 */

function scalar(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

/** First non-empty scalar among the given keys (accent/lang variants included). */
function pick(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const s = scalar(o[k]);
    if (s) return s;
  }
  return "";
}

// The models mix Spanish/English/French keys; accept all of them.
const K_HEAD = ["palabra", "word", "mot", "termino", "término", "sonido", "concepto", "titulo", "título", "title", "tipo", "type"];
const K_SAID = ["dijo", "said", "escuchado", "heard", "dice", "original", "escribio", "escribió"];
const K_TARGET = ["objetivo", "target", "correccion", "corrección", "corrected", "correcto", "deberia", "debería", "esperado"];
const K_NOTE = ["tip", "consejo", "regla", "rule", "nota", "note", "ejemplo", "example", "explicacion", "explicación", "descripcion", "descripción", "detalle", "texto", "text", "mensaje", "message", "valor", "value"];

/**
 * Any AI value → one readable line. Objects become a sentence built from the
 * keys the models actually use; unknown shapes fall back to joining their
 * scalar values. Returns "" when there is nothing renderable.
 */
export function aiText(v: unknown): string {
  const s = scalar(v);
  if (s) return s;
  if (Array.isArray(v)) return v.map(aiText).filter(Boolean).join(" · ");
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const head = pick(o, K_HEAD);
    const said = pick(o, K_SAID);
    const target = pick(o, K_TARGET);
    const note = pick(o, K_NOTE);
    const parts: string[] = [];
    if (head) parts.push(head);
    if (said && target) parts.push(`« ${said} » → « ${target} »`);
    else if (said) parts.push(`« ${said} »`);
    else if (target) parts.push(`« ${target} »`);
    if (note) parts.push(note);
    if (parts.length) return parts.join(" — ");
    // Unrecognized shape: keep the content rather than printing a placeholder.
    return Object.values(o).map(scalar).filter(Boolean).join(" · ");
  }
  return "";
}

/** Any AI value → a clean list of display strings (never "[object Object]"). */
export function aiTextList(v: unknown, max = 8): string[] {
  return (Array.isArray(v) ? v : [])
    .map(aiText)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.includes("[object Object]"))
    .slice(0, max);
}

/* ---------- Typed shapes used by the weekly report + PDF ---------- */

export type AiStrength = { title: string; example: string };
export type AiError = { said: string; corrected: string; rule: string };
export type AiPronunciation = { word: string; heard: string; target: string; tip: string };

/** Strengths: {title, example}. A bare string becomes the title. */
export function aiStrengths(v: unknown, max = 6): AiStrength[] {
  return (Array.isArray(v) ? v : [])
    .map((item): AiStrength => {
      if (typeof item === "string") return { title: item.trim(), example: "" };
      const o = (item ?? {}) as Record<string, unknown>;
      return {
        title: pick(o, ["title", "titulo", "título", "fortaleza", "nombre"]) || aiText(item),
        example: pick(o, ["example", "ejemplo", "cita", "muestra"]),
      };
    })
    .filter((s) => s.title || s.example)
    .slice(0, max);
}

/** Common errors: {said, corrected, rule}. A bare string becomes `said`. */
export function aiErrors(v: unknown, max = 6): AiError[] {
  return (Array.isArray(v) ? v : [])
    .map((item): AiError => {
      if (typeof item === "string") return { said: item.trim(), corrected: "", rule: "" };
      const o = (item ?? {}) as Record<string, unknown>;
      return {
        said: pick(o, K_SAID),
        corrected: pick(o, K_TARGET),
        rule: pick(o, ["rule", "regla", "explicacion", "explicación", "nota"]),
      };
    })
    .filter((e) => e.said || e.corrected)
    .slice(0, max);
}

/** Pronunciation: {word, heard, target, tip}. A bare string becomes `word`. */
export function aiPronunciation(v: unknown, max = 6): AiPronunciation[] {
  return (Array.isArray(v) ? v : [])
    .map((item): AiPronunciation => {
      if (typeof item === "string") return { word: item.trim(), heard: "", target: "", tip: "" };
      const o = (item ?? {}) as Record<string, unknown>;
      return {
        word: pick(o, ["word", "palabra", "mot", "sonido", "termino", "término"]),
        heard: pick(o, ["heard", "escuchado", "dijo", "said", "sono", "sonó"]),
        target: pick(o, ["target", "objetivo", "correcto", "deberia", "debería"]),
        tip: pick(o, ["tip", "consejo", "nota", "note"]),
      };
    })
    .filter((p) => p.word || p.heard || p.target || p.tip)
    .slice(0, max);
}

/** Pronunciation entries as readable one-liners (bullet lists, reports). */
export function aiPronunciationLines(v: unknown, max = 6): string[] {
  return aiPronunciation(v, max)
    .map((p) => {
      const head = p.word || "";
      const pair =
        p.heard && p.target ? `se escuchó « ${p.heard} », debe sonar « ${p.target} »`
        : p.target ? `debe sonar « ${p.target} »`
        : p.heard ? `se escuchó « ${p.heard} »`
        : "";
      return [head, pair, p.tip].filter(Boolean).join(" — ");
    })
    .filter(Boolean);
}
