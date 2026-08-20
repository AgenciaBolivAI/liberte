// MES 2 — grammar points the Mapa specifies that the platform never taught.
//
// The 600-entry vocabulary audit passed 600/600, but the "Gramática del día"
// column did not: four concepts the client's map assigns to specific days were
// absent from the whole month. This ADDS them on the day the document names.
// Nothing is deleted — the existing cards stay, so no day loses material.
//
//   D3  -> Jour 23  Adjectifs possessifs   (doc: "possessifs + COD básico";
//                                           the app had only the COD half)
//   D11 -> Jour 31  Les 4 verbes piliers   (être/avoir/faire/pouvoir — the
//                                           auxiliaries Mes 3 depends on)
//   D19 -> Jour 39  Depuis + présent · On = nous
//   D20 -> Jour 40  Adverbes d'intensité
//
// Every formula, example, trap and pronunciation below is transcribed from the
// client's document (Mapa Mes 2, columns "Fórmula/Ejemplos", "Cómo explicarlo",
// "Error a evitar", "Pronunciación clave"). Nothing is invented.
//
// Run: node scripts/seed-month2-grammar-gaps.mjs
import { readFileSync, writeFileSync } from "node:fs";

/** New grammar cards per app day, inserted at the FRONT (they are the day's
 *  headline point in the document). `marker` makes the script idempotent. */
