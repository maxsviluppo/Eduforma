"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import {
  lessonDetailLine,
  lessonCourseColor,
  maxChipsForView,
} from "@/lib/calendar/calendar-display";
import { DayNoteIndicator, DayNotesPanel } from "@/components/calendar/DayNotesPanel";
import { LessonChip, LessonChipList } from "@/components/calendar/LessonChip";
import {
  MONTH_NAMES,
  WEEKDAY_SHORT,
  formatDayLabel,
  getMonthGrid,
  getWeekRange,
  isToday,
  shiftDay,
  shiftMonth,
  sortLessonsByTime,
  type CalendarViewMode,
  type Lesson,
} from "@/lib/calendar/types";
import {
  EMPTY_CALENDAR_LESSON_FILTERS,
  filterLessons,
  type CalendarLessonFilters,
} from "@/lib/calendar/lesson-filters";
import { CalendarQuickFilters } from "@/components/calendar/CalendarQuickFilters";

const VIEW_LABELS: Record<CalendarViewMode, string> = {
  day: "Giorno",
  week: "Settimana",
  month: "Mese",
  year: "Anno",
};

function useDayBorderClass(
  date: string,
  opts: {
    selectedDate: string | null;
    overlap?: boolean;
    excluded?: boolean;
    preferred?: boolean;
    pending?: boolean;
    confirmed?: boolean;
    highlighted?: boolean;
    overlapActionable?: boolean;
  }
) {
  const { selectedDate, overlap, excluded, preferred, pending, confirmed, highlighted, overlapActionable } =
    opts;
  const today = isToday(date);
  const selected = selectedDate === date;

  if (overlap)
    return `border-2 border-red-500 bg-red-50/40 shadow-sm ring-1 ring-red-300/60${
      overlapActionable ? " cursor-pointer hover:bg-red-50/70" : ""
    }`;
  if (excluded) return "border-2 border-rose-400 shadow-sm";
  if (preferred) return "border-2 border-emerald-400 shadow-sm";
  if (pending) return "border-2 border-dashed border-amber-400 bg-amber-50/30 shadow-sm";
  if (confirmed) return "border-2 border-teal-500 shadow-sm";
  if (highlighted) return "border-2 border-teal-400 shadow-sm ring-1 ring-teal/25";
  if (selected) return "border-teal shadow-sm ring-1 ring-teal/30 bg-teal/5";
  if (today) return "border-teal/40";
  return "border-transparent hover:border-line";
}

