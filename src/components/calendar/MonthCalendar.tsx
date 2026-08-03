"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import {
  MONTH_NAMES,
  WEEKDAY_SHORT,
  getMonthGrid,
  isMorningLesson,
  isToday,
  shiftMonth,
  type Lesson,
} from "@/lib/calendar/types";

const MORNING_BG = "rgba(134, 239, 172, 0.55)"; // verde
const AFTERNOON_BG = "rgba(250, 204, 21, 0.5)"; // giallo
const EMPTY_BG = "transparent";

const TEACHER_DOT_COLORS = ["#0f8f8a", "#3b82c4", "#7c5cbf", "#d97706", "#e11d48"] as const;

function teacherColor(teacherId: string, teachers: { id: string }[]): string {
  const index = teachers.findIndex((t) => t.id === teacherId);
  return TEACHER_DOT_COLORS[index >= 0 ? index % TEACHER_DOT_COLORS.length : 0];
}

function teacherInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function MonthCalendar({
  year,
  month,
  selectedDate,
  onSelectDate,
  onChangeMonth,
  highlightTeacherId,
  filterTeacherId,
  lessons: lessonsProp,
  markPreferredDates,
  markExcludedDates,
  markPendingDates,
  markConfirmedDates,
  markOverlapDates,
  markTeacherBusyDates,
  overlapDatesActionable,
}: {
  year: number;
  month: number;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onChangeMonth: (year: number, month: number) => void;
  highlightTeacherId?: string;
  filterTeacherId?: string;
  lessons?: Lesson[];
  markPreferredDates?: string[];
  markExcludedDates?: string[];
  markPendingDates?: string[];
  markConfirmedDates?: string[];
  markOverlapDates?: string[];
  markTeacherBusyDates?: string[];
  /** Mostra cursore e hint per giorni con accavallamento (es. dashboard → calendario) */
  overlapDatesActionable?: boolean;
}) {
  const { state, getCourse, getTeacher } = useCalendar();
  const cells = getMonthGrid(year, month);

  const sourceLessons =
    lessonsProp ??
    (filterTeacherId
      ? state.lessons.filter((l) => l.teacherId === filterTeacherId)
      : state.lessons);

  const lessonsByDate = new Map<string, Lesson[]>();
  for (const lesson of sourceLessons) {
    const list = lessonsByDate.get(lesson.date) ?? [];
    list.push(lesson);
    lessonsByDate.set(lesson.date, list);
  }

  const go = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    onChangeMonth(next.year, next.month);
  };

  const showPlanningMarks = Boolean(
    markOverlapDates?.length ||
      markTeacherBusyDates?.length ||
      markPreferredDates?.length ||
      markExcludedDates?.length ||
      markPendingDates?.length ||
      markConfirmedDates?.length
  );

  return (
    <div className="glass rounded-[1.6rem] p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-ink hover:bg-white"
          aria-label="Mese precedente"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="font-display text-xl font-bold text-ink md:text-2xl">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          type="button"
          onClick={() => go(1)}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-ink hover:bg-white"
          aria-label="Mese successivo"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAY_SHORT.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, idx) => {
          if (!date) {
            return (
              <div key={`empty-${idx}`} className="aspect-square md:aspect-auto md:min-h-[72px]" />
            );
          }

          const dayLessons = lessonsByDate.get(date) ?? [];
          const selected = selectedDate === date;
          const today = isToday(date);
          const preferred = markPreferredDates?.includes(date);
          const excluded = markExcludedDates?.includes(date);
          const pending = markPendingDates?.includes(date);
          const confirmed = markConfirmedDates?.includes(date);
          const overlap = markOverlapDates?.includes(date);
          const teacherBusy = markTeacherBusyDates?.includes(date);
          const dayNum = Number(date.slice(8, 10));
          const inMonth = Number(date.slice(5, 7)) === month + 1;

          const morning = dayLessons.filter((l) => isMorningLesson(l.startTime));
          const afternoon = dayLessons.filter((l) => !isMorningLesson(l.startTime));
          const highlightedLessons = highlightTeacherId
            ? dayLessons.filter((l) => l.teacherId === highlightTeacherId)
            : [];

          const borderClass = overlap
            ? `border-2 border-red-500 bg-red-50/50 shadow-sm ring-1 ring-red-300/60${
                overlapDatesActionable ? " cursor-pointer hover:bg-red-50/80" : ""
              }`
            : excluded
              ? "border-2 border-rose-400 shadow-sm"
              : preferred
                ? "border-2 border-emerald-400 shadow-sm"
                : pending
                  ? "border-2 border-dashed border-amber-400 bg-amber-50/40 shadow-sm"
                  : confirmed
                    ? "border-2 border-teal-500 shadow-sm"
                    : highlightedLessons.length > 0
                      ? "border-2 border-teal-400 shadow-sm ring-1 ring-teal/25"
                      : selected
                        ? "border-teal shadow-sm ring-1 ring-teal/30"
                        : today
                          ? "border-teal/40"
                          : "border-transparent hover:border-line";

          const tooltipLines = dayLessons.map((lesson) => {
            const course = getCourse(lesson.courseId);
            const teacher = getTeacher(lesson.teacherId);
            const band = isMorningLesson(lesson.startTime) ? "Mattina" : "Pomeriggio";
            return `${band} ${lesson.startTime} · ${teacher?.name ?? "Docente"} · ${course?.title ?? lesson.title}`;
          });
          const dayTitle = [
            ...tooltipLines,
            overlap ? "⚠ Accavallamento docente" : "",
            overlap && overlapDatesActionable ? "Clicca per modificare nel calendario" : "",
          ]
            .filter(Boolean)
            .join("\n");

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              title={dayTitle || undefined}
              className={`relative flex min-h-[72px] flex-col overflow-hidden rounded-xl border text-left transition md:min-h-[92px] ${borderClass} ${
                !inMonth ? "opacity-40" : ""
              }`}
            >
              {teacherBusy && (
                <span
                  className="pointer-events-none absolute inset-0 z-[1] bg-slate-400/14"
                  title="Docente già impegnato in altri corsi"
                />
              )}

              {/* Sfondo: verde mattina / giallo pomeriggio */}
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
                style={{ background: morning.length ? MORNING_BG : EMPTY_BG }}
              />
              <span
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
                style={{ background: afternoon.length ? AFTERNOON_BG : EMPTY_BG }}
              />

              <span className="relative z-10 flex h-full w-full flex-col items-start p-1.5 md:p-2">
                <span className="flex w-full items-start justify-between gap-0.5">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      today ? "bg-teal text-white" : "bg-transparent text-ink"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {(morning.length > 0 || afternoon.length > 0) && (
                    <span className="rounded bg-transparent px-1 py-0.5 text-[8px] font-bold uppercase tracking-wide text-ink-soft">
                      {morning.length > 0 && afternoon.length > 0
                        ? "M+P"
                        : morning.length > 0
                          ? "AM"
                          : "PM"}
                    </span>
                  )}
                </span>

                <div className="mt-auto flex w-full flex-col gap-0.5">
                  {dayLessons.slice(0, 2).map((lesson) => {
                    const course = getCourse(lesson.courseId);
                    const teacher = getTeacher(lesson.teacherId);
                    const color = teacherColor(lesson.teacherId, state.teachers);
                    const isHighlight =
                      highlightTeacherId && lesson.teacherId === highlightTeacherId;
                    const teacherLabel = teacher?.name ?? "Docente";
                    return (
                      <span
                        key={lesson.id}
                        className={`flex min-w-0 items-center gap-1 rounded px-0.5 py-0.5 text-[9px] font-bold leading-tight bg-transparent ${
                          isHighlight ? "ring-1 ring-teal/50" : ""
                        }`}
                        style={{ color }}
                        title={`${lesson.startTime}–${lesson.endTime} ${teacherLabel} · ${course?.title ?? lesson.title}`}
                      >
                        <span
                          className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-[7px] font-black text-white"
                          style={{ background: color }}
                        >
                          {teacher ? teacherInitials(teacher.name) : "?"}
                        </span>
                        <span className="min-w-0 truncate text-ink">
                          <span className="font-black tabular-nums">{lesson.startTime}</span>
                          {" "}
                          {teacherLabel}
                        </span>
                      </span>
                    );
                  })}
                  {dayLessons.length > 2 && (
                    <span className="px-0.5 text-[9px] font-bold text-ink-soft">
                      +{dayLessons.length - 2} lezioni
                    </span>
                  )}
                </div>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-semibold text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm" style={{ background: MORNING_BG }} /> Mattina (verde)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-4 rounded-sm" style={{ background: AFTERNOON_BG }} /> Pomeriggio
          (giallo)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-teal text-[7px] font-black text-white">
            IN
          </span>
          Iniziali docente + orario
        </span>
        {showPlanningMarks && (
          <>
            {markTeacherBusyDates?.length ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-4 rounded-sm bg-slate-300/35" /> Docente altri corsi
              </span>
            ) : null}
            {markOverlapDates?.length ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-4 rounded-sm border-2 border-red-500 bg-red-50" />{" "}
                Accavallamento
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-4 rounded-sm border-2 border-dashed border-amber-400" /> In
              attesa conferma
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-4 rounded-sm border-2 border-teal-500" /> Lezione confermata
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-4 rounded-sm border-2 border-emerald-400" /> Preferita
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-4 rounded-sm border-2 border-rose-400" /> Da escludere
            </span>
          </>
        )}
      </div>
    </div>
  );
}
