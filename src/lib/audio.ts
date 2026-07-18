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

/** Plays a base64 MP3 and resolves when it finishes (or fails). */
export function playBase64Mp3(b64: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      const audio = new Audio(url);
      const done = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onended = done;
      audio.onerror = done;
      void audio.play().catch(done);
    } catch {
      resolve();
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

  function watchForSilence(stream: MediaStream) {
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);

      const SILENCE = 0.015; // RMS below this counts as quiet
      const HANG_MS = 1400; // quiet this long => the student has finished
      const MIN_SPEECH_MS = 400; // ignore a stray click at the very start
      let spokeAt = 0;
      let quietSince = 0;
      const startedAt = performance.now();
      let raf = 0;

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
        } else if (spokeAt && now - startedAt > MIN_SPEECH_MS) {
          if (!quietSince) quietSince = now;
          else if (now - quietSince > HANG_MS) {
            onSilenceRef.current?.();
            return; // stop polling; stop() tears the rest down
          }
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

  return { recording, error, start, stop };
}
