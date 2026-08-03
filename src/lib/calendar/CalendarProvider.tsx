"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEMO_CALENDAR, buildCourseLessons, scheduledHoursForCourse } from "./demo-data";
import type {
  CalendarState,
  Course,
  Lesson,
  Modality,
  Room,
  Student,
  Teacher,
} from "./types";
import {
  COURSE_COLORS,
  DEMO_STUDENT_ID,
  DEMO_TEACHER_ID,
  generateId,
  getWeekDates,
} from "./types";

const STORAGE_KEY = "aulanova-calendar-v1";

type NewCourseInput = {
  title: string;
  totalHours: number;
  teacherId: string;
  studentIds: string[];
  modality: Modality;
  roomId?: string;
  sessionsCount: number;
};

type CalendarContextValue = {
  state: CalendarState;
  weekDates: string[];
  demoTeacherId: string;
  demoStudentId: string;
  addTeacher: (name: string, email: string, specialty: string) => void;
  addRoom: (name: string, capacity: number) => void;
  addStudent: (name: string, email: string) => void;
  createCourseWithSchedule: (input: NewCourseInput) => void;
  addLesson: (lesson: Omit<Lesson, "id">) => void;
  resetDemo: () => void;
  getTeacher: (id: string) => Teacher | undefined;
  getRoom: (id: string) => Room | undefined;
  getCourse: (id: string) => Course | undefined;
  getLessonsForTeacher: (teacherId: string, dates?: string[]) => Lesson[];
  getLessonsForStudent: (studentId: string, dates?: string[]) => Lesson[];
  getCoursesForStudent: (studentId: string) => Course[];
  getCourseProgress: (courseId: string, studentId: string) => number;
};

const CalendarContext = createContext<CalendarContextValue | null>(null);

function loadState(): CalendarState {
  if (typeof window === "undefined") return DEMO_CALENDAR;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEMO_CALENDAR;
    return JSON.parse(raw) as CalendarState;
  } catch {
    return DEMO_CALENDAR;
  }
}

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CalendarState>(DEMO_CALENDAR);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const weekDates = useMemo(() => getWeekDates(), []);

  const addTeacher = useCallback((name: string, email: string, specialty: string) => {
    setState((prev) => ({
      ...prev,
      teachers: [
        ...prev.teachers,
        { id: generateId("doc"), name, email, specialty },
      ],
    }));
  }, []);

  const addRoom = useCallback((name: string, capacity: number) => {
    setState((prev) => ({
      ...prev,
      rooms: [...prev.rooms, { id: generateId("room"), name, capacity }],
    }));
  }, []);

  const addStudent = useCallback((name: string, email: string) => {
    setState((prev) => ({
      ...prev,
      students: [...prev.students, { id: generateId("stud"), name, email }],
    }));
  }, []);

  const createCourseWithSchedule = useCallback((input: NewCourseInput) => {
    const week = getWeekDates();
    const color = COURSE_COLORS[state.courses.length % COURSE_COLORS.length];
    const course: Course = {
      id: generateId("course"),
      title: input.title,
      totalHours: input.totalHours,
      teacherId: input.teacherId,
      studentIds: input.studentIds,
      modality: input.modality,
      roomId: input.roomId,
      color,
      startDate: week[0],
      endDate: week[4],
    };

    const slots = Array.from({ length: input.sessionsCount }, (_, i) => ({
      weekdayIndex: i % 5,
      startTime: i % 2 === 0 ? "09:30" : "14:00",
      endTime: i % 2 === 0 ? "12:30" : "17:00",
      titlePrefix: "Lezione",
    }));

    const lessons = buildCourseLessons(course, slots);

    setState((prev) => ({
      ...prev,
      courses: [...prev.courses, course],
      lessons: [...prev.lessons, ...lessons],
    }));
  }, [state.courses.length]);

  const addLesson = useCallback((lesson: Omit<Lesson, "id">) => {
    setState((prev) => ({
      ...prev,
      lessons: [...prev.lessons, { ...lesson, id: generateId("les") }],
    }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(DEMO_CALENDAR);
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

  const getLessonsForTeacher = useCallback(
    (teacherId: string, dates?: string[]) => {
      return state.lessons
        .filter(
          (l) =>
            l.teacherId === teacherId &&
            (!dates || dates.includes(l.date))
        )
        .sort((a, b) =>
          a.date === b.date
            ? a.startTime.localeCompare(b.startTime)
            : a.date.localeCompare(b.date)
        );
    },
    [state.lessons]
  );

  const getLessonsForStudent = useCallback(
    (studentId: string, dates?: string[]) => {
      const courseIds = new Set(
        state.courses
          .filter((c) => c.studentIds.includes(studentId))
          .map((c) => c.id)
      );
      return state.lessons
        .filter(
          (l) =>
            courseIds.has(l.courseId) &&
            (!dates || dates.includes(l.date))
        )
        .sort((a, b) =>
          a.date === b.date
            ? a.startTime.localeCompare(b.startTime)
            : a.date.localeCompare(b.date)
        );
    },
    [state.courses, state.lessons]
  );

  const getCoursesForStudent = useCallback(
    (studentId: string) =>
      state.courses.filter((c) => c.studentIds.includes(studentId)),
    [state.courses]
  );

  const getCourseProgress = useCallback(
    (courseId: string, _studentId: string) => {
      const course = state.courses.find((c) => c.id === courseId);
      if (!course) return 0;
      const scheduled = scheduledHoursForCourse(state.lessons, courseId);
      return Math.min(100, Math.round((scheduled / course.totalHours) * 100));
    },
    [state.courses, state.lessons]
  );

  const value: CalendarContextValue = {
    state,
    weekDates,
    demoTeacherId: DEMO_TEACHER_ID,
    demoStudentId: DEMO_STUDENT_ID,
    addTeacher,
    addRoom,
    addStudent,
    createCourseWithSchedule,
    addLesson,
    resetDemo,
    getTeacher,
    getRoom,
    getCourse,
    getLessonsForTeacher,
    getLessonsForStudent,
    getCoursesForStudent,
    getCourseProgress,
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-ink-soft">
        Caricamento calendario…
      </div>
    );
  }

  return (
    <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
  );
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
}

export type { NewCourseInput };
