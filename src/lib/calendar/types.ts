export type Modality = "aula" | "dad" | "ibrida";
export type CourseStatus = "bozza" | "attivo" | "concluso";

export type CourseCategory =
  | "sicurezza"
  | "haccp"
  | "lingua"
  | "informatica"
  | "soft-skill"
  | "tecnico"
  | "altro";

export const COURSE_CATEGORY_LABELS: Record<CourseCategory, string> = {
  sicurezza: "Sicurezza sul lavoro",
  haccp: "HACCP / Igiene",
  lingua: "Lingue",
  informatica: "Informatica",
  "soft-skill": "Soft skill",
  tecnico: "Tecnico / Professionale",
  altro: "Altro",
};

export type School = {
  id: string;
  name: string;
  address: string;
  city: string;
  province?: string;
  zip?: string;
  phone?: string;
  email?: string;
  vat?: string;
  roomsCount?: number;
  notes?: string;
};

export type Teacher = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialty: string;
  schoolId?: string;
  bio?: string;
  active?: boolean;
  /** Date preferite dal docente per nuove lezioni */
  preferredDates?: string[];
  /** Date da evitare segnalate dal docente */
  excludedDates?: string[];
  /** Disponibilità generale per fascia oraria */
  availability?: TeacherAvailability;
  /** Impegni personali che bloccano la programmazione */
  commitments?: TeacherCommitment[];
};

export type TeacherAvailability = {
  morning: boolean;
  afternoon: boolean;
};

export type TeacherCommitmentBand = "mattina" | "pomeriggio" | "giornata";

export type TeacherCommitment = {
  id: string;
  teacherId: string;
  date: string;
  band: TeacherCommitmentBand;
};

export type Room = {
  id: string;
  name: string;
  capacity: number;
  schoolId: string;
};

export type Student = {
  id: string;
  name: string;
  email: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  totalHours: number;
  daysCount: number;
  teacherId: string;
  /** Docenti aggiuntivi oltre al referente principale */
  teacherIds?: string[];
  studentIds: string[];
  /** Numero complessivo di alunni iscritti al corso */
  studentCount: number;
  modality: Modality;
  roomId?: string;
  schoolId: string;
  color: string;
  status: CourseStatus;
  startDate: string;
  endDate: string;
  /** Date preferite per la programmazione del corso */
  preferredDates?: string[];
  /** Date da evitare per la programmazione del corso */
  excludedDates?: string[];
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
  notes?: string;
  /** Segnalazione docente: lezione da spostare */
  needsReschedule?: boolean;
  rescheduleNote?: string;
};

export type CalendarDayNote = {
  id: string;
  date: string;
  text: string;
  /** Colore post-it */
  color?: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarState = {
  schools: School[];
  rooms: Room[];
  teachers: Teacher[];
  students: Student[];
  courses: Course[];
  lessons: Lesson[];
  dayNotes: CalendarDayNote[];
};

export type CalendarViewMode = "day" | "week" | "month" | "year" | "tabular";

export const DEMO_TEACHER_ID = "doc-marco";
export const DEMO_STUDENT_ID = "stud-laura";
export const DEMO_SCHOOL_ID = "school-1";

export const MODALITY_LABELS: Record<Modality, string> = {
  aula: "In aula",
  dad: "DAD",
  ibrida: "Ibrida",
};

export function courseTeacherIds(course: Pick<Course, "teacherId" | "teacherIds">): string[] {
  if (course.teacherIds?.length) return course.teacherIds;
  return course.teacherId ? [course.teacherId] : [];
}

export const STATUS_LABELS: Record<CourseStatus, string> = {
  bozza: "Bozza",
  attivo: "Attivo",
  concluso: "Concluso",
};

export const COURSE_COLORS = [
  "#0f8f8a",
  "#3b82c4",
  "#7c5cbf",
  "#d97706",
  "#e11d48",
] as const;

export const COURSE_PRESET_COLORS = [
  "#0f8f8a", // Teal classico
  "#0284c7", // Sky blue
  "#3b82c4", // Ocean blue
  "#6366f1", // Indigo
  "#7c5cbf", // Viola
  "#a855f7", // Porpora
  "#d946ef", // Fuchsia
  "#e11d48", // Rosa corallo
  "#ea580c", // Arancio
  "#d97706", // Ambra
  "#059669", // Smeraldo
  "#0891b2", // Ciano
  "#1e293b", // Slate scuro
] as const;

export const WEEKDAY_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"] as const;

export const MONTH_NAMES = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
] as const;

