"use client";

import { useCalendar } from "@/lib/calendar/CalendarProvider";
import { WeekCalendarGrid } from "@/components/calendar/WeekCalendarGrid";

export default function StudenteCorsiClient() {
  const { demoStudentId, getCoursesForStudent, getLessonsForStudent } = useCalendar();
  const courses = getCoursesForStudent(demoStudentId);
  const lessons = getLessonsForStudent(demoStudentId);

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">I miei corsi</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {courses.length} corsi iscritti · {lessons.length} lezioni in calendario
        </p>
      </div>
      <div className="glass rounded-[1.5rem] p-4 md:p-5">
        <WeekCalendarGrid lessons={lessons} />
      </div>
    </div>
  );
}
