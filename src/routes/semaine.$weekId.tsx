import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, Loader2, Mic, PartyPopper, Square, Volume2, Download, AlertCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { persist } from "@/lib/persist";
import { evaluateWeek, getCompletedDays, transcribeAudio, markWeeklyPdfGenerated, getMyWeeklyEvaluation } from "@/lib/week.functions";
import { generateWeeklyPdf, type WeeklyReportData } from "@/lib/weekPdf";
import { speakFr, stopFr } from "@/lib/speak";
import { TopNav } from "@/components/TopNav";

export const Route = createFileRoute("/semaine/$weekId")({
  head: ({ params }) => ({
    meta: [
      { title: `Le défi de la semaine ${params.weekId} · Liberté` },
      { name: "description", content: "Le défi de la semaine — celebración y balance del programa Liberté." },
    ],
  }),
  component: WeekPage,
});

/* ================= Content: Semaine 1 — 3 variantes ================= */

type Variant = {
  co: { audio: string; question: string; options: string[]; correct: number }[];
  ce: { text: string; items: { question: string; options: string[]; correct: number }[] };
  pe: { prompt: string }[];
  po: { prompt: string; expected?: string }[];
};

/** Month label for a week (4 weeks per month) — weeks 5-8 are month 2, so the
 *  page and the student PDF must not keep saying "Mois 1 : J'OSE". */
const MONTH_THEMES = ["J'OSE 🗼", "JE COMPRENDS 📞", "JE CRÉE ✍️", "JE PARLE 🗣️", "JE VOYAGE ✈️", "JE SUIS LIBRE 🕊️"];
function monthLabelForWeek(weekNumber: number): string {
  const m = Math.max(1, Math.ceil(weekNumber / 4));
  return `Mois ${m} : ${MONTH_THEMES[m - 1] ?? ""}`.trim();
}

const VARIANTS: Variant[] = [
  {
    co: [
      { audio: "Bonjour, vous désirez ? — Je voudrais un café au lait et deux croissants, s'il vous plaît.", question: "¿Qué pide el cliente?", options: ["un té y una tarta", "un café con leche y 2 croissants", "dos cafés"], correct: 1 },
      { audio: "Sur place ou à emporter ?", question: "¿Qué pregunta el camarero?", options: ["si paga con tarjeta", "para aquí o para llevar", "si quiere azúcar"], correct: 1 },
      { audio: "Alors, ça fait sept euros cinquante.", question: "¿Cuánto debe pagar?", options: ["6,50 €", "7,50 €", "17 €"], correct: 1 },
    ],
    ce: {
      text: "MENU DU JOUR — 15 € : une entrée + un plat + un dessert. Les boissons ne sont pas comprises. Supplément fromage : 2 €. Fait maison !",
      items: [
        { question: "¿Qué incluye el menú?", options: ["entrada + plato + postre", "solo plato", "plato + bebida"], correct: 0 },
        { question: "¿Las bebidas están incluidas?", options: ["no", "sí", "solo el agua"], correct: 0 },
        { question: "¿Cuánto cuesta el suplemento de queso?", options: ["2 €", "15 €", "es gratis"], correct: 0 },
      ],
    },
    pe: [
      { prompt: "Escribe tu pedido completo con cortesía: una bebida + una comida + « s'il vous plaît »." },
      { prompt: "Haz esta frase más cortés en francés: « Je veux un thé. »" },
    ],
    po: [
      { prompt: "Lectura en voz alta (diagnóstico de pronunciación). Lee tal cual:", expected: "Je voudrais un croissant et une baguette, s'il vous plaît. L'addition, s'il vous plaît ! Un café sans sucre, avec un peu de lait." },
      { prompt: "Mini situación (30-45 seg): estás en una cafetería de París. Pide tu desayuno completo (bebida + comida + una modificación sans/avec) y pregunta cómo pagar." },
    ],
  },
  {
    co: [
      { audio: "Bonjour ! Un thé vert et une tarte aux pommes, s'il vous plaît.", question: "¿Qué pide el cliente?", options: ["un café y un croissant", "un té verde y una tarta de manzana", "un chocolate caliente"], correct: 1 },
      { audio: "Vous payez comment ? Par carte ou en espèces ?", question: "¿Qué pregunta el camarero?", options: ["cómo va a pagar", "si quiere hielo", "si es para llevar"], correct: 0 },
      { audio: "Ça fait douze euros vingt, s'il vous plaît.", question: "¿Cuánto debe pagar?", options: ["2,20 €", "12,20 €", "12 €"], correct: 1 },
    ],
    ce: {
      text: "CAFÉ LIBERTÉ — Petit déjeuner à 8 € : un café ou un thé + une viennoiserie + un jus d'orange. Ouvert du lundi au samedi, 7h-11h. Wifi gratuit.",
      items: [
        { question: "¿Cuánto cuesta el desayuno?", options: ["7 €", "8 €", "11 €"], correct: 1 },
        { question: "¿Qué incluye la bebida caliente?", options: ["café o té", "solo café", "chocolate"], correct: 0 },
        { question: "¿Está abierto el domingo?", options: ["sí", "no", "solo por la mañana"], correct: 1 },
      ],
    },
    pe: [
      { prompt: "Pide con cortesía en francés: un té con leche y sin azúcar, para llevar." },
      { prompt: "Haz esta frase más cortés en francés: « Donne-moi l'addition. »" },
    ],
    po: [
      { prompt: "Lectura en voz alta (diagnóstico de pronunciación). Lee tal cual:", expected: "Bonjour ! Je voudrais un thé avec du lait, sans sucre, s'il vous plaît. C'est pour emporter. Merci beaucoup !" },
      { prompt: "Mini situación (30-45 seg): entras en una boulangerie de París. Saluda, pide una baguette y dos croissants, pregunta el precio y despídete." },
    ],
  },
  {
    co: [
      { audio: "Bonjour, je voudrais un chocolat chaud et un pain au chocolat, s'il vous plaît.", question: "¿Qué pide el cliente?", options: ["un café y un croissant", "un chocolate caliente y un pain au chocolat", "un té y una tarta"], correct: 1 },
      { audio: "Avec du sucre ou sans sucre ?", question: "¿Qué pregunta el camarero?", options: ["con o sin azúcar", "grande o pequeño", "frío o caliente"], correct: 0 },
      { audio: "Ça fait cinq euros quatre-vingts.", question: "¿Cuánto debe pagar?", options: ["5,80 €", "4,80 €", "15,80 €"], correct: 0 },
    ],
    ce: {
      text: "BOULANGERIE DU COIN — Baguette tradition : 1,20 €. Croissant au beurre : 1,50 €. Pain au chocolat : 1,80 €. Fermé le mardi. Ouvert de 7h à 20h.",
      items: [
        { question: "¿Cuánto cuesta la baguette tradition?", options: ["1,20 €", "1,50 €", "2 €"], correct: 0 },
        { question: "¿Qué día está cerrada?", options: ["el lunes", "el martes", "el domingo"], correct: 1 },
        { question: "¿A qué hora abre?", options: ["a las 6h", "a las 7h", "a las 8h"], correct: 1 },
      ],
    },
    pe: [
      { prompt: "Escribe una frase cortés para pedir dos cafés y un vaso de agua." },
      { prompt: "Haz esta frase más cortés en francés: « Je veux payer par carte. »" },
    ],
    po: [
      { prompt: "Lectura en voz alta (diagnóstico de pronunciación). Lee tal cual:", expected: "Bonjour ! Je voudrais deux cafés et un pain au chocolat, s'il vous plaît. Sur place, merci. L'addition, s'il vous plaît !" },
      { prompt: "Mini situación (30-45 seg): estás en un café parisino con un amigo. Saluda, pide dos bebidas diferentes con una modificación (sans/avec) y pregunta si aceptan tarjeta." },
    ],
  },
];

