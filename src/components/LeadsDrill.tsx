import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { getLeads, type LeadRow } from "@/lib/admin.functions";
import { LeadCard } from "@/components/LeadCard";

/**
 * What opens when the owner taps the "Leads nuevos" counter.
 *
 * It used to open a table of dates and a list of names with no way to act on
 * them — a dead end from the one number she was most likely to tap. Tapping a
 * count of people should show the people.
 */
export function LeadsDrill() {
  const [leads, setLeads] = useState<LeadRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    getLeads()
      .then((d) => alive && setLeads(d))
      .catch(() => alive && setLeads([]));
    return () => {
      alive = false;
    };
  }, []);

  if (!leads) {
    return (
      <div className="grid place-items-center p-6">
        <Loader2 className="h-5 w-5 animate-spin text-blue" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
        Todavía no hay interesados.
      </p>
    );
  }

  const shown = leads.slice(0, 5);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          Quiénes son
        </p>
        <Link
          to="/liberte-profesor-panel-9382745-admin/interesados"
          className="inline-flex items-center gap-1 text-xs font-bold text-blue hover:underline"
        >
          Abrir Interesados <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ul className="space-y-3">
        {shown.map((l) => (
          <LeadCard key={l.id} lead={l} />
        ))}
      </ul>
      {leads.length > shown.length && (
        <p className="mt-3 text-xs text-muted-foreground">
          y {leads.length - shown.length} más en la pestaña Interesados.
        </p>
      )}
    </div>
  );
}
