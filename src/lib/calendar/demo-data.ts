import type { CalendarState, Course, Lesson, Modality } from "./types";
import {
  DEMO_STUDENT_ID,
  DEMO_TEACHER_ID,
  generateId,
  getWeekDates,
} from "./types";

const week = getWeekDates(new Date());

export const DEMO_CALENDAR: CalendarState = {
  rooms: [
    { id: "room-1", name: "Aula 1 · Main", capacity: 24 },
    { id: "room-2", name: "Aula 2 · Lab", capacity: 16 },
    { id: "room-3", name: "Aula 3 · Workshop", capacity: 12 },
  ],
  teachers: [
    {
      id: DEMO_TEACHER_ID,
      name: "Marco Bianchi",
      email: "marco.bianchi@centro.it",
      specialty: "HACCP · Igiene alimentare",
    },
    {
      id: "doc-elena",
      name: "Elena Rossi",
      email: "elena.rossi@centro.it",
      specialty: "Sicurezza sul lavoro D.Lgs. 81/08",
    },
    {
      id: "doc-luca",
      name: "Luca Ferri",
      email: "luca.ferri@centro.it",
      specialty: "Formazione antincendio",
    },
  ],
  students: [
    {
      id: DEMO_STUDENT_ID,
      name: "Laura Verdi",
      email: "laura.verdi@email.it",
    },
    { id: "stud-paolo", name: "Paolo Neri", email: "paolo.neri@email.it" },
    { id: "stud-sara", name: "Sara Colombo", email: "sara.colombo@email.it" },
    { id: "stud-matteo", name: "Matteo Greco", email: "matteo.greco@email.it" },
  ],
  courses: [
    {
      id: "course-haccp",
      title: "HACCP Base",
      totalHours: 24,
      teacherId: DEMO_TEACHER_ID,
      studentIds: [DEMO_STUDENT_ID, "stud-paolo", "stud-sara"],
      modality: "ibrida",
      roomId: "room-2",
      color: "#0f8f8a",
      startDate: week[0],
      endDate: week[4],
    },
    {
      id: "course-sicurezza",
      title: "Sicurezza sul Lavoro 81/08",
      totalHours: 16,
      teacherId: "doc-elena",
      studentIds: [DEMO_STUDENT_ID, "stud-matteo"],
      modality: "dad",
      color: "#3b82c4",
      startDate: week[0],
      endDate: week[4],
    },
    {
      id: "course-antincendio",
      title: "Antincendio · Livello 2",
      totalHours: 8,
      teacherId: "doc-luca",
      studentIds: ["stud-paolo", "stud-matteo"],
      modality: "aula",
      roomId: "room-1",
      color: "#d97706",
      startDate: week[1],
      endDate: week[3],
    },
  ],
  lessons: [
    {
      id: "les-1",
      courseId: "course-haccp",
      title: "Modulo 1 · Fondamenti HACCP",
      date: week[0],
      startTime: "09:30",
      endTime: "12:30",
      modality: "aula",
      roomId: "room-2",
      teacherId: DEMO_TEACHER_ID,
    },
    {
      id: "les-2",
      courseId: "course-haccp",
      title: "Modulo 2 · Autocontrollo",
      date: week[1],
      startTime: "09:30",
      endTime: "12:30",
      modality: "ibrida",
      roomId: "room-2",
      teacherId: DEMO_TEACHER_ID,
      dadLink: "https://meet.aulanova.it/haccp-mod2",
    },
    {
      id: "les-3",
      courseId: "course-haccp",
      title: "Modulo 3 · Tamponi e campionamenti",
      date: week[2],
      startTime: "14:00",
      endTime: "17:00",
      modality: "aula",
      roomId: "room-2",
      teacherId: DEMO_TEACHER_ID,
    },
    {
      id: "les-4",
      courseId: "course-haccp",
      title: "Modulo 4 · Contaminazioni",
      date: week[3],
      startTime: "10:00",
      endTime: "13:00",
      modality: "dad",
      teacherId: DEMO_TEACHER_ID,
      dadLink: "https://meet.aulanova.it/haccp-mod4",
    },
    {
      id: "les-5",
      courseId: "course-sicurezza",
      title: "DVR e valutazione rischi",
      date: week[0],
      startTime: "14:00",
      endTime: "17:00",
      modality: "dad",
      teacherId: "doc-elena",
      dadLink: "https://meet.aulanova.it/sicurezza-dvr",
    },
    {
      id: "les-6",
      courseId: "course-sicurezza",
      title: "DPI e segnaletica",
      date: week[2],
      startTime: "09:00",
      endTime: "12:00",
      modality: "dad",
      teacherId: "doc-elena",
      dadLink: "https://meet.aulanova.it/sicurezza-dpi",
    },
    {
      id: "les-7",
      courseId: "course-antincendio",
      title: "Teoria antincendio",
      date: week[1],
      startTime: "15:00",
      endTime: "18:00",
      modality: "aula",
      roomId: "room-1",
      teacherId: "doc-luca",
    },
    {
      id: "les-8",
      courseId: "course-haccp",
      title: "Expert call · Gruppo A",
      date: week[4],
      startTime: "17:30",
      endTime: "18:30",
      modality: "dad",
      teacherId: DEMO_TEACHER_ID,
      dadLink: "https://meet.aulanova.it/haccp-expert-a",
    },
  ],
};

export function buildCourseLessons(
  course: Course,
  pattern: { weekdayIndex: number; startTime: string; endTime: string; titlePrefix: string }[],
  modalityOverride?: Modality
): Lesson[] {
  const weekDates = getWeekDates(new Date(course.startDate + "T12:00:00"));
  return pattern.map((slot, index) => ({
    id: generateId("les"),
    courseId: course.id,
    title: `${slot.titlePrefix} ${index + 1}`,
    date: weekDates[slot.weekdayIndex] ?? weekDates[0],
    startTime: slot.startTime,
    endTime: slot.endTime,
    modality: modalityOverride ?? course.modality,
    roomId: course.roomId,
    teacherId: course.teacherId,
    dadLink:
      (modalityOverride ?? course.modality) !== "aula"
        ? `https://meet.aulanova.it/${course.id}-${index + 1}`
        : undefined,
  }));
}

export function scheduledHoursForCourse(lessons: Lesson[], courseId: string): number {
  return lessons
    .filter((l) => l.courseId === courseId)
    .reduce((sum, l) => {
      const [sh, sm] = l.startTime.split(":").map(Number);
      const [eh, em] = l.endTime.split(":").map(Number);
      return sum + (eh * 60 + em - (sh * 60 + sm)) / 60;
    }, 0);
}
