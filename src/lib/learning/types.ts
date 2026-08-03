export type LearningMediaType =
  | "video"
  | "audio"
  | "pdf"
  | "slide"
  | "image"
  | "link"
  | "other";

export type LearningCategory =
  | "sicurezza"
  | "haccp"
  | "lingua"
  | "informatica"
  | "soft-skill"
  | "tecnico"
  | "altro";

export const LEARNING_CATEGORY_LABELS: Record<LearningCategory, string> = {
  sicurezza: "Sicurezza sul lavoro",
  haccp: "HACCP / Igiene",
  lingua: "Lingue",
  informatica: "Informatica",
  "soft-skill": "Soft skill",
  tecnico: "Tecnico / Professionale",
  altro: "Altro",
};

export type LearningAsset = {
  id: string;
  type: LearningMediaType;
  title: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  /** Data URL o URL esterno (link) */
  url?: string;
  notes?: string;
  createdAt: string;
};

export type LearningModuleItem = {
  assetId: string;
  /** Nota opzionale per la posizione nel percorso */
  note?: string;
};

export type LearningModule = {
  id: string;
  title: string;
  description?: string;
  items: LearningModuleItem[];
};

export type LearningCourse = {
  id: string;
  title: string;
  category: LearningCategory;
  /** Presentazione / descrizione del corso */
  presentation: string;
  /** Immagine di copertina / anteprima del corso */
  coverImageUrl?: string;
  assets: LearningAsset[];
  /** Organizzazione a richiesta: moduli ordinati */
  modules: LearningModule[];
  /** Asset in libreria non ancora assegnati a un modulo */
  unassignedAssetIds: string[];
  published: boolean;
  updatedAt: string;
  createdAt: string;
};

export type LearningState = {
  courses: LearningCourse[];
};

export const LEARNING_MEDIA_LABELS: Record<LearningMediaType, string> = {
  video: "Video",
  audio: "Audio",
  pdf: "PDF",
  slide: "Slide",
  image: "Immagine",
  link: "Link",
  other: "Altro",
};

export function detectMediaType(file: File): LearningMediaType {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (mime.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/.test(name)) return "video";
  if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/.test(name)) return "audio";
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    mime.includes("presentation") ||
    /\.(ppt|pptx|key|odp)$/.test(name)
  )
    return "slide";
  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(name))
    return "image";
  return "other";
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateLearningId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Limite immagine copertina corso */
export const MAX_COVER_IMAGE_BYTES = 2 * 1024 * 1024;

/** Limite per salvare il file come data URL in localStorage */
export const MAX_EMBED_BYTES = 1.5 * 1024 * 1024;
