import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import parisBg from "@/assets/paris-map-bg.jpg";
import { getConversations } from "@/lib/messaging.functions";
import { MessageThread } from "@/components/MessageThread";

export const Route = createFileRoute("/mensajes")({
  head: () => ({ meta: [{ title: "Mensajes — Liberté" }] }),
  component: MessagesPage,
});

type Conv = { otherId: string; name: string; lastBody: string; lastAt: string; unread: number };

function MessagesPage() {
  const [convs, setConvs] = useState<Conv[] | null>(null);
  const [active, setActive] = useState<Conv | null>(null);

  useEffect(() => {
    getConversations()
      .then((c) => {
        const list = c as Conv[];
        setConvs(list);
        setActive(list[0] ?? null);
      })
      .catch(() => setConvs([]));
  }, []);

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

        {convs === null ? (
          <div className="mt-8 grid place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>
        ) : convs.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/15 bg-white p-6 text-center text-sm text-muted-foreground">
            Aún no tienes mensajes. Tu profesor te escribirá por aquí. 💌
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-[240px_1fr]">
            <ul className="space-y-1">
              {convs.map((c) => (
                <li key={c.otherId}>
                  <button
                    onClick={() => setActive(c)}
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
            </ul>
            {active && <MessageThread otherUserId={active.otherId} otherName={active.name} />}
          </div>
        )}
      </main>
    </div>
  );
}
