import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X, Download, Loader2, Send, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  evaluateWeek2Writing,
  chatWeek2Roleplay,
  saveWeek2Result,
  getMyWeek2Result,
} from "@/lib/defiSemaine2.functions";
import { getCompletedDays } from "@/lib/week.functions";
import { generateWeek2Pdf } from "@/lib/week2Pdf";

export const Route = createFileRoute("/defi-semaine2")({
  head: () => ({
    meta: [
      { title: "Défi Final · Semaine 2 · Liberté" },
      {
        name: "description",
        content:
          "Evaluación gamificada de la Semana 2 del programa Liberté: 100 puntos, quiz, vocabulario, escritura y roleplay con Coach IA.",
      },
    ],
  }),
  component: DefiSemaine2Page,
});

/* ============ CONTENT ============ */

type QuizQ = {
  id: number;
  topic: "futur_proche" | "il_y_a" | "devoir" | "en_a_par" | "integracion";
  q: string;
  options: string[];
  correct: number;
  ok: string;
  ko: string;
};

const QUIZ: QuizQ[] = [
  // BLOQUE 1 — FUTUR PROCHE (Q1-Q4)
  {
    id: 1,
    topic: "futur_proche",
    q: "Traduce al francés: «Ella va a pedir el pollo.»",
    options: [
      "Elle va prende le poulet.",
      "Elle va prendre le poulet.",
      "Elle aller prendre le poulet.",
      "Elle allait prendre le poulet.",
    ],
    correct: 1,
    ok: "Parfait ! Futur proche = aller conjugado (VA) + infinitivo (prendre). ¡La estructura es simple y directa!",
    ko: "Recuerda: futur proche = sujeto + conjugación de ALLER + infinitivo. Para ELLE: elle VA + prendre. El infinitivo nunca cambia.",
  },
  {
    id: 2,
    topic: "futur_proche",
    q: "¿Cuál de estas frases NO está en futur proche?",
    options: [
      "Je vais manger une salade.",
      "Tu vas payer par carte.",
      "Il prend le menu.",
      "Nous allons réserver une table.",
    ],
    correct: 2,
    ok: "Excellent ! «Il PREND» = présent de l'indicatif. No hay ALLER antes del infinitivo. Las otras tres sí usan aller + infinitivo.",
    ko: "Futur proche siempre tiene: aller conjugado + infinitivo. Busca la frase donde aller no aparece. «Il prend» = présent, no futur proche.",
  },
  {
    id: 3,
    topic: "futur_proche",
    q: "Completa la pregunta: «¿Qué van a beber?» → _____________",
    options: [
      "Qu'est-ce que vous allez boire ?",
      "Qu'est-ce que vous aller boire ?",
      "Qu'est-ce que vous avez boire ?",
      "Qu'est-ce que vous voulez aller boire ?",
    ],
    correct: 0,
    ok: "Très bien ! La estructura: Qu'est-ce que + sujeto + aller conjugado (ALLEZ) + infinitivo (boire). ¡Directa y natural!",
    ko: "En preguntas con futur proche: Qu'est-ce que + sujeto + ALLEZ + infinitivo. ALLER debe estar conjugado: avec VOUS → allez.",
  },
  {
    id: 4,
    topic: "futur_proche",
    q: "Elige la forma correcta: «Vamos a pagar separado.» (sujeto: ON)",
    options: [
      "On va payer séparément.",
      "On aller payer séparément.",
      "On va payons séparément.",
      "On allons payer séparément.",
    ],
    correct: 0,
    ok: "Super ! ON se conjuga igual que IL/ELLE → ON VA. Nunca «on allons». El segundo verbo siempre va en infinitivo: payer.",
    ko: "Atención: ON se conjuga como IL/ELLE → ON VA (no «on allons»). Y el verbo que sigue siempre es infinitivo: on va PAYER.",
  },
  // BLOQUE 2 — IL Y A (Q5-Q8)
  {
    id: 5,
    topic: "il_y_a",
    q: "¿Qué significa «Il n'y a plus de pain» ?",
    options: [
      "No hay pan todavía.",
      "Ya no hay pan.",
      "Hay demasiado pan.",
      "Nunca hay pan aquí.",
    ],
    correct: 1,
    ok: "Parfait ! PLUS en negación = «ya no». IL N'Y A PLUS DE = ya no hay (antes había, ahora no).",
    ko: "Pista: PLUS en negación expresa que algo que existía dejó de existir. IL N'Y A PLUS DE PAIN = había pan antes, pero ya no queda.",
  },
  {
    id: 6,
    topic: "il_y_a",
    q: "Elige la frase correcta para decir «Hay leche fresca aquí.»",
    options: [
      "Il y a du lait frais ici.",
      "Il y a de lait frais ici.",
      "Il y a le lait frais ici.",
      "Il n'y a pas de lait frais ici.",
    ],
    correct: 0,
    ok: "Excellent ! IL Y A + artículo partitivo (DU) + sustantivo. DU = de + le (contracta).",
    ko: "Después de IL Y A: usar el artículo partitivo. Para sustantivos masculinos: DU (= de + le). «Il y a DU lait».",
  },
  {
    id: 7,
    topic: "il_y_a",
    q: "¿Cómo preguntas de forma natural «¿Hay pan fresco?»",
    options: [
      "Il y a du pain frais ?",
      "Est-ce qu'il a du pain frais ?",
      "Y a-t-il le pain frais ?",
      "Il y a de pain frais ?",
    ],
    correct: 0,
    ok: "Super ! La forma más natural y cotidiana: IL Y A DU PAIN FRAIS ? con entonación ascendente al final.",
    ko: "La pregunta más natural: IL Y A DU PAIN FRAIS ? (entonación ascendente). Y recuerda: partitivo DU, no «le» ni «de».",
  },
  {
    id: 8,
    topic: "il_y_a",
    q: "Elige la negación correcta para decir «No hay queso.»",
    options: [
      "Il n'y a pas de fromage.",
      "Il n'y a pas du fromage.",
      "Il y a pas de fromage.",
      "Il n'y pas de fromage.",
    ],
    correct: 0,
    ok: "Parfait ! Regla de oro: después de PAS, el artículo siempre se convierte en DE. IL N'Y A PAS DE + sustantivo.",
    ko: "Regla de negación: IL N'Y A PAS DE + sustantivo. El artículo desaparece después de «pas» → solo queda DE.",
  },
  // BLOQUE 3 — DEVOIR (Q9-Q12)
  {
    id: 9,
    topic: "devoir",
    q: "¿Cuál es la traducción correcta de «Je dois acheter du lait» ?",
    options: [
      "Quiero comprar leche.",
      "Debo / Tengo que comprar leche.",
      "Voy a comprar leche.",
      "Compro leche regularmente.",
    ],
    correct: 1,
    ok: "Très bien ! DEVOIR + infinitif = tener que / deber. JE DOIS = yo debo / yo tengo que.",
    ko: "DEVOIR expresa obligación. JE DOIS = debo / tengo que. No confundir con JE VOUDRAIS, JE VAIS ni JE PRENDS.",
  },
  {
    id: 10,
    topic: "devoir",
    q: "Completa: «Ella _____ pagar en efectivo.» → Elle _____ payer en espèces.",
    options: [
      "Elle doit payer en espèces.",
      "Elle dois payer en espèces.",
      "Elle devoir payer en espèces.",
      "Elle doit paye en espèces.",
    ],
    correct: 0,
    ok: "Super ! Conjugación de DEVOIR: je dois / tu dois / il·elle DOIT. Siempre seguido de infinitivo: DOIT + PAYER.",
    ko: "Conjugación de DEVOIR: je DOIS · tu DOIS · il/elle DOIT. Para ELLE → DOIT. El segundo verbo siempre en infinitivo.",
  },
  {
    id: 11,
    topic: "devoir",
    q: "¿Cuál de estas frases expresa obligación o necesidad?",
    options: [
      "Je vais aller au supermarché.",
      "Je voudrais du pain.",
      "Je dois acheter des œufs.",
      "Il y a du pain frais.",
    ],
    correct: 2,
    ok: "Excellent ! JE DOIS ACHETER = tengo que comprar. DEVOIR + infinitif = obligación.",
    ko: "Identifica el verbo: JE DOIS = obligación. JE VAIS = futur proche · JE VOUDRAIS = deseo · IL Y A = existencia.",
  },
  {
    id: 12,
    topic: "devoir",
    q: "¿Cómo preguntas «¿Qué necesitas comprar?»",
    options: [
      "Qu'est-ce que tu dois acheter ?",
      "Qu'est-ce que tu devoir acheter ?",
      "Qu'est-ce que tu dois acheté ?",
      "Qu'est-ce que tu as acheter ?",
    ],
    correct: 0,
    ok: "Parfait ! Qu'est-ce que + sujeto + dois + infinitivo. TU DOIS + ACHETER (infinitivo).",
    ko: "Estructura: Qu'est-ce que + sujeto + DOIS (conjugado) + ACHETER (infinitivo). Nunca «tu devoir» ni «acheté».",
  },
  // BLOQUE 4 — EN/À/PAR + PRENDRE (Q13-Q16)
  {
    id: 13,
    topic: "en_a_par",
    q: "¿Cuál es la preposición correcta? «Voy al trabajo _____ métro.»",
    options: ["en métro", "à métro", "par métro", "dans le métro"],
    correct: 0,
    ok: "Super ! EN = vehículo cerrado donde te sientas y te envuelve. Regla de oro: si el transporte es una «caja» → EN.",
    ko: "Regla: EN = vehículo cerrado (bus, métro, voiture, taxi). À se usa cuando vas SOBRE el vehículo (à vélo, à pied).",
  },
  {
    id: 14,
    topic: "en_a_par",
    q: "¿Cómo se dice correctamente «Voy a pie al mercado»?",
    options: [
      "Je vais au marché en pied.",
      "Je vais au marché à pied.",
      "Je vais au marché par pied.",
      "Je vais au marché avec pied.",
    ],
    correct: 1,
    ok: "Excellent ! À PIED = a pie. Nunca EN PIED. El pie es tu cuerpo, no un vehículo cerrado → siempre À PIED.",
    ko: "¡El error clásico! Nunca «en pied». La expresión correcta es siempre À PIED. À = cuerpo o encima del vehículo.",
  },
  {
    id: 15,
    topic: "en_a_par",
    q: "¿Cuál es la conjugación correcta de PRENDRE para NOUS?",
    options: [
      "Nous prends le bus.",
      "Nous prenons le bus.",
      "Nous prennent le bus.",
      "Nous prenez le bus.",
    ],
    correct: 1,
    ok: "Parfait ! PRENDRE: je/tu prends · il/elle prend · NOUS PRENONS · vous prenez · ils/elles prennent.",
    ko: "Conjugación: je prends · tu prends · il prend · NOUS PRENONS · vous prenez · ils prennent.",
  },
  {
    id: 16,
    topic: "en_a_par",
    q: "¿Cómo preguntas correctamente «¿Qué línea debo tomar?»",
    options: [
      "Je dois prendre quelle ligne ?",
      "Quelle ligne je prends dois ?",
      "Dois je quelle ligne prendre ?",
      "Je doit prendre quelle ligne ?",
    ],
    correct: 0,
    ok: "Super ! «Je dois prendre quelle ligne ?» es la forma más natural. También: «Quelle ligne dois-je prendre ?»",
    ko: "Estructura correcta: JE DOIS PRENDRE + quelle ligne (final) o QUELLE LIGNE + dois-je + prendre. Nunca «je doit».",
  },
  // BLOQUE 5 — INTEGRACIÓN (Q17-Q20)
  {
    id: 17,
    topic: "integracion",
    q: "En un restaurante parisino, la forma más correcta de pedir la cuenta:",
    options: [
      "Donnez-moi l'argent maintenant.",
      "Je dois payer, vite.",
      "L'addition, s'il vous plaît !",
      "Combien coûte le repas ?",
    ],
    correct: 2,
    ok: "Parfait ! L'ADDITION, S'IL VOUS PLAÎT = la fórmula estándar, educada y universal en los restaurantes franceses.",
    ko: "En un restaurante francés: L'ADDITION, S'IL VOUS PLAÎT. Las otras opciones suenan brusca, urgente o imprecisa.",
  },
  {
    id: 18,
    topic: "integracion",
    q: "En el supermercado no encuentras los cereales. ¿Qué le preguntas a un empleado?",
    options: [
      "Il n'y a pas de céréales ici ?",
      "Où se trouve le rayon céréales, s'il vous plaît ?",
      "Je dois trouver les céréales.",
      "Vous avez des céréales quelque part ?",
    ],
    correct: 1,
    ok: "Excellent ! OÙ SE TROUVE LE RAYON [producto] = la pregunta estándar para pedir una sección en el supermercado.",
    ko: "Para pedir dónde está una sección: OÙ SE TROUVE LE RAYON [producto] ? Es más preciso que preguntar si hay o no hay.",
  },
  {
    id: 19,
    topic: "integracion",
    q: "Elige la traducción correcta: «Tengo que tomar el metro para llegar a tiempo.»",
    options: [
      "Je dois prendre le métro pour arriver à l'heure.",
      "Je dois prend le métro pour aller à l'heure.",
      "Il faut je prendre le métro pour arriver.",
      "Je vais prendre le métro pour dois arriver à l'heure.",
    ],
    correct: 0,
    ok: "Super ! Tres estructuras en una: DEVOIR + PRENDRE (infinitivo) + POUR + infinitif + expression de temps.",
    ko: "Combina: JE DOIS + PRENDRE (infinitivo) + POUR ARRIVER (propósito) + À L'HEURE. Nunca «il faut je prendre».",
  },
  {
    id: 20,
    topic: "integracion",
    q: "¿Cuál expresa correctamente «Ya no hay tickets disponibles»?",
    options: [
      "Il y a plus de tickets.",
      "Il n'y a plus de tickets disponibles.",
      "Il n'y a jamais de tickets.",
      "Il y a des tickets pas disponibles.",
    ],
    correct: 1,
    ok: "Parfait ! IL N'Y A PLUS DE = ya no hay. La estructura: IL + N'Y + A + PLUS + DE + sustantivo.",
    ko: "IL N'Y A PLUS DE = ya no hay. «Il y a plus» sin negación suena a «hay más». JAMAIS = nunca (≠ PLUS = ya no).",
  },
];

