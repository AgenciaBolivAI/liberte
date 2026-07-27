import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

/** Which kind of machine the student is learning on (admin analytics). */
export type DeviceKind = "desktop" | "mobile" | "tablet";

/**
 * Pure classifier — unit-tested against real user-agent strings.
 *
 * Order matters: tablets must be checked BEFORE phones, because iPads and
 * Android tablets carry "Mobile"-adjacent tokens, and modern iPadOS reports
 * itself as "Macintosh" (caught via touch support on a Mac-looking UA).
 */
export function detectDevice(
  ua: string,
  opts: { touchPoints?: number; width?: number; uaDataMobile?: boolean } = {},
): DeviceKind {
  const s = (ua || "").toLowerCase();
  const touch = Number(opts.touchPoints ?? 0) > 0;

  // Explicit tablet markers, plus iPadOS masquerading as desktop Safari.
  if (/ipad|tablet|playbook|silk|kindle/.test(s)) return "tablet";
  if (/macintosh/.test(s) && touch) return "tablet"; // iPadOS 13+ desktop-mode
  if (/android/.test(s) && !/mobile/.test(s)) return "tablet"; // Android tablets omit "Mobile"

  if (/iphone|ipod|windows phone|blackberry|bb10|opera mini|iemobile/.test(s)) return "mobile";
  if (/android/.test(s) && /mobile/.test(s)) return "mobile";
  // Client Hints are authoritative when the browser provides them.
  if (opts.uaDataMobile === true) return "mobile";
  if (/mobi/.test(s)) return "mobile";

  // Last resort for UA-less/odd browsers: a narrow touch screen is a phone.
  if (touch && Number(opts.width ?? 0) > 0 && Number(opts.width) <= 820) return "mobile";
  return "desktop";
}

/** Classify the CURRENT browser. */
export function currentDevice(): DeviceKind {
  if (typeof navigator === "undefined") return "desktop";
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  return detectDevice(navigator.userAgent, {
    touchPoints: navigator.maxTouchPoints,
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    uaDataMobile: uaData?.mobile,
  });
}

const SESSION_KEY = "liberte:device-recorded";

/**
 * Record which device this student is using — once per browser session, so the
 * admin analytics can answer "how many users on desktop vs mobile" without
 * writing on every navigation. Writes go through the `record_device` RPC
 * (SECURITY DEFINER, pinned to auth.uid()), never a direct table write.
 */
export function useRecordDevice(): void {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const device = currentDevice();
    const key = `${SESSION_KEY}:${device}`;
    try {
      if (sessionStorage.getItem(key)) return; // already counted this session
    } catch {
      /* storage blocked — record anyway, at most once per page load */
    }
    void supabase.rpc("record_device", { _device: device }).then(({ error }) => {
      if (error) {
        console.error("[record_device]", error.message);
        return;
      }
      try {
        sessionStorage.setItem(key, "1");
      } catch {
        /* ignore */
      }
    });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
