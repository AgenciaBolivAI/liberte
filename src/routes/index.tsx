import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Loader2,
  Mic,
  Send,
  Sparkles,
  Star,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import logoFull from "@/assets/liberte-logo-full.png.asset.json";
import mascot from "@/assets/liberte-mascot.png.asset.json";
import hero from "@/assets/bon-voyage-hero.png.asset.json";
import mois1 from "@/assets/mois1-jose.png.asset.json";
import mois2 from "@/assets/mois2-jevis.png.asset.json";
import mois3 from "@/assets/mois3-jecree.png.asset.json";
import mois4 from "@/assets/mois4-jeparle.png.asset.json";
import mois5 from "@/assets/mois5-jevoyage.png.asset.json";
import mois6 from "@/assets/mois6-jesuislibre.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Liberté — Aprende francés en 6 meses | Instituto de Francés" },
      {
        name: "description",
        content:
          "Programa premium de francés para hispanohablantes: lecciones diarias, clases en vivo por Zoom, desafíos con IA y tutora de conversación. De cero a hablar francés en 6 meses.",
      },
      { property: "og:title", content: "Liberté — Aprende francés en 6 meses" },
      {
        property: "og:description",
        content:
          "Lecciones diarias, clases en vivo y una tutora IA que conversa contigo en francés. Reserva tu lugar.",
      },
    ],
  }),
  component: LandingPage,
});

const SIGNUP_PATH = "/liberte-frances-98273425-plataforma-834823";
const LOGIN_PATH = "/liberte-log-in-983749824923465723";

const MONTHS = [
  { img: mois1, name: "J'OSE", subtitle: "Me atrevo", desc: "Tus primeras conversaciones reales: café, restaurante, compras." },
  { img: mois2, name: "JE VIS", subtitle: "Vivo", desc: "El francés de la vida diaria: casa, rutina, ciudad." },
  { img: mois3, name: "JE CRÉE", subtitle: "Creo", desc: "Construyes frases propias y cuentas historias." },
  { img: mois4, name: "JE PARLE", subtitle: "Hablo", desc: "Conversación fluida sobre lo que te importa." },
  { img: mois5, name: "JE VOYAGE", subtitle: "Viajo", desc: "Francés para viajar con confianza total." },
  { img: mois6, name: "JE SUIS LIBRE", subtitle: "Soy libre", desc: "La meta: te expresas con libertad." },
];

const STEPS = [
  { icon: BookOpen, title: "Lecciones diarias", desc: "20-45 minutos al día con vocabulario, audio y práctica guiada. Tu progreso se guarda solo." },
  { icon: Mic, title: "Défis con IA", desc: "Cada día terminas hablando: grabas tu voz y una profesora IA te evalúa y corrige al instante." },
  { icon: Video, title: "Clases en vivo", desc: "8 clases al mes por Zoom con tu profesora, en horarios para Europa y América." },
  { icon: Star, title: "Estrellas y rachas", desc: "Ganas estrellas por cada logro y ves tu progreso crecer semana a semana." },
];

// Real quotes only: fill this when students give permission to be featured.
// Shape: { quote: string; name: string; country: string }
const TESTIMONIALS: { quote: string; name: string; country: string }[] = [];

const FAQ = [
  {
    q: "¿Necesito saber algo de francés para empezar?",
    a: "No. El programa empieza desde cero y llega a un nivel A2-B1: suficiente para conversar, viajar y desenvolverte en francés.",
  },
  {
    q: "¿Cuánto tiempo necesito al día?",
    a: "Entre 20 y 45 minutos al día, 5 días a la semana, más las clases en vivo. El método está diseñado para caber en una vida ocupada.",
  },
  {
    q: "¿Cómo funcionan las clases en vivo?",
    a: "Son por Zoom, 8 al mes, con grupos reducidos y horarios pensados para Europa y América Latina.",
  },
  {
    q: "¿Qué hace la IA de Liberté?",
    a: "Te escucha hablar francés y te corrige con cariño: evalúa tus desafíos diarios, tu examen semanal, y puedes conversar con Lib, la tutora IA, cuando quieras practicar.",
  },
  {
    q: "¿Cuánto cuesta el programa?",
    a: "Escríbenos con el formulario y te contamos todos los detalles del programa y su inversión — cada grupo es pequeño y los cupos son limitados.",
  },
];

