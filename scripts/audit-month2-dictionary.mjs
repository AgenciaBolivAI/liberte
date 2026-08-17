// AUDIT — Diccionario Liberté™ Mes 2 «JE COMPRENDS» (600 entradas) vs. what the
// platform actually ships in src/data/month2.ts.
//
// The client's dictionary assigns 30 entries to each of the 20 month-2 days
// (doc day N = app day 20+N). This file holds the French side of all 600
// entries exactly as the document lists them, so the comparison is repeatable
// and any future drift is caught by re-running it.
//
// Run: node scripts/audit-month2-dictionary.mjs
import { readFileSync } from "node:fs";

/** Doc day (1-20) → its 30 French entries, in document order. */
const DICTIONARY = {
  1: "Allô ?|Bonjour, je vous appelle pour…|Je voudrais parler à…|C'est de la part de qui ?|Ne quittez pas.|la ligne|un appel|rappeler|décrocher|raccrocher|disponible|occupé|un message|laisser un message|le service|la secrétaire|l'accueil|transférer|mettre en attente|formel|vous|s'il vous plaît|un numéro de téléphone|Je suis bien chez… ?|un poste|sonner|un portable|un fixe|Merci d'avoir appelé.|Au revoir.",
  2: "Je voudrais prendre rendez-vous.|Vous avez une disponibilité ?|un créneau|confirmer|annuler|reporter|demain matin|demain après-midi|la semaine prochaine|l'agenda|le motif|votre nom|votre prénom|épeler|noter|Je vous rappelle.|C'est urgent.|Pouvez-vous répéter ?|Je n'ai pas bien entendu.|parler plus lentement|transmettre le message|les coordonnées|un rendez-vous|l'heure|la date|Très bien.|D'accord.|Je vous remercie.|Bonne journée !|Je vais vérifier.",
  3: "un message vocal|une boîte vocale|un répondeur|après le signal|écouter|enregistrer|recevoir|le destinataire|la durée|important|urgent|aujourd'hui|demain|ce soir|plus tard|bientôt|tout de suite|après|avant|une information|un détail|J'ai bien reçu ton message.|Je t'écoute plus tard.|Je te rappelle ce soir.|Merci pour l'information.|prendre note|une réponse|laisser|être injoignable|le numéro",
  4: "Je n'ai pas compris.|Pouvez-vous répéter plus lentement ?|Je n'ai pas entendu l'adresse.|Qu'est-ce que vous voulez dire ?|moi|toi|lui|elle|nous|un correspondant|eux|pour moi|avec toi|chez nous|Je suis d'accord avec toi.|Je ne peux pas aujourd'hui.|Pour vous, quelle heure est possible ?|On peut faire ça demain.|une confirmation|une proposition|un accord|une question|joignable|absent(e)|un retard|une annulation|un changement|préciser|expliquer|comprendre",
  5: "un courriel / un email|l'objet|un destinataire|un expéditeur|une pièce jointe|répondre|Bonjour Madame / Monsieur,|Je vous écris au sujet de…|Je vous contacte pour…|Suite à notre conversation,|Je me permets de…|Pourriez-vous m'envoyer…|Je vous remercie par avance.|Cordialement,|Dans l'attente de votre réponse,|Je reste à votre disposition.|N'hésitez pas à me contacter.|une demande|une réclamation|accuser réception|un délai|dès que possible|dans les meilleurs délais|une signature|un accusé de réception|faire suivre|archiver|poliment|précis|clair",
  6: "J'ai bien reçu votre message.|Merci pour votre email.|Je vous réponds au sujet de…|Vous trouverez en pièce jointe…|comme convenu|Je vous confirme…|Veuillez trouver ci-joint…|Je vous prie d'agréer…|En espérant une suite favorable,|un dossier|un formulaire|remplir|joindre|télécharger|imprimer|signer|renvoyer|un document|une facture|un contrat|valable|original|une copie|un justificatif|une référence|une adresse email|un lien|un mot de passe|une notification|Bien cordialement,",
  7: "un appartement|un studio|le loyer|les charges|la caution|un propriétaire|un locataire|une agence immobilière|visiter|louer|un dossier de location|un bail|meublé|non meublé|une chambre|un salon|une cuisine|une salle de bain|un balcon|une cave|un parking|emménager|libre|une quittance|un état des lieux|les mètres carrés|ensoleillé|calme|rénové|proche des transports",
  8: "les charges comprises|l'électricité|le gaz|l'eau|internet|le chauffage|une assurance habitation|un garant|des revenus|un justificatif de domicile|une pièce d'identité|un avis d'imposition|des bulletins de salaire|plus grand que|moins cher que|aussi lumineux que|le plus grand|le moins cher|bruyant|une vue|un jardin|une terrasse|à rénover|un inventaire|un dépôt de garantie|récupérer|un préavis|résilier|une agence|des frais d'agence",
  9: "un voisin / une voisine|un immeuble|un couloir|un palier|un interphone|une boîte aux lettres|une poubelle|un bruit|une nuisance|après 22h|le règlement|une copropriété|un syndic|une réunion|le gardien|se plaindre|déranger|gêner|respecter|saluer|excusez-moi|un problème|c'est gênant|le bon voisinage|un compromis|l'escalier|la porte|les parties communes|l'entretien|propre",
  10: "Je suis votre voisin(e).|Je me permets de vous contacter.|Le bruit est trop fort.|Pourriez-vous baisser le son ?|Je comprends votre point de vue.|Nous pouvons trouver un accord.|Je vous remercie de votre compréhension.|une fuite d'eau|une panne|appeler le plombier|contacter le gardien|un dégât des eaux|une réparation|le chauffage ne fonctionne pas|signaler|lui parler|lui écrire|leur parler|leur écrire|une assemblée|voter|une décision|le règlement intérieur|une charge|un service|la propreté|un gestionnaire|en cas de problème|toujours|jamais",
  11: "une banque|un compte bancaire|un compte courant|un compte épargne|une carte bancaire|un virement|un prélèvement|un relevé de compte|un guichet|un distributeur|retirer|déposer|virer|un solde|un découvert|des frais|un conseiller|un RIB|un IBAN|un code PIN|valider|activer sa carte|un plafond|ouvrir un compte|une banque en ligne|sécurisé|gratuit(e)|introduire|retaper|une opération",
  12: "Je voudrais ouvrir un compte.|Mon compte est à découvert.|Je voudrais faire un virement.|Ma carte est bloquée.|Je voudrais faire opposition.|un crédit|un prêt|rembourser|une mensualité|un taux d'intérêt|épargner|des économies|le guichet automatique|votre solde disponible|un virement international|des devises|le taux de change|une commission|souvent|parfois|rarement|chaque mois|Je viens d'ouvrir un compte.|Je viens de recevoir mon relevé.|ne...plus|ne...jamais|ne...rien|une carte de crédit|un chèque|un virement SEPA",
  13: "la poste|un bureau de poste|un colis|un paquet|une lettre|une enveloppe|un timbre|affranchir|peser|envoyer|la livraison à domicile|un recommandé|un envoi|la signature|un numéro de suivi|exprès|prioritaire|normal|économique|une adresse|le code postal|fragile|assurer|coller|le facteur|une tournée|un avis de passage|retirer un colis|le délai de livraison|d'abord",
  14: "ensuite|puis|finalement / enfin|donc|car|Je voudrais envoyer ce colis.|Combien coûte un envoi ?|Quel est le délai de livraison ?|Je voudrais un envoi recommandé.|Mon colis n'est pas arrivé.|Quel est le numéro de suivi ?|faire une réclamation|le colis est abîmé|Il manque des articles.|Je voudrais le retourner.|un bon de retour|le remboursement|un avoir|Contacter le service client.|en attente|expédié|livré|en cours de livraison|à retirer|fournir|une valeur déclarée|une assurance colis|une preuve|expédier|Il dit que…",
  15: "une boutique en ligne|commander|un article|un panier|finaliser|payer en ligne|une adresse de livraison|les frais de port|livraison gratuite|la date de livraison|standard|express|un suivi|un récapitulatif|épuisé(e)|en rupture de stock|une promotion|un code promo|le paiement|la description|un numéro de commande|comparer|évaluer|une note|un avis|recommander|fiable|en un clic|pratique|un code de sécurité",
  16: "Je voudrais retourner cet article.|Ce n'est pas ce que j'ai commandé.|L'article est défectueux.|Je voudrais un remboursement.|la procédure de retour|sous 30 jours|les conditions générales|le service client|contester|Le produit ne correspond pas à la description.|Le tracking dit…|un point relais|un casier automatique|l'étiquette de retour|inspecter|décrire le problème|Elle explique que…|Il demande si…|Elle dit qu'elle va rembourser.|une tentative de livraison|le livreur|vérifier|un geste commercial|une erreur|une solution|un échange|renoncer à|une adresse de facturation|un bon de commande|en stock",
  17: "un aéroport|un vol|un billet d'avion|embarquer|décoller|atterrir|un passeport|la sécurité|le contrôle|une porte d'embarquement|un terminal|une compagnie aérienne|s'enregistrer|un bagage|un bagage à main|la soute|un chariot|l'étiquette bagage|un excédent de bagage|une valise|faire la queue|une carte d'embarquement|un comptoir|une correspondance|une escale|un vol direct|annulé|retardé|à l'heure|embarquement immédiat",
  18: "Mon vol est retardé.|Où est la porte d'embarquement ?|Je voudrais m'enregistrer.|J'ai un bagage en soute.|Mon bagage est perdu.|Quand part le prochain vol ?|Je voudrais changer mon vol.|la classe économique|la classe affaires|une fenêtre|un hublot|Attachez vos ceintures.|Mettez vos appareils en mode avion.|la durée du vol|l'heure d'arrivée|le décalage horaire|la douane|rien à déclarer|la zone de retrait des bagages|le carrousel|un visa|un surclassement|un repas végétarien|la piste|l'altitude|le personnel de bord|une escale technique|compenser|une indemnisation|un comptoir d'information",
  19: "une gare|un train|le TGV|un billet de train|première classe|deuxième classe|une réservation|une place|côté fenêtre|côté couloir|un compartiment|une voiture|un quai|une voie|l'heure de départ|la durée du trajet|supprimé (train)|une annonce|un panneau d'affichage|composter|une borne|la salle d'attente|un billet électronique|une carte de réduction|prendre le train|aller simple|aller-retour|réservé|monter à bord|la place numérotée",
  20: "Mon train est en retard.|Où est le quai numéro 3 ?|J'ai raté mon train.|Je voudrais changer ma réservation.|Y a-t-il un train plus tôt ?|Le prochain train part à…|La correspondance est assurée.|Je dois changer à Lyon.|Votre billet, s'il vous plaît.|J'ai une réservation électronique.|un contrôleur|poinçonner|terminus|le prochain arrêt|un justificatif de retard|en cas de retard|un bon d'échange|la voiture restaurant|une place assise|debout|une assurance voyage|dédommager|J'avais réservé ma place.|Il avait dit que…|Elle avait expliqué que…|un abonnement|le bar|Reto final JE COMPRENDS|Je comprends plus que je croyais.|une connexion Wi-Fi",
};

