import type { Course, Lesson, Teacher } from "./types";

const DEFAULT_COURSE_COLOR = "#0f8f8a";

export function courseAbbrev(title: string, max = 4): string {
  const clean = title.trim();
  if (!clean) return "??";
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, max).toUpperCase();
  const fromWords = words
    .slice(0, max)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return fromWords.slice(0, max);
}

export function personAbbrev(name: string, max = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, max).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function lessonCourseColor(
  lesson: Lesson,
  getCourse: (id: string) => Course | undefined
): string {
  return getCourse(lesson.courseId)?.color ?? DEFAULT_COURSE_COLOR;
}

export function schoolAbbrev(name?: string, max = 4): string {
  if (!name || !name.trim()) return "";
  const clean = name.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, max).toUpperCase();
  const stopWords = new Set([
    "di",
    "a",
    "da",
    "in",
    "con",
    "su",
    "per",
    "tra",
    "fra",
    "del",
    "della",
    "delle",
    "dei",
    "degli",
    "il",
    "lo",
    "la",
    "i",
    "gli",
    "le",
    "e",
    "ed",
  ]);
  const significant = words.filter((w) => !stopWords.has(w.toLowerCase()));
  const target = significant.length > 0 ? significant : words;
  return target
    .map((w) => w[0].toUpperCase())
    .slice(0, max)
    .join("");
}

export function lessonChipLabel(
  lesson: Lesson,
  getCourse: (id: string) => Course | undefined,
  getTeacher: (id: string) => Teacher | undefined,
  getSchool?: (id: string) => { name: string } | undefined
): {
  courseSigla: string;
  teacherSigla: string;
  schoolSigla: string;
  studentCount: number;
  time: string;
  title: string;
} {
  const course = getCourse(lesson.courseId);
  const teacher = getTeacher(lesson.teacherId);
  const school = course && getSchool ? getSchool(course.schoolId) : undefined;
  const studentCount = course?.studentCount ?? course?.studentIds?.length ?? 0;
  return {
    courseSigla: courseAbbrev(course?.title ?? lesson.title),
    teacherSigla: personAbbrev(teacher?.name ?? "?"),
    schoolSigla: school ? schoolAbbrev(school.name, 3) : "",
    studentCount,
    time: lesson.startTime,
    title: course?.title ?? lesson.title,
  };
}

export function lessonDetailLine(
  lesson: Lesson,
  getCourse: (id: string) => Course | undefined,
  getTeacher: (id: string) => Teacher | undefined,
  getRoom: (id: string) => { name: string; schoolId: string } | undefined,
  getSchool: (id: string) => { name: string } | undefined
): string {
  const course = getCourse(lesson.courseId);
  const teacher = getTeacher(lesson.teacherId);
  const room = lesson.roomId ? getRoom(lesson.roomId) : undefined;
  const school = room ? getSchool(room.schoolId) : course ? getSchool(course.schoolId) : undefined;
  const parts = [
    `${lesson.startTime}–${lesson.endTime}`,
    course?.title,
    teacher?.name,
    school?.name,
    room?.name,
  ].filter(Boolean);
  return parts.join(" · ");
}

/** Quanti chip mostrare in base alla vista */
export function maxChipsForView(view: "day" | "week" | "month" | "year"): number {
  switch (view) {
    case "day":
      return 99;
    case "week":
      return 8;
    case "month":
      return 4;
    case "year":
      return 0;
    default:
      return 3;
  }
}
