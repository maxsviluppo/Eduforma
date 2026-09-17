"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookMarked,
  BookOpen,
  Building2,
  CalendarDays,
  Clock3,
  GraduationCap,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Plus,
  Settings2,
  Zap,
} from "lucide-react";
import { CalendarPlanner } from "@/components/calendar/CalendarPlanner";
import { QuickLessonModal } from "@/components/calendar/QuickLessonModal";
import { LessonDetailEditModal } from "@/components/calendar/LessonDetailEditModal";
import { QuickLessonSummarySidebar } from "@/components/calendar/QuickLessonSummarySidebar";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import { STATUS_LABELS, toIsoDate } from "@/lib/calendar/types";
import {
  EMPTY_CALENDAR_LESSON_FILTERS,
  filterLessons,
  hasActiveLessonFilters,
  type CalendarLessonFilters,
} from "@/lib/calendar/lesson-filters";

export default function AdminHomeClient() {
  const router = useRouter();
  const {
    state,
    overlaps,
    getLessonsForDate,
    getCourse,
    getTeacher,
    getRoom,
    getSchool,
    weekDates,
  } = useCalendar();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(toIsoDate(now));
  const [highlightTeacherId, setHighlightTeacherId] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);
  const [selectedLessonForEdit, setSelectedLessonForEdit] = useState<Lesson | null>(
    null
  );
  const [selectedSidebarLesson, setSelectedSidebarLesson] = useState<Lesson | null>(
    null
  );
  const [lessonFilters, setLessonFilters] = useState<CalendarLessonFilters>(
    EMPTY_CALENDAR_LESSON_FILTERS
  );
  const overlapNavTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const todayStr = toIsoDate(now);

  const stats = useMemo(() => {
    const activeCourses = state.courses.filter((c) => c.status === "attivo").length;
    const lessonsThisMonth = state.lessons.filter((l) => l.date.startsWith(monthKey)).length;
    const lessonsToday = state.lessons.filter((l) => l.date === todayStr).length;
    const weekLessons = state.lessons.filter((l) => weekDates.includes(l.date)).length;
    const primarySchool = state.schools[0];

    return {
      schools: state.schools.length,
      teachers: state.teachers.length,
      rooms: state.rooms.length,
      courses: state.courses.length,
      activeCourses,
      lessons: state.lessons.length,
      lessonsThisMonth,
      lessonsToday,
      weekLessons,
      students: state.students.length,
      overlaps: overlaps.length,
      schoolName: primarySchool?.name ?? "Scuola",
    };
  }, [state, monthKey, todayStr, weekDates, overlaps.length]);

  const overlapDates = useMemo(
    () => [...new Set(overlaps.map((o) => o.date))],
    [overlaps]
  );

  const selectedDayOverlaps = useMemo(
    () => (selectedDate ? overlaps.filter((o) => o.date === selectedDate) : []),
    [overlaps, selectedDate]
  );

  const openCalendarForDate = (date: string, teacherId?: string) => {
    const params = new URLSearchParams({ date });
    if (teacherId) params.set("teacher", teacherId);
    router.push(`/admin/calendario?${params.toString()}`);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    if (overlapNavTimer.current) {
      clearTimeout(overlapNavTimer.current);
      overlapNavTimer.current = null;
    }
    if (overlapDates.includes(date)) {
      overlapNavTimer.current = setTimeout(() => {
        const dayOverlap = overlaps.find((o) => o.date === date);
        openCalendarForDate(date, dayOverlap?.teacherId);
      }, 280);
      return;
    }
  };

  const handleQuickAddLesson = (date: string) => {
    if (overlapNavTimer.current) {
      clearTimeout(overlapNavTimer.current);
      overlapNavTimer.current = null;
    }
    setSelectedDate(date);
    setQuickAddDate(date);
  };

  const dayLessons = useMemo(() => {
    if (!selectedDate) return [];
    const raw = getLessonsForDate(selectedDate);
    return filterLessons(raw, lessonFilters, getCourse, getRoom);
  }, [selectedDate, getLessonsForDate, state.lessons, lessonFilters, getCourse, getRoom]);

  const upcomingLessons = useMemo(
    () =>
      [...state.lessons]
        .filter((l) => l.date >= todayStr)
        .sort((a, b) =>
          a.date === b.date
            ? a.startTime.localeCompare(b.startTime)
            : a.date.localeCompare(b.date)
        )
        .slice(0, 6),
    [state.lessons, todayStr]
  );

  const activeCourses = useMemo(
    () =>
      state.courses
        .filter((c) => c.status === "attivo")
        .slice(0, 5),
    [state.courses]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
            Dashboard admin
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink md:text-4xl">
            Gestione Corsi Formazione
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft md:text-base">
            Sintesi operativa e calendario mensile di tutti i corsi, docenti e lezioni programmate.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSidebar((prev) => !prev)}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition shadow-sm ${
              showSidebar
                ? "border-line bg-white text-ink hover:bg-slate-50"
                : "border-teal/30 bg-teal/10 text-teal-deep hover:bg-teal/20"
            }`}
            title={
              showSidebar
                ? "Nascondi riquadro laterale"
                : "Mostra riquadro laterale (prossime lezioni e corsi)"
            }
          >
            {showSidebar ? (
              <>
                <PanelRightClose className="h-4 w-4" />
                <span>Nascondi riquadro</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="h-4 w-4" />
                <span>Prossime lezioni & corsi</span>
                {upcomingLessons.length > 0 && (
                  <span className="rounded-full bg-teal-deep/10 px-1.5 py-0.5 text-[10px] font-bold text-teal-deep">
                    {upcomingLessons.length}
                  </span>
                )}
              </>
            )}
          </button>
          <Link href="/admin/calendario" className="btn-primary !py-2.5 text-sm">
            <Plus className="h-4 w-4" />
            Gestisci calendario
          </Link>
        </div>
      </div>

      {overlaps.length > 0 && (
        <div className="rounded-[1.3rem] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">
                {overlaps.length} accavallamento/i docente da risolvere
              </p>
              <p className="mt-1 text-xs text-amber-800/90">
                I giorni in conflitto sono evidenziati in rosso sul calendario. Clicca su un
                giorno rosso per aprire il calendario e modificare le lezioni.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {overlaps.map((o) => (
                  <button
                    key={`${o.teacherId}-${o.date}`}
                    type="button"
                    onClick={() => openCalendarForDate(o.date, o.teacherId)}
                    className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-sm transition hover:border-red-400 hover:bg-red-50 hover:text-red-800"
                  >
                    {o.teacherName.split(" ")[0]} · {o.date} · modifica
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Corsi attivi", value: stats.activeCourses, icon: CalendarDays },
          { label: "Docenti", value: stats.teachers, icon: GraduationCap },
          { label: "Lezioni mese", value: stats.lessonsThisMonth, icon: Clock3 },
          { label: "Oggi", value: stats.lessonsToday, icon: Clock3 },
          { label: "Settimana", value: stats.weekLessons, icon: CalendarDays },
          {
            label: "Accavallamenti",
            value: stats.overlaps,
            icon: AlertTriangle,
            alert: stats.overlaps > 0,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`glass rounded-2xl p-4 ${item.alert ? "ring-1 ring-amber-300" : ""}`}
            >
              <div className="flex items-center gap-2 text-ink-soft">
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">
                  {item.label}
                </span>
              </div>
              <p
                className={`mt-2 font-display text-2xl font-bold ${
                  item.alert ? "text-amber-800" : "text-ink"
                }`}
              >
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      <div
        className={
          showSidebar
            ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]"
            : "space-y-4 w-full"
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-xl font-bold text-ink">Calendario mensile</h2>
              {!showSidebar && (
                <button
                  type="button"
                  onClick={() => setShowSidebar(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/90 px-3 py-1.5 text-xs font-bold text-teal-deep shadow-sm transition hover:border-teal hover:bg-white"
                  title="Mostra prossime lezioni e corsi attivi a destra"
                >
                  <PanelRightOpen className="h-3.5 w-3.5" />
                  <span>Mostra riepilogo</span>
                  {upcomingLessons.length > 0 && (
                    <span className="rounded-full bg-teal/15 px-1.5 py-0.5 text-[10px] font-bold text-teal-deep">
                      {upcomingLessons.length}
                    </span>
                  )}
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                Evidenzia docente
              </label>
              <select
                value={highlightTeacherId}
                onChange={(e) => setHighlightTeacherId(e.target.value)}
                className="rounded-full border border-line bg-white/80 px-3 py-2 text-sm"
              >
                <option value="">Tutti</option>
                {state.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {showSidebar && (
                <button
                  type="button"
                  onClick={() => setShowSidebar(false)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/80 px-3 py-2 text-xs font-semibold text-ink-soft shadow-sm hover:bg-white hover:text-ink"
                  title="Nascondi pannello laterale"
                >
                  <PanelRightClose className="h-4 w-4" />
                  <span>Chiudi pannello</span>
                </button>
              )}
            </div>
          </div>

          <CalendarPlanner
            year={year}
            month={month}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onChangeMonth={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
            highlightTeacherId={highlightTeacherId || undefined}
            markOverlapDates={overlapDates}
            overlapDatesActionable
            enableNotes
            onQuickAddLesson={handleQuickAddLesson}
            lessonFilters={lessonFilters}
            onLessonFiltersChange={setLessonFilters}
            onSelectLesson={(lesson) => {
              setSelectedSidebarLesson(lesson);
              setShowSidebar(true);
            }}
          />

          <div className="glass rounded-[1.5rem] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-ink">
                Lezioni del {selectedDate ?? "—"}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {selectedDayOverlaps.length > 0 && selectedDate && (
                  <button
                    type="button"
                    onClick={() =>
                      openCalendarForDate(
                        selectedDate,
                        selectedDayOverlaps[0]?.teacherId
                      )
                    }
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-100"
                  >
                    Modifica accavallamento
                  </button>
                )}
                <span className="text-xs font-semibold text-ink-soft">
                  {dayLessons.length} in programma
                  {hasActiveLessonFilters(lessonFilters) && " (filtrate)"}
                </span>
              </div>
            </div>
            <ul className="space-y-3">
              {dayLessons.map((lesson) => {
                const course = getCourse(lesson.courseId);
                const teacher = getTeacher(lesson.teacherId);
                const room = lesson.roomId ? getRoom(lesson.roomId) : undefined;
                const isSelectedForSidebar = selectedSidebarLesson?.id === lesson.id;

                return (
                  <li
                    key={lesson.id}
                    onClick={() => {
                      setSelectedSidebarLesson(lesson);
                      setShowSidebar(true);
                    }}
                    className={`group cursor-pointer rounded-2xl border-y border-r p-3.5 transition ${
                      isSelectedForSidebar
                        ? "border-teal bg-teal/5 shadow-sm ring-2 ring-teal/30"
                        : "border-line/70 bg-white/80 hover:border-teal/50 hover:bg-white hover:shadow-xs"
                    }`}
                    style={{
                      borderLeftWidth: 4,
                      borderLeftColor: course?.color ?? "#0f8f8a",
                      borderLeftStyle: "solid",
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-deep">
                        <Clock3 className="h-4 w-4" />
                        {lesson.startTime} – {lesson.endTime}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ModalityBadge modality={lesson.modality} compact />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSidebarLesson(lesson);
                            setShowSidebar(true);
                          }}
                          className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold text-teal-deep transition hover:bg-teal hover:text-white inline-flex items-center gap-1"
                          title="Apri riepilogo rapido nel pannello laterale"
                        >
                          <Zap className="h-3 w-3" /> Modifiche veloci
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLessonForEdit(lesson);
                          }}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-ink-soft transition hover:bg-slate-200 hover:text-ink inline-flex items-center gap-1"
                          title="Apri configurazione completa"
                        >
                          <Settings2 className="h-3 w-3" /> Configurazione
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-base font-bold text-ink">{lesson.title}</p>
                    <p className="text-xs text-ink-soft">
                      {course?.title}
                      {teacher ? ` · ${teacher.name}` : ""}
                      {room ? ` · ${room.name}` : ""}
                      {course && (
                        <span className="ml-2 font-semibold text-teal-deep">
                          · +{course.studentCount ?? 0} alunni
                        </span>
                      )}
                    </p>
                  </li>
                );
              })}
              {dayLessons.length === 0 && (
                <p className="rounded-xl border border-dashed border-line px-3 py-8 text-center text-sm text-ink-soft">
                  {hasActiveLessonFilters(lessonFilters)
                    ? "Nessuna lezione corrisponde ai filtri selezionati."
                    : "Nessuna lezione in questo giorno."}
                </p>
              )}
            </ul>
          </div>
        </div>

        {showSidebar && (
          <aside className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
                Riepilogo laterale
              </span>
              <button
                type="button"
                onClick={() => setShowSidebar(false)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-white/80 px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:border-line hover:bg-white hover:text-ink"
                title="Comprimi riquadro"
              >
                <PanelRightClose className="h-3.5 w-3.5" />
                <span>Comprimi</span>
              </button>
            </div>

            {selectedSidebarLesson && (
              <QuickLessonSummarySidebar
                lesson={selectedSidebarLesson}
                onClose={() => setSelectedSidebarLesson(null)}
                onOpenFullEdit={(l) => setSelectedLessonForEdit(l)}
              />
            )}

            <div className="glass rounded-[1.5rem] p-5">
              <h2 className="font-display text-lg font-bold text-ink">Prossime lezioni</h2>
            <ul className="mt-3 space-y-3">
              {upcomingLessons.map((lesson) => {
                const course = getCourse(lesson.courseId);
                const teacher = getTeacher(lesson.teacherId);
                return (
                  <li
                    key={lesson.id}
                    onClick={() => setSelectedLessonForEdit(lesson)}
                    className="cursor-pointer rounded-xl border border-line/60 bg-white/70 px-3 py-2.5 transition hover:border-teal/50 hover:bg-white hover:shadow-2xs"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                      {lesson.date} · {lesson.startTime}
                    </p>
                    <p className="mt-1 text-sm font-bold text-ink">{lesson.title}</p>
                    <p className="text-xs text-ink-soft">
                      {course?.title}
                      {teacher ? ` · ${teacher.name}` : ""}
                    </p>
                  </li>
                );
              })}
              {upcomingLessons.length === 0 && (
                <p className="text-sm text-ink-soft">Nessuna lezione in arrivo.</p>
              )}
            </ul>
          </div>

          <div className="glass rounded-[1.5rem] p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-ink">Corsi attivi</h2>
              <span className="text-xs font-semibold text-ink-soft">
                {stats.activeCourses} totali
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {activeCourses.map((course) => {
                const teacher = getTeacher(course.teacherId);
                const school = getSchool(course.schoolId);
                return (
                  <li
                    key={course.id}
                    className="flex items-start gap-3 rounded-xl border border-line/60 bg-white/70 px-3 py-2.5"
                  >
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ background: course.color }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{course.title}</p>
                      <p className="text-xs text-ink-soft">
                        {teacher?.name ?? "—"}
                        {school ? ` · ${school.name}` : ""}
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase text-teal-deep">
                        {STATUS_LABELS[course.status]}
                      </p>
                    </div>
                  </li>
                );
              })}
              {activeCourses.length === 0 && (
                <p className="text-sm text-ink-soft">Nessun corso attivo.</p>
              )}
            </ul>
          </div>

          <div className="grid gap-2">
            {[
              {
                title: "Catalogo corsi",
                text: "Elenco, categorie, finalizza e modifica ogni corso.",
                href: "/admin/corsi",
                icon: BookMarked,
              },
              {
                title: "Calendario corsi",
                text: "Pianifica, modifica lezioni e importa dati.",
                href: "/admin/calendario",
                icon: CalendarDays,
              },
              {
                title: "Profilo scuola",
                text: "Sede, contatti e aule.",
                href: "/admin/scuola",
                icon: Building2,
              },
              {
                title: "Docenti",
                text: "Anagrafica e specialità.",
                href: "/admin/docenti",
                icon: GraduationCap,
              },
              {
                title: "Learning",
                text: "Presentazione, media e organizzazione corsi.",
                href: "/admin/learning",
                icon: BookOpen,
              },
            ].map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-line/70 bg-white/60 px-4 py-3 transition hover:bg-white"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal/10 text-teal-deep">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-ink">{link.title}</p>
                      <p className="text-xs text-ink-soft">{link.text}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-teal-deep" />
                </Link>
              );
            })}
            </div>
          </aside>
        )}
      </div>

      <QuickLessonModal
        open={Boolean(quickAddDate)}
        date={quickAddDate ?? selectedDate ?? todayStr}
        onClose={() => setQuickAddDate(null)}
        onSaved={(d) => setSelectedDate(d)}
      />

      <LessonDetailEditModal
        open={Boolean(selectedLessonForEdit)}
        lesson={selectedLessonForEdit}
        onClose={() => setSelectedLessonForEdit(null)}
        onSelectDate={(d) => setSelectedDate(d)}
        onSaved={() => setSelectedLessonForEdit(null)}
      />
    </div>
  );
}
