import { useEffect, useMemo, useState } from "react";
import { Inbox, Loader2, Mail, MessageCircle, Phone, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { getLeads, setLeadStatus, type LeadRow } from "@/lib/admin.functions";

/**
 * The enquiry inbox.
 *
 * Before this existed a lead surfaced as ONE line in the activity feed reading
 * "Nuevo lead · <email>". The name, the phone and the country were already in
 * the row and were simply never selected, so the owner received an address and
 * no way to know who had written or what they wanted. Everything we hold about
 * a prospect is on screen here, with one tap to answer by mail or WhatsApp.
 */

const STATUS: { id: string; label: string; cls: string }[] = [
  { id: "pending", label: "Nuevo", cls: "bg-gold/20 text-navy border-gold/50" },
  { id: "contacted", label: "Contactado", cls: "bg-blue/15 text-blue border-blue/40" },
  { id: "approved", label: "Inscrito", cls: "bg-green-100 text-green-700 border-green-300" },
  { id: "discarded", label: "Descartado", cls: "bg-muted text-muted-foreground border-border" },
];

const labelOf = (s: string) => STATUS.find((x) => x.id === s)?.label ?? s;
const clsOf = (s: string) => STATUS.find((x) => x.id === s)?.cls ?? STATUS[3].cls;

/** Digits only — WhatsApp rejects spaces, dashes and parentheses in wa.me links. */
function waLink(phone: string, name: string): string {
  const digits = phone.replace(/\D/g, "");
  const hi = `Hola ${name.split(" ")[0] || ""}, te escribo de Liberté Daily French`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(hi)}`;
}

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

  const counts = STATUS.map((s) => ({ ...s, n: leads.filter((l) => l.status === s.id).length }));

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
            <li key={l.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg font-extrabold text-navy">
                    {l.full_name || "Sin nombre"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {l.nationality ? `${l.nationality} · ` : ""}
                    {formatDistanceToNow(new Date(l.created_at), { addSuffix: true, locale: es })}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${clsOf(l.status)}`}
                >
                  {labelOf(l.status)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`mailto:${l.email}?subject=${encodeURIComponent("Liberté Daily French")}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-navy hover:bg-ice"
                >
                  <Mail className="h-4 w-4 text-blue" />
                  {l.email}
                </a>
                {l.phone && (
                  <>
                    <a
                      href={`tel:${l.phone}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-navy hover:bg-ice"
                    >
                      <Phone className="h-4 w-4 text-blue" />
                      {l.phone}
                    </a>
                    <a
                      href={waLink(l.phone, l.full_name || "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-100"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  </>
                )}
              </div>

              {l.message ? (
                <div className="mt-3 rounded-xl border-l-4 border-gold bg-gold/5 p-3">
                  <p className="text-[11px] font-bold tracking-wide text-navy/50 uppercase">
                    En qué necesita ayuda
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-navy">{l.message}</p>
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground italic">
                  No escribió un mensaje — pregúntale qué busca al contactarla.
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <span className="text-xs font-semibold text-muted-foreground">Marcar como:</span>
                {STATUS.filter((s) => s.id !== l.status).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={busy === l.id}
                    onClick={() => void move(l, s.id)}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-navy transition hover:bg-ice disabled:opacity-50"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
