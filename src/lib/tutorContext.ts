// Normalized "what the student is learning" payload for the AI tutor.
// The day data files export heterogeneous names/shapes, so each day is
// mapped explicitly. Pure data — safe to import from server functions.

import { vocabulary as day1Vocabulary, grammarPairs as day1GrammarPairs } from "@/data/day1";
import { day2Vocabulary, day2GrammarStructures } from "@/data/day2";
import { day3Vocabulary, day3GrammarStructures } from "@/data/day3";
import { day4Vocabulary, day4GrammarStructures } from "@/data/day4";
import { day5Vocabulary, day5GrammarStructures } from "@/data/day5";
import { day6Vocabulary, day6GrammarStructures } from "@/data/day6";
import { day7Vocabulary, day7GrammarStructures } from "@/data/day7";
import { day8Vocabulary, day8GrammarStructures } from "@/data/day8";
import { day9Vocabulary, day9GrammarStructures } from "@/data/day9";
import { day10Vocabulary, day10GrammarStructures } from "@/data/day10";
import { WEEK34 } from "@/data/week34";

export type TutorScenario = {
  // Who Lib plays in this day's scene + where it happens (fed to the prompt).
  role: string;
  // Lib's static opening message — shown instantly, no AI call needed.
  opener_fr: string;
  opener_es: string;
  // Three student goals for the scene, in Spanish, in order.
  objectives: string[];
};

export type TutorDayContext = {
  dayId: number;
  topic: string;
  scenario: TutorScenario;
  vocab: { fr: string; es: string }[];
  grammar: string[];
};

export const TUTOR_DAY_TOPICS: Record<number, string> = {
  1: "Au café — pedir bebidas y comida con cortesía",
  2: "Au restaurant — preferencias y recomendaciones",
  3: "Au restaurant — pedir y pagar",
  4: "La nourriture — hablar de comida",
  5: "Au café-restaurant — repaso de la semana 1",
  6: "À table — el restaurante completo",
  7: "Au supermarché — hacer las compras",
  8: "Les courses — cantidades y precios",
  9: "Le métro de Paris — transporte público",
  10: "En taxi et en ville — moverse por la ciudad",
};

export const TUTOR_SCENARIOS: Record<number, TutorScenario> = {
  1: {
    role: "serveuse en un café parisino; el alumno es un cliente que acaba de sentarse",
    opener_fr: "Bonjour ! Bienvenue au café Liberté. Vous désirez ?",
    opener_es: "¡Hola! Bienvenido al café Liberté. ¿Qué desea?",
    objectives: [
      "Saluda y pide una bebida con cortesía (« Je voudrais… »)",
      "Pide algo de comer",
      "Pide la cuenta y despídete",
    ],
  },
  2: {
    role: "serveuse en un restaurante; el alumno no sabe qué elegir",
    opener_fr: "Bonsoir ! Voici la carte. Qu'est-ce que vous préférez : viande ou poisson ?",
    opener_es: "¡Buenas noches! Aquí está la carta. ¿Qué prefiere: carne o pescado?",
    objectives: [
      "Di qué prefieres (« Je préfère… »)",
      "Pide una recomendación (« Qu'est-ce que vous recommandez ? »)",
      "Decide qué probar (« Je vais essayer… »)",
    ],
  },
  3: {
    role: "serveuse en un restaurante; el alumno viene a cenar",
    opener_fr: "Bonsoir ! Vous avez choisi ? Qu'est-ce que je vous sers ?",
    opener_es: "¡Buenas noches! ¿Ya eligió? ¿Qué le sirvo?",
    objectives: [
      "Pide un plato principal y una bebida",
      "Pide la cuenta (« L'addition, s'il vous plaît »)",
      "Pregunta si puedes pagar con tarjeta",
    ],
  },
  4: {
    role: "amiga francesa de visita en un mercado; charlan sobre comida",
    opener_fr: "Regarde tout ça ! Qu'est-ce que tu aimes manger, toi ?",
    opener_es: "¡Mira todo esto! ¿A ti qué te gusta comer?",
    objectives: [
      "Di qué te gusta comer (« J'aime… »)",
      "Describe un alimento (« C'est… »)",
      "Pregúntale a Lib qué le gusta a ella",
    ],
  },
  5: {
    role: "serveuse en un café-restaurante; gran repaso de la semana",
    opener_fr: "Bonjour ! Installez-vous. Qu'est-ce que je vous sers aujourd'hui ?",
    opener_es: "¡Hola! Siéntese. ¿Qué le sirvo hoy?",
    objectives: [
      "Pide una bebida y algo de comer con cortesía",
      "Haz una pregunta al serveur (precio, recomendación…)",
      "Paga y despídete como un parisino",
    ],
  },
  6: {
    role: "serveuse en un restaurante elegante; la experiencia completa",
    opener_fr: "Bonsoir ! Vous avez une réservation ?",
    opener_es: "¡Buenas noches! ¿Tiene una reserva?",
    objectives: [
      "Pide una mesa para dos",
      "Pide un menú completo (entrada, plato, bebida)",
      "Reacciona a la comida (« C'est délicieux ! »)",
    ],
  },
  7: {
    role: "empleada de un supermercado francés; el alumno hace las compras",
    opener_fr: "Bonjour ! Je peux vous aider ? Vous cherchez quelque chose ?",
    opener_es: "¡Hola! ¿Puedo ayudarle? ¿Busca algo?",
    objectives: [
      "Pregunta dónde está un producto (« Où est… ? »)",
      "Pide una cantidad (« Je voudrais un kilo de… »)",
      "Pregunta el precio",
    ],
  },
  8: {
    role: "vendedora en un marché francés; puesto de frutas y verduras",
    opener_fr: "Bonjour ! Regardez mes beaux fruits ! Qu'est-ce qu'il vous faut ?",
    opener_es: "¡Hola! ¡Mire mis lindas frutas! ¿Qué necesita?",
    objectives: [
      "Pide dos productos con cantidades",
      "Pregunta cuánto cuesta (« Combien coûte… ? »)",
      "Repite el precio para confirmar y paga",
    ],
  },
  9: {
    role: "agente del métro de Paris en la taquilla; el alumno necesita viajar",
    opener_fr: "Bonjour ! Je peux vous aider ? Où allez-vous ?",
    opener_es: "¡Hola! ¿Puedo ayudarle? ¿A dónde va?",
    objectives: [
      "Compra un billete (« Je voudrais un ticket… »)",
      "Pregunta cómo llegar a un lugar (« Pour aller à… ? »)",
      "Confirma la línea o dirección y agradece",
    ],
  },
  10: {
    role: "chauffeur de taxi parisino; el alumno sube al taxi",
    opener_fr: "Bonjour ! Montez, montez ! Vous allez où aujourd'hui ?",
    opener_es: "¡Hola! ¡Suba, suba! ¿A dónde va hoy?",
    objectives: [
      "Di a dónde vas (« Je vais à… »)",
      "Pregunta cuánto cuesta o cuánto tarda",
      "Paga y despídete",
    ],
  },
};

