import { Mail, MessageCircle, Phone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { LeadRow } from "@/lib/admin.functions";

/**
 * One interested person, with everything we hold about them.
 *
 * Deliberately ONE component used by every place the panel mentions a lead —
 * the Interesados tab, the card on Analítica, and the drill-down behind the
 * "Leads nuevos" counter. The owner's complaint was never that a screen was
 * missing; it was that each screen showed a different, thinner slice (a bare
 * email, a bare number, a date table). Wherever a lead appears now, it appears
 * whole.
 */

export const LEAD_STATUS: { id: string; label: string; cls: string }[] = [
  { id: "pending", label: "Nuevo", cls: "bg-gold/20 text-navy border-gold/50" },
  { id: "contacted", label: "Contactado", cls: "bg-blue/15 text-blue border-blue/40" },
  { id: "approved", label: "Inscrito", cls: "bg-green-100 text-green-700 border-green-300" },
  { id: "discarded", label: "Descartado", cls: "bg-muted text-muted-foreground border-border" },
];

export const leadStatusLabel = (s: string) =>
  LEAD_STATUS.find((x) => x.id === s)?.label ?? s;
export const leadStatusClass = (s: string) =>
  LEAD_STATUS.find((x) => x.id === s)?.cls ?? LEAD_STATUS[3].cls;

/** Digits only — WhatsApp rejects spaces, dashes and parentheses in wa.me links. */
export function waLink(phone: string, name: string): string {
  const digits = phone.replace(/\D/g, "");
  const hi = `Hola ${name.split(" ")[0] || ""}, te escribo de Liberté Daily French`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(hi)}`;
}

export function LeadCard({
  lead,
  onStatus,
  busy = false,
  showStatusBadge = true,
}: {
  lead: LeadRow;
  /** Omit to render read-only (the Analítica card and the drill-down). */
  onStatus?: (lead: LeadRow, status: string) => void;
  busy?: boolean;
  showStatusBadge?: boolean;
}) {
  const l = lead;
  return (
    <li className="rounded-2xl border border-border bg-background p-4">
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
        {showStatusBadge && (
          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${leadStatusClass(l.status)}`}
          >
            {leadStatusLabel(l.status)}
          </span>
        )}
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

      {onStatus && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs font-semibold text-muted-foreground">Marcar como:</span>
          {LEAD_STATUS.filter((s) => s.id !== l.status).map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={busy}
              onClick={() => onStatus(l, s.id)}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-navy transition hover:bg-ice disabled:opacity-50"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
