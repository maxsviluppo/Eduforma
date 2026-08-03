"use client";

import { useCalendar } from "@/lib/calendar/CalendarProvider";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";
import { scheduledHoursForCourse } from "@/lib/calendar/demo-data";

export default function DocenteCorsiClient() {
  const { state, currentTeacherId, getRoom, getSchool, getTeacher } = useCalendar();
  const teacher = getTeacher(currentTeacherId);
  const myCourses = state.courses.filter((c) => c.teacherId === currentTeacherId);
  const school = teacher?.schoolId ? getSchool(teacher.schoolId) : undefined;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">I tuoi corsi</h1>
        <p className="mt-2 text-ink-soft">
          {teacher?.name}
          {school ? ` · ${school.name}` : ""}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {myCourses.map((course) => {
          const room = course.roomId ? getRoom(course.roomId) : undefined;
          const scheduled = scheduledHoursForCourse(state.lessons, course.id);
          const students = state.students.filter((s) =>
            course.studentIds.includes(s.id)
          );

          return (
            <article
              key={course.id}
              className="glass rounded-[1.4rem] p-5"
              style={{ borderTop: `4px solid ${course.color}` }}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-ink">{course.title}</h2>
                <ModalityBadge modality={course.modality} compact />
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                {scheduled}/{course.totalHours} ore programmate
              </p>
              {room && (
                <p className="mt-1 text-xs text-ink-soft">Aula: {room.name}</p>
              )}
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                Studenti ({students.length})
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {students.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-ink"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
        {myCourses.length === 0 && (
          <p className="glass rounded-[1.4rem] p-6 text-sm text-ink-soft md:col-span-2">
            Nessun corso assegnato a questo docente.
          </p>
        )}
      </div>
    </div>
  );
}
