import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

/**
 * True when the signed-in user is staff (coach OR admin). `useAuth().isAdmin` is
 * admin-only and misses coaches, so this adds a self-scoped `user_roles` read
 * (own-row select is RLS-permitted). Client-side convenience gate only — the
 * real protection is the RLS on the tables the staff editors write.
 */
export function useIsStaff(): boolean {
  const { user, isAdmin } = useAuth();
  const [isStaff, setIsStaff] = useState(isAdmin);

  useEffect(() => {
    if (isAdmin) {
      setIsStaff(true);
      return;
    }
    if (!user) {
      setIsStaff(false);
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
        if (alive) setIsStaff(Boolean(data));
      });
    return () => {
      alive = false;
    };
  }, [user, isAdmin]);

  return isStaff;
}
