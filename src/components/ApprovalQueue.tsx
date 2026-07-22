import { useEffect, useState } from "react";
import { Check, Loader2, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveStudent, getPendingStudents, type PendingStudent } from "@/lib/admin.functions";

export function ApprovalQueue() {
  const [pending, setPending] = useState<PendingStudent[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function reload() {
    try {
      setPending(await getPendingStudents());
    } catch (e) {
      // Don't silently render an empty queue on a load failure — surface it.
      setPending([]);
      toast.error(e instanceof Error ? e.message : "No se pudo cargar la lista de aprobación");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function handleApprove(s: PendingStudent) {
    setBusy(s.id);
    try {
      await approveStudent({ data: { userId: s.id } });
      toast.success(`Acceso activado para ${s.full_name || s.email}`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo aprobar");
    } finally {
      setBusy(null);
    }
  }

  if (!pending || pending.length === 0) return null;

  return (
    <div className="mb-6 rounded-3xl border-2 border-gold/60 bg-card p-5 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-navy">
        <UserCheck className="h-5 w-5 text-gold" />
        Solicitudes pendientes ({pending.length})
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Estas cuentas ya existen pero no ven el contenido hasta que las apruebes.
      </p>
      <ul className="mt-3 divide-y divide-border">
        {pending.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="font-semibold text-navy">{s.full_name || "Sin nombre"}</p>
              <p className="text-xs text-muted-foreground">
                {s.email}
                {s.nationality ? ` · ${s.nationality}` : ""} ·{" "}
                {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: es })}
              </p>
            </div>
            <Button
              onClick={() => void handleApprove(s)}
              disabled={busy === s.id}
              className="rounded-full bg-gradient-blue font-bold text-white"
            >
              {busy === s.id ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-1 h-4 w-4" />
              )}
              Aprobar acceso
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
