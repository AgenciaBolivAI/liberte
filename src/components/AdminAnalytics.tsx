import { useCallback, useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  Calendar,
  Flame,
  Loader2,
  MessageCircle,
  RefreshCw,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { getAdminAnalytics, type AdminAnalytics as Analytics, type Delta, type Range } from "@/lib/admin.functions";

// Deepened brand hues, palette-validated on the white card surface
// (lightness band, chroma, CVD separation, 3:1 contrast — all pass).
const C_BLUE = "#2382C6";
const C_GOLD = "#B98A28";
const C_GREEN = "#2E8560";

const RANGES: { key: Range; label: string }[] = [
  { key: "today", label: "Hoy" },
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "all", label: "Todo" },
];

const growthConfig = {
  leads: { label: "Leads", color: C_GOLD },
  signups: { label: "Cuentas", color: C_BLUE },
} satisfies ChartConfig;

const activityConfig = {
  completions: { label: "Días completados", color: C_BLUE },
  activities: { label: "Actividades", color: C_GOLD },
  defis: { label: "Défis", color: C_GREEN },
} satisfies ChartConfig;

const REASON_LABEL: Record<string, string> = {
  defi: "Défi diario",
  day_complete: "Día terminado",
  weekly_defi: "Défi semanal",
};

const FEED_ICON: Record<Analytics["recentActivity"][number]["type"], string> = {
  lead: "💌",
  signup: "🆕",
  day: "📅",
  defi: "🏆",
  week: "🎉",
  stars: "⭐",
};