export function CalendarPlanner({
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
  enableNotes = true,
  showViewSwitcher = true,
  defaultView = "month",
  compact = false,
  onQuickAddLesson,
  showQuickFilters = true,
  lessonFilters: controlledLessonFilters,
  onLessonFiltersChange,
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
  overlapDatesActionable?: boolean;
  enableNotes?: boolean;
  showViewSwitcher?: boolean;
  defaultView?: CalendarViewMode;
  /** Vista compatta per dashboard secondarie (catalogo corsi, ecc.) */
  compact?: boolean;
  /** Doppio click su un giorno → nuova lezione rapida */
  onQuickAddLesson?: (date: string) => void;
  /** Chip filtri scuola / docente / corso (multi-selezione) */
  showQuickFilters?: boolean;
  lessonFilters?: CalendarLessonFilters;
  onLessonFiltersChange?: (filters: CalendarLessonFilters) => void;
}) {
  const { state, getCourse, getTeacher, getRoom, getSchool, getDayNotes } =
    useCalendar();
  const [view, setView] = useState<CalendarViewMode>(defaultView);
  const [internalLessonFilters, setInternalLessonFilters] = useState(
    EMPTY_CALENDAR_LESSON_FILTERS
  );
  const lessonFilters = controlledLessonFilters ?? internalLessonFilters;
  const setLessonFilters =
    onLessonFiltersChange ?? setInternalLessonFilters;

  const sourceLessons = useMemo(() => {
    const base =
      lessonsProp ??
      (filterTeacherId
        ? state.lessons.filter((l) => l.teacherId === filterTeacherId)
        : state.lessons);
    const filtered = filterLessons(base, lessonFilters, getCourse, getRoom);
    return sortLessonsByTime(filtered);
  }, [lessonsProp, filterTeacherId, state.lessons, lessonFilters, getCourse, getRoom]);

  const lessonsByDate = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const lesson of sourceLessons) {
      const list = map.get(lesson.date) ?? [];
      list.push(lesson);
      map.set(lesson.date, list);
    }
    return map;
  }, [sourceLessons]);

  const notesByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const note of state.dayNotes) {
      map.set(note.date, (map.get(note.date) ?? 0) + 1);
    }
    return map;
  }, [state.dayNotes]);

  const anchor = selectedDate ?? `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const navigate = (delta: number) => {
    if (view === "day") {
      const next = shiftDay(anchor, delta);
      onSelectDate(next);
      const d = new Date(`${next}T12:00:00`);
      onChangeMonth(d.getFullYear(), d.getMonth());
      return;
    }
    if (view === "week") {
      const next = shiftDay(anchor, delta * 7);
      onSelectDate(next);
      const d = new Date(`${next}T12:00:00`);
      onChangeMonth(d.getFullYear(), d.getMonth());
      return;
    }
    if (view === "month") {
      const next = shiftMonth(year, month, delta);
      onChangeMonth(next.year, next.month);
      return;
    }
    onChangeMonth(year + delta, month);
  };

  const headerTitle = useMemo(() => {
    if (view === "day") {
      const d = new Date(`${anchor}T12:00:00`);
      return d.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (view === "week") {
      const week = getWeekRange(anchor);
      const a = formatDayLabel(week[0]);
      const b = formatDayLabel(week[6]);
      return `${a.day} – ${b.day}`;
    }
    if (view === "year") return String(year);
    return `${MONTH_NAMES[month]} ${year}`;
  }, [view, anchor, year, month]);

  const renderDayHeader = (date: string, compact?: boolean) => {
    const dayNum = Number(date.slice(8, 10));
    const today = isToday(date);
    const noteCount = notesByDate.get(date) ?? 0;
    return (
      <span className="flex w-full items-center justify-between gap-1">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            today ? "bg-teal text-white" : "bg-transparent text-ink"
          }`}
        >
          {dayNum}
        </span>
        {!compact && <DayNoteIndicator count={noteCount} />}
      </span>
    );
  };

  const dayLessonsFor = (date: string) =>
    sortLessonsByTime(lessonsByDate.get(date) ?? []);

  const dayMeta = (date: string) => ({
    overlap: markOverlapDates?.includes(date),
    excluded: markExcludedDates?.includes(date),
    preferred: markPreferredDates?.includes(date),
    pending: markPendingDates?.includes(date),
    confirmed: markConfirmedDates?.includes(date),
    teacherBusy: markTeacherBusyDates?.includes(date),
    highlighted: Boolean(
      highlightTeacherId &&
        (lessonsByDate.get(date) ?? []).some((l) => l.teacherId === highlightTeacherId)
    ),
    noteCount: notesByDate.get(date) ?? 0,
  });

  const bindDayCell = (date: string) => ({
    onClick: () => onSelectDate(date),
    onDoubleClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSelectDate(date);
      onQuickAddLesson?.(date);
    },
  });

  return (
    <div
      className={`glass ${compact ? "rounded-2xl p-3 md:p-4" : "rounded-[1.6rem] p-4 md:p-6"}`}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-3 ${compact ? "mb-3" : "mb-4"}`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`grid place-items-center rounded-full bg-white/80 text-ink hover:bg-white ${
              compact ? "h-8 w-8" : "h-10 w-10"
            }`}
            aria-label="Precedente"
          >
            <ChevronLeft className={compact ? "h-4 w-4" : "h-5 w-5"} />
          </button>
          <h2
            className={`min-w-[120px] text-center font-display font-bold capitalize text-ink ${
              compact ? "text-sm md:text-base" : "text-lg md:text-xl"
            }`}
          >
            {headerTitle}
          </h2>
          <button
            type="button"
            onClick={() => navigate(1)}
            className={`grid place-items-center rounded-full bg-white/80 text-ink hover:bg-white ${
              compact ? "h-8 w-8" : "h-10 w-10"
            }`}
            aria-label="Successivo"
          >
            <ChevronRight className={compact ? "h-4 w-4" : "h-5 w-5"} />
          </button>
        </div>

        {showViewSwitcher && (
          <div className="flex flex-wrap gap-1 rounded-full bg-white/60 p-1">
            {(Object.keys(VIEW_LABELS) as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`rounded-full font-bold transition ${
                  compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
                } ${
                  view === mode
                    ? "bg-teal text-white shadow-sm"
                    : "text-ink-soft hover:bg-white"
                }`}
              >
                {VIEW_LABELS[mode]}
              </button>
            ))}
          </div>
        )}
      </div>

      {showQuickFilters && (
        <div className={compact ? "mb-3" : "mb-4"}>
          <CalendarQuickFilters
            filters={lessonFilters}
            onChange={setLessonFilters}
            compact={compact}
          />
        </div>
      )}

      {view === "day" && (
        <div className="space-y-3">
          <button
            type="button"
            {...bindDayCell(anchor)}
            className={`w-full rounded-xl border p-3 text-left transition ${useDayBorderClass(
              anchor,
              { selectedDate, ...dayMeta(anchor) }
            )}`}
          >
            <p className="text-xs font-bold text-ink-soft">
              {isToday(anchor) ? "Oggi · " : ""}
              doppio click qui per nuova lezione
            </p>
          </button>
          <div className="space-y-2">
            {dayLessonsFor(anchor).length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-soft">
                Nessuna lezione in questo giorno.
              </p>
            ) : (
              dayLessonsFor(anchor).map((lesson) => {
                const color = lessonCourseColor(lesson, getCourse);
                return (
                  <div
                    key={lesson.id}
                    className="rounded-xl border border-line/60 bg-white/80 p-3"
                    style={{ borderLeftWidth: 4, borderLeftColor: color }}
                  >
                    <LessonChip
                      lesson={lesson}
                      getCourse={getCourse}
                      getTeacher={getTeacher}
                      size="md"
                      className="mb-2 inline-flex w-auto"
                    />
                    <p className="text-sm font-bold text-ink">
                      {getCourse(lesson.courseId)?.title ?? lesson.title}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {lessonDetailLine(
                        lesson,
                        getCourse,
                        getTeacher,
                        getRoom,
                        getSchool
                      )}
                    </p>
                  </div>
                );
              })
            )}
          </div>
          {enableNotes && <DayNotesPanel date={anchor} />}
        </div>
      )}

      {view === "week" && (
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-1 overflow-x-auto">
            {getWeekRange(anchor).map((date) => {
              const label = formatDayLabel(date);
              const lessons = dayLessonsFor(date);
              const meta = dayMeta(date);
              const selected = selectedDate === date;
              return (
                <button
                  key={date}
                  type="button"
                  {...bindDayCell(date)}
                  className={`flex min-w-[92px] flex-col rounded-xl border p-1.5 text-left transition ${useDayBorderClass(
                    date,
                    {
                      selectedDate,
                      ...meta,
                      overlapActionable: overlapDatesActionable,
                    }
                  )}`}
                >
                  <span
                    className={`mb-1 w-full rounded-lg px-1 py-1.5 text-center ${
                      isToday(date)
                        ? "bg-teal text-white"
                        : selected
                          ? "bg-teal/20 text-teal-deep"
                          : "bg-white/60 text-ink"
                    }`}
                  >
                    <p className="text-[9px] font-bold uppercase opacity-80">
                      {label.weekday}
                    </p>
                    <p className="text-xs font-bold">{label.day}</p>
                    <DayNoteIndicator count={meta.noteCount} />
                  </span>
                  <div className="max-h-[280px] min-h-[100px] flex-1 overflow-y-auto">
                    <LessonChipList
                      lessons={lessons}
                      getCourse={getCourse}
                      getTeacher={getTeacher}
                      max={maxChipsForView("week")}
                      size="xs"
                      highlightTeacherId={highlightTeacherId}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          {enableNotes && selectedDate && <DayNotesPanel date={selectedDate} />}
        </div>
      )}

      {view === "month" && (
        <>
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
            {getMonthGrid(year, month).map((date, idx) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className={
                      compact
                        ? "aspect-square md:aspect-auto md:min-h-[52px]"
                        : "aspect-square md:aspect-auto md:min-h-[100px]"
                    }
                  />
                );
              }
              const lessons = dayLessonsFor(date);
              const meta = dayMeta(date);
              const inMonth = Number(date.slice(5, 7)) === month + 1;

              return (
                <button
                  key={date}
                  type="button"
                  {...bindDayCell(date)}
                  className={`relative flex flex-col overflow-hidden rounded-xl border p-1.5 text-left transition ${
                    compact ? "min-h-[52px] md:min-h-[60px]" : "min-h-[88px] md:min-h-[108px]"
                  } ${useDayBorderClass(
                    date,
                    {
                      selectedDate,
                      ...meta,
                      overlapActionable: overlapDatesActionable,
                    }
                  )} ${!inMonth ? "opacity-40" : ""}`}
                >
                  {meta.teacherBusy && (
                    <span className="pointer-events-none absolute inset-0 z-[1] bg-slate-400/10" />
                  )}
                  <span className="relative z-10 flex w-full flex-col gap-1">
                    {renderDayHeader(date)}
                    <LessonChipList
                      lessons={lessons}
                      getCourse={getCourse}
                      getTeacher={getTeacher}
                      max={maxChipsForView("month")}
                      size="xs"
                      highlightTeacherId={highlightTeacherId}
                    />
                  </span>
                </button>
              );
            })}
          </div>
          {enableNotes && selectedDate && <DayNotesPanel date={selectedDate} compact />}
        </>
      )}

      {view === "year" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MONTH_NAMES.map((name, monthIndex) => {
            const cells = getMonthGrid(year, monthIndex);
            return (
              <div
                key={name}
                className="rounded-xl border border-line/60 bg-white/50 p-2"
              >
                <button
                  type="button"
                  onClick={() => {
                    onChangeMonth(year, monthIndex);
                    setView("month");
                  }}
                  className="mb-2 w-full text-left text-xs font-bold uppercase tracking-wide text-teal-deep hover:underline"
                >
                  {name}
                </button>
                <div className="grid grid-cols-7 gap-px">
                  {cells.map((date, i) => {
                    if (!date) {
                      return <span key={`y-${monthIndex}-${i}`} className="h-4" />;
                    }
                    const lessons = dayLessonsFor(date);
                    const meta = dayMeta(date);
                    const colors = [
                      ...new Set(
                        lessons.map((l) => lessonCourseColor(l, getCourse))
                      ),
                    ].slice(0, 3);
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => {
                          onSelectDate(date);
                          onChangeMonth(year, monthIndex);
                          setView("day");
                        }}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onSelectDate(date);
                          onChangeMonth(year, monthIndex);
                          onQuickAddLesson?.(date);
                        }}
                        title={`${date} · ${lessons.length} lezioni`}
                        className={`relative flex h-4 w-full items-center justify-center rounded-sm text-[8px] font-bold ${useDayBorderClass(
                          date,
                          { selectedDate, overlap: meta.overlap }
                        )}`}
                      >
                        {colors.length > 0 ? (
                          <span className="flex gap-px">
                            {colors.map((c) => (
                              <span
                                key={c}
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </span>
                        ) : (
                          <span className="text-ink-soft/40">
                            {Number(date.slice(8, 10))}
                          </span>
                        )}
                        {meta.noteCount > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 h-1 w-1 rounded-full bg-amber-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!compact && (
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-semibold text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-6 rounded bg-teal" /> Colore = corso · ORA SIGLA-SIGLA
        </span>
        {enableNotes && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-4 rounded bg-amber-300" /> Post-it
          </span>
        )}
        {markOverlapDates?.length ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-4 rounded-sm border-2 border-red-500 bg-red-50" />{" "}
            Accavallamento
          </span>
        ) : null}
        {onQuickAddLesson && (
          <span className="inline-flex items-center gap-1.5">
            <span className="rounded border border-dashed border-teal/50 px-1.5 py-0.5 text-[9px] font-bold text-teal-deep">
              2× click
            </span>
            1 click = seleziona · 2 click = nuova lezione
          </span>
        )}
      </div>
      )}
    </div>
  );
}
