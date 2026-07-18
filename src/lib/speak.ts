// French TTS helper with play/pause toggle.
// Uses the browser Web Speech API (works on Chrome, Safari, iOS, Android).
// Falls back to Google Translate TTS via <audio> if the synthesis API is
// unavailable.
//
// iOS/Android critical rule: `speechSynthesis.speak()` MUST be called
// synchronously within the user gesture. Any `await` between the click and
// `.speak()` breaks the gesture and the utterance is silently dropped.

let currentAudio: HTMLAudioElement | null = null;
let currentText: string | null = null;
const listeners = new Set<(text: string | null) => void>();

function notify() {
  for (const l of listeners) l(currentText);
}

export function onSpeakChange(cb: (text: string | null) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function isSpeaking(text?: string) {
  if (!currentText) return false;
  return text ? currentText === text : true;
}

export function stopFr() {
  if (currentAudio) {
    try { currentAudio.pause(); } catch { /* ignore */ }
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
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
      try { window.speechSynthesis.getVoices(); } catch { /* ignore */ }
    });
  } catch { /* ignore */ }
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
      if (currentText === text) { currentText = null; notify(); }
    };
    u.onerror = () => {
      if (currentText === text) { currentText = null; notify(); }
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
      if (currentText === text) { currentText = null; currentAudio = null; notify(); }
    };
    currentAudio = audio;
    currentText = text;
    notify();
    void audio.play().catch(() => {
      if (currentText === text) { currentText = null; currentAudio = null; notify(); }
    });
    return true;
  } catch {
    if (currentText === text) { currentText = null; currentAudio = null; notify(); }
    return false;
  }
}

/** Play; if the same text is already playing, stop it (toggle). Synchronous
 * to preserve the mobile user-gesture requirement. */
export function speakFr(text: string, _rate = 0.95): void {
  if (typeof window === "undefined") return;
  if (currentText === text) {
    stopFr();
    return;
  }
  stopFr();
  const ok = speakViaSynthesis(text, _rate);
  if (!ok) speakViaAudio(text, _rate);
}

export function hasFrenchVoice(): boolean {
  return true;
}