type VocabQ = { id: number; q: string; options: string[]; correct: number; ok: string; ko: string };

const VOCAB: VocabQ[] = [
  {
    id: 1,
    q: "En el restaurante dices: «Je suis végétarienne.» ¿Qué comunicas?",
    options: [
      "Que vas a pedir el menú vegetariano.",
      "Que tienes una restricción alimentaria (no comes carne).",
      "Que solo quieres verduras como guarnición.",
      "Que vas a cocinar un plato vegetariano.",
    ],
    correct: 1,
    ok: "Exacto. «Je suis végétarienne/végétarien» informa al mesero de tu restricción alimentaria.",
    ko: "VÉGÉTARIEN/VÉGÉTARIENNE = persona que no come carne. En un restaurante, informas tu restricción alimentaria.",
  },
  {
    id: 2,
    q: "En el supermercado escuchas: «Où se trouve le rayon fromages ?»",
    options: [
      "Alguien está ofreciendo queso gratis.",
      "Alguien está preguntando dónde está la sección de quesos.",
      "Alguien pregunta si hay queso fresco.",
      "Un empleado anuncia que no hay queso.",
    ],
    correct: 1,
    ok: "Bien ! OÙ SE TROUVE = ¿dónde se encuentra? LE RAYON = la sección/pasillo del supermercado.",
    ko: "OÙ SE TROUVE = ¿dónde está? · LE RAYON = la sección del supermercado.",
  },
  {
    id: 3,
    q: "¿Cuál de estas palabras NO es un artículo partitivo?",
    options: ["du", "de la", "des", "un"],
    correct: 3,
    ok: "Exact ! UN/UNE = artículo indefinido. Los partitivos son DU / DE LA / DES / DE L'.",
    ko: "Los partitivos: DU (masc.) · DE LA (fem.) · DES (plural) · DE L' (vocal). UN/UNE = indefinido.",
  },
  {
    id: 4,
    q: "En el metro escuchas: «N'oubliez pas de valider votre ticket.» ¿Qué deben hacer?",
    options: [
      "Comprar un ticket nuevo.",
      "Guardar el ticket para revisión.",
      "Picar/validar el ticket antes de subir.",
      "Buscar al inspector de tickets.",
    ],
    correct: 2,
    ok: "Parfait ! VALIDER = validar/picar el ticket. Siempre debes pasar el ticket por la máquina lectora.",
    ko: "VALIDER = pasar el ticket por la máquina lectora. N'OUBLIEZ PAS = no olviden.",
  },
  {
    id: 5,
    q: "En el restaurante dices: «On peut payer séparément ?» ¿Qué pides?",
    options: [
      "Pagar en efectivo.",
      "Un descuento en la cuenta.",
      "Que te traigan la cuenta antes.",
      "Pagar cada uno por separado.",
    ],
    correct: 3,
    ok: "Super ! PAYER SÉPARÉMENT = pagar por separado. ON PEUT = ¿podemos?",
    ko: "SÉPARÉMENT = por separado. PAYER SÉPARÉMENT = que cada persona pague su parte.",
  },
  {
    id: 6,
    q: "Ves un cartel: «C'EST EN SOLDES». ¿Qué significa?",
    options: [
      "El producto es el último que queda.",
      "El producto está agotado.",
      "El producto está en oferta / tiene precio rebajado.",
      "El producto acaba de llegar.",
    ],
    correct: 2,
    ok: "Exact ! EN SOLDES = en rebajas / en oferta. También verás: PROMOTION, -20%, PRIX RÉDUIT.",
    ko: "SOLDES = rebajas / saldos. C'EST EN SOLDES = está rebajado / en oferta.",
  },
  {
    id: 7,
    q: "En la ventanilla del tren: «Un aller simple pour Paris, s'il vous plaît.» ¿Qué pediste?",
    options: [
      "Un viaje de ida y vuelta a París.",
      "Un boleto solo de ida a París.",
      "Una reserva de asiento para París.",
      "Información sobre los trenes a París.",
    ],
    correct: 1,
    ok: "Parfait ! ALLER SIMPLE = solo ida. Su opuesto: ALLER-RETOUR = ida y vuelta.",
    ko: "ALLER SIMPLE = solo ida. ALLER-RETOUR = ida y vuelta.",
  },
  {
    id: 8,
    q: "Escuchas en el metro: «Direction Montrouge, ligne 4.» ¿Qué información te da?",
    options: [
      "La próxima parada es Montrouge.",
      "El metro va en dirección opuesta a Montrouge.",
      "La línea 4 va hacia el sur (hacia Montrouge).",
      "El tren finaliza su recorrido en la siguiente parada.",
    ],
    correct: 2,
    ok: "Bien ! DIRECTION = el destino final del tren. Cada línea tiene dos DIRECTIONS (los dos extremos).",
    ko: "DIRECTION = destino final del tren. Te dice si el tren va hacia donde tú quieres.",
  },
  {
    id: 9,
    q: "Un cliente dice: «Je vais prendre le poulet rôti.» ¿Qué hace?",
    options: [
      "Preguntando el precio del pollo.",
      "Pidiendo que le quiten el pollo del plato.",
      "Eligiendo el pollo asado como su plato.",
      "Preguntando si el pollo es fresco.",
    ],
    correct: 2,
    ok: "Super ! JE VAIS PRENDRE = voy a tomar/pedir (futur proche).",
    ko: "JE VAIS PRENDRE = voy a pedir. Es el futur proche de PRENDRE en el restaurante.",
  },
  {
    id: 10,
    q: "¿Cuál pide una recomendación en el restaurante?",
    options: [
      "L'addition, s'il vous plaît.",
      "Je voudrais réserver une table.",
      "Qu'est-ce que vous recommandez ?",
      "C'est combien le plat du jour ?",
    ],
    correct: 2,
    ok: "Parfait ! QU'EST-CE QUE VOUS RECOMMANDEZ = ¿qué recomienda usted? Perfecta cuando no sabes qué pedir.",
    ko: "Para pedir recomendación: QU'EST-CE QUE VOUS RECOMMANDEZ ? Las otras piden cuenta, reserva o precio.",
  },
];

