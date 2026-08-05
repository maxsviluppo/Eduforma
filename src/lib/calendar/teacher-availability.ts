import type {
  Lesson,
  Teacher,
  TeacherCommitment,
  TeacherCommitmentBand,
} from "@/lib/calendar/types";
import { isMorningLesson } from "@/lib/calendar/types";

export type LessonProblem = {
  lessonId: string;
  reasons: string[];
  severity: "warning" | "critical";
};

export const COMMITMENT_BAND_LABELS: Record<TeacherCommitmentBand, string> = {
  mattina: "Mattina",
  pomeriggio: "Pomeriggio",
  giornata: "Giornata intera",
};

export const COMMITMENT_BAND_STYLES: Record<
  TeacherCommitmentBand,
  {
    overlay: string;
    overlayHalf: string;
    border: string;
    cellBg: string;
    chip: string;
    modeBtnActive: string;
    legendBox: string;
  }
> = {
  mattina: {
    overlay: "bg-amber-400/20",
    overlayHalf: "top-0 h-1/2 bg-amber-400/22",
    border: "border-amber-400",
    cellBg: "bg-amber-50/45",
    chip: "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100",
    modeBtnActive: "bg-amber-500 text-white",
    legendBox: "border-2 border-amber-400 bg-amber-50",
  },
  pomeriggio: {
    overlay: "bg-indigo-400/20",
    overlayHalf: "bottom-0 h-1/2 bg-indigo-400/22",
    border: "border-indigo-400",
    cellBg: "bg-indigo-50/45",
    chip: "border-indigo-300 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
    modeBtnActive: "bg-indigo-600 text-white",
    legendBox: "border-2 border-indigo-400 bg-indigo-50",
  },
  giornata: {
    overlay: "bg-violet-400/20",
    overlayHalf: "inset-0 bg-violet-400/20",
    border: "border-violet-500",
    cellBg: "bg-violet-50/45",
    chip: "border-violet-300 bg-violet-50 text-violet-900 hover:bg-violet-100",
    modeBtnActive: "bg-violet-600 text-white",
    legendBox: "border-2 border-violet-500 bg-violet-50",
  },
};

export function commitmentsForDate(
  commitments: TeacherCommitment[],
  date: string
): TeacherCommitment[] {
  return commitments.filter((c) => c.date === date);
}

export function commitmentBorderForDate(
  commitments: TeacherCommitment[],
  date: string
): string | null {
  const day = commitmentsForDate(commitments, date);
  if (day.length === 0) return null;
  if (day.some((c) => c.band === "giornata")) return COMMITMENT_BAND_STYLES.giornata.border;
  if (day.some((c) => c.band === "mattina") && day.some((c) => c.band === "pomeriggio")) {
    return "border-amber-400"; // split overlay handles visual; amber-indigo mix
  }
  if (day.some((c) => c.band === "mattina")) return COMMITMENT_BAND_STYLES.mattina.border;
  return COMMITMENT_BAND_STYLES.pomeriggio.border;
}

export const DEFAULT_TEACHER_AVAILABILITY = {
  morning: true,
  afternoon: true,
} as const;

export function teacherPreferredDates(teacher: Teacher | undefined): string[] {
  return teacher?.preferredDates ?? [];
}

export function teacherExcludedDates(teacher: Teacher | undefined): string[] {
  return teacher?.excludedDates ?? [];
}

export function teacherCommitments(teacher: Teacher | undefined): TeacherCommitment[] {
  return teacher?.commitments ?? [];
}

export function teacherAvailability(teacher: Teacher | undefined) {
  return teacher?.availability ?? DEFAULT_TEACHER_AVAILABILITY;
}

export function isAfternoonLesson(startTime: string): boolean {
  return startTime >= "13:00";
}

export function lessonBand(startTime: string): "mattina" | "pomeriggio" {
  return isMorningLesson(startTime) ? "mattina" : "pomeriggio";
}

export function commitmentBlocksLesson(
  commitment: TeacherCommitment,
  lesson: Pick<Lesson, "date" | "startTime">
): boolean {
  if (commitment.date !== lesson.date) return false;
  if (commitment.band === "giornata") return true;
  return commitment.band === lessonBand(lesson.startTime);
}

export function commitmentBlocksBand(
  commitments: TeacherCommitment[],
  date: string,
  band: TeacherCommitmentBand
): boolean {
  return commitments.some((c) => {
    if (c.date !== date) return false;
    if (c.band === "giornata") return true;
    if (band === "giornata") return true;
    return c.band === band;
  });
}

