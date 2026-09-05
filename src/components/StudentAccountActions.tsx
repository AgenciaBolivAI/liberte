import { useState } from "react";
import { AlertTriangle, Loader2, Lock, Trash2, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteStudentAccount, setStudentAccess } from "@/lib/admin.functions";

/**
 * Managing one account: revoke access, or delete it for good.
 *
 * The two are deliberately not presented as equals. Revoking is what an unpaid
 * month calls for — the content locks immediately and every day, star and
 * recording is still there when they pay. Deleting cascades all of it out of
 * the database and cannot be undone, so it sits behind its own confirmation
 * where the admin has to retype the account's email.
 */
export function StudentAccountActions({
  userId,
  email,
  fullName,
  approved,
  onChanged,
}: {
  userId: string;
  email: string | null;
  fullName: string | null;
  approved: boolean;
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");
  const who = fullName || email || "esta cuenta";

  async function toggleAccess() {
    setBusy(true);
    try {
      await setStudentAccess({ data: { userId, approved: !approved } });
      toast.success(
        approved
          ? `Acceso retirado a ${who}. Su progreso se conserva.`
          : `Acceso devuelto a ${who}.`,
      );
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar el acceso");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    setBusy(true);
    try {
      const res = await deleteStudentAccount({
        data: { userId, confirmEmail: typed.trim(), reason: reason.trim() },
      });
      toast.success(
        `Cuenta de ${res.deleted.full_name || res.deleted.email} eliminada definitivamente.`,
      );
      setConfirming(false);
      setTyped("");
      setReason("");
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar la cuenta");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/50 p-4">
      <h4 className="flex items-center gap-2 font-display text-sm font-extrabold text-navy">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        Gestión de la cuenta
      </h4>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void toggleAccess()}
          className="gap-2 bg-white"
        >
          {approved ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          {approved ? "Retirar acceso (impago)" : "Devolver acceso"}
        </Button>
        {!confirming && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => setConfirming(true)}
            className="gap-2 border-red-300 bg-white text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar cuenta
          </Button>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Retirar el acceso bloquea el contenido al instante y <strong>conserva todo su progreso</strong>{" "}
        — es lo que conviene si simplemente no ha pagado. Eliminar borra la cuenta y todo su trabajo
        para siempre.
      </p>

      {confirming && (
        <div className="mt-4 rounded-xl border border-red-300 bg-white p-4">
          <p className="text-sm font-bold text-red-600">
            Esto elimina para siempre a {who} y todo su trabajo: días completados, grabaciones,
            notas, evaluaciones y estrellas. No se puede deshacer.
          </p>
          <label className="mt-3 block text-xs font-semibold text-navy">
            Escribe <span className="font-mono text-red-600">{email ?? "(sin correo)"}</span> para
            confirmar:
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold text-navy">
            Motivo (queda registrado):
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. no completó el pago de septiembre"
              maxLength={500}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy || typed.trim().toLowerCase() !== (email ?? "").trim().toLowerCase()}
              onClick={() => void doDelete()}
              className="gap-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Eliminar definitivamente
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setConfirming(false);
                setTyped("");
              }}
              className="bg-white"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
