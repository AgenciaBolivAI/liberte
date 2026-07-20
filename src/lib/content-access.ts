import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { AccessOverride, AccessValue } from "@/lib/unlock";

// Client-side reader for the content-access overrides. RLS returns only the
// global switchboard rows plus the signed-in student's own rows; the `.or`
// filter keeps it to that set even for staff (who can read everyone's).

/** Live overrides that apply to a student. Defaults to the signed-in user;
 *  pass `targetUserId` (e.g. while an admin previews "view as student") to load
 *  that student's overrides instead — RLS lets staff read them. Empty
 *  pre-migration. */
export function useContentOverrides(targetUserId?: string | null): AccessOverride[] {
  const { user } = useAuth();
  const uid = targetUserId ?? user?.id ?? null;
  const [rows, setRows] = useState<AccessOverride[]>([]);
  useEffect(() => {
    if (!uid) {
      setRows([]);
      return;
    }
    let alive = true;
    supabase
      .from("content_access")
      .select("scope, target_type, target_id, access")
      .or(`scope.eq.global,user_id.eq.${uid}`)
      .then(({ data, error }) => {
        if (!alive) return;
        setRows(error ? [] : ((data ?? []) as AccessOverride[]));
      });
    return () => {
      alive = false;
    };
  }, [uid]);
  return rows;
}

/** Week-level override for a week (per-student scope beats global). */
export function weekOverride(
  weekId: number,
  rows: readonly AccessOverride[],
): AccessValue | undefined {
  const at = (scope: "global" | "user") =>
    rows.find((r) => r.scope === scope && r.target_type === "week" && r.target_id === weekId)?.access;
  return at("user") ?? at("global");
}
