import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  BLOCK_TYPE_META,
  weekOfAuthoredDay,
  type AuthoredBlock,
  type AuthoredDay,
  type BlockPayload,
  type BlockType,
} from "@/lib/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Teacher content authoring: create days 11-120 from typed blocks, upload any
// asset (PDF, slides, images, audio, video), and publish when ready. Days 1-10
// are code-authored and shown as read-only here. Writes go through RLS
// (staff-only policies) exactly like CalendarManager.

const MAX_UPLOAD = 50 * 1024 * 1024;

async function uploadAsset(file: File, userId: string): Promise<{ url: string; name: string }> {
  if (file.size > MAX_UPLOAD) throw new Error("El archivo supera 50 MB");
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const path = `${userId}/${crypto.randomUUID()}_${safe}`;
  const { error } = await supabase.storage.from("content-assets").upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("content-assets").getPublicUrl(path);
  return { url: data.publicUrl, name: file.name };
}

export function ContentManager() {
  const { user } = useAuth();
  const [days, setDays] = useState<AuthoredDay[] | null>(null);
  const [tableMissing, setTableMissing] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [newDayId, setNewDayId] = useState("");

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("authored_days")
      .select("day_id, title, subtitle, status")
      .order("day_id");
    if (error) {
      setTableMissing(true);
      setDays([]);
      return;
    }
    setDays((data ?? []) as AuthoredDay[]);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function createDay() {
    const id = Number(newDayId);
    if (!Number.isInteger(id) || id < 11 || id > 120) {
      toast.error("Elige un número de día entre 11 y 120 (los días 1-10 ya existen en la plataforma).");
      return;
    }
    const { error } = await supabase
      .from("authored_days")
      .insert({ day_id: id, title: `Jour ${id}`, created_by: user?.id ?? null });
    if (error) {
      toast.error(/duplicate/i.test(error.message) ? `El día ${id} ya existe.` : error.message);
      return;
    }
    setNewDayId("");
    await reload();
    setEditingDay(id);
  }

  return (
    <div className="mb-6 rounded-3xl border border-border bg-white p-5 shadow-soft">
      <p className="font-display text-lg font-extrabold text-navy">🛠️ Contenido del curso</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Crea y edita los días del programa (11-120) con bloques: video, texto, vocabulario, quiz,
        escritura y oral con corrección IA, archivos (PDF/diapositivas) y enlaces. Los días 1-10
        están construidos en la plataforma. Un día es visible para los alumnos al <b>publicarlo</b>
        {" "}(y su semana se habilita en «Control de acceso»).
      </p>

      {tableMissing && (
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs text-navy">
          Aplica la migración <code>20260720000005_authored_content.sql</code> para activar el editor.
        </p>
      )}

      {days === null ? (
        <Loader2 className="mt-3 h-5 w-5 animate-spin text-blue" />
      ) : editingDay !== null ? (
        <DayEditor
          dayId={editingDay}
          day={days.find((d) => d.day_id === editingDay) ?? null}
          onBack={() => {
            setEditingDay(null);
            void reload();
          }}
        />
      ) : (
        <>
          <ul className="mt-3 divide-y divide-border">
            {days.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">Aún no hay días creados por el equipo.</li>
            )}
            {days.map((d) => (
              <li key={d.day_id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <span className="text-sm font-bold text-navy">
                    Día {d.day_id} · {d.title || "Sin título"}
                  </span>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      d.status === "published" ? "bg-success/15 text-success" : "bg-gold/20 text-navy"
                    }`}
                  >
                    {d.status === "published" ? "Publicado" : "Borrador"}
                  </span>
                  <p className="text-xs text-muted-foreground">Semana {weekOfAuthoredDay(d.day_id)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    to="/day/$dayId"
                    params={{ dayId: String(d.day_id) }}
                    aria-label="Ver como alumno"
                    className="rounded-full p-2 text-navy/70 hover:bg-ice"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => setEditingDay(d.day_id)}>
                    Editar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={11}
              max={120}
              value={newDayId}
              onChange={(e) => setNewDayId(e.target.value)}
              placeholder="Nº de día (11-120)"
              className="w-40"
            />
            <Button onClick={() => void createDay()} className="gap-2 bg-gradient-blue text-white">
              <Plus className="h-4 w-4" /> Crear día
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Per-day editor ---------------- */

function DayEditor({ dayId, day, onBack }: { dayId: number; day: AuthoredDay | null; onBack: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState(day?.title ?? "");
  const [subtitle, setSubtitle] = useState(day?.subtitle ?? "");
  const [status, setStatus] = useState(day?.status ?? "draft");
  const [blocks, setBlocks] = useState<AuthoredBlock[] | null>(null);
  const [busy, setBusy] = useState(false);

  const reloadBlocks = useCallback(async () => {
    const { data } = await supabase
      .from("authored_blocks")
      .select("id, day_id, sort, type, payload")
      .eq("day_id", dayId)
      .order("sort")
      .order("id");
    setBlocks((data ?? []) as AuthoredBlock[]);
  }, [dayId]);

  useEffect(() => {
    void reloadBlocks();
  }, [reloadBlocks]);

  async function saveDay(next?: Partial<AuthoredDay>) {
    setBusy(true);
    const patch = { title: title.trim(), subtitle: subtitle.trim(), status, ...next };
    // .select() lets us detect the 0-row (RLS/missing) case so the toggle never
    // desyncs from the DB.
    const { data, error } = await supabase
      .from("authored_days")
      .update(patch)
      .eq("day_id", dayId)
      .select("day_id");
    setBusy(false);
    if (error || !data?.length) {
      toast.error(error?.message ?? "No se pudo guardar (sin permisos o día inexistente)");
      return;
    }
    toast.success("Día guardado");
    if (next?.status) setStatus(next.status);
  }

  async function removeDay() {
    if (!window.confirm(`¿Eliminar el Día ${dayId} y todos sus bloques?`)) return;
    const { error } = await supabase.from("authored_days").delete().eq("day_id", dayId);
    if (error) toast.error(error.message);
    else onBack();
  }

  async function addBlock(type: BlockType) {
    // Max-based (not length-based) so a new block always sorts last even after
    // deletions — otherwise sorts collide and the reorder arrows no-op.
    const sort = (blocks ?? []).reduce((m, b) => Math.max(m, b.sort), 0) + 10;
    const { error } = await supabase.from("authored_blocks").insert({ day_id: dayId, type, sort, payload: {} });
    if (error) toast.error(error.message);
    await reloadBlocks();
  }

  async function saveBlock(id: string, payload: BlockPayload) {
    const { error } = await supabase.from("authored_blocks").update({ payload }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Bloque guardado");
    await reloadBlocks();
  }

  async function removeBlock(id: string) {
    if (!window.confirm("¿Eliminar este bloque?")) return;
    await supabase.from("authored_blocks").delete().eq("id", id);
    await reloadBlocks();
  }

  async function move(id: string, dir: -1 | 1) {
    if (!blocks) return;
    const idx = blocks.findIndex((b) => b.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= blocks.length) return;
    // Renumber the whole list to clean, gap-free sorts — robust even if any two
    // rows previously shared a sort value (a swap would be a no-op there).
    const reordered = [...blocks];
    [reordered[idx], reordered[j]] = [reordered[j], reordered[idx]];
    await Promise.all(
      reordered.map((b, i) => supabase.from("authored_blocks").update({ sort: (i + 1) * 10 }).eq("id", b.id)),
    );
    await reloadBlocks();
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-base font-extrabold text-navy">✏️ Día {dayId} · Semana {weekOfAuthoredDay(dayId)}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onBack}>
            <X className="mr-1 h-4 w-4" /> Volver
          </Button>
          <Button size="sm" variant="outline" onClick={() => void removeDay()} className="text-red">
            <Trash2 className="mr-1 h-4 w-4" /> Eliminar día
          </Button>
          <Button
            size="sm"
            disabled={busy}
            onClick={() => void saveDay({ status: status === "published" ? "draft" : "published" })}
            className={status === "published" ? "bg-gold text-navy" : "bg-success text-white"}
          >
            {status === "published" ? "Pasar a borrador" : "Publicar"}
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (ej. Jour 11 · Au marché)" />
        <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtítulo (opcional)" />
      </div>
      <Button size="sm" disabled={busy} onClick={() => void saveDay()} className="mt-2 bg-gradient-blue text-white">
        {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Guardar título
      </Button>

      <div className="mt-5 space-y-3">
        {blocks === null ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue" />
        ) : (
          blocks.map((b, i) => (
            <BlockEditor
              key={b.id}
              block={b}
              first={i === 0}
              last={i === blocks.length - 1}
              userId={user?.id ?? ""}
              onSave={(p) => void saveBlock(b.id, p)}
              onRemove={() => void removeBlock(b.id)}
              onMove={(d) => void move(b.id, d)}
            />
          ))
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(BLOCK_TYPE_META) as BlockType[]).map((t) => (
          <button
            key={t}
            onClick={() => void addBlock(t)}
            className="rounded-full border border-border bg-ice px-3 py-1.5 text-xs font-bold text-navy transition hover:bg-blue/10"
          >
            + {BLOCK_TYPE_META[t].emoji} {BLOCK_TYPE_META[t].label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Per-block editor ---------------- */

function BlockEditor({
  block,
  first,
  last,
  userId,
  onSave,
  onRemove,
  onMove,
}: {
  block: AuthoredBlock;
  first: boolean;
  last: boolean;
  userId: string;
  onSave: (p: BlockPayload) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [p, setP] = useState<BlockPayload>(block.payload ?? {});
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const meta = BLOCK_TYPE_META[block.type];
  const set = (patch: BlockPayload) => setP((prev) => ({ ...prev, ...patch }));

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const { url, name } = await uploadAsset(file, userId);
      set({ url, name });
      toast.success("Archivo subido — guarda el bloque para aplicarlo");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir");
    } finally {
      setUploading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-navy";

  return (
    <div className="rounded-2xl border border-border bg-ice/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-navy">
          {meta.emoji} {meta.label}
        </p>
        <div className="flex items-center gap-1">
          <button disabled={first} onClick={() => onMove(-1)} aria-label="Subir" className="rounded p-1.5 text-navy/60 hover:bg-white disabled:opacity-30">
            <ArrowUp className="h-4 w-4" />
          </button>
          <button disabled={last} onClick={() => onMove(1)} aria-label="Bajar" className="rounded p-1.5 text-navy/60 hover:bg-white disabled:opacity-30">
            <ArrowDown className="h-4 w-4" />
          </button>
          <button onClick={onRemove} aria-label="Eliminar bloque" className="rounded p-1.5 text-red hover:bg-red/10">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {(block.type === "video" || block.type === "file") && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={p.url ?? ""}
              onChange={(e) => set({ url: e.target.value })}
              placeholder={block.type === "video" ? "URL de YouTube o archivo de video" : "URL del archivo"}
              className={`${inputCls} flex-1 min-w-[220px]`}
            />
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && void handleUpload(e.target.files[0])} />
            <Button size="sm" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
              Subir archivo
            </Button>
          </div>
        )}
        {block.type === "file" && (
          <input value={p.name ?? ""} onChange={(e) => set({ name: e.target.value })} placeholder="Nombre visible (ej. Diapositivas Semana 3.pdf)" className={inputCls} />
        )}
        {block.type === "link" && (
          <>
            <input value={p.url ?? ""} onChange={(e) => set({ url: e.target.value })} placeholder="https://…" className={inputCls} />
            <input value={p.label ?? ""} onChange={(e) => set({ label: e.target.value })} placeholder="Texto del enlace" className={inputCls} />
          </>
        )}
        {(block.type === "text" || block.type === "writing" || block.type === "speaking") && (
          <>
            <input value={p.title ?? ""} onChange={(e) => set({ title: e.target.value })} placeholder="Título del bloque" className={inputCls} />
            {block.type === "text" ? (
              <textarea value={p.body ?? ""} onChange={(e) => set({ body: e.target.value })} rows={4} placeholder="Contenido (texto plano; párrafos separados por línea en blanco)" className={inputCls} />
            ) : (
              <>
                <textarea value={p.prompt ?? ""} onChange={(e) => set({ prompt: e.target.value })} rows={2} placeholder="Consigna para el alumno" className={inputCls} />
                <input value={p.example ?? ""} onChange={(e) => set({ example: e.target.value })} placeholder="Respuesta de ejemplo en francés (guía para la IA)" className={inputCls} />
              </>
            )}
          </>
        )}
        {block.type === "vocab" && (
          <VocabEditor items={p.items ?? []} onChange={(items) => set({ items })} />
        )}
        {block.type === "quiz" && (
          <QuizEditor questions={p.questions ?? []} onChange={(questions) => set({ questions })} />
        )}
      </div>

      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={() => onSave(p)} className="bg-gradient-blue text-white">
          Guardar bloque
        </Button>
      </div>
    </div>
  );
}

function VocabEditor({ items, onChange }: { items: { fr: string; es: string }[]; onChange: (i: { fr: string; es: string }[]) => void }) {
  const inputCls = "flex-1 rounded-xl border border-border bg-white px-3 py-1.5 text-sm text-navy";
  return (
    <div className="space-y-1.5">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={it.fr} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, fr: e.target.value } : x)))} placeholder="Francés" className={inputCls} />
          <input value={it.es} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, es: e.target.value } : x)))} placeholder="Español" className={inputCls} />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Quitar" className="rounded p-1 text-red hover:bg-red/10">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { fr: "", es: "" }])} className="text-xs font-bold text-blue hover:underline">
        + Añadir palabra
      </button>
    </div>
  );
}

function QuizEditor({
  questions,
  onChange,
}: {
  questions: { q: string; options: string[]; correct: number }[];
  onChange: (q: { q: string; options: string[]; correct: number }[]) => void;
}) {
  const inputCls = "w-full rounded-xl border border-border bg-white px-3 py-1.5 text-sm text-navy";
  const patch = (i: number, p: Partial<{ q: string; options: string[]; correct: number }>) =>
    onChange(questions.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="space-y-3">
      {questions.map((qq, i) => (
        <div key={i} className="rounded-xl border border-border bg-white/70 p-2">
          <div className="flex items-center gap-2">
            <input value={qq.q} onChange={(e) => patch(i, { q: e.target.value })} placeholder={`Pregunta ${i + 1}`} className={inputCls} />
            <button onClick={() => onChange(questions.filter((_, j) => j !== i))} aria-label="Quitar pregunta" className="rounded p-1 text-red hover:bg-red/10">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-1.5 space-y-1">
            {qq.options.map((op, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={qq.correct === oi}
                  onChange={() => patch(i, { correct: oi })}
                  aria-label="Correcta"
                />
                <input
                  value={op}
                  onChange={(e) => patch(i, { options: qq.options.map((o, j) => (j === oi ? e.target.value : o)) })}
                  placeholder={`Opción ${oi + 1}`}
                  className={inputCls}
                />
              </div>
            ))}
            <button onClick={() => patch(i, { options: [...qq.options, ""] })} className="text-xs font-bold text-blue hover:underline">
              + Opción
            </button>
          </div>
        </div>
      ))}
      <button onClick={() => onChange([...questions, { q: "", options: ["", ""], correct: 0 }])} className="text-xs font-bold text-blue hover:underline">
        + Añadir pregunta
      </button>
    </div>
  );
}
