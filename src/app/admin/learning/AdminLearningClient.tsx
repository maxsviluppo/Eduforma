"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Layers,
  Plus,
  Sparkles,
} from "lucide-react";
import { LearningCourseCover } from "@/components/learning/LearningAssetPreview";
import { useLearning } from "@/lib/learning/LearningProvider";
import {
  categoryGradient,
  courseCoverAsset,
  courseCoverImageUrl,
  courseStats,
  excerpt,
} from "@/lib/learning/helpers";
import { LEARNING_CATEGORY_LABELS } from "@/lib/learning/types";

export default function AdminLearningClient() {
  const router = useRouter();
  const { courses, hydrated, createCourse } = useLearning();

  const totals = {
    courses: courses.length,
    published: courses.filter((c) => c.published).length,
    modules: courses.reduce((n, c) => n + c.modules.length, 0),
    assets: courses.reduce((n, c) => n + c.assets.length, 0),
  };

  const startCreate = () => {
    const id = createCourse({
      title: "Nuovo percorso learning",
      category: "tecnico",
      presentation: "",
    });
    router.push(`/admin/learning/${id}/modifica`);
  };

  if (!hydrated) {
    return (
      <div className="rounded-3xl border border-line/70 bg-white/50 p-8 text-sm text-ink-soft">
        Caricamento Learning…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-deep">
            Learning
          </p>
          <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">
            Dashboard corsi
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Elenco dei percorsi con anteprima e descrizione. Apri un corso per
            vedere moduli e contenuti multimediali.
          </p>
        </div>
        <button type="button" onClick={startCreate} className="btn-primary gap-2">
          <Plus className="h-4 w-4" />
          Nuovo corso
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Corsi", value: totals.courses, icon: BookOpen },
          { label: "Pubblicati", value: totals.published, icon: Sparkles },
          { label: "Moduli", value: totals.modules, icon: Layers },
          { label: "Contenuti", value: totals.assets, icon: BookOpen },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-ink-soft">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  {stat.label}
                </span>
              </div>
              <p className="mt-1 font-display text-2xl font-bold text-ink">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {courses.length === 0 ? (
        <div className="glass rounded-3xl px-6 py-16 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-teal/40" />
          <p className="mt-4 font-display text-xl font-bold text-ink">
            Nessun corso learning
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Crea il primo percorso: presentazione, contenuti multimediali e
            organizzazione a moduli.
          </p>
          <button type="button" onClick={startCreate} className="btn-primary mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Crea il primo corso
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const cover = courseCoverAsset(course);
            const stats = courseStats(course);
            return (
              <Link
                key={course.id}
                href={`/admin/learning/${course.id}`}
                className="group depth-card overflow-hidden rounded-3xl border border-line/70 bg-white/55 shadow-sm transition hover:border-teal/30"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <LearningCourseCover
                    coverImageUrl={courseCoverImageUrl(course)}
                    cover={cover}
                    categoryGradient={categoryGradient(course.category)}
                    title={course.title}
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                    {LEARNING_CATEGORY_LABELS[course.category]}
                  </span>
                  {course.published && (
                    <span className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold uppercase text-white">
                      Pubblicato
                    </span>
                  )}
                </div>

                <div className="space-y-3 p-5">
                  <div>
                    <h2 className="font-display text-xl font-bold text-ink transition group-hover:text-teal-deep">
                      {course.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                      {excerpt(course.presentation, 140)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] font-bold text-ink-soft">
                    <span className="rounded-full bg-teal/10 px-2.5 py-1 text-teal-deep">
                      {stats.modules} moduli
                    </span>
                    <span className="rounded-full bg-white/80 px-2.5 py-1">
                      {stats.assets} contenuti
                    </span>
                  </div>

                  {course.modules.length > 0 && (
                    <ul className="space-y-1 border-t border-line/60 pt-3">
                      {course.modules.slice(0, 3).map((mod) => (
                        <li
                          key={mod.id}
                          className="truncate text-xs font-semibold text-ink-soft"
                        >
                          · {mod.title}
                          {mod.items.length > 0 ? ` (${mod.items.length})` : ""}
                        </li>
                      ))}
                      {course.modules.length > 3 && (
                        <li className="text-xs font-bold text-teal-deep">
                          +{course.modules.length - 3} moduli
                        </li>
                      )}
                    </ul>
                  )}

                  <span className="inline-flex items-center gap-1 text-sm font-bold text-teal-deep">
                    Apri corso
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