/* ===== Semaine 3 (jours 11-15) — directions, pharmacie, symptômes, comparer ===== */
const WEEK3_VARIANTS: Variant[] = [
  {
    co: [
      { audio: "Pardon monsieur, où est la pharmacie ? — Tournez à gauche, puis allez tout droit. C'est en face du parc.", question: "¿Dónde está la farmacia?", options: ["enfrente del parque", "a la derecha del metro", "al lado del café"], correct: 0 },
      { audio: "Bonjour, j'ai mal à la tête depuis hier. — Prenez ce médicament deux fois par jour, après les repas.", question: "¿Cuántas veces al día debe tomar el medicamento?", options: ["una vez", "dos veces", "tres veces"], correct: 1 },
      { audio: "Ce manteau-ci est plus cher que l'autre, mais il est de meilleure qualité.", question: "¿Cómo es este abrigo comparado con el otro?", options: ["más barato", "más caro pero de mejor calidad", "igual de caro"], correct: 1 },
    ],
    ce: {
      text: "PHARMACIE DU CENTRE — Ouverte du lundi au samedi, de 8h30 à 19h30. Fermée le dimanche. Pour une urgence la nuit, appelez la pharmacie de garde. À côté de la station de métro « République ».",
      items: [
        { question: "¿A qué hora abre la farmacia?", options: ["a las 8h", "a las 8h30", "a las 9h"], correct: 1 },
        { question: "¿Está abierta el domingo?", options: ["sí, todo el día", "no", "solo por la mañana"], correct: 1 },
        { question: "¿Qué hay al lado de la farmacia?", options: ["un parque", "la estación de metro République", "un supermercado"], correct: 1 },
      ],
    },
    pe: [
      { prompt: "Escribe en francés cómo preguntar, con cortesía, por dónde se va a la estación de metro más cercana." },
      { prompt: "Escribe una frase para decir que te duele la garganta y pedir un medicamento en la farmacia." },
    ],
    po: [
      { prompt: "Lectura en voz alta (diagnóstico de pronunciación). Lee tal cual:", expected: "Pardon, madame. Où est la pharmacie, s'il vous plaît ? Je vais tout droit, puis je tourne à droite ? Merci beaucoup !" },
      { prompt: "Mini situación (30-45 seg): estás perdido en París. Pregunta a alguien cómo llegar a la estación de metro más cercana, confirma la dirección y da las gracias." },
    ],
  },
];

/* ===== Semaine 4 (jours 16-20) — vêtements, marché, salle de sport ===== */
const WEEK4_VARIANTS: Variant[] = [
  {
    co: [
      { audio: "Bonjour, je cherche ce pull en taille M. — Désolé, il ne reste que du L. Vous voulez l'essayer ?", question: "¿Qué talla queda disponible?", options: ["la M", "la L", "la S"], correct: 1 },
      { audio: "Je voudrais un kilo de pommes et une barquette de fraises. — Très bien, ça fait cinq euros cinquante.", question: "¿Cuánto debe pagar?", options: ["5,15 €", "5,50 €", "15 €"], correct: 1 },
      { audio: "Pour vous inscrire à la salle de sport, remplissez ce formulaire. Les cours commencent à sept heures.", question: "¿A qué hora empiezan las clases?", options: ["a las 6h", "a las 7h", "a las 8h"], correct: 1 },
    ],
    ce: {
      text: "MARCHÉ BIO — Fruits et légumes de saison. Pommes : 2 € le kilo. Fraises : 3 € la barquette. Ouvert mardi, jeudi et samedi, de 8h à 13h. Paiement en espèces uniquement.",
      items: [
        { question: "¿Cuánto cuesta el kilo de manzanas?", options: ["2 €", "3 €", "5 €"], correct: 0 },
        { question: "¿Qué días abre el mercado?", options: ["lunes, miércoles y viernes", "martes, jueves y sábado", "todos los días"], correct: 1 },
        { question: "¿Cómo se puede pagar?", options: ["con tarjeta", "solo en efectivo", "con cheque"], correct: 1 },
      ],
    },
    pe: [
      { prompt: "Escribe en francés cómo pedir, con cortesía, otra talla y otro color de una camiseta en una tienda." },
      { prompt: "Escribe una frase para comprar medio kilo de tomates en el mercado (usa « un demi-kilo de »)." },
    ],
    po: [
      { prompt: "Lectura en voz alta (diagnóstico de pronunciación). Lee tal cual:", expected: "Bonjour ! Je voudrais un kilo de pommes et une barquette de fraises, s'il vous plaît. C'est combien ? Merci, bonne journée !" },
      { prompt: "Mini situación (30-45 seg): estás en una tienda de ropa. Saluda, pide probarte un pantalón, pide otra talla y pregunta el precio." },
    ],
  },
];

// Weekly-test content per week. Week 2 has its own bespoke route (/defi-semaine2);
// weeks without a bank fall back to week 1's so the route never crashes.
/* ===== MOIS 2 · JE COMPRENDS — semaines 5-8 (jours 21-40) =====
   Every week of month 2 now has its own evaluation, so the coach can score
   progress each week (previously only weeks 1-4 had one). Content is grounded
   strictly in the client's Mes 2 dictionary/curriculum: each week reuses the
   situations and the grammar taught on its own five days. */

