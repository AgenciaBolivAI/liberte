import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getRichDay, saveRichDay, deleteRichDay, blankRichDay } from "@/lib/rich-content";
import type { RichDay, Week34Meta } from "@/data/week34.meta";
import type { MCQ, WeekReading, WeekListen, WeekSpeak, WeekWrite, WeekDay } from "@/data/week34";

/**
 * Full editor for a "rich" day (weeks 3+): the same lesson the students see —
 * vocab, flashcards, grammar, the 4 vocab games + 4 clés games, and the staged
 * défi — plus its titles. Saves the whole thing to `authored_days.rich`. The
 * lesson player renders exactly this, so what the teacher edits is what ships.
 */

const blankReading = (): WeekReading => ({ title: "", text: "", questions: [] });
const blankMCQ = (): MCQ => ({ q: "", options: ["", "", ""], answer: 0 });
const blankListen = (): WeekListen => ({ audio: "", question: "", options: ["", "", ""], answer: 0 });
const blankSpeak = (): WeekSpeak => ({ situation: "", expected: "" });
const blankWrite = (): WeekWrite => ({ prompt: "", answer: "" });

/* ---------------- tiny field primitives ---------------- */

const inputCls = "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-navy";

function Field({
  label, value, onChange, textarea, placeholder, rows = 3,
}: {
  label?: string; value: string; onChange: (v: string) => void;
  textarea?: boolean; placeholder?: string; rows?: number;
}) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-[11px] font-bold tracking-wide text-navy/60 uppercase">{label}</span>}
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className={inputCls} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
      )}
    </label>
  );
}

/** Editable list of primitive strings (défi criteria). */
function StringList({ label, value, onChange, placeholder }: {
  label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold tracking-wide text-navy/60 uppercase">{label}</p>
      <div className="space-y-1.5">
        {value.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={s} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} placeholder={placeholder} className={inputCls} />
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Quitar" className="rounded p-1 text-red hover:bg-red/10">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button onClick={() => onChange([...value, ""])} className="text-xs font-bold text-blue hover:underline">+ Añadir</button>
      </div>
    </div>
  );
}

/** Options + a single correct answer index — shared by flashcards, MCQ, listening. */
function OptionsAnswer({ options, answer, onChange }: {
  options: string[]; answer: number; onChange: (options: string[], answer: number) => void;
}) {
  return (
    <div className="space-y-1">
      {options.map((op, oi) => (
        <div key={oi} className="flex items-center gap-2">
          <input type="radio" checked={answer === oi} onChange={() => onChange(options, oi)} aria-label="Correcta" />
          <input
            value={op}
            onChange={(e) => onChange(options.map((o, j) => (j === oi ? e.target.value : o)), answer)}
            placeholder={`Opción ${oi + 1}`}
            className="flex-1 rounded-xl border border-border bg-white px-3 py-1.5 text-sm text-navy"
          />
          <button
            onClick={() => onChange(options.filter((_, j) => j !== oi), answer > oi ? answer - 1 : answer)}
            aria-label="Quitar opción" className="rounded p-1 text-red hover:bg-red/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...options, ""], answer)} className="text-xs font-bold text-blue hover:underline">+ Opción</button>
    </div>
  );
}

/** Generic repeatable list with a per-item render prop + add/remove. */
function ItemList<T>({ label, items, blank, onChange, render, addLabel = "Añadir" }: {
  label: string; items: T[]; blank: () => T; onChange: (items: T[]) => void;
  render: (item: T, patch: (v: T) => void, index: number) => ReactNode; addLabel?: string;
}) {
  const patchAt = (i: number, v: T) => onChange(items.map((x, j) => (j === i ? v : x)));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-wide text-navy/60 uppercase">{label} · {items.length}</p>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl border border-border bg-white/70 p-2.5">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-navy/50">#{i + 1}</span>
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Quitar" className="rounded p-1 text-red hover:bg-red/10">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {render(it, (v) => patchAt(i, v), i)}
          </div>
        ))}
        <button onClick={() => onChange([...items, blank()])} className="inline-flex items-center gap-1 text-xs font-bold text-blue hover:underline">
          <Plus className="h-3.5 w-3.5" /> {addLabel}
        </button>
      </div>
    </div>
  );
}

