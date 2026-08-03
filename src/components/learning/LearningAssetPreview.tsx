"use client";

import { useEffect, type ReactNode } from "react";
import { ExternalLink, Play, X } from "lucide-react";
import { resolveMediaEmbed } from "@/lib/learning/embed";
import {
  LEARNING_MEDIA_LABELS,
  type LearningAsset,
} from "@/lib/learning/types";

function PlayerSurface({
  asset,
  className = "",
  autoPlay = false,
}: {
  asset: LearningAsset;
  className?: string;
  autoPlay?: boolean;
}) {
  const embed = resolveMediaEmbed(asset.url, asset.type);

  if (!embed || embed.kind === "none") {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/60 p-8 text-center ${className}`}
      >
        <p className="text-sm font-semibold text-ink-soft">
          Anteprima non disponibile per questo contenuto.
        </p>
        {asset.url && !asset.url.startsWith("data:") && (
          <a
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-bold text-teal-deep underline"
          >
            Apri risorsa esterna
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    );
  }

  if (embed.kind === "youtube" || embed.kind === "vimeo" || embed.kind === "iframe") {
    const src = autoPlay && embed.kind === "youtube"
      ? `${embed.embedUrl}${embed.embedUrl?.includes("?") ? "&" : "?"}autoplay=1`
      : embed.embedUrl;
    return (
      <iframe
        src={src}
        title={asset.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className={`aspect-video w-full rounded-2xl border border-line bg-black ${className}`}
      />
    );
  }

  if (embed.kind === "video") {
    return (
      <video
        src={embed.embedUrl}
        controls
        autoPlay={autoPlay}
        playsInline
        className={`aspect-video w-full rounded-2xl bg-black object-contain ${className}`}
      />
    );
  }

  if (embed.kind === "audio") {
    return (
      <div
        className={`flex min-h-40 flex-col items-center justify-center gap-4 rounded-2xl bg-teal/10 px-6 py-8 ${className}`}
      >
        <audio src={embed.embedUrl} controls autoPlay={autoPlay} className="w-full max-w-lg" />
      </div>
    );
  }

  if (embed.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={embed.embedUrl}
        alt={asset.title}
        className={`max-h-[70vh] w-full rounded-2xl object-contain ${className}`}
      />
    );
  }

  if (embed.kind === "pdf") {
    return (
      <iframe
        src={embed.embedUrl}
        title={asset.title}
        className={`min-h-[60vh] w-full rounded-2xl border border-line bg-white ${className}`}
      />
    );
  }

  return null;
}

export function LearningMediaPreview({
  asset,
  size = "card",
  onOpen,
}: {
  asset: LearningAsset;
  size?: "compact" | "card" | "hero";
  onOpen?: () => void;
}) {
  const heightClass =
    size === "compact" ? "h-24" : size === "hero" ? "h-52 md:h-64" : "h-40";
  const embed = resolveMediaEmbed(asset.url, asset.type);
  const clickable = Boolean(onOpen && embed && embed.kind !== "none");

  const wrap = (content: ReactNode) => {
    if (!clickable) return content;
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`group relative block w-full overflow-hidden rounded-2xl text-left ${heightClass}`}
      >
        {content}
        <span className="absolute inset-0 flex items-center justify-center bg-ink/0 transition group-hover:bg-ink/25">
          <span className="grid h-12 w-12 scale-90 place-items-center rounded-full bg-white/90 text-teal-deep opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-100">
            <Play className="h-5 w-5 fill-current" />
          </span>
        </span>
      </button>
    );
  };

  if (embed?.kind === "youtube" && embed.thumbnailUrl) {
    return wrap(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={embed.thumbnailUrl}
        alt={asset.title}
        className={`${heightClass} w-full object-cover`}
      />
    );
  }

  if (embed?.kind === "image" && embed.embedUrl) {
    const img = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={embed.embedUrl}
        alt={asset.title}
        className={`${heightClass} w-full rounded-2xl object-cover`}
      />
    );
    return clickable ? wrap(img) : img;
  }

  if (embed?.kind === "video" && embed.embedUrl && !asset.url?.includes("youtube")) {
    const video = (
      <video
        src={embed.embedUrl}
        muted
        playsInline
        preload="metadata"
        className={`${heightClass} w-full rounded-2xl bg-black object-cover`}
      />
    );
    return clickable ? wrap(video) : video;
  }

  if (embed?.kind === "pdf" && embed.embedUrl) {
    return wrap(
      <iframe
        src={embed.embedUrl}
        title={asset.title}
        className={`pointer-events-none ${heightClass} w-full rounded-2xl border border-line bg-white`}
      />
    );
  }

  if (embed?.kind === "vimeo" || embed?.kind === "iframe") {
    return wrap(
      <div
        className={`flex ${heightClass} w-full flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-teal/15 to-azure/15 px-4 text-center`}
      >
        <Play className="h-9 w-9 text-teal-deep" />
        <span className="line-clamp-2 text-xs font-bold text-ink">
          {asset.title}
        </span>
        <span className="line-clamp-1 text-[10px] text-ink-soft">
          {LEARNING_MEDIA_LABELS[asset.type]} · Anteprima in app
        </span>
      </div>
    );
  }

  if (embed?.kind === "audio") {
    return (
      <div
        className={`flex ${heightClass} w-full flex-col items-center justify-center gap-2 rounded-2xl bg-teal/10 px-4`}
      >
        <Play className="h-8 w-8 text-teal-deep" />
        <span className="text-xs font-bold text-ink">{asset.title}</span>
        {clickable && (
          <button
            type="button"
            onClick={onOpen}
            className="text-[10px] font-bold uppercase text-teal-deep underline"
          >
            Ascolta in app
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex ${heightClass} w-full flex-col items-center justify-center gap-2 rounded-2xl bg-white/60 px-4 text-center`}
    >
      <Play className="h-8 w-8 text-teal-deep" />
      <span className="text-xs font-bold text-ink-soft">
        {LEARNING_MEDIA_LABELS[asset.type]}
      </span>
    </div>
  );
}