/** Compare on meaning, not typography: quotes, ellipsis, case and spacing vary. */
function norm(s) {
  return String(s)
    .replace(/[’ʼ]/g, "'")
    .replace(/[…]/g, "...")
    .replace(/\s+/g, " ")
    .replace(/\s*([?!:;])/g, "$1")
    .replace(/[.]+$/, "")
    .trim()
    .toLowerCase();
}

const src = readFileSync("src/data/month2.ts", "utf8");
const start = src.indexOf("= {", src.indexOf("export const MONTH2"));
const MONTH2 = JSON.parse(
  src
    .slice(start + 2)
    .replace(/;\s*$/, "")
    .trim(),
);

let docTotal = 0;
let matched = 0;
const report = [];

for (let d = 1; d <= 20; d++) {
  const appDay = String(20 + d);
  const expected = DICTIONARY[d].split("|");
  docTotal += expected.length;
  const appWords = (MONTH2[appDay]?.vocabulary ?? []).map((v) => v.fr);
  const appSet = new Set(appWords.map(norm));
  const missing = expected.filter((e) => !appSet.has(norm(e)));
  matched += expected.length - missing.length;
  const expSet = new Set(expected.map(norm));
  const extra = appWords.filter((w) => !expSet.has(norm(w)));
  report.push({ doc: d, appDay, expected: expected.length, app: appWords.length, missing, extra });
}

