import { useEffect, useMemo, useState } from "react";
import { Inbox, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { getLeads, setLeadStatus, type LeadRow } from "@/lib/admin.functions";
import { LEAD_STATUS, LeadCard } from "@/components/LeadCard";

/**
 * The enquiry inbox.
 *
 * Before this existed a lead surfaced as ONE line in the activity feed reading
 * "Nuevo lead · <email>". The name, the phone and the country were already in
 * the row and were simply never selected, so the owner received an address and
 * no way to know who had written or what they wanted. Everything we hold about
 * a prospect is on screen here, with one tap to answer by mail or WhatsApp.
 */
export function LeadsInbox() {
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  async function reload() {
    try {
      setLeads(await getLeads());
    } catch (e) {
      setLeads([]);
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar los interesados");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (leads ?? []).filter((l) => {
      if (filter !== "all" && l.status !== filter) return false;
      if (!needle) return true;
      return [l.full_name, l.email, l.phone, l.nationality, l.message]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [leads, filter, q]);

  async function move(lead: LeadRow, status: string) {
    setBusy(lead.id);
    // Optimistic: the owner works down the list fast, and a round-trip per
    // click makes it feel broken.
    setLeads((cur) => (cur ?? []).map((l) => (l.id === lead.id ? { ...l, status } : l)));
    try {
      await setLeadStatus({ data: { id: lead.id, status } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
      await reload();
    } finally {
      setBusy(null);
    }
  }

  if (!leads) {
    return (
      <div className="grid place-items-center rounded-3xl border border-border bg-card p-10 shadow-card">
        <Loader2 className="h-6 w-6 animate-spin text-blue" />
      </div>
    );
  }

  const counts = LEAD_STATUS.map((s) => ({
    ...s,
    n: leads.filter((l) => l.status === s.id).length,
  }));

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-navy">
            <Inbox className="h-5 w-5 text-blue" />
            Interesados ({leads.length})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Todo lo que dejó cada persona en el formulario de la web: quién es, cómo contactarla y
            qué necesita.
          </p>
        </div>
        <label className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nombre, correo, teléfono…"
            className="w-64 max-w-full rounded-full border border-input bg-background py-2 pr-3 pl-9 text-sm"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
            filter === "all"
              ? "border-navy bg-navy text-white"
              : "border-border bg-background text-navy"
          }`}
        >
          Todos ({leads.length})
        </button>
        {counts.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setFilter(s.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
              filter === s.id ? "border-navy bg-navy text-white" : s.cls
            }`}
          >
            {s.label} ({s.n})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {leads.length === 0
            ? "Todavía no hay interesados. Aparecerán aquí en cuanto alguien complete el formulario de la web."
            : "Ningún interesado coincide con este filtro."}
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {shown.map((l) => (
            <LeadCard key={l.id} lead={l} onStatus={move} busy={busy === l.id} />
          ))}
        </ul>
      )}
    </div>
  );
}
