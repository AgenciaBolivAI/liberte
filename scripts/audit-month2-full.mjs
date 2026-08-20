// AUDIT COMPLETO — Mapa Mes 2 «JE COMPRENDS» vs. la plataforma.
//
// El auditor hermano (audit-month2-dictionary.mjs) cubre vocabulario y
// gramática. Éste cubre el resto de columnas del Mapa:
//   · Objetivo comunicativo del día
//   · Dinámica (roleplay / juego)
//   · Prompt IA
//   · Mini reto + entregable al coach
//
// Método: cada día define marcadores DISTINTIVOS sacados del documento que
// tienen que aparecer sí o sí si el contenido es el correcto. Se busca cada
// marcador en el campo de la app que corresponde a esa columna. Se informa
// exactamente qué falta — no se aprueba nada "por parecido".
//
// Run: node scripts/audit-month2-full.mjs
import { readFileSync } from "node:fs";

const norm = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’ʼ]/g, "'")
    .toLowerCase();

/** doc day -> markers per dimension. `|` inside a marker = any-of. */
const SPEC = {
  1:  { obj: ["appel|llamada", "formel|formal"],        din: ["accueil|recepcion|recept|standard"],      ia: ["accueil|recepcion|recept|standard"],       reto: ["message|mensaje"] },
  2:  { obj: ["rendez-vous|cita"],                      din: ["salut|formel|informal"],        ia: ["rendez-vous|cita"],              reto: ["confirm"] },
  3:  { obj: ["vocal|buzon|repondeur"],                 din: ["vocal|repondeur|message"],      ia: ["vocal|message"],                 reto: ["motif|motivo|numero"] },
  4:  { obj: ["toniq|moi|toi|lui"],                     din: ["demain|ce soir|aujourd|plus tard"],           ia: ["repet|aclarac|compris"],         reto: ["moi|toi|lui"] },
  5:  { obj: ["courriel|email|correo"],                 din: ["courriel|email|correo"],        ia: ["courriel|email|correo"],         reto: ["objet|asunto|sujet"] },
  6:  { obj: ["courriel|email|correo"],                 din: ["erreur|error"],                 ia: ["appartement|logement|correo"],   reto: ["cordialement|cierre|formel"] },
  7:  { obj: ["appartement|logement"],                  din: ["immobil|agence|appartement"],   ia: ["appartement|immobil"],           reto: ["loyer|precio|prix|caution"] },
  8:  { obj: ["compar"],                                din: ["compar"],                       ia: ["compar"],                        reto: ["plus|moins|aussi"] },
  9:  { obj: ["voisin|vecino"],                         din: ["voisin|vecino"],                ia: ["voisin|vecino"],                 reto: ["reglement|norma|immeuble"] },
  10: { obj: ["bruit|ruido|voisin"],                    din: ["bruit|ruido"],                  ia: ["bruit|ruido"],                   reto: ["lui|leur"] },
  11: { obj: ["banque|banco|compte"],                   din: ["etre|avoir|faire|pouvoir"],     ia: ["banc|conseiller|compte"],        reto: ["etre|avoir|faire|pouvoir"] },
  12: { obj: ["cod|le/la/les|pronom"],                  din: ["cod|activ", "carte|tarjeta"],         ia: ["cod|carte|rib|releve"],          reto: ["cod|le|la|les"] },
  13: { obj: ["colis|paquete|poste"],                   din: ["colis|poste|paquete"],          ia: ["colis|poste|venir de"],          reto: ["abord|ensuite|enfin"] },
  14: { obj: ["reclam|colis"],                          din: ["dit que|discurso|indirect"],    ia: ["reclam|colis|dit que"],          reto: ["dit que|explique que"] },
  15: { obj: ["ne...plus|jamais|rien|personne|negac"],  din: ["ne...plus|jamais|rien|personne"], ia: ["jamais|rien|personne|plus"],   reto: ["jamais|rien|personne|plus"] },
  16: { obj: ["adjectif|adjetivo|accord|bapne"],        din: ["adjectif|adjetivo|produit"],    ia: ["adjectif|bapne|produit"],        reto: ["adjectif|bapne"] },
  17: { obj: ["aeroport|aeropuerto|vol"],               din: ["est-ce que|inversion|quel"],    ia: ["aeroport|vol|quel"],             reto: ["est-ce que|inversion"] },
  18: { obj: ["relatif|qui (sujet)|qui et que"],        din: ["relatif|qui et que|qui/que"],   ia: ["relatif|qui et que|qui/que"],    reto: ["qui", "que"] },
  19: { obj: ["gare|train|tren"],                       din: ["retard|retraso|depuis"],        ia: ["depuis|on "],                    reto: ["depuis|on "] },
  20: { obj: ["train|tren|defi|reto"],                  din: ["reto final|defi final|3 situa|trois situa"], ia: ["reto final|defi final|situa"], reto: ["reto final|defi final|situa"] },
};

