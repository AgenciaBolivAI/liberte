/**
 * Is this text French?
 *
 * The product rule: Liberté teaches French, so an answer written in Spanish or
 * Portuguese is not a weak answer — it is not an answer, and the platform must
 * not pretend to understand it. Spoken answers are checked against the audio
 * itself (whisper reports the language); written answers have only the words,
 * so this decides on them.
 *
 * Deliberately three-valued. "unsure" exists because a short, correct French
 * answer — « Trois. », « À huit heures. » — carries no distinctive marker at
 * all, and refusing those would punish exactly the students who did the work.
 * Callers refuse "not-french" and let "unsure" through to normal correction.
 *
 * Validated against every French string in the curriculum
 * (`npm run audit:text`): not one of them may come back "not-french".
 */

export type Frenchness = "french" | "not-french" | "unsure";

/**
 * Tokenise on real letters, accents included.
 *
 * NEVER use `\b` for this. JavaScript's word boundary is ASCII-only, so an
 * accented letter counts as a separator and `/\bsé\b/` matches INSIDE
 * « sécurité », `/\bél\b/` inside « télécharger ». That single mistake had the
 * detector refusing 15 real French strings from the course — exactly the
 * students who did the work. Exact whole-token matching cannot do that.
 */
function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-zà-öø-ÿ']+/i)
    .flatMap((t) => t.split("'"))
    .filter(Boolean);
}

/** Letters French orthography does not have — strong evidence, not a veto: a
 *  Spanish surname (« au nom de García ») must not condemn a French sentence. */
const NON_FRENCH_LETTERS = /[ãõñáíóúÁÍÓÚÃÕÑ¿¡]/;

/** Letters Spanish and Portuguese do not have. `é è à ç` are NOT here — they
 *  are shared ("sé", "qué", "está", "você") and would vouch for Spanish. */
const FRENCH_ONLY_LETTERS = /[êëîïûùÿœæ]/i;

/** Elision (j', l', d', qu', n', m', s', c', t') is a French fingerprint. */
const FRENCH_ELISION = /(^|[^a-zà-ÿ])[jlndmstc]'|(^|[^a-zà-ÿ])qu'/i;

/** Text invented from noise in another script — that IS conclusive. */
const OTHER_SCRIPT = /[Ѐ-ӿ一-鿿؀-ۿ]/;

/**
 * Everyday French words that are NOT also everyday Spanish or Portuguese
 * words. "la", "que", "si", "un", "en", "son", "bien", "entre", "para" and
 * friends are excluded on purpose: they are shared, and would vouch for a
 * Spanish answer.
 */
const FRENCH_TOKENS = new Set(
  ("je j il elle nous vous ils elles les des une du au aux est sont êtes suis avez avons ont " +
   "avec dans pour qui quoi ne pas très oui fois semaine jour jours heure heures bonjour bonsoir " +
   "merci madame monsieur voudrais prendre aller faire allez comment pourquoi beaucoup aujourd " +
   "demain matin soir toujours jamais peux veux dois plaît voilà alors mais donc parce puis " +
   "être avoir vais allons veut peut doit chez déjà encore aussi assez trop moins mieux " +
   "maintenant après avant pendant depuis chaque tout toute toutes tous quelque quelques " +
   "leur leurs notre nos votre vos mon ton cordialement salutations").split(" "),
);

/**
 * Spanish / Portuguese tokens that are NOT French words. Every entry is checked
 * by `npm run audit:text` against the whole curriculum: if one of them ever
 * appears inside real course French, the audit fails and it must come out.
 */
const ES_PT_TOKENS = new Set(
  ("sí muy pero porque cuando cuándo dónde donde quiero quieres tengo tienes tiene soy eres " +
   "estoy estás está están hola gracias también ahora siempre nunca mucho mucha muchos poco " +
   "hoy ayer yo él nosotros ustedes usted qué quién cuál cómo entiendo entender sé saber " +
   "decir hablar puedo puede vamos voy nada todo toda hacer cosa gente año años más así " +
   "aquí allí eso esto esa ese dice dijo ser estar del los las unos unas desde hasta después " +
   "antes otro otra bueno buena mejor peor grande pequeño trabajo casa tiempo vida quiere " +
   "necesito necesita ayuda ayudas ayudar ayudame entiende entiendes aprender estudiar " +
   "con sin pronunciación gramática español inglés francés practicar hablo hablas " +
   "não você obrigado obrigada muito sim com uma eu ele ela nós isso aquilo fazer dizer tem " +
   "são pelo pela mas onde tudo coisa ano aqui ali " +
   "buenos buenas días noches tardes señor señora señorita por favor perdón disculpe " +
   "claro vale verdad razón manera lugar mismo cada algo alguien nadie").split(" "),
);

function score(text: string): { fr: number; es: number } {
  let fr = 0;
  let es = 0;
  for (const t of tokens(text)) {
    if (FRENCH_TOKENS.has(t)) fr++;
    if (ES_PT_TOKENS.has(t)) es++;
  }
  if (FRENCH_ONLY_LETTERS.test(text)) fr += 2;
  if (FRENCH_ELISION.test(text)) fr += 2;
  // A Spanish letter next to Spanish words is conclusive; a Spanish letter in
  // text that ALSO has French evidence is a proper noun (« au nom de García »)
  // and must not condemn the sentence. But a Spanish letter with NO French
  // evidence at all is Spanish: « Me ayudas con la pronunciación » was slipping
  // through as "unsure" because none of its words were on either list.
  if (NON_FRENCH_LETTERS.test(text) && (es > 0 || fr === 0)) es += 2;
  return { fr, es };
}

export function frenchness(text: string): Frenchness {
  const s = (text ?? "").trim();
  if (!s) return "unsure";
  if (OTHER_SCRIPT.test(s)) return "not-french";

  const { fr, es } = score(s);
  if (es > fr) return "not-french";
  if (fr > 0) return "french";
  // No evidence either way — a bare « Trois. » or « Au revoir ». Let the normal
  // correction handle it rather than refuse a genuine attempt.
  return "unsure";
}

/** Convenience for call sites that only care about the refusal. */
export function isNotFrench(text: string): boolean {
  return frenchness(text) === "not-french";
}
