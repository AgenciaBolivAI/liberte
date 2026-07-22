// Generates the week-4 (days 16-20) content seed for the authoring system.
// Day 16 follows the detailed "Prompt Lovable Día 16" spec (couleurs, vestiaire,
// pronoms COD, ça me va, exercices F1/F2/F4). Days 17-20 come from the Mes 1:
// J'OSE dictionary + curriculum (same flow as weeks 1-3).
// Run: `node scripts/seed-week4.mjs` → supabase/migrations/20260722000001_seed_week4_content.sql
import { writeFileSync } from "node:fs";

const v = (fr, es) => ({ fr, es });

const days = [
  /* ---------------- DÍA 16 — Vêtements II (Lovable spec) ---------------- */
  {
    day: 16,
    title: "Jour 16 · Dans le vestiaire",
    subtitle: "Vêtements II — pronoms COD (le/la/les), ça me va, couleurs et probador",
    blocks: [
      {
        type: "text",
        payload: {
          title: "🎯 Objectif du jour",
          body:
            "Comentar cómo te queda algo (trop grand, ça me va), comparar prendas y decidir la compra usando los pronombres COD (le/la/les). Aprendes también los colores. (Situación: Tienda de ropa · Competencias DELF: CO + PO)",
        },
      },
      {
        type: "text",
        payload: {
          title: "📖 Grammaire — Pronoms COD : le / la / les",
          body:
            "En francés no repites el nombre de la prenda cuando ya se sabe de qué hablas: usas un pronombre COD.\n• LE = masculino singular → Je le prends. (le pantalon, le pull, le jean)\n• LA = femenino singular → Je la prends. (la robe, la veste, la chemise)\n• LES = plural → Je les prends. (les chaussures, les chemises)\n\n📌 Regla: el pronombre va SIEMPRE antes del verbo. Je le prends — nunca «je prends le».\n⚠️ En negación va entre NE y el verbo: Je ne le prends pas.\n\nEjemplos de tienda:\n• « Vous prenez ce pull ? » → « Oui, je le prends ! »\n• « Et cette robe ? » → « Non, je ne la prends pas, c'est trop cher. »\n• « Ces chaussures vous plaisent ? » → « Oui ! Je les prends. »",
        },
      },
      {
        type: "text",
        payload: {
          title: "📖 Grammaire — Ça me va (verbe ALLER, pas ÊTRE)",
          body:
            "« ÇA ME VA » es la frase del probador. Usa el verbo ALLER (ir/quedar/sentar), NO être. El vestido «va» = te favorece. Nunca se dice « c'est me va ».\n\nEstructura: ÇA (sujeto) + ME (pronombre) + VA (verbo aller).\n\n• Ça me va très bien. — Me queda muy bien.\n• Ça ne me va pas. — No me queda bien.\n• Ça vous va très bien ! — ¡Le queda muy bien! (el vendedor)\n• Ça me va parfaitement. — Me queda perfectamente.\n• Ça taille grand. — Talla grande → pide una talla menos.\n• Ça taille petit. — Talla pequeña → pide una talla más.",
        },
      },
      {
        type: "text",
        payload: {
          title: "📖 Révision — Démonstratifs (ce / cet / cette / ces)",
          body:
            "El demostrativo SEÑALA; el pronombre COD REEMPLAZA. Trabajan juntos en la tienda:\n• ce + masc.: Ce pull me va très bien — je le prends !\n• cet + masc. con vocal: Cet imperméable est parfait — je le prends aussi.\n• cette + fem.: Cette robe me va parfaitement — je la prends !\n• ces + plural: Ces chaussures sont confortables — je les prends toutes !\n\n✅ Démonstratif para señalar · Pronom COD para reemplazar.",
        },
      },
      {
        type: "vocab",
        payload: {
          items: [
            v("rouge", "rojo/a"),
            v("bleu / bleue", "azul"),
            v("vert / verte", "verde"),
            v("noir / noire", "negro/a"),
            v("blanc / blanche", "blanco/a"),
            v("gris / grise", "gris"),
            v("rose", "rosa (invariable)"),
            v("marron", "marrón / café (invariable)"),
            v("beige", "beige (invariable)"),
            v("orange", "naranja (invariable)"),
            v("violet / violette", "violeta / morado/a"),
            v("jaune", "amarillo/a"),
          ],
        },
      },
      {
        type: "vocab",
        payload: {
          items: [
            v("ça me va", "me queda bien"),
            v("ça ne me va pas", "no me queda bien"),
            v("trop grand / grande", "demasiado grande"),
            v("trop petit / petite", "demasiado pequeño/a"),
            v("trop long / longue", "demasiado largo/a"),
            v("trop court / courte", "demasiado corto/a"),
            v("ça taille grand", "talla grande (pedir talla menos)"),
            v("ça taille petit", "talla pequeña (pedir talla más)"),
            v("parfait / parfaite", "perfecto/a"),
            v("l'échange", "el cambio"),
            v("le remboursement", "el reembolso"),
            v("le ticket de caisse", "el tiquete / el recibo"),
            v("en soldes", "de rebajas / en oferta"),
            v("la réduction", "el descuento"),
            v("la caisse", "la caja (pago)"),
            v("payer par carte", "pagar con tarjeta"),
            v("en espèces", "en efectivo"),
            v("la nouvelle collection", "la nueva colección"),
          ],
        },
      },
      {
        type: "text",
        payload: {
          title: "🗝️ Expressions clés",
          body:
            "• Ça me va très bien ! Je la prends. — Me queda muy bien, me lo llevo.\n• C'est trop petit. Vous avez une taille au-dessus ? — Es muy pequeño, ¿tiene una talla más?\n• Ça taille grand — je prends du S en général.\n• Je voudrais faire un échange / un remboursement.\n• Je peux payer par carte ?",
        },
      },
      {
        type: "quiz",
        payload: {
          questions: [
            { q: "J'aime beaucoup ce pull. Je ___ prends !", options: ["la", "le", "les"], correct: 1 },
            { q: "Cette robe me va très bien. Je ___ prends.", options: ["la", "le", "les"], correct: 0 },
            { q: "Ces chaussures sont parfaites. Je ___ prends !", options: ["le", "la", "les"], correct: 2 },
            { q: "Ce manteau est magnifique. Je ___ prends.", options: ["le", "la", "les"], correct: 0 },
            { q: "Cette veste ne me va pas. Je ne ___ prends pas.", options: ["le", "la", "les"], correct: 1 },
            { q: "Ces chemises sont en soldes ! Je ___ prends toutes.", options: ["le", "la", "les"], correct: 2 },
          ],
        },
      },
      {
        type: "quiz",
        payload: {
          questions: [
            {
              q: "El vestido le queda perfectamente y decide comprarlo. ¿Qué dice?",
              options: ["Ça ne me va pas.", "Ça me va parfaitement ! Je la prends.", "C'est trop grand."],
              correct: 1,
            },
            {
              q: "El pantalón le aprieta y necesita una talla más grande. ¿Qué dice?",
              options: ["Ça me va très bien.", "Ça taille grand.", "C'est trop petit. Vous avez une taille au-dessus ?"],
              correct: 2,
            },
            {
              q: "La chaqueta es demasiado cara y no la compra. ¿Qué dice?",
              options: ["Cette veste est trop chère. Je ne la prends pas.", "Cette veste me va bien. Je la prends.", "Je prends la veste — c'est bon marché."],
              correct: 0,
            },
          ],
        },
      },
      {
        type: "quiz",
        payload: {
          questions: [
            { q: "¿Dónde va el pronombre COD en francés?", options: ["Después del verbo", "Antes del verbo", "Al final de la frase", "Después del sujeto"], correct: 1 },
            { q: "¿Cómo dices «me llevo el vestido» (robe = femenino)?", options: ["Je le prends.", "Je la prends.", "Je les prends.", "Je prends la."], correct: 1 },
            { q: "¿Qué significa «ça taille grand»?", options: ["El vestido es muy grande.", "Esta marca talla grande — necesitas una talla menos.", "Hay que comprar una talla más.", "La talla grande está agotada."], correct: 1 },
            { q: "El cliente dice «ça me va». ¿Qué verbo usa?", options: ["Être", "Aller", "Avoir", "Prendre"], correct: 1 },
            { q: "¿Cómo dices que no te llevas los zapatos (chaussures = plural)?", options: ["Je ne le prends pas.", "Je ne la prends pas.", "Je ne les prends pas.", "Je prends les pas."], correct: 2 },
            { q: "¿Cómo preguntas si puedes pagar con tarjeta?", options: ["Vous payez par carte ?", "Je peux payer par carte ?", "Carte, s'il vous plaît.", "C'est par carte ici ?"], correct: 1 },
          ],
        },
      },
      {
        type: "text",
        payload: {
          title: "💬 Dialogue modèle — Du vestiaire à la caisse",
          body:
            "Vendeur : Bonjour ! Je peux vous aider ?\nClient : Je voudrais essayer cette veste en noir, taille M.\nVendeur : Bien sûr. Les cabines sont au fond à droite.\nClient : C'est un peu trop grand. Vous avez en S ?\nVendeur : Voilà en S. Ça vous va mieux ?\nClient : Oui, ça me va parfaitement. C'est en soldes ?\nVendeur : Oui, 30% de réduction cette semaine.\nClient : Parfait ! Je la prends. Je peux payer par carte ?\nVendeur : Bien sûr. La caisse est à gauche.",
        },
      },
      {
        type: "writing",
        payload: {
          title: "✍️ Production écrite — Le, la, les",
          prompt:
            "Escribe 4 frases usando los pronombres COD (le/la/les) para decir qué prendas te llevas y cuáles no (incluye una negación).",
          example:
            "Ce pull me plaît, je le prends. Cette robe est trop chère, je ne la prends pas. Ces chaussures sont parfaites, je les prends toutes ! Ce manteau est trop grand, je ne le prends pas.",
        },
      },
      {
        type: "speaking",
        payload: {
          title: "🎙️ Production orale — Ma compra complète",
          prompt:
            "Enregistre-toi : entra a la tienda, pide probarte una prenda con talla y color, di cómo te queda (ça me va) y decide (je le/la/les prends). Termina preguntando cómo pagar.",
          example:
            "Bonjour ! Je voudrais essayer cette veste en taille M. … Ça me va très bien ! Je la prends. Je peux payer par carte ?",
        },
      },
    ],
  },

  /* ---------------- DÍA 17 — Mercado I ---------------- */
  {
    day: 17,
    title: "Jour 17 · Au marché — les fruits",
    subtitle: "Marché I — expressions de quantité (un kilo de / une barquette de)",
    blocks: [
      {
        type: "text",
        payload: {
          title: "🎯 Objectif du jour",
          body:
            "Comprar frutas con cantidades (un kilo de, une barquette de) y preguntar si están frescas y de temporada. (Situación: Mercado · Competencias DELF: CO + PO)",
        },
      },
      {
        type: "text",
        payload: {
          title: "📖 Grammaire — Expressions de quantité",
          body:
            "Para comprar cantidades se usa un contenedor/medida + DE (¡sin artículo!): un kilo DE tomates, une barquette DE fraises, 500 grammes DE cerises, un bouquet DE persil.\n\n⚠️ El artículo desaparece después de la cantidad: NO «un kilo des tomates» ni «un kilo de les fraises».\n\nFórmula: contenedor + de + nom (sin artículo).\n\nEjemplos:\n• Un kilo de pommes, s'il vous plaît.\n• Une barquette de fraises. · 500 grammes de cerises.\n• C'est combien le kilo ? (¿Cuánto cuesta el kilo?)\n🔊 kilo [kilo] · barquette [baʁkɛt]",
        },
      },
      {
        type: "vocab",
        payload: {
          items: [
            v("un stand", "un puesto"),
            v("un marchand", "un vendedor de mercado"),
            v("un produit frais", "un producto fresco"),
            v("de saison", "de temporada"),
            v("une pomme", "una manzana"),
            v("une poire", "una pera"),
            v("une fraise", "una fresa"),
            v("une cerise", "una cereza"),
            v("une pêche", "un melocotón"),
            v("un abricot", "un albaricoque"),
            v("du raisin", "uvas"),
            v("un melon", "un melón"),
            v("une pastèque", "una sandía"),
            v("une orange", "una naranja"),
            v("un citron", "un limón"),
            v("une banane", "un plátano"),
            v("une mangue", "un mango"),
            v("un ananas", "una piña"),
            v("un avocat", "un aguacate"),
            v("mûr", "maduro"),
            v("un kilo de…", "un kilo de…"),
            v("500 grammes de…", "500 gramos de…"),
            v("une barquette de…", "una barqueta de…"),
            v("un bouquet de…", "un manojo de…"),
            v("C'est combien le kilo ?", "¿Cuánto cuesta el kilo?"),
            v("Donnez-moi…", "Deme…"),
            v("C'est frais d'aujourd'hui ?", "¿Es de hoy?"),
            v("un producteur local", "un productor local"),
            v("un étal", "un puesto de mercado"),
            v("une prune", "una ciruela"),
          ],
        },
      },
      {
        type: "text",
        payload: {
          title: "🗝️ Expressions clés",
          body:
            "• C'est combien le kilo de tomates ? · Donnez-moi un kilo et demi.\n• Ces fraises sont de saison ? · C'est frais d'aujourd'hui ?\n• Une barquette de fraises, s'il vous plaît. · Un bouquet de persil.",
        },
      },
      {
        type: "quiz",
        payload: {
          questions: [
            { q: "«Un kilo de manzanas»:", options: ["un kilo de pommes", "un kilo des pommes", "un kilo de les pommes"], correct: 0 },
            { q: "«¿Cuánto cuesta el kilo?»:", options: ["C'est combien le kilo ?", "C'est combien de kilo ?", "Combien le kilo est ?"], correct: 0 },
            { q: "«Maduro»:", options: ["mûr", "frais", "de saison"], correct: 0 },
            { q: "«Deme…»:", options: ["Donnez-moi…", "Donne-moi le…", "Vous donnez…"], correct: 0 },
            { q: "«Una barqueta de fresas»:", options: ["une barquette de fraises", "une barquette des fraises", "un barquette de fraise"], correct: 0 },
          ],
        },
      },
      {
        type: "writing",
        payload: {
          title: "✍️ Production écrite — Liste du marché",
          prompt:
            "Escribe una lista de compra del mercado con 5 frutas usando cantidades correctas (un kilo de…, une barquette de…, 500 grammes de…).",
          example:
            "Un kilo de pommes, une barquette de fraises, 500 grammes de cerises, deux bananes bien mûres et un melon.",
        },
      },
      {
        type: "speaking",
        payload: {
          title: "🎙️ Production orale — Acheter des fruits",
          prompt:
            "Enregistre-toi en achetant 3 fruits avec les quantités, en demandant le prix au kilo et si c'est de saison.",
          example:
            "Bonjour, c'est combien le kilo de tomates ? Donnez-moi un kilo, s'il vous plaît. Et ces fraises, elles sont de saison ? Alors une barquette aussi.",
        },
      },
      {
        type: "text",
        payload: {
          title: "💬 Dialogue modèle",
          body:
            "Client : Bonjour, c'est combien le kilo de tomates ?\nMarchand : 2 euros le kilo, madame.\nClient : Donnez-moi un kilo et demi, s'il vous plaît. Et vous avez du basilic frais ?\nMarchand : Oui, voilà. Un bouquet de basilic.\nClient : Parfait. Et ces fraises, elles sont de saison ?\nMarchand : Oui, elles arrivent ce matin.\nClient : Alors une barquette, s'il vous plaît. Ça fait combien en tout ?",
        },
      },
    ],
  },

  /* ---------------- DÍA 18 — Mercado II ---------------- */
  {
    day: 18,
    title: "Jour 18 · Au marché — légumes & épices",
    subtitle: "Marché II — les articles partitifs (du / de la / des / de l')",
    blocks: [
      {
        type: "text",
        payload: {
          title: "🎯 Objectif du jour",
          body:
            "Comprar verduras, hierbas y especias usando los artículos partitivos (du, de la, des, de l') en contexto real de compra. (Situación: Mercado · Competencias DELF: CE + PE)",
        },
      },
      {
        type: "text",
        payload: {
          title: "📖 Grammaire — Les articles partitifs",
          body:
            "Los partitivos expresan una cantidad indeterminada de algo:\n• du + masculino: du persil, du basilic.\n• de la + femenino: de la menthe, de la coriandre.\n• des + plural: des épinards, des haricots verts.\n• de l' + vocal / h muda: de l'ail, de l'eau.\n\n⚠️ No uses un/une con incontables: NO «un lait» → du lait.\n\nFórmula: du / de la / des / de l' + nom.\n🔊 du [dy] · de la [dəla] · des [de] · de l' [dəl]",
        },
      },
      {
        type: "vocab",
        payload: {
          items: [
            v("une tomate", "un tomate"),
            v("une carotte", "una zanahoria"),
            v("une pomme de terre", "una patata"),
            v("un oignon", "una cebolla"),
            v("de l'ail", "ajo"),
            v("une courgette", "un calabacín"),
            v("une aubergine", "una berenjena"),
            v("un poivron", "un pimiento"),
            v("un champignon", "un champiñón"),
            v("des épinards", "espinacas"),
            v("de la laitue", "lechuga"),
            v("du brocoli", "brócoli"),
            v("des haricots verts", "judías verdes"),
            v("des petits pois", "guisantes"),
            v("du maïs", "maíz"),
            v("du persil", "perejil"),
            v("du basilic", "albahaca"),
            v("de la coriandre", "cilantro"),
            v("de la menthe", "menta"),
            v("du gingembre", "jengibre"),
            v("du piment", "guindilla / ají picante"),
            v("une épice", "una especia"),
            v("une tranche de…", "una rebanada / rodaja de…"),
            v("un morceau de…", "un trozo de…"),
            v("du / de la / des / de l'", "artículos partitivos"),
            v("Il me faut…", "Necesito… / Me hace falta…"),
            v("C'est pour combien de personnes ?", "¿Para cuántas personas es?"),
            v("un poireau", "un puerro"),
            v("du chou", "col / repollo"),
            v("du thym", "tomillo"),
          ],
        },
      },
      {
        type: "text",
        payload: {
          title: "🗝️ Expressions clés",
          body:
            "• Il me faut du persil et de l'ail. · Une tranche de melon.\n• Un morceau de fromage. · C'est pour combien de personnes ?\n• Du / de la / des / de l'.",
        },
      },
      {
        type: "quiz",
        payload: {
          questions: [
            { q: "«Ajo» (con partitivo):", options: ["de l'ail", "du ail", "de la ail"], correct: 0 },
            { q: "«Espinacas»:", options: ["des épinards", "du épinards", "de la épinards"], correct: 0 },
            { q: "«Necesito…»:", options: ["Il me faut…", "Il me faux…", "Je me faut…"], correct: 0 },
            { q: "«Menta» (femenino):", options: ["du menthe", "de la menthe", "des menthe"], correct: 1 },
            { q: "«Un trozo de queso»:", options: ["un morceau de fromage", "un morceau du fromage", "un morceau des fromage"], correct: 0 },
          ],
        },
      },
      {
        type: "writing",
        payload: {
          title: "✍️ Production écrite — Liste d'ingrédients",
          prompt:
            "Escribe una lista de ingredientes para una receta usando los partitivos du / de la / des / de l'.",
          example:
            "Pour la recette, il me faut de l'ail, du persil, des tomates, de la coriandre et de l'huile d'olive.",
        },
      },
      {
        type: "speaking",
        payload: {
          title: "🎙️ Production orale — Légumes et herbes",
          prompt:
            "Enregistre-toi en demandant des légumes et des herbes au marché avec les partitifs (dis pour combien de personnes tu cuisines).",
          example:
            "Bonjour, il me faut des courgettes, de l'ail et du basilic. C'est pour quatre personnes. Vous avez aussi de la menthe fraîche ?",
        },
      },
    ],
  },

  /* ---------------- DÍA 19 — Gimnasio I ---------------- */
  {
    day: 19,
    title: "Jour 19 · À la salle de sport",
    subtitle: "Gym I — s'inscrire + verbes pronominaux (s'entraîner / se reposer)",
    blocks: [
      {
        type: "text",
        payload: {
          title: "🎯 Objectif du jour",
          body:
            "Inscribirse en un gimnasio, preguntar por tarifas, cursos y horarios, y hablar de objetivos deportivos con verbos pronominales. (Situación: Gimnasio · Competencias DELF: CO + PO)",
        },
      },
      {
        type: "text",
        payload: {
          title: "📖 Grammaire — Les verbes pronominaux",
          body:
            "Los verbos pronominales llevan un pronombre reflexivo (me/te/se…). Muy comunes para hablar de rutinas:\n• je me + verbe : je m'entraîne (me entreno), je me repose (descanso).\n• tu te + verbe : tu te muscles.\n• il/elle se + verbe : elle se repose.\n\n⚠️ No olvides el pronombre: NO «je entraîne» → je m'entraîne.\n\nEjemplos: s'entraîner (entrenarse), se reposer (descansar), se muscler (ganar músculo).\n🔊 je m'entraîne [ʒə mɑ̃tʁɛn] · se reposer [sərəpoze]",
        },
      },
      {
        type: "vocab",
        payload: {
          items: [
            v("une salle de sport", "un gimnasio"),
            v("un essai gratuit", "una prueba gratis"),
            v("une inscription", "una inscripción"),
            v("les frais d'inscription", "los gastos de inscripción"),
            v("mensuel", "mensual"),
            v("annuel", "anual"),
            v("un cours collectif", "una clase colectiva"),
            v("un coach sportif", "un entrenador personal"),
            v("un programme", "un programa"),
            v("une séance", "una sesión"),
            v("un entraînement", "un entrenamiento"),
            v("un échauffement", "un calentamiento"),
            v("un étirement", "un estiramiento"),
            v("le cardio", "el cardio"),
            v("la musculation", "la musculación"),
            v("le yoga", "el yoga"),
            v("le pilates", "el pilates"),
            v("la zumba", "la zumba"),
            v("la natation", "la natación"),
            v("un vestiaire", "un vestuario"),
            v("une douche", "una ducha"),
            v("un casier", "una taquilla"),
            v("une gourde", "una botella reutilizable"),
            v("une tenue de sport", "ropa deportiva"),
            v("un legging", "unas mallas"),
            v("un haltère", "una mancuerna"),
            v("un tapis de course", "una cinta de correr"),
            v("un vélo elliptique", "una bicicleta elíptica"),
            v("se muscler", "ganar músculo"),
            v("s'entraîner", "entrenarse"),
          ],
        },
      },
      {
        type: "text",
        payload: {
          title: "🗝️ Expressions clés",
          body:
            "• Je voudrais m'inscrire. · Quel est le tarif ?\n• C'est inclus dans l'abonnement ? · Je m'entraîne trois fois par semaine.\n• Un cours collectif · un coach sportif · une séance.",
        },
      },
      {
        type: "quiz",
        payload: {
          questions: [
            { q: "«Me entreno»:", options: ["je m'entraîne", "je entraîne", "j'entraîne me"], correct: 0 },
            { q: "«Quisiera inscribirme»:", options: ["Je voudrais m'inscrire.", "Je voudrais inscrire.", "Je voudrais me inscrire."], correct: 0 },
            { q: "«Un abono mensual»:", options: ["un abonnement mensuel", "un abonnement annuel", "une séance"], correct: 0 },
            { q: "«Descansar»:", options: ["se reposer", "se muscler", "s'entraîner"], correct: 0 },
            { q: "«¿Está incluido en el abono?»:", options: ["C'est inclus dans l'abonnement ?", "C'est inclus dans l'abonné ?", "Est inclus l'abonnement ?"], correct: 0 },
          ],
        },
      },
      {
        type: "writing",
        payload: {
          title: "✍️ Production écrite — Ma routine",
          prompt:
            "Escribe 4 frases sobre tu rutina deportiva usando verbos pronominales (s'entraîner, se reposer, se muscler, s'échauffer).",
          example:
            "Je m'entraîne trois fois par semaine. Je m'échauffe avant chaque séance. Je me muscle avec des haltères. Le week-end, je me repose.",
        },
      },
      {
        type: "speaking",
        payload: {
          title: "🎙️ Production orale — S'inscrire à la salle",
          prompt:
            "Enregistre-toi en t'inscrivant à une salle de sport : demande le tarif, les horaires et ce qui est inclus.",
          example:
            "Bonjour, je voudrais m'inscrire. Quel est le tarif mensuel ? Les cours collectifs sont inclus dans l'abonnement ? Je m'entraîne trois fois par semaine.",
        },
      },
    ],
  },

  /* ---------------- DÍA 20 — Gimnasio II · Reto final J'OSE ---------------- */
  {
    day: 20,
    title: "Jour 20 · Objectifs & Défi final J'OSE",
    subtitle: "Gym II — verbes pronominaux + révision intégrée du mois J'OSE",
    blocks: [
      {
        type: "text",
        payload: {
          title: "🎯 Objectif du jour",
          body:
            "Hablar de tus objetivos y resultados deportivos, y completar el RETO FINAL J'OSE: integrar las 10 situaciones del mes en un audio/video real. (Situación: Gimnasio · Competencias DELF: las 4)",
        },
      },
      {
        type: "text",
        payload: {
          title: "📖 Révision intégrée — J'OSE",
          body:
            "Hoy repasas TODO el mes J'OSE. Recuerda las herramientas clave:\n• Je voudrais… (cortesía) · sans/avec · cantidades.\n• Il y a / il n'y a pas de · pour + infinitif · avoir mal à.\n• Comparatifs (plus/moins/aussi… que) · démonstratifs (ce/cette/ces).\n• Partitifs (du/de la/des) · verbes pronominaux (je me…).\n\nÚsalas todas juntas en situaciones reales: café, panadería, restaurante, supermercado, transporte, direcciones, farmacia, tienda, mercado y gimnasio.",
        },
      },
      {
        type: "vocab",
        payload: {
          items: [
            v("se tonifier", "tonificarse"),
            v("perdre du poids", "perder peso"),
            v("prendre du muscle", "ganar músculo"),
            v("transpirer", "sudar"),
            v("se reposer", "descansar"),
            v("récupérer", "recuperarse"),
            v("progresser", "progresar"),
            v("s'améliorer", "mejorar"),
            v("se blesser", "lesionarse"),
            v("se dépasser", "superarse"),
            v("être en forme", "estar en forma"),
            v("tenir la forme", "mantenerse en forma"),
            v("se sentir bien", "sentirse bien"),
            v("être fatigué(e)", "estar cansado/a"),
            v("avoir des courbatures", "tener agujetas"),
            v("un objectif", "un objetivo"),
            v("un résultat", "un resultado"),
            v("la motivation", "la motivación"),
            v("un suivi", "un seguimiento"),
            v("un programme personnalisé", "un programa personalizado"),
            v("peser", "pesar"),
            v("souffler", "tomar aliento"),
            v("Je m'entraîne trois fois par semaine.", "Me entreno tres veces a la semana."),
            v("Je voudrais m'inscrire.", "Quisiera inscribirme."),
            v("C'est inclus dans l'abonnement ?", "¿Está incluido en el abono?"),
            v("Je veux me remettre en forme.", "Quiero ponerme en forma."),
            v("Quel est votre objectif ?", "¿Cuál es su objetivo?"),
            v("avoir la patate", "tener energía (informal)"),
            v("un bilan", "una evaluación"),
            v("Je fais du sport pour me sentir bien.", "Hago deporte para sentirme bien."),
          ],
        },
      },
      {
        type: "text",
        payload: {
          title: "🗝️ Expressions clés",
          body:
            "• Je m'entraîne trois fois par semaine. · Je veux me remettre en forme.\n• Quel est votre objectif ? · C'est inclus dans l'abonnement ?\n• Je fais du sport pour me sentir bien.",
        },
      },
      {
        type: "quiz",
        payload: {
          questions: [
            { q: "«Ponerme en forma»:", options: ["me remettre en forme", "me reposer", "me blesser"], correct: 0 },
            { q: "«Un objetivo»:", options: ["un objectif", "un résultat", "un bilan"], correct: 0 },
            { q: "«Tener agujetas»:", options: ["avoir des courbatures", "être fatigué", "transpirer"], correct: 0 },
            { q: "«Superarse»:", options: ["se dépasser", "se reposer", "se peser"], correct: 0 },
            { q: "«Hago deporte para sentirme bien»:", options: ["Je fais du sport pour me sentir bien.", "Je fais le sport pour sentir bien.", "Je fais du sport pour me sens bien."], correct: 0 },
          ],
        },
      },
      {
        type: "text",
        payload: {
          title: "🏆 Défi final du mois — J'ose vivre en français",
          body:
            "¡Felicidades! Llegas al reto final del Mes 1: J'OSE.\n\nGraba un audio o video de 3 a 5 minutos resolviendo 5 mini situaciones reales que mezclen los contextos del mes (por ejemplo: pedir en un café, comprar en el mercado, pedir indicaciones, describir un síntoma en la farmacia, inscribirte en el gimnasio).\n\nUsa las estructuras del mes: je voudrais, il y a, pour aller à, avoir mal à, comparatifs, partitifs, verbes pronominaux.\n\n🏅 Medalla: « Parisien(ne) accompli(e) » — Sais acheter, comparer et décider en français. Félicitations !\n\n💬 « La fluidez nace usando el idioma antes de sentirte listo/a. J'OSE ! »",
        },
      },
      {
        type: "speaking",
        payload: {
          title: "🎙️ Reto final J'OSE — 5 situaciones reales",
          prompt:
            "Graba tu audio/video de 3-5 minutos resolviendo 5 situaciones reales del mes en francés (café, mercado, direcciones, farmacia, gimnasio). Aquí puedes practicar y grabar tu intento.",
          example:
            "Bonjour ! Je voudrais un café, s'il vous plaît. … Pour aller au marché, s'il vous plaît ? … Un kilo de pommes et une barquette de fraises. … J'ai mal à la tête depuis hier, qu'est-ce que vous me conseillez ? … Je voudrais m'inscrire à la salle de sport.",
        },
      },
    ],
  },
];

/* ---------------- SQL generation ---------------- */
const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
const jsonLit = (obj) => `$json$${JSON.stringify(obj)}$json$::jsonb`;

let sql =
  "-- Week-4 lesson content (days 16-20) for the authoring system.\n" +
  "-- Day 16 from the detailed 'Prompt Lovable Día 16' spec; days 17-20 from the\n" +
  "-- Mes 1: J'OSE dictionary + curriculum. Idempotent: replaces days 16-20.\n\n" +
  "BEGIN;\n" +
  "DELETE FROM public.authored_days WHERE day_id BETWEEN 16 AND 20;\n\n";

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

const out = "supabase/migrations/20260722000001_seed_week4_content.sql";
writeFileSync(out, sql);
console.log(`Wrote ${out}: ${dayCount} days, ${blockCount} blocks.`);
