"use client";

import { useCalendar } from "@/lib/calendar/CalendarProvider";
import { WeekCalendarGrid } from "@/components/calendar/WeekCalendarGrid";

export default function DocenteCalendarioClient() {
  const { demoTeacherId, getLessonsForTeacher, getTeacher } = useCalendar();
  const teacher = getTeacher(demoTeacherId);
  const lessons = getLessonsForTeacher(demoTeacherId);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
          Calendario docente
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">
          {teacher?.name}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {lessons.length} lezioni assegnate · sincronizzate con l&apos;admin
        </p>
      </div>
      <div className="glass rounded-[1.5rem] p-5">
        <WeekCalendarGrid lessons={lessons} />
      </div>
    </div>
  );
}