/* Semaine 5 (jours 21-25): appels, messages vocaux, e-mails.
   Grammaire : futur proche · registre formel au téléphone · COD (le/la/les)
   · expressions de temps · pronoms toniques. */
const WEEK5_VARIANTS: Variant[] = [
  {
    co: [
      { audio: "Allô, bonjour. Cabinet médical, j'écoute. — Bonjour, je voudrais prendre rendez-vous avec le médecin. — Pour quel jour ? — Demain matin, si possible.", question: "¿Para cuándo quiere la cita?", options: ["para esta tarde", "para mañana por la mañana", "para la semana que viene"], correct: 1 },
      { audio: "Bonjour, c'est Madame Dupont. Le médecin ne sera pas disponible le matin. Pouvez-vous venir à 15h ? Merci de rappeler au 01 23 45 67 89.", question: "¿Qué cambio anuncia el mensaje?", options: ["la cita pasa a las 15h", "la cita se cancela", "hay que cambiar de médico"], correct: 0 },
      { audio: "Je n'ai pas bien compris. Vous pouvez répéter plus lentement, s'il vous plaît ?", question: "¿Qué pide la persona?", options: ["que repitan más despacio", "que hablen más alto", "que le llamen mañana"], correct: 0 },
    ],
    ce: {
      text: "Objet : Demande d'information — appartement rue Lepic. Bonjour Madame, Je vous contacte au sujet de l'appartement que vous proposez à la location. Pourriez-vous m'indiquer si les charges sont comprises dans le loyer et quand l'appartement est disponible ? Je reste à votre disposition pour une visite. Cordialement, Ana García.",
      items: [
        { question: "¿Cuál es el asunto del correo?", options: ["una reclamación", "una solicitud de información sobre un apartamento", "una confirmación de cita"], correct: 1 },
        { question: "¿Qué dos cosas pregunta Ana?", options: ["si los gastos están incluidos y cuándo está disponible", "el precio y el tamaño", "la dirección y el código postal"], correct: 0 },
        { question: "¿Cómo cierra el correo?", options: ["« Salut »", "« Cordialement »", "sin fórmula de cierre"], correct: 1 },
      ],
    },
    pe: [
      { prompt: "Escribe en francés el mensaje que dejarías en un buzón de voz: preséntate, di el motivo de tu llamada y cuándo esperas respuesta." },
      { prompt: "Escribe una frase con « je vais + infinitif » (futur proche) para decir que vas a volver a llamar mañana por la mañana." },
    ],
    po: [
      { prompt: "Lectura en voz alta (diagnóstico de pronunciación). Lee tal cual:", expected: "Allô, bonjour. Je vous appelle pour prendre rendez-vous. Je voudrais parler à Madame Dupont, s'il vous plaît. Merci beaucoup, bonne journée !" },
      { prompt: "Mini situación (30-45 seg): llamas a una consulta médica. Saluda con el registro formal, pide una cita, propón un día y una hora, y deja tus datos." },
    ],
  },
];

/* Semaine 6 (jours 26-30): e-mail formel, logement, voisins.
   Grammaire : demander de répéter · structure de l'e-mail formel
   · comparatifs · superlatifs · tu/vous. */
const WEEK6_VARIANTS: Variant[] = [
  {
    co: [
      { audio: "Bonjour, je suis votre voisine du dessous. Je me permets de vous contacter car le bruit est très fort la nuit. — Oh, je suis désolé. Je ne savais pas.", question: "¿Por qué habla la vecina?", options: ["por el ruido nocturno", "por una fuga de agua", "por la basura"], correct: 0 },
      { audio: "Cet appartement est plus grand que l'autre, mais il est moins cher parce qu'il est à rénover.", question: "¿Cómo es este apartamento?", options: ["más pequeño y más caro", "más grande y más barato, para reformar", "igual que el otro"], correct: 1 },
      { audio: "Pour le dossier de location, il faut une pièce d'identité, un justificatif de domicile et vos trois derniers bulletins de salaire.", question: "¿Qué documentos piden?", options: ["identidad, justificante de domicilio y nóminas", "solo el pasaporte", "un cheque y el contrato"], correct: 0 },
    ],
    ce: {
      text: "RÈGLEMENT DE L'IMMEUBLE — Le calme est obligatoire après 22h. Les poubelles doivent être sorties le soir, avant 20h. Les parties communes (escalier, couloir, palier) doivent rester propres. En cas de problème, contactez le gardien ou le syndic.",
      items: [
        { question: "¿A partir de qué hora hay que guardar silencio?", options: ["después de las 20h", "después de las 22h", "después de las 24h"], correct: 1 },
        { question: "¿Cuándo hay que sacar la basura?", options: ["por la mañana", "por la noche, antes de las 20h", "el domingo"], correct: 1 },
        { question: "¿A quién hay que contactar si hay un problema?", options: ["al conserje o al administrador", "a la policía", "al vecino de arriba"], correct: 0 },
      ],
    },
    pe: [
      { prompt: "Escribe un correo formal breve (4-5 líneas) a una agencia inmobiliaria: apertura, pide información sobre el alquiler y los gastos, y cierra con « Cordialement »." },
      { prompt: "Compara dos apartamentos en francés con « plus … que », « moins … que » y « aussi … que » (3 frases)." },
    ],
    po: [
      { prompt: "Lectura en voz alta (diagnóstico de pronunciación). Lee tal cual:", expected: "Bonjour Madame, je me permets de vous contacter au sujet de l'appartement. Est-ce que les charges sont comprises ? Je vous remercie de votre compréhension. Cordialement." },
      { prompt: "Mini situación (30-45 seg): te presentas a tu nuevo vecino, explicas una norma del edificio y planteas con amabilidad un problema de ruido." },
    ],
  },
];

/* Semaine 7 (jours 31-35): banque, poste, achats en ligne.
   Grammaire : COI (lui/leur) · adverbes de fréquence · passé récent (venir de)
   · connecteurs · négation avancée. */
