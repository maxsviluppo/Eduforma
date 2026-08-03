import type { Modality } from "@/lib/calendar/types";
import { toIsoDate } from "@/lib/calendar/types";

export type PlannedLesson = {
  id: string;
  date: string;
  hours: number;
  startTime: string;
  band: "mattina" | "pomeriggio";
  modality: "aula" | "dad";
  /** Docente scelto manualmente per questa lezione */
  teacherId?: string;
};

export type TeacherPlan = {
  plannedLessons: PlannedLesson[];
  activeSlot: number | null;
  confirmedSlots: Set<number>;
  preferredDates: string[];
  excludedDates: string[];
  autoRules: {
    startDate: string;
    maxPerWeek: number;
    maxPerMonth: number;
    weekdays: number[];
  };
  scheduleError: string | null;
};

export function evenHours(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor((total / count) * 2) / 2;
  const slots = Array.from({ length: count }, () => base);
  let remainder = Math.round((total - base * count) * 2) / 2;
  let i = 0;
  while (remainder > 0 && i < count) {
    slots[i] = Math.round((slots[i] + 0.5) * 2) / 2;
    remainder = Math.round((remainder - 0.5) * 2) / 2;
    i += 1;
  }
  return slots;
}

function defaultLessonModality(courseModality: Modality): "aula" | "dad" {
  return courseModality === "dad" ? "dad" : "aula";
}

export function createPlannedLessons(
  count: number,
  totalHours: number,
  courseModality: Modality
): PlannedLesson[] {
  const hoursList = evenHours(totalHours, count);
  const modality = defaultLessonModality(courseModality);
  return hoursList.map((hours, index) => ({
    id: `slot-${index}-${Date.now()}`,
    date: "",
    hours,
    startTime: "09:00",
    band: "mattina" as const,
    modality,
  }));
}

export function createDefaultTeacherPlan(
  totalHours: number,
  courseModality: Modality,
  now = new Date()
): TeacherPlan {
  return {
    plannedLessons: createPlannedLessons(4, totalHours, courseModality),
    activeSlot: 0,
    confirmedSlots: new Set(),
    preferredDates: [],
    excludedDates: [],
    autoRules: {
      startDate: toIsoDate(now),
      maxPerWeek: 2,
      maxPerMonth: 4,
      weekdays: [0, 1, 2, 3, 4],
    },
    scheduleError: null,
  };
}

export function planScheduledHours(plan: TeacherPlan): number {
  return Math.round(plan.plannedLessons.reduce((sum, l) => sum + l.hours, 0) * 100) / 100;
}

export function planSpareHours(plan: TeacherPlan, totalHours: number): number {
  return Math.round((totalHours - planScheduledHours(plan)) * 100) / 100;
}

export function isTeacherPlanComplete(plan: TeacherPlan, totalHours: number): boolean {
  const spare = planSpareHours(plan, totalHours);
  const hoursOk = Math.abs(spare) < 0.01;
  const allDatesConfirmed = plan.plannedLessons.every(
    (lesson, index) => Boolean(lesson.date) && plan.confirmedSlots.has(index)
  );
  return plan.plannedLessons.length > 0 && hoursOk && spare === 0 && allDatesConfirmed;
}

/** Docente assegnato a una lezione in rotazione (es. 2 lez. doc.1, 1 lez. doc.2, …). */
export function resolveTeacherForLessonIndex(
  lessonIndex: number,
  teacherIds: string[],
  lessonsPerTeacher: number[]
): string {
  if (teacherIds.length === 0) return "";
  if (teacherIds.length === 1) return teacherIds[0];

  let index = 0;
  let teacherPtr = 0;
  let leftInBlock = Math.max(1, lessonsPerTeacher[0] ?? 1);

  while (index < lessonIndex) {
    index += 1;
    leftInBlock -= 1;
    if (leftInBlock === 0) {
      teacherPtr = (teacherPtr + 1) % teacherIds.length;
      leftInBlock = Math.max(1, lessonsPerTeacher[teacherPtr] ?? 1);
    }
  }

  return teacherIds[teacherPtr] ?? teacherIds[0];
}

export function teacherQuotasArray(
  teacherIds: string[],
  quotas: Record<string, number>
): number[] {
  return teacherIds.map((id) => Math.max(1, quotas[id] ?? 1));
}
