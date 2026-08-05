"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Calculator, Check, GraduationCap, Plus, Sparkles, Sun, Sunset, Trash2, X, Building2 } from "lucide-react";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import {
  createPlannedLessons,
  evenHours,
  resolveTeacherForLessonIndex,
  teacherQuotasArray,
  type PlannedLesson,
} from "@/components/calendar/teacher-course-plan";
import { autoScheduleLessonDates, hasTeacherTimeConflict } from "@/lib/calendar/auto-schedule";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import type { CourseCategory, Lesson, Modality } from "@/lib/calendar/types";
import { COURSE_CATEGORY_LABELS, addHoursToTime, findTeacherOverlaps, toIsoDate } from "@/lib/calendar/types";

const WEEKDAY_OPTIONS = [
  { id: 0, label: "Lun" },
  { id: 1, label: "Mar" },
  { id: 2, label: "Mer" },
  { id: 3, label: "Gio" },
  { id: 4, label: "Ven" },
  { id: 5, label: "Sab" },
];

const TEACHER_COLORS = ["#0f8f8a", "#3b82c4", "#7c5cbf", "#d97706", "#e11d48"] as const;

function teacherAccentColor(teacherId: string, teacherIds: string[]): string {
  const index = teacherIds.indexOf(teacherId);
  return TEACHER_COLORS[index >= 0 ? index % TEACHER_COLORS.length : 0];
}

/** Bordi longhand: evita conflitto React tra borderColor e borderLeftColor. */
function solidBorderStyle(color: string, width = 1): CSSProperties {
  return {
    borderTopWidth: width,
    borderRightWidth: width,
    borderBottomWidth: width,
    borderLeftWidth: width,
    borderTopColor: color,
    borderRightColor: color,
    borderBottomColor: color,
    borderLeftColor: color,
    borderTopStyle: "solid",
    borderRightStyle: "solid",
    borderBottomStyle: "solid",
    borderLeftStyle: "solid",
  };
}