const ADDITIONS = {
  23: {
    marker: "mon/ma/mes",
    cards: [
      {
        formula: "mon/ma/mes · ton/ta/tes · son/sa/ses · notre/nos · votre/vos · leur/leurs + nom",
        use: "El posesivo concuerda con el OBJETO POSEÍDO, no con quien posee: « ma mère » (madre, femenino) pero « mon père » (padre, masculino). C'est mon médecin. · C'est ma secrétaire. · Son numéro est le 06 12 34 56. · Nos voisins font du bruit. · Votre rendez-vous est confirmé. En un mensaje de voz los posesivos aparecen siempre.",
      },
      {
        formula: "mon + nom féminin commençant par une voyelle",
        use: "Excepción fonética: « mon amie », « mon adresse » — nunca « ma amie », solo para que suene bien. ⚠️ Error clásico: concordar con el poseedor → *ma père; lo correcto es mon père. Pronunciación: mon [mɔ̃] · ma [ma] · mes [me] · son [sɔ̃] · sa [sa] · notre [nɔtʁ] · votre [vɔtʁ].",
      },
    ],
  },
  27: {
    marker: "C'est + article + nom",
    cards: [
      {
        formula: "C'est + article + nom · C'est + adjectif · Il/Elle est + adjectif · Il/Elle est + profession (sans article)",
        use: "C'EST identifica y presenta: C'est l'appartement idéal. · C'est mon propriétaire. · C'est beau. IL/ELLE EST describe una característica: Il est très lumineux. · Elle est disponible le mois prochain. · Il est au 3e étage. Regla corta: después de un ARTÍCULO → c'est; con un adjetivo solo o una profesión → il/elle est.",
      },
      {
        formula: "Il est professeur (jamais « il est un professeur »)",
        use: "⚠️ Los tres errores clásicos: *Il est l'appartement → C'est l'appartement. · *Il est un professeur → Il est professeur (la profesión va SIN artículo). · Confundir c'est (presentar) con il est (describir). Pronunciación: c'est [sɛ] · il est [ilɛ] · elle est [ɛlɛ] · c'est beau [sɛbo].",
      },
    ],
  },
  31: {
    marker: "verbes piliers",
    cards: [
      {
        formula: "Les 4 verbes piliers — être · avoir · faire · pouvoir",
        use: "ÊTRE: suis/es/est/sommes/êtes/sont — identidad y estado (Je suis client de la Banque de France). AVOIR: ai/as/a/avons/avez/ont — posesión (J'ai un compte courant). FAIRE: fais/fais/fait/faisons/faites/font — acciones (Je fais un virement de 200€). POUVOIR: peux/peux/peut/pouvons/pouvez/peuvent — posibilidad y permiso (Vous pouvez m'aider ?).",
      },
      {
        formula: "avoir + sensation (jamais être)",
        use: "⚠️ El error que más delata: j'ai chaud (NO « je suis chaud ») · j'ai faim (NO « je suis faim ») · j'ai besoin de (NO « je suis besoin »). Y no confundas « je vais faire » (futur proche) con « je fais » (présent). Pronunciación: je suis [ʒəsɥi] · j'ai [ʒɛ] · je fais [ʒəfɛ] · je peux [ʒəpø] · nous pouvons [nupuvɔ̃].",
      },
      {
        formula: "être + avoir = les auxiliaires du passé (Mes 3)",
        use: "Dominar estos cuatro ahora es la mejor inversión del mes: a partir del Mes 3, être y avoir se convierten en los auxiliares del passé composé. Todo el pasado del francés se apoya en ellos.",
      },
    ],
  },
  36: {
    marker: "BAPNE",
    cards: [
      {
        formula: "masc: adj · fém: adj+e · plur masc: adj+s · plur fém: adj+es",
        use: "El adjetivo concuerda en género y número: une robe bleue · des chaussures bleues. Irregulares que hay que saberse: beau→belle, nouveau→nouvelle, vieux→vieille, bon→bonne. Ante vocal, beau→bel: un bel article.",
      },
      {
        formula: "BAPNE + nom (l'adjectif AVANT le nom)",
        use: "Casi todos los adjetivos van DESPUÉS del nombre, pero los BAPNE van antes: Beau/Bon/Mauvais · Ancien/Autre · Petit/Premier/Prochain · Nouveau/Nombreux · Grand/Gros/Jeune/Joli/Long/Vieux. un beau manteau · une petite boutique · un bon prix · de nouveaux modèles · de vieilles chaussures.",
      },
      {
        formula: "couleurs composées = invariables",
        use: "⚠️ *un magasin grand → un grand magasin (BAPNE). *un beau homme → un bel homme (ante vocal). *une bonne prix → un bon prix (prix es masculino). Y los colores compuestos NO concuerdan: une robe bleu marine (nunca « bleue marine »). Pronunciación: beau [bo] · belle [bɛl] · bel [bɛl] · nouveau [nuvo] · nouvelle [nuvɛl] · vieux [vjø] · vieille [vjɛj] · bon [bɔ̃] · bonne [bɔn].",
      },
    ],
  },
  38: {
    marker: "nom + qui + verbe",
    cards: [
      {
        formula: "nom + qui + verbe (sujet) · nom + que/qu' + sujet + verbe (objet direct)",
        use: "Los relativos unen dos frases y eliminan la repetición. QUI sustituye al SUJETO (el que hace la acción): « Le vol part à 14h » → Le vol qui part à 14h est annulé. QUE sustituye al OBJETO DIRECTO (el que la recibe): « J'ai perdu ma valise » → La valise que j'ai perdue est bleue. C'est l'agent qui s'occupe des bagages. · C'est la compagnie qu'on a choisie.",
      },
      {
        formula: "truco: il/elle → qui · le/la/les → que",
        use: "Si puedes sustituirlo por il/elle/ils/elles, es QUI. Si puedes sustituirlo por le/la/les, es QUE. ⚠️ *le vol que part → le vol qui part (es sujeto). *la valise qui j'ai perdue → la valise que j'ai perdue (es objeto). Y no olvides la elisión: *la valise que elle → la valise qu'elle. Pronunciación: qui [ki] · que [kə] · qu' [k] ante vocal · qui part [kipaʁ].",
      },
    ],
  },
  39: {
    marker: "depuis + durée",
    cards: [
      {
        formula: "sujet + verbe au PRÉSENT + depuis + durée",
        use: "La acción empezó en el pasado y CONTINÚA ahora, así que el francés usa PRESENTE donde el español dice « llevo… »: J'attends depuis 20 minutes. · Le train est en retard depuis midi. · On est ensemble depuis 3 ans. ⚠️ Jamás el pasado con depuis: *j'ai attendu depuis 20 minutes → j'attends depuis 20 minutes. No lo confundas con « il y a » (momento ya terminado).",
      },
      {
        formula: "On + verbe à la 3e personne (= nous)",
        use: "« On » sustituye casi siempre a « nous » en la conversación oral — es lo natural, el francés vivo: On part demain matin. · Ça fait longtemps qu'on attend sur ce quai. ⚠️ On va SIEMPRE en singular: on part (nunca « on partons »). Pronunciación: depuis [dəpɥi] · on [ɔ̃] · ça fait [safɛ] · on attend [ɔ̃natɑ̃].",
      },
    ],
  },
  40: {
    marker: "verbe + beaucoup",
    cards: [
      {
        formula: "très / trop / assez / vraiment / plutôt + adjectif · verbe + beaucoup",
        use: "TRÈS = muy (neutro). TROP = demasiado, supera el límite (matiz negativo). ASSEZ = bastante/suficiente. VRAIMENT = de verdad (énfasis emocional). PLUTÔT = más bien (matiz de evaluación). Ce billet est très cher. · Ce siège est trop petit. · Je suis assez fatigué de ce voyage. · Elle est vraiment aimable. · C'est plutôt confortable.",
      },
      {
        formula: "beaucoup ne modifie JAMAIS un adjectif",
        use: "⚠️ *c'est beaucoup bien → c'est très bien. « Beaucoup » solo acompaña verbos: Il parle beaucoup, ce contrôleur ! · Tu travailles vraiment beaucoup. Ojo también con « c'est trop bien ! » (coloquial, oral) — en escrito formal usa très, y « c'est assez bon » puede sonar mediocre según el contexto. Pronunciación: très [tʁɛ] · trop [tʁo] · assez [ase] · beaucoup [boku] · vraiment [vʁɛmɑ̃] · plutôt [plyto].",
      },
    ],
  },
};