export function LearningMediaViewerModal({
  asset,
  open,
  onClose,
}: {
  asset: LearningAsset | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !asset) return null;

  const embed = resolveMediaEmbed(asset.url, asset.type);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/45 p-3 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        className="glass-strong flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] shadow-[0_30px_90px_rgba(15,28,46,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line/70 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-teal-deep">
              {LEARNING_MEDIA_LABELS[asset.type]}
            </p>
            <h3 className="truncate font-display text-xl font-bold text-ink">
              {asset.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/80 text-ink-soft hover:text-ink"
            aria-label="Chiudi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 md:p-6">
          <PlayerSurface asset={asset} autoPlay />
          {asset.notes && (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {asset.notes}
            </p>
          )}
          {embed?.originalUrl && !embed.originalUrl.startsWith("data:") && (
            <p className="mt-3 truncate text-xs text-ink-soft">
              Sorgente: {embed.originalUrl}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** @deprecated use LearningMediaPreview */
export function LearningAssetPreview({
  asset,
  size = "card",
  onOpen,
}: {
  asset: LearningAsset;
  size?: "compact" | "card" | "hero";
  onOpen?: () => void;
}) {
  return <LearningMediaPreview asset={asset} size={size} onOpen={onOpen} />;
}

export function LearningCourseCover({
  coverImageUrl,
  cover,
  categoryGradient,
  title,
  className = "",
}: {
  coverImageUrl?: string;
  cover: { url?: string; type: string } | null;
  categoryGradient: string;
  title: string;
  className?: string;
}) {
  if (coverImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverImageUrl}
        alt={title}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  const embed = cover?.url
    ? resolveMediaEmbed(cover.url, cover.type as LearningAsset["type"])
    : null;

  if (embed?.kind === "image" && embed.embedUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={embed.embedUrl}
        alt={title}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  if (embed?.kind === "youtube" && embed.thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={embed.thumbnailUrl}
        alt={title}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  if (embed?.kind === "video" && embed.embedUrl) {
    return (
      <video
        src={embed.embedUrl}
        muted
        playsInline
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center ${className}`}
      style={{ background: categoryGradient }}
    >
      <span className="px-4 text-center font-display text-lg font-bold text-white drop-shadow">
        {title}
      </span>
    </div>
  );
}
