"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  CalendarDays,
  Filter,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { CalendarPlanner } from "@/components/calendar/CalendarPlanner";
import { CourseCreateModal } from "@/components/calendar/CourseCreateModal";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import {
  categoryGradient,
  courseStats,
  excerpt,
  formatCourseDateRange,
} from "@/lib/calendar/course-helpers";
import {
  COURSE_CATEGORY_LABELS,
  STATUS_LABELS,
  toIsoDate,
  type CourseCategory,
  type CourseStatus,
} from "@/lib/calendar/types";
import { useRouter } from "next/navigation";

const ALL_CATEGORIES = Object.keys(COURSE_CATEGORY_LABELS) as CourseCategory[];

export default function AdminCorsiClient() {
  const router = useRouter();
  const { state, hydrated, overlaps } = useCalendar();
  const now = new Date();
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<CourseStatus | "all">("all");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(toIsoDate(now));
  const [highlightTeacherId, setHighlightTeacherId] = useState("");

  const courses = useMemo(() => {
    let list = [...state.courses].sort((a, b) =>
      b.startDate.localeCompare(a.startDate)
    );
    if (categoryFilter !== "all") {
      list = list.filter((c) => c.category === categoryFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.trim().toLocaleLowerCase("it-IT");
      list = list.filter(
        (c) =>
          c.title.toLocaleLowerCase("it-IT").includes(q) ||
          c.description.toLocaleLowerCase("it-IT").includes(q)
      );
    }
    return list;
  }, [state.courses, categoryFilter, statusFilter, query]);

  const totals = useMemo(
    () => ({
      all: state.courses.length,
      bozza: state.courses.filter((c) => c.status === "bozza").length,
      attivo: state.courses.filter((c) => c.status === "attivo").length,
      concluso: state.courses.filter((c) => c.status === "concluso").length,
    }),
    [state.courses]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: state.courses.length };
    for (const cat of ALL_CATEGORIES) {
      counts[cat] = state.courses.filter((c) => c.category === cat).length;
    }
    return counts;
  }, [state.courses]);

  const overlapDates = useMemo(
    () => [...new Set(overlaps.map((o) => o.date))],
    [overlaps]
  );

  if (!hydrated) {
    return (
      <div className="rounded-3xl border border-line/70 bg-white/50 p-8 text-sm text-ink-soft">
        Caricamento corsi…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-deep">
            Corsi
          </p>
          <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">
            Catalogo corsi
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Tutti i corsi creati: finalizza le bozze, modifica ogni dettaglio e
            apri il calendario per la programmazione.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="btn-primary gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuovo corso
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Totale", value: totals.all, icon: BookMarked },
          { label: "Bozze", value: totals.bozza, icon: Filter },
          { label: "Attivi", value: totals.attivo, icon: Sparkles },
          { label: "Conclusi", value: totals.concluso, icon: CalendarDays },
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

      <div className="glass space-y-4 rounded-3xl p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca per titolo o descrizione…"
              className="w-full rounded-2xl border border-line bg-white py-2.5 pl-10 pr-4 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as CourseStatus | "all")
            }
            className="rounded-2xl border border-line bg-white px-4 py-2.5 text-sm"
          >
            <option value="all">Tutti gli stati</option>
            <option value="bozza">Bozze</option>
            <option value="attivo">Attivi</option>
            <option value="concluso">Conclusi</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              categoryFilter === "all"
                ? "bg-teal text-white"
                : "border border-line bg-white text-ink-soft hover:border-teal/40"
            }`}
          >
            Tutte ({categoryCounts.all})
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                categoryFilter === cat
                  ? "bg-teal text-white"
                  : "border border-line bg-white text-ink-soft hover:border-teal/40"
              }`}
            >
              {COURSE_CATEGORY_LABELS[cat]} ({categoryCounts[cat] ?? 0})
            </button>
          ))}
        </div>
      </div>

      <section className="glass space-y-3 rounded-3xl p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              Calendario corsi
            </h2>
            <p className="text-xs text-ink-soft">
              Vista rapida con giorno, settimana, mese e anno — come in dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">
              Evidenzia docente
            </label>
            <select
              value={highlightTeacherId}
              onChange={(e) => setHighlightTeacherId(e.target.value)}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-sm"
            >
              <option value="">Tutti</option>
              {state.teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Link
              href="/admin/calendario"
              className="text-xs font-bold text-teal-deep hover:underline"
            >
              Calendario completo →
            </Link>
          </div>
        </div>

        <CalendarPlanner
          compact
          year={year}
          month={month}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onChangeMonth={(y, m) => {
            setYear(y);
            setMonth(m);
          }}
          highlightTeacherId={highlightTeacherId || undefined}
          markOverlapDates={overlapDates}
          enableNotes={false}
        />
      </section>

      {courses.length === 0 ? (
        <div className="glass rounded-3xl px-6 py-16 text-center">
          <BookMarked className="mx-auto h-12 w-12 text-teal/40" />
          <p className="mt-4 font-display text-xl font-bold text-ink">
            {state.courses.length === 0
              ? "Nessun corso ancora"
              : "Nessun corso con questi filtri"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Crea un corso con calendario lezioni: resterà in bozza finché non lo
            finalizzi.
          </p>
          {state.courses.length === 0 && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="btn-primary mt-6 gap-2"
            >
              <Plus className="h-4 w-4" />
              Crea il primo corso
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const stats = courseStats(course, state.lessons);
            const statusClass =
              course.status === "bozza"
                ? "bg-amber-100 text-amber-900"
                : course.status === "attivo"
                  ? "bg-teal/15 text-teal-deep"
                  : "bg-slate-100 text-slate-700";

            return (
              <Link
                key={course.id}
                href={`/admin/corsi/${course.id}`}
                className="group depth-card overflow-hidden rounded-3xl border border-line/70 bg-white/55 shadow-sm transition hover:border-teal/30"
              >
                <div
                  className="h-2"
                  style={{ background: course.color }}
                />
                <div
                  className="relative h-28 px-5 py-4 text-white"
                  style={{ background: categoryGradient(course.category) }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">
                    {COURSE_CATEGORY_LABELS[course.category]}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-bold leading-tight">
                    {course.title}
                  </h2>
                  <span
                    className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusClass}`}
                  >
                    {STATUS_LABELS[course.status]}
                  </span>
                </div>
                <div className="space-y-3 p-5">
                  <p className="text-sm text-ink-soft">{excerpt(course.description, 120)}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                    <ModalityBadge modality={course.modality} />
                    <span>{stats.lessons} lezioni</span>
                    <span>·</span>
                    <span>{course.totalHours}h previste</span>
                    <span>·</span>
                    <span>{stats.students} alunni</span>
                  </div>
                  <p className="text-xs text-ink-soft">
                    {formatCourseDateRange(course.startDate, course.endDate)}
                  </p>
                  <p className="flex items-center gap-1 text-xs font-bold text-teal-deep group-hover:underline">
                    Apri scheda corso
                    <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <CourseCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(courseId) => {
          setCreateOpen(false);
          router.push(`/admin/corsi/${courseId}`);
        }}
      />
    </div>
  );
}
