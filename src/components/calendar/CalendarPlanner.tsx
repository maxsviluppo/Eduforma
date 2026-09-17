"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, Table } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import {
  lessonDetailLine,
  lessonCourseColor,
  maxChipsForView,
  schoolAbbrev,
} from "@/lib/calendar/calendar-display";
import { DayNoteIndicator, DayNotesPanel } from "@/components/calendar/DayNotesPanel";
import { LessonChip, LessonChipList } from "@/components/calendar/LessonChip";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";
import {
  COURSE_CATEGORY_LABELS,
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
  tabular: "Tabulare",
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
  onSelectLesson,
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
  /** Selezione/apertura lezione per visualizzazione o modifica */
  onSelectLesson?: (lesson: Lesson) => void;
}) {
  const { state, getCourse, getTeacher, getRoom, getSchool, getDayNotes } =
    useCalendar();
  const [view, setView] = useState<CalendarViewMode>(defaultView);
  const [tabularOnlyLessons, setTabularOnlyLessons] = useState(false);
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

  const daysInMonthCount = useMemo(
    () => new Date(year, month + 1, 0).getDate(),
    [year, month]
  );

  const monthDaysList = useMemo(() => {
    return Array.from({ length: daysInMonthCount }, (_, i) => {
      const day = i + 1;
      return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    });
  }, [year, month, daysInMonthCount]);

  const tabularCourses = useMemo(() => {
    let list = state.courses;
    if (lessonFilters.courseIds.length > 0) {
      list = list.filter((c) => lessonFilters.courseIds.includes(c.id));
    }
    if (lessonFilters.schoolIds.length > 0) {
      list = list.filter((c) => lessonFilters.schoolIds.includes(c.schoolId));
    }
    if (lessonFilters.teacherIds.length > 0) {
      list = list.filter((c) => lessonFilters.teacherIds.includes(c.teacherId));
    }
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    const courseLessonCounts = new Map<string, number>();
    for (const lesson of sourceLessons) {
      if (lesson.date.startsWith(monthPrefix)) {
        courseLessonCounts.set(
          lesson.courseId,
          (courseLessonCounts.get(lesson.courseId) ?? 0) + 1
        );
      }
    }

    return [...list].sort((a, b) => {
      const countA = courseLessonCounts.get(a.id) ?? 0;
      const countB = courseLessonCounts.get(b.id) ?? 0;
      if (countA > 0 && countB === 0) return -1;
      if (countA === 0 && countB > 0) return 1;
      if (a.status === "attivo" && b.status !== "attivo") return -1;
      if (a.status !== "attivo" && b.status === "attivo") return 1;
      return a.title.localeCompare(b.title);
    });
  }, [state.courses, lessonFilters, sourceLessons, year, month]);

  const tabularDays = useMemo(() => {
    if (!tabularOnlyLessons) return monthDaysList;
    return monthDaysList.filter((date) => (lessonsByDate.get(date) ?? []).length > 0);
  }, [tabularOnlyLessons, monthDaysList, lessonsByDate]);

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
    if (view === "month" || view === "tabular") {
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
                    onClick={() => onSelectLesson?.(lesson)}
                    className="group cursor-pointer rounded-xl border border-line/60 bg-white/80 p-3 transition hover:border-teal/50 hover:bg-white hover:shadow-xs"
                    style={{ borderLeftWidth: 4, borderLeftColor: color }}
                  >
                    <LessonChip
                      lesson={lesson}
                      getCourse={getCourse}
                      getTeacher={getTeacher}
                      getSchool={getSchool}
                      getRoom={getRoom}
                      size="md"
                      className="mb-2 inline-flex w-auto"
                      onSelectLesson={onSelectLesson}
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
                      getSchool={getSchool}
                      getRoom={getRoom}
                      max={maxChipsForView("week")}
                      size="xs"
                      highlightTeacherId={highlightTeacherId}
                      onSelectLesson={onSelectLesson}
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
                      getSchool={getSchool}
                      getRoom={getRoom}
                      max={maxChipsForView("month")}
                      size="xs"
                      highlightTeacherId={highlightTeacherId}
                      onSelectLesson={onSelectLesson}
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

      {view === "tabular" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-line/70 bg-white/70 px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal/10 text-teal-deep">
                <Table className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">
                  Vista Tabulare · Giorni per Corsi
                </p>
                <p className="text-[11px] text-ink-soft">
                  {tabularDays.length} giorni · {tabularCourses.length} corsi in colonna
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTabularOnlyLessons(false)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  !tabularOnlyLessons
                    ? "bg-teal text-white shadow-sm"
                    : "border border-line/70 bg-white text-ink-soft hover:text-ink"
                }`}
              >
                Tutti i giorni ({monthDaysList.length})
              </button>
              <button
                type="button"
                onClick={() => setTabularOnlyLessons(true)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  tabularOnlyLessons
                    ? "bg-teal text-white shadow-sm"
                    : "border border-line/70 bg-white text-ink-soft hover:text-ink"
                }`}
              >
                Solo con lezioni (
                {monthDaysList.filter((d) => (lessonsByDate.get(d) ?? []).length > 0).length}
                )
              </button>
            </div>
          </div>

          <div className="relative max-h-[720px] overflow-auto rounded-2xl border border-line/80 bg-white/60 shadow-sm backdrop-blur">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line/80 bg-slate-50/95 text-xs text-ink">
                  <th className="sticky left-0 top-0 z-30 min-w-[160px] border-r border-line/80 bg-slate-100/95 p-3.5 backdrop-blur">
                    <span className="font-display text-xs font-bold uppercase tracking-wider text-ink">
                      Giorno
                    </span>
                    <span className="block text-[10px] font-normal text-ink-soft">
                      Riga per data
                    </span>
                  </th>
                  {tabularCourses.map((course) => {
                    const teacher = getTeacher(course.teacherId);
                    const monthLessonsCount = sourceLessons.filter(
                      (l) =>
                        l.courseId === course.id &&
                        l.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)
                    ).length;

                    return (
                      <th
                        key={course.id}
                        className="sticky top-0 z-20 min-w-[240px] max-w-[290px] border-r border-line/70 bg-slate-50/95 p-3.5 align-top backdrop-blur"
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className="mt-1 h-3 w-3 shrink-0 rounded-full shadow-sm ring-2 ring-white"
                            style={{ backgroundColor: course.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate font-display text-sm font-bold text-ink"
                              title={course.title}
                            >
                              {course.title}
                            </p>
                            <p className="text-[11px] font-medium text-ink-soft">
                              Docente: {teacher?.name ?? "—"}
                            </p>
                            {course.description && (
                              <p
                                className="mt-1 line-clamp-2 text-[10px] leading-tight text-ink-soft/90"
                                title={course.description}
                              >
                                {course.description}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="rounded bg-teal/10 px-1.5 py-0.5 text-[9px] font-bold text-teal-deep">
                                {COURSE_CATEGORY_LABELS[course.category] ?? course.category}
                              </span>
                              <span className="text-[10px] font-semibold text-ink-soft">
                                {monthLessonsCount} lez. nel mese
                              </span>
                            </div>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {tabularDays.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tabularCourses.length + 1}
                      className="p-12 text-center text-sm text-ink-soft"
                    >
                      Nessun giorno con lezioni programmato in questo mese.
                    </td>
                  </tr>
                ) : (
                  tabularDays.map((date) => {
                    const label = formatDayLabel(date);
                    const isCurrentDay = isToday(date);
                    const isSelected = selectedDate === date;
                    const meta = dayMeta(date);
                    const allDayLessons = dayLessonsFor(date);

                    return (
                      <tr
                        key={date}
                        className={`group transition ${
                          isCurrentDay
                            ? "bg-teal/5"
                            : isSelected
                              ? "bg-teal/10"
                              : "hover:bg-slate-50/60"
                        }`}
                      >
                        <td
                          className={`sticky left-0 z-10 border-r border-line/80 p-3 align-top backdrop-blur ${
                            isCurrentDay
                              ? "bg-teal/15 font-bold"
                              : isSelected
                                ? "bg-teal/20 font-bold"
                                : "bg-white/95 group-hover:bg-white"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectDate(date)}
                            onDoubleClick={(e) => {
                              e.preventDefault();
                              onSelectDate(date);
                              onQuickAddLesson?.(date);
                            }}
                            className="flex w-full flex-col text-left"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                  isCurrentDay
                                    ? "bg-teal text-white shadow-sm"
                                    : isSelected
                                      ? "bg-teal/25 text-teal-deep"
                                      : "bg-slate-100 text-ink"
                                }`}
                              >
                                {label.day}
                              </span>
                              <div className="flex items-center gap-1">
                                {meta.noteCount > 0 && (
                                  <DayNoteIndicator count={meta.noteCount} />
                                )}
                                {meta.overlap && (
                                  <span
                                    className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-red-200"
                                    title="Conflitto / accavallamento lezioni!"
                                  />
                                )}
                              </div>
                            </div>
                            <span className="mt-1 text-xs font-bold uppercase tracking-wider text-ink">
                              {label.weekday}
                            </span>
                            <span className="text-[10px] text-ink-soft">
                              {date}
                            </span>
                            {allDayLessons.length > 0 && (
                              <span className="mt-1.5 inline-block rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-ink-soft">
                                {allDayLessons.length} lez. tot
                              </span>
                            )}
                          </button>
                        </td>

                        {tabularCourses.map((course) => {
                          const lessons = allDayLessons.filter(
                            (l) => l.courseId === course.id
                          );

                          return (
                            <td
                              key={course.id}
                              className="border-r border-line/60 p-2.5 align-top transition hover:bg-white/90"
                            >
                              {lessons.length > 0 ? (
                                <div className="space-y-2">
                                  {lessons.map((lesson) => {
                                    const teacher = getTeacher(lesson.teacherId);
                                    const room = lesson.roomId
                                      ? getRoom(lesson.roomId)
                                      : undefined;
                                    const school = course
                                      ? getSchool(course.schoolId)
                                      : undefined;
                                    const schoolSigla = school
                                      ? schoolAbbrev(school.name, 3)
                                      : "";
                                    const studentCount =
                                      course?.studentCount ??
                                      course?.studentIds?.length ??
                                      0;

                                    return (
                                      <div
                                        key={lesson.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectDate(date);
                                          onSelectLesson?.(lesson);
                                        }}
                                        onDoubleClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          onSelectDate(date);
                                          onQuickAddLesson?.(date);
                                        }}
                                        className="cursor-pointer rounded-xl border border-line/80 bg-white p-2.5 shadow-sm transition hover:border-teal/60 hover:shadow"
                                        style={{
                                          borderLeftWidth: 4,
                                          borderLeftColor: course.color,
                                        }}
                                      >
                                        <div className="mb-2">
                                          <LessonChip
                                            lesson={lesson}
                                            getCourse={getCourse}
                                            getTeacher={getTeacher}
                                            getSchool={getSchool}
                                            getRoom={getRoom}
                                            size="sm"
                                            onSelectLesson={onSelectLesson}
                                          />
                                        </div>
                                        <div className="flex items-center justify-between gap-1.5">
                                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-deep">
                                            <Clock3 className="h-3 w-3" />
                                            {lesson.startTime} – {lesson.endTime}
                                          </span>
                                          <ModalityBadge
                                            modality={lesson.modality}
                                            compact
                                          />
                                        </div>
                                        <p className="mt-1 text-xs font-bold leading-snug text-ink">
                                          {lesson.title}
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-ink-soft">
                                          {teacher ? teacher.name : ""}
                                          {room ? ` · ${room.name}` : ""}
                                        </p>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 border-t border-line/50 pt-1 text-[10px] text-ink-soft">
                                          {schoolSigla && (
                                            <span className="rounded bg-slate-100 px-1 py-0.2 font-bold text-ink">
                                              {schoolSigla}
                                            </span>
                                          )}
                                          {studentCount > 0 && (
                                            <span className="font-semibold text-teal-deep">
                                              👥 {studentCount} alunni
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onSelectDate(date)}
                                  onDoubleClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onSelectDate(date);
                                    onQuickAddLesson?.(date);
                                  }}
                                  className="group/cell flex min-h-[44px] w-full items-center justify-center rounded-lg text-xs text-ink-soft/30 transition hover:bg-teal/5"
                                  title="Doppio clic per aggiungere lezione in questo giorno"
                                >
                                  <span className="text-[10px] font-semibold text-teal-deep opacity-0 transition group-hover/cell:opacity-80">
                                    + Aggiungi
                                  </span>
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {enableNotes && selectedDate && (
            <DayNotesPanel date={selectedDate} compact />
          )}
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
