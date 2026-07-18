import { jsPDF } from "jspdf";

export type Week2ReportData = {
  studentName: string;
  date: string; // formatted
  totalScore: number; // /100
  quizScore: number; // /40
  vocabScore: number; // /20
  writingScore: number; // /30
  roleplayScore: number; // /10
  byTopic: {
    futur_proche: { correct: number; total: number };
    il_y_a: { correct: number; total: number };
    devoir: { correct: number; total: number };
    en_a_par: { correct: number; total: number };
    integracion: { correct: number; total: number };
  };
};

const NAVY: [number, number, number] = [15, 27, 60];
const GOLD: [number, number, number] = [201, 168, 76];
const WINE: [number, number, number] = [107, 35, 64];
const GREY: [number, number, number] = [90, 96, 110];
const LIGHT_WINE: [number, number, number] = [244, 231, 236];

function achievement(score: number): { label: string; blurb: string } {
  if (score >= 90) return { label: "EXCELLENCE", blurb: "Niveau B1 en camino" };
  if (score >= 75) return { label: "TRÈS BIEN", blurb: "¡Sólida base!" };
  if (score >= 60) return { label: "BIEN", blurb: "Sigue practicando" };
  return { label: "COURAGE", blurb: "Revisa los días de la semana" };
}

function topicIcon(c: number, t: number): string {
  const r = t === 0 ? 0 : c / t;
  if (r >= 0.75) return "[OK] Dominado";
  if (r >= 0.5) return "[~]  En progreso";
  return "[!]  Repasar";
}

