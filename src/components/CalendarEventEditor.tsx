import { useState } from "react";
import { CalendarPlus, Loader2, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CalendarEvent, EventKind } from "@/lib/calendarEvents";

// Inline calendar editor: opened by clicking a day (create) or an event (edit)
// right on the calendar grid — no separate panel. Staff-only at the call site;
// writes are also RLS-protected (coach/admin only) as defence in depth.

type EditorInit =
  | { mode: "create"; presetDateISO: string }
  | { mode: "edit"; event: CalendarEvent };

/** ISO (UTC) → `YYYY-MM-DDTHH:mm` local string for a datetime-local input. */
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const KIND_OK = (k: string): EventKind =>
  (["europa", "latam", "taller", "repos"].includes(k) ? k : "taller") as EventKind;

export function CalendarEventEditor({ init, onClose, onSaved }: {
  init: EditorInit;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = init.mode === "edit" ? init.event : null;
  const [form, setForm] = useState({
    title: editing?.title ?? "",
    kind: (editing ? KIND_OK(editing.kind) : "europa") as EventKind,
    startLocal:
      init.mode === "edit"
        ? isoToLocalInput(init.event.startUtc)
        : `${init.presetDateISO}T20:00`,
    durationMin: editing?.durationMin ?? 90,
    zoomUrl: editing?.zoomUrl ?? "",
    zoomId: editing?.zoomId ?? "",
    description: editing?.desc ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save(e: React.FormEvent) {
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
      const { error } = editing
        ? await supabase.from("calendar_events").update(payload).eq("id", editing.id)
        : await supabase.from("calendar_events").insert({ ...payload, material_to: "/clasesenvivo" });
      if (error) throw new Error(error.message);
      onSaved();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo guardar el evento");
      setBusy(false);
    }
  }

  async function remove() {
    if (!editing) return;
    if (!window.confirm(`¿Eliminar «${editing.title}»?`)) return;
    setBusy(true);
    setErr("");
    const { error } = await supabase.from("calendar_events").delete().eq("id", editing.id);
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    onSaved();
  }

  const fieldCls = "w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="font-display text-xl font-extrabold text-navy">
            {editing ? "✏️ Editar evento" : "➕ Nuevo evento"}
          </h3>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-full p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={save} className="mt-4 grid gap-2">
          <Input
            placeholder="Título (ej. Clase EUROPA En vivo #9)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className={fieldCls}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={form.kind}
              onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as EventKind }))}
              className="h-10 rounded-md border border-input bg-white px-3 text-sm text-navy"
            >
              <option value="europa">Clase EUROPA</option>
              <option value="latam">Clase LATAM</option>
              <option value="taller">Taller</option>
              <option value="repos">Semana de repos</option>
            </select>
            <Input
              type="number"
              min={15}
              step={15}
              value={form.durationMin}
              onChange={(e) => setForm((f) => ({ ...f, durationMin: Number(e.target.value) }))}
              title="Duración en minutos"
              placeholder="Duración (min)"
            />
          </div>
          <label className="text-xs font-semibold text-navy/70">
            Fecha y hora (tu zona horaria; se guarda en UTC)
            <Input
              type="datetime-local"
              value={form.startLocal}
              onChange={(e) => setForm((f) => ({ ...f, startLocal: e.target.value }))}
              className="mt-1"
            />
          </label>
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

          {err && <p className="text-xs text-red">{err}</p>}

          <div className="mt-1 flex items-center gap-2">
            <Button type="submit" disabled={busy} className="flex-1 gap-2 bg-gradient-blue font-bold text-white">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Pencil className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
              {editing ? "Guardar cambios" : "Añadir evento"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => void remove()} disabled={busy} className="gap-1 text-red">
                <Trash2 className="h-4 w-4" /> Eliminar
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
