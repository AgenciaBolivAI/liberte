// Generates the week-3 (days 11-15) content seed for the authoring system
// (authored_days + authored_blocks), faithfully from the client's Mes 1: J'OSE
// dictionary + curriculum. Run: `node scripts/seed-week3.mjs` → writes
// supabase/migrations/20260722000000_seed_week3_content.sql (idempotent).
//
// Week 3 = days 11-15 (weekOfAuthoredDay = ceil(day/5)):
//   11 Directions I · 12 Directions II · 13 Pharmacie I · 14 Pharmacie II · 15 Vêtements I
// Each day mirrors the weeks 1-2 flow: objectif → grammaire → vocabulaire →
// expressions → quiz → écriture (IA) → oral (IA) → dialogue modèle.
import { writeFileSync } from "node:fs";

const v = (fr, es) => ({ fr, es });

const days = [
  /* ---------------- DÍA 11 — Direcciones I ---------------- */
  {
    day: 11,
    title: "Jour 11 · Demander son chemin",
    subtitle: "Directions I — à gauche, à droite, tout droit + prépositions de lieu",
    blocks: [
      {
        type: "text",
        payload: {
          title: "🎯 Objectif du jour",
          body:
            "Hoy aprendes a pedir y dar indicaciones básicas en la calle: a la izquierda, a la derecha, todo recto, y las preposiciones de lugar.\n\nAl final del día podrás preguntar cómo llegar a un lugar y entender la respuesta. (Situación: Direcciones · Competencias DELF: CO + PO)",
        },
      },
      {
        type: "text",
        payload: {
          title: "📖 Grammaire — L'impératif de direction + prépositions de lieu",
          body:
            "Para dar indicaciones se usa el IMPERATIVO (sin sujeto): Tournez (giren), Allez (vayan), Continuez (continúen), Prenez (tomen).\n\nSe combina con preposiciones de lugar: à gauche (a la izquierda), à droite (a la derecha), tout droit (todo recto), en face de (enfrente de), à côté de (al lado de), près de (cerca de), au bout de (al final de), au coin de (en la esquina de).\n\nFórmula: Tournez à gauche/droite. · Allez tout droit. · C'est en face de / à côté de / près de + lugar.\n\nEjemplos:\n• Tournez à gauche au carrefour. (Giren a la izquierda en el cruce.)\n• Allez tout droit jusqu'au feu. (Vayan todo recto hasta el semáforo.)\n• C'est en face de la pharmacie. (Está enfrente de la farmacia.)\n\n⚠️ Error a evitar: confundir à gauche (izquierda) y à droite (derecha) bajo presión.\n🔊 Pronunciación: tournez [tuʁne] · gauche [ɡoʃ] · droite [dʁwat]",
        },
      },
      {
        type: "vocab",
        payload: {
          items: [
            v("à gauche", "a la izquierda"),
            v("à droite", "a la derecha"),
            v("tout droit", "todo recto"),
            v("en face de", "enfrente de"),
            v("à côté de", "al lado de"),
            v("près de", "cerca de"),
            v("loin de", "lejos de"),
            v("au bout de", "al final de"),
            v("au coin de", "en la esquina de"),
            v("entre", "entre"),
            v("derrière", "detrás de"),
            v("devant", "delante de"),
            v("en haut", "arriba"),
            v("en bas", "abajo"),
            v("premier étage", "primer piso"),
            v("deuxième étage", "segundo piso"),
            v("rez-de-chaussée", "planta baja"),
            v("un immeuble", "un edificio"),
            v("un escalier", "una escalera"),
            v("un ascenseur", "un ascensor"),
            v("un panneau", "un cartel / una señal"),
            v("un plan", "un plano / mapa"),
            v("une impasse", "un callejón sin salida"),
            v("une place", "una plaza"),
            v("un quartier", "un barrio"),
            v("Excusez-moi, je cherche…", "Disculpe, busco…"),
            v("Pouvez-vous m'indiquer… ?", "¿Puede indicarme…?"),
            v("Pour aller à…, s'il vous plaît ?", "¿Para ir a…, por favor?"),
            v("C'est à… minutes à pied.", "Está a… minutos a pie."),
            v("un bâtiment", "un edificio / bloque"),
          ],
        },
      },
      {
        type: "text",
        payload: {
          title: "🗝️ Expressions clés",
          body:
            "• Excusez-moi, je cherche… — Disculpe, busco…\n• Pour aller à…, s'il vous plaît ? — ¿Para ir a…, por favor?\n• Pouvez-vous m'indiquer… ? — ¿Puede indicarme…?\n• C'est à… minutes à pied. — Está a… minutos a pie.\n• Tournez à gauche. · Allez tout droit. · C'est au bout de la rue.",
        },
      },
      {
        type: "quiz",
        payload: {
          questions: [
            { q: "«A la izquierda» en francés es…", options: ["à droite", "à gauche", "tout droit"], correct: 1 },
            { q: "Para decir «giren a la derecha»:", options: ["Tournez à droite.", "Droite tournez.", "Allez à droite le."], correct: 0 },
            { q: "«Enfrente de la farmacia»:", options: ["à côté de la pharmacie", "en face de la pharmacie", "au bout de la pharmacie"], correct: 1 },
            { q: "«Todo recto» se dice…", options: ["tout droit", "tout gauche", "au coin"], correct: 0 },
            { q: "«Está a 5 minutos a pie»:", options: ["C'est à 5 minutes à pied.", "Il est à 5 minutes pied.", "C'est 5 minutes de pied."], correct: 0 },
          ],
        },
      },
      {
        type: "writing",
        payload: {
          title: "✍️ Production écrite — Indications A → B",
          prompt:
            "Écris des indications complètes en français pour aller d'un point A à un point B (utilise l'impératif + prépositions de lieu). Exemple: de la gare à la pharmacie.",
          example:
            "Sortez de la gare et tournez à gauche. Allez tout droit jusqu'au carrefour. La pharmacie est en face de la banque, à côté du café.",
        },
      },
      {
        type: "speaking",
        payload: {
          title: "🎙️ Production orale — Donne le chemin",
          prompt:
            "Enregistre-toi en donnant les indications pour aller de la Place de la République à la gare. Utilise: tournez, allez tout droit, en face de, à côté de.",
          example:
            "Depuis la Place de la République, allez tout droit. Prenez la deuxième rue à droite. La gare est au bout de la rue, en face du parc.",
        },
      },
    ],
  },

  /* ---------------- DÍA 12 — Direcciones II ---------------- */
  {
    day: 12,
    title: "Jour 12 · Lieux de la ville",
    subtitle: "Directions II — pour + infinitif, distances et points de repère",
    blocks: [
      {
        type: "text",
        payload: {
          title: "🎯 Objectif du jour",
          body:
            "Identificar lugares de referencia (gare, mairie, pharmacie, hôpital) y dar indicaciones completas con distancias, usando POUR + infinitivo para expresar el objetivo. (Situación: Direcciones · Competencias DELF: CE + PE)",
        },
      },
      {
        type: "text",
        payload: {
          title: "📖 Grammaire — Pour + infinitif",
          body:
            "POUR + infinitivo expresa la finalidad o el objetivo. Se usa mucho para dar indicaciones con un propósito.\n\nFórmula: Pour + infinitif + complément.\n\nEjemplos:\n• Pour aller à la gare, prenez le bus 21. (Para ir a la estación, tome el autobús 21.)\n• Pour trouver la pharmacie, tournez à droite. (Para encontrar la farmacia, gire a la derecha.)\n\n⚠️ Error a evitar: confundir «pour» con «por» — no siempre se traducen igual. Aquí pour = «para».\n🔊 pour [puʁ] · aller [ale]",
        },
      },
      {
        type: "vocab",
        payload: {
          items: [
            v("faire demi-tour", "dar la vuelta"),
            v("un rond-point", "una rotonda"),
            v("un feu tricolore", "un semáforo"),
            v("un pont", "un puente"),
            v("un parking", "un aparcamiento"),
            v("une gare", "una estación de tren"),
            v("un aéroport", "un aeropuerto"),
            v("un hôpital", "un hospital"),
            v("une mairie", "un ayuntamiento"),
            v("une école", "una escuela"),
            v("une université", "una universidad"),
            v("une église", "una iglesia"),
            v("un musée", "un museo"),
            v("un parc", "un parque"),
            v("un marché", "un mercado"),
            v("un centre commercial", "un centro comercial"),
            v("une pharmacie", "una farmacia"),
            v("un passage souterrain", "un paso subterráneo"),
            v("une banque", "un banco"),
            v("la poste", "correos"),
            v("un hôtel", "un hotel"),
            v("un appartement", "un apartamento"),
            v("Continuez tout droit.", "Continúe todo recto."),
            v("Tournez à gauche / à droite.", "Gire a la izquierda / derecha."),
            v("Prenez la première / deuxième rue.", "Tome la primera / segunda calle."),
            v("C'est tout près.", "Está muy cerca."),
            v("Vous ne pouvez pas le manquer.", "No puede perdérselo."),
            v("un escalier roulant", "una escalera mecánica"),
            v("un square", "una pequeña plaza"),
            v("un jardin", "un jardín"),
          ],
        },
      },
      {
        type: "text",
        payload: {
          title: "🗝️ Expressions clés",
          body:
            "• Pour aller à la gare, s'il vous plaît ? — ¿Para ir a la estación, por favor?\n• Continuez tout droit. · Tournez à gauche après le pont.\n• C'est tout près. · Vous ne pouvez pas le manquer.\n• La gare est à 10 minutes à pied.",
        },
      },
      {
        type: "quiz",
        payload: {
          questions: [
            { q: "«Para ir a…» se dice:", options: ["Pour aller à…", "Par aller à…", "Pour va à…"], correct: 0 },
            { q: "«Una estación de tren»:", options: ["une gare", "une mairie", "un pont"], correct: 0 },
            { q: "«El ayuntamiento»:", options: ["la poste", "une mairie", "une banque"], correct: 1 },
            { q: "«Continúe todo recto»:", options: ["Continuez tout droit.", "Continue tout droite.", "Tout droit allez."], correct: 0 },
            { q: "«No puede perdérselo»:", options: ["Vous ne pouvez pas le manquer.", "Vous ne manquez pas le.", "Il ne peut pas manquer."], correct: 0 },
          ],
        },
      },
      {
        type: "writing",
        payload: {
          title: "✍️ Production écrite — Itinéraire complet",
          prompt:
            "Escribe indicaciones completas para llegar de un lugar A a un lugar B usando pour + infinitif y puntos de referencia (gare, pont, feu, rond-point).",
          example:
            "Pour aller à l'hôpital, sortez de l'hôtel et allez tout droit. Traversez le pont, puis tournez à droite au feu. L'hôpital est à côté de la mairie.",
        },
      },
      {
        type: "speaking",
        payload: {
          title: "🎙️ Production orale — Vers l'hôpital",
          prompt:
            "Enregistre-toi en expliquant comment aller à l'hôpital le plus proche depuis l'endroit où tu es. Utilise pour + infinitif.",
          example:
            "Pour aller à l'hôpital, prenez la première rue à droite, continuez tout droit et traversez le rond-point. C'est en face du parc.",
        },
      },
    ],
  },

  /* ---------------- DÍA 13 — Farmacia I ---------------- */
  {
    day: 13,
    title: "Jour 13 · À la pharmacie",
    subtitle: "Pharmacie I — demander un médicament et comprendre la posologie",
    blocks: [
      {
        type: "text",
        payload: {
          title: "🎯 Objectif du jour",
          body:
            "Pedir un medicamento sin receta en la farmacia y entender la posología (cuándo y cómo tomarlo). (Situación: Farmacia · Competencias DELF: CO + PO)",
        },
      },
      {
        type: "text",
        payload: {
          title: "📖 Grammaire — La posologie · Prenez + dose",
          body:
            "El farmacéutico te indica la posología (la dosis y el momento). Palabras clave: le matin (por la mañana), le midi (al mediodía), le soir (por la noche), avant le repas (antes de comer), après le repas (después de comer), avec de l'eau (con agua), pendant… jours (durante… días).\n\nEl farmacéutico usa el imperativo: Prenez… (Tome…). Fórmula: Prenez + dose + moment.\n\nEjemplos:\n• Prenez deux comprimés par jour, après le repas. (Tome dos comprimidos al día, después de comer.)\n• Un comprimé le matin et un le soir, pendant 5 jours.\n\nPreguntas útiles: Qu'est-ce que vous me conseillez ? (¿Qué me aconseja?) · C'est sans ordonnance ? (¿Es sin receta?) · C'est remboursé ? (¿Lo cubre el seguro?)\n🔊 ordonnance [ɔʁdɔnɑ̃s] · comprimé [kɔ̃pʁime]",
        },
      },
      {
        type: "vocab",
        payload: {
          items: [
            v("la parapharmacie", "la parafarmacia"),
            v("un pharmacien", "un farmacéutico"),
            v("un médicament", "un medicamento"),
            v("une ordonnance", "una receta médica"),
            v("un comprimé", "un comprimido"),
            v("une gélule", "una cápsula"),
            v("un sirop", "un jarabe"),
            v("une pommade", "una pomada"),
            v("une crème", "una crema"),
            v("un spray", "un spray"),
            v("des gouttes", "gotas"),
            v("une dose", "una dosis"),
            v("la posologie", "la posología / dosis"),
            v("le matin", "por la mañana"),
            v("le soir", "por la noche"),
            v("avant le repas", "antes de comer"),
            v("après le repas", "después de comer"),
            v("avec de l'eau", "con agua"),
            v("pendant… jours", "durante… días"),
            v("un tube", "un tubo"),
            v("un flacon", "un frasco"),
            v("être allergique à", "ser alérgico/a a"),
            v("sans ordonnance", "sin receta"),
            v("renouveler", "renovar"),
            v("Qu'est-ce que vous me conseillez ?", "¿Qué me aconseja?"),
            v("C'est remboursé ?", "¿Está cubierto por el seguro?"),
            v("une notice", "un prospecto"),
            v("un effet secondaire", "un efecto secundario"),
            v("le remboursement", "el reembolso"),
            v("le midi", "al mediodía"),
          ],
        },
      },
      {
        type: "text",
        payload: {
          title: "🗝️ Expressions clés",
          body:
            "• Vous avez quelque chose pour la toux ? — ¿Tiene algo para la tos?\n• C'est disponible sans ordonnance ? — ¿Está disponible sin receta?\n• Prenez deux comprimés après le repas.\n• Qu'est-ce que vous me conseillez ?",
        },
      },
      {
        type: "quiz",
        payload: {
          questions: [
            { q: "«Una receta médica»:", options: ["une ordonnance", "une posologie", "un comprimé"], correct: 0 },
            { q: "«Tome dos comprimidos»:", options: ["Prenez deux comprimés", "Prends deux comprimé", "Prenez deux comprimé"], correct: 0 },
            { q: "«Antes de comer»:", options: ["après le repas", "avant le repas", "avec de l'eau"], correct: 1 },
            { q: "«Sin receta»:", options: ["sans ordonnance", "sans posologie", "sans dose"], correct: 0 },
            { q: "«¿Qué me aconseja?»:", options: ["Qu'est-ce que vous me conseillez ?", "Qu'est-ce que vous conseille ?", "Que me conseil ?"], correct: 0 },
          ],
        },
      },
      {
        type: "writing",
        payload: {
          title: "✍️ Production écrite — À la pharmacie",
          prompt:
            "Escribe cómo pedirías un medicamento para la tos, sin receta, y pregunta la dosis (2-3 frases en francés).",
          example:
            "Bonjour, vous avez quelque chose pour la toux, s'il vous plaît ? Je n'ai pas d'ordonnance. Combien de fois par jour faut-il le prendre ?",
        },
      },
      {
        type: "speaking",
        payload: {
          title: "🎙️ Production orale — Demander un médicament",
          prompt:
            "Enregistre-toi en demandant un médicament pour la toux sans ordonnance et en demandant la posologie, comme au comptoir de la pharmacie.",
          example:
            "Bonjour, j'ai de la toux depuis deux jours. Qu'est-ce que vous me conseillez sans ordonnance ? Je le prends combien de fois par jour ?",
        },
      },
      {
        type: "text",
        payload: {
          title: "💬 Dialogue modèle",
          body:
            "Client : Bonjour, j'ai mal à la gorge et j'ai de la fièvre depuis hier.\nPharmacien : Vous avez une ordonnance ?\nClient : Non, je n'ai pas d'ordonnance.\nPharmacien : D'accord. Prenez ce sirop, deux cuillères trois fois par jour après le repas. Et si la fièvre ne passe pas, il faut voir un médecin.\nClient : C'est remboursé ?\nPharmacien : Non, ce n'est pas sur ordonnance.",
        },
      },
    ],
  },

  /* ---------------- DÍA 14 — Farmacia II ---------------- */
  {
    day: 14,
    title: "Jour 14 · Décrire ses symptômes",
    subtitle: "Pharmacie II — avoir mal à + partie du corps · il faut + infinitif",
    blocks: [
      {
        type: "text",
        payload: {
          title: "🎯 Objectif du jour",
          body:
            "Describir tus síntomas (avoir mal à + parte del cuerpo), decir desde cuándo y si es urgente. (Situación: Farmacia · Competencias DELF: CO + PE)",
        },
      },
      {
        type: "text",
        payload: {
          title: "📖 Grammaire — Avoir mal à + partie du corps · Il faut + infinitif",
          body:
            "Para decir que algo te DUELE se usa AVOIR MAL À. La preposición à se contrae con el artículo:\n• à + la → à la : J'ai mal à la tête / à la gorge.\n• à + le → au : J'ai mal au dos / au ventre.\n• à + les → aux : J'ai mal aux pieds.\n\n⚠️ No se dice «je suis mal à la tête» — se usa AVOIR (j'ai), no être.\n\nPara la necesidad/consejo: IL FAUT + infinitivo (hay que…). Ej.: Il faut voir un médecin. (Hay que ver a un médico.)\n\nDesde cuándo: depuis hier (desde ayer), depuis deux jours, depuis une semaine.\n🔊 j'ai mal [ʒɛ mal] · gorge [ɡɔʁʒ] · fièvre [fjɛvʁ]",
        },
      },
      {
        type: "vocab",
        payload: {
          items: [
            v("J'ai mal à la tête.", "Me duele la cabeza."),
            v("J'ai mal à la gorge.", "Me duele la garganta."),
            v("J'ai mal au ventre.", "Me duele el estómago."),
            v("J'ai mal au dos.", "Me duele la espalda."),
            v("J'ai de la fièvre.", "Tengo fiebre."),
            v("J'ai un rhume.", "Tengo un resfriado."),
            v("J'ai la toux.", "Tengo tos."),
            v("J'ai une douleur.", "Tengo un dolor."),
            v("J'ai des nausées.", "Tengo náuseas."),
            v("J'ai des vertiges.", "Tengo mareos."),
            v("Je me suis coupé(e).", "Me corté."),
            v("Je me suis brûlé(e).", "Me quemé."),
            v("Je me suis tordu(e).", "Me torcí."),
            v("Je saigne.", "Estoy sangrando."),
            v("Je vomis.", "Vomito."),
            v("Je tousse.", "Tengo tos / toso."),
            v("Je suis fatigué(e).", "Estoy cansado/a."),
            v("Je ne dors pas bien.", "No duermo bien."),
            v("depuis hier", "desde ayer"),
            v("depuis deux jours", "desde hace dos días"),
            v("depuis une semaine", "desde hace una semana"),
            v("C'est grave ?", "¿Es grave?"),
            v("urgent", "urgente"),
            v("Il faut voir un médecin.", "Hay que ver a un médico."),
            v("Prenez…", "Tome…"),
            v("Je n'ai pas d'ordonnance.", "No tengo receta."),
            v("J'ai une blessure.", "Tengo una herida."),
            v("chronique", "crónico"),
            v("légèrement", "ligeramente"),
            v("aigu", "agudo"),
          ],
        },
      },
      {
        type: "text",
        payload: {
          title: "🗝️ Expressions clés",
          body:
            "• J'ai mal à la tête depuis hier. — Me duele la cabeza desde ayer.\n• J'ai de la fièvre. · J'ai un rhume.\n• C'est grave ? — ¿Es grave?\n• Il faut voir un médecin. — Hay que ver a un médico.",
        },
      },
      {
        type: "quiz",
        payload: {
          questions: [
            { q: "«Me duele la cabeza»:", options: ["J'ai mal à la tête.", "Je suis mal à la tête.", "J'ai mal au tête."], correct: 0 },
            { q: "«Me duele la espalda» (le dos):", options: ["J'ai mal à le dos.", "J'ai mal au dos.", "J'ai mal dos."], correct: 1 },
            { q: "«Desde hace dos días»:", options: ["depuis deux jours", "pendant deux jours", "il y a deux jours"], correct: 0 },
            { q: "«Hay que ver a un médico»:", options: ["Il faut voir un médecin.", "Il faut que voir un médecin.", "Il faut voir médecin."], correct: 0 },
            { q: "«Tengo fiebre»:", options: ["J'ai de la fièvre.", "Je suis fièvre.", "J'ai fièvre."], correct: 0 },
          ],
        },
      },
      {
        type: "writing",
        payload: {
          title: "✍️ Production écrite — Mes symptômes",
          prompt:
            "Escribe 5 frases describiendo síntomas diferentes con avoir mal à + parte del cuerpo, e indica desde cuándo los tienes.",
          example:
            "J'ai mal à la tête depuis ce matin. J'ai mal à la gorge depuis hier. J'ai de la fièvre depuis deux jours. J'ai mal au ventre après le repas. Je tousse depuis une semaine.",
        },
      },
      {
        type: "speaking",
        payload: {
          title: "🎙️ Production orale — Chez le pharmacien",
          prompt:
            "Enregistre-toi en décrivant 3 symptômes (avoir mal à…), dis depuis quand et demande si c'est grave.",
          example:
            "Bonjour, j'ai mal à la gorge et j'ai de la fièvre depuis hier. J'ai aussi mal à la tête. C'est grave, docteur ?",
        },
      },
    ],
  },

  /* ---------------- DÍA 15 — Tienda de ropa I ---------------- */
  {
    day: 15,
    title: "Jour 15 · Dans la boutique",
    subtitle: "Vêtements I — tailles, couleurs et comparatifs (plus / moins / aussi… que)",
    blocks: [
      {
        type: "text",
        payload: {
          title: "🎯 Objectif du jour",
          body:
            "Pedir tallas y colores, preguntar disponibilidad y pedir para probarte una prenda. Comparar prendas con plus / moins / aussi… que. (Situación: Tienda de ropa · Competencias DELF: CO + PO)",
        },
      },
      {
        type: "text",
        payload: {
          title: "📖 Grammaire — Les comparatifs : plus / moins / aussi + adjectif + que",
          body:
            "Para comparar en francés:\n• plus + adjetivo + que = más… que → Cette robe est plus belle que l'autre.\n• moins + adjetivo + que = menos… que → Ce pull est moins cher que la veste.\n• aussi + adjetivo + que = tan… como → Il est aussi confortable que l'autre.\n\nEl adjetivo concuerda en género y número: plus belle (fem.), plus grand (masc.).\n\nPara pedir en la tienda: Vous avez ça en… ? (¿Lo tiene en…?) · Je peux l'essayer ? (¿Puedo probármelo?)\n🔊 plus [ply] · moins [mwɛ̃] · aussi [osi]",
        },
      },
      {
        type: "vocab",
        payload: {
          items: [
            v("un vêtement", "una prenda de ropa"),
            v("une robe", "un vestido"),
            v("une jupe", "una falda"),
            v("un pantalon", "un pantalón"),
            v("un jean", "unos vaqueros"),
            v("une chemise", "una camisa"),
            v("un chemisier", "una blusa"),
            v("un t-shirt", "una camiseta"),
            v("un pull", "un jersey / suéter"),
            v("une veste", "una chaqueta"),
            v("un manteau", "un abrigo"),
            v("des chaussures", "zapatos"),
            v("des baskets", "zapatillas deportivas"),
            v("des bottes", "botas"),
            v("des sandales", "sandalias"),
            v("un maillot de bain", "un traje de baño"),
            v("une écharpe", "una bufanda"),
            v("la taille", "la talla"),
            v("la pointure", "el número (zapatos)"),
            v("XS / S / M / L / XL", "tallas de ropa"),
            v("une couleur", "un color"),
            v("des rayures", "rayas"),
            v("uni", "liso (sin estampado)"),
            v("Vous avez ça en… ?", "¿Lo tiene en…?"),
            v("Je peux l'essayer ?", "¿Puedo probármelo?"),
            v("un short", "un pantalón corto"),
            v("une ceinture", "un cinturón"),
            v("un chapeau", "un sombrero"),
            v("des lunettes", "gafas"),
            v("un motif", "un estampado"),
          ],
        },
      },
      {
        type: "text",
        payload: {
          title: "🗝️ Expressions clés",
          body:
            "• Je voudrais essayer cette robe. — Quisiera probarme este vestido.\n• Vous avez ça en rouge ? · Je peux l'essayer ?\n• Quelle est votre taille ? / votre pointure ?\n• C'est plus grand / moins cher / aussi confortable que l'autre.",
        },
      },
      {
        type: "quiz",
        payload: {
          questions: [
            { q: "«Un vestido»:", options: ["une jupe", "une robe", "une veste"], correct: 1 },
            { q: "«¿Puedo probármelo?»:", options: ["Je peux l'essayer ?", "Je peux essayer le ?", "Je peux le essaie ?"], correct: 0 },
            { q: "«Más barato que»:", options: ["plus cher que", "moins cher que", "aussi cher que"], correct: 1 },
            { q: "«La talla» (de ropa):", options: ["la pointure", "la taille", "le motif"], correct: 1 },
            { q: "«¿Lo tiene en rojo?»:", options: ["Vous avez ça en rouge ?", "Vous avez ça rouge ?", "Avez ça en rouge ?"], correct: 0 },
          ],
        },
      },
      {
        type: "writing",
        payload: {
          title: "✍️ Production écrite — Comparer deux vêtements",
          prompt:
            "Escribe 4 frases comparando dos prendas (precio, talla, color, material) usando plus / moins / aussi… que.",
          example:
            "La robe rouge est plus belle que la robe noire. Le pull bleu est moins cher que la veste. Ce t-shirt est aussi confortable que l'autre. Le manteau gris est plus chaud que la veste.",
        },
      },
      {
        type: "speaking",
        payload: {
          title: "🎙️ Production orale — Essayer des vêtements",
          prompt:
            "Enregistre-toi en demandant d'essayer 2 vêtements différents avec la taille et la couleur, puis compare-les.",
          example:
            "Bonjour, je voudrais essayer cette chemise blanche en taille M et ce pull bleu en L. Le pull est plus chaud, mais la chemise est plus élégante.",
        },
      },
      {
        type: "text",
        payload: {
          title: "💬 Dialogue modèle",
          body:
            "Vendeur : Bonjour, je peux vous aider ?\nClient : Oui, je voudrais essayer cette robe en taille M, s'il vous plaît.\nVendeur : Bien sûr, les cabines sont au fond.\n[…]\nClient : C'est trop petit. Vous avez en L ?\nVendeur : Voilà, en L. Celle-ci est aussi moins chère.\nClient : Parfait, ça me va très bien. Je la prends !",
        },
      },
    ],
  },
];

