import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Lock, Unlock, RotateCcw } from "lucide-react";
import { getContentAccess, setContentAccess } from "@/lib/content-access.functions";
import { TOTAL_WEEKS } from "@/lib/progress";
import { toast } from "sonner";

type AccessValue = "open" | "locked";
type Row = {
  scope: "global" | "user";
  user_id: string | null;
  target_type: "day" | "week";
  target_id: number;
  access: AccessValue;
};
type Student = { id: string; full_name: string | null; email: string | null };

const DAYS_PER_WEEK = 5;
const daysOfWeek = (week: number) =>
  Array.from({ length: DAYS_PER_WEEK }, (_, i) => (week - 1) * DAYS_PER_WEEK + i + 1);

/** A three-state control: Por defecto (no override) · Abrir · Bloquear. */
function AccessControl({
  value,
  busy,
  onSet,
}: {
  value: AccessValue | undefined;
  busy: boolean;
  onSet: (a: AccessValue | "default") => void;
}) {
  const base =
    "min-h-[36px] px-2.5 py-1.5 text-[11px] font-bold rounded-lg transition disabled:opacity-50";
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        disabled={busy}
        aria-pressed={value === undefined}
        onClick={() => onSet("default")}
        className={`${base} ${value === undefined ? "bg-navy text-white" : "text-navy/55 hover:bg-ice"}`}
        title="Sin regla: usa el valor por defecto"
      >
        <RotateCcw className="mr-1 inline h-3 w-3" />
        Defecto
      </button>
      <button
        type="button"
        disabled={busy}
        aria-pressed={value === "open"}
        onClick={() => onSet("open")}
        className={`${base} ${value === "open" ? "bg-emerald-600 text-white" : "text-emerald-700 hover:bg-emerald-50"}`}
      >
        <Unlock className="mr-1 inline h-3 w-3" />
        Abrir
      </button>
      <button
        type="button"
        disabled={busy}
        aria-pressed={value === "locked"}
        onClick={() => onSet("locked")}
        className={`${base} ${value === "locked" ? "bg-red-600 text-white" : "text-red-600 hover:bg-red-50"}`}
      >
        <Lock className="mr-1 inline h-3 w-3" />
        Bloquear
      </button>
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue" />}
    </div>
  );
}

export function ContentAccessManager({ students }: { students: Student[] }) {
  const [mode, setMode] = useState<"global" | "user">("global");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [tableMissing, setTableMissing] = useState(false);
  const [error, setError] = useState("");

  const activeUserId = mode === "user" ? selectedUser : "";

  // `silent` refetch (after a toggle) keeps the accordion visible instead of
  // collapsing it to a full-panel spinner.
  const reload = useCallback(
    async (silent = false) => {
      if (mode === "user" && !selectedUser) {
        setRows([]);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const res = await getContentAccess({ data: { userId: activeUserId || undefined } });
        setTableMissing(Boolean((res as { tableMissing?: boolean }).tableMissing));
        setError("");
        setRows((mode === "global" ? res.global : res.user) as Row[]);
      } catch {
        // A thrown error here is auth/network (the server swallows a missing
        // table and returns empty) — don't mislabel it as "apply the migration".
        setError("No se pudo cargar el control de acceso. Reintenta.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [mode, selectedUser, activeUserId],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  const valueOf = (type: "day" | "week", id: number): AccessValue | undefined =>
    rows.find((r) => r.target_type === type && r.target_id === id)?.access;

  async function set(type: "day" | "week", id: number, access: AccessValue | "default") {
    const key = `${type}:${id}`;
    setBusyKey(key);
    try {
      await setContentAccess({
        data: {
          scope: mode,
          userId: mode === "user" ? selectedUser : undefined,
          targetType: type,
          targetId: id,
          access,
        },
      });
      await reload(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el cambio");
    } finally {
      setBusyKey(null);
    }
  }

  const toggleExpand = (w: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(w) ? next.delete(w) : next.add(w);
      return next;
    });

  const studentName = (s: Student) => s.full_name?.trim() || s.email || s.id.slice(0, 8);

  return (
    <div className="mb-6 rounded-3xl border border-border bg-white p-5 shadow-soft">
      <p className="font-display text-lg font-extrabold text-navy">🔓 Control de acceso a días y semanas</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Habilita o bloquea cualquier día o semana — para <b>todos</b> (global) o para un alumno concreto.
        Bloquear una semana bloquea sus 5 días. Esto también controla las lecciones del <b>tutor IA</b> (mismos
        días/semanas). «Defecto» = sin regla (semanas 1-2 abiertas).
      </p>

      {tableMissing && (
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs text-navy">
          La tabla <code>content_access</code> aún no existe: aplica la migración{" "}
          <code>20260720000000_content_access.sql</code>. Mientras tanto todo queda como por defecto.
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-xl border border-red/40 bg-red/10 p-3 text-xs text-red">{error}</p>
      )}

      {/* Scope tabs */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("global")}
          className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${mode === "global" ? "bg-gradient-blue text-white" : "bg-ice text-navy hover:bg-blue/10"}`}
        >
          Global (todos)
        </button>
        <button
          type="button"
          onClick={() => setMode("user")}
          className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${mode === "user" ? "bg-gradient-blue text-white" : "bg-ice text-navy hover:bg-blue/10"}`}
        >
          Por alumno
        </button>
        {mode === "user" && (
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            aria-label="Elegir alumno"
            className="min-w-[200px] rounded-xl border border-border bg-white px-3 py-2 text-sm text-navy"
          >
            <option value="">— Elige un alumno —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {studentName(s)}
              </option>
            ))}
          </select>
        )}
      </div>

      {mode === "user" && !selectedUser ? (
        <p className="mt-4 text-sm text-muted-foreground">Elige un alumno para ver y ajustar su acceso.</p>
      ) : loading ? (
        <Loader2 className="mt-4 h-5 w-5 animate-spin text-blue" />
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => {
            const isOpen = expanded.has(w);
            return (
              <li key={w} className="py-2">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(w)}
                    aria-expanded={isOpen}
                    aria-label={`Días de la semana ${w}`}
                    className="flex min-w-0 items-center gap-2 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-navy/60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-navy/60" />
                    )}
                    <span className="text-sm font-bold text-navy">Semana {w}</span>
                    {w <= 2 && (
                      <span className="rounded-full bg-blue/10 px-2 py-0.5 text-[10px] font-bold text-blue">
                        con contenido
                      </span>
                    )}
                  </button>
                  <AccessControl
                    value={valueOf("week", w)}
                    busy={busyKey === `week:${w}`}
                    onSet={(a) => set("week", w, a)}
                  />
                </div>
                {isOpen && (
                  <ul className="mt-1 space-y-1 pl-6">
                    {daysOfWeek(w).map((d) => (
                      <li key={d} className="flex items-center justify-between gap-3 py-1">
                        <span className="text-xs font-semibold text-navy/80">Día {d}</span>
                        <AccessControl
                          value={valueOf("day", d)}
                          busy={busyKey === `day:${d}`}
                          onSet={(a) => set("day", d, a)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
