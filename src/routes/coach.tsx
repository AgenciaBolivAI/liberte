import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, User, Target, AlertCircle, Sparkles, Unlock, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getCoachRoster, getStudentResults } from "@/lib/defi.functions";
import { getStudentProgress, unlockWeek, lockWeek } from "@/lib/coach.functions";
import { getWeeks } from "@/data/program";
import { CalendarManager } from "@/components/CalendarManager";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "Panel del profesor · Liberté" },
      { name: "description", content: "Progreso, aciertos y errores de cada alumno del programa Liberté." },
    ],
  }),
  component: CoachPage,
});

type Roster = Awaited<ReturnType<typeof getCoachRoster>>;
type Detail = Awaited<ReturnType<typeof getStudentResults>>;

function CoachPage() {
  const { user, loading } = useAuth();
  const [roster, setRoster] = useState<Roster | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [err, setErr] = useState("");
  const [loadingRoster, setLoadingRoster] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    setLoadingRoster(true);
    getCoachRoster()
      .then((r) => setRoster(r))
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoadingRoster(false));
  }, [loading, user]);

  useEffect(() => {
    if (!selected) return;
    setDetail(null);
    getStudentResults({ data: { userId: selected } })
      .then(setDetail)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"));
  }, [selected]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b3a]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <p className="text-navy">Necesitas iniciar sesión.</p>
        <Link to="/liberte-log-in-983749824923465723" className="text-blue underline">Ir a login</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to="/liberte-plataforma-834798234728482934254-student" className="inline-flex items-center gap-1 text-sm text-blue hover:underline">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-navy">👩‍🏫 Panel del profesor</h1>
          <p className="text-sm text-muted-foreground">Progreso de cada alumno en los desafíos finales.</p>
        </div>
      </div>

      {err && (
        <div className="mb-4 rounded-2xl border border-red/40 bg-red/5 p-4 text-sm text-red">
          <AlertCircle className="mr-2 inline h-4 w-4" /> {err}
          {err === "Forbidden" && (
            <p className="mt-1 text-xs text-red/80">
              Tu cuenta aún no tiene rol de coach o admin. Pide que te lo asignen desde el backend.
            </p>
          )}
        </div>
      )}

      {loadingRoster && <Loader2 className="h-6 w-6 animate-spin text-blue" />}

      {roster && <CalendarManager />}

      {roster && (
        <div className="grid gap-6 md:grid-cols-[320px_1fr]">
          <div className="space-y-2">
            <p className="text-xs font-extrabold uppercase text-navy/70">Alumnos ({roster.length})</p>
            {roster.length === 0 && <p className="text-sm text-muted-foreground">Sin alumnos aún.</p>}
            {roster.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  selected === s.id ? "border-blue bg-blue/5" : "border-border bg-white hover:border-blue/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-navy/60" />
                  <span className="font-semibold text-navy">{s.full_name || s.email || "Alumno"}</span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-navy/70">
                  <span>📅 {s.days_completed} días</span>
                  <span>⭐ {s.avg_score.toFixed(1)}/10</span>
                  <span className="text-success">✓{s.total_hits}</span>
                  <span className="text-red">✗{s.total_misses}</span>
                </div>
              </button>
            ))}
          </div>

          <div>
            {!selected && (
              <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Selecciona un alumno para ver su detalle.
              </div>
            )}
            {selected && !detail && <Loader2 className="h-6 w-6 animate-spin text-blue" />}
            {detail && <StudentDetail detail={detail} userId={selected!} />}
          </div>
        </div>
      )}
    </div>
  );
}


function ProgressPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getStudentProgress>> | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState("");

  const reload = () => getStudentProgress({ data: { userId } }).then(setData).catch((e) => setErr(String(e?.message ?? e)));
  useEffect(() => { setData(null); reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [userId]);

  if (!data) return <div className="rounded-2xl border border-border bg-white p-5"><Loader2 className="h-5 w-5 animate-spin text-blue" /></div>;

  const overrides = data.unlocks.map((u) => u.week_number);
  const { weeks, currentDay } = getWeeks(data.profile?.created_at, overrides, []);
  const currentWeek = weeks.find((w) => w.isCurrent) ?? weeks[0];

  async function toggle(weekNumber: number, unlocked: boolean) {
    setBusy(weekNumber); setErr("");
    try {
      if (unlocked) await lockWeek({ data: { userId, weekNumber } });
      else await unlockWeek({ data: { userId, weekNumber } });
      await reload();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(null); }
  }

  return (
    <div className="rounded-3xl border border-blue/40 bg-blue/5 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-lg font-extrabold text-navy">📍 Progreso del programa</p>
        <span className="text-xs text-navy/70">Día {currentDay} desde inscripción</span>
      </div>
      <p className="mt-1 text-sm text-navy/85">
        Semana actual: <b>#{currentWeek.globalIndex}</b> — Mes {currentWeek.monthIndex} · {currentWeek.monthName} (Semaine {currentWeek.weekIndexInMonth})
      </p>
      {err && <p className="mt-2 text-xs text-red">{err}</p>}
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {weeks.map((w) => {
          const isOverride = overrides.includes(w.globalIndex);
          const unlocked = w.status !== "locked-time";
          return (
            <button
              key={w.globalIndex}
              onClick={() => toggle(w.globalIndex, isOverride)}
              disabled={busy === w.globalIndex || (unlocked && !isOverride)}
              title={
                isOverride ? "Desbloqueado manualmente — clic para revocar"
                : unlocked ? "Ya disponible por el calendario"
                : `Clic para desbloquear (disponible en ${w.daysUntilUnlock} días)`
              }
              className={`relative rounded-xl border p-2 text-left text-[10px] transition ${
                w.isCurrent ? "border-blue bg-blue/15 font-bold text-navy" :
                isOverride ? "border-gold bg-gold/15 text-navy" :
                unlocked ? "border-success/40 bg-success/5 text-navy/80" :
                "border-border bg-white text-navy/60 hover:border-blue/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">S{w.globalIndex}</span>
                {busy === w.globalIndex ? <Loader2 className="h-3 w-3 animate-spin" /> :
                  isOverride ? <Unlock className="h-3 w-3 text-gold" /> :
                  unlocked ? <Unlock className="h-3 w-3 text-success" /> :
                  <Lock className="h-3 w-3 text-navy/40" />}
              </div>
              <div className="mt-0.5 truncate">{w.monthName}</div>
              {!unlocked && <div className="text-[9px] text-navy/50">+{w.daysUntilUnlock}d</div>}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-navy/60">
        Haz clic en una semana bloqueada para desbloquearla para este alumno. Las semanas ya disponibles por calendario no se pueden bloquear.
      </p>
    </div>
  );
}

function StudentDetail({ detail, userId }: { detail: Detail; userId: string }) {
  const { profile, results, weekly } = detail;
  const totalHits = results.reduce((a, r) => a + (r.hits ?? 0), 0);
  const totalMisses = results.reduce((a, r) => a + (r.misses ?? 0), 0);
  const avg = results.length ? results.reduce((a, r) => a + Number(r.score_10), 0) / results.length : 0;

  return (
    <div className="space-y-4">
      <ProgressPanel userId={userId} />
      <div className="rounded-3xl border border-border bg-white p-5 shadow-soft">
        <h2 className="font-display text-2xl font-extrabold text-navy">
          {profile?.full_name || profile?.email || "Alumno"}
        </h2>
        <p className="text-xs text-muted-foreground">{profile?.email}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-blue/10 px-3 py-1 text-navy">📅 {results.length} días</span>
          <span className="rounded-full bg-gold/20 px-3 py-1 text-navy">⭐ {avg.toFixed(1)}/10</span>
          <span className="rounded-full bg-success/10 px-3 py-1 text-success">✅ {totalHits} aciertos</span>
          <span className="rounded-full bg-red/10 px-3 py-1 text-red">❌ {totalMisses} errores</span>
        </div>
      </div>

      {(weekly ?? []).length > 0 && (
        <div className="rounded-3xl border border-gold/40 bg-gold/5 p-5">
          <p className="font-display text-lg font-extrabold text-navy">🏅 Autoevaluaciones semanales</p>
          <ul className="mt-2 space-y-2 text-sm">
            {weekly.map((w) => (
              <li key={w.week_number} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3">
                <span className="font-bold text-navy">Semana {w.week_number}</span>
                <span className="rounded-full bg-gradient-blue px-3 py-1 font-extrabold text-white">
                  {Number(w.weekly_score).toFixed(1)}/10
                </span>
                <span className="text-xs text-muted-foreground">
                  {w.pdf_generated
                    ? `📄 PDF descargado ${w.pdf_generated_at ? new Date(w.pdf_generated_at).toLocaleDateString() : ""}`
                    : "📄 PDF sin descargar"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {results.length === 0 && (
        <p className="rounded-2xl border border-border bg-white p-5 text-sm text-muted-foreground">
          Este alumno aún no ha completado ningún desafío final.
        </p>
      )}

      {results.map((r) => {
        const strengths = Array.isArray(r.strengths) ? (r.strengths as string[]) : [];
        const errors = Array.isArray(r.errors) ? (r.errors as { stage: number; said: string; corrected: string }[]) : [];
        const weak = Array.isArray(r.weak_points) ? (r.weak_points as string[]) : [];
        return (
          <div key={r.id} className="rounded-2xl border border-border bg-white p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-extrabold text-navy">Día {r.day_id}</h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded-full bg-gradient-blue px-3 py-1 font-extrabold text-white">
                  {Number(r.score_10).toFixed(1)}/10
                </span>
                <span className="text-success">✓{r.hits}</span>
                <span className="text-red">✗{r.misses}</span>
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <p className="flex items-center gap-1 text-xs font-extrabold uppercase text-success">
                  <Sparkles className="h-3 w-3" /> Aciertos
                </p>
                <ul className="mt-1 space-y-1 text-sm text-navy/90">
                  {strengths.map((s, i) => (
                    <li key={i}>✅ {s}</li>
                  ))}
                  {strengths.length === 0 && <li className="text-muted-foreground text-xs">—</li>}
                </ul>
              </div>
              <div>
                <p className="flex items-center gap-1 text-xs font-extrabold uppercase text-red">
                  <AlertCircle className="h-3 w-3" /> Errores comunes
                </p>
                <ul className="mt-1 space-y-1 text-sm">
                  {errors.map((e, i) => (
                    <li key={i} className="text-navy/90">
                      <span className="text-muted-foreground">Dijo:</span> « {e.said || "—"} »
                      <br />
                      <span className="text-muted-foreground">→</span> <span className="font-semibold">« {e.corrected} »</span>
                    </li>
                  ))}
                  {errors.length === 0 && <li className="text-muted-foreground text-xs">—</li>}
                </ul>
              </div>
            </div>
            {weak.length > 0 && (
              <div className="mt-3 rounded-xl border border-blue/30 bg-blue/5 p-3 text-xs text-navy/90">
                <p className="flex items-center gap-1 font-extrabold uppercase text-blue">
                  <Target className="h-3 w-3" /> Puntos débiles
                </p>
                <ul className="mt-1 list-disc pl-4">
                  {weak.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            {r.recommendation && (
              <div className="mt-3 rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs text-navy/90">
                💡 <span className="font-semibold">Recomendación:</span> {r.recommendation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