const src = readFileSync("src/data/month2.ts", "utf8");
const s0 = src.indexOf("= {", src.indexOf("export const MONTH2"));
const M2 = JSON.parse(src.slice(s0 + 2).replace(/;\s*$/, "").trim());

const metaSrc = readFileSync("src/data/month2.meta.ts", "utf8");
const m0 = metaSrc.indexOf("= {", metaSrc.indexOf("export const MONTH2_META"));
const metaBlob = metaSrc.slice(m0);

/** Meta is TS with unquoted keys — pull one day's block as raw text. */
function metaTextFor(day) {
  const start = metaBlob.indexOf(`"${day}": {`);
  if (start === -1) return "";
  const end = metaBlob.indexOf(`\n  },`, start);
  return metaBlob.slice(start, end === -1 ? start + 1200 : end);
}

const DIM = ["obj", "din", "ia", "reto"];
const LABEL = {
  obj: "Objetivo del día",
  din: "Dinámica (roleplay/juego)",
  ia: "Prompt IA",
  reto: "Mini reto + entregable",
};

const totals = { obj: 0, din: 0, ia: 0, reto: 0 };
const misses = [];

for (let d = 1; d <= 20; d++) {
  const appDay = String(20 + d);
  const day = M2[appDay];
  const meta = metaTextFor(appDay);
  const t = day.tutor ?? {};

  const corpus = {
    obj: norm([meta, (t.objectives ?? []).join(" "), t.topic].join(" ")),
    din: norm(
      [
        (day.defiSteps ?? []).map((x) => `${x.serveur} ${x.hint} ${x.example}`).join(" "),
        meta,
      ].join(" "),
    ),
    ia: norm([t.role, t.opener_fr, t.opener_es, (t.objectives ?? []).join(" "), t.topic].join(" ")),
    reto: norm([(day.defiCriteria ?? []).join(" "), meta].join(" ")),
  };

  for (const dim of DIM) {
    const need = SPEC[d][dim] ?? [];
    const bad = need.filter((m) => !m.split("|").some((alt) => corpus[dim].includes(norm(alt))));
    if (bad.length === 0) totals[dim] += 1;
    else misses.push({ d, appDay, dim, bad });
  }
}

console.log("\nAUDIT COMPLETO — Mapa Mes 2 vs. plataforma\n");
for (const dim of DIM) {
  console.log(`${totals[dim] === 20 ? "OK " : "!! "}${LABEL[dim].padEnd(28)} ${totals[dim]}/20 días`);
}
if (misses.length) {
  console.log("\nDetalle de lo que no encuentro:");
  for (const m of misses) {
    console.log(`  · doc D${m.d} -> Jour ${m.appDay} · ${LABEL[m.dim]}: falta ${m.bad.join(" , ")}`);
  }
}

/* ---- Structural: the document alternates AUDIO and TEXT deliverables ---- */
const TEXT_DELIVERABLE_DAYS = [2, 3, 5, 6, 8, 10, 12, 14, 15, 16, 18];
console.log(
  `\nEntregable al coach: el documento pide TEXTO escrito en ${TEXT_DELIVERABLE_DAYS.length} de 20 días ` +
    `(D${TEXT_DELIVERABLE_DAYS.join(", D")}).`,
);
