import { useEffect, useState } from "react";
import { Eye, Lock, Unlock, User } from "lucide-react";
import { useAdminPreview } from "@/lib/admin-preview";
import { getStudentRoster } from "@/lib/admin.functions";

type RosterEntry = { id: string; full_name: string; email: string | null };

/** Admin-only: makes the lock bypass visible and lets the teacher preview the
 *  app as a generic student, or as one specific student (read-only). */
export function AdminPreviewBanner() {
  const { isAdmin, mode, viewAsName, setMode, viewAsStudent } = useAdminPreview();
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    getStudentRoster()
      .then((r) => setRoster(r as RosterEntry[]))
      .catch(() => setRoster([]));
  }, [isAdmin]);

  if (!isAdmin) return null;

  const style =
    mode === "teacher"
      ? "border-gold/60 bg-gold/15"
      : mode === "as-user"
        ? "border-blue/60 bg-blue/10"
        : "border-success/50 bg-success/10";

  return (
    <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm text-navy ${style}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold">
          {mode === "teacher" && (
            <>
              <Unlock className="h-4 w-4 text-gold" />
              Modo profesor — todo desbloqueado para ti
            </>
          )}
          {mode === "student" && (
            <>
              <Lock className="h-4 w-4 text-success" />
              Vista de alumno — los bloqueos están activos
            </>
          )}
          {mode === "as-user" && (
            <>
              <User className="h-4 w-4 text-blue" />
              Viendo como <b>{viewAsName}</b> · solo lectura
            </>
          )}
        </span>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="flex rounded-full border border-navy/15 bg-white p-0.5">
            <button
              onClick={() => setMode("teacher")}
              className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                mode === "teacher" ? "bg-gradient-blue text-white" : "text-navy/70 hover:text-navy"
              }`}
            >
              Profesor
            </button>
            <button
              onClick={() => setMode("student")}
              className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                mode === "student" ? "bg-gradient-blue text-white" : "text-navy/70 hover:text-navy"
              }`}
            >
              <Eye className="mr-1 inline h-3 w-3" />
              Alumno
            </button>
          </div>

          <select
            value={mode === "as-user" ? "current" : ""}
            onChange={(e) => {
              const s = roster?.find((r) => r.id === e.target.value);
              if (s) viewAsStudent(s.id, s.full_name || s.email || "Alumno");
            }}
            className="w-full max-w-full rounded-full border border-navy/15 bg-white px-3 py-2 text-base text-navy sm:w-auto sm:text-xs"
          >
            <option value="">Ver como alumno concreto…</option>
            {mode === "as-user" && <option value="current">{viewAsName}</option>}
            {(roster ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name || s.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {mode === "as-user" && (
        <p className="mt-2 text-xs text-navy/70">
          Estás viendo el progreso real de este alumno. Nada de lo que hagas aquí modifica sus
          datos.
        </p>
      )}
    </div>
  );
}