function LandingPage() {
  return (
    <div className="bg-ice text-navy">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <img src={logoFull.url} alt="Liberté · Instituto de Francés" className="h-10 w-auto" />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden text-navy sm:inline-flex">
              <Link to={LOGIN_PATH}>Iniciar sesión</Link>
            </Button>
            <Button asChild className="rounded-full bg-gradient-blue font-bold text-white">
              <a href="#inscripcion">Quiero información</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <img
          src={hero.url}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-linear-to-b from-navy/60 via-navy/40 to-navy" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold tracking-widest text-sky uppercase">
              <Sparkles className="h-3.5 w-3.5" /> Programa de 6 meses · A2-B1
            </p>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-6xl">
              Habla francés.
              <br />
              <span className="text-sky">Vive en libertad.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/85">
              Lecciones diarias, clases en vivo con profesora y una tutora IA que conversa contigo
              en francés. El método de Liberté te lleva de cero a conversar en 6 meses.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-gradient-blue px-8 font-display text-base font-extrabold text-white shadow-card">
                <a href="#inscripcion">
                  Reserva tu lugar <ArrowRight className="ml-1 h-5 w-5" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/40 bg-white/10 px-8 text-base font-bold text-white hover:bg-white/20">
                <Link to={SIGNUP_PATH}>Crear mi cuenta</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-white/60">
              Cupos limitados por grupo · Clases en horarios de Europa y América
            </p>
          </div>
        </div>
      </section>

      {/* Program: 6 months */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <p className="text-xs font-bold tracking-widest text-blue uppercase">El viaje</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
            6 meses, 6 conquistas
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-navy/70">
            Cada mes tiene un tema y una meta clara. Avanzas día a día con lecciones que se
            desbloquean a tu ritmo — y tu progreso se guarda siempre, en cualquier dispositivo.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MONTHS.map((m, i) => (
            <div key={m.name} className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-soft transition hover:shadow-card">
              <img src={m.img.url} alt={`Mes ${i + 1}: ${m.name}`} loading="lazy" className="h-40 w-full object-cover" />
              <div className="p-5">
                <p className="text-[10px] font-bold tracking-widest text-blue uppercase">Mes {i + 1}</p>
                <h3 className="font-display text-xl font-extrabold">
                  {m.name} <span className="text-sm font-bold text-navy/60">· {m.subtitle}</span>
                </h3>
                <p className="mt-1 text-sm text-navy/70">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold tracking-widest text-blue uppercase">El método</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Así aprendes cada día</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-3xl bg-ice p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-blue text-white shadow-soft">
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-[10px] font-bold tracking-widest text-blue uppercase">Paso {i + 1}</p>
                <h3 className="font-display text-lg font-extrabold">{s.title}</h3>
                <p className="mt-1 text-sm text-navy/70">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI */}
      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-widest text-sky uppercase">La IA de Liberté</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
              Una tutora que te escucha hablar francés
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                ["Conversa cuando quieras", "Lib, la tutora IA, charla contigo en francés sobre lo que estás aprendiendo — por texto o por voz."],
                ["Correcciones con cariño", "Cada desafío hablado se evalúa al momento: qué hiciste bien, qué mejorar y cómo decirlo."],
                ["Informe semanal", "Tu examen de la semana genera un informe con tu nota, fortalezas y plan de práctica."],
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-blue">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="font-display font-extrabold">{title}</span>
                    <span className="block text-sm text-white/75">{desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-3xl border border-white/15 bg-white/5 p-5 shadow-card">
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <img src={mascot.url} alt="" loading="lazy" className="h-10 w-10 object-contain" />
                <div>
                  <p className="font-display text-sm font-extrabold">Lib · Tutora IA</p>
                  <p className="text-[11px] text-white/60">Día 1 · Au café</p>
                </div>
              </div>
              <div className="space-y-3 pt-4 text-sm">
                <div className="max-w-[85%] rounded-2xl bg-white px-4 py-2.5 text-navy">
                  Bonjour ! Qu'est-ce que tu voudrais boire aujourd'hui ? ☕
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl bg-gradient-blue px-4 py-2.5">
                  Je veux un café, s'il vous plaît.
                </div>
                <div className="ml-auto max-w-[85%] rounded-xl border border-gold/50 bg-gold/10 px-3 py-2 text-xs">
                  ✏️ <span className="line-through opacity-70">Je veux</span> →{" "}
                  <span className="font-bold">Je voudrais</span>
                  <span className="block text-[11px] text-white/70">
                    « Je voudrais » es la forma cortés de pedir.
                  </span>
                </div>
                <div className="max-w-[85%] rounded-2xl bg-white px-4 py-2.5 text-navy">
                  Très bien ! Un café pour toi. Sur place ou à emporter ? 🥐
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials — hidden until real quotes exist */}
      {TESTIMONIALS.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="text-center">
            <p className="text-xs font-bold tracking-widest text-blue uppercase">Estudiantes</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Lo que dicen de Liberté</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-3xl border border-navy/10 bg-white p-6 shadow-soft">
                <blockquote className="text-sm text-navy/85">« {t.quote} »</blockquote>
                <figcaption className="mt-4 text-sm font-bold">
                  {t.name} <span className="font-normal text-navy/60">· {t.country}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Lead form */}
      <section id="inscripcion" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <div className="text-center">
            <img src={mascot.url} alt="" loading="lazy" className="mx-auto h-16 w-auto" />
            <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">Reserva tu lugar</h2>
            <p className="mt-2 text-navy/70">
              Déjanos tus datos y te contamos todo sobre el próximo grupo: fechas, método e
              inversión. Sin compromiso.
            </p>
          </div>
          <LeadForm />
          <p className="mt-4 text-center text-xs text-navy/60">
            ¿Ya tienes tu invitación?{" "}
            <Link to={SIGNUP_PATH} className="font-semibold text-blue hover:underline">
              Crea tu cuenta aquí
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center font-display text-3xl font-extrabold sm:text-4xl">Preguntas frecuentes</h2>
        <Accordion type="single" collapsible className="mt-8">
          {FAQ.map((f, i) => (
            <AccordionItem key={i} value={`q${i}`}>
              <AccordionTrigger className="text-left font-display font-bold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-navy/75">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-navy py-10 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:px-6">
          <img src={logoFull.url} alt="Liberté" className="h-10 w-auto brightness-0 invert" />
          <p className="text-sm text-white/70">Tu programa premium de 6 meses para hablar francés.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link to={LOGIN_PATH} className="text-sky hover:text-white">Iniciar sesión</Link>
            <a href="#inscripcion" className="text-sky hover:text-white">Inscripción</a>
            <a href="mailto:hola@libertefrances.com" className="text-sky hover:text-white">hola@libertefrances.com</a>
          </div>
          <p className="text-xs text-white/50">© {new Date().getFullYear()} Liberté · Instituto de Francés</p>
        </div>
      </footer>
    </div>
  );
}

function LeadForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/public/liberte-frances-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          ...(nationality.trim().length >= 2 ? { nationality: nationality.trim() } : {}),
          ...(phone.trim().length >= 6 ? { phone: phone.trim() } : {}),
        }),
      });
      if (res.ok) {
        setDone(true);
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (res.status === 502) {
        // Lead WAS saved; only the confirmation email failed.
        setDone(true);
      } else if (res.status === 429) {
        setError("Demasiadas solicitudes. Espera un minuto e inténtalo de nuevo.");
      } else if (res.status === 400) {
        setError(body?.error === "Datos inválidos" ? "Revisa tu nombre y tu correo." : (body?.error ?? "Revisa tus datos."));
      } else {
        // 500 and anything else: the lead was NOT saved — never fake success.
        setError(
          body?.error ??
            "No pudimos guardar tus datos. Inténtalo de nuevo o escríbenos a hola@libertefrances.com.",
        );
      }
    } catch {
      setError("No pudimos enviar tus datos. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 rounded-3xl border-2 border-success/40 bg-success/5 p-8 text-center">
        <p className="text-4xl">💌</p>
        <h3 className="mt-2 font-display text-xl font-extrabold">¡Datos recibidos!</h3>
        <p className="mt-2 text-sm text-navy/75">
          Revisa tu correo — te escribiremos muy pronto con toda la información del programa.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-3">
      <Input
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Tu nombre completo"
        required
        minLength={2}
        maxLength={100}
        className="h-12 rounded-xl bg-ice"
      />
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu correo electrónico"
        required
        className="h-12 rounded-xl bg-ice"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="WhatsApp (opcional)"
          className="h-12 rounded-xl bg-ice"
        />
        <Input
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          placeholder="País (opcional)"
          className="h-12 rounded-xl bg-ice"
        />
      </div>
      {error && <p className="text-sm text-red">{error}</p>}
      <Button
        type="submit"
        disabled={busy}
        className="h-12 w-full rounded-xl bg-gradient-blue font-display text-base font-extrabold text-white shadow-card"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <>
            Quiero información <Send className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      <p className="text-center text-[11px] text-navy/50">
        Usamos tus datos solo para contactarte sobre el programa.
      </p>
    </form>
  );
}