export function AdminAnalytics() {
  const [range, setRange] = useState<Range>("7d");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [, setTick] = useState(0);
  const rangeRef = useRef(range);
  rangeRef.current = range;

  const load = useCallback(async (r: Range) => {
    try {
      const res = await getAdminAnalytics({ data: { range: r } });
      setData(res);
      setError("");
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la analítica");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load(range);
  }, [range, load]);

  // Live: refresh every 60s while the tab is visible; tick the "hace Xs" stamp.
  useEffect(() => {
    const poll = setInterval(() => {
      if (!document.hidden) void load(rangeRef.current);
    }, 60_000);
    const stamp = setInterval(() => setTick((t) => t + 1), 15_000);
    const onVisible = () => {
      if (!document.hidden) void load(rangeRef.current);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(poll);
      clearInterval(stamp);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full border border-white/20 bg-white/10 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                range === r.key ? "bg-white text-navy shadow-soft" : "text-white/80 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/70">
          {updatedAt && (
            <span>
              Actualizado {formatDistanceToNow(updatedAt, { addSuffix: true, locale: es })}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => void load(range)}
            className="h-8 rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Actualizar
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red/40 bg-white p-4 text-sm text-red">
          <AlertCircle className="mr-2 inline h-4 w-4" />
          {error}
          <Button size="sm" variant="outline" onClick={() => void load(range)} className="ml-3 h-7">
            Reintentar
          </Button>
        </div>
      )}

      {loading && !data && (
        <div className="grid place-items-center rounded-3xl border border-white/15 bg-card py-16">
          <Loader2 className="h-7 w-7 animate-spin text-blue" />
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi icon={<UserPlus className="h-4 w-4" />} label="Cuentas nuevas" delta={data.kpis.newStudents} range={range} />
            <Kpi icon={<MessageCircle className="h-4 w-4" />} label="Leads nuevos" delta={data.kpis.newLeads} range={range} />
            <Kpi icon={<Users className="h-4 w-4" />} label="Alumnos activos" delta={data.kpis.activeStudents} range={range} />
            <Kpi icon={<Calendar className="h-4 w-4" />} label="Días completados" delta={data.kpis.daysCompleted} range={range} />
            <Kpi icon={<Star className="h-4 w-4" />} label="Estrellas otorgadas" delta={data.kpis.starsAwarded} range={range} />
            <Kpi icon={<Trophy className="h-4 w-4" />} label="Nota media défi" delta={data.kpis.avgDefiScore} range={range} suffix="/10" />
            <Kpi icon={<Flame className="h-4 w-4" />} label="Mensajes al tutor IA" delta={data.kpis.tutorMessages} range={range} />
            <div className="rounded-2xl border border-white/15 bg-card p-4 shadow-card">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserPlus className="h-4 w-4" />
                <span className="text-[10px] font-bold tracking-widest uppercase">Conversión leads</span>
              </div>
              <p className="mt-1 font-display text-2xl font-extrabold text-navy">
                {data.kpis.leadConversionPct}%
              </p>
              <p className="text-[11px] text-muted-foreground">
                {data.kpis.pendingApprovals > 0
                  ? `${data.kpis.pendingApprovals} pendiente${data.kpis.pendingApprovals === 1 ? "" : "s"} de aprobar`
                  : "Sin cuentas pendientes"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/15 bg-card p-5 shadow-card">
              <h3 className="font-display text-sm font-extrabold text-navy">📈 Crecimiento — leads y cuentas por día</h3>
              <ChartContainer config={growthConfig} className="mt-3 h-56 w-full">
                <AreaChart data={data.growthSeries} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} strokeOpacity={0.25} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => v.slice(5)}
                    minTickGap={24}
                    fontSize={11}
                  />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    dataKey="signups"
                    type="monotone"
                    stroke="var(--color-signups)"
                    fill="var(--color-signups)"
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                  <Area
                    dataKey="leads"
                    type="monotone"
                    stroke="var(--color-leads)"
                    fill="var(--color-leads)"
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </div>

            <div className="rounded-3xl border border-white/15 bg-card p-5 shadow-card">
              <h3 className="font-display text-sm font-extrabold text-navy">📚 Actividad de estudio por día</h3>
              <ChartContainer config={activityConfig} className="mt-3 h-56 w-full">
                <BarChart data={data.activitySeries} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} strokeOpacity={0.25} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => v.slice(5)}
                    minTickGap={24}
                    fontSize={11}
                  />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="completions" stackId="a" fill="var(--color-completions)" stroke="#fff" strokeWidth={1} />
                  <Bar dataKey="activities" stackId="a" fill="var(--color-activities)" stroke="#fff" strokeWidth={1} />
                  <Bar dataKey="defis" stackId="a" fill="var(--color-defis)" stroke="#fff" strokeWidth={1} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/15 bg-card p-5 shadow-card">
              <h3 className="font-display text-sm font-extrabold text-navy">⭐ Estrellas por motivo</h3>
              {data.starsByReason.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Sin estrellas en este período.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {data.starsByReason.map((r) => {
                    const max = data.starsByReason[0]?.total || 1;
                    return (
                      <li key={r.reason}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-navy">{REASON_LABEL[r.reason] ?? r.reason}</span>
                          <span className="font-bold text-navy">{r.total}</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-ice">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(r.total / max) * 100}%`, backgroundColor: C_BLUE }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="rounded-3xl border border-white/15 bg-card p-5 shadow-card">
              <h3 className="font-display text-sm font-extrabold text-navy">🏅 Top alumnos del período</h3>
              {data.topStudents.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Sin actividad en este período.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {data.topStudents.map((s, i) => (
                    <li key={s.id} className="flex items-center justify-between rounded-xl bg-ice px-3 py-2 text-sm">
                      <span className="flex items-center gap-2 font-semibold text-navy">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-blue text-xs font-extrabold text-white">
                          {i + 1}
                        </span>
                        {s.name}
                      </span>
                      <span className="text-xs text-navy/70">⭐ {s.stars} · 📅 {s.days}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-3xl border border-white/15 bg-card p-5 shadow-card">
              <h3 className="font-display text-sm font-extrabold text-navy">🕐 Actividad reciente</h3>
              {data.recentActivity.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Sin eventos en este período.</p>
              ) : (
                <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1">
                  {data.recentActivity.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span>{FEED_ICON[f.type]}</span>
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold text-navy">{f.who}</span>{" "}
                        <span className="text-navy/70">— {f.detail}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(f.at), { addSuffix: true, locale: es })}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Kpi({
  icon,
  label,
  delta,
  range,
  suffix = "",
}: {
  icon: React.ReactNode;
  label: string;
  delta: Delta;
  range: Range;
  suffix?: string;
}) {
  const diff = delta.value - delta.prev;
  const showDelta = range !== "all" && (delta.prev !== 0 || delta.value !== 0);
  return (
    <div className="rounded-2xl border border-white/15 bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-bold tracking-widest uppercase">{label}</span>
      </div>
      <p className="mt-1 font-display text-2xl font-extrabold text-navy">
        {delta.value}
        {suffix}
      </p>
      {showDelta && (
        <p
          className={`flex items-center gap-1 text-[11px] font-semibold ${
            diff > 0 ? "text-success" : diff < 0 ? "text-red" : "text-muted-foreground"
          }`}
        >
          {diff > 0 ? <TrendingUp className="h-3 w-3" /> : diff < 0 ? <TrendingDown className="h-3 w-3" /> : null}
          {diff > 0 ? "+" : ""}
          {suffix ? diff.toFixed(1) : diff} vs período anterior
        </p>
      )}
    </div>
  );
}
