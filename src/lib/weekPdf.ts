import { jsPDF } from "jspdf";

export type WeeklyReportData = {
  studentName: string;
  weekNumber: number;
  monthLabel: string; // e.g. "Mois 1: J'OSE"
  daysCompleted: number;
  daysTotal: number;
  weeklyScore: number;
  compScores: { CO: number; CE: number; PE: number; PO: number };
  strengths: { title: string; example: string }[];
  commonErrors: { said: string; corrected: string; rule: string }[];
  improvements: string[];
  pronunciation: { word: string; heard: string; target: string; tip: string }[];
  coachSummary: string;
  verdict: { title: string; message: string };
};

const NAVY: [number, number, number] = [61, 85, 137];
const GOLD: [number, number, number] = [201, 168, 76];
const GREY: [number, number, number] = [90, 96, 110];
const LIGHT: [number, number, number] = [240, 242, 248];

export function generateWeeklyPdf(d: WeeklyReportData): jsPDF {
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

  // Header
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
  doc.setTextColor(255, 255, 255);
  doc.text("Institut de Français", M, 62);
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString("es-BO", { year: "numeric", month: "long", day: "numeric" }), W - M, 45, { align: "right" });
  doc.text(d.monthLabel, W - M, 62, { align: "right" });
  y = 120;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setColor(NAVY);
  doc.text(`Informe Semanal · Semana ${d.weekNumber}`, M, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setColor(GREY);
  doc.text(`Alumno: ${d.studentName}`, M, y);
  y += 24;

  // Verdict box
  setFill(LIGHT);
  doc.roundedRect(M, y, W - 2 * M, 70, 8, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setColor(NAVY);
  doc.text(d.verdict.title, M + 16, y + 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setColor(GREY);
  const vm = doc.splitTextToSize(d.verdict.message || "", W - 2 * M - 200);
  doc.text(vm, M + 16, y + 44);
  // Big score
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  setColor(GOLD);
  doc.text(`${d.weeklyScore.toFixed(1)}/10`, W - M - 16, y + 42, { align: "right" });
  y += 90;

  // Section: numbers
  section("Mi semana en números");
  const stats = [
    ["Días completados", `${d.daysCompleted}/${d.daysTotal}`],
    ["Nota semanal", `${d.weeklyScore.toFixed(1)}/10`],
    ["Comprensión oral (CO)", `${d.compScores.CO.toFixed(1)}/10`],
    ["Comprensión escrita (CE)", `${d.compScores.CE.toFixed(1)}/10`],
    ["Producción oral (PO)", `${d.compScores.PO.toFixed(1)}/10`],
    ["Producción escrita (PE)", `${d.compScores.PE.toFixed(1)}/10`],
  ];
  stats.forEach(([k, v]) => {
    ensure(20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    setColor(GREY);
    doc.text(k, M + 8, y);
    doc.setFont("helvetica", "bold");
    setColor(NAVY);
    doc.text(v, W - M - 8, y, { align: "right" });
    y += 18;
  });
  y += 10;

  // Strengths
  section("✨ Mis puntos fuertes");
  d.strengths.forEach((s) => {
    ensure(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setColor(NAVY);
    doc.text(`• ${s.title}`, M + 8, y);
    y += 14;
    doc.setFont("helvetica", "italic");
    setColor(GREY);
    const ex = doc.splitTextToSize(`  « ${s.example} »`, W - 2 * M - 16);
    doc.text(ex, M + 16, y);
    y += ex.length * 12 + 6;
  });
  y += 6;

  // Common errors table
  section("⚠️ Mis errores comunes");
  d.commonErrors.forEach((e) => {
    ensure(50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setColor(GREY);
    doc.text("Dijo/Escribió:", M + 8, y);
    doc.setFont("helvetica", "normal");
    setColor(NAVY);
    const said = doc.splitTextToSize(`« ${e.said} »`, W - 2 * M - 100);
    doc.text(said, M + 100, y);
    y += said.length * 12 + 2;

    doc.setFont("helvetica", "bold");
    setColor(GREY);
    doc.text("Correcto:", M + 8, y);
    doc.setFont("helvetica", "bold");
    setColor(GOLD);
    const corr = doc.splitTextToSize(`« ${e.corrected} »`, W - 2 * M - 100);
    doc.text(corr, M + 100, y);
    y += corr.length * 12 + 2;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    setColor(GREY);
    const rule = doc.splitTextToSize(`Regla: ${e.rule}`, W - 2 * M - 16);
    doc.text(rule, M + 8, y);
    y += rule.length * 11 + 10;
  });
  y += 6;

  // Improvements
  section("🎯 Dónde debo mejorar");
  d.improvements.forEach((i) => {
    ensure(30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    setColor(NAVY);
    const t = doc.splitTextToSize(`→ ${i}`, W - 2 * M - 8);
    doc.text(t, M + 8, y);
    y += t.length * 13 + 6;
  });
  y += 6;

  // Pronunciation
  section("🔊 Mi pronunciación");
  d.pronunciation.forEach((p) => {
    ensure(50);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    setColor(NAVY);
    doc.text(p.word, M + 8, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setColor(GREY);
    const lines = [
      `Sonó como: ${p.heard}`,
      `Debe sonar: ${p.target}`,
      `Truco: ${p.tip}`,
    ];
    lines.forEach((l) => {
      const t = doc.splitTextToSize(l, W - 2 * M - 16);
      doc.text(t, M + 16, y);
      y += t.length * 12;
    });
    y += 8;
  });
  y += 6;

  // Coach summary
  section("💬 Resumen para mi coach");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  setColor(NAVY);
  const cs = doc.splitTextToSize(d.coachSummary || "", W - 2 * M - 8);
  ensure(cs.length * 13 + 10);
  doc.text(cs, M + 8, y);
  y += cs.length * 13 + 16;

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    setFill(NAVY);
    doc.rect(0, H - 50, W, 50, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("Envía este informe a tu coach Alejandra Miranda por WhatsApp: +591 72586663", W / 2, H - 30, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(220, 220, 220);
    doc.text("Soporte: escuelaliberte@gmail.com", W / 2, H - 15, { align: "center" });
  }

  return doc;

  function section(title: string) {
    ensure(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setColor(GOLD);
    doc.text(title, M, y);
    y += 6;
    setFill(GOLD);
    doc.rect(M, y, 40, 2, "F");
    y += 16;
  }
}
