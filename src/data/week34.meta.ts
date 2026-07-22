// UI metadata for weeks 3-4 (days 11-20): labels/titles only — NOT lesson
// content (that lives in WEEK34 / the DB `authored_days.rich` column). Shared by
// the lesson player (src/routes/day.$dayId.tsx) AND the rich-content seed script
// (scripts/gen-week34-seed.mjs), so the two never drift.
import type { WeekDay } from "./week34";

export type Week34Meta = {
  label: string; // sidebar accordion + DAYS_META
  headTitle: string; // <head> title
  headDesc: string; // <head> description
  week: number; // 3 | 4 (kept as number so authored weeks 5+ can reuse the shape)
  weekEmoji: string; // WEEK_TITLE_BY_DAY suffix
  intro: string; // LiberteSpeak welcome (intro lesson)
  introSub: string; // sidebar intro subtitle
  clesSub: string; // sidebar "Les clés" subtitle (grammar theme)
  defiTitle: string;
  defiSubtitle: string;
  defiAvatar: string;
};

/** A full day rendered through the weeks-1-2 lesson shell: the lesson content
 *  (WeekDay) plus its UI metadata. This is exactly what the DB stores in
 *  `authored_days.rich` and what the wrappers/editor consume. */
export type RichDay = WeekDay & { meta: Week34Meta };

