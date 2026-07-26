import { useCallback, useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type Notif = {
  id: string;
  kind: string;
  payload: {
    student_id?: string;
    student_name?: string;
    day_id?: number;
    week_number?: number;
    score_10?: number;
    weekly_score?: number;
  };
  created_at: string;
};

const KIND_LABEL: Record<string, (n: Notif) => string> = {
  day_completed: (n) => `completó el Día ${n.payload.day_id}`,
  defi_submitted: (n) =>
    `envió el défi del Día ${n.payload.day_id}` +
    (n.payload.score_10 != null ? ` (${Number(n.payload.score_10).toFixed(1)}/10)` : ""),
  weekly_evaluated: (n) =>
    `terminó la evaluación de la Semana ${n.payload.week_number}` +
    (n.payload.weekly_score != null ? ` (${Number(n.payload.weekly_score).toFixed(1)}/10)` : ""),
};

const KIND_ICON: Record<string, string> = {
  day_completed: "✅",
  defi_submitted: "🎯",
  weekly_evaluated: "📊",
};

/** "Actividad reciente" — live feed of student activity for the coach/admin
 *  panels, read from the notifications table (RLS scopes it to own rows).
 *  onSelectStudent lets the panel jump straight to that student's detail. */
export function ActivityFeed({ onSelectStudent }: { onSelectStudent?: (studentId: string) => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[] | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id, kind, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data ?? []) as unknown as Notif[]);
  }, []);

  useEffect(() => {
    if (!user) return;
    void load();
    const channel = supabase
      .channel("coach-activity-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, load]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-3xl border border-border bg-white p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-navy">
        <Activity className="h-5 w-5 text-blue" /> Actividad reciente
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Cada día completado, défi enviado y evaluación semanal de tus alumnos, en tiempo real.
      </p>
      {items === null ? (
        <p className="mt-3 text-sm text-muted-foreground">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="mt-3 rounded-xl bg-ice px-3 py-2.5 text-sm text-navy">
          Sin actividad todavía. Aquí verás cuando un alumno termine una lección.
        </p>
      ) : (
        <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
          {items.map((n) => {
            const label = KIND_LABEL[n.kind]?.(n) ?? "actividad nueva";
            const when = new Date(n.created_at).toLocaleString("es-ES", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
            });
            return (
              <button
                key={n.id}
                type="button"
                disabled={!onSelectStudent || !n.payload.student_id}
                onClick={() => n.payload.student_id && onSelectStudent?.(n.payload.student_id)}
                className="flex w-full items-start gap-2 rounded-xl px-2 py-1.5 text-left text-sm transition enabled:hover:bg-ice disabled:cursor-default"
              >
                <span className="shrink-0">{KIND_ICON[n.kind] ?? "🔔"}</span>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-navy">{n.payload.student_name || "Un alumno"}</span>{" "}
                  <span className="text-navy/80">{label}</span>
                  <span className="block text-[11px] text-muted-foreground">{when}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
