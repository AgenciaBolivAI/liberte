import { useCallback, useEffect, useState } from "react";
import { Loader2, UserPlus, X } from "lucide-react";
import { getStaffList, setCoachRole, type StaffMember } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** Admin: grant/revoke the coach (teacher) role by email. The admin role
 *  itself is managed via migrations/console, not here. */
export function StaffManager() {
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getStaffList()
      .then((s) => setStaff(s as StaffMember[]))
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudo cargar el equipo"));
  }, []);

  useEffect(() => load(), [load]);

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value || busy) return;
    setBusy(true);
    try {
      const r = await setCoachRole({ data: { email: value, assign: true } });
      toast.success(`${r.name} ahora es profesor/a`);
      setEmail("");
      load();
    } catch (e2) {
      toast.error(e2 instanceof Error ? e2.message : "No se pudo asignar el rol");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(member: StaffMember) {
    if (!window.confirm(`¿Quitar el rol de profesor/a a ${member.full_name}?`)) return;
    try {
      await setCoachRole({ data: { email: member.email ?? "", assign: false } });
      toast.success(`Rol de profesor/a retirado a ${member.full_name}`);
      load();
    } catch (e2) {
      toast.error(e2 instanceof Error ? e2.message : "No se pudo retirar el rol");
    }
  }

  return (
    <div className="mb-6 rounded-3xl border border-border bg-white p-5 shadow-soft">
      <p className="font-display text-lg font-extrabold text-navy">👩‍🏫 Equipo (roles de profesor)</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Un profesor (coach) ve el panel de coach, puede desbloquear semanas y aparece como contacto
        en Mensajes. Escribe el email de una cuenta ya registrada.
      </p>
      <form onSubmit={assign} className="mt-3 flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@delprofesor.com"
          className="min-w-[220px] flex-1 rounded-full border border-border bg-ice px-4 py-2 text-sm text-navy placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue"
        />
        <Button type="submit" disabled={busy || !email.trim()} className="gap-2 bg-gradient-blue text-white">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Hacer profesor/a
        </Button>
      </form>
      {staff === null ? (
        <Loader2 className="mt-4 h-5 w-5 animate-spin text-blue" />
      ) : (
        <ul className="mt-4 space-y-2">
          {staff.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ice px-4 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-navy">{m.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {m.roles.map((r) => (
                  <span
                    key={r}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      r === "admin" ? "bg-navy text-white" : "bg-blue/15 text-navy"
                    }`}
                  >
                    {r === "admin" ? "Admin" : "Profesor"}
                  </span>
                ))}
                {m.roles.includes("coach") && (
                  <button
                    onClick={() => void revoke(m)}
                    aria-label={`Quitar rol de profesor a ${m.full_name}`}
                    className="grid h-7 w-7 place-items-center rounded-full text-navy/50 transition hover:bg-red/10 hover:text-red"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
          {staff.length === 0 && (
            <li className="text-xs text-muted-foreground">Aún no hay profesores asignados.</li>
          )}
        </ul>
      )}
    </div>
  );
}