export function lessonDurationMinutes(lesson: Pick<Lesson, "startTime" | "endTime">): number {
  const [sh, sm] = lesson.startTime.split(":").map(Number);
  const [eh, em] = lesson.endTime.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export function formatTimeRange(lesson: Pick<Lesson, "startTime" | "endTime">): string {
  return `${lesson.startTime} – ${lesson.endTime}`;
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getWeekDates(base = new Date()): string[] {
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + mondayOffset);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toIsoDate(d);
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
  return isoDate === toIsoDate(new Date());
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function timesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export type TeacherOverlap = {
  teacherId: string;
  teacherName: string;
  date: string;
  lessons: Lesson[];
};

export function findTeacherOverlaps(
  lessons: Lesson[],
  teachers: Teacher[],
  ignoreLessonId?: string
): TeacherOverlap[] {
  const byTeacherDate = new Map<string, Lesson[]>();

  for (const lesson of lessons) {
    if (ignoreLessonId && lesson.id === ignoreLessonId) continue;
    const key = `${lesson.teacherId}|${lesson.date}`;
    const list = byTeacherDate.get(key) ?? [];
    list.push(lesson);
    byTeacherDate.set(key, list);
  }

  const overlaps: TeacherOverlap[] = [];

  for (const [key, list] of byTeacherDate) {
    if (list.length < 2) continue;
    const overlapping: Lesson[] = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (
          timesOverlap(
            list[i].startTime,
            list[i].endTime,
            list[j].startTime,
            list[j].endTime
          )
        ) {
          overlapping.push(list[i], list[j]);
        }
      }
    }
    if (overlapping.length === 0) continue;
    const unique = Array.from(new Map(overlapping.map((l) => [l.id, l])).values());
    const [teacherId, date] = key.split("|");
    const teacher = teachers.find((t) => t.id === teacherId);
    overlaps.push({
      teacherId,
      teacherName: teacher?.name ?? teacherId,
      date,
      lessons: unique,
    });
  }

  return overlaps;
}

export function findOverlapsForDraft(
  lessons: Lesson[],
  teachers: Teacher[],
  draft: Pick<Lesson, "teacherId" | "date" | "startTime" | "endTime">,
  ignoreLessonId?: string
): TeacherOverlap | null {
  const teacher = teachers.find((t) => t.id === draft.teacherId);
  const sameDay = lessons.filter(
    (l) =>
      l.teacherId === draft.teacherId &&
      l.date === draft.date &&
      l.id !== ignoreLessonId
  );
  const conflicts = sameDay.filter((l) =>
    timesOverlap(l.startTime, l.endTime, draft.startTime, draft.endTime)
  );
  if (conflicts.length === 0) return null;
  return {
    teacherId: draft.teacherId,
    teacherName: teacher?.name ?? draft.teacherId,
    date: draft.date,
    lessons: conflicts,
  };
}

export function getMonthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let startPad = first.getDay() - 1;
  if (startPad < 0) startPad = 6;

  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push(toIsoDate(new Date(year, month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function isMorningLesson(startTime: string): boolean {
  return startTime < "13:00";
}

export function addHoursToTime(startTime: string, hours: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + Math.round(hours * 60);
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

/** Collect N lesson dates starting from startDate on selected weekdays (0=Mon) */
export function collectLessonDates(
  startDate: string,
  count: number,
  weekdays: number[]
): string[] {
  const allowed = new Set(weekdays.length ? weekdays : [0, 1, 2, 3, 4]);
  const dates: string[] = [];
  const cursor = new Date(startDate + "T12:00:00");
  let guard = 0;
  while (dates.length < count && guard < 400) {
    // JS: Sun=0..Sat=6 → Mon-first index
    const jsDay = cursor.getDay();
    const monFirst = jsDay === 0 ? 6 : jsDay - 1;
    if (allowed.has(monFirst)) {
      dates.push(toIsoDate(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return dates;
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function shiftDay(isoDate: string, delta: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return toIsoDate(d);
}

/** Settimana Lun–Dom contenente la data */
export function getWeekRange(isoDate: string): string[] {
  const d = new Date(`${isoDate}T12:00:00`);
  const jsDay = d.getDay();
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return toIsoDate(day);
  });
}

export function sortLessonsByTime(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort((a, b) =>
    a.date === b.date
      ? a.startTime.localeCompare(b.startTime)
      : a.date.localeCompare(b.date)
  );
}

export const POST_IT_COLORS = [
  "#fef08a",
  "#fde68a",
  "#fed7aa",
  "#bbf7d0",
  "#bae6fd",
  "#fbcfe8",
] as const;
