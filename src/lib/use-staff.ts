import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useAdminPreview } from "@/lib/admin-preview";

/**
 * True when the signed-in user is staff (coach OR admin) AND is not currently
 * previewing the app as a student. `useAuth().isAdmin` is admin-only and misses
 * coaches, so this adds a self-scoped `user_roles` read (own-row select is
 * RLS-permitted).
 *
 * It also returns false when an admin is in "Ver como alumno" preview mode, so
 * staff-only editors (calendar, recorded classes, content) disappear exactly
 * like they do for a real student — the teacher sees what the student sees.
 * (Coaches have no preview mode, so this only narrows admins.)
 *
 * Client-side convenience gate only — the real protection is the RLS on the
 * tables the staff editors write (coach/admin-only INSERT/UPDATE/DELETE).
 */
export function useIsStaff(): boolean {
  const { user, isAdmin } = useAuth();
  const { mode } = useAdminPreview();
  const [hasStaffRole, setHasStaffRole] = useState(isAdmin);

  useEffect(() => {
    if (isAdmin) {
      setHasStaffRole(true);
      return;
    }
    if (!user) {
      setHasStaffRole(false);
      return;
    }
    let alive = true;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["coach", "admin"])
      .maybeSingle()
      .then(({ data }) => {
        if (alive) setHasStaffRole(Boolean(data));
      });
    return () => {
      alive = false;
    };
  }, [user, isAdmin]);

  // Hide staff editing UI while an admin previews as a student ("student" /
  // "as-user"). Only admins have a preview mode, so coaches are unaffected.
  const previewingAsStudent = isAdmin && mode !== "teacher";
  return hasStaffRole && !previewingAsStudent;
}