/* ---------------- 1. Patch the code data module ---------------- */
const path = "src/data/month2.ts";
const src = readFileSync(path, "utf8");
const start = src.indexOf("= {", src.indexOf("export const MONTH2"));
const header = src.slice(0, start + 2);
const MONTH2 = JSON.parse(
  src
    .slice(start + 2)
    .replace(/;\s*$/, "")
    .trim(),
);

let added = 0;
for (const [day, spec] of Object.entries(ADDITIONS)) {
  const d = MONTH2[day];
  if (!d) throw new Error(`month2.ts has no day ${day}`);
  const already = (d.grammar ?? []).some((g) => `${g.formula} ${g.use}`.includes(spec.marker));
  if (already) {
    console.log(`day ${day}: already present, skipped`);
    continue;
  }
  d.grammar = [...spec.cards, ...(d.grammar ?? [])];
  added += spec.cards.length;
  console.log(`day ${day}: +${spec.cards.length} cards (now ${d.grammar.length})`);
}

// `header` already ends with "= " — an extra space here produced "=  {", which
// broke every consumer that finds the object with indexOf("= {").
writeFileSync(path, `${header}${JSON.stringify(MONTH2, null, 2)};
`);

/* ---------------- 2. Migration for the live rich content ---------------- */
const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
let sql =
  "-- Mes 2 — the grammar points the client's Mapa specifies that were missing.\n" +
  "-- Adds them at the front of each day's grammar; nothing is removed.\n" +
  "-- Idempotent: re-running replaces the same days with the same content.\n\nBEGIN;\n";
for (const day of Object.keys(ADDITIONS)) {
  sql +=
    `UPDATE public.authored_days\n` +
    `   SET rich = jsonb_set(rich, '{grammar}', ${sqlStr(JSON.stringify(MONTH2[day].grammar))}::jsonb)\n` +
    ` WHERE day_id = ${day} AND rich IS NOT NULL;\n`;
}
sql += "COMMIT;\n";
const out = "supabase/migrations/20260817000000_month2_grammar_gaps.sql";
writeFileSync(out, sql);
console.log(`\nWrote ${out} · ${added} new grammar cards total`);
