import type { LearningMediaType } from "./types";

export type MediaEmbedKind =
  | "youtube"
  | "vimeo"
  | "video"
  | "audio"
  | "image"
  | "pdf"
  | "iframe"
  | "none";

export type MediaEmbed = {
  kind: MediaEmbedKind;
  embedUrl?: string;
  thumbnailUrl?: string;
  originalUrl: string;
};

function parseYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      const shorts = parsed.pathname.match(/^\/shorts\/([^/?]+)/);
      if (shorts) return shorts[1];
      const embed = parsed.pathname.match(/^\/embed\/([^/?]+)/);
      if (embed) return embed[1];
    }
  } catch {
    return null;
  }
  return null;
}

function parseVimeoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
    const match = parsed.pathname.match(/\/(?:video\/)?(\d+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function isDirectMedia(url: string, extensions: RegExp): boolean {
  try {
    const parsed = new URL(url);
    return extensions.test(parsed.pathname);
  } catch {
    return extensions.test(url);
  }
}

function isDataUrl(url: string): boolean {
  return url.startsWith("data:");
}

export function resolveMediaEmbed(
  url: string | undefined,
  type?: LearningMediaType
): MediaEmbed | null {
  if (!url?.trim()) return null;
  const originalUrl = url.trim();

  if (isDataUrl(originalUrl)) {
    if (type === "video") {
      return { kind: "video", embedUrl: originalUrl, originalUrl };
    }
    if (type === "audio") {
      return { kind: "audio", embedUrl: originalUrl, originalUrl };
    }
    if (type === "image") {
      return { kind: "image", embedUrl: originalUrl, originalUrl };
    }
    if (type === "pdf") {
      return { kind: "pdf", embedUrl: originalUrl, originalUrl };
    }
    return { kind: "none", originalUrl };
  }

  const youtubeId = parseYoutubeId(originalUrl);
  if (youtubeId) {
    return {
      kind: "youtube",
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      originalUrl,
    };
  }

  const vimeoId = parseVimeoId(originalUrl);
  if (vimeoId) {
    return {
      kind: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      originalUrl,
    };
  }

  if (
    type === "video" ||
    isDirectMedia(originalUrl, /\.(mp4|webm|mov|mkv|m4v)(\?|$)/i)
  ) {
    return { kind: "video", embedUrl: originalUrl, originalUrl };
  }

  if (
    type === "audio" ||
    isDirectMedia(originalUrl, /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i)
  ) {
    return { kind: "audio", embedUrl: originalUrl, originalUrl };
  }

  if (
    type === "image" ||
    isDirectMedia(originalUrl, /\.(png|jpe?g|gif|webp|svg)(\?|$)/i)
  ) {
    return { kind: "image", embedUrl: originalUrl, originalUrl };
  }

  if (
    type === "pdf" ||
    isDirectMedia(originalUrl, /\.pdf(\?|$)/i)
  ) {
    return { kind: "pdf", embedUrl: originalUrl, originalUrl };
  }

  if (originalUrl.includes("docs.google.com/presentation")) {
    const embedUrl = originalUrl.includes("/pub")
      ? originalUrl.replace("/edit", "/pub")
      : `${originalUrl}${originalUrl.includes("?") ? "&" : "?"}embedded=true`;
    return { kind: "iframe", embedUrl, originalUrl };
  }

  if (type === "link" || type === "slide" || type === "other") {
    return { kind: "iframe", embedUrl: originalUrl, originalUrl };
  }

  return { kind: "iframe", embedUrl: originalUrl, originalUrl };
}

export function canPlayInApp(asset: {
  url?: string;
  type: LearningMediaType;
}): boolean {
  const embed = resolveMediaEmbed(asset.url, asset.type);
  return Boolean(embed && embed.kind !== "none");
}
