import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Inbox } from "lucide-react";
import { getLeads, setLeadStatus, type LeadRow } from "@/lib/admin.functions";
import { LeadCard } from "@/components/LeadCard";

/**
 * New enquiries, on the FIRST screen of the panel.
 *
 * Analítica used to greet the owner with a tile reading "LEADS NUEVOS · 1" —
 * a number with no name behind it — and the only place the person existed was
 * a tab she had never been told about. She reported, correctly, that she could
 * not see who had written. The unanswered leads now sit at the top of the page
 * she actually opens, whole: name, contact, and what they asked for. Silent
 * when nothing is pending, so it never becomes furniture she scrolls past.
 */
export function NewLeadsCard() {
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getLeads()
      .then((d) => alive && setLeads(d))
      // The analytics page must still render if this call fails.
      .catch(() => alive && setLeads([]));
    return () => {
      alive = false;
    };
  }, []);

  async function move(lead: LeadRow, status: string) {
    setBusy(lead.id);
    setLeads((cur) => (cur ?? []).map((l) => (l.id === lead.id ? { ...l, status } : l)));
    try {
      await setLeadStatus({ data: { id: lead.id, status } });
    } catch {
      // Non-fatal here: the Interesados tab is the place to retry.
      setLeads((cur) => (cur ?? []).map((l) => (l.id === lead.id ? { ...l, status: "pending" } : l)));
    } finally {
      setBusy(null);
    }
  }

  if (!leads) return null;
  const pending = leads.filter((l) => l.status === "pending");
  if (pending.length === 0) return null;

  const shown = pending.slice(0, 3);

  return (
    <div className="mb-6 rounded-3xl border-2 border-blue/50 bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-navy">
          <Inbox className="h-5 w-5 text-blue" />
          Interesados sin contactar ({pending.length})
        </h2>
        <Link
          to="/liberte-profesor-panel-9382745-admin/interesados"
          className="inline-flex items-center gap-1 rounded-full bg-navy px-4 py-2 text-sm font-bold text-white hover:bg-navy/90"
        >
          Ver todos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Personas que dejaron sus datos en la web y todavía nadie respondió.
      </p>

      <ul className="mt-4 space-y-3">
        {shown.map((l) => (
          <LeadCard key={l.id} lead={l} onStatus={move} busy={busy === l.id} showStatusBadge={false} />
        ))}
      </ul>

      {pending.length > shown.length && (
        <p className="mt-3 text-xs text-muted-foreground">
          y {pending.length - shown.length} más en la pestaña Interesados.
        </p>
      )}
    </div>
  );
}
