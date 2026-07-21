import { useEffect, useRef, useState } from "react";
import { Loader2, CalendarPlus, Trash2, Pencil, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KIND_STYLE, localTime, type EventKind } from "@/lib/calendarEvents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Staff calendar of live classes (schedule + Zoom links). Shared by the /coach
// panel and the main admin dashboard so there's a single editor.

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

export function CalendarManager() {
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
