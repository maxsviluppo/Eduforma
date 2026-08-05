"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import { LessonChipList } from "@/components/calendar/LessonChip";
import {
  MONTH_NAMES,
  WEEKDAY_SHORT,
  getMonthGrid,
  isToday,
  shiftMonth,
  sortLessonsByTime,
  type Lesson,
  type TeacherCommitment,
} from "@/lib/calendar/types";
import {
  COMMITMENT_BAND_STYLES,
  commitmentBorderForDate,
  commitmentsForDate,
} from "@/lib/calendar/teacher-availability";

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
  markCommitments,
  markRescheduleDates,
  problematicLessonIds,
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
  markCommitments?: TeacherCommitment[];
  markRescheduleDates?: string[];
  problematicLessonIds?: string[];
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
      markConfirmedDates?.length ||
      markCommitments?.length ||
      markRescheduleDates?.length
  );

  const problemSet = new Set(problematicLessonIds ?? []);

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
              <div key={`empty-${idx}`} className="aspect-square md:aspect-auto md:min-h-[88px]" />
            );
          }

          const dayLessons = sortLessonsByTime(lessonsByDate.get(date) ?? []);
          const selected = selectedDate === date;
          const today = isToday(date);
          const preferred = markPreferredDates?.includes(date);
          const excluded = markExcludedDates?.includes(date);
          const pending = markPendingDates?.includes(date);
          const confirmed = markConfirmedDates?.includes(date);
          const overlap = markOverlapDates?.includes(date);
          const teacherBusy = markTeacherBusyDates?.includes(date);
          const dayCommitments = markCommitments
            ? commitmentsForDate(markCommitments, date)
            : [];
          const hasGiornata = dayCommitments.some((c) => c.band === "giornata");
          const hasMattina = dayCommitments.some((c) => c.band === "mattina");
          const hasPomeriggio = dayCommitments.some((c) => c.band === "pomeriggio");
          const commitmentBorder = commitmentBorderForDate(
            markCommitments ?? [],
            date
          );
          const reschedule = markRescheduleDates?.includes(date);
          const dayNum = Number(date.slice(8, 10));
          const inMonth = Number(date.slice(5, 7)) === month + 1;
          const highlightedLessons = highlightTeacherId
            ? dayLessons.filter((l) => l.teacherId === highlightTeacherId)
            : [];

          const borderClass = overlap
            ? `border-2 border-red-500 bg-red-50/50 shadow-sm ring-1 ring-red-300/60${
                overlapDatesActionable ? " cursor-pointer hover:bg-red-50/80" : ""
              }`
            : reschedule
              ? "border-2 border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-300/60"
              : excluded
                ? "border-2 border-rose-400 shadow-sm"
                : preferred
                  ? "border-2 border-emerald-400 shadow-sm"
                  : pending
                    ? "border-2 border-dashed border-amber-400 bg-amber-50/40 shadow-sm"
                    : confirmed
                      ? "border-2 border-teal-500 shadow-sm"
                      : commitmentBorder
                        ? `border-2 shadow-sm ${commitmentBorder}`
                        : highlightedLessons.length > 0
                          ? "border-2 border-teal-400 shadow-sm ring-1 ring-teal/25"
                          : selected
                            ? "border-teal shadow-sm ring-1 ring-teal/30"
                            : today
                              ? "border-teal/40"
                              : "border-transparent hover:border-line";

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`relative flex min-h-[88px] flex-col overflow-hidden rounded-xl border p-1.5 text-left transition md:min-h-[100px] ${borderClass} ${
                !inMonth ? "opacity-40" : ""
              }`}
            >
              {teacherBusy && (
                <span className="pointer-events-none absolute inset-0 z-[1] bg-slate-400/14" />
              )}
              {!teacherBusy && hasGiornata && (
                <span
                  className={`pointer-events-none absolute inset-0 z-[1] ${COMMITMENT_BAND_STYLES.giornata.overlay}`}
                />
              )}
              {!teacherBusy && !hasGiornata && hasMattina && (
                <span
                  className={`pointer-events-none absolute left-0 right-0 z-[1] ${COMMITMENT_BAND_STYLES.mattina.overlayHalf}`}
                />
              )}
              {!teacherBusy && !hasGiornata && hasPomeriggio && (
                <span
                  className={`pointer-events-none absolute left-0 right-0 z-[1] ${COMMITMENT_BAND_STYLES.pomeriggio.overlayHalf}`}
                />
              )}

              <span className="relative z-10 flex h-full w-full flex-col gap-1">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    today ? "bg-teal text-white" : "bg-transparent text-ink"
                  }`}
                >
                  {dayNum}
                </span>

                <LessonChipList
                  lessons={dayLessons}
                  getCourse={getCourse}
                  getTeacher={getTeacher}
                  max={4}
                  size="xs"
                  highlightTeacherId={highlightTeacherId}
                  problematicLessonIds={problemSet}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-semibold text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-6 rounded bg-teal" /> Colore corso · ora + sigla
        </span>
        {showPlanningMarks && (
          <>
            {markOverlapDates?.length ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-4 rounded-sm border-2 border-red-500 bg-red-50" />{" "}
                Accavallamento
              </span>
            ) : null}
            {markRescheduleDates?.length ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-4 rounded-sm border-2 border-amber-500 bg-amber-50" />{" "}
                Da spostare
              </span>
            ) : null}
            {markPreferredDates?.length ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-4 rounded-sm border-2 border-emerald-400" /> Preferita
              </span>
            ) : null}
            {markExcludedDates?.length ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-4 rounded-sm border-2 border-rose-400" /> Esclusa
              </span>
            ) : null}
            {markCommitments?.length ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-3 w-4 rounded-sm ${COMMITMENT_BAND_STYLES.mattina.legendBox}`}
                  />{" "}
                  Impegno mattina
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-3 w-4 rounded-sm ${COMMITMENT_BAND_STYLES.pomeriggio.legendBox}`}
                  />{" "}
                  Impegno pomeriggio
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-3 w-4 rounded-sm ${COMMITMENT_BAND_STYLES.giornata.legendBox}`}
                  />{" "}
                  Impegno giornata
                </span>
              </>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-4 rounded-sm border-2 border-dashed border-amber-400" /> In
              attesa
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-4 rounded-sm border-2 border-teal-500" /> Confermata
            </span>
          </>
        )}
      </div>
    </div>
  );
}
