import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { TopNav } from "@/components/TopNav";

export type PlusResource = {
  id: string;
  emoji: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  note?: string;
  youtubeId: string;
};

export const PLUS_RESOURCES_BY_WEEK: Record<string, PlusResource[]> = {
  "1": [
    {
      id: "1",
      emoji: "🗣️",
      eyebrow: "Cápsula de pronunciación",
      title: "Los sonidos clave de la Semana 1",
      subtitle: "Un video corto para afinar tu acento.",
      youtubeId: "DpG-AQW3si8",
    },
    {
      id: "2",
      emoji: "🎵",
      eyebrow: "Chanson de la semaine",
      title: "La canción de la semana",
      subtitle: "Aprende francés con música.",
      youtubeId: "8IjWHBGzsu4",
    },
    {
      id: "3",
      emoji: "😄",
      eyebrow: "Video comprensión",
      title: "Un video para reír un poquito",
      subtitle: "Video extra para reír y practicar la escucha.",
      note: "Video extra para reír un poquito y practicar la escucha del francés.",
      youtubeId: "TPGI7ZddFww",
    },
  ],
  "2": [
    {
      id: "1",
      emoji: "🎙️",
      eyebrow: "Cápsula de pronunciación",
      title: "Los sonidos clave de la Semana 2",
      subtitle: "Un video corto para afinar tu acento.",
      youtubeId: "Q67LGA-DIo0",
    },
    {
      id: "2",
      emoji: "🎵",
      eyebrow: "Chanson de la semaine",
      title: "La canción de la semana",
      subtitle: "Aprende francés con música.",
      youtubeId: "yleB8fUXudw",
    },
    {
      id: "3",
      emoji: "🎬",
      eyebrow: "Compréhension orale",
      title: "Un episodio para entrenar el oído",
      subtitle: "Mira este episodio en francés con subtítulos en francés.",
      note: "Mira este episodio en francés con subtítulos en francés. Anota aparte las palabras que no comprendes, búscalas, y crea tu propio vocabulario. Así es como se aprende de verdad.",
      youtubeId: "0dxhYxdnVic",
    },
  ],
};

export const Route = createFileRoute("/plus/$weekId/$itemId")({
  head: ({ params }) => {
    const res = (PLUS_RESOURCES_BY_WEEK[params.weekId] ?? []).find((r) => r.id === params.itemId);
    return {
      meta: [
        { title: `${res?.title ?? "Le petit plus"} · Semaine ${params.weekId} · Liberté` },
        { name: "description", content: res?.subtitle ?? "Recurso extra de la semana." },
      ],
    };
  },
  component: PlusItemPage,
});

function PlusItemPage() {
  const { weekId, itemId } = Route.useParams();
  const navigate = useNavigate();
  const resources = PLUS_RESOURCES_BY_WEEK[weekId] ?? [];
  const idx = resources.findIndex((r) => r.id === itemId);
  const resource = resources[idx];

  if (!resource) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">Recurso no encontrado.</p>
        <Link to="/day/$dayId" params={{ dayId: "1" }} className="mt-4 inline-block text-blue underline">Volver</Link>
      </div>
    );
  }

  const prev = resources[idx - 1];
  const next = resources[idx + 1];

  return (
    <div className="min-h-screen bg-ice pb-20">
      <TopNav />
      {/* Not sticky: TopNav owns the persistent header. */}
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link
            to="/day/$dayId"
            params={{ dayId: String((Number(weekId) - 1) * 5 + 1) }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-navy/70 hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al programa
          </Link>
          <p className="font-display text-sm font-extrabold text-navy">Semaine {weekId}</p>
          <span className="w-24" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-3xl bg-gradient-to-br from-[oklch(0.32_0.08_265)] via-[oklch(0.4_0.09_265)] to-[oklch(0.28_0.08_265)] p-6 text-white shadow-card sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold tracking-widest text-gold uppercase">
            <Sparkles className="h-3 w-3" /> Le petit plus · Recurso {idx + 1} de {resources.length}
          </div>
          <p className="mt-3 text-[11px] font-bold tracking-widest text-gold uppercase">{resource.eyebrow}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">{resource.emoji} {resource.title}</h1>
          <p className="mt-2 text-sm text-white/85">{resource.subtitle}</p>
        </div>

        {resource.note && (
          <div className="mt-6 rounded-2xl border border-dashed border-gold/40 bg-gold/5 p-4 text-sm text-navy/80">
            💡 {resource.note}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
          <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
            <iframe
              src={`https://www.youtube.com/embed/${resource.youtubeId}?rel=0`}
              title={resource.title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          {prev ? (
            <button
              onClick={() => navigate({ to: "/plus/$weekId/$itemId", params: { weekId, itemId: prev.id } })}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-navy shadow-soft transition hover:bg-ice"
            >
              <ArrowLeft className="h-4 w-4" /> {prev.emoji} {prev.title}
            </button>
          ) : <span />}
          {next ? (
            <button
              onClick={() => navigate({ to: "/plus/$weekId/$itemId", params: { weekId, itemId: next.id } })}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-blue px-5 py-2.5 text-sm font-extrabold text-white shadow-card transition hover:brightness-105"
            >
              {next.emoji} {next.title} <ArrowRight className="h-4 w-4" />
            </button>
          ) : <span />}
        </div>
      </main>
    </div>
  );
}
