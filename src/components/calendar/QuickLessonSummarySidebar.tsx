"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  DoorClosed,
  ExternalLink,
  GraduationCap,
  Pencil,
  Save,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import {
  COURSE_CATEGORY_LABELS,
  formatDayLabel,
  type Lesson,
} from "@/lib/calendar/types";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";

export function QuickLessonSummarySidebar({
  lesson,
  onClose,
  onOpenFullEdit,
}: {
  lesson: Lesson | null;
  onClose: () => void;
  onOpenFullEdit?: (lesson: Lesson) => void;
}) {
  const {
    state,
    getCourse,
    getTeacher,
    getRoom,
    getSchool,
    updateLesson,
    updateCourse,
  } = useCalendar();

  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("13:00");
  const [teacherId, setTeacherId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [studentCount, setStudentCount] = useState<number>(0);
  const [saved, setSaved] = useState(false);

  // Live lesson from state
  const currentLesson = useMemo(() => {
    if (!lesson) return null;
    return state.lessons.find((l) => l.id === lesson.id) ?? lesson;
  }, [lesson, state.lessons]);

  const course = currentLesson ? getCourse(currentLesson.courseId) : undefined;
  const teacher = currentLesson ? getTeacher(currentLesson.teacherId) : undefined;
  const room = currentLesson?.roomId ? getRoom(currentLesson.roomId) : undefined;
  const school = course ? getSchool(course.schoolId) : undefined;

  const availableRooms = useMemo(() => {
    if (!course) return state.rooms;
    return state.rooms.filter((r) => r.schoolId === course.schoolId);
  }, [course, state.rooms]);

  useEffect(() => {
    if (!currentLesson) return;
    setStartTime(currentLesson.startTime);
    setEndTime(currentLesson.endTime);
    setTeacherId(currentLesson.teacherId);
    setRoomId(currentLesson.roomId ?? "");
    const curCourse = getCourse(currentLesson.courseId);
    setStudentCount(
      curCourse?.studentCount ??
        curCourse?.studentIds?.length ??
        0
    );
    setSaved(false);
  }, [currentLesson, getCourse]);

  if (!currentLesson || !course) return null;

  const handleQuickSave = () => {
    updateLesson(currentLesson.id, {
      startTime,
      endTime,
      teacherId,
      roomId: currentLesson.modality === "dad" ? undefined : roomId || undefined,
    });

    if (course) {
      updateCourse(course.id, {
        studentCount: Math.max(0, Number(studentCount) || 0),
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const dayInfo = formatDayLabel(currentLesson.date);

  return (
    <div className="glass rounded-[1.6rem] border-2 border-teal/40 bg-white/95 p-5 shadow-lg space-y-4 ring-1 ring-teal/20">
      {/* Header with dismiss button */}
      <div className="flex items-start justify-between gap-2 border-b border-line/60 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: course.color }}
            >
              {COURSE_CATEGORY_LABELS[course.category] ?? course.category}
            </span>
            <ModalityBadge modality={currentLesson.modality} compact />
          </div>
          <h3 className="mt-1 font-display text-base font-bold leading-snug text-ink">
            {currentLesson.title}
          </h3>
          <p className="text-xs font-semibold text-teal-deep">
            {course.title}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-ink-soft hover:bg-slate-100 hover:text-ink transition"
          title="Chiudi riepilogo rapido"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Summary Badges */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-line/60 bg-slate-50/80 p-2">
          <p className="text-[10px] font-bold uppercase text-ink-soft">Data</p>
          <p className="font-bold text-ink capitalize">
            {dayInfo.weekday} {dayInfo.day}
          </p>
        </div>
        <div className="rounded-xl border border-line/60 bg-slate-50/80 p-2">
          <p className="text-[10px] font-bold uppercase text-ink-soft">Alunni</p>
          <p className="font-bold text-teal-deep">
            +{course.studentCount ?? 0} partecipanti
          </p>
        </div>
      </div>

      {/* Quick Modifiche Veloci Form */}
      <div className="space-y-3 rounded-2xl border border-teal/20 bg-teal/5 p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-deep">
            <Zap className="h-3.5 w-3.5" />
            <span>Modifiche veloci</span>
          </div>
          {saved && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 animate-fade-in">
              <Check className="h-3.5 w-3.5" /> Salvato!
            </span>
          )}
        </div>

        {/* Orari con preset rapidi */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-ink-soft">
            Orario lezione
          </label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-2 py-1 text-xs font-bold text-ink"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-2 py-1 text-xs font-bold text-ink"
            />
          </div>
          <div className="mt-1.5 flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                setStartTime("09:00");
                setEndTime("13:00");
              }}
              className="rounded-md border border-line/80 bg-white px-1.5 py-0.5 text-[9px] font-bold text-ink-soft hover:bg-teal/10 hover:text-teal-deep"
            >
              09:00 - 13:00
            </button>
            <button
              type="button"
              onClick={() => {
                setStartTime("14:00");
                setEndTime("18:00");
              }}
              className="rounded-md border border-line/80 bg-white px-1.5 py-0.5 text-[9px] font-bold text-ink-soft hover:bg-teal/10 hover:text-teal-deep"
            >
              14:00 - 18:00
            </button>
          </div>
        </div>

        {/* Docente */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-ink-soft">
            Docente
          </label>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-semibold text-ink"
          >
            {state.teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.specialty})
              </option>
            ))}
          </select>
        </div>

        {/* Aula */}
        {currentLesson.modality !== "dad" && (
          <div>
            <label className="block text-[10px] font-bold uppercase text-ink-soft">
              Aula
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-semibold text-ink"
            >
              <option value="">— Nessuna aula —</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (max {r.capacity} posti)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Numero alunni */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-ink-soft">
            Numero alunni corso
          </label>
          <div className="mt-1 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStudentCount((prev) => Math.max(0, prev - 1))}
              className="h-7 w-7 rounded-lg border border-line bg-white text-xs font-bold text-ink hover:bg-slate-100"
            >
              -
            </button>
            <input
              type="number"
              min="0"
              max="999"
              value={studentCount}
              onChange={(e) => setStudentCount(Number(e.target.value))}
              className="h-7 w-16 text-center rounded-lg border border-line bg-white text-xs font-bold text-ink"
            />
            <button
              type="button"
              onClick={() => setStudentCount((prev) => prev + 1)}
              className="h-7 w-7 rounded-lg border border-line bg-white text-xs font-bold text-ink hover:bg-slate-100"
            >
              +
            </button>
            <span className="text-[11px] font-semibold text-teal-deep">
              +{studentCount} sul tag
            </span>
          </div>
        </div>

        {/* Save and Edit actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleQuickSave}
            className="btn-primary flex-1 !py-1.5 text-xs inline-flex items-center justify-center gap-1.5"
          >
            {saved ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Salvato!
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Salva modifiche
              </>
            )}
          </button>
        </div>

        {onOpenFullEdit && (
          <button
            type="button"
            onClick={() => onOpenFullEdit(currentLesson)}
            className="w-full text-center rounded-xl border border-teal/40 bg-white py-1.5 text-xs font-bold text-teal-deep transition hover:bg-teal/10 inline-flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Pencil className="h-3 w-3" />
            Configurazione completa & altre lezioni corso
          </button>
        )}
      </div>

      {/* Direct Links to Courses List & Detail */}
      <div className="space-y-1.5 border-t border-line/60 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
          Collegamenti Corsi
        </p>

        <Link
          href="/admin/corsi"
          className="group flex items-center justify-between rounded-xl border border-line/70 bg-white/90 px-3 py-2 text-xs font-bold text-ink transition hover:border-teal hover:bg-teal/5"
        >
          <span className="flex items-center gap-2">
            <BookMarked className="h-3.5 w-3.5 text-teal-deep" />
            Lista completa di tutti i corsi
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-teal-deep" />
        </Link>

        <Link
          href={`/admin/corsi/${course.id}`}
          className="group flex items-center justify-between rounded-xl border border-line/70 bg-white/90 px-3 py-2 text-xs font-bold text-ink transition hover:border-teal hover:bg-teal/5"
        >
          <span className="flex items-center gap-2 truncate">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-teal-deep" />
            <span className="truncate">Scheda corso: {course.title}</span>
          </span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-teal-deep" />
        </Link>

        <Link
          href={`/admin/calendario?date=${currentLesson.date}`}
          className="group flex items-center justify-between rounded-xl border border-line/70 bg-white/90 px-3 py-2 text-xs font-bold text-ink transition hover:border-teal hover:bg-teal/5"
        >
          <span className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-teal-deep" />
            Apri data nel calendario corsi
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-teal-deep" />
        </Link>
      </div>
    </div>
  );
}