type VocabRow = { fr: string; es: string };
type GrammarRow = { formula: string; use: string };

const asVocab = (rows: { fr: string; es: string }[]): VocabRow[] =>
  rows.map((v) => ({ fr: v.fr, es: v.es }));
const asGrammar = (rows: GrammarRow[]): string[] => rows.map((g) => `${g.formula} — ${g.use}`);

const CONTEXTS: Record<number, { vocab: VocabRow[]; grammar: string[] }> = {
  1: {
    vocab: asVocab(day1Vocabulary),
    grammar: day1GrammarPairs.map((p) => `Di « ${p.right} » (no « ${p.wrong} »)`),
  },
  2: { vocab: asVocab(day2Vocabulary), grammar: asGrammar(day2GrammarStructures) },
  3: { vocab: asVocab(day3Vocabulary), grammar: asGrammar(day3GrammarStructures) },
  4: { vocab: asVocab(day4Vocabulary), grammar: asGrammar(day4GrammarStructures) },
  5: { vocab: asVocab(day5Vocabulary), grammar: asGrammar(day5GrammarStructures) },
  6: { vocab: asVocab(day6Vocabulary), grammar: asGrammar(day6GrammarStructures) },
  7: { vocab: asVocab(day7Vocabulary), grammar: asGrammar(day7GrammarStructures) },
  8: { vocab: asVocab(day8Vocabulary), grammar: asGrammar(day8GrammarStructures) },
  9: { vocab: asVocab(day9Vocabulary), grammar: asGrammar(day9GrammarStructures) },
  10: { vocab: asVocab(day10Vocabulary), grammar: asGrammar(day10GrammarStructures) },
};

// Days 11-20 (weeks 3-4): topics, scenarios and learning context all come from
// the WEEK34 code data (each day carries a `tutor` block generated alongside its
// lesson content). Registered into the same maps days 1-10 use, so the tutor
// treats them identically. Objectives are capped at 3 (the scene UI's model filter
// only renders the first three).
for (const [key, d] of Object.entries(WEEK34)) {
  const id = Number(key);
  TUTOR_DAY_TOPICS[id] = d.tutor.topic;
  TUTOR_SCENARIOS[id] = {
    role: d.tutor.role,
    opener_fr: d.tutor.opener_fr,
    opener_es: d.tutor.opener_es,
    objectives: d.tutor.objectives.slice(0, 3),
  };
  CONTEXTS[id] = {
    vocab: asVocab(d.vocabulary),
    grammar: asGrammar(d.grammar),
  };
}

export const TUTOR_MAX_DAY = 20;

export function getTutorDayContext(dayId: number): TutorDayContext {
  const id = Math.max(1, Math.min(TUTOR_MAX_DAY, Math.round(dayId) || 1));
  const ctx = CONTEXTS[id];
  return {
    dayId: id,
    topic: TUTOR_DAY_TOPICS[id] ?? "Francés cotidiano",
    scenario: TUTOR_SCENARIOS[id],
    vocab: ctx.vocab,
    grammar: ctx.grammar,
  };
}
