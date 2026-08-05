"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  GraduationCap,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import type { Lesson, Modality } from "@/lib/calendar/types";
import {
  STATUS_LABELS,
  courseTeacherIds,
  findOverlapsForDraft,
  toIsoDate,
} from "@/lib/calendar/types";
import { scheduledHoursForCourse } from "@/lib/calendar/demo-data";
import { personAbbrev } from "@/lib/calendar/calendar-display";
import { LessonChip } from "@/components/calendar/LessonChip";
import { parseCalendarSpreadsheet, readSpreadsheetFile } from "@/lib/calendar/import";
import type { ImportPreview } from "@/lib/calendar/CalendarProvider";
import { ConfirmModal, OverlapWarningModal } from "@/components/calendar/ConfirmModal";
import { CourseCreateModal } from "@/components/calendar/CourseCreateModal";
import { CalendarPlanner } from "@/components/calendar/CalendarPlanner";
import { QuickLessonModal } from "@/components/calendar/QuickLessonModal";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";
import { SimulationLinksBanner } from "@/components/calendar/SimulationLinksBanner";
import {
  EMPTY_CALENDAR_LESSON_FILTERS,
  filterLessons,
  hasActiveLessonFilters,
  type CalendarLessonFilters,
} from "@/lib/calendar/lesson-filters";

type Tab = "calendario" | "corsi" | "anagrafiche" | "import";

