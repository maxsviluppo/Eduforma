export type Modality = "aula" | "dad" | "ibrida";

export type Teacher = {
  id: string;
  name: string;
  email: string;
  specialty: string;
};

export type Room = {
  id: string;
  name: string;
  capacity: number;
};

export type Student = {
  id: string;
  name: string;
  email: string;
};

export type Course = {
  id: string;
  title: string;
  totalHours: number;
  teacherId: string;
  studentIds: string[];
  modality: Modality;
  roomId?: string;
  color: string;
  startDate: string;
  endDate: string;
};

export type Lesson = {
  id: string;
  courseId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  modality: Modality;
  roomId?: string;
  teacherId: string;
  dadLink?: string;
};

export type CalendarState = {
  rooms: Room[];
  teachers: Teacher[];
  students: Student[];
  courses: Course[];
  lessons: Lesson[];
};

export const DEMO_TEACHER_ID = "doc-marco";
export const DEMO_STUDENT_ID = "stud-laura";

export const MODALITY_LABELS: Record<Modality, string> = {
  aula: "In aula",
  dad: "DAD",
  ibrida: "Ibrida",
};

export const COURSE_COLORS = [
  "#0f8f8a",
  "#3b82c4",
  "#7c5cbf",
  "#d97706",
  "#e11d48",
] as const;

export function lessonDurationMinutes(lesson: Lesson): number {
  const [sh, sm] = lesson.startTime.split(":").map(Number);
  const [eh, em] = lesson.endTime.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export function formatTimeRange(lesson: Lesson): string {
  return `${lesson.startTime} – ${lesson.endTime}`;
}

export function getWeekDates(base = new Date()): string[] {
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + mondayOffset);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function formatDayLabel(isoDate: string): { day: string; weekday: string } {
  const d = new Date(isoDate + "T12:00:00");
  return {
    weekday: d.toLocaleDateString("it-IT", { weekday: "short" }),
    day: d.toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
  };
}

export function isToday(isoDate: string): boolean {
  return isoDate === new Date().toISOString().slice(0, 10);
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
