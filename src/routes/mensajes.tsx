import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import parisBg from "@/assets/paris-map-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getConversations, getStaffContacts } from "@/lib/messaging.functions";
import { MessageThread } from "@/components/MessageThread";

export const Route = createFileRoute("/mensajes")({
  head: () => ({ meta: [{ title: "Mensajes — Liberté" }] }),
  component: MessagesPage,
});

type Conv = { otherId: string; name: string; lastBody: string; lastAt: string; unread: number };
type Staff = { id: string; name: string; role: string };

function MessagesPage() {
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conv[] | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [active, setActive] = useState<{ otherId: string; name: string } | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    getConversations()
      .then((c) => {
        const list = c as Conv[];
        setConvs(list);
        setError("");
        setActive((a) => a ?? (list[0] ? { otherId: list[0].otherId, name: list[0].name } : null));
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "No se pudieron cargar los mensajes"),
      );
  }, []);

  useEffect(() => {
    load();
    // Staff directory so the student can start a conversation (previously the
    // page stayed empty forever unless the teacher wrote first).
    getStaffContacts()
      .then((s) => setStaff(s as Staff[]))
      .catch(() => {
        /* the directory is a convenience; threads still load without it */
      });
  }, [load]);

  // Realtime inbox: refresh the list (new threads, unread badges) when a
  // message arrives. Needs migration 20260724000000_messages_realtime applied;
  // without it the subscription stays silent and the list updates on send/load.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, load]);

  // Staff members the user has no thread with yet.
  const newContacts = staff.filter((s) => !(convs ?? []).some((c) => c.otherId === s.id));

  return (
    <div
      className="relative min-h-screen bg-cover bg-center md:bg-fixed"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.80) 0%, oklch(0.30 0.08 265 / 0.92) 100%), url(${parisBg})`,
      }}
    >
      <TopNav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="font-display text-3xl font-extrabold text-white">✉️ Mensajes</h1>
        <p className="mt-1 text-sm text-white/80">Conversaciones con tu equipo de Liberté.</p>

        {convs === null && !error ? (
          <div className="mt-8 grid place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red/40 bg-white p-6 text-center text-sm text-red">
            {error}{" "}
            <button onClick={load} className="font-bold underline">
              Reintentar
            </button>
          </div>
        ) : convs !== null && convs.length === 0 && !active ? (
          <div className="mt-6 rounded-2xl border border-white/15 bg-white p-6 text-center text-sm text-muted-foreground">
            Aún no tienes mensajes. Escribe a tu equipo aquí abajo. 💌
            {newContacts.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {newContacts.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActive({ otherId: s.id, name: s.name })}
                    className="rounded-full bg-gradient-blue px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                  >
                    💬 {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-[240px_1fr]">
            <ul className="space-y-1">
              {(convs ?? []).map((c) => (
                <li key={c.otherId}>
                  <button
                    onClick={() => setActive({ otherId: c.otherId, name: c.name })}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      active?.otherId === c.otherId
                        ? "border-blue bg-white"
                        : "border-white/15 bg-white/90 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-navy">{c.name}</span>
                      {c.unread > 0 && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-blue px-1 text-[10px] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.lastBody}</p>
                  </button>
                </li>
              ))}
              {newContacts.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setActive({ otherId: s.id, name: s.name })}
                    className={`w-full rounded-2xl border border-dashed p-3 text-left transition ${
                      active?.otherId === s.id
                        ? "border-blue bg-white"
                        : "border-white/30 bg-white/60 hover:bg-white"
                    }`}
                  >
                    <span className="truncate text-sm font-bold text-navy">＋ {s.name}</span>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">Nuevo mensaje</p>
                  </button>
                </li>
              ))}
            </ul>
            {active && (
              <MessageThread otherUserId={active.otherId} otherName={active.name} onSent={load} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
