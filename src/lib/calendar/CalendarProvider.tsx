"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEMO_CALENDAR,
  freshDemoCalendar,
  scheduledHoursForCourse,
} from "./demo-data";
import type {
  CalendarDayNote,
  CalendarState,
  Course,
  CourseCategory,
  CourseStatus,
  Lesson,
  Modality,
  Room,
  School,
  Student,
  Teacher,
  TeacherAvailability,
  TeacherCommitmentBand,
} from "./types";
import {
  COURSE_COLORS,
  DEMO_SCHOOL_ID,
  DEMO_STUDENT_ID,
  DEMO_TEACHER_ID,
  addHoursToTime,
  collectLessonDates,
  courseTeacherIds,
  findOverlapsForDraft,
  findTeacherOverlaps,
  generateId,
  getWeekDates,
  toIsoDate,
  type TeacherOverlap,
  POST_IT_COLORS,
} from "./types";
import { DEFAULT_TEACHER_AVAILABILITY } from "./teacher-availability";

const STORAGE_KEY = "aulanova-calendar-v4";
const SESSION_KEY = "aulanova-session-v1";

export type NewCourseInput = {
  title: string;
  description: string;
  category?: CourseCategory;
  totalHours: number;
  daysCount: number;
  teacherId: string;
  teacherIds?: string[];
  studentIds: string[];
  studentCount?: number;
  modality: Modality;
  roomId?: string;
  schoolId: string;
  sessionsCount: number;
  color?: string;
  /** Hourly band for generated lessons */
  band?: "mattina" | "pomeriggio";
  /** Explicit start/end, overrides band defaults */
  startTime?: string;
  endTime?: string;
  /** Weekday indexes Mon=0..Sun=6 used for frequency */
  weekdays?: number[];
  /** First lesson date YYYY-MM-DD */
  startDate?: string;
  hoursPerLesson?: number;
  /** Date e orari impostati manualmente (salta la generazione automatica) */
  manualLessons?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    modality?: Modality;
    roomId?: string;
    teacherId?: string;
  }>;
  preferredDates?: string[];
  excludedDates?: string[];
};

export type LessonDraft = Omit<Lesson, "id"> & { id?: string };

export type ImportPreview = {
  schools: School[];
  teachers: Teacher[];
  courses: Course[];
  lessons: Lesson[];
  rooms: Room[];
  students: Student[];
  warnings: string[];
};

type SessionState = {
  teacherId: string;
  studentId: string;
};

type CalendarContextValue = {
  state: CalendarState;
  weekDates: string[];
  overlaps: TeacherOverlap[];
  demoTeacherId: string;
  demoStudentId: string;
  demoSchoolId: string;
  /** Docente attualmente loggato (demo session) */
  currentTeacherId: string;
  currentStudentId: string;
  setCurrentTeacherId: (id: string) => void;
  setCurrentStudentId: (id: string) => void;
  loginAsTeacherEmail: (email: string) => Teacher | null;
  addTeacher: (data: Omit<Teacher, "id">) => string;
  updateTeacher: (id: string, data: Partial<Teacher>) => void;
  removeTeacher: (id: string) => void;
  addRoom: (name: string, capacity: number, schoolId?: string) => void;
  updateRoom: (id: string, data: Partial<Room>) => void;
  removeRoom: (id: string) => void;
  addStudent: (name: string, email: string) => void;
  updateSchool: (id: string, data: Partial<School>) => void;
  addSchool: (data: Omit<School, "id">) => string;
  createCourseWithSchedule: (
    input: NewCourseInput
  ) => { overlap: TeacherOverlap | null; courseId: string | null };
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  concludeCourse: (id: string) => void;
  addLesson: (lesson: LessonDraft) => TeacherOverlap | null;
  updateLesson: (id: string, data: Partial<Lesson>) => TeacherOverlap | null;
  deleteLesson: (id: string) => void;
  applyImport: (preview: ImportPreview) => void;
  checkLessonOverlap: (draft: LessonDraft) => TeacherOverlap | null;
  resetDemo: () => void;
  getTeacher: (id: string) => Teacher | undefined;
  getRoom: (id: string) => Room | undefined;
  getCourse: (id: string) => Course | undefined;
  getSchool: (id: string) => School | undefined;
  getLessonsForTeacher: (teacherId: string, dates?: string[]) => Lesson[];
  getLessonsForStudent: (studentId: string, dates?: string[]) => Lesson[];
  getLessonsForDate: (date: string) => Lesson[];
  getLessonsForCourse: (courseId: string) => Lesson[];
  getCoursesForStudent: (studentId: string) => Course[];
  getCoursesForTeacher: (teacherId: string) => Course[];
  getCourseProgress: (courseId: string) => number;
  getDayNotes: (date: string) => CalendarDayNote[];
  addDayNote: (date: string, text: string) => string;
  updateDayNote: (id: string, text: string) => void;
  deleteDayNote: (id: string) => void;
  toggleTeacherPreferredDate: (teacherId: string, date: string) => void;
  toggleTeacherExcludedDate: (teacherId: string, date: string) => void;
  setTeacherAvailability: (teacherId: string, availability: TeacherAvailability) => void;
  toggleTeacherCommitment: (
    teacherId: string,
    date: string,
    band: TeacherCommitmentBand
  ) => void;
  removeTeacherCommitment: (teacherId: string, commitmentId: string) => void;
  requestLessonReschedule: (lessonId: string, note?: string) => void;
  clearLessonReschedule: (lessonId: string) => void;
  hydrated: boolean;
};