const WEEK7_VARIANTS: Variant[] = [
  {
    co: [
      { audio: "Bonjour, je voudrais ouvrir un compte courant. — Bien sûr. Vous avez une pièce d'identité et un justificatif de domicile ? — Oui, les voici.", question: "¿Qué quiere hacer el cliente?", options: ["abrir una cuenta corriente", "pedir un préstamo", "cerrar su cuenta"], correct: 0 },
      { audio: "Je viens de recevoir mon relevé et je ne comprends rien à ces frais. Ma carte est bloquée depuis hier.", question: "¿Cuál es el problema?", options: ["ha perdido el móvil", "su tarjeta está bloqueada y no entiende unos gastos", "quiere cambiar de banco"], correct: 1 },
      { audio: "D'abord, pesez le colis. Ensuite, remplissez le formulaire. Enfin, déposez-le au guichet.", question: "¿Cuál es el orden correcto?", options: ["pesar, rellenar, entregar", "rellenar, pagar, pesar", "entregar, pesar, rellenar"], correct: 0 },
    ],
    ce: {
      text: "SUIVI DE VOTRE COMMANDE nº 12345 — Statut : expédié. Livraison prévue sous 3 jours ouvrables. Les frais de port sont offerts dès 50 euros. Vous pouvez retourner l'article sous 30 jours. Pour toute question, contactez le service client.",
      items: [
        { question: "¿Cuál es el estado del pedido?", options: ["entregado", "enviado", "en preparación"], correct: 1 },
        { question: "¿Desde qué importe es gratis el envío?", options: ["desde 30 €", "desde 50 €", "siempre es gratis"], correct: 1 },
        { question: "¿Cuánto tiempo hay para devolver el artículo?", options: ["30 días", "3 días", "no se puede devolver"], correct: 0 },
      ],
    },
    pe: [
      { prompt: "Escribe 4 frases sobre tus hábitos bancarios usando « toujours », « souvent », « parfois » y « ne… jamais »." },
      { prompt: "Explica en francés, con « d'abord / ensuite / enfin », los pasos para enviar un paquete en la oficina de correos." },
    ],
    po: [
      { prompt: "Lectura en voz alta (diagnóstico de pronunciación). Lee tal cual:", expected: "Bonjour, je voudrais faire un virement. Je viens d'ouvrir un compte. Je ne donne jamais mon code PIN. Merci beaucoup !" },
      { prompt: "Mini situación (30-45 seg): estás en el banco. Explica que tu tarjeta está bloqueada, pide una solución y pregunta cuánto tarda." },
    ],
  },
];

/* Semaine 8 (jours 36-40): retours en ligne, aéroport, gare — révision du mois.
   Grammaire : impératif des formulaires · questions directes/indirectes
   · discours indirect · révision intégrée JE COMPRENDS. */
const WEEK8_VARIANTS: Variant[] = [
  {
    co: [
      { audio: "Votre passeport et votre billet, s'il vous plaît. Votre bagage fait 26 kilos, c'est 2 kilos de plus que la limite. Il y a un supplément de 15 euros.", question: "¿Por qué hay un suplemento?", options: ["por exceso de equipaje", "por cambiar de asiento", "por facturar tarde"], correct: 0 },
      { audio: "Mesdames et messieurs, le vol AF123 est retardé de deux heures. Le nouvel embarquement est prévu à 16h30, porte B7.", question: "¿Qué anuncian?", options: ["el vuelo se adelanta", "el vuelo tiene dos horas de retraso", "el vuelo está cancelado"], correct: 1 },
      { audio: "Le contrôleur dit que le train part de la voie 3 et qu'il faut composter son billet avant de monter à bord.", question: "¿Qué informa el revisor?", options: ["que el tren sale de la vía 3 y hay que picar el billete", "que el tren está lleno", "que hay que cambiar de tren"], correct: 0 },
    ],
    ce: {
      text: "PROCÉDURE DE RETOUR — Remplissez le formulaire en ligne. Imprimez l'étiquette de retour et joignez-la au colis. Déposez le colis dans un point relais sous 30 jours. Le remboursement est effectué sous 5 jours après réception. Cochez la case « article défectueux » si nécessaire.",
      items: [
        { question: "¿Qué hay que hacer primero?", options: ["rellenar el formulario en línea", "llamar por teléfono", "ir a la tienda"], correct: 0 },
        { question: "¿Dónde hay que dejar el paquete?", options: ["en un punto de recogida", "en el buzón", "en la oficina del banco"], correct: 0 },
        { question: "¿Cuándo se hace el reembolso?", options: ["en 30 días", "en 5 días tras la recepción", "inmediatamente"], correct: 1 },
      ],
    },
    pe: [
      { prompt: "Escribe un correo al servicio al cliente: explica que el artículo llegó defectuoso y pide un reembolso (usa el discurso indirecto: « Le vendeur dit que… »)." },
      { prompt: "Transforma en preguntas indirectas: « Le vol est à l'heure ? » y « Où est la porte d'embarquement ? » (usa « Je voudrais savoir… »)." },
    ],
    po: [
      { prompt: "Lectura en voz alta (diagnóstico de pronunciación). Lee tal cual:", expected: "Bonjour, je voudrais m'enregistrer pour le vol à destination de Paris. J'ai un bagage en soute. Je voudrais savoir si le vol est à l'heure. Merci !" },
      { prompt: "RETO FINAL JE COMPRENDS (45-60 seg): encadena tres situaciones sin cambiar al español — una llamada para avisar de un retraso, un correo formal de reclamación y un trámite en la estación." },
    ],
  },
];

const VARIANTS_BY_WEEK: Record<number, Variant[]> = {
  1: VARIANTS,
  3: WEEK3_VARIANTS,
  4: WEEK4_VARIANTS,
  5: WEEK5_VARIANTS,
  6: WEEK6_VARIANTS,
  7: WEEK7_VARIANTS,
  8: WEEK8_VARIANTS,
};

function variantsForWeek(weekNumber: number): Variant[] {
  return VARIANTS_BY_WEEK[weekNumber] ?? VARIANTS;
}

function pickVariantIdx(weekNumber: number, bankLen: number): number {
  const key = `liberte_week${weekNumber}_variant`;
  let idx = 0;
  if (typeof window !== "undefined") {
    const stored = window.sessionStorage.getItem(key);
    if (stored !== null) {
      idx = Number(stored);
    } else {
      idx = Math.floor(Math.random() * bankLen);
      window.sessionStorage.setItem(key, String(idx));
    }
  }
  return ((idx % bankLen) + bankLen) % bankLen;
}


/* ================= Page ================= */

