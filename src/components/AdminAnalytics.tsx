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
  Download,
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
  X,
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
import { generateAnalyticsPdf } from "@/lib/analyticsPdf";

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
  const [drill, setDrill] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const rangeRef = useRef(range);
  rangeRef.current = range;

  // Guards against a slow in-flight request resolving after the user switched
  // range and overwriting the newer data.
  const reqIdRef = useRef(0);
  const load = useCallback(async (r: Range) => {
    const myReq = ++reqIdRef.current;
    try {
      const res = await getAdminAnalytics({ data: { range: r } });
      if (myReq !== reqIdRef.current || r !== rangeRef.current) return; // stale
      setData(res);
      setError("");
      setUpdatedAt(new Date());
    } catch (e) {
      if (myReq !== reqIdRef.current) return;
      setError(e instanceof Error ? e.message : "No se pudo cargar la analítica");
    } finally {
      if (myReq === reqIdRef.current) setLoading(false);
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
          <Button
            size="sm"
            variant="outline"
            disabled={!data}
            onClick={() => {
              if (!data) return;
              generateAnalyticsPdf(data).save(
                `liberte-analitica-${range}-${new Date().toISOString().slice(0, 10)}.pdf`,
              );
            }}
            className="h-8 rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50"
          >
            <Download className="mr-1 h-3.5 w-3.5" /> PDF
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
            <Kpi icon={<UserPlus className="h-4 w-4" />} label="Cuentas nuevas" delta={data.kpis.newStudents} range={range} active={drill === "newStudents"} onSelect={() => setDrill(drill === "newStudents" ? null : "newStudents")} />
            <Kpi icon={<MessageCircle className="h-4 w-4" />} label="Leads nuevos" delta={data.kpis.newLeads} range={range} active={drill === "newLeads"} onSelect={() => setDrill(drill === "newLeads" ? null : "newLeads")} />
            <Kpi icon={<Users className="h-4 w-4" />} label="Alumnos activos" delta={data.kpis.activeStudents} range={range} active={drill === "activeStudents"} onSelect={() => setDrill(drill === "activeStudents" ? null : "activeStudents")} />
            <Kpi icon={<Calendar className="h-4 w-4" />} label="Días completados" delta={data.kpis.daysCompleted} range={range} active={drill === "daysCompleted"} onSelect={() => setDrill(drill === "daysCompleted" ? null : "daysCompleted")} />
            <Kpi icon={<Star className="h-4 w-4" />} label="Estrellas otorgadas" delta={data.kpis.starsAwarded} range={range} active={drill === "starsAwarded"} onSelect={() => setDrill(drill === "starsAwarded" ? null : "starsAwarded")} />
            <Kpi icon={<Trophy className="h-4 w-4" />} label="Nota media défi" delta={data.kpis.avgDefiScore} range={range} suffix="/10" active={drill === "avgDefiScore"} onSelect={() => setDrill(drill === "avgDefiScore" ? null : "avgDefiScore")} />
            <Kpi icon={<Flame className="h-4 w-4" />} label="Mensajes al tutor IA" delta={data.kpis.tutorMessages} range={range} active={drill === "tutorMessages"} onSelect={() => setDrill(drill === "tutorMessages" ? null : "tutorMessages")} />
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

          {drill && <DrillPanel metric={drill} data={data} onClose={() => setDrill(null)} />}

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

const DRILL_TITLE: Record<string, string> = {
  newStudents: "Cuentas nuevas",
  newLeads: "Leads nuevos",
  activeStudents: "Alumnos activos",
  daysCompleted: "Días completados",
  starsAwarded: "Estrellas otorgadas",
  avgDefiScore: "Nota media défi",
  tutorMessages: "Mensajes al tutor IA",
};

function DrillPanel({ metric, data, onClose }: { metric: string; data: Analytics; onClose: () => void }) {
  const title = DRILL_TITLE[metric] ?? metric;
  const series: { date: string; value: number }[] =
    metric === "newStudents"
      ? data.growthSeries.map((r) => ({ date: r.date, value: r.signups }))
      : metric === "newLeads"
        ? data.growthSeries.map((r) => ({ date: r.date, value: r.leads }))
        : metric === "daysCompleted"
          ? data.activitySeries.map((r) => ({ date: r.date, value: r.completions }))
          : metric === "avgDefiScore"
            ? data.activitySeries.map((r) => ({ date: r.date, value: r.defis }))
            : [];
  const seriesLabel = metric === "avgDefiScore" ? "Défis por día" : "Por día";
  const showStudents = metric === "activeStudents" || metric === "daysCompleted" || metric === "avgDefiScore";
  const showStars = metric === "starsAwarded";
  const feedType = metric === "newStudents" ? "signup" : metric === "newLeads" ? "lead" : null;
  const feed = feedType ? data.recentActivity.filter((f) => f.type === feedType) : [];
  const hasSeriesData = series.some((r) => r.value > 0);

  return (
    <div className="mt-4 rounded-3xl border border-blue/30 bg-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-extrabold text-navy">🔎 Detalle · {title}</h3>
        <button
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="rounded-full p-1.5 text-navy/60 transition hover:bg-ice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {series.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">{seriesLabel}</p>
            <div className="max-h-56 overflow-y-auto rounded-xl border border-border">
              {!hasSeriesData ? (
                <p className="p-3 text-xs text-muted-foreground">Sin datos en el periodo.</p>
              ) : (
                <table className="w-full text-xs">
                  <tbody>
                    {series.map((r) => (
                      <tr key={r.date} className="border-b border-border/60 last:border-0">
                        <td className="px-3 py-1.5 text-navy/70">{r.date}</td>
                        <td className="px-3 py-1.5 text-right font-bold text-navy">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        {showStudents && (
          <div>
            <p className="mb-1 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Top alumnos</p>
            {data.topStudents.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin datos.</p>
            ) : (
              <ul className="space-y-1">
                {data.topStudents.map((s, i) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-navy">
                      {i + 1}. {s.name}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {s.stars} ⭐ · {s.days} d
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {showStars && (
          <div>
            <p className="mb-1 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Por motivo</p>
            {data.starsByReason.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin estrellas en el periodo.</p>
            ) : (
              <ul className="space-y-1">
                {data.starsByReason.map((r) => (
                  <li key={r.reason} className="flex items-center justify-between text-xs">
                    <span className="text-navy">{REASON_LABEL[r.reason] ?? r.reason}</span>
                    <span className="font-bold text-navy">{r.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {feed.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">Recientes</p>
            <ul className="max-h-56 space-y-1 overflow-y-auto">
              {feed.slice(0, 12).map((f, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-navy">{f.who}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {new Date(f.at).toLocaleDateString("es", { day: "numeric", month: "short" })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {metric === "tutorMessages" && (
          <p className="text-xs text-muted-foreground">
            {data.kpis.tutorMessages.value} mensajes en el periodo. El desglose por alumno estará disponible próximamente.
          </p>
        )}
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  delta,
  range,
  suffix = "",
  active = false,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  delta: Delta;
  range: Range;
  suffix?: string;
  active?: boolean;
  onSelect?: () => void;
}) {
  const diff = delta.value - delta.prev;
  const showDelta = range !== "all" && (delta.prev !== 0 || delta.value !== 0);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`rounded-2xl border bg-card p-4 text-left shadow-card transition hover:border-blue/50 hover:shadow-lg ${
        active ? "border-blue ring-1 ring-blue" : "border-white/15"
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-muted-foreground">
        <span className="flex items-center gap-2">
          {icon}
          <span className="text-[10px] font-bold tracking-widest uppercase">{label}</span>
        </span>
        <span className="text-[9px] font-semibold text-blue opacity-0 transition group-hover:opacity-100">ver</span>
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
    </button>
  );
}