export function generateWeek2Pdf(d: Week2ReportData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;

  const setColor = (rgb: [number, number, number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const setFill = (rgb: [number, number, number]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);

  const ach = achievement(d.totalScore);

  const footer = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(GREY);
    doc.text(
      `Liberté · Mes 1: J'OSE · Informe Semana 2 · ${d.studentName} · ${d.date}`,
      W / 2,
      H - 20,
      { align: "center" },
    );
  };

  /* ---------- PAGE 1: portada ---------- */
  let y = 90;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(38);
  setColor(NAVY);
  doc.text("LIBERTÉ", W / 2, y, { align: "center" });
  y += 14;
  setFill(GOLD);
  doc.rect(W / 2 - 60, y, 120, 3, "F");
  y += 46;

  doc.setFontSize(18);
  setColor(NAVY);
  doc.text("INFORME DE PROGRESO — SEMANA 2", W / 2, y, { align: "center" });
  y += 22;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(12);
  setColor(GREY);
  doc.text("Mes 1: J'OSE · Les Transports et les Repas", W / 2, y, { align: "center" });
  y += 18;
  doc.text(`Días 6 al 10 · Evaluación completada el ${d.date}`, W / 2, y, { align: "center" });
  y += 60;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setColor(GREY);
  doc.text("Alumno", W / 2, y, { align: "center" });
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setColor(NAVY);
  doc.text(d.studentName, W / 2, y, { align: "center" });
  y += 60;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(64);
  setColor(WINE);
  doc.text(`${d.totalScore}`, W / 2, y, { align: "center" });
  doc.setFontSize(18);
  setColor(GREY);
  doc.text("/ 100 puntos", W / 2, y + 22, { align: "center" });
  y += 68;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  setColor(GOLD);
  doc.text(ach.label, W / 2, y, { align: "center" });
  y += 20;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(12);
  setColor(NAVY);
  doc.text(ach.blurb, W / 2, y, { align: "center" });

  y = H - 90;
  setFill(GOLD);
  doc.rect(W / 2 - 60, y, 120, 3, "F");
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setColor(GREY);
  doc.text("Liberté · Institut de Français · Mes 1: J'OSE", W / 2, y, { align: "center" });
  footer();

  /* ---------- PAGE 2: resultados detallados ---------- */
  doc.addPage();
  y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setColor(NAVY);
  doc.text("RESULTADOS POR SECCIÓN", M, y);
  y += 24;

  const rows: [string, string][] = [
    ["Sección 1 · Quiz Gramatical", `${d.quizScore} / 40`],
    ["Sección 2 · Vocabulario en Contexto", `${d.vocabScore} / 20`],
    ["Sección 3 · Producción Escrita", `${d.writingScore} / 30`],
    ["Sección 4 · Roleplay con Coach", `${d.roleplayScore} / 10`],
    ["TOTAL", `${d.totalScore} / 100`],
  ];
  doc.setFontSize(11);
  rows.forEach(([k, v], i) => {
    if (i === rows.length - 1) {
      setFill(LIGHT_WINE);
      doc.rect(M, y - 12, W - 2 * M, 22, "F");
      doc.setFont("helvetica", "bold");
      setColor(NAVY);
    } else {
      doc.setFont("helvetica", "normal");
      setColor(GREY);
    }
    doc.text(k, M + 8, y);
    doc.setFont("helvetica", "bold");
    setColor(NAVY);
    doc.text(v, W - M - 8, y, { align: "right" });
    y += 22;
  });
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  setColor(GOLD);
  doc.text("GRAMÁTICA: RESULTADO POR TEMA", M, y);
  y += 18;

  const topics: [string, { correct: number; total: number }][] = [
    ["Futur proche (Día 6)", d.byTopic.futur_proche],
    ["Il y a / Il n'y a pas de (Día 7)", d.byTopic.il_y_a],
    ["Devoir + infinitif (Día 8)", d.byTopic.devoir],
    ["EN / À / PAR + Prendre (Días 9-10)", d.byTopic.en_a_par],
    ["Integración Semana 2", d.byTopic.integracion],
  ];
  doc.setFontSize(11);
  topics.forEach(([label, t]) => {
    doc.setFont("helvetica", "normal");
    setColor(NAVY);
    doc.text(label, M + 8, y);
    doc.setFont("helvetica", "bold");
    setColor(GREY);
    doc.text(`${t.correct}/${t.total}  ${topicIcon(t.correct, t.total)}`, W - M - 8, y, {
      align: "right",
    });
    y += 20;
  });

  footer();

  /* ---------- PAGE 3: análisis y recomendaciones ---------- */
  doc.addPage();
  y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setColor(NAVY);
  doc.text("TU PERFIL DE LA SEMANA 2", M, y);
  y += 24;

  const strong = topics.filter(([, t]) => t.total > 0 && t.correct / t.total >= 0.75);
  const weak = topics.filter(([, t]) => t.total > 0 && t.correct / t.total < 0.5);

  const section = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setColor(GOLD);
    doc.text(title, M, y);
    y += 6;
    setFill(GOLD);
    doc.rect(M, y, 40, 2, "F");
    y += 16;
  };

  section("LO QUE DOMINAS");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setColor(NAVY);
  if (strong.length === 0) {
    doc.text("• Todavía no hay un tema dominado — sigue practicando con constancia.", M + 8, y);
    y += 16;
  } else {
    strong.forEach(([label]) => {
      const t = doc.splitTextToSize(`• ${label}: excelente manejo, sigue así.`, W - 2 * M - 16);
      doc.text(t, M + 8, y);
      y += t.length * 14 + 2;
    });
  }
  y += 8;

  section("LO QUE NECESITAS PRACTICAR");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setColor(NAVY);
  if (weak.length === 0) {
    doc.text("• ¡Nada crítico! Todos los temas están al menos en progreso.", M + 8, y);
    y += 16;
  } else {
    weak.forEach(([label]) => {
      const t = doc.splitTextToSize(`• ${label}: repasa el día correspondiente.`, W - 2 * M - 16);
      doc.text(t, M + 8, y);
      y += t.length * 14 + 2;
    });
  }
  y += 8;

  section("3 RECOMENDACIONES PERSONALIZADAS");
  const quizPct = (d.quizScore / 40) * 100;
  let recs: string[];
  if (quizPct < 60) {
    recs = [
      "Vuelve a los videos de los días donde tuviste más errores y repásalos esta semana.",
      "Practica las flashcards de vocabulario de los Días 6-10 durante 10 minutos al día.",
      "Antes de continuar a la Semana 3, completa los ejercicios de refuerzo en la plataforma.",
    ];
  } else if (quizPct < 80) {
    recs = [
      "Tienes una base sólida. Enfoca tu práctica en los temas donde marcaste errores.",
      "Practica el roleplay con el Coach IA una vez más para ganar fluidez.",
      "La Semana 3 (Días 11-12) construye sobre lo que aprendiste. ¡Estás lista/o!",
    ];
  } else {
    recs = [
      "¡Excelente semana! Puedes avanzar a la Semana 3 con total confianza.",
      "Para ir más allá: usa las expresiones clave en conversaciones reales esta semana.",
      "Eres un ejemplo de constancia. ¡El B1 está más cerca de lo que crees!",
    ];
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setColor(NAVY);
  recs.forEach((r, i) => {
    const t = doc.splitTextToSize(`${i + 1}. ${r}`, W - 2 * M - 16);
    doc.text(t, M + 8, y);
    y += t.length * 14 + 4;
  });
  y += 10;

  // Mensaje personal
  const boxH = 130;
  setFill(LIGHT_WINE);
  doc.roundedRect(M, y, W - 2 * M, boxH, 10, 10, "F");
  const lines = [
    `Hola, ${d.studentName.split(" ")[0] || d.studentName}.`,
    "",
    "Completaste la Semana 2 de J'OSE. Eso ya dice mucho de ti.",
    "Esta semana aprendiste a moverte, a comer y a comprar en francés real.",
    "No son datos — son situaciones de vida.",
    "",
    "Sigue. Tu francés ya está vivo.",
    "Je suis fière de toi.",
    "",
    "— Ale",
  ];
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10.5);
  setColor(WINE);
  let ly = y + 20;
  lines.forEach((l) => {
    doc.text(l, W / 2, ly, { align: "center" });
    ly += 12;
  });

  footer();

  /* ---------- PAGE 4: vocabulario ---------- */
  doc.addPage();
  y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setColor(NAVY);
  doc.text("MIS PALABRAS DE LA SEMANA 2", M, y);
  y += 20;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  setColor(GREY);
  doc.text("IDs 151-300 · Días 6 al 10", M, y);
  y += 24;

  const groups: [string, string[]][] = [
    [
      "RESTAURANTE (Días 5-6)",
      [
        "Je vais prendre… = Voy a pedir…",
        "L'addition, s'il vous plaît ! = ¡La cuenta, por favor!",
        "Je suis végétarien/ne. = Soy vegetariano/a.",
        "On peut payer séparément ? = ¿Podemos pagar separado?",
        "Qu'est-ce que vous recommandez ? = ¿Qué recomienda?",
      ],
    ],
    [
      "SUPERMERCADO (Días 7-8)",
      [
        "Où se trouve le rayon… ? = ¿Dónde está la sección de…?",
        "Il y a du / de la / des… = Hay…",
        "Il n'y a plus de… = Ya no hay…",
        "Je dois acheter… = Tengo que comprar…",
        "C'est en soldes. = Está en oferta.",
      ],
    ],
    [
      "TRANSPORTE (Días 9-10)",
      [
        "en bus / en métro / en voiture = en bus / en metro / en carro",
        "à vélo / à pied / à moto = en bici / a pie / en moto",
        "par le train / par avion = en tren / en avión",
        "Je prends le… = Tomo el…",
        "Je dois prendre quelle ligne ? = ¿Qué línea debo tomar?",
        "N'oubliez pas de valider. = No olvide validar.",
        "Un aller simple / aller-retour = Solo ida / Ida y vuelta",
      ],
    ],
  ];

  groups.forEach(([title, items]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    setColor(GOLD);
    doc.text(title, M, y);
    y += 6;
    setFill(GOLD);
    doc.rect(M, y, 30, 2, "F");
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    setColor(NAVY);
    items.forEach((it) => {
      const t = doc.splitTextToSize(`• ${it}`, W - 2 * M - 12);
      doc.text(t, M + 8, y);
      y += t.length * 13 + 2;
    });
    y += 10;
  });

  footer();
  return doc;
}
