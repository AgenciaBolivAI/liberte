// Shared model for teacher-authored lesson content (days 11-120). Blocks are
// typed JSONB payloads rendered by AuthoredDayView and edited in ContentManager.

export type BlockType =
  | "video"
  | "text"
  | "vocab"
  | "quiz"
  | "writing"
  | "speaking"
  | "file"
  | "link";

export type BlockPayload = {
  // video: YouTube URL or uploaded file URL
  url?: string;
  // text/writing/speaking
  title?: string;
  body?: string;
  prompt?: string;
  example?: string;
  // vocab
  items?: { fr: string; es: string }[];
  // quiz
  questions?: { q: string; options: string[]; correct: number }[];
  // file/link
  name?: string;
  label?: string;
};

export type AuthoredBlock = {
  id: string;
  day_id: number;
  sort: number;
  type: BlockType;
  payload: BlockPayload;
};

export type AuthoredDay = {
  day_id: number;
  title: string;
  subtitle: string;
  status: "draft" | "published";
};

export const BLOCK_TYPE_META: Record<BlockType, { label: string; emoji: string }> = {
  video: { label: "Video (YouTube o archivo)", emoji: "🎬" },
  text: { label: "Texto / explicación", emoji: "📖" },
  vocab: { label: "Vocabulario (FR → ES)", emoji: "🗂️" },
  quiz: { label: "Quiz de opción múltiple", emoji: "✅" },
  writing: { label: "Escritura (corrección IA)", emoji: "✍️" },
  speaking: { label: "Oral (grabar + corrección IA)", emoji: "🎙️" },
  file: { label: "Archivo (PDF, diapositivas…)", emoji: "📎" },
  link: { label: "Enlace externo", emoji: "🔗" },
};

/** 5 days/week — the week an authored day belongs to. */
export const weekOfAuthoredDay = (dayId: number): number => Math.ceil(dayId / 5);

/** YouTube URL → embeddable URL; passthrough for uploaded files. */
export function toEmbedUrl(url: string): { kind: "youtube"; embed: string } | { kind: "file"; url: string } {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/,
  );
  if (m) return { kind: "youtube", embed: `https://www.youtube.com/embed/${m[1]}` };
  return { kind: "file", url };
}
