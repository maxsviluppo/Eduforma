"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import { WeekCalendarGrid } from "@/components/calendar/WeekCalendarGrid";
import { countTeacherProblems, getLessonProblems } from "@/lib/calendar/teacher-availability";

export default function DocenteCalendarioClient() {
  const { currentTeacherId, getLessonsForTeacher, getTeacher } = useCalendar();
  const teacher = getTeacher(currentTeacherId);
  const lessons = getLessonsForTeacher(currentTeacherId);
  const problemCount = countTeacherProblems(lessons, teacher);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
          Calendario personale
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">
          {teacher?.name}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Solo le date del tuo nominativo · {lessons.length} lezioni
        </p>
      </div>

      {problemCount > 0 && (
        <Link
          href="/docente/disponibilita"
          className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950 hover:bg-amber-100"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {problemCount} lezione/i da verificare — gestisci in Disponibilità
        </Link>
      )}

      <div className="glass rounded-[1.5rem] p-5">
        <WeekCalendarGrid
          lessons={lessons}
          renderLessonMeta={(lesson) => {
            const problems = getLessonProblems(lesson, teacher);
            if (!problems) return null;
            return (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                <AlertTriangle className="h-3 w-3" />
                {lesson.needsReschedule ? "Da spostare" : problems.reasons[0]}
              </p>
            );
          }}
        />
      </div>
    </div>
  );
}
