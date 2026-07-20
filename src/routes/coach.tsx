import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, ArrowLeft, User, Target, AlertCircle, Sparkles, Unlock, Lock, CalendarPlus, Trash2, Pencil, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { getCoachRoster, getStudentResults } from "@/lib/defi.functions";
import { getStudentProgress, unlockWeek, lockWeek } from "@/lib/coach.functions";
import { KIND_STYLE, localTime, type EventKind } from "@/lib/calendarEvents";
import { getWeeks } from "@/data/program";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

type CalendarRow = {
  id: string;
  kind: string;
  title: string;
  start_utc: string;
  duration_min: number;
  zoom_url: string | null;
  zoom_id: string | null;
  description: string | null;
};

/** ISO (UTC) → the `YYYY-MM-DDTHH:mm` local string a datetime-local input needs,
 *  so editing round-trips through `new Date(startLocal).toISOString()` unchanged. */
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CalendarManager() {
  const [rows, setRows] = useState<CalendarRow[] | null>(null);
  const [tableMissing, setTableMissing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState({
    title: "",
    kind: "europa" as EventKind,
    startLocal: "",
    durationMin: 90,
    zoomUrl: "",
    zoomId: "",
    description: "",
  });

  async function reload() {
    const { data, error } = await supabase
      .from("calendar_events")
      .select("id, kind, title, start_utc, duration_min, zoom_url, zoom_id, description")
      .order("start_utc", { ascending: true });
    if (error) {
      setTableMissing(true);
      setRows([]);
      return;
    }
    setRows((data as CalendarRow[]) ?? []);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setForm({ title: "", kind: "europa", startLocal: "", durationMin: 90, zoomUrl: "", zoomId: "", description: "" });
    setEditingId(null);
    setErr("");
  }

  function beginEdit(row: CalendarRow) {
    setErr("");
    setEditingId(row.id);
    setForm({
      title: row.title,
      kind: (["europa", "latam", "taller", "repos"].includes(row.kind) ? row.kind : "taller") as EventKind,
      startLocal: isoToLocalInput(row.start_utc),
      durationMin: row.duration_min,
      zoomUrl: row.zoom_url ?? "",
      zoomId: row.zoom_id ?? "",
      description: row.description ?? "",
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function saveEvent(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!form.title.trim() || !form.startLocal) {
      setErr("Título y fecha/hora son obligatorios.");
      return;
    }
    const start = new Date(form.startLocal);
    if (Number.isNaN(start.getTime())) {
      setErr("Fecha/hora inválida.");
      return;
    }
    const payload = {
      title: form.title.trim(),
      kind: form.kind,
      start_utc: start.toISOString(),
      duration_min: Number(form.durationMin) || 90,
      zoom_url: form.zoomUrl.trim() || null,
      zoom_id: form.zoomId.trim() || null,
      description: form.description.trim() || null,
    };
    setBusy(true);
    try {
      if (editingId) {
        const { error } = await supabase.from("calendar_events").update(payload).eq("id", editingId);
        if (error) throw new Error(error.message);
        resetForm();
      } else {
        const { error } = await supabase
          .from("calendar_events")
          .insert({ ...payload, material_to: "/clasesenvivo" });
        if (error) throw new Error(error.message);
        // Keep kind/duration/zoom so the teacher can add a series quickly.
        setForm((f) => ({ ...f, title: "", startLocal: "" }));
      }
      await reload();
    } catch (e2) {
      setErr(
        e2 instanceof Error
          ? e2.message
          : editingId
            ? "No se pudo guardar el evento"
            : "No se pudo crear el evento",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeEvent(row: CalendarRow) {
    if (!window.confirm(`¿Eliminar «${row.title}»?`)) return;
    setErr("");
    if (editingId === row.id) resetForm();
    const { error } = await supabase.from("calendar_events").delete().eq("id", row.id);
    if (error) setErr(error.message);
    await reload();
  }

  const now = Date.now();
  const visible = rows
    ? expanded
      ? rows
      : rows.filter((r) => new Date(r.start_utc).getTime() + r.duration_min * 60_000 > now)
    : [];

  return (
    <div className="mb-6 rounded-3xl border border-border bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-lg font-extrabold text-navy">📅 Calendario de clases</p>
        {rows && rows.length > 0 && (
          <button onClick={() => setExpanded((v) => !v)} className="text-xs font-semibold text-blue hover:underline">
            {expanded ? "Ver solo próximos" : `Ver todos (${rows.length})`}
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Los eventos que crees aquí aparecen al instante en el calendario y en los avisos de clase de todos los alumnos.
      </p>

      {tableMissing && (
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs text-navy">
          La tabla <code>calendar_events</code> aún no existe en la base de datos: aplica la migración
          <code> 20260718000001_calendar_events.sql</code>. Mientras tanto la app muestra el calendario fijo del código.
        </p>
      )}

      {rows === null && <Loader2 className="mt-3 h-5 w-5 animate-spin text-blue" />}

      {rows !== null && !tableMissing && (
        <>
          <ul className="mt-3 divide-y divide-border">
            {visible.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">Sin eventos próximos.</li>
            )}
            {visible.map((r) => {
              const style = KIND_STYLE[(r.kind as EventKind) in KIND_STYLE ? (r.kind as EventKind) : "taller"];
              return (
                <li
                  key={r.id}
                  className={`flex items-center justify-between gap-3 py-2 ${editingId === r.id ? "rounded-xl bg-blue/5 ring-1 ring-blue/30" : ""}`}
                >
                  <div className="min-w-0">
                    <span
                      className="mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: style.dot }}
                    >
                      {style.label}
                    </span>
                    <span className="text-sm font-semibold text-navy">{r.title}</span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.start_utc).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                      {" · "}{localTime(r.start_utc)} (tu hora) · {r.duration_min} min
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => beginEdit(r)}
                      aria-label="Editar evento"
                      className="rounded-full p-2 text-blue hover:bg-blue/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeEvent(r)}
                      aria-label="Eliminar evento"
                      className="rounded-full p-2 text-red hover:bg-red/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <form ref={formRef} onSubmit={saveEvent} className="mt-4 grid gap-2 rounded-2xl bg-ice p-3 sm:grid-cols-2">
            {editingId && (
              <p className="sm:col-span-2 text-xs font-semibold text-blue">
                ✏️ Editando un evento existente. Guarda los cambios o cancela para crear uno nuevo.
              </p>
            )}
            <Input
              placeholder="Título (ej. Clase EUROPA En vivo #9)"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="sm:col-span-2"
            />
            <select
              value={form.kind}
              onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as EventKind }))}
              className="h-10 rounded-md border border-input bg-white px-3 text-sm"
            >
              <option value="europa">Clase EUROPA</option>
              <option value="latam">Clase LATAM</option>
              <option value="taller">Taller</option>
              <option value="repos">Semana de repos</option>
            </select>
            <Input
              type="datetime-local"
              value={form.startLocal}
              onChange={(e) => setForm((f) => ({ ...f, startLocal: e.target.value }))}
              title="Hora en tu zona horaria; se guarda en UTC"
            />
            <Input
              type="number"
              min={15}
              step={15}
              value={form.durationMin}
              onChange={(e) => setForm((f) => ({ ...f, durationMin: Number(e.target.value) }))}
              title="Duración en minutos"
              placeholder="Duración (min)"
            />
            <Input
              placeholder="Zoom URL (opcional)"
              value={form.zoomUrl}
              onChange={(e) => setForm((f) => ({ ...f, zoomUrl: e.target.value }))}
            />
            <Input
              placeholder="Zoom ID (opcional)"
              value={form.zoomId}
              onChange={(e) => setForm((f) => ({ ...f, zoomId: e.target.value }))}
            />
            <Input
              placeholder="Descripción (opcional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={busy} className="flex-1 bg-gradient-blue font-bold text-white">
                {busy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingId ? (
                  <Pencil className="mr-2 h-4 w-4" />
                ) : (
                  <CalendarPlus className="mr-2 h-4 w-4" />
                )}
                {editingId ? "Guardar cambios" : "Añadir evento"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={busy}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </form>
          {err && <p className="mt-2 text-xs text-red">{err}</p>}
        </>
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
