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

export type TutorDayContext = {
  dayId: number;
  topic: string;
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

export const TUTOR_MAX_DAY = 10;

export function getTutorDayContext(dayId: number): TutorDayContext {
  const id = Math.max(1, Math.min(TUTOR_MAX_DAY, Math.round(dayId) || 1));
  const ctx = CONTEXTS[id];
  return {
    dayId: id,
    topic: TUTOR_DAY_TOPICS[id] ?? "Francés cotidiano",
    vocab: ctx.vocab,
    grammar: ctx.grammar,
  };
}
