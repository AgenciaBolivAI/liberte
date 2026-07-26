import { useEffect, useState } from "react";
import { StudentAnalytics } from "@/components/StudentAnalytics";
import { Loader2, Target, AlertCircle, Sparkles, Unlock, Lock, GraduationCap } from "lucide-react";
import { getStudentResults } from "@/lib/defi.functions";
import { getStudentProgress, unlockWeek, lockWeek, setAssignedCoach } from "@/lib/coach.functions";
import { getWeeks } from "@/data/program";
import { StudentReportCard } from "@/components/StudentReportCard";
import { MessageThread } from "@/components/MessageThread";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Detail = Awaited<ReturnType<typeof getStudentResults>>;

/** Assign the student's teacher (client #12/#14): weekly reports land in this
 *  coach's Mensajes and every finished lesson notifies them. No coach assigned
 *  → every admin receives both. Admin-panel only (RLS: admins read all rows). */
function AssignedCoachCard({ userId }: { userId: string }) {
  const [staff, setStaff] = useState<{ id: string; name: string; role: string }[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoaded(false);
    (async () => {
      const [{ data: roles }, { data: prof }] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").in("role", ["coach", "admin"]),
        supabase.from("profiles").select("assigned_coach").eq("id", userId).maybeSingle(),
      ]);
      if (!alive) return;
      const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
      let people: { id: string; name: string; role: string }[] = [];
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
        if (!alive) return;
        const roleOf = new Map((roles ?? []).map((r) => [r.user_id, String(r.role)]));
        people = (profs ?? [])
          .map((p) => ({
            id: p.id,
            name: p.full_name || p.email || p.id.slice(0, 8),
            role: roleOf.get(p.id) ?? "coach",
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
      setStaff(people);
      setCurrent((prof as { assigned_coach?: string | null } | null)?.assigned_coach ?? null);
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, [userId]);

  async function save(coachId: string | null) {
    setBusy(true);
    try {
      await setAssignedCoach({ data: { userId, coachId } });
      setCurrent(coachId);
      toast.success(coachId ? "Profesor/a asignado/a" : "Asignación quitada — los informes irán a todos los admins");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la asignación");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-white p-4 sm:p-5 shadow-soft">
      <p className="flex items-center gap-2 font-display text-lg font-extrabold text-navy">
        <GraduationCap className="h-5 w-5 text-blue" /> Profesor/a asignado/a
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Recibe los informes semanales en Mensajes y una notificación por cada lección terminada.
        Sin asignación, los reciben todos los admins.
      </p>
      {!loaded ? (
        <Loader2 className="mt-3 h-5 w-5 animate-spin text-blue" />
      ) : (
        <select
          value={current ?? ""}
          disabled={busy}
          onChange={(e) => void save(e.target.value || null)}
          className="mt-3 w-full max-w-sm rounded-xl border border-border bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue/40"
        >
          <option value="">— Sin asignar (todos los admins) —</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.role === "admin" ? "(admin)" : "(coach)"}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function ProgressPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getStudentProgress>> | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState("");

  const reload = () =>
    getStudentProgress({ data: { userId } })
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  useEffect(() => {
    setData(null);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!data)
    return (
      <div className="rounded-2xl border border-border bg-white p-5">
        <Loader2 className="h-5 w-5 animate-spin text-blue" />
      </div>
    );

  const overrides = data.unlocks.map((u) => u.week_number);
  const { weeks, currentDay } = getWeeks(data.profile?.created_at, overrides, []);
  const currentWeek = weeks.find((w) => w.isCurrent) ?? weeks[0];

  async function toggle(weekNumber: number, unlocked: boolean) {
    setBusy(weekNumber);
    setErr("");
    try {
      if (unlocked) await lockWeek({ data: { userId, weekNumber } });
      else await unlockWeek({ data: { userId, weekNumber } });
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-3xl border border-blue/40 bg-blue/5 p-4 sm:p-5">
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
                isOverride
                  ? "Desbloqueado manualmente — clic para revocar"
                  : unlocked
                    ? "Ya disponible por el calendario"
                    : `Clic para desbloquear (disponible en ${w.daysUntilUnlock} días)`
              }
              className={`relative rounded-xl border p-2 text-left text-[10px] transition ${
                w.isCurrent
                  ? "border-blue bg-blue/15 font-bold text-navy"
                  : isOverride
                    ? "border-gold bg-gold/15 text-navy"
                    : unlocked
                      ? "border-success/40 bg-success/5 text-navy/80"
                      : "border-border bg-white text-navy/60 hover:border-blue/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">S{w.globalIndex}</span>
                {busy === w.globalIndex ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isOverride ? (
                  <Unlock className="h-3 w-3 text-gold" />
                ) : unlocked ? (
                  <Unlock className="h-3 w-3 text-success" />
                ) : (
                  <Lock className="h-3 w-3 text-navy/40" />
                )}
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

export function StudentDetailPanel({ userId }: { userId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    setDetail(null);
    setErr("");
    getStudentResults({ data: { userId } })
      .then(setDetail)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Error"));
  }, [userId]);

  if (err)
    return (
      <div className="rounded-2xl border border-red/40 bg-red/5 p-4 text-sm text-red">
        <AlertCircle className="mr-2 inline h-4 w-4" /> {err}
      </div>
    );
  if (!detail)
    return (
      <div className="rounded-2xl border border-border bg-white p-5">
        <Loader2 className="h-5 w-5 animate-spin text-blue" />
      </div>
    );

  const { results, weekly } = detail;
  const totalHits = results.reduce((a, r) => a + (r.hits ?? 0), 0);
  const totalMisses = results.reduce((a, r) => a + (r.misses ?? 0), 0);
  const avg = results.length ? results.reduce((a, r) => a + Number(r.score_10), 0) / results.length : 0;

  const studentName = detail.profile?.full_name || detail.profile?.email || "Alumno";

  return (
    <div className="space-y-4">
      <ProgressPanel userId={userId} />

      <AssignedCoachCard userId={userId} />

      <StudentReportCard userId={userId} />

      <div>
        <p className="mb-1 font-display text-lg font-extrabold text-navy">✉️ Mensajes</p>
        <MessageThread otherUserId={userId} otherName={studentName} />
      </div>

      <div className="rounded-3xl border border-border bg-white p-4 sm:p-5 shadow-soft">
        <p className="font-display text-lg font-extrabold text-navy">Resumen de desafíos</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-blue/10 px-3 py-1 text-navy">📅 {results.length} días</span>
          <span className="rounded-full bg-gold/20 px-3 py-1 text-navy">⭐ {avg.toFixed(1)}/10</span>
          <span className="rounded-full bg-success/10 px-3 py-1 text-success">✅ {totalHits} aciertos</span>
          <span className="rounded-full bg-red/10 px-3 py-1 text-red">❌ {totalMisses} errores</span>
        </div>
      </div>

      {/* Week-by-week analytics (replaces "download the PDF to see progress"). */}
      <div className="rounded-3xl border border-border bg-white p-4 sm:p-5">
        <p className="mb-3 font-display text-lg font-extrabold text-navy">📊 Progreso por semana</p>
        <StudentAnalytics userId={userId} />
      </div>

      {(weekly ?? []).length > 0 && (
        <div className="rounded-3xl border border-gold/40 bg-gold/5 p-4 sm:p-5">
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
                    ? `📄 PDF ${w.pdf_generated_at ? new Date(w.pdf_generated_at).toLocaleDateString() : ""}`
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
          <div key={r.id} className="rounded-2xl border border-border bg-white p-4 sm:p-5 shadow-soft">
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
