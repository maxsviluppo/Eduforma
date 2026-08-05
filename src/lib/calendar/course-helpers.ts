import type { Course, CourseCategory, Lesson } from "./types";

const CATEGORY_GRADIENT: Record<CourseCategory, string> = {
  sicurezza: "linear-gradient(135deg, #fb7185 0%, #f97316 100%)",
  haccp: "linear-gradient(135deg, #34d399 0%, #0f8f8a 100%)",
  lingua: "linear-gradient(135deg, #60a5fa 0%, #6366f1 100%)",
  informatica: "linear-gradient(135deg, #38bdf8 0%, #3b82c4 100%)",
  "soft-skill": "linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)",
  tecnico: "linear-gradient(135deg, #0f8f8a 0%, #0a6f6b 100%)",
  altro: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
};

export function categoryGradient(category: CourseCategory): string {
  return CATEGORY_GRADIENT[category];
}

export function excerpt(text: string, max = 160): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "Nessuna descrizione ancora.";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

export function courseStats(course: Course, lessons: Lesson[]) {
  const courseLessons = lessons.filter((l) => l.courseId === course.id);
  const scheduledHours = courseLessons.reduce((total, lesson) => {
    const [sh, sm] = lesson.startTime.split(":").map(Number);
    const [eh, em] = lesson.endTime.split(":").map(Number);
    return total + (eh * 60 + em - (sh * 60 + sm)) / 60;
  }, 0);

  return {
    lessons: courseLessons.length,
    scheduledHours: Math.round(scheduledHours * 10) / 10,
    students: course.studentCount,
  };
}

export function formatCourseDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  if (start === end) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}
