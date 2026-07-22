import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Paperclip, Send, Download } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { getThread, sendMessage, getAttachmentUrl } from "@/lib/messaging.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Msg = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  attachment_path: string | null;
  attachment_name: string | null;
  created_at: string;
  read_at: string | null;
};

/** A two-way message thread between the signed-in user and `otherUserId`, with
 *  document attachments. Used by the teacher (per student) and the student.
 *  `onSent` fires after a successful send so the host can refresh its list. */
export function MessageThread({
  otherUserId,
  otherName,
  onSent,
}: {
  otherUserId: string;
  otherName: string;
  onSent?: () => void;
}) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await getThread({ data: { otherUserId } });
      setMsgs(res.messages as Msg[]);
      setLoadErr("");
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "No se pudo cargar la conversación");
    }
    setLoading(false);
  }, [otherUserId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  // Realtime: reload the thread when the other person sends a message.
  // Requires migration 20260724000000_messages_realtime (messages table in the
  // supabase_realtime publication); without it the subscription just stays
  // silent and the thread refreshes on send/navigation as before. RLS confines
  // the stream to rows this user can read.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`messages-thread-${otherUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          if ((payload.new as Msg).sender_id === otherUserId) void load();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, otherUserId, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    const body = text.trim();
    if (!body && !file) return;
    setSending(true);
    try {
      let attachmentPath: string | undefined;
      let attachmentName: string | undefined;
      if (file && user) {
        if (file.size > 15 * 1024 * 1024) throw new Error("El archivo supera 15 MB");
        const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
        const path = `${user.id}/${crypto.randomUUID()}_${safe}`;
        const { error } = await supabase.storage.from("message-attachments").upload(path, file, { upsert: false });
        if (error) throw new Error(error.message);
        attachmentPath = path;
        attachmentName = file.name.slice(0, 200);
      }
      await sendMessage({ data: { recipientId: otherUserId, body, attachmentPath, attachmentName } });
      setText("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
      onSent?.();
    } catch (e2) {
      toast.error(e2 instanceof Error ? e2.message : "No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  }

  async function openAttachment(id: string) {
    try {
      const { url } = await getAttachmentUrl({ data: { messageId: id } });
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error("No se pudo abrir el adjunto");
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white">
      <div className="border-b border-border px-4 py-2 text-sm font-bold text-navy">💬 {otherName}</div>
      <div className="flex max-h-80 min-h-40 flex-col gap-2 overflow-y-auto p-3">
        {loading ? (
          <Loader2 className="mx-auto my-6 h-5 w-5 animate-spin text-blue" />
        ) : loadErr ? (
          <p className="py-6 text-center text-xs text-red">{loadErr}</p>
        ) : msgs.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Aún no hay mensajes. Escribe el primero.</p>
        ) : (
          msgs.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "self-end bg-gradient-blue text-white" : "self-start bg-ice text-navy"}`}
              >
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                {m.attachment_path && (
                  <button
                    onClick={() => void openAttachment(m.id)}
                    className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold underline ${mine ? "text-white" : "text-blue"}`}
                  >
                    <Download className="h-3 w-3" /> {m.attachment_name ?? "Adjunto"}
                  </button>
                )}
                <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-navy/50"}`}>
                  {new Date(m.created_at).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Adjuntar documento"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-navy/70 transition hover:bg-ice"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={file ? `📎 ${file.name}` : "Escribe un mensaje…"}
          className="h-10 rounded-full border-border bg-white"
        />
        <Button
          type="submit"
          disabled={sending || (!text.trim() && !file)}
          aria-label="Enviar"
          className="h-10 w-10 shrink-0 rounded-full bg-gradient-blue p-0 text-white"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
