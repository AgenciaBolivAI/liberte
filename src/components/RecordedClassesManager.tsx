import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Row = {
  id: string;
  number: number;
  title: string;
  date_label: string;
  video_url: string | null;
  sort: number;
};

const EMPTY = { number: 1, title: "", dateLabel: "", videoUrl: "" };

/** Staff: manage the recorded live-class replay links students see in
 *  "En direct" — no more hardcoded list. */
export function RecordedClassesManager() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [tableMissing, setTableMissing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("recorded_classes")
      .select("id, number, title, date_label, video_url, sort")
      .order("sort")
      .order("number");
    if (error) {
      setTableMissing(true);
      setRows([]);
      return;
    }
    setRows((data ?? []) as Row[]);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function beginEdit(r: Row) {
    setEditingId(r.id);
    setForm({ number: r.number, title: r.title, dateLabel: r.date_label, videoUrl: r.video_url ?? "" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setBusy(true);
    const payload = {
      number: Number(form.number) || 1,
      title: form.title.trim(),
      date_label: form.dateLabel.trim(),
      video_url: form.videoUrl.trim() || null,
    };
    const { error } = editingId
      ? await supabase.from("recorded_classes").update(payload).eq("id", editingId)
      : await supabase.from("recorded_classes").insert({ ...payload, sort: (rows?.length ?? 0) + 1 });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForm(EMPTY);
    setEditingId(null);
    await reload();
  }

  async function remove(r: Row) {
    if (!window.confirm(`¿Eliminar «${r.title}»?`)) return;
    await supabase.from("recorded_classes").delete().eq("id", r.id);
    if (editingId === r.id) {
      setEditingId(null);
      setForm(EMPTY);
    }
    await reload();
  }

  return (
    <div className="mb-6 rounded-3xl border border-border bg-white p-5 shadow-soft">
      <p className="font-display text-lg font-extrabold text-navy">🎥 Clases grabadas</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Los enlaces que añadas aquí aparecen al instante en «En direct» para todos los alumnos.
      </p>

      {tableMissing && (
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs text-navy">
          Aplica la migración <code>20260720000004_recorded_classes.sql</code>. Mientras tanto se muestra la lista fija del código.
        </p>
      )}

      {rows === null ? (
        <Loader2 className="mt-3 h-5 w-5 animate-spin text-blue" />
      ) : (
        <>
          <ul className="mt-3 divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className={`flex items-center justify-between gap-3 py-2 ${editingId === r.id ? "rounded-xl bg-blue/5 ring-1 ring-blue/30" : ""}`}>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-navy">
                    #{r.number} · {r.title}
                  </span>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.date_label || "—"} {r.video_url ? "· 🎬 con enlace" : "· sin enlace"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => beginEdit(r)} aria-label="Editar" className="rounded-full p-2 text-blue hover:bg-blue/10">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => void remove(r)} aria-label="Eliminar" className="rounded-full p-2 text-red hover:bg-red/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <form onSubmit={save} className="mt-4 grid gap-2 rounded-2xl bg-ice p-3 sm:grid-cols-2">
            {editingId && (
              <p className="text-xs font-semibold text-blue sm:col-span-2">✏️ Editando una clase existente.</p>
            )}
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Título (ej. Clase Europa #3)" className="sm:col-span-2" />
            <Input type="number" min={1} value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: Number(e.target.value) }))} placeholder="Nº de clase" />
            <Input value={form.dateLabel} onChange={(e) => setForm((f) => ({ ...f, dateLabel: e.target.value }))} placeholder="Fecha (ej. 22 de julio)" />
            <Input value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} placeholder="Enlace a la grabación (Fathom, YouTube…)" className="sm:col-span-2" />
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" disabled={busy} className="flex-1 gap-2 bg-gradient-blue font-bold text-white">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Guardar cambios" : "Añadir clase"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm(EMPTY); }}>
                  <X className="mr-1 h-4 w-4" /> Cancelar
                </Button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
}
