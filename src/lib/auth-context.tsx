import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type ProfileFields = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  country_residence: string | null;
  birth_date: string | null;
  objective: string | null;
  mother_tongue: string | null;
  avatar_url: string | null;
};

type AuthCtx = {
  loading: boolean;
  user: User | null;
  session: Session | null;
  fullName: string | null;
  avatarUrl: string | null;
  avatarPath: string | null;
  profile: ProfileFields | null;
  isAdmin: boolean;
  approved: boolean;
  refresh: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshAvatar: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  loading: true,
  user: null,
  session: null,
  fullName: null,
  avatarUrl: null,
  avatarPath: null,
  profile: null,
  isAdmin: false,
  approved: true,
  refresh: async () => {},
  refreshProfile: async () => {},
  refreshAvatar: async () => {},
});

async function signAvatar(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileFields | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [approved, setApproved] = useState(true);
  const [loading, setLoading] = useState(true);
  // The signed-in user id as last applied. Lets the auth listener recognise a
  // no-op event (same user) without depending on `user` state inside the
  // once-only subscription effect.
  const userIdRef = useRef<string | null>(null);

  async function loadProfile(uid: string) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, phone, nationality, country_residence, birth_date, objective, mother_tongue, avatar_url")
      .eq("id", uid)
      .maybeSingle();
    const p = (data as ProfileFields | null) ?? null;
    setProfile(p);
    if (p?.full_name) setFullName(p.full_name);
    const path = p?.avatar_url ?? null;
    setAvatarPath(path);
    setAvatarUrl(await signAvatar(path));
  }

  async function refreshProfile() {
    if (!user) return;
    await loadProfile(user.id);
  }

  async function refreshAvatar() {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    const path = (data as { avatar_url?: string | null } | null)?.avatar_url ?? null;
    setAvatarPath(path);
    setAvatarUrl(await signAvatar(path));
  }

  async function loadAdmin(uid: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(Boolean(data));
  }

  // Separate query on purpose: if the approval migration hasn't been applied
  // yet (column missing), this errors and we FAIL OPEN so nobody is locked out.
  async function loadApproval(uid: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("approved_at")
        .eq("id", uid)
        .maybeSingle();
      if (error) {
        setApproved(true);
        return;
      }
      setApproved(data ? data.approved_at != null : true);
    } catch {
      setApproved(true);
    }
  }

  async function refresh() {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
    userIdRef.current = data.session?.user?.id ?? null;
    if (data.session?.user) {
      const metaName = (data.session.user.user_metadata?.full_name as string) || null;
      if (metaName) setFullName(metaName);
      await Promise.all([
        loadProfile(data.session.user.id),
        loadAdmin(data.session.user.id),
        loadApproval(data.session.user.id),
      ]);
    } else {
      setFullName(null);
      setAvatarPath(null);
      setAvatarUrl(null);
      setProfile(null);
      setIsAdmin(false);
      setApproved(true);
    }
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      // WHY THIS IS EVENT-AWARE (it used to ignore `event` entirely):
      // supabase auth-js attaches a `visibilitychange` listener and, on EVERY
      // return to the tab, re-reads the session from localStorage and emits
      // SIGNED_IN — even when nothing changed — with a BRAND-NEW User object.
      // Blindly calling setUser/setSession there gave `user` a new identity on
      // every tab switch, which cascaded into refetches, remounts and (via
      // AuthGate) a full unmount of the page the student was working on.
      // A failed refresh could also emit a transient null session, which used to
      // clear `user` and bounce the student to the login screen mid-lesson.
      const nextUser = s?.user ?? null;

      setSession((prev) => (prev?.access_token === s?.access_token ? prev : s));

      // Same signed-in user as before → keep the existing object identity and
      // skip the profile/admin/approval refetches entirely.
      const sameUser = nextUser?.id && nextUser.id === userIdRef.current;
      if (sameUser) return;

      // Only a real sign-out clears the session state. Any other event that
      // arrives without a user (e.g. a transient refresh failure) is ignored;
      // `refresh()` and the library's own retry will settle the true state.
      if (!nextUser) {
        if (event === "SIGNED_OUT") {
          userIdRef.current = null;
          setUser(null);
          setFullName(null);
          setAvatarPath(null);
          setAvatarUrl(null);
          setProfile(null);
          setIsAdmin(false);
          setApproved(true);
        }
        return;
      }

      userIdRef.current = nextUser.id;
      setUser(nextUser);
      const metaName = (nextUser.user_metadata?.full_name as string) || null;
      if (metaName) setFullName(metaName);
      setTimeout(() => {
        loadProfile(nextUser.id);
        loadAdmin(nextUser.id);
        loadApproval(nextUser.id);
      }, 0);
    });
    refresh().finally(() => setLoading(false));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Memoized so an unrelated provider re-render doesn't hand every consumer a
  // brand-new context object (which re-ran their effects — one of the reasons a
  // tab switch used to churn the whole app). The `refresh*` callbacks are stable
  // in behaviour and intentionally excluded from the dependency list.
  const value = useMemo(
    () => ({
      loading,
      user,
      session,
      fullName,
      avatarUrl,
      avatarPath,
      profile,
      isAdmin,
      approved: approved || isAdmin,
      refresh,
      refreshProfile,
      refreshAvatar,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, user, session, fullName, avatarUrl, avatarPath, profile, isAdmin, approved],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
