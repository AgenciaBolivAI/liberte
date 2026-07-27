import { useCallback, useEffect, useState } from "react";
import { Loader2, Lock, Unlock, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setContentAccess } from "@/lib/content-access.functions";
import { toast } from "sonner";

/**
 * Teacher control over the «reto final de la semana» itself.
 *
 * The plain week override means "this student may START the week's days
 * early" — it deliberately does NOT authorize the graded weekly evaluation.
 * This is the separate, explicit switch for the challenge (content_access rows
 * with target_type = 'week_challenge'), so a teacher can force it open for a
 * student who lost progress, or lock it while they are not ready:
 *
 *   Auto     → the normal rule (reached the end of the week, or already evaluated)
 *   Abierto  → always open for this student
 *   Bloqueado→ always locked for this student (staff still pass)
 */

type Access = "open" | "locked" | "default";
const WEEKS = Array.from({ length: 24 }, (_, i) => i + 1);

export function WeekChallengeControl({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Record<number, Access>>({});
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("content_access")
      .select("target_id, access")
      .eq("scope", "user")
      .eq("user_id", userId)
      .eq("target_type", "week_challenge");
    const map: Record<number, Access> = {};
    for (const r of data ?? []) map[Number(r.target_id)] = r.access as Access;
    setRows(map);
    setLoaded(true);
  }, [userId]);

  useEffect(() => {
    setLoaded(false);
    void load();
  }, [load]);

  async function cycle(week: number) {
    // Auto → Abierto → Bloqueado → Auto
    const current = rows[week] ?? "default";
    const next: Access = current === "default" ? "open" : current === "open" ? "locked" : "default";
    setBusy(week);
    try {
      await setContentAccess({
        data: { scope: "user", userId, targetType: "week_challenge", targetId: week, access: next },
      });
      setRows((r) => ({ ...r, [week]: next }));
      toast.success(
        next === "open" ? `Reto de la Semana ${week}: abierto`
        : next === "locked" ? `Reto de la Semana ${week}: bloqueado`
        : `Reto de la Semana ${week}: automático`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar el acceso");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-3xl border border-gold/40 bg-gold/5 p-4 sm:p-5">
      <p className="flex items-center gap-2 font-display text-lg font-extrabold text-navy">
        <Trophy className="h-5 w-5 text-gold-deep" /> Reto final de cada semana
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Control directo sobre el desafío semanal de este alumno. Haz clic para alternar:
        <b> automático → abierto → bloqueado</b>. «Automático» = se abre al llegar al último día de la semana.
      </p>
      {!loaded ? (
        <Loader2 className="mt-3 h-5 w-5 animate-spin text-blue" />
      ) : (
        <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
          {WEEKS.map((w) => {
            const state = rows[w] ?? "default";
            return (
              <button
                key={w}
                onClick={() => void cycle(w)}
                disabled={busy === w}
                title={
                  state === "open" ? "Abierto siempre — clic para bloquear"
                  : state === "locked" ? "Bloqueado — clic para volver a automático"
                  : "Automático — clic para abrirlo siempre"
                }
                className={`rounded-xl border p-2 text-[10px] transition ${
                  state === "open"
                    ? "border-success bg-success/15 font-bold text-navy"
                    : state === "locked"
                      ? "border-red bg-red/10 font-bold text-navy"
                      : "border-border bg-white text-navy/60 hover:border-gold/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">S{w}</span>
                  {busy === w ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : state === "open" ? (
                    <Unlock className="h-3 w-3 text-success" />
                  ) : state === "locked" ? (
                    <Lock className="h-3 w-3 text-red" />
                  ) : (
                    <span className="text-[9px] text-navy/40">auto</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