/* ---------------- SQL generation ---------------- */
const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
const jsonLit = (obj) => `$json$${JSON.stringify(obj)}$json$::jsonb`;

let sql =
  "-- Week-3 lesson content (days 11-15) for the authoring system.\n" +
  "-- Generated by scripts/seed-week3.mjs from the Mes 1: J'OSE dictionary +\n" +
  "-- curriculum. Idempotent: re-running replaces days 11-15 (blocks cascade).\n\n" +
  "BEGIN;\n" +
  "DELETE FROM public.authored_days WHERE day_id BETWEEN 11 AND 15;\n\n";

let dayCount = 0;
let blockCount = 0;
for (const d of days) {
  dayCount += 1;
  sql +=
    `INSERT INTO public.authored_days (day_id, title, subtitle, status, created_by)\n` +
    `  VALUES (${d.day}, ${sqlStr(d.title)}, ${sqlStr(d.subtitle)}, 'published', NULL);\n`;
  d.blocks.forEach((b, i) => {
    blockCount += 1;
    sql +=
      `INSERT INTO public.authored_blocks (day_id, sort, type, payload)\n` +
      `  VALUES (${d.day}, ${(i + 1) * 10}, ${sqlStr(b.type)}, ${jsonLit(b.payload)});\n`;
  });
  sql += "\n";
}
sql += "COMMIT;\n";

const out = "supabase/migrations/20260722000000_seed_week3_content.sql";
writeFileSync(out, sql);
console.log(`Wrote ${out}: ${dayCount} days, ${blockCount} blocks.`);