export const WEEK34_META: Record<string, Week34Meta> = {
  "11": {
    label: "Jour 11 · Demander son chemin",
    headTitle: "Jour 11 · Demander son chemin — Liberté",
    headDesc: "Onzième jour : demander son chemin et comprendre les indications dans la rue.",
    week: 3, weekEmoji: "🧭",
    intro: "Bienvenue au Jour 11 ! Aujourd'hui tu apprends à demander ton chemin dans les rues de Paris : où se trouve la station, la pharmacie, le musée. Respire, tu es prêt.",
    introSub: "Demander son chemin.",
    clesSub: "Où est… ? · Prépositions de lieu.",
    defiTitle: "Demander son chemin",
    defiSubtitle: "Dans la rue : demande comment aller à un lieu et comprends les indications.",
    defiAvatar: "🧭",
  },
  "12": {
    label: "Jour 12 · Donner des directions",
    headTitle: "Jour 12 · Donner des directions — Liberté",
    headDesc: "Douzième jour : donner des directions claires avec l'impératif.",
    week: 3, weekEmoji: "🗺️",
    intro: "Bienvenue au Jour 12 ! Aujourd'hui c'est toi qui guides : tourne à gauche, continue tout droit, c'est en face. Respire, tu es prêt.",
    introSub: "Donner des directions.",
    clesSub: "Impératif : tournez, continuez, allez.",
    defiTitle: "Donner des directions",
    defiSubtitle: "Guía a alguien paso a paso hasta su destino.",
    defiAvatar: "🗺️",
  },
  "13": {
    label: "Jour 13 · À la pharmacie",
    headTitle: "Jour 13 · À la pharmacie — Liberté",
    headDesc: "Treizième jour : acheter un médicament et comprendre la posologie.",
    week: 3, weekEmoji: "💊",
    intro: "Bienvenue au Jour 13 ! Aujourd'hui tu vas à la pharmacie acheter un médicament et comprendre comment le prendre. Respire, tu es prêt.",
    introSub: "À la pharmacie.",
    clesSub: "Il me faut… · La posologie.",
    defiTitle: "À la pharmacie",
    defiSubtitle: "Compra un medicamento y entiende cómo y cuándo tomarlo.",
    defiAvatar: "💊",
  },
  "14": {
    label: "Jour 14 · Décrire un symptôme",
    headTitle: "Jour 14 · Décrire un symptôme — Liberté",
    headDesc: "Quatorzième jour : décrire un symptôme et demander conseil.",
    week: 3, weekEmoji: "🤒",
    intro: "Bienvenue au Jour 14 ! Aujourd'hui tu apprends à dire où tu as mal : j'ai mal à la tête, à la gorge, au ventre. Respire, tu es prêt.",
    introSub: "Décrire un symptôme.",
    clesSub: "Avoir mal à… · Depuis…",
    defiTitle: "Décrire un symptôme",
    defiSubtitle: "Explica cómo te sientes desde cuándo y pide un consejo.",
    defiAvatar: "🤒",
  },
  "15": {
    label: "Jour 15 · Comparer & choisir",
    headTitle: "Jour 15 · Comparer & choisir — Liberté",
    headDesc: "Quinzième jour : comparer des produits et choisir le meilleur.",
    week: 3, weekEmoji: "🛍️",
    intro: "Bienvenue au Jour 15 ! Aujourd'hui tu compares : plus cher, moins cher, meilleur, aussi grand que. Respire, tu es prêt.",
    introSub: "Comparer & choisir.",
    clesSub: "Comparatifs : plus / moins / aussi… que.",
    defiTitle: "Comparer & choisir",
    defiSubtitle: "Compara dos productos y explica cuál eliges y por qué.",
    defiAvatar: "🛍️",
  },
  "16": {
    label: "Jour 16 · Essayer des vêtements",
    headTitle: "Jour 16 · Essayer des vêtements — Liberté",
    headDesc: "Seizième jour : essayer des vêtements et parler de tailles et de couleurs.",
    week: 4, weekEmoji: "👗",
    intro: "Bienvenue au Jour 16 ! Aujourd'hui tu essaies des vêtements : la taille, la couleur, ça me va bien. Respire, tu es prêt.",
    introSub: "Au probador.",
    clesSub: "Ça me va · Les tailles · Pronoms COD.",
    defiTitle: "Essayer des vêtements",
    defiSubtitle: "En el probador: pide otra talla, otro color y decide si te lo llevas.",
    defiAvatar: "👗",
  },
  "17": {
    label: "Jour 17 · Au marché · Les fruits",
    headTitle: "Jour 17 · Au marché · Les fruits — Liberté",
    headDesc: "Dix-septième jour : acheter des fruits au marché et parler de quantités.",
    week: 4, weekEmoji: "🍓",
    intro: "Bienvenue au Jour 17 ! Aujourd'hui tu vas au marché acheter des fruits : un kilo de pommes, une barquette de fraises. Respire, tu es prêt.",
    introSub: "Les fruits au marché.",
    clesSub: "Quantités : un kilo de, une barquette de.",
    defiTitle: "Au marché · Les fruits",
    defiSubtitle: "Compra fruta en el mercado indicando cantidades y precios.",
    defiAvatar: "🍓",
  },
  "18": {
    label: "Jour 18 · Au marché · Les légumes",
    headTitle: "Jour 18 · Au marché · Les légumes — Liberté",
    headDesc: "Dix-huitième jour : acheter des légumes et utiliser les articles partitifs.",
    week: 4, weekEmoji: "🥕",
    intro: "Bienvenue au Jour 18 ! Aujourd'hui tu achètes des légumes au marché : du, de la, des. Respire, tu es prêt.",
    introSub: "Les légumes au marché.",
    clesSub: "Articles partitifs : du / de la / des.",
    defiTitle: "Au marché · Les légumes",
    defiSubtitle: "Compra verduras usando los artículos partitivos.",
    defiAvatar: "🥕",
  },
  "19": {
    label: "Jour 19 · S'inscrire au gymnase",
    headTitle: "Jour 19 · S'inscrire au gymnase — Liberté",
    headDesc: "Dix-neuvième jour : s'inscrire à une activité et parler de sa routine.",
    week: 4, weekEmoji: "🏋️",
    intro: "Bienvenue au Jour 19 ! Aujourd'hui tu t'inscris au gymnase : les horaires, les tarifs, ta routine. Respire, tu es prêt.",
    introSub: "S'inscrire au gymnase.",
    clesSub: "Verbes pronominaux : s'inscrire, se lever.",
    defiTitle: "S'inscrire au gymnase",
    defiSubtitle: "Inscríbete a una actividad: pregunta horarios, precios y apúntate.",
    defiAvatar: "🏋️",
  },
  "20": {
    label: "Jour 20 · Défi final J'OSE",
    headTitle: "Jour 20 · Défi final J'OSE — Liberté",
    headDesc: "Vingtième jour : le grand défi J'OSE qui réunit tout le mois.",
    week: 4, weekEmoji: "🏅",
    intro: "Bienvenue au Jour 20 ! Aujourd'hui, le grand défi : tu réunis tout ce que tu as appris ce mois-ci. Respire, tu es prêt — tu OSES.",
    introSub: "Le grand défi J'OSE.",
    clesSub: "Révision intégrée du mois J'OSE.",
    defiTitle: "Défi final J'OSE",
    defiSubtitle: "El reto final del mes: combina direcciones, farmacia, compras y rutina en una sola conversación.",
    defiAvatar: "🏅",
  },
};
