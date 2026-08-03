"use client";

import Link from "next/link";
import { ArrowRight, Link2, UserRound, GraduationCap } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";

export function SimulationLinksBanner() {
  const {
    getTeacher,
    getCoursesForStudent,
    currentTeacherId,
    currentStudentId,
    setCurrentTeacherId,
    state,
  } = useCalendar();
  const teacher = getTeacher(currentTeacherId);
  const studentCourses = getCoursesForStudent(currentStudentId);
  const student = state.students.find((s) => s.id === currentStudentId);

  return (
    <div className="glass-strong rounded-[1.4rem] border border-teal/15 p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal/12 text-teal-deep">
          <Link2 className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
            Simulazione collegata
          </p>
          <h3 className="mt-1 font-display text-lg font-bold text-ink">
            Stesso calendario su Admin, Docente e Studente
          </h3>
          <p className="mt-2 text-sm text-ink-soft">
            Sessione attuale: docente <strong>{teacher?.name}</strong>
            {student ? (
              <>
                {" "}
                · studente <strong>{student.name}</strong> ({studentCourses.length} corsi)
              </>
            ) : null}
            . Ogni docente vede solo le proprie date.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {state.teachers.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setCurrentTeacherId(t.id)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                  t.id === currentTeacherId
                    ? "bg-teal text-white"
                    : "bg-white/80 text-ink-soft hover:bg-white"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/docente"
              className="inline-flex items-center gap-2 rounded-full bg-azure/10 px-4 py-2 text-xs font-bold text-azure transition hover:bg-azure/15"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Vista Docente ({teacher?.name.split(" ")[0]})
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/studente"
              className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-4 py-2 text-xs font-bold text-teal-deep transition hover:bg-teal/15"
            >
              <UserRound className="h-3.5 w-3.5" />
              Vista Studente ({student?.name.split(" ")[0] ?? "Laura"})
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
