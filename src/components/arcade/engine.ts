/**
 * The shared engine behind Month 3's real-time vocabulary games.
 *
 * The client rejected the existing activities as "all the same and boring" and
 * pointed at a Wordwall whack-a-mole with a Minecraft skin — a REAL-TIME game:
 * targets appear, you tap the right ones against a clock, wrong taps cost you,
 * and it is dressed in a theme. Everything here exists so each game is only its
 * own mechanic, not its own game loop.
 *
 * Rendering is plain DOM + CSS transforms, deliberately, not <canvas>: the
 * targets carry FRENCH WORDS and legibility is the whole point of the exercise.
 * Canvas text on a phone is blurrier, needs manual layout for accents and
 * wrapping, and loses text selection and screen-reader access for nothing —
 * there are at most ~12 moving nodes, which CSS transforms handle at 60fps.
 */

/**
 * `example` and `emoji` are optional: Month 3's words come straight from the
 * client's dictionary, which has a phrase for every word but no icon. Requiring
 * an emoji would have every target wear the same blue circle, which steals width
 * from the French word and tells the student nothing.
 */
export type VocabItem = { fr: string; es: string; example?: string; emoji?: string };

/** One thing on screen the student can tap. */
export type Target = {
  id: number;
  /** What is written on it — the FRENCH word, always. */
  label: string;
  emoji: string;
  correct: boolean;
  /** 0-1 within the play area, so the layout is resolution-independent. */
  x: number;
  y: number;
  /** ms when it appeared / when it leaves, on the loop's own clock. */
  bornAt: number;
  diesAt: number;
};

export type Round = {
  /** The Spanish meaning being asked for — the prompt is in the language she
   *  HAS, the answer in the language she is learning. Recall, not recognition. */
  promptEs: string;
  /** The French word that is correct for this prompt (used for audio + review). */
  answerFr: string;
  targets: Target[];
};

/* ---------------- fairness ----------------
 *
 * A timer is fun for a gamer and cruel for a beginner. These numbers are the
 * policy, in one place, so it can be argued with:
 *
 *  - A word seen twice takes an adult beginner several seconds to decode, so a
 *    target lives for LIFETIME_MS, not the ~1s a reflex game would use.
 *  - A wrong tap costs TIME, never points and never a life. Losing progress for
 *    guessing is what makes a learner stop guessing — and guessing, then being
 *    corrected, is how vocabulary is actually learned.
 *  - Difficulty adapts on ACCURACY, not speed, so a slow careful student is
 *    rewarded and a fast careless one is not.
 */
export const ROUND_MS = 75_000;
export const LIFETIME_MS = { easy: 5200, mid: 4200, hard: 3400 } as const;
export const SPAWN_MS = { easy: 1500, mid: 1150, hard: 900 } as const;
export const WRONG_TAP_PENALTY_MS = 1500;
/** Consecutive hits before the game steps up; misses step it straight back. */
export const LEVEL_UP_STREAK = 4;

export type Difficulty = keyof typeof LIFETIME_MS;

export function nextDifficulty(current: Difficulty, streak: number, missed: boolean): Difficulty {
  if (missed) return current === "hard" ? "mid" : "easy";
  if (streak > 0 && streak % LEVEL_UP_STREAK === 0) {
    return current === "easy" ? "mid" : "hard";
  }
  return current;
}

/* ---------------- deterministic shuffling ----------------
 *
 * Seeded so a given day always builds the same rounds: a student who replays
 * gets the same words in the same order, which is spacing, not novelty for its
 * own sake. It also makes the games testable.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: T[], rnd: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A stable seed per day, so the same day is the same game every time. */
export function daySeed(dayId: string | number, salt = 0): number {
  const n = Number(dayId) || 0;
  return (n * 2654435761 + salt * 40503) >>> 0;
}

/* ---------------- building rounds from the day's own words ---------------- */

/**
 * Distractors must never be accidentally correct.
 *
 * Wordwall can pick any wrong item because its sets are hand-authored. Here the
 * wrong answers come from the same day's vocabulary, so a word that happens to
 * be a valid translation of the prompt — synonyms, or two entries sharing an
 * `es` gloss — would make the game unwinnable and teach the student that she was
 * wrong when she was right.
 */
/**
 * The meanings a gloss actually offers.
 *
 * The client writes multi-sense glosses — « ganas / prisa », « padre / madre »,
 * « porvenir / futuro » — so comparing whole strings misses the overlap: for the
 * prompt "ganas", « hâte » was served as a WRONG answer against « envie », and
 * a student who tapped it was told she failed when she was right. Measured on
 * the real Month-3 data: 35 such pairs.
 *
 * Tokens shorter than 3 characters are dropped, and that is load-bearing too: a
 * naive split leaves the gender marker in « profesor/a » and « alumno/a », whose
 * shared "a" would ban « élève » as a distractor for « professeur » — two words
 * that mean completely different things. Over-blocking starves the round of
 * decoys just as surely as under-blocking teaches the wrong lesson.
 */