function accentLeftBorderStyle(color: string, leftWidth = 3): CSSProperties {
  return {
    borderLeftWidth: leftWidth,
    borderLeftColor: color,
    borderLeftStyle: "solid",
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (courseId: string) => void;
};

function defaultLessonModality(courseModality: Modality): "aula" | "dad" {
  return courseModality === "dad" ? "dad" : "aula";
}

function deriveCourseModality(lessons: PlannedLesson[]): Modality {
  const hasAula = lessons.some((l) => l.modality === "aula");
  const hasDad = lessons.some((l) => l.modality === "dad");
  if (hasAula && hasDad) return "ibrida";
  if (hasDad) return "dad";
  return "aula";
}

function lessonSlot(lesson: PlannedLesson) {
  return {
    startTime: lesson.startTime,
    endTime: addHoursToTime(lesson.startTime, lesson.hours),
  };
}

function teacherForLesson(
  index: number,
  teacherIds: string[],
  quotas: Record<string, number>
): string {
  if (teacherIds.length === 0) return "";
  return resolveTeacherForLessonIndex(
    index,
    teacherIds,
    teacherQuotasArray(teacherIds, quotas)
  );
}

function effectiveTeacherForLesson(
  index: number,
  lessons: PlannedLesson[],
  teacherIds: string[],
  quotas: Record<string, number>
): string {
  const picked = lessons[index]?.teacherId;
  if (picked && teacherIds.includes(picked)) return picked;
  return teacherForLesson(index, teacherIds, quotas);
}

function assignedSlotsForLesson(
  lessons: PlannedLesson[],
  skipIndex: number,
  teacherIds: string[],
  quotas: Record<string, number>
): Array<{ date: string; slot: ReturnType<typeof lessonSlot>; teacherId?: string }> {
  return lessons.flatMap((lesson, index) => {
    if (index === skipIndex || !lesson.date) return [];
    return [
      {
        date: lesson.date,
        slot: lessonSlot(lesson),
        teacherId: effectiveTeacherForLesson(index, lessons, teacherIds, quotas),
      },
    ];
  });
}

function isLessonSlotBusy(
  index: number,
  date: string,
  lessons: PlannedLesson[],
  teacherId: string,
  teacherLessons: Array<{ date: string; startTime: string; endTime: string }>,
  teacherIds: string[],
  quotas: Record<string, number>
): boolean {
  const lesson = lessons[index];
  if (!lesson) return true;
  return hasTeacherTimeConflict(
    date,
    lessonSlot(lesson),
    teacherLessons,
    assignedSlotsForLesson(lessons, index, teacherIds, quotas),
    teacherId
  );
}

type TeacherDatePrefs = { preferred: string[]; excluded: string[] };

function emptyTeacherPrefs(): TeacherDatePrefs {
  return { preferred: [], excluded: [] };
}

export function CourseCreateModal({ open, onClose, onCreated }: Props) {
  const {
    state,
    demoSchoolId,
    createCourseWithSchedule,
    updateTeacher,
    getSchool,
    getCourse,
  } = useCalendar();
  const now = new Date();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "tecnico" as CourseCategory,
    schoolId: demoSchoolId,
    roomId: "",
    modality: "ibrida" as Modality,
    totalHours: 16,
    studentCount: 1,
  });

  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [teacherLessonQuotas, setTeacherLessonQuotas] = useState<Record<string, number>>({});
  const [teacherPrefs, setTeacherPrefs] = useState<Record<string, TeacherDatePrefs>>({});
  /** Docente attivo nel box programmazione (switch) */
  const [focusTeacherId, setFocusTeacherId] = useState<string>("");

  const [plannedLessons, setPlannedLessons] = useState<PlannedLesson[]>(() =>
    createPlannedLessons(4, 16, "ibrida")
  );
  const [activeSlot, setActiveSlot] = useState<number | null>(0);
  const [confirmedSlots, setConfirmedSlots] = useState<Set<number>>(() => new Set());
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [autoRules, setAutoRules] = useState({
    startDate: toIsoDate(now),
    maxPerWeek: 2,
    maxPerMonth: 4,
    weekdays: [0, 1, 2, 3, 4] as number[],
  });

  const [planYear, setPlanYear] = useState(now.getFullYear());
  const [planMonth, setPlanMonth] = useState(now.getMonth());
  const [planSelectedDate, setPlanSelectedDate] = useState<string | null>(toIsoDate(now));
  const [calendarMode, setCalendarMode] = useState<"lesson" | "prefer" | "exclude">("lesson");

  useEffect(() => {
    if (!open) return;
    setSelectedTeacherIds([]);
    setTeacherLessonQuotas({});
    setTeacherPrefs({});
    setFocusTeacherId("");
    setPlannedLessons(createPlannedLessons(4, 16, "ibrida"));
    setActiveSlot(0);
    setConfirmedSlots(new Set());
    setScheduleError(null);
    setAutoRules({
      startDate: toIsoDate(now),
      maxPerWeek: 2,
      maxPerMonth: 4,
      weekdays: [0, 1, 2, 3, 4],
    });
    setPlanYear(now.getFullYear());
    setPlanMonth(now.getMonth());
    setPlanSelectedDate(toIsoDate(now));
    setCalendarMode("lesson");
    setForm((f) => ({
      ...f,
      title: "",
      description: "",
      category: "tecnico",
      schoolId: demoSchoolId,
      roomId: "",
      studentCount: 1,
    }));
  }, [open, demoSchoolId]);

  /** Assegna un docente a ogni lezione (modificabile), non solo alla prima. */
  useEffect(() => {
    if (!open || selectedTeacherIds.length === 0) return;
    setPlannedLessons((prev) => {
      let changed = false;
      const next = prev.map((lesson, index) => {
        if (lesson.teacherId && selectedTeacherIds.includes(lesson.teacherId)) {
          return lesson;
        }
        changed = true;
        return {
          ...lesson,
          teacherId: teacherForLesson(index, selectedTeacherIds, teacherLessonQuotas),
        };
      });
      return changed ? next : prev;
    });
  }, [open, selectedTeacherIds, teacherLessonQuotas, plannedLessons.length]);

  useEffect(() => {
    if (!selectedTeacherIds.length) {
      if (focusTeacherId) setFocusTeacherId("");
      return;
    }
    if (!selectedTeacherIds.includes(focusTeacherId)) {
      setFocusTeacherId(selectedTeacherIds[0]);
    }
  }, [selectedTeacherIds, focusTeacherId]);

  const availableTeachers = useMemo(() => {
    const active = state.teachers.filter((t) => t.active !== false);
    const sortByName = (a: (typeof active)[0], b: (typeof active)[0]) =>
      a.name.localeCompare(b.name, "it-IT");
    const forSchool = active.filter((t) => t.schoolId === form.schoolId).sort(sortByName);
    const unassigned = active.filter((t) => !t.schoolId).sort(sortByName);
    const others = active
      .filter((t) => t.schoolId && t.schoolId !== form.schoolId)
      .sort(sortByName);
    const seen = new Set<string>();
    return [...forSchool, ...unassigned, ...others].filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }, [state.teachers, form.schoolId]);

  const rooms = useMemo(
    () => state.rooms.filter((r) => r.schoolId === form.schoolId),
    [state.rooms, form.schoolId]
  );

  const roomId = form.roomId || rooms[0]?.id || "";

  const scheduledHours = useMemo(
    () => Math.round(plannedLessons.reduce((sum, l) => sum + l.hours, 0) * 100) / 100,
    [plannedLessons]
  );

  const spareHours = Math.round((form.totalHours - scheduledHours) * 100) / 100;
  const hoursOk = Math.abs(spareHours) < 0.01;
  const allDatesConfirmed = plannedLessons.every(
    (lesson, index) => Boolean(lesson.date) && confirmedSlots.has(index)
  );

  const duplicateCourseName = useMemo(() => {
    const normalized = form.title.trim().toLocaleLowerCase("it-IT");
    if (!normalized) return false;
    return state.courses.some(
      (course) => course.title.trim().toLocaleLowerCase("it-IT") === normalized
    );
  }, [form.title, state.courses]);

  const focusPrefs = teacherPrefs[focusTeacherId] ?? emptyTeacherPrefs();
  const preferredDates = focusPrefs.preferred;
  const excludedDates = focusPrefs.excluded;

  const pendingLessonDates = useMemo(
    () =>
      plannedLessons
        .map((lesson, index) => {
          if (!lesson.date || confirmedSlots.has(index)) return null;
          if (
            focusTeacherId &&
            effectiveTeacherForLesson(
              index,
              plannedLessons,
              selectedTeacherIds,
              teacherLessonQuotas
            ) !== focusTeacherId
          ) {
            return null;
          }
          return lesson.date;
        })
        .filter((d): d is string => Boolean(d)),
    [plannedLessons, confirmedSlots, focusTeacherId, selectedTeacherIds, teacherLessonQuotas]
  );

  const confirmedLessonDates = useMemo(
    () =>
      plannedLessons
        .map((lesson, index) => {
          if (!lesson.date || !confirmedSlots.has(index)) return null;
          if (
            focusTeacherId &&
            effectiveTeacherForLesson(
              index,
              plannedLessons,
              selectedTeacherIds,
              teacherLessonQuotas
            ) !== focusTeacherId
          ) {
            return null;
          }
          return lesson.date;
        })
        .filter((d): d is string => Boolean(d)),
    [plannedLessons, confirmedSlots, focusTeacherId, selectedTeacherIds, teacherLessonQuotas]
  );

  const otherCourseLessons = useMemo(() => {
    if (!focusTeacherId) return [];
    return state.lessons
      .filter((l) => l.teacherId === focusTeacherId)
      .sort((a, b) =>
        a.date === b.date
          ? a.startTime.localeCompare(b.startTime)
          : a.date.localeCompare(b.date)
      );
  }, [state.lessons, focusTeacherId]);

  const setupReady = Boolean(
    form.title.trim() && selectedTeacherIds.length > 0 && hoursOk && spareHours === 0
  );

  const previewLessons: Lesson[] = useMemo(
    () =>
      plannedLessons.flatMap((slot, index) => {
        if (!slot.date) return [];
        const teacherId = effectiveTeacherForLesson(
          index,
          plannedLessons,
          selectedTeacherIds,
          teacherLessonQuotas
        );
        if (!teacherId) return [];
        return [
          {
            id: `preview-${slot.id}`,
            courseId: "preview-course",
            title: `Lezione ${index + 1}`,
            date: slot.date,
            startTime: slot.startTime,
            endTime: addHoursToTime(slot.startTime, slot.hours),
            modality: slot.modality,
            teacherId,
            roomId: slot.modality === "aula" ? roomId : undefined,
          },
        ];
      }),
    [plannedLessons, selectedTeacherIds, teacherLessonQuotas, roomId]
  );

  /** Solo conflitti che coinvolgono le lezioni di QUESTO corso in creazione. */
  const previewOverlaps = useMemo(() => {
    if (!previewLessons.length) return [];
    const previewIds = new Set(previewLessons.map((l) => l.id));
    return findTeacherOverlaps(
      [...state.lessons, ...previewLessons],
      state.teachers
    ).filter((overlap) => overlap.lessons.some((l) => previewIds.has(l.id)));
  }, [state.lessons, state.teachers, previewLessons]);

  const overlappingPlannedIndexes = useMemo(() => {
    const indexes = new Set<number>();
    const previewIds = new Set(previewLessons.map((l) => l.id));
    for (const overlap of previewOverlaps) {
      for (const lesson of overlap.lessons) {
        if (!previewIds.has(lesson.id)) continue;
        const slotId = lesson.id.replace(/^preview-/, "");
        const index = plannedLessons.findIndex((l) => l.id === slotId);
        if (index >= 0) indexes.add(index);
      }
    }
    return indexes;
  }, [previewOverlaps, previewLessons, plannedLessons]);

  const canSubmit =
    form.title.trim() &&
    !duplicateCourseName &&
    selectedTeacherIds.length > 0 &&
    form.studentCount >= 1 &&
    plannedLessons.length > 0 &&
    allDatesConfirmed &&
    hoursOk &&
    spareHours === 0 &&
    previewOverlaps.length === 0;

  const overlapDates = useMemo(
    () => [...new Set(previewOverlaps.map((o) => o.date))],
    [previewOverlaps]
  );

  const activeLessonTeacherId =
    activeSlot !== null
      ? effectiveTeacherForLesson(
          activeSlot,
          plannedLessons,
          selectedTeacherIds,
          teacherLessonQuotas
        )
      : focusTeacherId;

  const activeLessonTeacher = state.teachers.find((t) => t.id === activeLessonTeacherId);
  const focusTeacher = state.teachers.find((t) => t.id === focusTeacherId);
  const activeTeacherColor = activeLessonTeacherId
    ? teacherAccentColor(activeLessonTeacherId, selectedTeacherIds)
    : focusTeacherId
      ? teacherAccentColor(focusTeacherId, selectedTeacherIds)
      : "#0f8f8a";
  const focusTeacherColor = focusTeacherId
    ? teacherAccentColor(focusTeacherId, selectedTeacherIds)
    : "#0f8f8a";

  const teacherOtherDates = useMemo(
    () =>
      focusTeacherId
        ? [...new Set(state.lessons.filter((l) => l.teacherId === focusTeacherId).map((l) => l.date))]
        : [],
    [state.lessons, focusTeacherId]
  );

  const getExistingLessonsForTeacher = (teacherId: string) =>
    state.lessons
      .filter((l) => l.teacherId === teacherId)
      .map((l) => ({
        date: l.date,
        startTime: l.startTime,
        endTime: l.endTime,
      }));

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeacherIds((prev) => {
      if (prev.includes(teacherId)) {
        const next = prev.filter((id) => id !== teacherId);
        setTeacherLessonQuotas((quotas) => {
          const q = { ...quotas };
          delete q[teacherId];
          return q;
        });
        setTeacherPrefs((prefs) => {
          const p = { ...prefs };
          delete p[teacherId];
          return p;
        });
        setPlannedLessons((lessons) =>
          lessons.map((lesson) =>
            lesson.teacherId === teacherId ? { ...lesson, teacherId: undefined } : lesson
          )
        );
        setFocusTeacherId((current) =>
          current === teacherId ? next[0] ?? "" : current
        );
        return next;
      }
      setTeacherLessonQuotas((quotas) => ({
        ...quotas,
        [teacherId]: quotas[teacherId] ?? 1,
      }));
      setTeacherPrefs((prefs) => ({
        ...prefs,
        [teacherId]: prefs[teacherId] ?? emptyTeacherPrefs(),
      }));
      setFocusTeacherId((current) => current || teacherId);
      return [...prev, teacherId];
    });
  };

  const switchFocusTeacher = (teacherId: string) => {
    setFocusTeacherId(teacherId);
    setScheduleError(null);
    const firstForTeacher = plannedLessons.findIndex(
      (lesson, index) =>
        effectiveTeacherForLesson(
          index,
          plannedLessons,
          selectedTeacherIds,
          teacherLessonQuotas
        ) === teacherId && !confirmedSlots.has(index)
    );
    if (firstForTeacher >= 0) {
      setActiveSlot(firstForTeacher);
      setCalendarMode("lesson");
      return;
    }
    const anyForTeacher = plannedLessons.findIndex(
      (_, index) =>
        effectiveTeacherForLesson(
          index,
          plannedLessons,
          selectedTeacherIds,
          teacherLessonQuotas
        ) === teacherId
    );
    setActiveSlot(anyForTeacher >= 0 ? anyForTeacher : null);
  };

  const applyCourseModality = (modality: Modality) => {
    if (modality === "ibrida") {
      setForm((f) => ({ ...f, modality }));
      return;
    }
    const lessonMod = modality === "dad" ? "dad" : "aula";
    setForm((f) => ({ ...f, modality }));
    setPlannedLessons((prev) => prev.map((l) => ({ ...l, modality: lessonMod })));
  };

  const applyLessonModality = (index: number, modality: "aula" | "dad") => {
    setPlannedLessons((prev) => {
      const next = prev.map((lesson, i) =>
        i === index ? { ...lesson, modality } : lesson
      );
      setForm((f) => ({ ...f, modality: deriveCourseModality(next) }));
      return next;
    });
  };

  const toggleAutoWeekday = (id: number) => {
    setAutoRules((rules) => ({
      ...rules,
      weekdays: rules.weekdays.includes(id)
        ? rules.weekdays.filter((w) => w !== id)
        : [...rules.weekdays, id].sort(),
    }));
  };

  const generateAutoCalendar = () => {
    if (!setupReady || autoRules.weekdays.length === 0) return;

    const teacherIdsPerSlot = plannedLessons.map((_, index) =>
      effectiveTeacherForLesson(index, plannedLessons, selectedTeacherIds, teacherLessonQuotas)
    );

    const baseTeacherLessons = state.lessons.map((l) => ({
      date: l.date,
      startTime: l.startTime,
      endTime: l.endTime,
      teacherId: l.teacherId,
    }));

    const dates: string[] = [];
    const runningAssigned: Array<{
      date: string;
      startTime: string;
      endTime: string;
      teacherId: string;
    }> = [];

    plannedLessons.forEach((lesson, index) => {
      const tid = teacherIdsPerSlot[index] ?? "";
      const prefs = teacherPrefs[tid] ?? emptyTeacherPrefs();
      const slot = lessonSlot(lesson);
      const blockedByOtherTeachers = [
        ...new Set(
          runningAssigned.filter((l) => l.teacherId && l.teacherId !== tid).map((l) => l.date)
        ),
      ];
      const [date] = autoScheduleLessonDates({
        count: 1,
        startDate: autoRules.startDate,
        weekdays: autoRules.weekdays,
        maxPerWeek: autoRules.maxPerWeek,
        maxPerMonth: autoRules.maxPerMonth,
        preferredDates: prefs.preferred,
        excludedDates: prefs.excluded,
        blockedDatesForOtherTeachers: blockedByOtherTeachers,
        slots: [slot],
        teacherIds: [tid],
        teacherLessons: [
          ...baseTeacherLessons.filter((l) => l.teacherId === tid),
          ...runningAssigned.filter((l) => l.teacherId === tid),
        ],
      });
      dates.push(date ?? "");
      if (date) {
        runningAssigned.push({
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          teacherId: tid,
        });
      }
    });

    const updatedLessons = plannedLessons.map((lesson, index) => ({
      ...lesson,
      date: dates[index] ?? "",
      teacherId: lesson.teacherId ?? teacherIdsPerSlot[index],
    }));

    const nextConfirmed = new Set<number>();
    let failed = 0;
    updatedLessons.forEach((lesson, index) => {
      if (!lesson.date) {
        failed += 1;
        return;
      }
      const lessonTeacherId = teacherIdsPerSlot[index] ?? "";
      const otherTeacherSameDay = updatedLessons.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          other.date === lesson.date &&
          Boolean(other.date) &&
          (other.teacherId ?? teacherIdsPerSlot[otherIndex]) !== lessonTeacherId
      );
      if (
        otherTeacherSameDay ||
        isLessonSlotBusy(
          index,
          lesson.date,
          updatedLessons,
          lessonTeacherId,
          getExistingLessonsForTeacher(lessonTeacherId),
          selectedTeacherIds,
          teacherLessonQuotas
        )
      ) {
        failed += 1;
        updatedLessons[index] = { ...lesson, date: "" };
        return;
      }
      nextConfirmed.add(index);
    });

    setPlannedLessons(updatedLessons);
    setConfirmedSlots(nextConfirmed);
    setActiveSlot(null);
    setScheduleError(
      failed > 0
        ? `${failed} lezione/i non assegnate: evita stesso giorno per docenti diversi, conflitti orari o date non disponibili.`
        : null
    );

    const firstDate = updatedLessons.find((l) => l.date)?.date;
    if (firstDate) {
      setPlanSelectedDate(firstDate);
      const first = new Date(`${firstDate}T12:00:00`);
      setPlanYear(first.getFullYear());
      setPlanMonth(first.getMonth());
    }
  };

  const setLessonCount = (count: number) => {
    const next = Math.max(1, count);
    const hoursList = evenHours(form.totalHours, next);
    const modality = defaultLessonModality(form.modality);
    setConfirmedSlots(new Set());
    setPlannedLessons((prev) =>
      hoursList.map((hours, index) => {
        const existing = prev[index];
        if (existing) return { ...existing, hours };
        return {
          id: `slot-${index}-${Date.now()}`,
          date: "",
          hours,
          startTime: "09:00",
          band: "mattina" as const,
          modality,
          teacherId:
            selectedTeacherIds.length > 0
              ? teacherForLesson(index, selectedTeacherIds, teacherLessonQuotas)
              : undefined,
        };
      })
    );
    setActiveSlot((current) => {
      if (current === null) return null;
      return Math.min(current, next - 1);
    });
  };

  const distributeHours = () => {
    const hoursList = evenHours(form.totalHours, plannedLessons.length);
    setConfirmedSlots(new Set());
    setPlannedLessons((prev) =>
      prev.map((lesson, index) => ({ ...lesson, hours: hoursList[index] ?? lesson.hours }))
    );
  };

  const changeLessonHours = (index: number, rawValue: number) => {
    if (!Number.isFinite(rawValue) || rawValue <= 0) return;
    const newHours = Math.max(0.5, Math.round(rawValue * 2) / 2);
    setPlannedLessons((prev) =>
      prev.map((lesson, i) => (i === index ? { ...lesson, hours: newHours } : lesson))
    );
  };

  const applySpareToLesson = (index: number, amount: number) => {
    const lesson = plannedLessons[index];
    if (!lesson || spareHours <= 0) return;
    const take = Math.min(amount, spareHours);
    if (take <= 0) return;
    changeLessonHours(index, lesson.hours + take);
  };

  const updateLesson = (index: number, patch: Partial<PlannedLesson>) => {
    setPlannedLessons((prev) =>
      prev.map((lesson, i) => (i === index ? { ...lesson, ...patch } : lesson))
    );
  };

  const selectActiveLesson = (index: number) => {
    setActiveSlot(index);
    setCalendarMode("lesson");
    setPlannedLessons((prev) => {
      const lesson = prev[index];
      if (!lesson || selectedTeacherIds.length === 0) return prev;
      const suggested =
        lesson.teacherId && selectedTeacherIds.includes(lesson.teacherId)
          ? lesson.teacherId
          : teacherForLesson(index, selectedTeacherIds, teacherLessonQuotas);
      setFocusTeacherId(suggested);
      if (lesson.teacherId) return prev;
      return prev.map((l, i) => (i === index ? { ...l, teacherId: suggested } : l));
    });
  };

  const setLessonTeacher = (index: number, teacherId: string) => {
    if (!selectedTeacherIds.includes(teacherId)) return;
    updateLesson(index, { teacherId });
    setFocusTeacherId(teacherId);
    setActiveSlot(index);
    setCalendarMode("lesson");
    setScheduleError(null);
  };

  const setBand = (index: number, band: "mattina" | "pomeriggio") => {
    updateLesson(index, {
      band,
      startTime: band === "mattina" ? "09:00" : "14:00",
    });
  };

  const removeLesson = (index: number) => {
    if (plannedLessons.length <= 1) return;
    setPlannedLessons((prev) => prev.filter((_, i) => i !== index));
    setConfirmedSlots((prev) => {
      const next = new Set<number>();
      for (const slot of prev) {
        if (slot < index) next.add(slot);
        else if (slot > index) next.add(slot - 1);
      }
      return next;
    });
    setActiveSlot((current) => {
      if (current === null) return null;
      if (current === index) return Math.max(0, index - 1);
      if (current > index) return current - 1;
      return current;
    });
  };

  const confirmLessonDate = (index: number) => {
    const lesson = plannedLessons[index];
    if (!lesson?.date) return;
    const lessonTeacherId = effectiveTeacherForLesson(
      index,
      plannedLessons,
      selectedTeacherIds,
      teacherLessonQuotas
    );
    const otherTeacherSameDay = plannedLessons.some(
      (other, otherIndex) =>
        otherIndex !== index &&
        other.date === lesson.date &&
        effectiveTeacherForLesson(
          otherIndex,
          plannedLessons,
          selectedTeacherIds,
          teacherLessonQuotas
        ) !== lessonTeacherId
    );
    if (otherTeacherSameDay) {
      setScheduleError(
        `Impossibile confermare: un altro docente del corso ha già lezione il ${lesson.date}.`
      );
      return;
    }
    if (
      isLessonSlotBusy(
        index,
        lesson.date,
        plannedLessons,
        lessonTeacherId,
        getExistingLessonsForTeacher(lessonTeacherId),
        selectedTeacherIds,
        teacherLessonQuotas
      )
    ) {
      setScheduleError(
        `Impossibile confermare: il docente è già impegnato il ${lesson.date} alle ${lesson.startTime}.`
      );
      return;
    }
    setScheduleError(null);
    const nextConfirmed = new Set(confirmedSlots).add(index);
    setConfirmedSlots(nextConfirmed);
    const nextOpen = plannedLessons.findIndex(
      (lesson, i) => !nextConfirmed.has(i) && !lesson.date
    );
    if (nextOpen >= 0) {
      selectActiveLesson(nextOpen);
      return;
    }
    const nextUnconfirmed = plannedLessons.findIndex((_, i) => !nextConfirmed.has(i));
    setActiveSlot(nextUnconfirmed >= 0 ? nextUnconfirmed : null);
  };

  const editLessonDate = (index: number) => {
    selectActiveLesson(index);
    setConfirmedSlots((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    setCalendarMode("lesson");
  };

  const handleCalendarDate = (date: string) => {
    setPlanSelectedDate(date);

    if (calendarMode === "prefer" || calendarMode === "exclude") {
      if (!focusTeacherId) {
        setScheduleError("Seleziona un docente nel box programmazione per impostare preferenze/esclusioni.");
        return;
      }
      setTeacherPrefs((prev) => {
        const current = prev[focusTeacherId] ?? emptyTeacherPrefs();
        if (calendarMode === "prefer") {
          const preferred = current.preferred.includes(date)
            ? current.preferred.filter((d) => d !== date)
            : [...current.preferred, date].sort();
          return {
            ...prev,
            [focusTeacherId]: {
              preferred,
              excluded: current.excluded.filter((d) => d !== date),
            },
          };
        }
        const excluded = current.excluded.includes(date)
          ? current.excluded.filter((d) => d !== date)
          : [...current.excluded, date].sort();
        return {
          ...prev,
          [focusTeacherId]: {
            preferred: current.preferred.filter((d) => d !== date),
            excluded,
          },
        };
      });
      setScheduleError(null);
      return;
    }

    if (activeSlot === null) return;
    if (confirmedSlots.has(activeSlot)) return;

    if (!plannedLessons[activeSlot]?.teacherId) {
      setScheduleError("Seleziona prima il docente per questa lezione.");
      return;
    }

    const slotTeacherId = plannedLessons[activeSlot].teacherId!;

    const currentDate = plannedLessons[activeSlot]?.date;
    if (currentDate === date) {
      confirmLessonDate(activeSlot);
      return;
    }

    const otherTeacherSameDay = plannedLessons.some(
      (lesson, index) =>
        index !== activeSlot &&
        lesson.date === date &&
        effectiveTeacherForLesson(
          index,
          plannedLessons,
          selectedTeacherIds,
          teacherLessonQuotas
        ) !== slotTeacherId
    );
    if (otherTeacherSameDay) {
      setScheduleError(
        `Giorno già usato da un altro docente di questo corso (${date}). Scegli un'altra data.`
      );
      return;
    }

    if (
      isLessonSlotBusy(
        activeSlot,
        date,
        plannedLessons,
        slotTeacherId,
        getExistingLessonsForTeacher(slotTeacherId),
        selectedTeacherIds,
        teacherLessonQuotas
      )
    ) {
      const slot = plannedLessons[activeSlot];
      setScheduleError(
        `Orario occupato: il docente ha già lezione il ${date} alle ${slot?.startTime ?? "—"}.`
      );
      return;
    }

    setScheduleError(null);
    updateLesson(activeSlot, { date });
  };

  const removePlanningDate = (date: string, kind: "prefer" | "exclude") => {
    if (!focusTeacherId) return;
    setTeacherPrefs((prev) => {
      const current = prev[focusTeacherId] ?? emptyTeacherPrefs();
      return {
        ...prev,
        [focusTeacherId]:
          kind === "prefer"
            ? { ...current, preferred: current.preferred.filter((d) => d !== date) }
            : { ...current, excluded: current.excluded.filter((d) => d !== date) },
      };
    });
  };

  const formatPlanDate = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString("it-IT", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    selectedTeacherIds.forEach((teacherId) => {
      const teacher = state.teachers.find((t) => t.id === teacherId);
      if (teacher && !teacher.schoolId) {
        updateTeacher(teacherId, { schoolId: form.schoolId });
      }
    });

    const manualLessons = plannedLessons.map((slot, index) => ({
      date: slot.date,
      startTime: slot.startTime,
      endTime: addHoursToTime(slot.startTime, slot.hours),
      modality: slot.modality,
      roomId: slot.modality === "aula" ? roomId : undefined,
      teacherId: effectiveTeacherForLesson(
        index,
        plannedLessons,
        selectedTeacherIds,
        teacherLessonQuotas
      ),
    }));

    const { courseId } = createCourseWithSchedule({
      title: form.title.trim(),
      description: form.description.trim() || `Corso ${form.title.trim()}`,
      category: form.category,
      totalHours: scheduledHours,
      daysCount: plannedLessons.length,
      teacherId: selectedTeacherIds[0],
      teacherIds: selectedTeacherIds.length > 1 ? selectedTeacherIds : undefined,
      studentIds: [],
      studentCount: form.studentCount,
      modality: form.modality,
      roomId: form.modality === "dad" ? undefined : roomId,
      schoolId: form.schoolId,
      sessionsCount: plannedLessons.length,
      manualLessons,
      preferredDates: [
        ...new Set(selectedTeacherIds.flatMap((id) => teacherPrefs[id]?.preferred ?? [])),
      ],
      excludedDates: [
        ...new Set(selectedTeacherIds.flatMap((id) => teacherPrefs[id]?.excluded ?? [])),
      ],
    });

    setForm((f) => ({
      ...f,
      title: "",
      description: "",
    }));
    if (courseId) onCreated?.(courseId);
    onClose();
  };

  const renderTeacherPicker = (lessonIndex: number, compact = false) => {
    if (selectedTeacherIds.length === 0) return null;
    const multi = selectedTeacherIds.length > 1;
    return (
      <div
        className={`${compact ? "mt-2" : "mt-3"} ${
          multi ? "rounded-xl border border-line/80 bg-white/90 px-2.5 py-2" : ""
        }`}
      >
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
          {multi
            ? `Docente lezione ${lessonIndex + 1} — clicca per cambiare`
            : compact
              ? "Docente"
              : "Scegli docente (prima di assegnare la data)"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {selectedTeacherIds.map((id) => {
            const teacher = state.teachers.find((t) => t.id === id);
            const color = teacherAccentColor(id, selectedTeacherIds);
            const selected =
              (plannedLessons[lessonIndex]?.teacherId &&
                selectedTeacherIds.includes(plannedLessons[lessonIndex].teacherId!))
                ? plannedLessons[lessonIndex].teacherId === id
                : effectiveTeacherForLesson(
                    lessonIndex,
                    plannedLessons,
                    selectedTeacherIds,
                    teacherLessonQuotas
                  ) === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setLessonTeacher(lessonIndex, id)}
                className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  selected
                    ? "text-white shadow-sm"
                    : "border-line bg-white text-ink-soft hover:bg-white"
                }`}
                style={
                  selected
                    ? { backgroundColor: color, ...solidBorderStyle(color) }
                    : accentLeftBorderStyle(color)
                }
                title={teacher?.name ?? "Docente"}
              >
                <GraduationCap className="h-3 w-3 shrink-0" />
                <span className="truncate">{teacher?.name ?? "Docente"}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35 p-3 backdrop-blur-sm md:items-center md:p-6"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[1.75rem] p-5 shadow-[0_30px_80px_rgba(15,28,46,0.2)] md:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
              Modalità creazione
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink md:text-3xl">
              Inserisci corso
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Assegna lezioni scegliendo il docente, con preferenze/esclusioni e vista impegni sugli altri corsi.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <input
              required
              placeholder="Nome corso"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm ${
                duplicateCourseName
                  ? "border-red-500 bg-red-50 text-red-900 ring-1 ring-red-300"
                  : "border-line"
              }`}
            />
            {duplicateCourseName && (
              <p className="text-xs font-bold text-red-600">
                Esiste già un corso con questo nome. Scegli un titolo diverso.
              </p>
            )}
            <textarea
              placeholder="Descrizione / che fa"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="min-h-[72px] w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            />

            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category: e.target.value as CourseCategory,
                }))
              }
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            >
              {Object.entries(COURSE_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  Categoria: {label}
                </option>
              ))}
            </select>

            <select
              value={form.schoolId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  schoolId: e.target.value,
                  roomId: "",
                }))
              }
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            >
              {state.schools.map((s) => (
                <option key={s.id} value={s.id}>
                  Scuola: {s.name}
                </option>
              ))}
            </select>

            <div className="rounded-2xl border border-line bg-white p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                Docenti del corso
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Seleziona i docenti del corso. Per ogni lezione puoi scegliere chi la tiene.
              </p>
              {availableTeachers.length === 0 ? (
                <p className="mt-3 text-sm text-amber-800">
                  Nessun docente in anagrafica.{" "}
                  <Link href="/admin/docenti" className="font-bold underline">
                    Aggiungi docenti
                  </Link>
                </p>
              ) : (
                <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto">
                  {availableTeachers.map((teacher) => {
                    const checked = selectedTeacherIds.includes(teacher.id);
                    const schoolLabel =
                      teacher.schoolId === form.schoolId
                        ? "questa scuola"
                        : teacher.schoolId
                          ? getSchool(teacher.schoolId)?.name ?? "altra scuola"
                          : "senza scuola";
                    return (
                      <li key={teacher.id}>
                        <label className="flex cursor-pointer items-start gap-2 rounded-xl px-2 py-2 hover:bg-teal/5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTeacher(teacher.id)}
                            className="mt-1"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-ink">
                              {teacher.name}
                            </span>
                            <span className="block text-xs text-ink-soft">
                              {teacher.specialty} · {schoolLabel}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
              {selectedTeacherIds.length > 0 && (
                <p className="mt-2 text-xs font-semibold text-teal-deep">
                  {selectedTeacherIds.length} docente/i selezionato/i
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["aula", "dad", "ibrida"] as Modality[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => applyCourseModality(m)}
                  className={`rounded-2xl border px-2 py-3 text-xs font-bold ${
                    form.modality === m
                      ? "border-teal bg-teal/10 text-teal-deep"
                      : "border-line bg-white text-ink-soft"
                  }`}
                >
                  {m === "aula" ? "Aula" : m === "dad" ? "DAD" : "Ibrida"}
                </button>
              ))}
            </div>

            {form.modality !== "dad" && (
              <select
                value={roomId}
                onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Aula: {r.name} · {r.capacity} posti
                  </option>
                ))}
              </select>
            )}

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Ore totali corso
                </span>
                <input
                  type="number"
                  min={1}
                  step={0.5}
                  value={form.totalHours}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, totalHours: Number(e.target.value) }))
                  }
                  className="w-full rounded-2xl border border-line bg-white px-3 py-3 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                  N. lezioni
                </span>
                <input
                  type="number"
                  min={1}
                  value={plannedLessons.length}
                  onChange={(e) => setLessonCount(Number(e.target.value))}
                  className="w-full rounded-2xl border border-line bg-white px-3 py-3 text-sm"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                Numero alunni
              </span>
              <input
                type="number"
                required
                min={1}
                step={1}
                value={form.studentCount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    studentCount: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
                className="w-full rounded-2xl border border-line bg-white px-3 py-3 text-sm"
                placeholder="Es. 12"
              />
              <p className="mt-1 text-[11px] text-ink-soft">
                Totale iscritti al corso (solo il numero complessivo).
              </p>
            </label>

            <div
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                hoursOk ? "border-teal/20 bg-teal/5" : "border-amber-200 bg-amber-50"
              }`}
            >
              <Calculator className={`h-4 w-4 ${hoursOk ? "text-teal-deep" : "text-amber-700"}`} />
              <div className="flex-1 text-sm">
                <p className="font-bold text-ink">
                  {scheduledHours}h in lezioni
                  {spareHours > 0 ? ` + ${spareHours}h in riserva` : ""} su {form.totalHours}h
                </p>
                <p className="text-xs text-ink-soft">
                  {hoursOk
                    ? "Le ore del corso sono complete."
                    : spareHours > 0
                      ? `${spareHours}h da inserire in altre lezioni (riserva).`
                      : `${Math.abs(spareHours)}h in eccesso: riduci qualche lezione.`}
                </p>
              </div>
              <button
                type="button"
                onClick={distributeHours}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-teal-deep shadow-sm"
              >
                Distribuisci
              </button>
            </div>

            <div className="rounded-2xl border border-line bg-white/80 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                Generazione automatica calendario
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Usa preferenze/esclusioni di ogni docente e evita conflitti con lezioni già in altri corsi.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-ink-soft">
                    Data inizio
                  </span>
                  <input
                    type="date"
                    value={autoRules.startDate}
                    onChange={(e) =>
                      setAutoRules((r) => ({ ...r, startDate: e.target.value }))
                    }
                    className="w-full rounded-xl border border-line px-2 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-ink-soft">
                    Max / settimana
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={autoRules.maxPerWeek}
                    onChange={(e) =>
                      setAutoRules((r) => ({ ...r, maxPerWeek: Number(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-line px-2 py-2 text-sm"
                  />
                </label>
                <label className="block col-span-2 sm:col-span-1">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-ink-soft">
                    Max / mese
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={autoRules.maxPerMonth}
                    onChange={(e) =>
                      setAutoRules((r) => ({ ...r, maxPerMonth: Number(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-line px-2 py-2 text-sm"
                  />
                </label>
              </div>

              <p className="mt-3 mb-1.5 text-[10px] font-bold uppercase text-ink-soft">
                Giorni ammessi
              </p>
              <div className="flex flex-wrap gap-1">
                {WEEKDAY_OPTIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleAutoWeekday(d.id)}
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      autoRules.weekdays.includes(d.id)
                        ? "bg-teal text-white"
                        : "border border-line bg-white text-ink-soft"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={!setupReady || autoRules.weekdays.length === 0}
                onClick={generateAutoCalendar}
                className="btn-primary mt-3 w-full text-sm disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                Genera calendario automatico
              </button>
            </div>
          </div>

          <div className="flex min-h-[420px] flex-col space-y-3 lg:min-h-[480px]">
            {selectedTeacherIds.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-line bg-white/50 p-8 text-center">
                <p className="max-w-sm text-sm text-ink-soft">
                  Seleziona almeno un docente per programmare le lezioni sul calendario.
                </p>
              </div>
            ) : (
              <>
            <div className="rounded-2xl border border-line bg-white/90 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Programmazione lezioni
                </p>
                <button
                  type="button"
                  onClick={() => setLessonCount(plannedLessons.length + 1)}
                  className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal-deep"
                >
                  + Lezione
                </button>
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                Passa da un docente all&apos;altro per preferenze, esclusioni e impegni negli altri corsi. Tutte le lezioni restano in lista.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedTeacherIds.map((id) => {
                  const teacher = state.teachers.find((t) => t.id === id);
                  const color = teacherAccentColor(id, selectedTeacherIds);
                  const active = focusTeacherId === id;
                  const count = plannedLessons.filter(
                    (lesson, index) =>
                      effectiveTeacherForLesson(
                        index,
                        plannedLessons,
                        selectedTeacherIds,
                        teacherLessonQuotas
                      ) === id
                  ).length;
                  const confirmedCount = plannedLessons.filter(
                    (lesson, index) =>
                      effectiveTeacherForLesson(
                        index,
                        plannedLessons,
                        selectedTeacherIds,
                        teacherLessonQuotas
                      ) === id &&
                      lesson.date &&
                      confirmedSlots.has(index)
                  ).length;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => switchFocusTeacher(id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        active ? "text-white shadow-sm" : "bg-white text-ink-soft"
                      }`}
                      style={
                        active
                          ? { backgroundColor: color, ...solidBorderStyle(color) }
                          : accentLeftBorderStyle(color)
                      }
                    >
                      <GraduationCap className="h-3 w-3" />
                      {teacher?.name.split(" ")[0] ?? "Docente"}
                      <span className={active ? "opacity-90" : "text-ink-soft"}>
                        {confirmedCount}/{count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {focusTeacher && (
              <div
                className="rounded-2xl px-3 py-3"
                style={{
                  ...solidBorderStyle(`${focusTeacherColor}55`),
                  backgroundColor: `${focusTeacherColor}0d`,
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Impegni in altri corsi · {focusTeacher.name}
                </p>
                {otherCourseLessons.length === 0 ? (
                  <p className="mt-2 text-xs text-ink-soft">Nessuna lezione già assegnata in altri corsi.</p>
                ) : (
                  <ul className="mt-2 max-h-28 space-y-1.5 overflow-y-auto">
                    {otherCourseLessons.slice(0, 12).map((lesson) => {
                      const course = getCourse(lesson.courseId);
                      return (
                        <li
                          key={lesson.id}
                          className="rounded-lg border border-line/70 bg-white/80 px-2.5 py-1.5 text-xs"
                        >
                          <span className="font-bold text-ink">
                            {formatPlanDate(lesson.date)} · {lesson.startTime}–{lesson.endTime}
                          </span>
                          <span className="mt-0.5 block text-ink-soft">
                            {course?.title ?? "Altro corso"} · {lesson.title}
                          </span>
                        </li>
                      );
                    })}
                    {otherCourseLessons.length > 12 && (
                      <li className="text-[10px] font-semibold text-ink-soft">
                        +{otherCourseLessons.length - 12} altre lezioni
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}

            {activeSlot !== null && calendarMode === "lesson" && (
              <div
                className="rounded-2xl px-4 py-3 shadow-sm"
                style={{
                  ...solidBorderStyle(activeTeacherColor, 2),
                  backgroundColor: `${activeTeacherColor}12`,
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Lezione selezionata
                </p>
                <p className="mt-1 flex items-center gap-2 font-display text-lg font-bold text-ink">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-full text-white"
                    style={{ backgroundColor: activeTeacherColor }}
                  >
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  Lezione {activeSlot + 1}
                  {activeLessonTeacher ? ` · ${activeLessonTeacher.name}` : ""}
                </p>
                {renderTeacherPicker(activeSlot)}
                <p className="mt-2 text-xs text-ink-soft">
                  {confirmedSlots.has(activeSlot)
                    ? "Lezione confermata. Clicca «Modifica data» per cambiarla."
                    : plannedLessons[activeSlot]?.date
                      ? "Secondo click sullo stesso giorno per confermare."
                      : "Scegli docente e poi la data sul calendario."}
                </p>
              </div>
            )}

            {allDatesConfirmed && (
              <p className="rounded-xl bg-teal/5 px-3 py-2 text-xs font-semibold text-teal-deep">
                Piano completo: puoi cambiare DAD / presenza su ogni lezione in qualsiasi momento.
              </p>
            )}

            {spareHours > 0.01 && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50/90 px-4 py-3">
                <p className="text-sm font-bold text-violet-900">
                  Ore da inserire: {spareHours}h
                </p>
                <p className="mt-0.5 text-xs text-violet-800/80">
                  Toglie da una lezione finiscono qui. Aggiungile a un&apos;altra lezione con i pulsanti + sotto.
                </p>
              </div>
            )}

            {selectedTeacherIds.length > 1 && (
              <p className="rounded-xl bg-teal/5 px-3 py-2 text-xs font-semibold text-teal-deep">
                Assegna o modifica il docente su ogni lezione qui sotto, poi conferma le date sul
                calendario.
              </p>
            )}

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl border border-line bg-white/70 p-2">
              {plannedLessons.map((lesson, index) => {
                const active = activeSlot === index;
                const confirmed = confirmedSlots.has(index);
                const assignedTeacherId = effectiveTeacherForLesson(
                  index,
                  plannedLessons,
                  selectedTeacherIds,
                  teacherLessonQuotas
                );
                const teacherColor = assignedTeacherId
                  ? teacherAccentColor(assignedTeacherId, selectedTeacherIds)
                  : "#94a3b8";
                const hasOverlap = overlappingPlannedIndexes.has(index);
                return (
                  <div
                    key={lesson.id}
                    className={`rounded-xl p-3 transition ${
                      hasOverlap
                        ? "bg-red-50/70"
                        : confirmed
                          ? "bg-emerald-50/50"
                          : active
                            ? "ring-2 ring-offset-1"
                            : "bg-white"
                    }`}
                    style={
                      hasOverlap
                        ? {
                            ...solidBorderStyle("#ef4444", 2),
                            borderLeftWidth: 4,
                            borderLeftColor: "#dc2626",
                            boxShadow: "0 0 0 1px #fecaca",
                          }
                        : active && !confirmed
                          ? {
                              ...solidBorderStyle(teacherColor, 2),
                              borderLeftWidth: 4,
                              backgroundColor: `${teacherColor}10`,
                              boxShadow: `0 0 0 2px ${teacherColor}33`,
                            }
                          : {
                              ...solidBorderStyle(confirmed ? "#6ee7b7" : "#e2e8f0"),
                              borderLeftWidth: 4,
                              borderLeftColor: teacherColor,
                            }
                    }
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => selectActiveLesson(index)}
                        className="text-left text-sm font-bold text-ink"
                      >
                        Lezione {index + 1}
                        {hasOverlap && (
                          <span className="ml-2 text-[10px] font-bold uppercase text-red-600">
                            · orario in conflitto
                          </span>
                        )}
                        {!hasOverlap && confirmed && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700">
                            <Check className="h-3 w-3" /> confermata
                          </span>
                        )}
                        {!hasOverlap && active && !confirmed && (
                          <span className="ml-2 text-[10px] font-bold uppercase text-teal-deep">
                            · 1° click data, 2° click conferma
                          </span>
                        )}
                      </button>
                      {plannedLessons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLesson(index)}
                          className="text-ink-soft hover:text-rose-600"
                          aria-label="Rimuovi lezione"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {renderTeacherPicker(index, true)}

                    <p className="mb-2 text-xs text-ink-soft">
                      {lesson.date
                        ? formatPlanDate(lesson.date)
                        : "Clicca una data nel calendario"}
                      {lesson.date && excludedDates.includes(lesson.date) && (
                        <span className="ml-2 font-bold text-rose-600">· data da evitare</span>
                      )}
                      {lesson.date && preferredDates.includes(lesson.date) && (
                        <span className="ml-2 font-bold text-emerald-700">· preferita</span>
                      )}
                    </p>

                    {lesson.date && !confirmed && activeSlot === index && (
                      <button
                        type="button"
                        onClick={() => confirmLessonDate(index)}
                        className="mb-2 w-full rounded-xl bg-teal px-3 py-2 text-xs font-bold text-white"
                      >
                        Conferma data (o 2° click sul calendario)
                      </button>
                    )}

                    {confirmed && (
                      <button
                        type="button"
                        onClick={() => editLessonDate(index)}
                        className="mb-2 text-xs font-bold text-teal-deep underline"
                      >
                        Modifica data
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase text-ink-soft">
                          Ore
                        </span>
                        <input
                          type="number"
                          min={0.5}
                          step={0.5}
                          value={lesson.hours}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") return;
                            const n = Number(v);
                            if (!Number.isFinite(n)) return;
                            changeLessonHours(index, n);
                          }}
                          className="w-full rounded-xl border border-line px-2 py-2 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-bold uppercase text-ink-soft">
                          Inizio
                        </span>
                        <input
                          type="time"
                          value={lesson.startTime}
                          onChange={(e) =>
                            updateLesson(index, {
                              startTime: e.target.value,
                              band: e.target.value < "13:00" ? "mattina" : "pomeriggio",
                            })
                          }
                          className="w-full rounded-xl border border-line px-2 py-2 text-sm"
                        />
                      </label>
                    </div>

                    <div className="mt-2">
                      <span className="mb-1 block text-[10px] font-bold uppercase text-ink-soft">
                        Modalità lezione
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => applyLessonModality(index, "aula")}
                          className={`flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-bold ${
                            lesson.modality === "aula"
                              ? "border-teal bg-teal/10 text-teal-deep"
                              : "border-line bg-white text-ink-soft"
                          }`}
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          Presenta in aula
                        </button>
                        <button
                          type="button"
                          onClick={() => applyLessonModality(index, "dad")}
                          className={`rounded-xl border px-2 py-2 text-xs font-bold ${
                            lesson.modality === "dad"
                              ? "border-sky-400 bg-sky-50 text-sky-800"
                              : "border-line bg-white text-ink-soft"
                          }`}
                        >
                          DAD
                        </button>
                      </div>
                      {lesson.modality === "aula" && roomId && (
                        <p className="mt-1 text-[10px] text-ink-soft">
                          Aula: {rooms.find((r) => r.id === roomId)?.name ?? "—"}
                        </p>
                      )}
                    </div>

                    {spareHours > 0.01 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="self-center text-[10px] font-bold uppercase text-violet-700">
                          + ore riserva:
                        </span>
                        {[0.5, 1, 2].map((amount) =>
                          amount <= spareHours ? (
                            <button
                              key={amount}
                              type="button"
                              onClick={() => applySpareToLesson(index, amount)}
                              className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-800 hover:bg-violet-200"
                            >
                              +{amount}h
                            </button>
                          ) : null
                        )}
                        {spareHours > 0.01 && (
                          <button
                            type="button"
                            onClick={() => applySpareToLesson(index, spareHours)}
                            className="rounded-full bg-violet-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-violet-700"
                          >
                            +{spareHours}h (tutte)
                          </button>
                        )}
                      </div>
                    )}

                    <div className="mt-2 grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setBand(index, "mattina")}
                        className={`flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-bold ${
                          lesson.band === "mattina"
                            ? "border-amber-300 bg-amber-50 text-amber-800"
                            : "border-line bg-white text-ink-soft"
                        }`}
                      >
                        <Sun className="h-3.5 w-3.5" />
                        Mattina
                      </button>
                      <button
                        type="button"
                        onClick={() => setBand(index, "pomeriggio")}
                        className={`flex items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-bold ${
                          lesson.band === "pomeriggio"
                            ? "border-sky-300 bg-sky-50 text-sky-800"
                            : "border-line bg-white text-ink-soft"
                        }`}
                      >
                        <Sunset className="h-3.5 w-3.5" />
                        Pomeriggio
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-5">
          {selectedTeacherIds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white/40 px-4 py-10 text-center text-sm text-ink-soft">
              Seleziona i docenti per usare il calendario mensile.
            </div>
          ) : (
            <>
          {calendarMode === "lesson" &&
            activeSlot !== null &&
            !confirmedSlots.has(activeSlot) && (
              <div
                className="mb-4 rounded-2xl px-4 py-3"
                style={{
                  ...solidBorderStyle(activeTeacherColor, 2),
                  backgroundColor: `${activeTeacherColor}14`,
                }}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white shadow-md"
                    style={{ backgroundColor: activeTeacherColor }}
                  >
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft">
                      Assegna al calendario
                    </p>
                    <p className="font-display text-xl font-bold text-ink">
                      Lezione {activeSlot + 1}
                      {activeLessonTeacher ? ` · ${activeLessonTeacher.name}` : ""}
                    </p>
                  </div>
                </div>
                {renderTeacherPicker(activeSlot)}
                <p className="mt-2 text-xs text-ink-soft">
                  {!plannedLessons[activeSlot]?.teacherId
                    ? "Seleziona il docente, poi scegli la data sul calendario."
                    : "1° click sul giorno, 2° click per confermare."}
                </p>
              </div>
            )}

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
                Calendario
              </p>
              {focusTeacher && (
                <p className="text-xs font-semibold" style={{ color: focusTeacherColor }}>
                  Vista docente: {focusTeacher.name}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["lesson", "Assegna lezione"],
                  ["prefer", "Preferita"],
                  ["exclude", "Da escludere"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCalendarMode(mode)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    calendarMode === mode
                      ? mode === "prefer"
                        ? "bg-emerald-100 text-emerald-800"
                        : mode === "exclude"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-teal text-white"
                      : "border border-line bg-white text-ink-soft"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-ink-soft">
            {calendarMode === "lesson"
              ? activeSlot !== null && activeLessonTeacher
                ? `Lezione ${activeSlot + 1} → ${activeLessonTeacher.name}: 1° click sul giorno, 2° click per confermare. Verde = mattina, giallo = pomeriggio; iniziali = docente.`
                : "Assegna lezione: seleziona la lezione, scegli il docente, poi la data. Verde = mattina, giallo = pomeriggio."
              : calendarMode === "prefer"
                ? focusTeacher
                  ? `Preferenze per ${focusTeacher.name}: clicca i giorni ideali (usati in generazione automatica).`
                  : "Seleziona un docente nello switch programmazione, poi segna le preferenze."
                : focusTeacher
                  ? `Esclusioni per ${focusTeacher.name}: clicca i giorni da evitare.`
                  : "Seleziona un docente nello switch programmazione, poi segna le esclusioni."}
          </p>

          <div className="mb-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800">
                Date preferite{focusTeacher ? ` · ${focusTeacher.name.split(" ")[0]}` : ""}
              </p>
              <p className="mt-1 text-xs text-emerald-900/80">
                Preferenze del docente attivo (switch in programmazione lezioni).
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {preferredDates.length === 0 && (
                  <span className="text-xs text-emerald-800/70">Nessuna</span>
                )}
                {preferredDates.map((date) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => removePlanningDate(date, "prefer")}
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800"
                    title="Rimuovi"
                  >
                    {formatPlanDate(date)} ×
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-rose-800">
                Date da escludere{focusTeacher ? ` · ${focusTeacher.name.split(" ")[0]}` : ""}
              </p>
              <p className="mt-1 text-xs text-rose-900/80">
                Esclusioni del docente attivo (switch in programmazione lezioni).
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {excludedDates.length === 0 && (
                  <span className="text-xs text-rose-800/70">Nessuna</span>
                )}
                {excludedDates.map((date) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => removePlanningDate(date, "exclude")}
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-rose-800"
                    title="Rimuovi"
                  >
                    {formatPlanDate(date)} ×
                  </button>
                ))}
              </div>
            </div>
          </div>

          {scheduleError && (
            <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {scheduleError}
            </div>
          )}

          {previewOverlaps.length > 0 && (
            <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <p className="font-bold">Accavallamenti rilevati nel calendario</p>
              <p className="mt-1 text-xs">
                {previewOverlaps.map((o) => `${o.teacherName} il ${o.date}`).join(" · ")}
              </p>
            </div>
          )}

          <MonthCalendar
            year={planYear}
            month={planMonth}
            selectedDate={planSelectedDate}
            onSelectDate={handleCalendarDate}
            onChangeMonth={(y, m) => {
              setPlanYear(y);
              setPlanMonth(m);
            }}
            highlightTeacherId={activeLessonTeacherId || undefined}
            lessons={previewLessons}
            markPreferredDates={preferredDates}
            markExcludedDates={excludedDates}
            markPendingDates={pendingLessonDates}
            markConfirmedDates={confirmedLessonDates}
            markOverlapDates={overlapDates}
            markTeacherBusyDates={teacherOtherDates}
          />
            </>
          )}
        </div>

        <div className="mt-6 space-y-2">
          {!canSubmit && (
            <p className="text-center text-xs text-ink-soft">
              {!form.title.trim()
                ? "Inserisci il nome del corso."
                : duplicateCourseName
                  ? "Nome corso già usato: scegli un titolo univoco."
                  : selectedTeacherIds.length === 0
                    ? "Seleziona almeno un docente per il corso."
                    : form.studentCount < 1
                      ? "Inserisci il numero di alunni (minimo 1)."
                      : previewOverlaps.length > 0
                      ? "Risolvi gli accavallamenti orari prima di creare il corso."
                      : spareHours > 0.01
                        ? `Distribuisci ${spareHours}h ancora in riserva.`
                        : !hoursOk
                          ? "Allinea le ore totali del corso con le lezioni."
                          : !allDatesConfirmed
                            ? "Conferma la data di ogni lezione dal calendario."
                            : "Completa tutti i campi obbligatori."}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Annulla
          </button>
          <button type="submit" disabled={!canSubmit} className="btn-primary flex-[1.4] disabled:opacity-50">
            <Plus className="h-4 w-4" />
            Crea corso e lezioni
          </button>
          </div>
        </div>
      </form>
    </div>
  );
}
