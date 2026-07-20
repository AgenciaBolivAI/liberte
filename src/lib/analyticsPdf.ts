import { jsPDF } from "jspdf";
import type { AdminAnalytics, Range } from "@/lib/admin.functions";

const NAVY: [number, number, number] = [61, 85, 137];
const GOLD: [number, number, number] = [201, 168, 76];
const GREY: [number, number, number] = [90, 96, 110];
const LIGHT: [number, number, number] = [240, 242, 248];

const RANGE_LABEL: Record<Range, string> = {
  today: "Hoy",
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  all: "Todo el histórico",
};

const REASON_LABEL: Record<string, string> = {
  defi: "Défi diario",
  day_complete: "Día terminado",
  weekly_defi: "Défi semanal",
};

const FEED_LABEL: Record<AdminAnalytics["recentActivity"][number]["type"], string> = {
  lead: "Lead",
  signup: "Cuenta nueva",
  day: "Día completado",
  defi: "Défi",
  week: "Semana",
  stars: "Estrellas",
};

/** A one-page (auto-paginated) PDF summarising the analytics for a timeframe. */
export function generateAnalyticsPdf(d: AdminAnalytics): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  let y = M;

  const setColor = (rgb: [number, number, number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const setFill = (rgb: [number, number, number]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const ensure = (needed: number) => {
    if (y + needed > H - M) {
      doc.addPage();
      y = M;
    }
  };
  const sectionTitle = (t: string) => {
    ensure(34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setColor(NAVY);
    doc.text(t, M, y);
    y += 16;
  };

  // Header band
  setFill(NAVY);
  doc.rect(0, 0, W, 90, "F");
  setFill(GOLD);
  doc.rect(0, 90, W, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("LIBERTÉ", M, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Institut de Français · Analítica", M, 62);
  doc.setFontSize(10);
  doc.text(
    new Date().toLocaleDateString("es-BO", { year: "numeric", month: "long", day: "numeric" }),
    W - M,
    45,
    { align: "right" },
  );
  doc.text(`Periodo: ${RANGE_LABEL[d.range]}`, W - M, 62, { align: "right" });
  y = 120;

  // KPI grid
  sectionTitle("Indicadores del periodo");
  const kpis: { label: string; value: string }[] = [
    { label: "Cuentas nuevas", value: String(d.kpis.newStudents.value) },
    { label: "Leads nuevos", value: String(d.kpis.newLeads.value) },
    { label: "Alumnos activos", value: String(d.kpis.activeStudents.value) },
    { label: "Días completados", value: String(d.kpis.daysCompleted.value) },
    { label: "Estrellas otorgadas", value: String(d.kpis.starsAwarded.value) },
    { label: "Nota media défi", value: `${d.kpis.avgDefiScore.value}/10` },
    { label: "Mensajes al tutor IA", value: String(d.kpis.tutorMessages.value) },
    { label: "Conversión de leads", value: `${d.kpis.leadConversionPct}%` },
  ];
  const cols = 4;
  const cardW = (W - 2 * M - (cols - 1) * 8) / cols;
  const cardH = 46;
  kpis.forEach((k, i) => {
    const col = i % cols;
    if (col === 0) ensure(cardH + 8);
    const x = M + col * (cardW + 8);
    setFill(LIGHT);
    doc.roundedRect(x, y, cardW, cardH, 5, 5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    setColor(NAVY);
    doc.text(k.value, x + 8, y + 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setColor(GREY);
    doc.text(k.label.toUpperCase(), x + 8, y + 37);
    if (col === cols - 1) y += cardH + 8;
  });
  if (kpis.length % cols !== 0) y += cardH + 8;
  y += 6;

  // Top students
  sectionTitle("Top alumnos");
  doc.setFontSize(10);
  if (d.topStudents.length === 0) {
    doc.setFont("helvetica", "normal");
    setColor(GREY);
    doc.text("Sin datos en este periodo.", M, y);
    y += 16;
  } else {
    d.topStudents.forEach((s, i) => {
      ensure(16);
      doc.setFont("helvetica", "bold");
      setColor(NAVY);
      doc.text(`${i + 1}. ${s.name}`, M, y);
      doc.setFont("helvetica", "normal");
      setColor(GREY);
      doc.text(`${s.stars} ⭐   ·   ${s.days} días`, W - M, y, { align: "right" });
      y += 15;
    });
  }
  y += 6;

  // Stars by reason
  sectionTitle("Estrellas por motivo");
  doc.setFontSize(10);
  if (d.starsByReason.length === 0) {
    doc.setFont("helvetica", "normal");
    setColor(GREY);
    doc.text("Sin estrellas en este periodo.", M, y);
    y += 16;
  } else {
    d.starsByReason.forEach((r) => {
      ensure(16);
      doc.setFont("helvetica", "normal");
      setColor(NAVY);
      doc.text(REASON_LABEL[r.reason] ?? r.reason, M, y);
      setColor(GREY);
      doc.text(String(r.total), W - M, y, { align: "right" });
      y += 15;
    });
  }
  y += 6;

  // Recent activity
  sectionTitle("Actividad reciente");
  doc.setFontSize(9);
  if (d.recentActivity.length === 0) {
    doc.setFont("helvetica", "normal");
    setColor(GREY);
    doc.text("Sin actividad en este periodo.", M, y);
  } else {
    d.recentActivity.slice(0, 20).forEach((f) => {
      ensure(14);
      doc.setFont("helvetica", "bold");
      setColor(NAVY);
      doc.text(`${FEED_LABEL[f.type]} · ${f.who}`, M, y);
      doc.setFont("helvetica", "normal");
      setColor(GREY);
      const when = new Date(f.at).toLocaleDateString("es-BO", { day: "numeric", month: "short" });
      doc.text(when, W - M, y, { align: "right" });
      y += 12;
      if (f.detail) {
        ensure(12);
        doc.setFontSize(8);
        doc.text(doc.splitTextToSize(f.detail, W - 2 * M).slice(0, 1), M + 8, y);
        doc.setFontSize(9);
        y += 12;
      }
    });
  }

  return doc;
}