export function getLessonProblems(
  lesson: Lesson,
  teacher: Teacher | undefined
): LessonProblem | null {
  if (!teacher || lesson.teacherId !== teacher.id) return null;

  const reasons: string[] = [];
  let severity: "warning" | "critical" = "warning";

  if (lesson.needsReschedule) {
    reasons.push(
      lesson.rescheduleNote?.trim()
        ? `Da spostare: ${lesson.rescheduleNote.trim()}`
        : "Segnalata dal docente come da spostare"
    );
    severity = "critical";
  }

  if (teacherExcludedDates(teacher).includes(lesson.date)) {
    reasons.push("Lezione in una data esclusa");
    severity = "critical";
  }

  const avail = teacherAvailability(teacher);
  const band = lessonBand(lesson.startTime);
  if (band === "mattina" && !avail.morning) {
    reasons.push("Fuori disponibilità mattina");
    severity = "critical";
  }
  if (band === "pomeriggio" && !avail.afternoon) {
    reasons.push("Fuori disponibilità pomeriggio");
    severity = "critical";
  }

  for (const commitment of teacherCommitments(teacher)) {
    if (commitmentBlocksLesson(commitment, lesson)) {
      reasons.push(
        `Impegno personale (${COMMITMENT_BAND_LABELS[commitment.band].toLowerCase()})`
      );
      severity = "critical";
      break;
    }
  }

  if (reasons.length === 0) return null;
  return { lessonId: lesson.id, reasons, severity };
}

export function problematicLessonIds(
  lessons: Lesson[],
  teacher: Teacher | undefined
): Set<string> {
  const ids = new Set<string>();
  for (const lesson of lessons) {
    if (getLessonProblems(lesson, teacher)) ids.add(lesson.id);
  }
  return ids;
}

export function commitmentDates(commitments: TeacherCommitment[]): string[] {
  return [...new Set(commitments.map((c) => c.date))].sort();
}

export function rescheduleDates(lessons: Lesson[]): string[] {
  return [...new Set(lessons.filter((l) => l.needsReschedule).map((l) => l.date))].sort();
}

export function countTeacherProblems(
  lessons: Lesson[],
  teacher: Teacher | undefined
): number {
  return problematicLessonIds(lessons, teacher).size;
}

export type TeacherDatePrefs = { preferred: string[]; excluded: string[] };

export function mergedTeacherPlanningPrefs(
  teacher: Teacher | undefined,
  session?: TeacherDatePrefs
): TeacherDatePrefs & {
  persistedPreferred: string[];
  persistedExcluded: string[];
} {
  const persistedPreferred = teacherPreferredDates(teacher);
  const persistedExcluded = teacherExcludedDates(teacher);
  const sessionPreferred = session?.preferred ?? [];
  const sessionExcluded = session?.excluded ?? [];
  return {
    preferred: [...new Set([...persistedPreferred, ...sessionPreferred])].sort(),
    excluded: [...new Set([...persistedExcluded, ...sessionExcluded])].sort(),
    persistedPreferred,
    persistedExcluded,
  };
}

export function isSlotBlockedByTeacherCommitment(
  teacher: Teacher | undefined,
  date: string,
  startTime: string
): boolean {
  return teacherCommitments(teacher).some((c) => commitmentBlocksLesson(c, { date, startTime }));
}

export function isSlotOutsideTeacherAvailability(
  teacher: Teacher | undefined,
  startTime: string
): boolean {
  const avail = teacherAvailability(teacher);
  const band = lessonBand(startTime);
  if (band === "mattina") return !avail.morning;
  return !avail.afternoon;
}

export function getTeacherSlotPlanningBlock(
  teacher: Teacher | undefined,
  date: string,
  startTime: string
): string | null {
  if (!teacher) return null;
  const { excluded } = mergedTeacherPlanningPrefs(teacher);
  if (excluded.includes(date)) return "Data esclusa dal docente";
  if (isSlotBlockedByTeacherCommitment(teacher, date, startTime)) {
    return "Impegno personale del docente in questa fascia";
  }
  if (isSlotOutsideTeacherAvailability(teacher, startTime)) {
    return `Docente non disponibile al ${lessonBand(startTime) === "mattina" ? "mattino" : "pomeriggio"}`;
  }
  return null;
}