export default function AdminCalendarClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    state,
    overlaps,
    concludeCourse,
    deleteCourse,
    addTeacher,
    addRoom,
    updateSchool,
    updateLesson,
    deleteLesson,
    applyImport,
    resetDemo,
    getCourse,
    getRoom,
    getTeacher,
    getSchool,
    getLessonsForDate,
  } = useCalendar();

  const now = new Date();
  const [tab, setTab] = useState<Tab>("calendario");
  const [createOpen, setCreateOpen] = useState(false);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(toIsoDate(now));
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingOriginalTeacherId, setEditingOriginalTeacherId] = useState<string | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);
  const [overlapModal, setOverlapModal] = useState<{
    teacherName: string;
    date: string;
    details: string[];
    proceed: () => void;
  } | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [highlightTeacherId, setHighlightTeacherId] = useState<string>("");
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);
  const [lessonFilters, setLessonFilters] = useState<CalendarLessonFilters>(
    EMPTY_CALENDAR_LESSON_FILTERS
  );

  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    specialty: "",
  });
  const [newRoom, setNewRoom] = useState({ name: "", capacity: 20 });
  const [schoolForm, setSchoolForm] = useState({ name: "", address: "", city: "" });

  const dayLessons = useMemo(() => {
    if (!selectedDate) return [];
    const raw = getLessonsForDate(selectedDate);
    return filterLessons(raw, lessonFilters, getCourse, getRoom);
  }, [selectedDate, getLessonsForDate, state.lessons, lessonFilters, getCourse, getRoom]);

  const stats = useMemo(
    () => ({
      teachers: state.teachers.length,
      rooms: state.rooms.length,
      courses: state.courses.length,
      lessons: state.lessons.length,
      students: state.students.length,
      schools: state.schools.length,
    }),
    [state]
  );

  const overlapDates = useMemo(
    () => [...new Set(overlaps.map((o) => o.date))],
    [overlaps]
  );

  const rescheduleRequests = useMemo(
    () =>
      state.lessons
        .filter((l) => l.needsReschedule)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [state.lessons]
  );

  const goToOverlapDay = (date: string, teacherId?: string) => {
    setTab("calendario");
    setSelectedDate(date);
    const d = new Date(`${date}T12:00:00`);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    if (teacherId) setHighlightTeacherId(teacherId);
  };

  useEffect(() => {
    const date = searchParams.get("date");
    if (!date) return;
    goToOverlapDay(date, searchParams.get("teacher") ?? undefined);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const runWithOverlapCheck = (
    draft: Pick<Lesson, "teacherId" | "date" | "startTime" | "endTime"> & { id?: string },
    apply: () => void
  ) => {
    const overlap = findOverlapsForDraft(state.lessons, state.teachers, draft, draft.id);
    if (overlap) {
      const details = overlap.lessons.map((l) => {
        const c = getCourse(l.courseId);
        return `${l.startTime}–${l.endTime} · ${l.title} (${c?.title ?? "corso"})`;
      });
      setOverlapModal({
        teacherName: overlap.teacherName,
        date: overlap.date,
        details,
        proceed: () => {
          setOverlapModal(null);
          apply();
        },
      });
      return;
    }
    apply();
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;
    const draft = editingLesson;
    runWithOverlapCheck(draft, () => {
      updateLesson(draft.id, {
        title: draft.title,
        date: draft.date,
        startTime: draft.startTime,
        endTime: draft.endTime,
        modality: draft.modality,
        teacherId: draft.teacherId,
        roomId: draft.modality === "dad" ? undefined : draft.roomId,
        notes: draft.notes,
        dadLink:
          draft.modality !== "aula"
            ? draft.dadLink || `https://meet.aulanova.it/${draft.courseId}`
            : undefined,
      });
      if (
        editingOriginalTeacherId &&
        draft.teacherId !== editingOriginalTeacherId
      ) {
        setHighlightTeacherId(draft.teacherId);
      }
      setEditingLesson(null);
      setEditingOriginalTeacherId(null);
      setSelectedDate(draft.date);
    });
  };

  const onImportFile = async (file: File) => {
    setImportError(null);
    try {
      const text = await readSpreadsheetFile(file);
      const preview = parseCalendarSpreadsheet(text);
      setImportPreview(preview);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Errore lettura file");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
            Generatore agile
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink md:text-4xl">
            Calendario corsi
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft md:text-base">
            Anagrafiche scuola/docenti, caratteristiche corso, date preferite/occupate,
            vista mensile, modifica al volo e import CSV/Excel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="btn-primary !py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            Inserisci corso
          </button>
          <button type="button" onClick={resetDemo} className="btn-ghost !py-2.5 text-sm">
            <RefreshCw className="h-4 w-4" />
            Reset demo
          </button>
        </div>
      </div>

      <SimulationLinksBanner />

      {rescheduleRequests.length > 0 && (
        <div className="rounded-[1.3rem] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold">
                {rescheduleRequests.length} richiesta/e di spostamento da docenti
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {rescheduleRequests.map((lesson) => {
                  const teacher = getTeacher(lesson.teacherId);
                  const course = getCourse(lesson.courseId);
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        setTab("calendario");
                        setSelectedDate(lesson.date);
                        const d = new Date(`${lesson.date}T12:00:00`);
                        setYear(d.getFullYear());
                        setMonth(d.getMonth());
                        setEditingLesson(lesson);
                        setEditingOriginalTeacherId(lesson.teacherId);
                      }}
                      className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-sm transition hover:border-amber-400 hover:bg-amber-100"
                    >
                      {teacher?.name.split(" ")[0]} · {lesson.date} · {course?.title ?? lesson.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {overlaps.length > 0 && (
        <div className="rounded-[1.3rem] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold">
                {overlaps.length} accavallamento/i docente rilevato/i
              </p>
              <p className="mt-1 text-xs text-amber-800/90">
                I giorni in conflitto sono evidenziati in rosso sul calendario.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {overlaps.map((o) => (
                  <button
                    key={`${o.teacherId}-${o.date}`}
                    type="button"
                    onClick={() => goToOverlapDay(o.date, o.teacherId)}
                    className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-sm transition hover:border-red-400 hover:bg-red-50 hover:text-red-800"
                  >
                    {o.teacherName.split(" ")[0]} · {o.date} · {o.lessons.length} lezioni
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Scuole", value: stats.schools, icon: Building2 },
          { label: "Docenti", value: stats.teachers, icon: GraduationCap },
          { label: "Aule", value: stats.rooms, icon: Building2 },
          { label: "Corsi", value: stats.courses, icon: CalendarDays },
          { label: "Lezioni", value: stats.lessons, icon: Clock3 },
          { label: "Studenti", value: stats.students, icon: Users },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 text-ink-soft">
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">
                  {item.label}
                </span>
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-ink">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["calendario", "Mensile"],
            ["corsi", "Corsi"],
            ["anagrafiche", "Anagrafiche"],
            ["import", "Importa"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              tab === id
                ? "bg-teal text-white shadow-[0_8px_20px_var(--glow)]"
                : "bg-white/70 text-ink-soft hover:bg-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "calendario" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                Evidenzia docente
              </label>
              <select
                value={highlightTeacherId}
                onChange={(e) => setHighlightTeacherId(e.target.value)}
                className="rounded-full border border-line bg-white/80 px-3 py-2 text-sm"
              >
                <option value="">Nessuno</option>
                {state.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <CalendarPlanner
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
            enableNotes
            onQuickAddLesson={setQuickAddDate}
            lessonFilters={lessonFilters}
            onLessonFiltersChange={setLessonFilters}
          />

          <div className="glass rounded-[1.5rem] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-ink">
                Lezioni del {selectedDate ?? "—"}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => setQuickAddDate(selectedDate)}
                    className="btn-primary !py-2 gap-1.5 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nuova lezione
                  </button>
                )}
                <span className="text-xs font-semibold text-ink-soft">
                  {dayLessons.length} lezione/i
                  {hasActiveLessonFilters(lessonFilters) && " (filtrate)"}
                </span>
              </div>
            </div>

            {dayLessons.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-soft">
                {hasActiveLessonFilters(lessonFilters)
                  ? "Nessuna lezione corrisponde ai filtri selezionati in questo giorno."
                  : "Nessuna lezione in questo giorno. Crea un corso o importa un foglio."}
              </p>
            ) : (
              <ul className="space-y-3">
                {dayLessons.map((lesson) => {
                  const course = getCourse(lesson.courseId);
                  const room = lesson.roomId ? getRoom(lesson.roomId) : undefined;
                  const teacher = getTeacher(lesson.teacherId);
                  const school = room
                    ? getSchool(room.schoolId)
                    : course
                      ? getSchool(course.schoolId)
                      : undefined;
                  return (
                    <li
                      key={lesson.id}
                      className="rounded-2xl border border-line/70 bg-white/85 p-4"
                      style={{
                        borderLeftWidth: 4,
                        borderLeftColor: course?.color ?? "#0f8f8a",
                        borderLeftStyle: "solid",
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-bold text-ink-soft">
                              {lesson.startTime} – {lesson.endTime}
                            </p>
                          </div>
                          <p className="mt-1 font-display text-lg font-bold text-ink">
                            {lesson.title}
                          </p>
                          <p className="text-sm text-ink-soft">{course?.title}</p>
                          {teacher && (
                            <p className="mt-2 inline-flex items-center gap-2 rounded-xl bg-teal/10 px-2.5 py-1.5 text-sm font-bold text-teal-deep">
                              <GraduationCap className="h-4 w-4 shrink-0" />
                              {teacher.name}
                              <span className="text-[10px] font-bold uppercase text-teal-deep/70">
                                {personAbbrev(teacher.name)}
                              </span>
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <LessonChip
                              lesson={lesson}
                              getCourse={getCourse}
                              getTeacher={getTeacher}
                              size="sm"
                              className="inline-flex w-auto"
                            />
                            {lesson.needsReschedule && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950">
                                <AlertTriangle className="h-3 w-3" />
                                Da spostare
                              </span>
                            )}
                            <ModalityBadge modality={lesson.modality} />
                            {school && (
                              <span className="text-xs font-semibold text-ink-soft">
                                {school.name}
                              </span>
                            )}
                            {room && (
                              <span className="text-xs font-semibold text-ink-soft">
                                {room.name}
                              </span>
                            )}
                          </div>
                          {lesson.rescheduleNote && (
                            <p className="mt-2 text-xs font-semibold text-amber-900">
                              Richiesta docente: {lesson.rescheduleNote}
                            </p>
                          )}
                          {lesson.notes && (
                            <p className="mt-2 text-xs text-ink-soft">Note: {lesson.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn-ghost !px-3 !py-2 text-xs"
                            onClick={() => {
                              setEditingLesson(lesson);
                              setEditingOriginalTeacherId(lesson.teacherId);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Modifica
                          </button>
                          <button
                            type="button"
                            className="rounded-full bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600"
                            onClick={() => setDeleteId(lesson.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 inline mr-1" />
                            Elimina
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "corsi" && (
        <div className="space-y-5">
          <div className="glass-strong flex flex-wrap items-center justify-between gap-4 rounded-[1.6rem] p-6">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Nuovo corso</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Crea un corso scegliendo date manuali sul calendario e ore personalizzate per ogni lezione.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              Inserisci corso
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-ink">Lista corsi</h2>
              <Link
                href="/admin/corsi"
                className="text-sm font-bold text-teal-deep hover:underline"
              >
                Catalogo completo →
              </Link>
            </div>
            {state.courses.map((course) => {
              const teacherNames = courseTeacherIds(course)
                .map((id) => getTeacher(id)?.name)
                .filter(Boolean)
                .join(", ");
              const school = getSchool(course.schoolId);
              const scheduled = scheduledHoursForCourse(state.lessons, course.id);
              const courseLessons = state.lessons.filter((l) => l.courseId === course.id);
              return (
                <article key={course.id} className="glass rounded-[1.4rem] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/corsi/${course.id}`}
                          className="font-display text-lg font-bold text-ink hover:text-teal-deep"
                        >
                          {course.title}
                        </Link>
                        <ModalityBadge modality={course.modality} compact />
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-ink-soft">
                          {STATUS_LABELS[course.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">{course.description}</p>
                      <p className="mt-2 text-xs text-ink-soft">
                        {course.totalHours}h · {course.daysCount} giorni · {teacherNames || "—"} ·{" "}
                        {school?.name}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-teal-deep">
                        {scheduled}/{course.totalHours}h in calendario · {courseLessons.length}{" "}
                        lezioni
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {courseLessons[0] && (
                        <button
                          type="button"
                          className="btn-ghost !py-2 !px-3 text-xs"
                          onClick={() => {
                            setSelectedDate(courseLessons[0].date);
                            setEditingLesson(courseLessons[0]);
                            setTab("calendario");
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Modifica lezione
                        </button>
                      )}
                      {course.status !== "concluso" && (
                        <button
                          type="button"
                          className="rounded-full bg-teal/10 px-3 py-2 text-xs font-bold text-teal-deep"
                          onClick={() => concludeCourse(course.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />
                          Passa a docente
                        </button>
                      )}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                        onClick={() => setDeleteCourseId(course.id)}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Elimina corso
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {tab === "anagrafiche" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="glass rounded-[1.5rem] p-6">
            <h2 className="font-display text-xl font-bold text-ink">Scuola</h2>
            {state.schools.map((school) => (
              <form
                key={school.id}
                className="mt-4 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  updateSchool(school.id, schoolForm.name ? schoolForm : school);
                }}
              >
                <input
                  defaultValue={school.name}
                  onChange={(e) => setSchoolForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
                  placeholder="Nome scuola"
                />
                <input
                  defaultValue={school.address}
                  onChange={(e) => setSchoolForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
                  placeholder="Indirizzo"
                />
                <input
                  defaultValue={school.city}
                  onChange={(e) => setSchoolForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
                  placeholder="Città"
                />
                <button type="submit" className="btn-ghost text-sm">
                  Salva scuola
                </button>
              </form>
            ))}
          </div>

          <div className="glass rounded-[1.5rem] p-6">
            <h2 className="font-display text-xl font-bold text-ink">Docenti</h2>
            <ul className="mt-3 space-y-3">
              {state.teachers.map((t) => (
                <li key={t.id} className="rounded-xl bg-white/70 p-3">
                  <p className="font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-ink-soft">{t.specialty}</p>
                </li>
              ))}
            </ul>
            <form
              className="mt-4 grid gap-2 border-t border-line/60 pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTeacher.name) return;
                addTeacher({
                  name: newTeacher.name,
                  email: newTeacher.email || `${newTeacher.name}@centro.it`,
                  specialty: newTeacher.specialty || "Generale",
                });
                setNewTeacher({
                  name: "",
                  email: "",
                  specialty: "",
                });
              }}
            >
              <input
                placeholder="Nome docente"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher((f) => ({ ...f, name: e.target.value }))}
                className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
              />
              <input
                placeholder="Email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher((f) => ({ ...f, email: e.target.value }))}
                className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
              />
              <input
                placeholder="Specialità"
                value={newTeacher.specialty}
                onChange={(e) => setNewTeacher((f) => ({ ...f, specialty: e.target.value }))}
                className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
              />
              <button type="submit" className="btn-ghost text-sm">
                <Plus className="h-4 w-4" /> Aggiungi docente
              </button>
            </form>

            <h3 className="mt-6 font-display text-lg font-bold text-ink">Aule</h3>
            <ul className="mt-2 space-y-2">
              {state.rooms.map((r) => (
                <li key={r.id} className="rounded-xl bg-white/70 px-3 py-2 text-sm">
                  {r.name} · {r.capacity} posti
                </li>
              ))}
            </ul>
            <form
              className="mt-3 grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newRoom.name) return;
                addRoom(newRoom.name, newRoom.capacity);
                setNewRoom({ name: "", capacity: 20 });
              }}
            >
              <input
                placeholder="Nome aula"
                value={newRoom.name}
                onChange={(e) => setNewRoom((f) => ({ ...f, name: e.target.value }))}
                className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom((f) => ({ ...f, capacity: Number(e.target.value) }))}
                className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
              />
              <button type="submit" className="btn-ghost text-sm">
                <Plus className="h-4 w-4" /> Aggiungi aula
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === "import" && (
        <div className="glass-strong rounded-[1.6rem] p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal/10 text-teal-deep">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                Importa CSV / Excel
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Carica un foglio con colonne come: scuola, docente, corso, descrizione, ore,
                giorni, modalita, aula, studente, lezione, data, inizio, fine, date_preferite,
                date_occupate. Anteprima obbligatoria prima di aggiornare.
              </p>
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-teal/30 bg-teal/5 px-4 py-10 text-center">
            <FileSpreadsheet className="h-8 w-8 text-teal-deep" />
            <span className="mt-3 text-sm font-bold text-ink">Scegli file .csv .xlsx .txt</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.txt,.tsv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onImportFile(file);
              }}
            />
          </label>

          {importError && (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {importError}
            </p>
          )}

          {importPreview && (
            <div className="mt-5 space-y-3 rounded-2xl border border-line bg-white/80 p-4">
              <h3 className="font-display text-lg font-bold text-ink">Anteprima import</h3>
              <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
                <p>Scuole: {importPreview.schools.length}</p>
                <p>Docenti: {importPreview.teachers.length}</p>
                <p>Aule: {importPreview.rooms.length}</p>
                <p>Corsi: {importPreview.courses.length}</p>
                <p>Lezioni: {importPreview.lessons.length}</p>
                <p>Studenti: {importPreview.students.length}</p>
              </div>
              {importPreview.warnings.length > 0 && (
                <ul className="text-xs text-amber-700">
                  {importPreview.warnings.map((w) => (
                    <li key={w}>⚠ {w}</li>
                  ))}
                </ul>
              )}
              <div className="max-h-48 overflow-y-auto text-xs text-ink-soft">
                {importPreview.courses.slice(0, 8).map((c) => (
                  <p key={c.id}>
                    Corso: {c.title} · {c.totalHours}h · {c.modality}
                  </p>
                ))}
                {importPreview.lessons.slice(0, 8).map((l) => (
                  <p key={l.id}>
                    Lezione: {l.title} · {l.date} {l.startTime}-{l.endTime}
                  </p>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-ghost flex-1"
                  onClick={() => setImportPreview(null)}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="btn-primary flex-1"
                  onClick={() => {
                    applyImport(importPreview);
                    setImportPreview(null);
                    setTab("calendario");
                  }}
                >
                  Conferma aggiornamento
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit lesson modal */}
      {editingLesson && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/30 p-4 backdrop-blur-sm md:items-center"
          onClick={() => setEditingLesson(null)}
        >
          <form
            onSubmit={handleSaveLesson}
            className="glass-strong w-full max-w-md space-y-3 rounded-[1.6rem] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-bold text-ink">Modifica lezione</h3>
            {(() => {
              const course = getCourse(editingLesson.courseId);
              const currentTeacher = getTeacher(editingLesson.teacherId);
              const originalTeacher = editingOriginalTeacherId
                ? getTeacher(editingOriginalTeacherId)
                : undefined;
              return (
                <div className="rounded-xl border border-line/70 bg-white/70 px-3 py-2 text-xs text-ink-soft">
                  <p className="font-bold text-ink">{course?.title ?? "Corso"}</p>
                  {originalTeacher && currentTeacher && (
                    <p className="mt-1">
                      Docente:{" "}
                      <span className="font-bold text-teal-deep">
                        {currentTeacher.name}
                      </span>
                      {editingLesson.teacherId !== editingOriginalTeacherId && (
                        <span className="text-amber-800">
                          {" "}
                          (prima: {originalTeacher.name})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              );
            })()}
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-soft">
                Docente assegnato
              </span>
              <select
                value={editingLesson.teacherId}
                onChange={(e) =>
                  setEditingLesson({
                    ...editingLesson,
                    teacherId: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-teal"
              >
                {state.teachers
                  .filter((t) => t.active !== false)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.specialty ? ` · ${t.specialty}` : ""}
                    </option>
                  ))}
              </select>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
                Cambiando docente, la lezione esce dal calendario del docente
                precedente e viene registrata su quello selezionato. Il corso
                viene aggiornato con il nuovo docente se non già presente.
              </p>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-soft">
                Titolo lezione
              </span>
              <input
                value={editingLesson.title}
                onChange={(e) =>
                  setEditingLesson({ ...editingLesson, title: e.target.value })
                }
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
              />
            </label>
            <input
              type="date"
              value={editingLesson.date}
              onChange={(e) =>
                setEditingLesson({ ...editingLesson, date: e.target.value })
              }
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="time"
                value={editingLesson.startTime}
                onChange={(e) =>
                  setEditingLesson({ ...editingLesson, startTime: e.target.value })
                }
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
              />
              <input
                type="time"
                value={editingLesson.endTime}
                onChange={(e) =>
                  setEditingLesson({ ...editingLesson, endTime: e.target.value })
                }
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["aula", "dad", "ibrida"] as Modality[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEditingLesson({ ...editingLesson, modality: m })}
                  className={`rounded-xl border px-2 py-2 text-xs font-bold ${
                    editingLesson.modality === m
                      ? "border-teal bg-teal/10 text-teal-deep"
                      : "border-line"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            {editingLesson.modality !== "dad" && (
              <select
                value={editingLesson.roomId ?? ""}
                onChange={(e) =>
                  setEditingLesson({ ...editingLesson, roomId: e.target.value })
                }
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
              >
                {state.rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}
            <textarea
              placeholder="Note / avviso"
              value={editingLesson.notes ?? ""}
              onChange={(e) =>
                setEditingLesson({ ...editingLesson, notes: e.target.value })
              }
              className="min-h-[70px] w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => {
                  setEditingLesson(null);
                  setEditingOriginalTeacherId(null);
                }}
              >
                Annulla
              </button>
              <button type="submit" className="btn-primary flex-1">
                Salva
              </button>
            </div>
          </form>
        </div>
      )}

      <QuickLessonModal
        open={Boolean(quickAddDate)}
        date={quickAddDate ?? selectedDate ?? toIsoDate(now)}
        onClose={() => setQuickAddDate(null)}
        onSaved={(d) => {
          setSelectedDate(d);
          const parsed = new Date(`${d}T12:00:00`);
          setYear(parsed.getFullYear());
          setMonth(parsed.getMonth());
        }}
      />

      <CourseCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(courseId) => {
          setCreateOpen(false);
          router.push(`/admin/corsi/${courseId}`);
        }}
      />

      <ConfirmModal
        open={Boolean(deleteId)}
        danger
        title="Eliminare la lezione?"
        message="L'operazione aggiorna subito i calendari di docenti e studenti. Non può essere annullata."
        confirmLabel="Elimina"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteLesson(deleteId);
          setDeleteId(null);
        }}
      />

      <ConfirmModal
        open={Boolean(deleteCourseId)}
        danger
        title="Eliminare l'intero corso?"
        message={
          deleteCourseId
            ? `Stai per eliminare definitivamente «${getCourse(deleteCourseId)?.title ?? "questo corso"}» e tutte le sue lezioni dal calendario. Operazione di emergenza, non annullabile.`
            : "Stai per eliminare definitivamente il corso e tutte le sue lezioni. Operazione non annullabile."
        }
        confirmLabel="Elimina corso"
        cancelLabel="Annulla"
        onCancel={() => setDeleteCourseId(null)}
        onConfirm={() => {
          if (deleteCourseId) {
            deleteCourse(deleteCourseId);
            if (editingLesson?.courseId === deleteCourseId) {
              setEditingLesson(null);
              setEditingOriginalTeacherId(null);
            }
          }
          setDeleteCourseId(null);
        }}
      />

      <OverlapWarningModal
        open={Boolean(overlapModal)}
        teacherName={overlapModal?.teacherName ?? ""}
        date={overlapModal?.date ?? ""}
        details={overlapModal?.details ?? []}
        onCancel={() => setOverlapModal(null)}
        onProceed={() => overlapModal?.proceed()}
      />
    </div>
  );
}
