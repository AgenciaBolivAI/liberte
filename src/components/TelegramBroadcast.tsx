import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { broadcastTelegram } from "@/lib/telegram.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** Staff: send one announcement to every Telegram-linked student. */
export function TelegramBroadcast() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const body = text.trim();
    if (!body) return;
    if (!window.confirm("¿Enviar este aviso por Telegram a todos los alumnos conectados?")) return;
    setBusy(true);
    try {
      const r = await broadcastTelegram({ data: { text: body } });
      toast.success(`Enviado a ${r.sent}/${r.total} alumno(s)`);
      setText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-3xl border border-border bg-white p-5 shadow-soft">
      <p className="font-display text-lg font-extrabold text-navy">📣 Aviso por Telegram</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Envía un mensaje a todos los alumnos que han conectado su Telegram.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={3000}
        placeholder="Ej.: ¡Recuerden la clase en vivo de hoy a las 18h! 🇫🇷"
        className="mt-3 w-full rounded-2xl border border-border bg-ice p-3 text-base text-navy sm:text-sm"
      />
      <div className="mt-2 flex justify-end">
        <Button onClick={() => void send()} disabled={busy || !text.trim()} className="gap-2 bg-gradient-blue text-white">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Enviar a todos
        </Button>
      </div>
    </div>
  );
}