function glossSenses(es: string): Set<string> {
  return new Set(
    es
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\(.*?\)/g, "") // "(personal)", "(de clase)" are disambiguators
      .split(/[\/,;]| o /)
      .map((x) => x.replace(/[^a-z ]/g, " ").trim())
      .filter((x) => x.length >= 3),
  );
}

function isSafeDistractor(candidate: VocabItem, answer: VocabItem): boolean {
  if (candidate.fr === answer.fr) return false;
  const senses = glossSenses(answer.es);
  for (const s of glossSenses(candidate.es)) if (senses.has(s)) return false;
  return true;
}

/**
 * Build the round list for one game from the 30 vocabulary items a day already
 * has. No new authored content: that is what makes this deployable across every
 * Month 3 day the moment the content lands.
 */
export function buildRounds(
  vocab: VocabItem[],
  opts: { seed: number; decoys: number; rounds?: number },
): Round[] {
  const usable = vocab.filter((v) => v && v.fr && v.es);
  if (usable.length < 4) return [];
  const rnd = mulberry32(opts.seed);
  const order = shuffled(usable, rnd);
  const count = Math.min(opts.rounds ?? order.length, order.length);
  const rounds: Round[] = [];

  for (let i = 0; i < count; i++) {
    const answer = order[i];
    const pool = shuffled(
      usable.filter((v) => isSafeDistractor(v, answer)),
      rnd,
    ).slice(0, opts.decoys);
    // Not enough distinct meanings on this day to make a fair round.
    if (pool.length < Math.min(2, opts.decoys)) continue;
    rounds.push({
      promptEs: answer.es,
      answerFr: answer.fr,
      targets: shuffled([answer, ...pool], rnd).map((v, k) => ({
        id: k,
        label: v.fr,
        emoji: v.emoji ?? "",
        correct: v.fr === answer.fr,
        x: 0,
        y: 0,
        bornAt: 0,
        diesAt: 0,
      })),
    });
  }
  return rounds;
}

/* ---------------- scoring ---------------- */

export type Score = { hits: number; misses: number; best: number; streak: number };

export const emptyScore = (): Score => ({ hits: 0, misses: 0, best: 0, streak: 0 });

export function accuracy(s: Score): number {
  const total = s.hits + s.misses;
  return total === 0 ? 0 : Math.round((s.hits / total) * 100);
}

/**
 * Stars for a round. Deliberately generous and never zero for finishing: the
 * point is to come back tomorrow, and a beginner who played for 75 seconds has
 * done the practice even if her accuracy was poor.
 */
export function starsFor(s: Score): number {
  if (s.hits === 0) return 0;
  const acc = accuracy(s);
  if (acc >= 80 && s.hits >= 8) return 3;
  if (acc >= 60) return 2;
  return 1;
}

/* ---------------- phrase rounds (the grammar half) ---------------- */

/**
 * The client's document gives, for every word, a real sentence that USES it —
 * and those sentences are the day's grammar in action (« Mon frère est né trois
 * ans après moi » IS the passé composé avec être). Blanking the word turns each
 * one into a round that cannot be won without reading the French.
 */
export type PhraseRound = {
  /** The sentence with the target replaced by a blank. */
  masked: string;
  /** What belongs in the blank. */
  answer: string;
  /** Spanish translation of the whole sentence, shown as the prompt. */
  promptEs: string;
  targets: Target[];
};

/** Replace the first occurrence of `word` (accent- and case-insensitive). */
function maskWord(phrase: string, word: string): string | null {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const p = norm(phrase);
  const w = norm(word);
  const at = p.indexOf(w);
  if (at < 0) return null;
  return phrase.slice(0, at) + "____" + phrase.slice(at + word.length);
}

/**
 * Build gap-fill rounds from the day's own phrases.
 *
 * Only words the phrase actually contains verbatim can be blanked — French
 * inflects, so « naître » appears as « né » and cannot be masked cleanly. Those
 * are skipped rather than mangled: a broken blank teaches nothing.
 */
export function buildPhraseRounds(
  vocab: (VocabItem & { exampleEs?: string })[],
  opts: { seed: number; decoys: number; rounds?: number },
): PhraseRound[] {
  const rnd = mulberry32(opts.seed);
  const usable = vocab.filter((v) => v.fr && v.example && maskWord(v.example, v.fr));
  const order = shuffled(usable, rnd);
  const out: PhraseRound[] = [];
  for (const item of order.slice(0, opts.rounds ?? order.length)) {
    const masked = item.example ? maskWord(item.example, item.fr) : null;
    if (!masked) continue;
    const pool = shuffled(
      usable.filter((v) => v.fr !== item.fr),
      rnd,
    ).slice(0, opts.decoys);
    if (pool.length < 2) continue;
    out.push({
      masked,
      answer: item.fr,
      promptEs: (item as { exampleEs?: string }).exampleEs ?? item.es,
      targets: shuffled([item, ...pool], rnd).map((v, k) => ({
        id: k,
        label: v.fr,
        emoji: v.emoji ?? "",
        correct: v.fr === item.fr,
        x: 0,
        y: 0,
        bornAt: 0,
        diesAt: 0,
      })),
    });
  }
  return out;
}
