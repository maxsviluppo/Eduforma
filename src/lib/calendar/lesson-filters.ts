import type { Course, Lesson, Room } from "@/lib/calendar/types";

export type CalendarLessonFilters = {
  schoolIds: string[];
  teacherIds: string[];
  courseIds: string[];
};

export const EMPTY_CALENDAR_LESSON_FILTERS: CalendarLessonFilters = {
  schoolIds: [],
  teacherIds: [],
  courseIds: [],
};

export function hasActiveLessonFilters(filters: CalendarLessonFilters): boolean {
  return (
    filters.schoolIds.length > 0 ||
    filters.teacherIds.length > 0 ||
    filters.courseIds.length > 0
  );
}

export function lessonSchoolId(
  lesson: Lesson,
  getCourse: (id: string) => Course | undefined,
  getRoom: (id: string) => Room | undefined
): string | undefined {
  const course = getCourse(lesson.courseId);
  const room = lesson.roomId ? getRoom(lesson.roomId) : undefined;
  return room?.schoolId ?? course?.schoolId;
}

export function filterLessons(
  lessons: Lesson[],
  filters: CalendarLessonFilters,
  getCourse: (id: string) => Course | undefined,
  getRoom: (id: string) => Room | undefined
): Lesson[] {
  const { schoolIds, teacherIds, courseIds } = filters;
  if (!schoolIds.length && !teacherIds.length && !courseIds.length) {
    return lessons;
  }

  return lessons.filter((lesson) => {
    if (courseIds.length > 0 && !courseIds.includes(lesson.courseId)) return false;
    if (teacherIds.length > 0 && !teacherIds.includes(lesson.teacherId)) return false;
    if (schoolIds.length > 0) {
      const schoolId = lessonSchoolId(lesson, getCourse, getRoom);
      if (!schoolId || !schoolIds.includes(schoolId)) return false;
    }
    return true;
  });
}

export function toggleFilterId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}
