"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  Clock3,
  FileText,
  MapPin,
  MonitorPlay,
  PlayCircle,
  StickyNote,
  Users,
} from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import {
  countTeacherProblems,
  getLessonProblems,
  rescheduleDates,
  teacherCommitments,
  teacherExcludedDates,
  teacherPreferredDates,
} from "@/lib/calendar/teacher-availability";
import { isToday, toIsoDate, MONTH_NAMES, COURSE_CATEGORY_LABELS } from "@/lib/calendar/types";

export default function DocenteHomeClient() {
  const {
    currentTeacherId,
    getTeacher,
    getLessonsForTeacher,
    getCourse,
    getRoom,
    getSchool,
    weekDates,
    state,
    getDayNotes,
  } = useCalendar();

  const teacher = getTeacher(currentTeacherId);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(toIsoDate(now));

  const myLessons = getLessonsForTeacher(currentTeacherId);
  const todayStr = toIsoDate(now);
  const todayLessons = getLessonsForTeacher(currentTeacherId, [todayStr]);
  const weekLessons = getLessonsForTeacher(currentTeacherId, weekDates);
  const dayLessons = useMemo(
    () =>
      selectedDate
        ? myLessons.filter((l) => l.date === selectedDate)
        : [],
    [myLessons, selectedDate]
  );
  const list = todayLessons.length > 0 ? todayLessons : weekLessons.slice(0, 5);
  const nextLive = weekLessons.find((l) => l.modality !== "aula" && l.dadLink);
  const problemCount = countTeacherProblems(myLessons, teacher);

  const preferredDates = teacherPreferredDates(teacher);
  const excludedDates = teacherExcludedDates(teacher);
  const commitments = teacherCommitments(teacher);
  const rescheduleDateMarks = rescheduleDates(myLessons);
  const problematicIds = useMemo(
    () => myLessons.filter((l) => getLessonProblems(l, teacher)).map((l) => l.id),
    [myLessons, teacher]
  );

  const selectedDateNotes = useMemo(
    () => (selectedDate ? getDayNotes(selectedDate) : []),
    [selectedDate, getDayNotes, state.dayNotes]
  );

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthNotes = useMemo(
    () =>
      (state.dayNotes ?? [])
        .filter((n) => n.date.startsWith(monthPrefix))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [state.dayNotes, monthPrefix]
  );

  const renderLesson = (lesson: (typeof myLessons)[number], showDate?: boolean) => {
    const course = getCourse(lesson.courseId);
    const room = lesson.roomId ? getRoom(lesson.roomId) : undefined;
    const school = course?.schoolId ? getSchool(course.schoolId) : undefined;
    const studentCount = course?.studentCount ?? course?.studentIds?.length ?? 0;
    const problems = getLessonProblems(lesson, teacher);

    return (
      <li
        key={lesson.id}
        className={`rounded-2xl border bg-white/90 p-4 transition shadow-2xs ${
          problems?.severity === "critical"
            ? "border-amber-400 bg-amber-50/60 ring-1 ring-amber-300/50"
            : "border-line/70 hover:border-teal/50"
        }`}
        style={{
          borderLeftWidth: 5,
          borderLeftColor: course?.color ?? "#0f8f8a",
        }}
      >
        {/* Header: Time, Date & Modality Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-deep">
              <Clock3 className="h-4 w-4" />
              {lesson.startTime} – {lesson.endTime}
            </span>
            {showDate && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase text-ink-soft">
                {lesson.date}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {lesson.needsReschedule && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950">
                <AlertTriangle className="h-3 w-3" />
                Da spostare
              </span>
            )}
            <ModalityBadge modality={lesson.modality} compact />
          </div>
        </div>

        {/* Lesson Title & Course info */}
        <div className="mt-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {course?.category && (
              <span
                className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: course.color ?? "#0f8f8a" }}
              >
                {COURSE_CATEGORY_LABELS[course.category] ?? course.category}
              </span>
            )}
            <span className="text-xs font-semibold text-ink-soft">
              {course?.title}
            </span>
          </div>
          <p className="mt-1 text-base font-bold text-ink">{lesson.title}</p>
        </div>

        {/* Complete Details: Students count, Room, School/City */}
        <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl bg-slate-50/80 p-2.5 text-xs text-ink-soft sm:grid-cols-2 border border-line/60">
          {/* Numero Alunni */}
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-teal/10 text-teal-deep">
              <Users className="h-3.5 w-3.5" />
            </span>
            <span>
              Partecipanti:{" "}
              <strong className="text-ink font-bold">
                +{studentCount} alunni {studentCount === 1 ? "iscritto" : "iscritti"}
              </strong>
            </span>
          </div>

          {/* Aula / Piattaforma */}
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-azure/10 text-azure">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            <span>
              Luogo:{" "}
              <strong className="text-ink font-bold">
                {room ? room.name : lesson.modality === "aula" ? "Aula non assegnata" : "Aula Virtuale DAD"}
              </strong>
            </span>
          </div>

          {/* Sede Formativa / Città */}
          {school && (
            <div className="flex items-center gap-2 sm:col-span-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-amber-500/10 text-amber-700">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <span className="truncate">
                Sede: <strong className="text-ink font-semibold">{school.name}</strong>
                {school.city ? ` · ${school.city}` : ""}
              </span>
            </div>
          )}

          {/* Note specifiche della lezione se presenti */}
          {lesson.notes && (
            <div className="flex items-start gap-2 sm:col-span-2 border-t border-line/50 pt-1.5 text-[11px] text-amber-900">
              <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span className="italic leading-snug">Nota: {lesson.notes}</span>
            </div>
          )}
        </div>

        {/* Warning / Conflict notes */}
        {problems && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-100/70 px-2.5 py-1.5 text-xs font-semibold text-amber-900">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>{problems.reasons[0]}</span>
          </div>
        )}

        {/* Action Button: DAD or details */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-line/50">
          <span className="text-[11px] font-semibold text-ink-soft">
            Stato: {course?.status === "attivo" ? "Corso in svolgimento" : course?.status === "concluso" ? "Corso concluso" : "In programmazione"}
          </span>

          {lesson.modality !== "aula" && (
            <Link
              href={`/docente/dad?lesson=${lesson.id}`}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-full bg-teal px-4 py-2 text-xs font-bold text-white shadow-sm hover:brightness-105 transition active:scale-95"
            >
              <MonitorPlay className="h-4 w-4" />
              Apri Aula DAD
            </Link>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:mx-0 lg:max-w-none lg:space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
          Ciao, {teacher?.name.split(" ")[0] ?? "Docente"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">
          Il tuo calendario
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Solo le lezioni di <strong>{teacher?.name ?? "…"}</strong> · {myLessons.length}{" "}
          totali
        </p>
      </div>

      {problemCount > 0 && (
        <Link
          href="/docente/disponibilita"
          className="flex items-start gap-3 rounded-[1.3rem] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 transition hover:bg-amber-100/80"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">
              {problemCount} lezione/i da verificare
            </p>
            <p className="mt-1 text-xs text-amber-900/90">
              Apri Disponibilità per segnalare spostamenti e aggiornare preferenze.
            </p>
          </div>
        </Link>
      )}

      {nextLive && (
        <Link
          href={`/docente/dad?lesson=${nextLive.id}`}
          className="relative flex min-h-[120px] flex-col justify-end overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-azure to-teal-deep p-5 text-white shadow-[0_16px_40px_rgba(59,130,196,0.35)] transition hover:brightness-105 active:scale-[0.99]"
        >
          <p className="relative text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
            Prossima DAD Live
          </p>
          <p className="relative mt-1 font-display text-xl font-bold leading-tight">
            {nextLive.title}
          </p>
          <p className="relative mt-1 text-sm text-white/80">
            {nextLive.date} · {nextLive.startTime}
          </p>
          <span className="relative mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-teal-deep">
            <PlayCircle className="h-4 w-4" />
            Avvia Room DAD
          </span>
        </Link>
      )}

      <MonthCalendar
        year={year}
        month={month}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onChangeMonth={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
        filterTeacherId={currentTeacherId}
        highlightTeacherId={currentTeacherId}
        lessons={myLessons}
        markPreferredDates={preferredDates}
        markExcludedDates={excludedDates}
        markCommitments={commitments}
        markRescheduleDates={rescheduleDateMarks}
        problematicLessonIds={problematicIds}
      />

      {selectedDateNotes.length > 0 && (
        <div className="rounded-[1.4rem] border border-amber-300 bg-amber-50/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-200/80 text-amber-900">
                <StickyNote className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-display text-sm font-bold text-amber-950">
                  Note direzione · {selectedDate}
                </h3>
                <p className="text-[11px] text-amber-900/80">
                  Comunicazioni inserite dall&apos;amministrazione per questa data
                </p>
              </div>
            </div>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
              {selectedDateNotes.length} {selectedDateNotes.length === 1 ? "nota" : "note"}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {selectedDateNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-xl border border-amber-200/90 bg-white p-3 text-xs text-ink shadow-xs"
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: note.color ?? "#f59e0b",
                }}
              >
                <p className="whitespace-pre-wrap font-medium leading-relaxed">{note.text}</p>
                <p className="mt-1.5 text-[10px] text-ink-soft">
                  Nota segreteria / direzione · Aggiornata: {note.updatedAt.slice(0, 10)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-[1.5rem] p-4 md:p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          Lezioni del {selectedDate ?? "—"}
        </h2>
        <ul className="mt-3 space-y-3">
          {(dayLessons.length > 0 ? dayLessons : list).map((lesson) =>
            renderLesson(lesson, !isToday(lesson.date) && dayLessons.length === 0)
          )}
          {dayLessons.length === 0 && list.length === 0 && (
            <p className="rounded-xl border border-dashed border-line px-3 py-8 text-center text-sm text-ink-soft">
              Nessuna lezione assegnata a {teacher?.name}.
            </p>
          )}
        </ul>
      </div>

      {monthNotes.length > 0 && (
        <div className="glass rounded-[1.5rem] p-4 md:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-teal/10 text-teal-deep">
                <StickyNote className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  Bacheca comunicazioni amministrazione ({MONTH_NAMES[month]} {year})
                </h3>
                <p className="text-xs text-ink-soft">
                  Tutti i post-it e gli avvisi condivisi dalla segreteria
                </p>
              </div>
            </div>
            <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold text-teal-deep">
              {monthNotes.length} note
            </span>
          </div>

          <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
            {monthNotes.map((note) => {
              const isSelected = selectedDate === note.date;
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedDate(note.date)}
                  className={`flex flex-col text-left rounded-xl border p-3 transition shadow-xs ${
                    isSelected
                      ? "border-teal bg-teal/10 ring-1 ring-teal/30"
                      : "border-line/70 bg-white/80 hover:bg-white"
                  }`}
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: note.color ?? "#f59e0b",
                  }}
                >
                  <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-ink-soft">
                    <span className="uppercase tracking-wider">📅 {note.date}</span>
                    <span>{note.updatedAt.slice(0, 10)}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-ink line-clamp-3 leading-relaxed">
                    {note.text}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/docente/disponibilita"
          className="block rounded-[1.2rem] border border-teal/30 bg-teal/5 px-4 py-3.5 text-center text-xs font-semibold text-teal-deep"
        >
          Preferenze, esclusioni e impegni
        </Link>
        <Link
          href="/docente/calendario"
          className="block rounded-[1.2rem] border border-dashed border-teal/30 bg-teal/5 px-4 py-3.5 text-center text-xs font-semibold text-teal-deep"
        >
          Vista settimanale completa
        </Link>
      </div>
    </div>
  );
}
