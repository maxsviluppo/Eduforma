"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Pencil,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { ConfirmModal } from "@/components/calendar/ConfirmModal";
import { LessonChip } from "@/components/calendar/LessonChip";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import { personAbbrev } from "@/lib/calendar/calendar-display";
import {
  categoryGradient,
  courseStats,
  formatCourseDateRange,
} from "@/lib/calendar/course-helpers";
import {
  COURSE_CATEGORY_LABELS,
  STATUS_LABELS,
  courseTeacherIds,
} from "@/lib/calendar/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CourseDetailClient({ courseId }: { courseId: string }) {
  const router = useRouter();
  const {
    state,
    hydrated,
    getCourse,
    getTeacher,
    getLessonsForCourse,
    getSchool,
    updateCourse,
    concludeCourse,
    deleteCourse,
  } = useCalendar();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const course = getCourse(courseId);
  const lessons = getLessonsForCourse(courseId);

  const teachers = useMemo(() => {
    if (!course) return [];
    return courseTeacherIds(course)
      .map((id) => state.teachers.find((t) => t.id === id))
      .filter(Boolean);
  }, [course, state.teachers]);

  const room = course?.roomId
    ? state.rooms.find((r) => r.id === course.roomId)
    : undefined;
  const school = course ? getSchool(course.schoolId) : undefined;
  const stats = course ? courseStats(course, state.lessons) : null;

  if (!hydrated) {
    return (
      <div className="rounded-3xl border border-line/70 bg-white/50 p-8 text-sm text-ink-soft">
        Caricamento…
      </div>
    );
  }

  if (!course) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <p className="font-display text-xl font-bold text-ink">Corso non trovato</p>
        <Link href="/admin/corsi" className="btn-primary mt-4 inline-flex">
          Torna al catalogo
        </Link>
      </div>
    );
  }

  const statusClass =
    course.status === "bozza"
      ? "bg-amber-100 text-amber-900"
      : course.status === "attivo"
        ? "bg-teal/15 text-teal-deep"
        : "bg-slate-100 text-slate-700";

  const finalize = () => updateCourse(courseId, { status: "attivo" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-3">
        <Link
          href="/admin/corsi"
          className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Catalogo
        </Link>
        <div className="ml-auto flex flex-wrap gap-2">
          {course.status === "bozza" && (
            <button type="button" onClick={finalize} className="btn-primary gap-2">
              <Sparkles className="h-4 w-4" />
              Finalizza corso
            </button>
          )}
          {course.status === "attivo" && (
            <button
              type="button"
              onClick={() => concludeCourse(courseId)}
              className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold text-ink hover:border-teal/40"
            >
              <CheckCircle2 className="mr-1 inline h-4 w-4" />
              Segna concluso
            </button>
          )}
          <Link
            href={`/admin/corsi/${courseId}/modifica`}
            className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold text-ink hover:border-teal/40"
          >
            <Pencil className="mr-1 inline h-4 w-4" />
            Modifica
          </Link>
          <Link
            href={`/admin/calendario?date=${course.startDate}`}
            className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold text-ink hover:border-teal/40"
          >
            <CalendarDays className="mr-1 inline h-4 w-4" />
            Calendario
          </Link>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
          >
            <Trash2 className="mr-1 inline h-4 w-4" />
            Elimina
          </button>
        </div>
      </div>

      <header
        className="overflow-hidden rounded-3xl text-white"
        style={{ background: categoryGradient(course.category) }}
      >
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold uppercase">
              {COURSE_CATEGORY_LABELS[course.category]}
            </span>
            <span className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase ${statusClass}`}>
              {STATUS_LABELS[course.status]}
            </span>
            <span
              className="rounded-full px-3 py-0.5 text-xs font-bold uppercase"
              style={{ backgroundColor: course.color }}
            >
              Colore calendario
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            {course.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-white/90">{course.description}</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Lezioni", value: stats?.lessons ?? 0, icon: CalendarDays },
          { label: "Ore previste", value: `${course.totalHours}h`, icon: Clock3 },
          {
            label: "Ore in calendario",
            value: `${stats?.scheduledHours ?? 0}h`,
            icon: Clock3,
          },
          { label: "Partecipanti", value: stats?.students ?? 0, icon: Users },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="glass rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-ink-soft">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  {item.label}
                </span>
              </div>
              <p className="mt-1 font-display text-2xl font-bold text-ink">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="glass rounded-3xl p-5">
          <h2 className="font-display text-lg font-bold text-ink">Dettagli</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Modalità</dt>
              <dd>
                <ModalityBadge modality={course.modality} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Periodo</dt>
              <dd className="font-medium text-ink">
                {formatCourseDateRange(course.startDate, course.endDate)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Scuola</dt>
              <dd className="font-medium text-ink">{school?.name ?? "—"}</dd>
            </div>
            {room && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Aula</dt>
                <dd className="font-medium text-ink">{room.name}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Alunni</dt>
              <dd className="font-medium text-ink">{course.studentCount}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Giornate</dt>
              <dd className="font-medium text-ink">{course.daysCount}</dd>
            </div>
          </dl>
        </section>

        <section className="glass rounded-3xl p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <GraduationCap className="h-5 w-5 text-teal" />
            Docenti
          </h2>
          {teachers.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Nessun docente assegnato.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {teachers.map((teacher) => (
                <li
                  key={teacher!.id}
                  className="flex items-center justify-between rounded-xl border border-line/70 bg-white/70 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-ink">{teacher!.name}</span>
                  <span className="text-xs text-ink-soft">
                    {personAbbrev(teacher!.name)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="glass rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-ink">
            Lezioni programmate ({lessons.length})
          </h2>
          <p className="text-xs text-ink-soft">
            Modifica date e docenti dal{" "}
            <Link href="/admin/calendario" className="font-bold text-teal-deep underline">
              calendario
            </Link>
          </p>
        </div>
        {lessons.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">
            Nessuna lezione ancora. Apri il calendario per aggiungerne.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {lessons.map((lesson) => {
              const teacher = state.teachers.find((t) => t.id === lesson.teacherId);
              return (
                <li
                  key={lesson.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-line/70 bg-white/70 px-4 py-3"
                >
                  <LessonChip
                    lesson={lesson}
                    getCourse={getCourse}
                    getTeacher={getTeacher}
                    size="sm"
                  />
                  <span className="text-sm font-medium text-ink">{lesson.title}</span>
                  {teacher && (
                    <span className="text-xs text-ink-soft">{teacher.name}</span>
                  )}
                  <ModalityBadge modality={lesson.modality} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {course.status === "bozza" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-bold">Corso in bozza</p>
          <p className="mt-1">
            Puoi modificare ogni campo (categoria, modalità, docenti, date) dalla
            pagina Modifica. Quando è pronto, clicca <strong>Finalizza corso</strong>{" "}
            per impostarlo come attivo.
          </p>
        </div>
      )}

      <ConfirmModal
        open={deleteOpen}
        danger
        title="Eliminare il corso?"
        message={`Stai per eliminare «${course.title}» e tutte le ${lessons.length} lezioni collegate.`}
        confirmLabel="Elimina corso"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteCourse(courseId);
          setDeleteOpen(false);
          router.push("/admin/corsi");
        }}
      />
    </div>
  );
}
