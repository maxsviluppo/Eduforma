"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import { TeacherAvailabilityEditor } from "@/components/calendar/TeacherAvailabilityEditor";
import { countTeacherProblems } from "@/lib/calendar/teacher-availability";

export default function DocenteDisponibilitaClient() {
  const { currentTeacherId, getTeacher, getLessonsForTeacher } = useCalendar();
  const teacher = getTeacher(currentTeacherId);
  const myLessons = getLessonsForTeacher(currentTeacherId);
  const problemCount = countTeacherProblems(myLessons, teacher);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
          Pannello personale
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">
          Disponibilità e preferenze
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Segna in tempo reale date preferite, esclusioni, fasce mattina/pomeriggio e impegni
          personali. Le lezioni in conflitto vengono evidenziate e puoi segnalarne lo spostamento
          all&apos;amministrazione.
        </p>
      </div>

      {problemCount > 0 && (
        <div className="flex items-start gap-3 rounded-[1.3rem] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">
              {problemCount} lezione/i da verificare o spostare
            </p>
            <p className="mt-1 text-xs text-amber-900/90">
              Controlla le lezioni evidenziate in giallo/ambra nel calendario e nella lista
              giornaliera.
            </p>
          </div>
        </div>
      )}

      <TeacherAvailabilityEditor teacherId={currentTeacherId} />

      <Link
        href="/docente"
        className="inline-flex items-center gap-2 text-sm font-bold text-teal-deep hover:underline"
      >
        <ArrowRight className="h-4 w-4 rotate-180" />
        Torna alla home docente
      </Link>
    </div>
  );
}