const WRITING1_CRITERIA = [
  "Usa futur proche correctamente al menos 2 veces",
  "Vocabulario apropiado de restaurante",
  "Diálogo con al menos 8 intercambios",
  "Menciona restricción alimentaria correctamente",
  "Pide la cuenta con la fórmula correcta",
  "Ortografía y gramática básica",
];
const WRITING2_CRITERIA = [
  "Preposiciones EN/À/PAR correctas en contexto",
  "Verbo PRENDRE usado correctamente 2+ veces",
  "DEVOIR + infinitif correcto",
  "Duración del viaje mencionada correctamente",
  "Coherencia y fluidez del texto",
];

const ROLE_OBJECTIVES = [
  "Saluda y pregunta dónde está la sección de lácteos (rayon produits laitiers)",
  "Usa IL Y A o IL N'Y A PAS DE al menos 1 vez",
  "Usa DEVOIR + infinitif para mencionar lo que necesitas comprar",
  "Pregunta el precio de al menos un producto",
  "Se despide y agradece",
];

/* ============ UI TOKENS ============ */

const NAVY = "#0F1B3C";
const WINE = "#6B2340";
const BLUE = "#4BB1EC";
const GOLD = "#C9A84C";
const MINT = "#2A7F6F";

/* ============ PAGE ============ */