console.log(`\nDICCIONARIO MES 2 — ${matched}/${docTotal} entradas del documento presentes en la app\n`);
for (const r of report) {
  const pct = Math.round(((r.expected - r.missing.length) / r.expected) * 100);
  const flag = r.missing.length === 0 ? "OK " : "!! ";
  console.log(
    `${flag}doc D${String(r.doc).padStart(2)} -> Jour ${r.appDay}: ${r.expected - r.missing.length}/${r.expected} (${pct}%)` +
      (r.missing.length ? `\n     falta: ${r.missing.join(" · ")}` : ""),
  );
}
const worst = report.filter((r) => r.missing.length > 0).length;
console.log(`\n${20 - worst}/20 días coinciden al 100% · ${worst} con diferencias\n`);

/* ---------- Segunda parte: la gramática del día (Mapa Mes 2) ---------- */
// One unmistakable marker per day, taken from the client's "Gramática del día"
// column. We assert the concept is actually taught that day, not just present
// somewhere in the month.
const GRAMMAR = {
  1: /futur proche|vais \+ infinitif|je vais/i,
  2: /vous|formel|all[ôo]/i,
  3: /possessif|mon\s*\/\s*ma|mon \/ ma|ton\/ta|son\/sa/i,
  4: /aujourd'hui|demain|ce soir|plus tard/i,
  5: /tonique|moi \/ toi|moi\/toi/i,
  6: /pas compris|r[ée]p[ée]ter|aclaraci[óo]n/i,
  7: /c'est.*il est|il est.*c'est/i,
  8: /plus.*que|moins.*que|comparatif/i,
  9: /le plus|la plus|superlatif/i,
  10: /tu.*vous|lui\s*\/\s*leur|coi/i,
  11: /être.*avoir.*faire.*pouvoir|verbes piliers/i,
  12: /cod|me \/ te \/ le|me\/te\/le/i,
  13: /venir de|pass[ée] r[ée]cent/i,
  14: /d'abord|ensuite|connecteur/i,
  15: /ne\.\.\.plus|ne\.\.\.jamais|ne\.\.\.rien|ne\.\.\.personne|n[ée]gation/i,
  16: /accord|bapne|adjectif/i,
  17: /est-ce que|inversion|quel\s*\/\s*quelle|quel \/ quelle/i,
  18: /qui.*que|relatif/i,
  19: /depuis|on = nous|on \(nous\)/i,
  20: /tr[èe]s|trop|assez|adverbe/i,
};

let gOk = 0;
const gMissing = [];
for (let d = 1; d <= 20; d++) {
  const appDay = String(20 + d);
  const day = MONTH2[appDay] ?? {};
  const blob = [
    ...(day.grammar ?? []).map((g) => `${g.formula} ${g.use}`),
    day.tutor?.topic ?? "",
    (day.tutor?.objectives ?? []).join(" "),
  ].join(" ");
  if (GRAMMAR[d].test(blob)) gOk += 1;
  else gMissing.push(`doc D${d} -> Jour ${appDay}: no encuentro ${GRAMMAR[d]}`);
}
console.log(`GRAMÁTICA DEL DÍA — ${gOk}/20 días enseñan el punto gramatical del mapa`);
for (const m of gMissing) console.log(`  !! ${m}`);
console.log("");
