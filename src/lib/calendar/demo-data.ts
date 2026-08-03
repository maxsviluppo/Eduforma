import type { CalendarState, Course, Lesson, Modality } from "./types";
import {
  DEMO_SCHOOL_ID,
  DEMO_STUDENT_ID,
  DEMO_TEACHER_ID,
  generateId,
  getWeekDates,
  toIsoDate,
} from "./types";

/** Anchor demo week to a stable reference around "today" */
function demoWeek(): string[] {
  return getWeekDates(new Date());
}

export function createDemoCalendar(): CalendarState {
  const week = demoWeek();
  return {
    schools: [
      {
        id: DEMO_SCHOOL_ID,
        name: "Centro Formazione AulaNova Napoli",
        address: "Via Luigi La Vista, 5",
        city: "Napoli",
        province: "NA",
        zip: "80122",
        phone: "+39 081 0608910",
        email: "segreteria@aulanova.it",
        vat: "IT12345678901",
        roomsCount: 3,
        notes: "Sede principale · formazione professionale e sicurezza",
      },
    ],
    rooms: [
      { id: "room-1", name: "Aula 1 · Main", capacity: 24, schoolId: DEMO_SCHOOL_ID },
      { id: "room-2", name: "Aula 2 · Lab", capacity: 16, schoolId: DEMO_SCHOOL_ID },
      { id: "room-3", name: "Aula 3 · Workshop", capacity: 12, schoolId: DEMO_SCHOOL_ID },
    ],
    teachers: [
      {
        id: DEMO_TEACHER_ID,
        name: "Marco Bianchi",
        email: "marco.bianchi@centro.it",
        phone: "+39 333 1002003",
        specialty: "HACCP · Igiene alimentare",
        schoolId: DEMO_SCHOOL_ID,
        bio: "Docente senior HACCP, 12 anni di esperienza in formazione OSA.",
        active: true,
      },
      {
        id: "doc-elena",
        name: "Elena Rossi",
        email: "elena.rossi@centro.it",
        phone: "+39 333 4005006",
        specialty: "Sicurezza sul lavoro D.Lgs. 81/08",
        schoolId: DEMO_SCHOOL_ID,
        bio: "RSPP e formatrice sicurezza sul lavoro.",
        active: true,
      },
      {
        id: "doc-luca",
        name: "Luca Ferri",
        email: "luca.ferri@centro.it",
        phone: "+39 333 7008009",
        specialty: "Formazione antincendio",
        schoolId: DEMO_SCHOOL_ID,
        bio: "Istruttore antincendio livello 2.",
        active: true,
      },
    ],
    students: [
      { id: DEMO_STUDENT_ID, name: "Laura Verdi", email: "laura.verdi@email.it" },
      { id: "stud-paolo", name: "Paolo Neri", email: "paolo.neri@email.it" },
      { id: "stud-sara", name: "Sara Colombo", email: "sara.colombo@email.it" },
      { id: "stud-matteo", name: "Matteo Greco", email: "matteo.greco@email.it" },
    ],
    courses: [
      {
        id: "course-haccp",
        title: "HACCP Base",
        description: "Corso di igiene alimentare e autocontrollo per operatori del settore.",
        totalHours: 24,
        daysCount: 4,
        teacherId: DEMO_TEACHER_ID,
        studentIds: [DEMO_STUDENT_ID, "stud-paolo", "stud-sara"],
        modality: "ibrida",
        roomId: "room-2",
        schoolId: DEMO_SCHOOL_ID,
        color: "#0f8f8a",
        status: "attivo",
        startDate: week[0],
        endDate: week[4],
        preferredDates: [week[0], week[1], week[3]],
        excludedDates: [week[2]],
      },
      {
        id: "course-sicurezza",
        title: "Sicurezza sul Lavoro 81/08",
        description: "Formazione generale e specifica sulla sicurezza nei luoghi di lavoro.",
        totalHours: 16,
        daysCount: 2,
        teacherId: "doc-elena",
        studentIds: [DEMO_STUDENT_ID, "stud-matteo"],
        modality: "dad",
        schoolId: DEMO_SCHOOL_ID,
        color: "#3b82c4",
        status: "attivo",
        startDate: week[0],
        endDate: week[4],
      },
      {
        id: "course-antincendio",
        title: "Antincendio · Livello 2",
        description: "Corso teorico-pratico per addetti antincendio livello 2.",
        totalHours: 8,
        daysCount: 1,
        teacherId: "doc-luca",
        studentIds: ["stud-paolo", "stud-matteo"],
        modality: "aula",
        roomId: "room-1",
        schoolId: DEMO_SCHOOL_ID,
        color: "#d97706",
        status: "bozza",
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
}

export const DEMO_CALENDAR = createDemoCalendar();

export function buildCourseLessons(
  course: Course,
  pattern: {
    weekdayIndex: number;
    startTime: string;
    endTime: string;
    titlePrefix: string;
  }[],
  modalityOverride?: Modality
): Lesson[] {
  const weekDates = getWeekDates(new Date(course.startDate + "T12:00:00"));
  return pattern.map((slot, index) => {
    const modality = modalityOverride ?? course.modality;
    return {
      id: generateId("les"),
      courseId: course.id,
      title: `${slot.titlePrefix} ${index + 1}`,
      date: weekDates[slot.weekdayIndex] ?? weekDates[0],
      startTime: slot.startTime,
      endTime: slot.endTime,
      modality,
      roomId: modality === "dad" ? undefined : course.roomId,
      teacherId: course.teacherId,
      dadLink:
        modality !== "aula"
          ? `https://meet.aulanova.it/${course.id}-${index + 1}`
          : undefined,
    };
  });
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

/** Re-anchor demo dates to current week (for reset) */
export function freshDemoCalendar(): CalendarState {
  return createDemoCalendar();
}
