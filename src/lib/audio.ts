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
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  async function start(): Promise<boolean> {
    setError("");
    // A double-tap before getUserMedia resolves would orphan the first stream.
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
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