const CalendarContext = createContext<CalendarContextValue | null>(null);

function sortLessons(a: Lesson, b: Lesson) {
  return a.date === b.date
    ? a.startTime.localeCompare(b.startTime)
    : a.date.localeCompare(b.date);
}

function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map(existing.map((item) => [item.id, item]));
  for (const item of incoming) {
    const prev = map.get(item.id);
    map.set(item.id, prev ? { ...prev, ...item } : item);
  }
  return Array.from(map.values());
}

function normalizeState(parsed: CalendarState): CalendarState {
  return {
    ...parsed,
    dayNotes: parsed.dayNotes ?? [],
    courses: (parsed.courses ?? []).map((c) => ({
      ...c,
      category: c.category ?? "altro",
      studentCount: c.studentCount ?? c.studentIds?.length ?? 0,
    })),
    lessons: (parsed.lessons ?? []).map((lesson) => ({ ...lesson })),
    teachers: parsed.teachers.map((teacher) => {
      const legacy = teacher as Teacher & { busyDates?: string[] };
      const { busyDates, ...rest } = legacy;
      const commitments = [...(rest.commitments ?? [])];
      if (busyDates?.length) {
        for (const date of busyDates) {
          if (!commitments.some((c) => c.date === date && c.band === "giornata")) {
            commitments.push({
              id: generateId("commit"),
              teacherId: rest.id,
              date,
              band: "giornata",
            });
          }
        }
      }
      return {
        ...rest,
        preferredDates: rest.preferredDates ?? [],
        excludedDates: rest.excludedDates ?? [],
        availability: rest.availability ?? DEFAULT_TEACHER_AVAILABILITY,
        commitments,
      };
    }),
  };
}

function loadState(): CalendarState {
  if (typeof window === "undefined") return DEMO_CALENDAR;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEMO_CALENDAR;
    const parsed = JSON.parse(raw) as CalendarState;
    if (!parsed.schools?.length) return freshDemoCalendar();
    return normalizeState(parsed);
  } catch {
    return DEMO_CALENDAR;
  }
}

