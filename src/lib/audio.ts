// Shared audio helpers for voice input (recording + base64 for the STT
// server functions). Mirrors the MediaRecorder pattern used in StagedDefi.

import { useEffect, useRef, useState } from "react";

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

// iOS Safari refuses programmatic playback on an <audio> element that wasn't
// started inside a real user gesture. Creating a fresh Audio() per reply
// therefore plays once (inside the tap) and is silently blocked afterwards.
// The fix: keep ONE element, unlock it during the tap, and reuse it forever.
let sharedAudio: HTMLAudioElement | null = null;
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";

/** Call this synchronously from a click/tap before any later playback. */
export function unlockAudioPlayback(): void {
  if (typeof window === "undefined") return;
  if (!sharedAudio) {
    sharedAudio = new Audio();
    // playsInline keeps iOS/WebKit (including Chrome on iOS) from hijacking
    // playback into a fullscreen player. Not in the HTMLAudioElement typings.
    (sharedAudio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    sharedAudio.preload = "auto";
  }
  try {
    sharedAudio.src = SILENT_WAV;
    void sharedAudio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Plays a base64 MP3 and resolves when it finishes (or fails). */
export function playBase64Mp3(b64: string): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    try {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      const audio = sharedAudio ?? new Audio();
      (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
      const done = () => {
        URL.revokeObjectURL(url);
        audio.onended = null;
        audio.onerror = null;
        finish();
      };
      audio.onended = done;
      audio.onerror = done;
      audio.src = url;
      void audio.play().catch(done);
      // Safety net: never leave the conversation loop hanging on a stuck element.
      setTimeout(finish, 60_000);
    } catch {
      finish();
    }
  });
}

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const resolveRef = useRef<((b: Blob | null) => void) | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Release the mic if the component unmounts mid-recording, otherwise the
  // browser's recording indicator stays on for the rest of the session.
  useEffect(() => {
    return () => {
      vadCleanupRef.current?.();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  /** Optional: called once the speaker has been quiet for a moment, so voice
   *  mode can auto-submit without the student tapping anything. */
  const onSilenceRef = useRef<(() => void) | null>(null);
  const vadCleanupRef = useRef<(() => void) | null>(null);
  const heardSpeechRef = useRef(false);

  function watchForSilence(stream: MediaStream) {
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      // iOS creates contexts in a suspended state outside a user gesture —
      // without this the analyser only ever reports silence.
      if (ctx.state === "suspended") void ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);

      const SILENCE = 0.015; // RMS below this counts as quiet
      const HANG_MS = 1400; // quiet this long => the student has finished
      const MIN_SPEECH_MS = 400; // ignore a stray click at the very start
      const MAX_TURN_MS = 30_000; // hard stop so a failed VAD can't hang forever
      let spokeAt = 0;
      let quietSince = 0;
      const startedAt = performance.now();
      let raf = 0;
      // Track whether we ever heard the student, so the caller can discard
      // empty audio instead of sending it to the transcriber (which would
      // hallucinate — often in a random language).
      heardSpeechRef.current = false;

      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const now = performance.now();

        if (rms > SILENCE) {
          spokeAt = now;
          quietSince = 0;
          heardSpeechRef.current = true;
        } else if (spokeAt && now - startedAt > MIN_SPEECH_MS) {
          if (!quietSince) quietSince = now;
          else if (now - quietSince > HANG_MS) {
            onSilenceRef.current?.();
            return; // stop polling; stop() tears the rest down
          }
        }
        // Never leave the mic open indefinitely if detection misbehaves.
        if (now - startedAt > MAX_TURN_MS) {
          onSilenceRef.current?.();
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      vadCleanupRef.current = () => {
        cancelAnimationFrame(raf);
        try {
          source.disconnect();
          void ctx.close();
        } catch {
          /* already closed */
        }
        vadCleanupRef.current = null;
      };
    } catch {
      /* no VAD available — manual stop still works */
    }
  }

  async function start(opts?: { onSilence?: () => void }): Promise<boolean> {
    setError("");
    // A double-tap before getUserMedia resolves would orphan the first stream.
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onSilenceRef.current = opts?.onSilence ?? null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      if (opts?.onSilence) watchForSilence(stream);
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        vadCleanupRef.current?.();
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setRecording(false);
        resolveRef.current?.(blob.size > 0 ? blob : null);
        resolveRef.current = null;
      };
      rec.start();
      setRecording(true);
      return true;
    } catch {
      setError(
        "No pudimos acceder al micrófono. Revisa los permisos del navegador e inténtalo de nuevo.",
      );
      setRecording(false);
      return false;
    }
  }

  function stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!recRef.current || recRef.current.state === "inactive") {
        resolve(null);
        return;
      }
      resolveRef.current = resolve;
      recRef.current.stop();
    });
  }

  return { recording, error, start, stop, heardSpeech: () => heardSpeechRef.current };
}
