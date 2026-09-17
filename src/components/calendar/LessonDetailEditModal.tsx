"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  Clock3,
  DoorClosed,
  ExternalLink,
  GraduationCap,
  Save,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import {
  COURSE_CATEGORY_LABELS,
  COURSE_PRESET_COLORS,
  findOverlapsForDraft,
  formatTimeRange,
  lessonDurationMinutes,
  type Lesson,
  type Modality,
} from "@/lib/calendar/types";
import { lessonCourseColor, schoolAbbrev } from "@/lib/calendar/calendar-display";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";
import { ConfirmModal, OverlapWarningModal } from "@/components/calendar/ConfirmModal";

export function LessonDetailEditModal({
  open,
  lesson: initialLesson,
  onClose,
  onSelectDate,
  onSaved,
}: {
  open: boolean;
  lesson: Lesson | null;
  onClose: () => void;
  onSelectDate?: (date: string) => void;
  onSaved?: () => void;
}) {
  const {
    state,
    getCourse,
    getTeacher,
    getRoom,
    getSchool,
    updateLesson,
    deleteLesson,
    updateCourse,
    getLessonsForCourse,
  } = useCalendar();

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  // Sync active lesson ID when initialLesson changes or modal opens
  useEffect(() => {
    if (open && initialLesson) {
      setActiveLessonId(initialLesson.id);
    }
  }, [open, initialLesson]);

  // Current lesson resolved from live state or fallback to initial
  const currentLesson = useMemo(() => {
    if (!activeLessonId) return initialLesson;
    return state.lessons.find((l) => l.id === activeLessonId) ?? initialLesson;
  }, [activeLessonId, state.lessons, initialLesson]);

  const course = currentLesson ? getCourse(currentLesson.courseId) : undefined;
  const courseColor = currentLesson
    ? lessonCourseColor(currentLesson, getCourse)
    : "#0f8f8a";

  // Form states
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("13:00");
  const [teacherId, setTeacherId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [modality, setModality] = useState<Modality>("aula");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [studentCount, setStudentCount] = useState<number>(0);
  const [courseColorState, setCourseColorState] = useState<string>("#0f8f8a");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Overlap and delete modals
  const [overlapModal, setOverlapModal] = useState<{
    teacherName: string;
    date: string;
    details: string[];
    proceed: () => void;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // When active lesson changes, populate form fields
  useEffect(() => {
    if (!currentLesson) return;
    setDate(currentLesson.date);
    setStartTime(currentLesson.startTime);
    setEndTime(currentLesson.endTime);
    setTeacherId(currentLesson.teacherId);
    setRoomId(currentLesson.roomId ?? "");
    setModality(currentLesson.modality);
    setTitle(currentLesson.title);
    setNotes(currentLesson.notes ?? "");

    const currentCourse = getCourse(currentLesson.courseId);
    setCourseColorState(currentCourse?.color ?? "#0f8f8a");
    setStudentCount(
      currentCourse?.studentCount ??
        currentCourse?.studentIds?.length ??
        0
    );
    setSaveSuccess(false);
  }, [currentLesson, getCourse]);

  // All lessons for this course, sorted chronologically
  const courseLessons = useMemo(() => {
    if (!currentLesson) return [];
    const list = getLessonsForCourse(currentLesson.courseId);
    return [...list].sort((a, b) =>
      a.date === b.date
        ? a.startTime.localeCompare(b.startTime)
        : a.date.localeCompare(b.date)
    );
  }, [currentLesson, getLessonsForCourse, state.lessons]);

  const currentIndex = useMemo(() => {
    if (!currentLesson) return -1;
    return courseLessons.findIndex((l) => l.id === currentLesson.id);
  }, [courseLessons, currentLesson]);

  // Available rooms for this course/school
  const availableRooms = useMemo(() => {
    if (!course) return state.rooms;
    return state.rooms.filter((r) => r.schoolId === course.schoolId);
  }, [course, state.rooms]);

  const selectedRoom = roomId ? getRoom(roomId) : undefined;
  const currentSchool = course ? getSchool(course.schoolId) : undefined;
  const currentTeacher = teacherId ? getTeacher(teacherId) : undefined;

  // Capacity warning
  const capacityWarning = useMemo(() => {
    if (!selectedRoom || modality === "dad" || !studentCount) return null;
    if (studentCount > selectedRoom.capacity) {
      return `Attenzione: gli alunni (${studentCount}) superano la capienza massima dell'aula (${selectedRoom.capacity} posti).`;
    }
    return null;
  }, [selectedRoom, modality, studentCount]);

  const durationMin = useMemo(() => {
    if (!startTime || !endTime) return 0;
    return lessonDurationMinutes({ startTime, endTime });
  }, [startTime, endTime]);

  const durationHours = (durationMin / 60).toFixed(1).replace(".0", "");

  if (!open || !currentLesson) return null;

  const handleSave = () => {
    if (!date || !startTime || !endTime || !teacherId) return;

    const draft = {
      teacherId,
      date,
      startTime,
      endTime,
    };

    const overlap = findOverlapsForDraft(
      state.lessons,
      state.teachers,
      draft,
      currentLesson.id
    );

    const executeSave = () => {
      updateLesson(currentLesson.id, {
        date,
        startTime,
        endTime,
        teacherId,
        roomId: modality === "dad" ? undefined : roomId || undefined,
        modality,
        title: title.trim() || currentLesson.title,
        notes: notes.trim(),
      });

      if (course) {
        updateCourse(course.id, {
          color: courseColorState,
          studentCount: Math.max(0, Number(studentCount) || 0),
        });
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onSaved?.();
      }, 700);
    };

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
          executeSave();
        },
      });
      return;
    }

    executeSave();
  };

  const handleDelete = () => {
    deleteLesson(currentLesson.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[75] flex items-center justify-center bg-ink/40 p-3 backdrop-blur-md sm:p-5"
        onClick={onClose}
      >
        <div
          className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-line/80 bg-white text-ink shadow-[0_25px_70px_rgba(15,28,46,0.25)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-start justify-between border-b border-line/60 bg-slate-50/90 px-6 py-4"
            style={{ borderTop: `5px solid ${courseColor}` }}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs"
                  style={{ backgroundColor: courseColor }}
                >
                  {course
                    ? COURSE_CATEGORY_LABELS[course.category] ?? course.category
                    : "Corso"}
                </span>
                {currentSchool && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">
                    <Building2 className="h-3.5 w-3.5" />
                    {currentSchool.name} ({schoolAbbrev(currentSchool.name, 3)})
                  </span>
                )}
                {currentIndex >= 0 && (
                  <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-bold text-teal-deep">
                    Lezione {currentIndex + 1} di {courseLessons.length}
                  </span>
                )}
              </div>
              <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
                {course?.title ?? currentLesson.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-ink-soft transition hover:bg-slate-200/70 hover:text-ink"
              title="Chiudi"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body: Two columns layout */}
          <div className="grid flex-1 min-h-0 grid-cols-1 overflow-y-auto lg:grid-cols-12">
            {/* Left Column: Lesson Configuration / Edit Form (7 cols) */}
            <div className="space-y-4 p-5 sm:p-6 lg:col-span-7 lg:border-r lg:border-line/60">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-ink">
                  Configurazione Lezione
                </h3>
                <span className="text-xs font-medium text-ink-soft">
                  Modifica e salva per aggiornare il calendario
                </span>
              </div>

              {/* Course Color Selector */}
              {course && (
                <div className="rounded-xl border border-line/70 bg-slate-50/80 p-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Colore del Corso sul Calendario
                    </label>
                    <span className="text-[11px] font-mono font-bold text-ink-soft">
                      {courseColorState}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {COURSE_PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCourseColorState(c)}
                        className={`h-7 w-7 rounded-full border-2 transition-transform transform hover:scale-110 shadow-2xs ${
                          courseColorState === c
                            ? "border-ink scale-110 ring-2 ring-teal/50"
                            : "border-white"
                        }`}
                        style={{ backgroundColor: c }}
                        title={`Imposta colore ${c}`}
                      />
                    ))}
                    <div className="flex items-center gap-1.5 ml-1">
                      <input
                        type="color"
                        value={courseColorState}
                        onChange={(e) => setCourseColorState(e.target.value)}
                        className="h-7 w-7 cursor-pointer rounded-full border border-line bg-transparent p-0.5"
                        title="Colore personalizzato"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Title input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
                  Titolo Lezione
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. Lezione 1 - Introduzione"
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-semibold text-ink shadow-2xs focus:border-teal focus:outline-hidden focus:ring-1 focus:ring-teal"
                />
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Data
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-2xs focus:border-teal focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Ora Inizio
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-2xs focus:border-teal focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Ora Fine
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-2xs focus:border-teal focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Time Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-semibold text-ink-soft">
                  Fasce rapide:
                </span>
                {[
                  { label: "Mattina (09:00 - 13:00)", s: "09:00", e: "13:00" },
                  { label: "Pomeriggio (14:00 - 18:00)", s: "14:00", e: "18:00" },
                  { label: "Full-day (09:00 - 17:00)", s: "09:00", e: "17:00" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setStartTime(preset.s);
                      setEndTime(preset.e);
                    }}
                    className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition ${
                      startTime === preset.s && endTime === preset.e
                        ? "border-teal bg-teal/10 text-teal-deep"
                        : "border-line/80 bg-slate-50 text-ink-soft hover:bg-slate-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <span className="ml-auto text-xs font-bold text-teal-deep">
                  Durata: {durationHours} ore
                </span>
              </div>

              {/* Teacher and Room */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Teacher select */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Docente Assegnato
                  </label>
                  <div className="mt-1">
                    <select
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-2xs focus:border-teal focus:outline-hidden"
                    >
                      {state.teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.specialty})
                        </option>
                      ))}
                    </select>
                  </div>
                  {currentTeacher && (
                    <p className="mt-1 text-[11px] text-ink-soft">
                      Email: {currentTeacher.email}
                    </p>
                  )}
                </div>

                {/* Room select */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Aula
                  </label>
                  <div className="mt-1">
                    <select
                      value={roomId}
                      disabled={modality === "dad"}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink shadow-2xs disabled:bg-slate-100 disabled:opacity-60 focus:border-teal focus:outline-hidden"
                    >
                      <option value="">— Nessuna aula specifica —</option>
                      {availableRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.capacity} posti max)
                        </option>
                      ))}
                    </select>
                  </div>
                  {modality === "dad" ? (
                    <p className="mt-1 text-[11px] text-teal-deep">
                      Lezione in DAD online (nessuna aula fisica richiesta)
                    </p>
                  ) : selectedRoom ? (
                    <p className="mt-1 text-[11px] text-ink-soft">
                      Capienza massima: {selectedRoom.capacity} posti
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Student Count and Modality */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Number of Students */}
                <div className="rounded-xl border border-line/70 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Numero Alunni Corso
                    </label>
                    <span className="rounded-md bg-teal/15 px-1.5 py-0.5 text-[10px] font-bold text-teal-deep">
                      +{studentCount}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-teal-deep shrink-0" />
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={studentCount}
                      onChange={(e) => setStudentCount(Number(e.target.value))}
                      className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-bold text-ink focus:border-teal focus:outline-hidden"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-ink-soft">
                    Aggiorna il numero di partecipanti visibile sul tag del calendario.
                  </p>
                </div>

                {/* Modality buttons */}
                <div className="rounded-xl border border-line/70 bg-slate-50/70 p-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Modalità Didattica
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {(["aula", "dad", "ibrida"] as Modality[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModality(m)}
                        className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-bold capitalize transition ${
                          modality === m
                            ? "border-teal bg-teal text-white shadow-xs"
                            : "border-line bg-white text-ink-soft hover:bg-slate-100"
                        }`}
                      >
                        {m === "dad" && <Video className="h-3 w-3" />}
                        {m === "aula" && <DoorClosed className="h-3 w-3" />}
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-ink-soft">
                    {modality === "dad"
                      ? "Lezione interamente online da remoto."
                      : modality === "ibrida"
                        ? "Presenti in aula e collegati da remoto."
                        : "Lezione in presenza nella scuola."}
                  </p>
                </div>
              </div>

              {/* Capacity warning alert */}
              {capacityWarning && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p>{capacityWarning}</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
                  Note & Istruzioni della Lezione
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Aggiungi appunti, argomenti o istruzioni per docente e studenti..."
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink shadow-2xs focus:border-teal focus:outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Elimina lezione
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-line bg-white px-4 py-2 text-xs font-bold text-ink-soft hover:bg-slate-50"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saveSuccess}
                    className="btn-primary inline-flex items-center gap-2 !py-2 !px-5 text-sm"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="h-4 w-4 text-white" />
                        Salvato!
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 text-white" />
                        Salva modifiche
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Other Lessons of this Course (5 cols) */}
            <div className="flex flex-col bg-slate-50/50 p-5 sm:p-6 lg:col-span-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-ink">
                    Tutte le lezioni del corso
                  </h3>
                  <p className="text-xs text-ink-soft">
                    {courseLessons.length} lezioni in programma
                  </p>
                </div>
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: courseColor }}
                />
              </div>

              <p className="mb-3 text-xs leading-relaxed text-ink-soft">
                Clicca su una lezione per caricarla e modificarne i dati o visualizzarne la pianificazione.
              </p>

              {/* Lessons timeline list */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {courseLessons.map((l, idx) => {
                  const isCurrent = l.id === currentLesson.id;
                  const t = getTeacher(l.teacherId);
                  const r = l.roomId ? getRoom(l.roomId) : undefined;
                  const dObj = new Date(l.date + "T12:00:00");
                  const formattedDay = dObj.toLocaleDateString("it-IT", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  });

                  return (
                    <div
                      key={l.id}
                      onClick={() => {
                        setActiveLessonId(l.id);
                      }}
                      className={`group relative cursor-pointer rounded-2xl border p-3 transition-all ${
                        isCurrent
                          ? "border-teal bg-teal/10 shadow-sm ring-2 ring-teal/30"
                          : "border-line/70 bg-white hover:border-teal/50 hover:bg-white hover:shadow-sm"
                      }`}
                      style={{
                        borderLeftWidth: 4,
                        borderLeftColor: isCurrent ? "#0f8f8a" : courseColor,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-black ${
                              isCurrent
                                ? "bg-teal text-white"
                                : "bg-slate-100 text-ink-soft group-hover:bg-teal/15 group-hover:text-teal-deep"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <p className="text-xs font-bold text-ink">
                            {l.title || `Lezione ${idx + 1}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {isCurrent && (
                            <span className="rounded-full bg-teal px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                              Attiva
                            </span>
                          )}
                          <ModalityBadge modality={l.modality} compact />
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-ink-soft">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0 text-teal-deep" />
                          <span className="font-semibold text-ink capitalize">
                            {formattedDay}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3 shrink-0 text-teal-deep" />
                          <span className="font-semibold tabular-nums text-ink">
                            {formatTimeRange(l)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[11px] text-ink-soft border-t border-line/50 pt-1.5">
                        <span className="truncate">
                          👤 {t?.name?.split(" ")[0] ?? "Docente"}
                        </span>
                        <span>
                          📍 {r?.name ?? (l.modality === "dad" ? "DAD" : "Aula —")}
                        </span>
                        {onSelectDate && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDate(l.date);
                              onClose();
                            }}
                            className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-teal-deep hover:underline"
                            title="Visualizza questo giorno nel calendario principale"
                          >
                            <CalendarDays className="h-3 w-3" />
                            Apri data
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {courseLessons.length === 0 && (
                  <p className="py-8 text-center text-xs text-ink-soft">
                    Nessun&apos;altra lezione registrata per questo corso.
                  </p>
                )}
              </div>

              {/* Course quick stats footer */}
              {course && (
                <div className="mt-4 rounded-xl border border-line/60 bg-white p-3 text-xs">
                  <div className="flex items-center justify-between text-ink-soft">
                    <span>Monte ore programmato:</span>
                    <strong className="text-ink">
                      {courseLessons.reduce(
                        (acc, l) => acc + lessonDurationMinutes(l) / 60,
                        0
                      )}{" "}
                      / {course.totalHours} ore
                    </strong>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-ink-soft">
                    <span>Totale alunni iscritti:</span>
                    <strong className="text-teal-deep">
                      {course.studentCount ?? 0} partecipanti
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlap Warning Dialog */}
      <OverlapWarningModal
        open={Boolean(overlapModal)}
        teacherName={overlapModal?.teacherName ?? ""}
        date={overlapModal?.date ?? ""}
        details={overlapModal?.details ?? []}
        onProceed={() => overlapModal?.proceed()}
        onCancel={() => setOverlapModal(null)}
      />

      {/* Delete confirmation dialog */}
      <ConfirmModal
        open={showDeleteConfirm}
        title="Eliminare questa lezione?"
        message={`Stai per rimuovere definitivamente la lezione "${currentLesson.title}" del ${currentLesson.date}. L'operazione non può essere annullata.`}
        confirmLabel="Elimina definitivamente"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
