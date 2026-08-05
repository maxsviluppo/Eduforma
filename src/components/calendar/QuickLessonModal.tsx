"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import {
  courseTeacherIds,
  findOverlapsForDraft,
  type Modality,
} from "@/lib/calendar/types";
import { OverlapWarningModal } from "@/components/calendar/ConfirmModal";

export function QuickLessonModal({
  open,
  date,
  onClose,
  onSaved,
}: {
  open: boolean;
  date: string;
  onClose: () => void;
  onSaved?: (date: string) => void;
}) {
  const {
    state,
    demoSchoolId,
    addLesson,
    getCourse,
    getLessonsForDate,
  } = useCalendar();

  const activeCourses = useMemo(
    () => state.courses.filter((c) => c.status !== "concluso"),
    [state.courses]
  );

  const [courseId, setCourseId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [lessonDate, setLessonDate] = useState(date);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("13:00");
  const [modality, setModality] = useState<Modality>("aula");
  const [schoolId, setSchoolId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [title, setTitle] = useState("");
  const [overlapModal, setOverlapModal] = useState<{
    teacherName: string;
    date: string;
    details: string[];
    proceed: () => void;
  } | null>(null);

  const selectedCourse = courseId ? getCourse(courseId) : undefined;

  const schoolRooms = useMemo(
    () => state.rooms.filter((r) => r.schoolId === schoolId),
    [state.rooms, schoolId]
  );

  const courseTeachers = useMemo(() => {
    if (!selectedCourse) return state.teachers.filter((t) => t.active !== false);
    const ids = courseTeacherIds(selectedCourse);
    return state.teachers.filter(
      (t) => t.active !== false && ids.includes(t.id)
    );
  }, [selectedCourse, state.teachers]);

  useEffect(() => {
    if (!open) return;
    setLessonDate(date);
    const first = activeCourses[0];
    const defaultSchool = first?.schoolId ?? demoSchoolId;
    setSchoolId(defaultSchool);
    if (first && !courseId) {
      setCourseId(first.id);
      setTeacherId(first.teacherId);
      setModality(first.modality);
      const roomsForSchool = state.rooms.filter((r) => r.schoolId === defaultSchool);
      setRoomId(first.roomId ?? roomsForSchool[0]?.id ?? "");
    }
  }, [open, date]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedCourse) return;
    const ids = courseTeacherIds(selectedCourse);
    setTeacherId(ids[0] ?? selectedCourse.teacherId);
    setModality(selectedCourse.modality);
    setSchoolId(selectedCourse.schoolId);
    const roomsForSchool = state.rooms.filter(
      (r) => r.schoolId === selectedCourse.schoolId
    );
    if (selectedCourse.roomId && roomsForSchool.some((r) => r.id === selectedCourse.roomId)) {
      setRoomId(selectedCourse.roomId);
    } else {
      setRoomId(roomsForSchool[0]?.id ?? "");
    }
    const n =
      getLessonsForDate(lessonDate).filter((l) => l.courseId === selectedCourse.id)
        .length + 1;
    setTitle(`Lezione ${n}`);
  }, [courseId, selectedCourse, lessonDate, getLessonsForDate, state.rooms]);

  useEffect(() => {
    if (!schoolId) return;
    setRoomId((current) => {
      if (current && schoolRooms.some((r) => r.id === current)) return current;
      return schoolRooms[0]?.id ?? "";
    });
  }, [schoolId, schoolRooms]);

  const save = () => {
    if (!courseId || !teacherId || !lessonDate || !title.trim()) return;
    const draft = {
      courseId,
      teacherId,
      date: lessonDate,
      startTime,
      endTime,
      title: title.trim(),
      modality,
      roomId: modality === "dad" ? undefined : roomId || undefined,
      dadLink:
        modality !== "aula"
          ? `https://meet.aulanova.it/${courseId}`
          : undefined,
    };
    const overlap = findOverlapsForDraft(
      state.lessons,
      state.teachers,
      draft
    );
    const apply = () => {
      addLesson(draft);
      onSaved?.(lessonDate);
      onClose();
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
          apply();
        },
      });
      return;
    }
    apply();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[75] flex items-end justify-center bg-ink/30 p-4 backdrop-blur-sm md:items-center"
        onClick={onClose}
      >
        <div
          className="glass-strong w-full max-w-md space-y-3 rounded-[1.6rem] p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-teal-deep">
                Nuova lezione
              </p>
              <h3 className="font-display text-xl font-bold text-ink">
                Inserimento rapido
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-ink-soft hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-xs text-ink-soft">
            Doppio click su un giorno del calendario per aprire questo modulo.
          </p>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-ink-soft">
              Data
            </span>
            <input
              type="date"
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-ink-soft">
              Corso
            </span>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold"
            >
              {activeCourses.length === 0 ? (
                <option value="">Nessun corso attivo</option>
              ) : (
                activeCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-ink-soft">
              Docente
            </span>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold"
            >
              {courseTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase text-ink-soft">
              Titolo
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase text-ink-soft">
                Inizio
              </span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase text-ink-soft">
                Fine
              </span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["aula", "dad", "ibrida"] as Modality[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModality(m)}
                className={`rounded-xl border px-2 py-2 text-xs font-bold capitalize ${
                  modality === m
                    ? "border-teal bg-teal/10 text-teal-deep"
                    : "border-line"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {modality !== "dad" && (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-ink-soft">
                  Scuola
                </span>
                <select
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold"
                >
                  {state.schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.city ? ` · ${s.city}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase text-ink-soft">
                  Aula <span className="font-normal normal-case">(opzionale)</span>
                </span>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
                >
                  <option value="">— Nessuna aula —</option>
                  {schoolRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                      {r.capacity ? ` (${r.capacity} posti)` : ""}
                    </option>
                  ))}
                </select>
                {schoolRooms.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-800">
                    Nessuna aula registrata per questa scuola.
                  </p>
                )}
              </label>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Annulla
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!courseId || !teacherId || activeCourses.length === 0}
              className="btn-primary flex-1 gap-2"
            >
              <Plus className="h-4 w-4" />
              Aggiungi
            </button>
          </div>
        </div>
      </div>

      <OverlapWarningModal
        open={Boolean(overlapModal)}
        teacherName={overlapModal?.teacherName ?? ""}
        date={overlapModal?.date ?? ""}
        details={overlapModal?.details ?? []}
        onCancel={() => setOverlapModal(null)}
        onProceed={() => overlapModal?.proceed()}
      />
    </>
  );
}