function WeekPage() {
  const { weekId } = Route.useParams();
  const weekNumber = Number(weekId);
  const { user, loading, fullName, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [gateLoading, setGateLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [existing, setExisting] = useState<Awaited<ReturnType<typeof getMyWeeklyEvaluation>> | null>(null);

  // Week 2's challenge lives on its own richer route (/defi-semaine2). There is
  // no week-2 test bank here, so serving /semaine/2 would fall back to the week-1
  // content and, on submit, overwrite the real week-2 weekly_evaluations row.
  useEffect(() => {
    if (weekNumber === 2) navigate({ to: "/defi-semaine2", replace: true });
  }, [weekNumber, navigate]);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      try {
        const [days, prev] = await Promise.all([
          getCompletedDays(),
          getMyWeeklyEvaluation({ data: { weekNumber } }),
        ]);
        // Unlocks once the LAST day of the week is complete (week N → day N*5).
        // Week 2 has its own /defi-semaine2 route; this covers weeks 1, 3 and 4.
        const ok = isAdmin || days.includes(weekNumber * 5);
        setUnlocked(ok);
        setExisting(prev);
      } catch {
        setUnlocked(isAdmin);
      } finally {
        setGateLoading(false);
      }
    })();
  }, [loading, user?.id, weekNumber, isAdmin]);

  if (loading || gateLoading || weekNumber === 2) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b3a]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <Link to="/liberte-log-in-983749824923465723" className="text-blue underline">Connecte-toi</Link>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-3xl border-2 border-gold/40 bg-white p-8 text-center shadow-card">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-navy text-white">🎉</div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-navy">Le défi de la semaine te espera</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Termine le <strong>Défi Final du Jour {weekNumber * 5}</strong> pour ouvrir <strong>Le défi de la semaine {weekNumber}</strong> y celebrar tu progreso.
          </p>
          <Button onClick={() => navigate({ to: "/day/$dayId", params: { dayId: String(weekNumber * 5) } })} className="mt-6 bg-gradient-blue text-white">
            Aller au Jour {weekNumber * 5}
          </Button>
        </div>
      </div>
    );
  }

  const studentName =
    (fullName && fullName.split(" ")[0]) ||
    (user?.email ? user.email.split("@")[0] : "Alumno");

  return <WeekTest weekNumber={weekNumber} studentName={fullName || studentName} previous={existing} />;
}

/* ================= Test flow ================= */

type Block = "intro" | "CO" | "CE" | "PE" | "PO" | "eval" | "result";

