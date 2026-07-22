import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TopNav } from "@/components/TopNav";
import parisBg from "@/assets/paris-map-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TOTAL_DAYS, DAYS_PER_WEEK, TOTAL_WEEKS } from "@/lib/progress";
import { Star, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { StudentDetailPanel } from "@/components/StudentDetailPanel";
import { AdminAnalytics } from "@/components/AdminAnalytics";
import { ApprovalQueue } from "@/components/ApprovalQueue";
import { ContentAccessManager } from "@/components/ContentAccessManager";
import { TelegramBroadcast } from "@/components/TelegramBroadcast";
import { StaffManager } from "@/components/StaffManager";
import { ContentManager } from "@/components/ContentManager";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/liberte-profesor-panel-9382745-admin")({
  head: () => ({ meta: [{ title: "Panel Profesor — Liberté" }] }),
  component: TeacherPanel,
});

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  country_residence: string | null;
  birth_date: string | null;
  mother_tongue: string | null;
  objective: string | null;
  created_at: string;
};

type StudentStats = ProfileRow & {
  stars: number;
  daysCompleted: number;
  weeksCompleted: number;
  percent: number;
  lastActivity: string | null;
  activitiesCount: number;
  defisCount: number;
  avgDefiScore: number;
};

function TeacherPanel() {
  const { loading: authLoading, user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [students, setStudents] = useState<StudentStats[]>([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"stars" | "progress" | "name">("stars");

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
      setChecking(false);
    })();
  }, [authLoading, user]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoadingData(true);
      const [{ data: profiles }, { data: stars }, { data: days }, { data: defis }, { data: acts }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, phone, nationality, country_residence, birth_date, mother_tongue, objective, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("star_awards").select("user_id, amount, created_at"),
        supabase.from("day_completions").select("user_id, day_id, completed_at"),
        supabase.from("defi_results").select("user_id, score_10, created_at"),
        supabase.from("activity_results").select("user_id, score, created_at"),
      ]);

      const starsByUser = new Map<string, number>();
      const lastByUser = new Map<string, string>();
      const bump = (uid: string, ts?: string | null) => {
        if (!ts) return;
        const cur = lastByUser.get(uid);
        if (!cur || ts > cur) lastByUser.set(uid, ts);
      };
      (stars ?? []).forEach((r: { user_id: string; amount: number; created_at: string }) => {
        starsByUser.set(r.user_id, (starsByUser.get(r.user_id) ?? 0) + (r.amount ?? 0));
        bump(r.user_id, r.created_at);
      });

      const daysByUser = new Map<string, Set<number>>();
      (days ?? []).forEach((r: { user_id: string; day_id: number; completed_at: string }) => {
        if (!daysByUser.has(r.user_id)) daysByUser.set(r.user_id, new Set());
        daysByUser.get(r.user_id)!.add(r.day_id);
        bump(r.user_id, r.completed_at);
      });

      const defisByUser = new Map<string, { count: number; total: number }>();
      (defis ?? []).forEach((r: { user_id: string; score_10: number | string; created_at: string }) => {
        const cur = defisByUser.get(r.user_id) ?? { count: 0, total: 0 };
        cur.count += 1;
        cur.total += Number(r.score_10) || 0;
        defisByUser.set(r.user_id, cur);
        bump(r.user_id, r.created_at);
      });

      const actsByUser = new Map<string, number>();
      (acts ?? []).forEach((r: { user_id: string; score: number | string; created_at: string }) => {
        actsByUser.set(r.user_id, (actsByUser.get(r.user_id) ?? 0) + 1);
        bump(r.user_id, r.created_at);
      });

      const rows: StudentStats[] = (profiles ?? []).map((p: ProfileRow) => {
        const daysSet = daysByUser.get(p.id) ?? new Set();
        const daysCompleted = daysSet.size;
        const d = defisByUser.get(p.id);
        return {
          ...p,
          stars: starsByUser.get(p.id) ?? 0,
          daysCompleted,
          weeksCompleted: Math.floor(daysCompleted / DAYS_PER_WEEK),
          percent: Math.round((daysCompleted / TOTAL_DAYS) * 100),
          lastActivity: lastByUser.get(p.id) ?? null,
          activitiesCount: actsByUser.get(p.id) ?? 0,
          defisCount: d?.count ?? 0,
          avgDefiScore: d && d.count ? d.total / d.count : 0,
        };
      });
      setStudents(rows);
      setLoadingData(false);
    })();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? students.filter(
          (s) =>
            (s.full_name ?? "").toLowerCase().includes(q) ||
            (s.email ?? "").toLowerCase().includes(q) ||
            (s.nationality ?? "").toLowerCase().includes(q),
        )
      : students;
    const sorted = [...list];
    if (sortBy === "stars") sorted.sort((a, b) => b.stars - a.stars);
    else if (sortBy === "progress") sorted.sort((a, b) => b.daysCompleted - a.daysCompleted);
    else sorted.sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
    return sorted;
  }, [students, query, sortBy]);

  if (authLoading || checking) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) return <Navigate to="/liberte-log-in-983749824923465723" />;

  if (!isAdmin) {
    return (
      <div
        className="relative min-h-screen bg-cover bg-center md:bg-fixed"
        style={{
          backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.78) 0%, oklch(0.32 0.08 265 / 0.90) 100%), url(${parisBg})`,
        }}
      >
        <TopNav />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="rounded-3xl border border-white/15 bg-card p-8 shadow-card">
            <h1 className="font-display text-2xl font-extrabold text-navy">Acceso restringido</h1>
            <p className="mt-2 text-muted-foreground">Esta página solo está disponible para el equipo de Liberté.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-cover bg-center md:bg-fixed"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.78) 0%, oklch(0.32 0.08 265 / 0.90) 100%), url(${parisBg})`,
      }}
    >
      <TopNav />
      <Toaster position="top-center" richColors />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-white">Panel del profesor</h1>
            <p className="text-white/80">Visión general de todos los alumnos inscritos.</p>
          </div>
        </div>

        <ApprovalQueue />

        <AdminAnalytics />

        <ContentAccessManager students={students} />

        <ContentManager />

        <TelegramBroadcast />

        <StaffManager />

        <div className="mb-4 flex flex-wrap gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, email o nacionalidad…"
            className="flex-1 min-w-[240px] rounded-full border border-white/20 bg-white/95 px-5 py-2.5 text-navy placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-full border border-white/20 bg-white/95 px-5 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-blue"
          >
            <option value="stars">Ranking por estrellas ⭐</option>
            <option value="progress">Ranking por progreso</option>
            <option value="name">Orden alfabético</option>
          </select>
        </div>

        {loadingData ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/15 bg-card p-8 text-center text-muted-foreground">
            No hay alumnos que coincidan con tu búsqueda.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((s, idx) => (
              <StudentCard key={s.id} student={s} rank={sortBy !== "name" ? idx + 1 : null} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StudentCard({ student, rank }: { student: StudentStats; rank: number | null }) {
  const [open, setOpen] = useState(false);
  const birth = student.birth_date
    ? format(parseISO(student.birth_date), "d MMM yyyy", { locale: es })
    : "—";
  const enrolled = format(parseISO(student.created_at), "d MMM yyyy", { locale: es });
  const last = student.lastActivity
    ? format(parseISO(student.lastActivity), "d MMM yyyy", { locale: es })
    : "Sin actividad";
  const initial = (student.full_name || student.email || "?").charAt(0).toUpperCase();
  const currentWeek = Math.min(student.weeksCompleted + 1, TOTAL_WEEKS);

  return (
    <div className="rounded-3xl border border-white/15 bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-blue font-display text-xl font-extrabold text-white">
          {initial}
        </div>
        <div className="flex-1 min-w-[220px]">
          <div className="flex flex-wrap items-center gap-2">
            {rank !== null && (
              <span className="rounded-full bg-navy px-2.5 py-0.5 text-xs font-bold text-white">#{rank}</span>
            )}
            <h3 className="font-display text-lg font-extrabold text-navy">
              {student.full_name || "Sin nombre"}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">{student.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="flex items-center gap-1 font-display text-2xl font-extrabold text-navy">
              <Star className="h-5 w-5 fill-blue text-blue" />
              {student.stars}
            </div>
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Estrellas</p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl font-extrabold text-navy">S{currentWeek}</p>
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Semana</p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="uppercase tracking-widest">Progreso · días</span>
            <span className="text-navy">{student.daysCompleted} / {TOTAL_DAYS} ({student.percent}%)</span>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-ice ring-1 ring-navy/10">
            <div
              className="h-full rounded-full bg-gradient-blue transition-all"
              style={{ width: `${Math.max(2, student.percent)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="uppercase tracking-widest">Estrellas acumuladas</span>
            <span className="inline-flex items-center gap-1 text-navy">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              {student.stars} / {TOTAL_DAYS * 4}
            </span>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-ice ring-1 ring-navy/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold to-blue transition-all"
              style={{ width: `${Math.min(100, Math.max(2, (student.stars / (TOTAL_DAYS * 4)) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Días" value={student.daysCompleted} accent="blue" />
        <MiniStat label="Actividades" value={student.activitiesCount} accent="ice" />
        <MiniStat label="Défis" value={student.defisCount} accent="ice" />
        <MiniStat
          label="Media défi"
          value={student.defisCount ? `${student.avgDefiScore.toFixed(1)}/10` : "—"}
          accent="gold"
        />
      </div>

      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <Info label="Teléfono" value={student.phone || "—"} />
        <Info label="Nacionalidad" value={student.nationality || "—"} />
        <Info label="País" value={student.country_residence || "—"} />
        <Info label="Nacimiento" value={birth} />
        <Info label="Idioma materno" value={student.mother_tongue || "—"} />
        <Info label="Objetivo" value={student.objective || "—"} />
        <Info label="Inscrita" value={enrolled} />
        <Info label="Última actividad" value={last} />
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-blue px-5 py-2 text-sm font-bold text-white shadow-card hover:opacity-90"
      >
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {open ? "Ocultar detalle" : "Ver detalle y desbloquear semanas"}
      </button>

      {open && (
        <div className="mt-5 border-t border-border pt-5">
          <StudentDetailPanel userId={student.id} />
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ice px-3 py-2">
      <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className="font-medium text-navy break-words">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number | string; accent: "blue" | "gold" | "ice" }) {
  const bg = accent === "blue" ? "bg-blue/10" : accent === "gold" ? "bg-gold/15" : "bg-ice";
  return (
    <div className={`rounded-xl ${bg} px-3 py-2 text-center`}>
      <p className="font-display text-xl font-extrabold text-navy leading-tight">{value}</p>
      <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
