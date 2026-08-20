// French TTS helper with play/pause toggle.
//
// Voice quality path (students called the robotic browser voice "muy molesta —
// no se puede practicar con la voz automática"): every phrase is first
// requested from the server's OpenAI TTS (same natural voice as the tutor),
// cached, and played as MP3. The browser Web Speech API / Google-Translate
// audio remain ONLY as fallbacks when the server voice is unavailable
// (offline, unapproved account, very long text).
//
// iOS/Android critical rule: audio MUST start within the user gesture. The
// synthesis fallback calls `.speak()` synchronously; the MP3 path calls
// `unlockAudioPlayback()` synchronously inside the gesture so the awaited
// server response may start playback afterwards.

import { speakText } from "@/lib/tts.functions";
import { unlockAudioPlayback } from "@/lib/audio";

let currentAudio: HTMLAudioElement | null = null;
let currentText: string | null = null;
const listeners = new Set<(text: string | null) => void>();

function notify() {
  for (const l of listeners) l(currentText);
}

export function onSpeakChange(cb: (text: string | null) => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function isSpeaking(text?: string) {
  if (!currentText) return false;
  return text ? currentText === text : true;
}

export function stopFr() {
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch {
      /* ignore */
    }
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
  currentText = null;
  notify();
}

function googleTtsUrl(text: string): string {
  const q = encodeURIComponent(text.slice(0, 200));
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=fr&client=tw-ob&q=${q}`;
}

function pickFrenchVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  const fr = voices.filter((v) => /fr/i.test(v.lang));
  return (
    fr.find((v) => /audrey|amelie|amélie|virginie|marie|female|femme/i.test(v.name)) ||
    fr.find((v) => /google.*fran/i.test(v.name)) ||
    fr[0]
  );
}

// Warm the voice list on module load so the first user gesture on mobile
// has voices available synchronously.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", () => {
      try {
        window.speechSynthesis.getVoices();
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* ignore */
  }
}

function speakViaSynthesis(text: string, rate = 0.95): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  try {
    synth.resume();
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.rate = rate;
    u.pitch = 1.05;
    const v = pickFrenchVoice();
    if (v) u.voice = v;
    u.onend = () => {
      if (currentText === text) {
        currentText = null;
        notify();
      }
    };
    u.onerror = () => {
      if (currentText === text) {
        currentText = null;
        notify();
      }
    };
    currentText = text;
    notify();
    // Synchronous call — critical for iOS.
    synth.speak(u);
    return true;
  } catch {
    return false;
  }
}

function speakViaAudio(text: string, rate = 0.95): boolean {
  try {
    const audio = new Audio(googleTtsUrl(text));
    audio.crossOrigin = "anonymous";
    audio.playbackRate = rate;
    audio.onended = () => {
      if (currentText === text) {
        currentText = null;
        currentAudio = null;
        notify();
      }
    };
    currentAudio = audio;
    currentText = text;
    notify();
    void audio.play().catch(() => {
      if (currentText === text) {
        currentText = null;
        currentAudio = null;
        notify();
      }
    });
    return true;
  } catch {
    if (currentText === text) {
      currentText = null;
      currentAudio = null;
      notify();
    }
    return false;
  }
}

/* ---------------- natural server voice (OpenAI TTS) ---------------- */

// Session cache: exercise phrases repeat constantly ("Écouter le modèle",
// listening items) — one server call per distinct text per session.
const mp3Cache = new Map<string, string>();
const MAX_SERVER_TEXT = 300;
// Monotonic click counter so a slow TTS response can't play over whatever the
// student clicked afterwards.
let speakSeq = 0;

function playMp3(b64: string, text: string, rate: number): boolean {
  try {
    const audio = new Audio(`data:audio/mp3;base64,${b64}`);
    audio.playbackRate = rate;
    audio.onended = () => {
      if (currentText === text) {
        currentText = null;
        currentAudio = null;
        notify();
      }
    };
    currentAudio = audio;
    currentText = text;
    notify();
    void audio.play().catch(() => {
      if (currentText === text) {
        currentText = null;
        currentAudio = null;
        notify();
      }
    });
    return true;
  } catch {
    return false;
  }
}

function speakLocalFallback(text: string, rate: number): void {
  const ok = speakViaSynthesis(text, rate);
  if (!ok) speakViaAudio(text, rate);
}

/** Play; if the same text is already playing, stop it (toggle). The natural
 * server voice is preferred; the browser voice only covers failures. */
export function speakFr(text: string, _rate = 0.95): void {
  if (typeof window === "undefined") return;
  if (currentText === text) {
    stopFr();
    return;
  }
  stopFr();
  const my = ++speakSeq;

  // Long texts used to skip the server entirely and drop to the robotic browser
  // voice — the exact thing students complained about ("muy molesta, no se
  // puede practicar"). A reading passage or a mascot paragraph is 400-900
  // chars, so every one of them sounded robotic. Split it at sentence
  // boundaries instead and play the natural voice chunk by chunk.
  if (text.length > MAX_SERVER_TEXT) {
    void speakLongFr(text, _rate, my);
    return;
  }

  const cached = mp3Cache.get(text);
  if (cached) {
    playMp3(cached, text, _rate);
    return;
  }

  // Unlock synchronously inside the gesture so the awaited MP3 may start later.
  unlockAudioPlayback();
  // Mark as "speaking" immediately for the toggle/spinner UIs.
  currentText = text;
  notify();
  void speakText({ data: { text } })
    .then(({ audio }) => {
      if (speakSeq !== my || currentText !== text) return; // user moved on
      if (audio) {
        mp3Cache.set(text, audio);
        playMp3(audio, text, _rate);
      } else {
        speakLocalFallback(text, _rate);
      }
    })
    .catch(() => {
      if (speakSeq !== my || currentText !== text) return;
      speakLocalFallback(text, _rate);
    });
}

/** Split into ≤MAX_SERVER_TEXT pieces on sentence boundaries, so each piece is
 *  still a natural unit to read aloud (never mid-word, never mid-sentence
 *  unless a single sentence is itself longer than the cap). */
export function splitForTts(text: string, max = MAX_SERVER_TEXT): string[] {
  const out: string[] = [];
  // Keep the punctuation with its sentence; « … » and « ! ? » all end one.
  const sentences = text
    .split(/(?<=[.!?…])\s+/)
    .flatMap((s) => (s.length <= max ? [s] : hardWrap(s, max)))
    .filter((s) => s.trim().length > 0);
  let buf = "";
  for (const s of sentences) {
    if (!buf) buf = s;
    else if (buf.length + 1 + s.length <= max) buf += " " + s;
    else {
      out.push(buf);
      buf = s;
    }
  }
  if (buf) out.push(buf);
  return out;
}

/** Last resort for a single sentence longer than the cap: break on spaces. */
function hardWrap(s: string, max: number): string[] {
  const parts: string[] = [];
  let buf = "";
  for (const w of s.split(/\s+/)) {
    if (!buf) buf = w;
    else if (buf.length + 1 + w.length <= max) buf += " " + w;
    else {
      parts.push(buf);
      buf = w;
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

/** Play one MP3 and resolve when it finishes (or fails). */
function playAndWait(b64: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio(`data:audio/mp3;base64,${b64}`);
      audio.playbackRate = rate;
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      currentAudio = audio;
      void audio.play().catch(() => resolve());
    } catch {
      resolve();
    }
  });
}

/** Natural voice for long text: fetch + play chunk by chunk, in order. The
 *  `seq` guard means a new click (or stopFr) abandons the rest immediately. */
async function speakLongFr(text: string, rate: number, seq: number): Promise<void> {
  const chunks = splitForTts(text);
  unlockAudioPlayback();
  currentText = text;
  notify();
  // Fetch chunk i+1 WHILE chunk i is playing, so there is no silent gap
  // between sentences — otherwise every chunk boundary is a ~1s pause.
  const fetchChunk = async (chunk: string): Promise<string | null> => {
    const hit = mp3Cache.get(chunk);
    if (hit) return hit;
    try {
      const { audio } = await speakText({ data: { text: chunk } });
      if (audio) mp3Cache.set(chunk, audio);
      return audio ?? null;
    } catch {
      return null;
    }
  };

  let pending: Promise<string | null> | null = fetchChunk(chunks[0]);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (speakSeq !== seq || currentText !== text) return; // superseded
    const b64 = await (pending ?? fetchChunk(chunk));
    pending = i + 1 < chunks.length ? fetchChunk(chunks[i + 1]) : null;
    if (speakSeq !== seq || currentText !== text) return;
    if (!b64) {
      // Server voice unavailable — finish the rest with the browser voice
      // rather than going silent mid-passage.
      speakLocalFallback(chunk, rate);
      return;
    }
    await playAndWait(b64, rate);
  }
  if (speakSeq === seq && currentText === text) {
    currentText = null;
    currentAudio = null;
    notify();
  }
}

export function hasFrenchVoice(): boolean {
  return true;
}
