import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { persist } from "@/lib/persist";
import { extractYouTubeId, type PlusRow } from "@/lib/plus-resources";
import { PLUS_RESOURCES_BY_WEEK } from "@/routes/plus.$weekId.$itemId";
import { TOTAL_WEEKS } from "@/lib/progress";

/**
 * Editor for "Le Petit Plus Liberté" — the weekly bonus videos.
 *
 * The client could not change these at all: they were a hardcoded array compiled
 * into the bundle. Rows saved here take over for that week; a week with no rows
 * keeps showing the built-in defaults, so nothing disappears while the teacher
 * works.
 */
export function PlusResourcesManager() {
  const [week, setWeek] = useState(1);
  const [rows, setRows] = useState<PlusRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);

  const load = useCallback(async (w: number) => {
    const { data, error } = await supabase
      .from("plus_resources")
      .select("id, week, emoji, eyebrow, title, subtitle, note, youtube_id, sort")
      .eq("week", w)
      .order("sort", { ascending: true });
    if (error) {
      setTableMissing(true);
      setRows([]);
      return;
    }
    setTableMissing(false);
    setRows((data ?? []) as PlusRow[]);
  }, []);

  useEffect(() => {
    setRows(null);
    void load(week);
  }, [week, load]);

  const defaults = PLUS_RESOURCES_BY_WEEK[String(week)] ?? [];
  const usingDefaults = rows !== null && rows.length === 0;

  /** Copy the built-in items for this week into the table so they can be edited. */
  async function seedFromDefaults() {
    if (defaults.length === 0) return;
    setBusy(true);
    const ok = await persist("plus_resources", () =>
      supabase.from("plus_resources").insert(
        defaults.map((d, i) => ({
          week,
          emoji: d.emoji,
          eyebrow: d.eyebrow,
          title: d.title,
          subtitle: d.subtitle,
          note: d.note ?? null,
          youtube_id: d.youtubeId,
          sort: i,
        })),
      ),
    );
    if (ok) await load(week);
    setBusy(false);
  }

  async function addRow() {
    setBusy(true);
    const ok = await persist("plus_resources", () =>
      supabase.from("plus_resources").insert({
        week,
        emoji: "✨",
        eyebrow: "Bonus",
        title: "Nuevo recurso",
        subtitle: "",
        youtube_id: "",
        sort: (rows?.length ?? 0),
      }),
    );
    if (ok) await load(week);
    setBusy(false);
  }

  async function saveRow(r: PlusRow) {
    // The teacher pastes a normal YouTube link; the player needs the bare id.
    const id = extractYouTubeId(r.youtube_id);
    if (r.youtube_id && !id) {
      toast.error("Ese enlace de YouTube no se reconoce. Pega la URL del video o su ID.");
      return;
    }
    setBusy(true);
    const ok = await persist("plus_resources", () =>
      supabase
        .from("plus_resources")
        .update({
          emoji: r.emoji,
          eyebrow: r.eyebrow,
          title: r.title,
          subtitle: r.subtitle,
          note: r.note,
          youtube_id: id,
          sort: r.sort,
        })
        .eq("id", r.id),
    );
    if (ok) {
      toast.success("Recurso guardado");
      await load(week);
    }
    setBusy(false);
  }

  async function deleteRow(id: string) {
    setBusy(true);
    const ok = await persist("plus_resources", () =>
      supabase.from("plus_resources").delete().eq("id", id),
    );
    if (ok) await load(week);
    setBusy(false);
  }

  return (
    <section className="mb-8 rounded-3xl border border-border bg-white p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-navy">Le Petit Plus Liberté</h2>
          <p className="text-sm text-muted-foreground">
            Videos bonus de cada semana. Lo que guardes aquí reemplaza los videos por defecto de esa semana.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-navy">
          Semana
          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="rounded-full border border-border bg-white px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-blue"
          >
            {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </label>
      </div>

      {tableMissing && (
        <p className="mb-4 rounded-xl bg-gold/15 px-4 py-3 text-sm text-navy">
          La tabla de recursos bonus aún no existe en la base de datos. Aplica la migración
          <code className="mx-1">plus_resources</code> y vuelve a cargar.
        </p>
      )}

      {rows === null ? (
        <div className="grid place-items-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-blue" />
        </div>
      ) : (
        <>
          {usingDefaults && (
            <div className="mb-4 rounded-xl border border-dashed border-blue/40 bg-ice px-4 py-3 text-sm text-navy">
              {defaults.length > 0 ? (
                <>
                  Esta semana usa los {defaults.length} videos por defecto.{" "}
                  <button
                    onClick={() => void seedFromDefaults()}
                    disabled={busy}
                    className="font-bold text-blue underline hover:no-underline"
                  >
                    Copiarlos aquí para editarlos
                  </button>
                </>
              ) : (
                <>Esta semana todavía no tiene videos bonus. Añade el primero.</>
              )}
            </div>
          )}

          <div className="space-y-4">
            {rows.map((r, i) => (
              <RowEditor
                key={r.id}
                row={r}
                index={i}
                busy={busy}
                onSave={saveRow}
                onDelete={deleteRow}
              />
            ))}
          </div>

          <Button onClick={() => void addRow()} disabled={busy} className="mt-4 bg-gradient-blue text-white">
            <Plus className="mr-1 h-4 w-4" /> Añadir recurso
          </Button>
        </>
      )}
    </section>
  );
}

function RowEditor({
  row,
  index,
  busy,
  onSave,
  onDelete,
}: {
  row: PlusRow;
  index: number;
  busy: boolean;
  onSave: (r: PlusRow) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<PlusRow>(row);
  useEffect(() => setDraft(row), [row]);
  const set = (patch: Partial<PlusRow>) => setDraft((d) => ({ ...d, ...patch }));
  const preview = extractYouTubeId(draft.youtube_id);

  return (
    <div className="rounded-2xl border border-border bg-ice/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Recurso {index + 1}
        </p>
        <button
          onClick={() => void onDelete(row.id)}
          disabled={busy}
          className="inline-flex items-center gap-1 text-xs font-bold text-red hover:underline disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Eliminar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Emoji">
          <input value={draft.emoji} onChange={(e) => set({ emoji: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Etiqueta (eyebrow)">
          <input value={draft.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Título">
          <input value={draft.title} onChange={(e) => set({ title: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Subtítulo">
          <input value={draft.subtitle} onChange={(e) => set({ subtitle: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Enlace de YouTube">
          <input
            value={draft.youtube_id}
            onChange={(e) => set({ youtube_id: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=…"
            className={inputCls}
          />
        </Field>
        <Field label="Orden">
          <input
            type="number"
            value={draft.sort}
            onChange={(e) => set({ sort: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Nota (opcional)">
            <textarea
              value={draft.note ?? ""}
              onChange={(e) => set({ note: e.target.value })}
              rows={2}
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      {preview && (
        <div className="mt-3 overflow-hidden rounded-xl border border-border" style={{ aspectRatio: "16/9", maxWidth: 320 }}>
          <iframe
            src={`https://www.youtube.com/embed/${preview}?rel=0`}
            title={draft.title}
            loading="lazy"
            className="h-full w-full border-0"
            allowFullScreen
          />
        </div>
      )}

      <Button onClick={() => void onSave(draft)} disabled={busy} className="mt-3 bg-gradient-blue text-white">
        Guardar cambios
      </Button>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
