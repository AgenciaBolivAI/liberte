import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const metaName = (s.user.user_metadata?.full_name as string) || null;
        if (metaName) setFullName(metaName);
        setTimeout(() => {
          loadProfile(s.user.id);
          loadAdmin(s.user.id);
          loadApproval(s.user.id);
        }, 0);
      } else {
        setFullName(null);
        setAvatarPath(null);
        setAvatarUrl(null);
        setProfile(null);
        setIsAdmin(false);
        setApproved(true);
      }
    });
    refresh().finally(() => setLoading(false));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
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
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
