"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Pencil,
  Sparkles,
} from "lucide-react";
import {
  LearningCourseCover,
  LearningMediaPreview,
  LearningMediaViewerModal,
} from "@/components/learning/LearningAssetPreview";
import { canPlayInApp } from "@/lib/learning/embed";
import { useLearning } from "@/lib/learning/LearningProvider";
import {
  categoryGradient,
  courseCoverAsset,
  courseCoverImageUrl,
  courseStats,
  excerpt,
} from "@/lib/learning/helpers";
import {
  LEARNING_CATEGORY_LABELS,
  LEARNING_MEDIA_LABELS,
  formatBytes,
  type LearningAsset,
} from "@/lib/learning/types";

function ContentCard({
  asset,
  index,
  onOpen,
}: {
  asset: LearningAsset;
  index: number;
  onOpen: (asset: LearningAsset) => void;
}) {
  const playable = canPlayInApp(asset);

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-line/70 bg-white/55 transition ${
        playable ? "cursor-pointer hover:border-teal/40 hover:shadow-md" : ""
      }`}
      onClick={() => playable && onOpen(asset)}
      onKeyDown={(e) => {
        if (playable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen(asset);
        }
      }}
      role={playable ? "button" : undefined}
      tabIndex={playable ? 0 : undefined}
    >
      <LearningMediaPreview
        asset={asset}
        size="card"
        onOpen={playable ? () => onOpen(asset) : undefined}
      />
      <div className="space-y-1 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">
          {index + 1}. {LEARNING_MEDIA_LABELS[asset.type]}
        </p>
        <h3 className="font-display text-base font-bold text-ink">{asset.title}</h3>
        <p className="text-xs text-ink-soft">
          {asset.fileName ? `${asset.fileName}` : ""}
          {asset.size ? ` · ${formatBytes(asset.size)}` : ""}
        </p>
        {playable && (
          <p className="text-[11px] font-bold text-teal-deep">
            Clicca per aprire in app
          </p>
        )}
        {asset.notes && (
          <p className="text-xs text-amber-800">{asset.notes}</p>
        )}
      </div>
    </article>
  );
}

export default function LearningCourseClient({ courseId }: { courseId: string }) {
  const { courses, hydrated } = useLearning();
  const course = courses.find((c) => c.id === courseId);
  const [viewerAsset, setViewerAsset] = useState<LearningAsset | null>(null);

  const assetMap = useMemo(() => {
    const map = new Map<string, LearningAsset>();
    course?.assets.forEach((a) => map.set(a.id, a));
    return map;
  }, [course]);

  if (!hydrated) {
    return (
      <div className="rounded-3xl border border-line/70 bg-white/50 p-8 text-sm text-ink-soft">
        Caricamento corso…
      </div>
    );
  }

  if (!course) {
    return (
      <div className="glass rounded-3xl px-6 py-16 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-ink-soft" />
        <p className="mt-3 font-display text-xl font-bold text-ink">
          Corso non trovato
        </p>
        <Link href="/admin/learning" className="btn-primary mt-6 inline-flex">
          Torna alla dashboard
        </Link>
      </div>
    );
  }

  const cover = courseCoverAsset(course);
  const stats = courseStats(course);
  const unassignedAssets = course.unassignedAssetIds
    .map((id) => assetMap.get(id))
    .filter((a): a is LearningAsset => Boolean(a));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/learning"
          className="inline-flex items-center gap-2 text-sm font-bold text-teal-deep hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard corsi
        </Link>
        <Link
          href={`/admin/learning/${course.id}/modifica`}
          className="btn-ghost gap-2 text-sm"
        >
          <Pencil className="h-4 w-4" />
          Modifica corso
        </Link>
      </div>

      <section className="glass overflow-hidden rounded-3xl">
        <div className="grid gap-0 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="relative min-h-[220px] md:min-h-[320px]">
            <LearningCourseCover
              coverImageUrl={courseCoverImageUrl(course)}
              cover={cover}
              categoryGradient={categoryGradient(course.category)}
              title={course.title}
              className="absolute inset-0"
            />
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal-deep">
                {LEARNING_CATEGORY_LABELS[course.category]}
              </span>
              {course.published && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  Pubblicato
                </span>
              )}
            </div>
            <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">
              {course.title}
            </h1>
            <p className="text-sm leading-relaxed text-ink-soft md:text-base">
              {course.presentation.trim()
                ? course.presentation
                : "Nessuna presentazione inserita."}
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-bold text-ink-soft">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5">
                <Layers className="h-3.5 w-3.5" />
                {stats.modules} moduli
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {stats.assets} contenuti
              </span>
            </div>
          </div>
        </div>
      </section>

      {course.modules.length === 0 && course.assets.length === 0 ? (
        <div className="glass rounded-3xl px-6 py-14 text-center">
          <p className="font-display text-lg font-bold text-ink">
            Nessun contenuto ancora
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Vai in modifica per caricare media e organizzare i moduli.
          </p>
          <Link
            href={`/admin/learning/${course.id}/modifica`}
            className="btn-primary mt-5 inline-flex gap-2"
          >
            <Pencil className="h-4 w-4" />
            Aggiungi contenuti
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {course.modules.map((mod, modIndex) => {
            const items = mod.items
              .map((item) => assetMap.get(item.assetId))
              .filter((a): a is LearningAsset => Boolean(a));

            return (
              <section key={mod.id} className="glass rounded-3xl p-5 md:p-6">
                <div className="mb-5 border-b border-line/60 pb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
                    Modulo {modIndex + 1}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-ink">
                    {mod.title}
                  </h2>
                  {mod.description?.trim() && (
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
                      {mod.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-bold text-ink-soft">
                    {items.length} contenuti
                  </p>
                </div>

                {items.length === 0 ? (
                  <p className="rounded-2xl bg-white/40 px-4 py-8 text-center text-sm text-ink-soft">
                    Nessun contenuto in questo modulo.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((asset, index) => (
                      <ContentCard
                        key={asset.id}
                        asset={asset}
                        index={index}
                        onOpen={setViewerAsset}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {unassignedAssets.length > 0 && (
            <section className="glass rounded-3xl p-5 md:p-6">
              <div className="mb-5 border-b border-line/60 pb-4">
                <h2 className="font-display text-2xl font-bold text-ink">
                  Libreria non assegnata
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Contenuti caricati ma non ancora inseriti in un modulo.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {unassignedAssets.map((asset, index) => (
                  <ContentCard
                    key={asset.id}
                    asset={asset}
                    index={index}
                    onOpen={setViewerAsset}
                  />
                ))}
              </div>
            </section>
          )}

          {course.modules.length === 0 && course.assets.length > 0 && (
            <section className="glass rounded-3xl p-5 md:p-6">
              <div className="mb-5 border-b border-line/60 pb-4">
                <h2 className="font-display text-2xl font-bold text-ink">
                  Contenuti del corso
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {excerpt(
                    "Organizza i contenuti in moduli dalla pagina di modifica.",
                    120
                  )}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {course.assets.map((asset, index) => (
                  <ContentCard
                    key={asset.id}
                    asset={asset}
                    index={index}
                    onOpen={setViewerAsset}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
      <LearningMediaViewerModal
        asset={viewerAsset}
        open={Boolean(viewerAsset)}
        onClose={() => setViewerAsset(null)}
      />
    </div>
  );
}
