import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireApprovedStudent } from "@/lib/approval";
import { speakFrenchBase64 } from "@/lib/ai";

/**
 * Natural French TTS for the exercises (listening items, «Écouter» buttons,
 * weekly tests, mascot lines). Students called the browser voice "muy molesta —
 * no se puede practicar"; the tutor already uses OpenAI TTS, this brings the
 * same voice to everything else.
 *
 * Cost control:
 *  - approval-gated (no anonymous token burn);
 *  - text capped at 300 chars (exercise phrases are short);
 *  - server-side LRU cache — exercise texts are STATIC and shared by every
 *    student, so repeats are near-free within a server instance;
 *  - returns { audio: null } on any failure so the client can fall back to the
 *    browser voice instead of breaking the exercise.
 */

const MAX_TEXT = 300;
const CACHE_MAX = 500;
const cache = new Map<string, string>(); // text -> base64 mp3 (insertion-ordered)

export const speakText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const d = input as { text?: string };
    const text = String(d?.text ?? "").trim();
    if (!text) throw new Error("text required");
    return { text: text.slice(0, MAX_TEXT) };
  })
  .handler(async ({ data, context }) => {
    await requireApprovedStudent(context);
    const hit = cache.get(data.text);
    if (hit) {
      // Refresh LRU position.
      cache.delete(data.text);
      cache.set(data.text, hit);
      return { audio: hit };
    }
    try {
      const audio = await speakFrenchBase64(data.text);
      cache.set(data.text, audio);
      if (cache.size > CACHE_MAX) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
      }
      return { audio };
    } catch (e) {
      console.error("[tts] speakText failed", e);
      return { audio: null as string | null };
    }
  });