type Stage = "welcome" | "quiz" | "vocab" | "writing" | "roleplay" | "results";

function DefiSemaine2Page() {
  const { user, profile, fullName, loading: authLoading, isAdmin } = useAuth();
  const [stage, setStage] = useState<Stage>("welcome");
  const [unlocked, setUnlocked] = useState(false);

  // Quiz + vocab state
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(Array(QUIZ.length).fill(null));
  const [quizRevealed, setQuizRevealed] = useState(false);

  const [vocabIdx, setVocabIdx] = useState(0);
  const [vocabAnswers, setVocabAnswers] = useState<(number | null)[]>(
    Array(VOCAB.length).fill(null),
  );
  const [vocabRevealed, setVocabRevealed] = useState(false);

  // Writing state
  const [w1, setW1] = useState("");
  const [w2, setW2] = useState("");
  const [w1Result, setW1Result] = useState<null | {
    score_15: number;
    checklist: { criterio: string; cumplido: boolean }[];
    feedback: string;
  }>(null);
  const [w2Result, setW2Result] = useState<null | {
    score_15: number;
    checklist: { criterio: string; cumplido: boolean }[];
    feedback: string;
  }>(null);
  const [wLoading, setWLoading] = useState<null | 1 | 2>(null);

  // Roleplay state
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Bonjour ! Bienvenue au Carrefour ! Je peux vous aider ?" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatObjectives, setChatObjectives] = useState<{ id: number; done: boolean }[]>(
    [1, 2, 3, 4, 5].map((id) => ({ id, done: false })),
  );
  const [chatFinalScore, setChatFinalScore] = useState<number | null>(null);
  const [chatFinalFeedback, setChatFinalFeedback] = useState<string>("");
  const [chatLoading, setChatLoading] = useState(false);

  // Save state
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Section scores restored from an already-completed evaluation (the AI
  // checklists behind writing/roleplay scores aren't re-derivable from the
  // saved responses alone).
  const [restored, setRestored] = useState<{ writing: number; roleplay: number } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const studentName =
    (profile?.full_name && profile.full_name.trim()) || fullName || user?.email || "Alumno";

  /* ------ hydrate: resume a finished result, or in-progress state ------ */
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setHydrated(true);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const [done, completedDays] = await Promise.all([
          getMyWeek2Result(),
          getCompletedDays().catch(() => [] as number[]),
        ]);
        if (!alive) return;
        // Same gate as the week-1 défi: finish the last day of the week first.
        setUnlocked(isAdmin || Boolean(done) || completedDays.includes(10));
        if (done) {
          const resp = (done.responses ?? {}) as Record<string, unknown>;
          if (Array.isArray(resp.quiz)) setQuizAnswers(resp.quiz as (number | null)[]);
          if (Array.isArray(resp.vocab)) setVocabAnswers(resp.vocab as (number | null)[]);
          if (typeof resp.writing1 === "string") setW1(resp.writing1);
          if (typeof resp.writing2 === "string") setW2(resp.writing2);
          if (Array.isArray(resp.chat)) {
            setChat(resp.chat as { role: "user" | "assistant"; content: string }[]);
          }
          const ts = (done.test_scores ?? {}) as Record<string, unknown>;
          setRestored({
            writing: Number(ts.writing ?? 0),
            roleplay: Number(ts.roleplay ?? 0),
          });
          setSaved(true);
          setStage("results");
          return;
        }
        const { data } = await supabase
          .from("week_state")
          .select("state")
          .eq("user_id", user.id)
          .eq("week_number", 2)
          .maybeSingle();
        if (!alive) return;
        const s = (data?.state ?? null) as Record<string, unknown> | null;
        if (s && typeof s === "object") {
          const stages: Stage[] = ["welcome", "quiz", "vocab", "writing", "roleplay"];
          if (typeof s.stage === "string" && stages.includes(s.stage as Stage)) {
            setStage(s.stage as Stage);
          }
          if (typeof s.quizIdx === "number") setQuizIdx(s.quizIdx);
          if (Array.isArray(s.quizAnswers)) setQuizAnswers(s.quizAnswers as (number | null)[]);
          if (typeof s.quizRevealed === "boolean") setQuizRevealed(s.quizRevealed);
          if (typeof s.vocabIdx === "number") setVocabIdx(s.vocabIdx);
          if (Array.isArray(s.vocabAnswers)) setVocabAnswers(s.vocabAnswers as (number | null)[]);
          if (typeof s.vocabRevealed === "boolean") setVocabRevealed(s.vocabRevealed);
          if (typeof s.w1 === "string") setW1(s.w1);
          if (typeof s.w2 === "string") setW2(s.w2);
          if (s.w1Result && typeof s.w1Result === "object") {
            setW1Result(s.w1Result as NonNullable<typeof w1Result>);
          }
          if (s.w2Result && typeof s.w2Result === "object") {
            setW2Result(s.w2Result as NonNullable<typeof w2Result>);
          }
          if (Array.isArray(s.chat) && s.chat.length > 0) {
            setChat(s.chat as { role: "user" | "assistant"; content: string }[]);
          }
          if (Array.isArray(s.chatObjectives)) {
            setChatObjectives(s.chatObjectives as { id: number; done: boolean }[]);
          }
          if (typeof s.chatFinalScore === "number") setChatFinalScore(s.chatFinalScore);
          if (typeof s.chatFinalFeedback === "string") setChatFinalFeedback(s.chatFinalFeedback);
        }
      } catch {
        // Table may not exist yet or the fetch failed — start fresh.
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  /* ------ autosave in-progress state (debounced) ------ */
  const stateRef = useRef<Record<string, unknown>>({});
  stateRef.current = {
    stage,
    quizIdx,
    quizAnswers,
    quizRevealed,
    vocabIdx,
    vocabAnswers,
    vocabRevealed,
    w1,
    w2,
    w1Result,
    w2Result,
    chat,
    chatObjectives,
    chatFinalScore,
    chatFinalFeedback,
  };
  useEffect(() => {
    if (!hydrated || !user || saved || stage === "results" || stage === "welcome") return;
    const t = setTimeout(() => {
      void supabase
        .from("week_state")
        .upsert(
          { user_id: user.id, week_number: 2, state: stateRef.current as never },
          { onConflict: "user_id,week_number" },
        );
    }, 500);
    return () => clearTimeout(t);
  }, [
    hydrated,
    user,
    saved,
    stage,
    quizIdx,
    quizAnswers,
    quizRevealed,
    vocabIdx,
    vocabAnswers,
    vocabRevealed,
    w1,
    w2,
    w1Result,
    w2Result,
    chat,
    chatObjectives,
    chatFinalScore,
    chatFinalFeedback,
  ]);

  /* ------ scoring ------ */
  const quizScore = useMemo(
    () =>
      QUIZ.reduce(
        (acc, q, i) => acc + (quizAnswers[i] === q.correct ? 2 : 0),
        0,
      ),
    [quizAnswers],
  );
  const vocabScore = useMemo(
    () =>
      VOCAB.reduce(
        (acc, q, i) => acc + (vocabAnswers[i] === q.correct ? 2 : 0),
        0,
      ),
    [vocabAnswers],
  );
  const writingScore = restored
    ? restored.writing
    : (w1Result?.score_15 ?? 0) + (w2Result?.score_15 ?? 0);
  const roleplayScore = restored ? restored.roleplay : (chatFinalScore ?? 0);
  const total = quizScore + vocabScore + writingScore + roleplayScore;

  const byTopic = useMemo(() => {
    const acc: Record<string, { correct: number; total: number }> = {
      futur_proche: { correct: 0, total: 0 },
      il_y_a: { correct: 0, total: 0 },
      devoir: { correct: 0, total: 0 },
      en_a_par: { correct: 0, total: 0 },
      integracion: { correct: 0, total: 0 },
    };
    QUIZ.forEach((q, i) => {
      acc[q.topic].total += 1;
      if (quizAnswers[i] === q.correct) acc[q.topic].correct += 1;
    });
    return acc as {
      futur_proche: { correct: number; total: number };
      il_y_a: { correct: number; total: number };
      devoir: { correct: number; total: number };
      en_a_par: { correct: number; total: number };
      integracion: { correct: number; total: number };
    };
  }, [quizAnswers]);

  /* ------ handlers ------ */
  const submitQuiz = (i: number) => {
    setQuizRevealed(true);
  };
  const nextQuiz = () => {
    if (quizIdx < QUIZ.length - 1) {
      setQuizIdx((v) => v + 1);
      setQuizRevealed(false);
    } else {
      setStage("vocab");
    }
  };
  const nextVocab = () => {
    if (vocabIdx < VOCAB.length - 1) {
      setVocabIdx((v) => v + 1);
      setVocabRevealed(false);
    } else {
      setStage("writing");
    }
  };

  const evalWriting = async (which: 1 | 2) => {
    setWLoading(which);
    try {
      const text = which === 1 ? w1 : w2;
      const out = await evaluateWeek2Writing({ data: { situation: which, text } });
      if (which === 1) setW1Result(out);
      else setW2Result(out);
    } catch (e) {
      alert(`Error evaluando: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setWLoading(null);
    }
  };

  const sendChat = async (finish = false) => {
    const text = chatInput.trim();
    if (!finish && !text) return;
    setChatLoading(true);
    const nextMessages = finish
      ? chat
      : [...chat, { role: "user" as const, content: text }];
    if (!finish) setChat(nextMessages);
    setChatInput("");
    try {
      const out = await chatWeek2Roleplay({
        data: { messages: nextMessages, finish },
      });
      setChatObjectives(out.objectives);
      if (finish) {
        setChatFinalScore(out.score_10);
        setChatFinalFeedback(out.feedback_es || out.reply);
      } else {
        setChat((prev) => [...prev, { role: "assistant", content: out.reply }]);
      }
    } catch (e) {
      alert(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setChatLoading(false);
    }
  };

  const persistResult = async () => {
    setSaveError(null);
    try {
      await saveWeek2Result({
        data: {
          totalScore: total,
          quizScore,
          vocabScore,
          writingScore,
          roleplayScore,
          byTopic,
          responses: {
            quiz: quizAnswers,
            vocab: vocabAnswers,
            writing1: w1,
            writing2: w2,
            chat,
          },
        },
      });
      setSaved(true);
      // The in-progress snapshot is no longer needed once the result is saved.
      if (user) {
        void supabase
          .from("week_state")
          .delete()
          .eq("user_id", user.id)
          .eq("week_number", 2);
      }
    } catch (e) {
      console.error(e);
      setSaveError(e instanceof Error ? e.message : "No se pudo guardar el resultado");
    }
  };

  const finishAll = async () => {
    setStage("results");
    await persistResult();
  };

  const downloadPdf = () => {
    const doc = generateWeek2Pdf({
      studentName,
      date: new Date().toLocaleDateString("es-BO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      totalScore: total,
      quizScore,
      vocabScore,
      writingScore,
      roleplayScore,
      byTopic,
    });
    const name = studentName.replace(/[^\w-]+/g, "_");
    const d = new Date().toISOString().slice(0, 10);
    doc.save(`Liberte_Semana2_Informe_${name}_${d}.pdf`);
  };

  /* ------ render ------ */
  if (!hydrated) {
    return (
      <div style={{ backgroundColor: NAVY }} className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div style={{ backgroundColor: NAVY }} className="flex min-h-screen items-center justify-center px-4 text-white">
        <div className="max-w-lg rounded-3xl border border-white/15 bg-white/5 p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/10 text-2xl">🎉</div>
          <h1 className="mt-4 text-2xl font-black">Le défi de la semaine 2 t'attend</h1>
          <p className="mt-2 text-sm text-white/75">
            Termina el <strong>Défi Final del Día 10</strong> para abrir el desafío de la Semana 2.
          </p>
          <Button asChild className="mt-6 h-11 rounded-xl px-6 font-bold" style={{ backgroundColor: BLUE }}>
            <Link to="/day/$dayId" params={{ dayId: "10" }}>Ir al Día 10</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: NAVY }} className="min-h-screen text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-white/10 backdrop-blur bg-[#0F1B3C]/85">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link
            to="/liberte-plataforma-834798234728482934254-student"
            className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Salir
          </Link>
          <div className="text-xs text-white/70">
            {stage !== "welcome" && stage !== "results" && (
              <>
                {stage === "quiz" && `Pregunta ${quizIdx + 1} de ${QUIZ.length} · Sección: Quiz gramatical`}
                {stage === "vocab" && `Pregunta ${vocabIdx + 1} de ${VOCAB.length} · Sección: Vocabulario`}
                {stage === "writing" && `Sección 3 · Producción escrita`}
                {stage === "roleplay" && `Sección 4 · Roleplay con Coach IA`}
              </>
            )}
          </div>
          <div
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{ backgroundColor: WINE }}
          >
            Puntos: {total} / 100
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {stage === "welcome" && (
          <Welcome onStart={() => setStage("quiz")} />
        )}

        {stage === "quiz" && (
          <QuizCard
            q={QUIZ[quizIdx]}
            index={quizIdx}
            total={QUIZ.length}
            selected={quizAnswers[quizIdx]}
            revealed={quizRevealed}
            onSelect={(opt) => {
              if (quizRevealed) return;
              const next = [...quizAnswers];
              next[quizIdx] = opt;
              setQuizAnswers(next);
              submitQuiz(opt);
            }}
            onNext={nextQuiz}
            score={quizScore}
          />
        )}

        {stage === "vocab" && (
          <QuizCard
            q={VOCAB[vocabIdx] as unknown as QuizQ}
            index={vocabIdx}
            total={VOCAB.length}
            selected={vocabAnswers[vocabIdx]}
            revealed={vocabRevealed}
            onSelect={(opt) => {
              if (vocabRevealed) return;
              const next = [...vocabAnswers];
              next[vocabIdx] = opt;
              setVocabAnswers(next);
              setVocabRevealed(true);
            }}
            onNext={nextVocab}
            score={vocabScore}
          />
        )}

        {stage === "writing" && (
          <WritingStage
            w1={w1}
            w2={w2}
            setW1={setW1}
            setW2={setW2}
            w1Result={w1Result}
            w2Result={w2Result}
            loading={wLoading}
            onEvalW1={() => evalWriting(1)}
            onEvalW2={() => evalWriting(2)}
            onNext={() => setStage("roleplay")}
          />
        )}

        {stage === "roleplay" && (
          <RoleplayStage
            chat={chat}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSend={() => sendChat(false)}
            onFinish={() => sendChat(true)}
            objectives={chatObjectives}
            loading={chatLoading}
            finalScore={chatFinalScore}
            finalFeedback={chatFinalFeedback}
            onNext={finishAll}
          />
        )}

        {stage === "results" && (
          <Results
            total={total}
            quiz={quizScore}
            vocab={vocabScore}
            writing={writingScore}
            role={roleplayScore}
            saved={saved}
            saveError={saveError}
            onRetrySave={persistResult}
            onDownload={downloadPdf}
          />
        )}
      </main>
    </div>
  );
}

/* ============ SUBCOMPONENTS ============ */

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <section className="text-center">
      <h1 className="text-4xl md:text-5xl font-black leading-tight">DÉFI FINAL — SEMAINE 2</h1>
      <p className="mt-3 text-lg italic" style={{ color: BLUE }}>
        Días 6 al 10 · Restaurante · Supermercado · Transporte
      </p>
      <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-white/90">
        ¡Llegaste al final de la Semana 2! Este desafío evaluará todo lo que aprendiste en los
        últimos 5 días. Tienes <b>100 puntos posibles</b>. Al terminar, recibirás tu informe
        personal de la semana.
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Pill color={WINE}>Futur proche</Pill>
        <Pill color={BLUE}>Il y a / Il n'y a pas de</Pill>
        <Pill color={GOLD}>Devoir + infinitif</Pill>
        <Pill color={MINT}>EN / À / PAR + Prendre</Pill>
      </div>
      <Button
        size="lg"
        onClick={onStart}
        className="mt-8 h-14 rounded-xl px-8 text-base font-bold"
        style={{ backgroundColor: WINE }}
      >
        Comenzar mi Défi <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </section>
  );
}

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="rounded-full px-4 py-1.5 text-sm font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {children}
    </span>
  );
}

function QuizCard(props: {
  q: QuizQ;
  index: number;
  total: number;
  selected: number | null;
  revealed: boolean;
  onSelect: (i: number) => void;
  onNext: () => void;
  score: number;
}) {
  const { q, index, total, selected, revealed, onSelect, onNext } = props;
  return (
    <section>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{
            width: `${((index + (revealed ? 1 : 0)) / total) * 100}%`,
            backgroundColor: GOLD,
          }}
        />
      </div>
      <div className="rounded-2xl bg-white p-6 text-[#111] shadow-lg">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B2340]">
          Pregunta {index + 1} · 2 pts
        </div>
        <h2 className="text-xl font-bold text-[#0F1B3C]">{q.q}</h2>
        <div className="mt-5 space-y-2">
          {q.options.map((opt, i) => {
            const isSel = selected === i;
            const isCorrect = revealed && i === q.correct;
            const isWrong = revealed && isSel && i !== q.correct;
            return (
              <button
                key={i}
                onClick={() => onSelect(i)}
                disabled={revealed}
                className="w-full rounded-xl border-2 px-4 py-3 text-left text-[15px] transition"
                style={{
                  borderColor: isCorrect
                    ? "#2D7A4A"
                    : isWrong
                      ? "#8B1A1A"
                      : isSel
                        ? BLUE
                        : "#E5E7EB",
                  backgroundColor: isCorrect
                    ? "#D4EDDA"
                    : isWrong
                      ? "#FBDADA"
                      : isSel
                        ? "#EFF7FE"
                        : "white",
                }}
              >
                <span className="mr-2 font-bold">{String.fromCharCode(65 + i)})</span>
                {opt}
                {isCorrect && <Check className="ml-2 inline h-4 w-4 text-[#2D7A4A]" />}
                {isWrong && <X className="ml-2 inline h-4 w-4 text-[#8B1A1A]" />}
              </button>
            );
          })}
        </div>
        {revealed && (
          <div
            className="mt-5 rounded-xl px-4 py-3 text-sm"
            style={{
              backgroundColor: selected === q.correct ? "#D4EDDA" : "#FBDADA",
              color: selected === q.correct ? "#2D7A4A" : "#8B1A1A",
            }}
          >
            {selected === q.correct ? q.ok : q.ko}
          </div>
        )}
        {revealed && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={onNext}
              className="h-11 rounded-xl px-6 font-bold"
              style={{ backgroundColor: WINE, color: "white" }}
            >
              {index + 1 === total ? "Continuar" : "Siguiente pregunta"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function WritingStage(props: {
  w1: string;
  w2: string;
  setW1: (v: string) => void;
  setW2: (v: string) => void;
  w1Result: { score_15: number; checklist: { criterio: string; cumplido: boolean }[]; feedback: string } | null;
  w2Result: { score_15: number; checklist: { criterio: string; cumplido: boolean }[]; feedback: string } | null;
  loading: null | 1 | 2;
  onEvalW1: () => void;
  onEvalW2: () => void;
  onNext: () => void;
}) {
  const canContinue = props.w1Result && props.w2Result;
  return (
    <section className="space-y-8">
      <div className="rounded-2xl bg-white p-6 text-[#111] shadow-lg">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#6B2340]">
          Situación 1 · 15 pts
        </div>
        <h2 className="mt-1 text-xl font-bold text-[#0F1B3C]">En el restaurante Le Petit Marais</h2>
        <p className="mt-2 text-sm text-slate-700">
          Escribe un diálogo completo entre tú (C = Cliente) y el mesero (M = Mesero). Al menos <b>8 intercambios</b>. Debe incluir los 4 elementos:
        </p>
        <ul className="mt-2 list-disc pl-6 text-sm text-slate-700 space-y-1">
          <li>Pedir mesa para 2 usando <i>RÉSERVER</i> o <i>VOUDRAIS</i></li>
          <li>Pedir bebida Y plato principal usando <i>FUTUR PROCHE</i> (je vais prendre…)</li>
          <li>Mencionar una restricción alimentaria (<i>je suis végétarien/ne</i>, <i>sans…</i>)</li>
          <li>Pedir la cuenta al final</li>
        </ul>
        <textarea
          value={props.w1}
          onChange={(e) => props.setW1(e.target.value)}
          rows={9}
          placeholder="M: Bonsoir, bienvenue au Petit Marais ! …"
          className="mt-3 w-full rounded-lg border border-slate-300 p-3 text-sm"
        />
        <details className="mt-2 text-xs text-slate-600">
          <summary className="cursor-pointer font-semibold">Criterios de evaluación</summary>
          <ul className="mt-1 list-disc pl-5">
            {WRITING1_CRITERIA.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </details>
        {!props.w1Result ? (
          <Button
            disabled={props.loading === 1 || props.w1.trim().length < 30}
            onClick={props.onEvalW1}
            className="mt-4 h-11 rounded-xl px-5 font-bold"
            style={{ backgroundColor: WINE, color: "white" }}
          >
            {props.loading === 1 ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluando…
              </>
            ) : (
              "Enviar situación 1"
            )}
          </Button>
        ) : (
          <FeedbackBlock r={props.w1Result} />
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 text-[#111] shadow-lg">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#6B2340]">
          Situación 2 · 15 pts
        </div>
        <h2 className="mt-1 text-xl font-bold text-[#0F1B3C]">Mi ruta de transporte</h2>
        <p className="mt-2 text-sm text-slate-700">
          Describe cómo llegas desde tu casa a tu lugar favorito. <b>Mínimo 6 oraciones</b>. Incluye:
        </p>
        <ul className="mt-2 list-disc pl-6 text-sm text-slate-700 space-y-1">
          <li>Al menos 2 transportes diferentes con sus preposiciones (EN/À/PAR)</li>
          <li>El verbo <i>PRENDRE</i> correctamente conjugado al menos 2 veces</li>
          <li><i>DEVOIR + infinitif</i> al menos 1 vez</li>
          <li>La duración aproximada del viaje (à X minutes / à X heures)</li>
        </ul>
        <textarea
          value={props.w2}
          onChange={(e) => props.setW2(e.target.value)}
          rows={7}
          placeholder="Pour aller à…, je dois d'abord…"
          className="mt-3 w-full rounded-lg border border-slate-300 p-3 text-sm"
        />
        <details className="mt-2 text-xs text-slate-600">
          <summary className="cursor-pointer font-semibold">Criterios de evaluación</summary>
          <ul className="mt-1 list-disc pl-5">
            {WRITING2_CRITERIA.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </details>
        {!props.w2Result ? (
          <Button
            disabled={props.loading === 2 || props.w2.trim().length < 30}
            onClick={props.onEvalW2}
            className="mt-4 h-11 rounded-xl px-5 font-bold"
            style={{ backgroundColor: WINE, color: "white" }}
          >
            {props.loading === 2 ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluando…
              </>
            ) : (
              "Enviar situación 2"
            )}
          </Button>
        ) : (
          <FeedbackBlock r={props.w2Result} />
        )}
      </div>

      {canContinue && (
        <div className="text-right">
          <Button
            onClick={props.onNext}
            className="h-12 rounded-xl px-6 font-bold"
            style={{ backgroundColor: WINE, color: "white" }}
          >
            Continuar al roleplay <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </section>
  );
}

function FeedbackBlock({
  r,
}: {
  r: { score_15: number; checklist: { criterio: string; cumplido: boolean }[]; feedback: string };
}) {
  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-slate-800">
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-semibold text-emerald-800">Feedback del Coach IA</div>
        <div className="text-lg font-black text-emerald-900">{r.score_15} / 15</div>
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {r.checklist.map((c, i) => (
          <li key={i} className="flex items-start gap-2">
            {c.cumplido ? (
              <Check className="mt-0.5 h-4 w-4 text-emerald-700" />
            ) : (
              <X className="mt-0.5 h-4 w-4 text-rose-700" />
            )}
            <span>{c.criterio}</span>
          </li>
        ))}
      </ul>
      {r.feedback && <p className="mt-3 text-sm italic">{r.feedback}</p>}
    </div>
  );
}

function RoleplayStage(props: {
  chat: { role: "user" | "assistant"; content: string }[];
  chatInput: string;
  setChatInput: (v: string) => void;
  onSend: () => void;
  onFinish: () => void;
  objectives: { id: number; done: boolean }[];
  loading: boolean;
  finalScore: number | null;
  finalFeedback: string;
  onNext: () => void;
}) {
  return (
    <section className="grid gap-6 md:grid-cols-[1fr,260px]">
      <div className="rounded-2xl bg-white p-4 text-[#111] shadow-lg">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6B2340]">
          Carrefour · Roleplay con Coach IA
        </div>
        <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">
          {props.chat.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[85%] rounded-2xl px-3 py-2 text-sm"
                style={{
                  backgroundColor: m.role === "user" ? BLUE : "white",
                  color: m.role === "user" ? "white" : "#111",
                  border: m.role === "assistant" ? "1px solid #e5e7eb" : "none",
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {props.loading && (
            <div className="text-sm text-slate-500">
              <Loader2 className="inline h-4 w-4 animate-spin" /> Le coach écrit…
            </div>
          )}
        </div>
        {props.finalScore === null ? (
          <div className="mt-3 flex gap-2">
            <Input
              value={props.chatInput}
              onChange={(e) => props.setChatInput(e.target.value)}
              placeholder="Écris en français…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  props.onSend();
                }
              }}
              disabled={props.loading}
              className="flex-1"
            />
            <Button
              onClick={props.onSend}
              disabled={props.loading || !props.chatInput.trim()}
              style={{ backgroundColor: BLUE, color: "white" }}
              className="h-10 rounded-xl px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-slate-800">
            <div className="flex items-baseline justify-between">
              <div className="font-semibold text-emerald-800">Balance del roleplay</div>
              <div className="text-lg font-black text-emerald-900">
                {props.finalScore} / 10
              </div>
            </div>
            {props.finalFeedback && <p className="mt-2 text-sm italic">{props.finalFeedback}</p>}
          </div>
        )}
        <div className="mt-3 flex justify-between">
          {props.finalScore === null ? (
            <Button
              variant="outline"
              onClick={props.onFinish}
              disabled={props.loading}
              className="h-10 rounded-xl border-slate-300 px-4 text-slate-700"
            >
              Terminar roleplay
            </Button>
          ) : (
            <Button
              onClick={props.onNext}
              className="ml-auto h-11 rounded-xl px-6 font-bold"
              style={{ backgroundColor: WINE, color: "white" }}
            >
              Ver mis resultados <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <aside className="rounded-2xl bg-white/5 p-4 text-sm text-white">
        <div className="mb-2 font-bold text-white">Objetivos</div>
        <ul className="space-y-2">
          {ROLE_OBJECTIVES.map((o, i) => {
            const done = props.objectives[i]?.done;
            return (
              <li key={i} className="flex items-start gap-2">
                <span
                  className="mt-0.5 grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold"
                  style={{
                    backgroundColor: done ? MINT : "rgba(255,255,255,0.15)",
                    color: done ? "white" : "rgba(255,255,255,0.7)",
                  }}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="text-white/85">{o}</span>
              </li>
            );
          })}
        </ul>
        <details className="mt-4 text-xs text-white/70">
          <summary className="cursor-pointer font-semibold text-white/90">Vocabulario útil</summary>
          <ul className="mt-2 space-y-1">
            <li>Où se trouve le rayon [producto] ?</li>
            <li>Il y a du/de la/des… ?</li>
            <li>Je dois acheter…</li>
            <li>C'est combien ?</li>
            <li>Merci beaucoup, bonne journée !</li>
          </ul>
        </details>
      </aside>
    </section>
  );
}

function Results(props: {
  total: number;
  quiz: number;
  vocab: number;
  writing: number;
  role: number;
  saved: boolean;
  saveError: string | null;
  onRetrySave: () => void;
  onDownload: () => void;
}) {
  const { total } = props;
  const tier =
    total >= 90
      ? { color: GOLD, label: "EXCELLENCE — Niveau B1 en camino", pct: 100 }
      : total >= 75
        ? { color: BLUE, label: "TRÈS BIEN — ¡Sólida base!", pct: 75 }
        : total >= 60
          ? { color: MINT, label: "BIEN — Sigue practicando", pct: 50 }
          : { color: WINE, label: "COURAGE — Revisa los días de la semana", pct: 33 };
  return (
    <section className="text-center">
      <Trophy className="mx-auto h-12 w-12" style={{ color: GOLD }} />
      <h1 className="mt-3 text-4xl md:text-5xl font-black">FÉLICITATIONS !</h1>
      <p className="mt-2 text-lg italic" style={{ color: BLUE }}>
        Has completado el Défi Final de la Semana 2
      </p>
      <div className="mt-6 text-7xl font-black" style={{ color: GOLD }}>
        {total}
        <span className="ml-1 text-2xl font-bold text-white/70">/ 100</span>
      </div>

      <div className="mx-auto mt-4 h-3 max-w-md overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${tier.pct}%`, backgroundColor: tier.color }}
        />
      </div>
      <div className="mt-2 font-semibold" style={{ color: tier.color }}>
        {tier.label}
      </div>

      <div className="mx-auto mt-8 max-w-md space-y-3 text-left">
        <SectionBar label="Quiz Gramatical" value={props.quiz} max={40} color={WINE} />
        <SectionBar label="Vocabulario" value={props.vocab} max={20} color={BLUE} />
        <SectionBar label="Producción Escrita" value={props.writing} max={30} color={GOLD} />
        <SectionBar label="Roleplay" value={props.role} max={10} color={MINT} />
      </div>

      <Button
        onClick={props.onDownload}
        className="mt-8 h-14 rounded-xl px-8 text-base font-bold"
        style={{ backgroundColor: WINE }}
      >
        <Download className="mr-2 h-5 w-5" /> Descargar mi informe PDF
      </Button>
      {props.saved && (
        <p className="mt-3 text-xs text-white/60">
          Tu resultado quedó guardado. Puedes volver a descargar el informe cuando quieras.
        </p>
      )}
      {!props.saved && (
        <div
          className="mx-auto mt-4 max-w-md rounded-xl border p-3 text-sm"
          style={{ borderColor: GOLD, backgroundColor: "rgba(201,168,76,0.12)" }}
        >
          <p className="font-semibold" style={{ color: GOLD }}>
            ⚠️ Tu resultado aún no se guardó{props.saveError ? `: ${props.saveError}` : "."}
          </p>
          <Button
            onClick={props.onRetrySave}
            variant="outline"
            className="mt-2 h-9 rounded-lg border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            Reintentar guardado
          </Button>
        </div>
      )}
    </section>
  );
}

function SectionBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-white/85">{label}</span>
        <span className="font-bold text-white">
          {value} / {max}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
