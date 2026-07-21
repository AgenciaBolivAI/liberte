import { useEffect, useState } from "react";
import { Send, Loader2, Check, Unlink } from "lucide-react";
import { getTelegramStatus, startTelegramLink, unlinkTelegram } from "@/lib/telegram.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** Profile card: connect/disconnect Telegram for live-class reminders + alerts. */
export function TelegramConnect() {
  const [status, setStatus] = useState<{ linked: boolean; username: string | null } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    getTelegramStatus()
      .then((s) => setStatus(s))
      .catch(() => setStatus({ linked: false, username: null }));

  useEffect(() => {
    void load();
  }, []);

  async function connect() {
    setBusy(true);
    try {
      const { deepLink } = await startTelegramLink();
      window.open(deepLink, "_blank", "noopener");
      toast.success("Abre Telegram y pulsa «Iniciar» para vincular tu cuenta.");
      // The student links in Telegram out-of-band; re-check shortly after.
      setTimeout(() => void load(), 5000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo iniciar la conexión");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await unlinkTelegram();
      await load();
      toast.success("Telegram desconectado");
    } catch {
      toast.error("No se pudo desconectar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-white/15 bg-card p-6 shadow-card">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#229ED9]/15 text-[#229ED9]">
          <Send className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-lg font-extrabold text-navy">Telegram</p>
          <p className="text-xs text-muted-foreground">
            Recibe recordatorios de tus clases en vivo y avisos directo en tu Telegram.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {status === null ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue" />
        ) : status.linked ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">
              <Check className="h-4 w-4" /> Conectado{status.username ? ` · @${status.username}` : ""}
            </span>
            <Button onClick={() => void disconnect()} disabled={busy} variant="outline" className="gap-2">
              <Unlink className="h-4 w-4" /> Desconectar
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Aún no conectado.</span>
            <Button
              onClick={() => void connect()}
              disabled={busy}
              className="gap-2 bg-[#229ED9] text-white hover:brightness-95"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Conectar
              Telegram
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