function WeekTest({ weekNumber, studentName, previous }: { weekNumber: number; studentName: string; previous: Awaited<ReturnType<typeof getMyWeeklyEvaluation>> | null }) {
  const { user } = useAuth();
  const banks = variantsForWeek(weekNumber);
  const [variantIdx, setVariantIdx] = useState(() => pickVariantIdx(weekNumber, banks.length));
  const V = banks[variantIdx % banks.length];
  const [block, setBlock] = useState<Block>(previous ? "result" : "intro");
  const [coAnswers, setCoAnswers] = useState<number[]>(Array(V.co.length).fill(-1));
  const [ceAnswers, setCeAnswers] = useState<number[]>(Array(V.ce.items.length).fill(-1));
  const [peAnswers, setPeAnswers] = useState<string[]>(Array(V.pe.length).fill(""));
  const [, setPoTranscripts] = useState<string[]>(Array(V.po.length).fill(""));
  const [poBlobs, setPoBlobs] = useState<(Blob | null)[]>(Array(V.po.length).fill(null));
  const [evalRes, setEvalRes] = useState<Awaited<ReturnType<typeof evaluateWeek>> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => () => { stopFr(); }, []);

  // Resume an in-progress test (answers + step + variant) from the DB so a
  // refresh or another device doesn't wipe the student's work. Audio
  // recordings can't be persisted this way, so PO re-records if needed.
  useEffect(() => {
    if (previous || !user) {
      setHydrated(true);
      return;
    }
    let alive = true;
    (async () => {
      // Only a SUCCESSFUL read may enable the autosave (see the error branch).
      let readOk = false;
      try {
        const { data, error } = await supabase
          .from("week_state")
          .select("state")
          .eq("user_id", user.id)
          .eq("week_number", weekNumber)
          .maybeSingle();
        if (!alive) return;
        // A FAILED read is not "no saved test". Marking it hydrated would let the
        // 500ms autosave below overwrite a real mid-test row with a blank one.
        if (error) {
          console.error("[week_state] hydrate failed", error.message);
          toast.error("Impossible de charger ton test enregistré. Recharge la page avant de continuer.");
          return; // leaves `hydrated` false -> autosave stays disabled
        }
        readOk = true;
        const s = (data?.state ?? null) as Record<string, unknown> | null;
        if (s && typeof s === "object") {
          const savedIdx = typeof s.variantIdx === "number" ? s.variantIdx % banks.length : variantIdx;
          const NV = banks[savedIdx];
          const fitNum = (arr: unknown, len: number) =>
            Array.from({ length: len }, (_, i) => (Array.isArray(arr) && typeof arr[i] === "number" ? (arr[i] as number) : -1));
          const fitStr = (arr: unknown, len: number) =>
            Array.from({ length: len }, (_, i) => (Array.isArray(arr) && typeof arr[i] === "string" ? (arr[i] as string) : ""));
          setVariantIdx(savedIdx);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(`liberte_week${weekNumber}_variant`, String(savedIdx));
          }
          setCoAnswers(fitNum(s.coAnswers, NV.co.length));
          setCeAnswers(fitNum(s.ceAnswers, NV.ce.items.length));
          setPeAnswers(fitStr(s.peAnswers, NV.pe.length));
          const blocks: Block[] = ["intro", "CO", "CE", "PE", "PO"];
          if (typeof s.block === "string" && blocks.includes(s.block as Block)) {
            setBlock(s.block as Block);
          } else if (s.block === "eval" || s.block === "result") {
            // Mid-eval snapshots can't resume into grading; back to the last step.
            setBlock("PO");
          }
        }
      } catch (e) {
        console.error("[week_state] hydrate threw", e);
      } finally {
        // NEVER certify a failed read: `hydrated` is what unlocks the autosave,
        // so certifying here would let a blank form overwrite a saved test.
        if (alive && readOk) setHydrated(true);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previous, user?.id, weekNumber]);

  // Debounced autosave of the in-progress test.
  useEffect(() => {
    if (!hydrated || !user || previous || evalRes || block === "eval" || block === "result") return;
    const t = setTimeout(() => {
      // Must be awaited — an un-awaited supabase builder never sends its request.
      void persist("week_state", () =>
        supabase.from("week_state").upsert(
          {
            user_id: user.id,
            week_number: weekNumber,
            state: { variantIdx, block, coAnswers, ceAnswers, peAnswers },
          },
          { onConflict: "user_id,week_number" },
        ),
      );
    }, 500);
    return () => clearTimeout(t);
  }, [hydrated, user?.id, previous, evalRes, block, variantIdx, coAnswers, ceAnswers, peAnswers, weekNumber]);

  const percentByBlock: Record<Block, number> = { intro: 0, CO: 20, CE: 40, PE: 60, PO: 80, eval: 95, result: 100 };

  const submitAll = async () => {
    setBusy(true);
    setError("");
    try {
      setBusyMsg("Transcribiendo tus grabaciones…");
      const transcripts: string[] = [];
      for (let i = 0; i < V.po.length; i++) {
        const blob = poBlobs[i];
        if (!blob) throw new Error(`Falta grabar la tarea oral ${i + 1}`);
        setBusyMsg(`Transcribiendo audio ${i + 1} de ${V.po.length}…`);
        const b64 = await blobToBase64(blob);
        const r = await transcribeAudio({ data: { audioBase64: b64, mimeType: blob.type || "audio/webm" } });
        transcripts.push(r.text);
      }
      setPoTranscripts(transcripts);
      setBusyMsg("Evaluando tu semana con la profesora IA…");
      setBlock("eval");
      const res = await evaluateWeek({
        data: {
          weekNumber,
          co: {
            correct: coAnswers.reduce((a, ans, i) => a + (ans === V.co[i].correct ? 1 : 0), 0),
            total: V.co.length,
          },
          ce: {
            correct: ceAnswers.reduce((a, ans, i) => a + (ans === V.ce.items[i].correct ? 1 : 0), 0),
            total: V.ce.items.length,
          },
          pe: V.pe.map((p, i) => ({ prompt: p.prompt, response: peAnswers[i] })),
          po: V.po.map((p, i) => ({ prompt: p.prompt, expected: p.expected ?? "", transcript: transcripts[i] })),
        },
      });
      setEvalRes(res);
      setBlock("result");
      // The evaluation is saved server-side; drop the in-progress snapshot.
      if (user) {
        void persist(
          "week_state:cleanup",
          () => supabase.from("week_state").delete().eq("user_id", user.id).eq("week_number", weekNumber),
          { silent: true }, // best-effort cleanup; the result is already saved
        );
      }
      if (res.weeklyScore >= 8.5) fireConfetti();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setBlock("PO");
    } finally {
      setBusy(false);
      setBusyMsg("");
    }
  };

  // Previous evaluation display shortcut
  const cachedEval = useMemo(() => {
    if (!previous) return null;
    const ai = previous.ai_report as unknown as WeeklyReportData & {
      verdict_key: string; verdict_title: string; verdict_message: string;
      strengths: { title: string; example: string }[];
      common_errors: { said: string; corrected: string; rule: string }[];
      improvements: string[]; pronunciation: { word: string; heard: string; target: string; tip: string }[];
      coach_summary: string;
    };
    return {
      weeklyScore: Number(previous.weekly_score),
      testScore: Number(previous.test_score),
      historyScore: 0,
      compScores: previous.test_scores as { CO: number; CE: number; PE: number; PO: number },
      report: {
        verdict_title: ai.verdict_title, verdict_message: ai.verdict_message,
        strengths: ai.strengths ?? [], common_errors: ai.common_errors ?? [],
        improvements: ai.improvements ?? [], pronunciation: ai.pronunciation ?? [],
        coach_summary: ai.coach_summary ?? "",
      },
      daysCompleted: 5,
    };
  }, [previous]);

  const shown = evalRes ?? cachedEval;

  return (
    <div className="min-h-screen bg-ice pb-20">
      <TopNav />
      {/* Not sticky: TopNav owns the persistent header; this row only carries
          the block progress bar. */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/liberte-plataforma-834798234728482934254-student" className="inline-flex items-center gap-1 text-xs font-semibold text-navy/70 hover:text-navy">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="text-xs font-bold text-navy">Semaine {weekNumber}</div>
        </div>
        <div className="h-1 w-full bg-ice">
          <div className="h-full bg-gradient-to-r from-blue to-gold transition-all" style={{ width: `${percentByBlock[block]}%` }} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {block === "intro" && (
          <div className="rounded-3xl border-2 border-gold/40 bg-white p-8 shadow-card">
            <p className="text-xs font-bold tracking-widest text-gold uppercase">🎉 Le défi de la semaine</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold text-navy">Semaine {weekNumber} · {monthLabelForWeek(weekNumber)}</h1>
            <p className="mt-3 text-sm text-navy/80">
              Bravo d’être arrivé(e) jusqu’ici ! Voici ta <strong>fête de fin de semaine</strong> : 4 mini-défis courts (10-12 min)
              pour découvrir tout ce que tu sais déjà dire en français. À la fin, tu recevras ta <strong>note de la semaine</strong>,
              ton <strong>verdict bienveillant</strong> et tu pourras télécharger ton <strong>rapport PDF</strong> pour ton coach.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-navy/90">
              <li>🔊 Défi 1 · J’écoute — 3 audios</li>
              <li>📖 Défi 2 · Je lis — 1 texte + 3 questions</li>
              <li>✍️ Défi 3 · J’écris — 2 tâches</li>
              <li>🎙️ Défi 4 · Je parle — 2 enregistrements</li>
            </ul>
            <Button onClick={() => setBlock("CO")} className="mt-6 bg-gradient-blue text-white font-extrabold">
              Commencer ma Fête ! <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {block === "CO" && (
          <BlockCO items={V.co} answers={coAnswers} setAnswers={setCoAnswers} onNext={() => setBlock("CE")} />
        )}
        {block === "CE" && (
          <BlockCE text={V.ce.text} items={V.ce.items} answers={ceAnswers} setAnswers={setCeAnswers} onBack={() => setBlock("CO")} onNext={() => setBlock("PE")} />
        )}
        {block === "PE" && (
          <BlockPE items={V.pe} answers={peAnswers} setAnswers={setPeAnswers} onBack={() => setBlock("CE")} onNext={() => setBlock("PO")} />
        )}
        {block === "PO" && (
          <BlockPO
            items={V.po}
            blobs={poBlobs}
            setBlobs={setPoBlobs}
            onBack={() => setBlock("PE")}
            onSubmit={submitAll}
            busy={busy}
            error={error}
          />
        )}
        {block === "eval" && (
          <div className="rounded-3xl border border-border bg-white p-10 text-center shadow-card">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue" />
            <p className="mt-4 font-display text-lg font-extrabold text-navy">{busyMsg || "Preparando tu Fête…"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Ça peut prendre une minute — ne ferme pas cet onglet.</p>
          </div>
        )}
        {block === "result" && shown && (
          <ResultView data={shown} studentName={studentName} weekNumber={weekNumber} />
        )}
      </main>
    </div>
  );
}

/* ================= Blocks ================= */

type CoItem = Variant["co"][number];
type CeItem = Variant["ce"]["items"][number];
type PeItem = Variant["pe"][number];
type PoItem = Variant["po"][number];

function BlockCO({ items, answers, setAnswers, onNext }: { items: CoItem[]; answers: number[]; setAnswers: (a: number[]) => void; onNext: () => void }) {
  const [plays, setPlays] = useState<number[]>(Array(items.length).fill(0));
  const canPlay = (i: number) => plays[i] < 2;
  const doPlay = (i: number) => {
    if (!canPlay(i)) return;
    speakFr(items[i].audio);
    setPlays((p) => p.map((v, k) => (k === i ? v + 1 : v)));
  };
  const done = answers.every((a) => a >= 0);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Défi 1" title="🔊 J’écoute" subtitle="Écoute (2 fois max.) et choisis la réponse." />
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <button
              onClick={() => doPlay(i)}
              disabled={!canPlay(i)}
              className="grid h-12 w-12 place-items-center rounded-full bg-gradient-blue text-white disabled:opacity-40"
            >
              <Volume2 className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <p className="text-xs font-bold tracking-widest text-navy/60 uppercase">Audio {i + 1}</p>
              <p className="text-xs text-muted-foreground">Escuchas restantes: {2 - plays[i]}</p>
            </div>
          </div>
          <p className="mt-4 font-display text-base font-bold text-navy">{it.question}</p>
          <div className="mt-3 grid gap-2">
            {it.options.map((op, k) => (
              <button
                key={k}
                onClick={() => setAnswers(answers.map((a, x) => (x === i ? k : a)))}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  answers[i] === k ? "border-blue bg-blue/5 font-bold text-navy" : "border-border hover:border-blue/40"
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>
      ))}
      <NavButtons rightDisabled={!done} onNext={onNext} />
    </div>
  );
}

function BlockCE({ text, items, answers, setAnswers, onBack, onNext }: { text: string; items: CeItem[]; answers: number[]; setAnswers: (a: number[]) => void; onBack: () => void; onNext: () => void }) {
  const done = answers.every((a) => a >= 0);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Défi 2" title="📖 Je lis" subtitle="Lis le texte et réponds aux 3 questions." />
      <div className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-white to-ice p-6 shadow-soft">
        <p className="font-display text-base leading-relaxed text-navy">{text}</p>
      </div>
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <p className="font-display text-base font-bold text-navy">{it.question}</p>
          <div className="mt-3 grid gap-2">
            {it.options.map((op, k) => (
              <button
                key={k}
                onClick={() => setAnswers(answers.map((a, x) => (x === i ? k : a)))}
                className={`rounded-xl border p-3 text-left text-sm transition ${
                  answers[i] === k ? "border-blue bg-blue/5 font-bold text-navy" : "border-border hover:border-blue/40"
                }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>
      ))}
      <NavButtons onBack={onBack} onNext={onNext} rightDisabled={!done} />
    </div>
  );
}

function BlockPE({ items, answers, setAnswers, onBack, onNext }: { items: PeItem[]; answers: string[]; setAnswers: (a: string[]) => void; onBack: () => void; onNext: () => void }) {
  const done = answers.every((a) => a.trim().length >= 3);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Défi 3" title="✍️ J’écris" subtitle="Écris en français. L’IA corrigera tes deux phrases à la fin." />
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-5 shadow-soft">
          <p className="text-xs font-bold tracking-widest text-navy/60 uppercase">Tâche {i + 1}</p>
          <p className="mt-1 font-display text-base font-bold text-navy">{it.prompt}</p>
          <Input
            value={answers[i]}
            onChange={(e) => setAnswers(answers.map((v, x) => (x === i ? e.target.value : v)))}
            placeholder="Écris ta réponse en français…"
            className="mt-3"
          />
        </div>
      ))}
      <NavButtons onBack={onBack} onNext={onNext} rightDisabled={!done} />
    </div>
  );
}

function BlockPO({ items, blobs, setBlobs, onBack, onSubmit, busy, error }: {
  items: PoItem[];
  blobs: (Blob | null)[]; setBlobs: (b: (Blob | null)[]) => void;
  onBack: () => void; onSubmit: () => void; busy: boolean; error: string;
}) {
  const done = blobs.every(Boolean);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Défi 4" title="🎙️ Je parle" subtitle="Enregistre tes deux réponses. L’IA analysera ta prononciation." />
      {items.map((it, i) => (
        <SpeakingItem
          key={i}
          index={i}
          prompt={it.prompt}

          expected={it.expected}
          blob={blobs[i]}
          onBlob={(b) => setBlobs(blobs.map((x, k) => (k === i ? b : x)))}
        />
      ))}
      {error && (
        <div className="rounded-2xl border border-red/40 bg-red/5 p-4 text-sm text-red">
          <AlertCircle className="mr-2 inline h-4 w-4" /> {error}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <Button variant="ghost" onClick={onBack} disabled={busy}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Retour
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!done || busy}
          className="bg-gradient-to-r from-gold to-[oklch(0.78_0.14_80)] text-navy font-extrabold shadow-card"
        >
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Évaluation…</> : <>Terminer ma Fête <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );
}

function SpeakingItem({ index, prompt, expected, blob, onBlob }: {
  index: number; prompt: string; expected?: string; blob: Blob | null; onBlob: (b: Blob) => void;
}) {
  const [rec, setRec] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunksRef.current = [];
      r.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      r.onstop = () => {
        const b = new Blob(chunksRef.current, { type: r.mimeType || "audio/webm" });
        onBlob(b);
        stream.getTracks().forEach((t) => t.stop());
        setRec(false);
        recRef.current = null;
      };
      recRef.current = r;
      r.start();
      setRec(true);
    } catch {
      // Denied/unavailable mic used to reject silently — the button did nothing.
      toast.error("Impossible d’accéder au micro. Vérifie les autorisations du navigateur.");
    }
  };
  const stop = () => recRef.current?.stop();

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-soft">
      <p className="text-xs font-bold tracking-widest text-navy/60 uppercase">Tarea oral {index + 1}</p>
      <p className="mt-1 font-display text-base font-bold text-navy">{prompt}</p>
      {expected && (
        <div className="mt-2 rounded-xl bg-ice p-3 text-sm italic text-navy/90">« {expected} »</div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={rec ? stop : start}
          className={`grid h-14 w-14 place-items-center rounded-full text-white shadow-card transition ${
            rec ? "bg-red animate-pulse" : blob ? "bg-gold text-navy" : "bg-gradient-blue hover:scale-105"
          }`}
        >
          {rec ? <Square className="h-6 w-6" /> : blob ? <Check className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
        {url && <audio src={url} controls className="max-w-xs flex-1" />}
      </div>
    </div>
  );
}

/* ================= Result ================= */

function ResultView({ data, studentName, weekNumber }: {
  data: {
    weeklyScore: number; testScore: number; historyScore?: number;
    compScores: { CO: number; CE: number; PE: number; PO: number };
    daysCompleted: number;
    report: {
      verdict_title: string; verdict_message: string;
      strengths: { title: string; example: string }[];
      common_errors: { said: string; corrected: string; rule: string }[];
      improvements: string[];
      pronunciation: { word: string; heard: string; target: string; tip: string }[];
      coach_summary: string;
    };
  };
  studentName: string;
  weekNumber: number;
}) {
  const [downloading, setDownloading] = useState(false);
  const r = data.report;

  const download = async () => {
    setDownloading(true);
    try {
      const doc = generateWeeklyPdf({
        studentName,
        weekNumber,
        monthLabel: monthLabelForWeek(weekNumber),
        daysCompleted: data.daysCompleted,
        daysTotal: 5,
        weeklyScore: data.weeklyScore,
        compScores: data.compScores,
        strengths: r.strengths,
        commonErrors: r.common_errors,
        improvements: r.improvements,
        pronunciation: r.pronunciation,
        coachSummary: r.coach_summary,
        verdict: { title: r.verdict_title, message: r.verdict_message },
      });
      doc.save(`Liberte_Informe_Semana${weekNumber}_${studentName.replace(/\s+/g, "_")}.pdf`);
      try { await markWeeklyPdfGenerated({ data: { weekNumber } }); } catch { /* ignore */ }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-[oklch(0.32_0.08_265)] to-[oklch(0.42_0.09_265)] p-8 text-white shadow-card">
        <div className="flex items-center gap-2">
          <PartyPopper className="h-6 w-6 text-gold" />
          <p className="text-xs font-bold tracking-widest text-gold uppercase">Ton verdict</p>
        </div>
        <h1 className="mt-2 font-display text-4xl font-extrabold">{r.verdict_title}</h1>
        <p className="mt-2 text-white/85">{r.verdict_message}</p>
        <div className="mt-5 flex items-baseline gap-2">
          <span className="font-display text-6xl font-extrabold text-gold">{data.weeklyScore.toFixed(1)}</span>
          <span className="text-lg text-white/80">/ 10</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {(["CO", "CE", "PE", "PO"] as const).map((k) => (
          <div key={k} className="rounded-2xl border border-border bg-white p-4 text-center shadow-soft">
            <p className="text-xs font-bold tracking-widest text-navy/60 uppercase">{k}</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-navy">{Number(data.compScores[k] ?? 0).toFixed(1)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
        <p className="font-display text-lg font-extrabold text-success">✨ Mes points forts</p>
        <ul className="mt-2 space-y-2 text-sm text-navy/90">
          {r.strengths.map((s, i) => (
            <li key={i}><strong>{s.title}</strong> — <em className="text-navy/70">« {s.example} »</em></li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-red/30 bg-red/5 p-5">
        <p className="font-display text-lg font-extrabold text-red">⚠️ Errores comunes</p>
        <ul className="mt-2 space-y-3 text-sm">
          {r.common_errors.map((e, i) => (
            <li key={i} className="text-navy/90">
              <span className="text-muted-foreground">Dijo:</span> « {e.said} » <br />
              <span className="text-muted-foreground">→ Correcto:</span> <strong className="text-navy">« {e.corrected} »</strong>
              <div className="text-xs italic text-muted-foreground">Regla: {e.rule}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-blue/30 bg-blue/5 p-5">
        <p className="font-display text-lg font-extrabold text-blue">🎯 Où m’améliorer</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-navy/90">
          {r.improvements.map((im, i) => <li key={i}>{im}</li>)}
        </ul>
      </div>

      <div className="rounded-2xl border border-gold/40 bg-gold/10 p-5">
        <p className="font-display text-lg font-extrabold text-navy">🔊 Ma prononciation</p>
        <ul className="mt-2 space-y-2 text-sm text-navy/90">
          {r.pronunciation.map((p, i) => (
            <li key={i}>
              <strong>{p.word}</strong> — entendu : <em>{p.heard}</em> · à viser : <em>{p.target}</em>
              <div className="text-xs text-muted-foreground">💡 {p.tip}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-3xl border-2 border-gold/40 bg-white p-6 text-center shadow-card">
        <p className="font-display text-lg font-extrabold text-navy">📄 Descarga tu informe semanal</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Envoie ce rapport à ton coach pour continuer ton suivi personnalisé.
        </p>
        <Button
          onClick={download}
          disabled={downloading}
          className="mt-4 bg-gradient-to-r from-gold to-[oklch(0.78_0.14_80)] text-navy font-extrabold shadow-card"
        >
          {downloading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Génération…</> : <><Download className="mr-2 h-4 w-4" /> Descargar mi informe Semanal</>}
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          Envoie-le par WhatsApp à ta coach Alejandra Miranda : <strong className="text-navy">+591 72586663</strong>
        </p>
      </div>
    </div>
  );
}

/* ================= Helpers ================= */

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-navy to-blue-deep p-6 text-white shadow-card">
      <p className="text-xs font-bold tracking-widest text-gold uppercase">{eyebrow}</p>
      <h2 className="mt-1 font-display text-3xl font-extrabold">{title}</h2>
      <p className="mt-1 text-sm text-white/85">{subtitle}</p>
    </div>
  );
}

function NavButtons({ onBack, onNext, rightDisabled }: { onBack?: () => void; onNext: () => void; rightDisabled?: boolean }) {
  return (
    <div className="flex items-center justify-between pt-2">
      {onBack ? (
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Retour</Button>
      ) : <span />}
      <Button onClick={onNext} disabled={rightDisabled} className="bg-gradient-blue text-white font-extrabold">
        Continuer <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function fireConfetti() {
  const end = Date.now() + 1500;
  const colors = ["#4BB1EC", "#3D5589", "#C9A84C", "#EDF8FC"];
  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
}