function loadSession(): SessionState {
  if (typeof window === "undefined") {
    return { teacherId: DEMO_TEACHER_ID, studentId: DEMO_STUDENT_ID };
  }
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { teacherId: DEMO_TEACHER_ID, studentId: DEMO_STUDENT_ID };
    return JSON.parse(raw) as SessionState;
  } catch {
    return { teacherId: DEMO_TEACHER_ID, studentId: DEMO_STUDENT_ID };
  }
}

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CalendarState>(DEMO_CALENDAR);
  const [session, setSession] = useState<SessionState>({
    teacherId: DEMO_TEACHER_ID,
    studentId: DEMO_STUDENT_ID,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setSession(loadSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [session, hydrated]);

  const weekDates = useMemo(() => getWeekDates(), []);

  const overlaps = useMemo(
    () => findTeacherOverlaps(state.lessons, state.teachers),
    [state.lessons, state.teachers]
  );

  const setCurrentTeacherId = useCallback((id: string) => {
    setSession((prev) => ({ ...prev, teacherId: id }));
  }, []);

  const setCurrentStudentId = useCallback((id: string) => {
    setSession((prev) => ({ ...prev, studentId: id }));
  }, []);

  const loginAsTeacherEmail = useCallback(
    (email: string): Teacher | null => {
      const normalized = email.trim().toLowerCase();
      const teacher =
        state.teachers.find((t) => t.email.toLowerCase() === normalized) ?? null;
      if (teacher) setSession((prev) => ({ ...prev, teacherId: teacher.id }));
      return teacher;
    },
    [state.teachers]
  );

  const addTeacher = useCallback((data: Omit<Teacher, "id">) => {
    const id = generateId("doc");
    setState((prev) => ({
      ...prev,
      teachers: [
        ...prev.teachers,
        {
          ...data,
          id,
          active: data.active !== false,
          schoolId: data.schoolId ?? prev.schools[0]?.id ?? DEMO_SCHOOL_ID,
        },
      ],
    }));
    return id;
  }, []);

  const updateTeacher = useCallback((id: string, data: Partial<Teacher>) => {
    setState((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));
  }, []);

  const removeTeacher = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((t) => t.id !== id),
    }));
  }, []);

  const addRoom = useCallback((name: string, capacity: number, schoolId?: string) => {
    setState((prev) => {
      const sid = schoolId ?? prev.schools[0]?.id ?? DEMO_SCHOOL_ID;
      const rooms = [
        ...prev.rooms,
        { id: generateId("room"), name, capacity, schoolId: sid },
      ];
      return {
        ...prev,
        rooms,
        schools: prev.schools.map((s) =>
          s.id === sid ? { ...s, roomsCount: rooms.filter((r) => r.schoolId === sid).length } : s
        ),
      };
    });
  }, []);

  const updateRoom = useCallback((id: string, data: Partial<Room>) => {
    setState((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }));
  }, []);

  const removeRoom = useCallback((id: string) => {
    setState((prev) => {
      const room = prev.rooms.find((r) => r.id === id);
      const rooms = prev.rooms.filter((r) => r.id !== id);
      return {
        ...prev,
        rooms,
        schools: room
          ? prev.schools.map((s) =>
              s.id === room.schoolId
                ? { ...s, roomsCount: rooms.filter((r) => r.schoolId === s.id).length }
                : s
            )
          : prev.schools,
      };
    });
  }, []);

  const addStudent = useCallback((name: string, email: string) => {
    setState((prev) => ({
      ...prev,
      students: [...prev.students, { id: generateId("stud"), name, email }],
    }));
  }, []);

  const updateSchool = useCallback((id: string, data: Partial<School>) => {
    setState((prev) => ({
      ...prev,
      schools: prev.schools.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
  }, []);

  const addSchool = useCallback((data: Omit<School, "id">) => {
    const id = generateId("school");
    setState((prev) => ({
      ...prev,
      schools: [...prev.schools, { ...data, id }],
    }));
    return id;
  }, []);

  const checkLessonOverlap = useCallback(
    (draft: LessonDraft): TeacherOverlap | null =>
      findOverlapsForDraft(state.lessons, state.teachers, draft, draft.id),
    [state.lessons, state.teachers]
  );

  const createCourseWithSchedule = useCallback(
    (input: NewCourseInput): { overlap: TeacherOverlap | null; courseId: string | null } => {
    let overlap: TeacherOverlap | null = null;
    let createdCourseId: string | null = null;

    setState((prev) => {
      const normalizedTitle = input.title.trim().toLocaleLowerCase("it-IT");
      if (
        prev.courses.some(
          (course) => course.title.trim().toLocaleLowerCase("it-IT") === normalizedTitle
        )
      ) {
        return prev;
      }

      const manualLessons = input.manualLessons?.filter((l) => l.date) ?? [];
      const sessions = Math.max(1, manualLessons.length || input.sessionsCount);
      const hoursPerLesson =
        input.hoursPerLesson ??
        Math.round((input.totalHours / sessions) * 100) / 100;
      const band = input.band ?? "mattina";
      const startTime =
        input.startTime ?? (band === "mattina" ? "09:00" : "14:00");
      const endTime =
        input.endTime ?? addHoursToTime(startTime, hoursPerLesson);
      const weekdays = input.weekdays?.length ? input.weekdays : [0, 1, 2, 3, 4];
      const startDate =
        manualLessons[0]?.date ?? input.startDate ?? toIsoDate(new Date());
      const dates = manualLessons.length
        ? manualLessons.map((l) => l.date)
        : collectLessonDates(startDate, sessions, weekdays);
      const color =
        input.color || COURSE_COLORS[prev.courses.length % COURSE_COLORS.length];
      const endDate = dates[dates.length - 1] ?? startDate;

      const courseTeacherIds =
        input.teacherIds?.filter(Boolean) ??
        (input.teacherId ? [input.teacherId] : []);

      const course: Course = {
        id: generateId("course"),
        title: input.title,
        description: input.description,
        category: input.category ?? "tecnico",
        totalHours: input.totalHours,
        daysCount: input.daysCount || sessions,
        teacherId: courseTeacherIds[0] ?? input.teacherId,
        teacherIds: courseTeacherIds.length > 1 ? courseTeacherIds : undefined,
        studentIds: input.studentIds,
        studentCount: input.studentCount ?? input.studentIds.length,
        modality: input.modality,
        roomId: input.roomId,
        schoolId: input.schoolId || prev.schools[0]?.id || DEMO_SCHOOL_ID,
        color,
        status: "bozza",
        startDate,
        endDate,
        preferredDates: input.preferredDates?.filter(Boolean),
        excludedDates: input.excludedDates?.filter(Boolean),
      };

      let lessons: Lesson[] = manualLessons.length
        ? manualLessons.map((slot, index) => {
            const lessonModality = slot.modality ?? input.modality;
            const lessonRoomId =
              lessonModality === "dad"
                ? undefined
                : slot.roomId ?? input.roomId;
            return {
              id: generateId("les"),
              courseId: course.id,
              title: `Lezione ${index + 1}`,
              date: slot.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              modality: lessonModality,
              roomId: lessonRoomId,
              teacherId: slot.teacherId ?? input.teacherId,
              dadLink:
                lessonModality !== "aula"
                  ? `https://meet.aulanova.it/${course.id}-${index + 1}`
                  : undefined,
            };
          })
        : dates.map((date, index) => ({
            id: generateId("les"),
            courseId: course.id,
            title: `Lezione ${index + 1}`,
            date,
            startTime,
            endTime,
            modality: input.modality,
            roomId: input.modality === "dad" ? undefined : input.roomId,
            teacherId: input.teacherIds?.[0] ?? input.teacherId,
            dadLink:
              input.modality !== "aula"
                ? `https://meet.aulanova.it/${course.id}-${index + 1}`
                : undefined,
          }));

      for (const lesson of lessons) {
        const others = lessons.filter((x) => x.id !== lesson.id);
        const o = findOverlapsForDraft([...prev.lessons, ...others], prev.teachers, lesson);
        if (o) {
          overlap = o;
          break;
        }
      }

      createdCourseId = course.id;

      return {
        ...prev,
        courses: [...prev.courses, course],
        lessons: [...prev.lessons, ...lessons],
      };
    });

    return { overlap, courseId: createdCourseId };
  }, []);

  const updateCourse = useCallback((id: string, data: Partial<Course>) => {
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  }, []);

  const deleteCourse = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      courses: prev.courses.filter((c) => c.id !== id),
      lessons: prev.lessons.filter((l) => l.courseId !== id),
    }));
  }, []);

  const concludeCourse = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) =>
        c.id === id ? { ...c, status: "concluso" as CourseStatus } : c
      ),
    }));
  }, []);

  const addLesson = useCallback(
    (lesson: LessonDraft): TeacherOverlap | null => {
      const overlap = findOverlapsForDraft(state.lessons, state.teachers, lesson);
      setState((prev) => ({
        ...prev,
        lessons: [...prev.lessons, { ...lesson, id: generateId("les") }],
      }));
      return overlap;
    },
    [state.lessons, state.teachers]
  );

  const updateLesson = useCallback(
    (id: string, data: Partial<Lesson>): TeacherOverlap | null => {
      const current = state.lessons.find((l) => l.id === id);
      if (!current) return null;
      const draft = { ...current, ...data };
      const overlap = findOverlapsForDraft(state.lessons, state.teachers, draft, id);
      setState((prev) => {
        let courses = prev.courses;
        if (data.teacherId && data.teacherId !== current.teacherId) {
          courses = prev.courses.map((c) => {
            if (c.id !== current.courseId) return c;
            const ids = courseTeacherIds(c);
            if (ids.includes(data.teacherId!)) return c;
            const nextIds = [...ids, data.teacherId!];
            return {
              ...c,
              teacherIds: nextIds,
              teacherId: c.teacherId || data.teacherId!,
            };
          });
        }
        return {
          ...prev,
          courses,
          lessons: prev.lessons.map((l) => (l.id === id ? { ...l, ...data } : l)),
        };
      });
      return overlap;
    },
    [state.lessons, state.teachers]
  );

  const deleteLesson = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      lessons: prev.lessons.filter((l) => l.id !== id),
    }));
  }, []);

  const applyImport = useCallback((preview: ImportPreview) => {
    setState((prev) => ({
      ...prev,
      schools: mergeById(prev.schools, preview.schools),
      teachers: mergeById(prev.teachers, preview.teachers),
      rooms: mergeById(prev.rooms, preview.rooms),
      students: mergeById(prev.students, preview.students),
      courses: mergeById(prev.courses, preview.courses),
      lessons: mergeById(prev.lessons, preview.lessons),
    }));
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = freshDemoCalendar();
    setState(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }, []);

  const getTeacher = useCallback(
    (id: string) => state.teachers.find((t) => t.id === id),
    [state.teachers]
  );
  const getRoom = useCallback(
    (id: string) => state.rooms.find((r) => r.id === id),
    [state.rooms]
  );
  const getCourse = useCallback(
    (id: string) => state.courses.find((c) => c.id === id),
    [state.courses]
  );
  const getSchool = useCallback(
    (id: string) => state.schools.find((s) => s.id === id),
    [state.schools]
  );

  const getLessonsForTeacher = useCallback(
    (teacherId: string, dates?: string[]) =>
      state.lessons
        .filter((l) => l.teacherId === teacherId && (!dates || dates.includes(l.date)))
        .sort(sortLessons),
    [state.lessons]
  );

  const getLessonsForStudent = useCallback(
    (studentId: string, dates?: string[]) => {
      const courseIds = new Set(
        state.courses.filter((c) => c.studentIds.includes(studentId)).map((c) => c.id)
      );
      return state.lessons
        .filter((l) => courseIds.has(l.courseId) && (!dates || dates.includes(l.date)))
        .sort(sortLessons);
    },
    [state.courses, state.lessons]
  );

  const getLessonsForDate = useCallback(
    (date: string) => state.lessons.filter((l) => l.date === date).sort(sortLessons),
    [state.lessons]
  );

  const getLessonsForCourse = useCallback(
    (courseId: string) =>
      state.lessons.filter((l) => l.courseId === courseId).sort(sortLessons),
    [state.lessons]
  );

  const getCoursesForStudent = useCallback(
    (studentId: string) => state.courses.filter((c) => c.studentIds.includes(studentId)),
    [state.courses]
  );

  const getCoursesForTeacher = useCallback(
    (teacherId: string) =>
      state.courses.filter(
        (c) => c.teacherId === teacherId || c.teacherIds?.includes(teacherId)
      ),
    [state.courses]
  );

  const getCourseProgress = useCallback(
    (courseId: string) => {
      const course = state.courses.find((c) => c.id === courseId);
      if (!course) return 0;
      const scheduled = scheduledHoursForCourse(state.lessons, courseId);
      return Math.min(100, Math.round((scheduled / Math.max(course.totalHours, 1)) * 100));
    },
    [state.courses, state.lessons]
  );

  const getDayNotes = useCallback(
    (date: string) =>
      state.dayNotes
        .filter((n) => n.date === date)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [state.dayNotes]
  );

  const addDayNote = useCallback((date: string, text: string) => {
    const id = generateId("note");
    const now = new Date().toISOString();
    const color =
      POST_IT_COLORS[Math.floor(Math.random() * POST_IT_COLORS.length)];
    setState((prev) => ({
      ...prev,
      dayNotes: [
        ...prev.dayNotes,
        { id, date, text: text.trim(), color, createdAt: now, updatedAt: now },
      ],
    }));
    return id;
  }, []);

  const updateDayNote = useCallback((id: string, text: string) => {
    setState((prev) => ({
      ...prev,
      dayNotes: prev.dayNotes.map((n) =>
        n.id === id
          ? { ...n, text: text.trim(), updatedAt: new Date().toISOString() }
          : n
      ),
    }));
  }, []);

  const deleteDayNote = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      dayNotes: prev.dayNotes.filter((n) => n.id !== id),
    }));
  }, []);

  const toggleTeacherPreferredDate = useCallback((teacherId: string, date: string) => {
    setState((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => {
        if (t.id !== teacherId) return t;
        const preferred = t.preferredDates ?? [];
        const excluded = t.excludedDates ?? [];
        const has = preferred.includes(date);
        return {
          ...t,
          preferredDates: has
            ? preferred.filter((d) => d !== date)
            : [...preferred, date].sort(),
          excludedDates: excluded.filter((d) => d !== date),
        };
      }),
    }));
  }, []);

  const toggleTeacherExcludedDate = useCallback((teacherId: string, date: string) => {
    setState((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => {
        if (t.id !== teacherId) return t;
        const preferred = t.preferredDates ?? [];
        const excluded = t.excludedDates ?? [];
        const has = excluded.includes(date);
        return {
          ...t,
          excludedDates: has
            ? excluded.filter((d) => d !== date)
            : [...excluded, date].sort(),
          preferredDates: preferred.filter((d) => d !== date),
        };
      }),
    }));
  }, []);

  const setTeacherAvailability = useCallback(
    (teacherId: string, availability: TeacherAvailability) => {
      setState((prev) => ({
        ...prev,
        teachers: prev.teachers.map((t) =>
          t.id === teacherId ? { ...t, availability } : t
        ),
      }));
    },
    []
  );

  const toggleTeacherCommitment = useCallback(
    (teacherId: string, date: string, band: TeacherCommitmentBand) => {
      setState((prev) => ({
        ...prev,
        teachers: prev.teachers.map((t) => {
          if (t.id !== teacherId) return t;
          const commitments = t.commitments ?? [];
          const existing = commitments.find((c) => c.date === date && c.band === band);
          if (existing) {
            return {
              ...t,
              commitments: commitments.filter((c) => c.id !== existing.id),
            };
          }
          return {
            ...t,
            commitments: [
              ...commitments,
              { id: generateId("commit"), teacherId, date, band },
            ].sort((a, b) => a.date.localeCompare(b.date)),
          };
        }),
      }));
    },
    []
  );

  const removeTeacherCommitment = useCallback((teacherId: string, commitmentId: string) => {
    setState((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) =>
        t.id === teacherId
          ? {
              ...t,
              commitments: (t.commitments ?? []).filter((c) => c.id !== commitmentId),
            }
          : t
      ),
    }));
  }, []);

  const requestLessonReschedule = useCallback((lessonId: string, note?: string) => {
    setState((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) =>
        l.id === lessonId
          ? {
              ...l,
              needsReschedule: true,
              rescheduleNote: note?.trim() || l.rescheduleNote,
            }
          : l
      ),
    }));
  }, []);

  const clearLessonReschedule = useCallback((lessonId: string) => {
    setState((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) =>
        l.id === lessonId
          ? { ...l, needsReschedule: false, rescheduleNote: undefined }
          : l
      ),
    }));
  }, []);

  const value: CalendarContextValue = {
    state,
    weekDates,
    overlaps,
    demoTeacherId: DEMO_TEACHER_ID,
    demoStudentId: DEMO_STUDENT_ID,
    demoSchoolId: DEMO_SCHOOL_ID,
    currentTeacherId: session.teacherId,
    currentStudentId: session.studentId,
    setCurrentTeacherId,
    setCurrentStudentId,
    loginAsTeacherEmail,
    addTeacher,
    updateTeacher,
    removeTeacher,
    addRoom,
    updateRoom,
    removeRoom,
    addStudent,
    updateSchool,
    addSchool,
    createCourseWithSchedule,
    updateCourse,
    deleteCourse,
    concludeCourse,
    addLesson,
    updateLesson,
    deleteLesson,
    applyImport,
    checkLessonOverlap,
    resetDemo,
    getTeacher,
    getRoom,
    getCourse,
    getSchool,
    getLessonsForTeacher,
    getLessonsForStudent,
    getLessonsForDate,
    getLessonsForCourse,
    getCoursesForStudent,
    getCoursesForTeacher,
    getCourseProgress,
    getDayNotes,
    addDayNote,
    updateDayNote,
    deleteDayNote,
    toggleTeacherPreferredDate,
    toggleTeacherExcludedDate,
    setTeacherAvailability,
    toggleTeacherCommitment,
    removeTeacherCommitment,
    requestLessonReschedule,
    clearLessonReschedule,
    hydrated,
  };

  return (
    <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
  );
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
}
