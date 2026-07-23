import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import parisBg from "@/assets/paris-map-bg.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getConversations, getContacts } from "@/lib/messaging.functions";
import { MessageThread } from "@/components/MessageThread";

export const Route = createFileRoute("/mensajes")({
  head: () => ({ meta: [{ title: "Mensajes — Liberté" }] }),
  component: MessagesPage,
});

type Conv = { otherId: string; name: string; lastBody: string; lastAt: string; unread: number };
type Contact = { id: string; name: string; role: string };

const roleLabel = (r: string) => (r === "admin" ? "Profesor" : r === "coach" ? "Coach" : "Alumno/a");
const isStaffRole = (r: string) => r === "admin" || r === "coach";

/** Small role chip so students can tell staff from classmates at a glance. */
function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
        isStaffRole(role) ? "bg-blue/15 text-blue" : "bg-navy/10 text-navy/60"
      }`}
    >
      {roleLabel(role)}
    </span>
  );
}

function MessagesPage() {
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conv[] | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [active, setActive] = useState<{ otherId: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
    // Full people directory (staff + classmates) so anyone can start a chat —
    // previously the page stayed empty unless the teacher wrote first, and
    // students could not message each other at all.
    getContacts()
      .then((s) => setContacts(s as Contact[]))
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

  // People the user has no thread with yet, filtered by the search box. Capped so
  // a large cohort can't dump hundreds of rows into the DOM — narrow with search.
  const CAP = 40;
  const newContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const known = new Set((convs ?? []).map((c) => c.otherId));
    return contacts
      .filter((s) => !known.has(s.id))
      .filter((s) => !q || s.name.toLowerCase().includes(q));
  }, [contacts, convs, search]);
  const shownContacts = newContacts.slice(0, CAP);

  const searchBox = (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar profe o compañero…"
        className="w-full rounded-2xl border border-white/20 bg-white/95 py-2.5 pl-9 pr-3 text-sm text-navy placeholder:text-navy/40 focus:border-blue focus:outline-none"
      />
    </div>
  );

  const contactRow = (s: Contact, dashed = false) => (
    <li key={s.id}>
      <button
        onClick={() => setActive({ otherId: s.id, name: s.name })}
        className={`w-full rounded-2xl border p-3 text-left transition ${dashed ? "border-dashed" : ""} ${
          active?.otherId === s.id ? "border-blue bg-white" : "border-white/30 bg-white/70 hover:bg-white"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold text-navy">{dashed ? "＋ " : ""}{s.name}</span>
          <RoleBadge role={s.role} />
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">Nuevo mensaje</p>
      </button>
    </li>
  );

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
        <p className="mt-1 text-sm text-white/80">Conversaciones con tu equipo y tus compañeros de Liberté.</p>

        {convs === null && !error ? (
          <div className="mt-8 grid place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>
        ) : /* Only replace the view with the error card when there's nothing
              loaded — a transient realtime-refresh failure must not wipe the
              inbox the student is already reading. */
          error && (convs === null || convs.length === 0) && !active ? (
          <div className="mt-6 rounded-2xl border border-red/40 bg-white p-6 text-center text-sm text-red">
            {error}{" "}
            <button onClick={load} className="font-bold underline">
              Reintentar
            </button>
          </div>
        ) : convs !== null && convs.length === 0 && !active ? (
          <div className="mt-6 rounded-2xl border border-white/15 bg-white p-6 text-sm text-muted-foreground">
            <p className="text-center">Aún no tienes mensajes. Empieza una conversación 💌</p>
            <div className="mx-auto mt-4 max-w-sm">{searchBox}</div>
            {shownContacts.length > 0 ? (
              <ul className="mx-auto mt-3 grid max-w-sm gap-1.5">{shownContacts.map((s) => contactRow(s, true))}</ul>
            ) : (
              <p className="mt-3 text-center text-xs">No encontramos a nadie con ese nombre.</p>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-[260px_1fr]">
            <div className="space-y-2">
              {searchBox}
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
                {shownContacts.map((s) => contactRow(s, true))}
                {search.trim() && shownContacts.length === 0 && (
                  <li className="px-1 py-2 text-center text-xs text-white/70">Sin resultados.</li>
                )}
              </ul>
            </div>
            {active && (
              <MessageThread otherUserId={active.otherId} otherName={active.name} onSent={load} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