/** MCQ list (used inside a reading text). */
function MCQList({ questions, onChange }: { questions: MCQ[]; onChange: (q: MCQ[]) => void }) {
  return (
    <ItemList<MCQ>
      label="Preguntas" items={questions} blank={blankMCQ} onChange={onChange} addLabel="Añadir pregunta"
      render={(q, patch) => (
        <div className="space-y-1.5">
          <Field value={q.q} onChange={(v) => patch({ ...q, q: v })} placeholder="Pregunta (en francés)" />
          <OptionsAnswer options={q.options} answer={q.answer} onChange={(options, answer) => patch({ ...q, options, answer })} />
        </div>
      )}
    />
  );
}

function ReadingEditor({ value, onChange }: { value: WeekReading; onChange: (r: WeekReading) => void }) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-white/70 p-2.5">
      <Field label="Título del texto" value={value.title} onChange={(v) => onChange({ ...value, title: v })} placeholder="Texte 1 · …" />
      <Field label="Texto" value={value.text} onChange={(v) => onChange({ ...value, text: v })} textarea rows={5} placeholder="Texto de lectura en francés…" />
      <MCQList questions={value.questions} onChange={(questions) => onChange({ ...value, questions })} />
    </div>
  );
}

function Section({ title, emoji, children, defaultOpen }: { title: string; emoji: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-2xl border border-border bg-ice/50">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 p-3 text-left">
        {open ? <ChevronDown className="h-4 w-4 text-navy/60" /> : <ChevronRight className="h-4 w-4 text-navy/60" />}
        <span className="font-display text-sm font-extrabold text-navy">{emoji} {title}</span>
      </button>
      {open && <div className="space-y-3 border-t border-border p-3">{children}</div>}
    </div>
  );
}

/* ---------------- game-set editor (reused for vocab + clés) ---------------- */

function GamesEditor({
  listening, speaking, writing, onListening, onSpeaking, onWriting,
}: {
  listening: WeekListen[]; speaking: WeekSpeak[]; writing: WeekWrite[];
  onListening: (v: WeekListen[]) => void; onSpeaking: (v: WeekSpeak[]) => void; onWriting: (v: WeekWrite[]) => void;
}) {
  return (
    <div className="space-y-4">
      <ItemList<WeekListen>
        label="🔊 Écoute" items={listening} blank={blankListen} onChange={onListening} addLabel="Añadir ítem de escucha"
        render={(it, patch) => (
          <div className="space-y-1.5">
            <Field label="Audio (frase que se lee en voz alta)" value={it.audio} onChange={(v) => patch({ ...it, audio: v })} placeholder="Phrase française à écouter" />
            <Field label="Pregunta" value={it.question} onChange={(v) => patch({ ...it, question: v })} placeholder="Pregunta sobre el audio" />
            <OptionsAnswer options={it.options} answer={it.answer} onChange={(options, answer) => patch({ ...it, options, answer })} />
          </div>
        )}
      />
      <ItemList<WeekSpeak>
        label="🎤 Parler" items={speaking} blank={blankSpeak} onChange={onSpeaking} addLabel="Añadir ítem de habla"
        render={(it, patch) => (
          <div className="space-y-1.5">
            <Field label="Situación (consigna)" value={it.situation} onChange={(v) => patch({ ...it, situation: v })} textarea rows={2} placeholder="Qué debe decir el alumno" />
            <Field label="Respuesta esperada (guía IA)" value={it.expected} onChange={(v) => patch({ ...it, expected: v })} placeholder="Respuesta modelo en francés" />
          </div>
        )}
      />
      <ItemList<WeekWrite>
        label="✍️ Écriture" items={writing} blank={blankWrite} onChange={onWriting} addLabel="Añadir ítem de escritura"
        render={(it, patch) => (
          <div className="space-y-1.5">
            <Field label="Consigna" value={it.prompt} onChange={(v) => patch({ ...it, prompt: v })} textarea rows={2} placeholder="Qué debe escribir el alumno" />
            <Field label="Respuesta esperada (guía IA)" value={it.answer} onChange={(v) => patch({ ...it, answer: v })} placeholder="Respuesta modelo en francés" />
          </div>
        )}
      />
    </div>
  );
}

/* ---------------- main editor ---------------- */

export function RichDayEditor({ dayId, onBack }: { dayId: number; onBack: () => void }) {
  const [rich, setRich] = useState<RichDay | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const row = await getRichDay(dayId);
        if (!alive) return;
        setRich(row?.rich ?? blankRichDay(dayId));
        setStatus(row?.status ?? "draft");
      } catch (e) {
        if (alive) toast.error(e instanceof Error ? e.message : "No se pudo cargar el día");
      }
    })();
    return () => { alive = false; };
  }, [dayId]);

  if (!rich) {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-blue" /> Cargando el día {dayId}…
      </div>
    );
  }

  const m = rich.meta;
  const setMeta = (patch: Partial<Week34Meta>) => setRich({ ...rich, meta: { ...rich.meta, ...patch } });
  const setVG = (patch: Partial<WeekDay["vocabGames"]>) => setRich({ ...rich, vocabGames: { ...rich.vocabGames, ...patch } });
  const setCG = (patch: Partial<WeekDay["clesGames"]>) => setRich({ ...rich, clesGames: { ...rich.clesGames, ...patch } });

  async function save(nextStatus?: "draft" | "published") {
    if (!rich) return;
    setBusy(true);
    try {
      const s = nextStatus ?? status;
      await saveRichDay({ dayId, status: s, rich });
      setStatus(s);
      toast.success(nextStatus ? (s === "published" ? "Día publicado" : "Pasado a borrador") : "Cambios guardados");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar (¿permisos de staff?)");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`¿Eliminar el Día ${dayId}? Volverá a mostrarse el contenido base del código si existe.`)) return;
    try {
      await deleteRichDay(dayId);
      toast.success("Día eliminado");
      onBack();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-base font-extrabold text-navy">✏️ {m.label || `Jour ${dayId}`} · Semana {m.week}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onBack}><X className="mr-1 h-4 w-4" /> Volver</Button>
          <Button size="sm" variant="outline" onClick={() => void remove()} className="text-red"><Trash2 className="mr-1 h-4 w-4" /> Eliminar</Button>
          <Button
            size="sm" disabled={busy}
            onClick={() => void save(status === "published" ? "draft" : "published")}
            className={status === "published" ? "bg-gold text-navy" : "bg-success text-white"}
          >
            {status === "published" ? "Pasar a borrador" : "Publicar"}
          </Button>
        </div>
      </div>

      <p className="rounded-xl border border-blue/20 bg-blue/5 p-2.5 text-xs text-navy/80">
        Lo que edites aquí es exactamente lo que verá el alumno, con el mismo diseño que las semanas 1-2.
        Recuerda pulsar <b>Guardar cambios</b> al final.
      </p>

      <Section title="Presentación del día" emoji="🏷️" defaultOpen>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Etiqueta (menú lateral)" value={m.label} onChange={(v) => setMeta({ label: v })} placeholder="Jour 11 · Demander son chemin" />
          <Field label="Semana (número)" value={String(m.week)} onChange={(v) => setMeta({ week: Number(v) || m.week })} />
          <Field label="Título (pestaña del navegador)" value={m.headTitle} onChange={(v) => setMeta({ headTitle: v })} />
          <Field label="Emoji de la semana" value={m.weekEmoji} onChange={(v) => setMeta({ weekEmoji: v })} />
          <Field label="Subtítulo intro (menú)" value={m.introSub} onChange={(v) => setMeta({ introSub: v })} />
          <Field label="Subtítulo « Les clés » (menú)" value={m.clesSub} onChange={(v) => setMeta({ clesSub: v })} />
        </div>
        <Field label="Descripción (SEO)" value={m.headDesc} onChange={(v) => setMeta({ headDesc: v })} textarea rows={2} />
        <Field label="Mensaje de bienvenida (mascota Lib)" value={m.intro} onChange={(v) => setMeta({ intro: v })} textarea rows={2} />
        <Field label="Video Gym cérébral (URL embed de YouTube)" value={rich.gym} onChange={(v) => setRich({ ...rich, gym: v })} />
      </Section>

      <Section title="Vocabulario" emoji="📚">
        <ItemList
          label="Palabras" items={rich.vocabulary} onChange={(vocabulary) => setRich({ ...rich, vocabulary })}
          blank={() => ({ fr: "", es: "", example: "", emoji: "📝" })} addLabel="Añadir palabra"
          render={(it, patch) => (
            <div className="grid gap-1.5 sm:grid-cols-2">
              <Field label="Francés" value={it.fr} onChange={(v) => patch({ ...it, fr: v })} />
              <Field label="Español" value={it.es} onChange={(v) => patch({ ...it, es: v })} />
              <Field label="Ejemplo (francés)" value={it.example} onChange={(v) => patch({ ...it, example: v })} />
              <Field label="Emoji" value={it.emoji} onChange={(v) => patch({ ...it, emoji: v })} />
            </div>
          )}
        />
      </Section>

      <Section title="Flashcards (mini-juego)" emoji="🃏">
        <ItemList
          label="Tarjetas" items={rich.flashQuiz} onChange={(flashQuiz) => setRich({ ...rich, flashQuiz })}
          blank={() => ({ emoji: "🃏", concept: "", options: ["", "", ""], answer: 0 })} addLabel="Añadir tarjeta"
          render={(it, patch) => (
            <div className="space-y-1.5">
              <div className="grid gap-1.5 sm:grid-cols-2">
                <Field label="Emoji" value={it.emoji} onChange={(v) => patch({ ...it, emoji: v })} />
                <Field label="Concepto (español)" value={it.concept} onChange={(v) => patch({ ...it, concept: v })} />
              </div>
              <OptionsAnswer options={it.options} answer={it.answer} onChange={(options, answer) => patch({ ...it, options, answer })} />
            </div>
          )}
        />
      </Section>

      <Section title="Gramática — Les clés" emoji="🗝️">
        <ItemList
          label="Estructuras" items={rich.grammar} onChange={(grammar) => setRich({ ...rich, grammar })}
          blank={() => ({ formula: "", use: "" })} addLabel="Añadir estructura"
          render={(it, patch) => (
            <div className="grid gap-1.5 sm:grid-cols-2">
              <Field label="Fórmula" value={it.formula} onChange={(v) => patch({ ...it, formula: v })} />
              <Field label="Uso" value={it.use} onChange={(v) => patch({ ...it, use: v })} />
            </div>
          )}
        />
      </Section>

      <Section title="Juegos de Vocabulario" emoji="🎯">
        <ItemList<WeekReading>
          label="📖 Lecturas" items={rich.vocabGames.reading} blank={blankReading}
          onChange={(reading) => setVG({ reading })} addLabel="Añadir lectura"
          render={(it, patch) => <ReadingEditor value={it} onChange={patch} />}
        />
        <GamesEditor
          listening={rich.vocabGames.listening} speaking={rich.vocabGames.speaking} writing={rich.vocabGames.writing}
          onListening={(listening) => setVG({ listening })} onSpeaking={(speaking) => setVG({ speaking })} onWriting={(writing) => setVG({ writing })}
        />
      </Section>

      <Section title="Juegos de Les clés" emoji="🔑">
        <div className="rounded-xl border border-border bg-white/60 p-2.5">
          <p className="mb-1 text-[11px] font-bold tracking-wide text-navy/60 uppercase">📖 Lectura de gramática</p>
          <ReadingEditor value={rich.clesReading} onChange={(clesReading) => setRich({ ...rich, clesReading })} />
        </div>
        <GamesEditor
          listening={rich.clesGames.listening} speaking={rich.clesGames.speaking} writing={rich.clesGames.writing}
          onListening={(listening) => setCG({ listening })} onSpeaking={(speaking) => setCG({ speaking })} onWriting={(writing) => setCG({ writing })}
        />
      </Section>

      <Section title="Défi final" emoji="🏆">
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Título del défi" value={m.defiTitle} onChange={(v) => setMeta({ defiTitle: v })} />
          <Field label="Avatar (emoji)" value={m.defiAvatar} onChange={(v) => setMeta({ defiAvatar: v })} />
        </div>
        <Field label="Subtítulo del défi" value={m.defiSubtitle} onChange={(v) => setMeta({ defiSubtitle: v })} textarea rows={2} />
        <ItemList
          label="Etapas (turnos del personaje)" items={rich.defiSteps} onChange={(defiSteps) => setRich({ ...rich, defiSteps })}
          blank={() => ({ serveur: "", hint: "", example: "" })} addLabel="Añadir etapa"
          render={(it, patch) => (
            <div className="space-y-1.5">
              <Field label="Lo que dice el personaje" value={it.serveur} onChange={(v) => patch({ ...it, serveur: v })} textarea rows={2} />
              <Field label="Pista para el alumno" value={it.hint} onChange={(v) => patch({ ...it, hint: v })} />
              <Field label="Ejemplo de respuesta" value={it.example} onChange={(v) => patch({ ...it, example: v })} />
            </div>
          )}
        />
        <StringList label="Criterios de evaluación" value={rich.defiCriteria} onChange={(defiCriteria) => setRich({ ...rich, defiCriteria })} placeholder="Criterio que la IA verifica…" />
      </Section>

      <div className="sticky bottom-2 flex justify-end gap-2 rounded-2xl border border-border bg-white/95 p-2 shadow-soft backdrop-blur">
        <Button variant="outline" onClick={onBack}>Cancelar</Button>
        <Button disabled={busy} onClick={() => void save()} className="gap-2 bg-gradient-blue font-bold text-white">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Guardar cambios
        </Button>
      </div>
    </div>
  );
}
