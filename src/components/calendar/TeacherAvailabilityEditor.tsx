"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CheckCircle2,
  Heart,
  Sun,
  Sunset,
} from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";
import {
  COMMITMENT_BAND_LABELS,
  COMMITMENT_BAND_STYLES,
  getLessonProblems,
  rescheduleDates,
  teacherAvailability,
  teacherCommitments,
  teacherExcludedDates,
  teacherPreferredDates,
} from "@/lib/calendar/teacher-availability";
import type { TeacherCommitmentBand } from "@/lib/calendar/types";
import { toIsoDate } from "@/lib/calendar/types";

type CalendarMode = "prefer" | "exclude" | "commitment";

export function TeacherAvailabilityEditor({
  teacherId,
  compact = false,
}: {
  teacherId: string;
  compact?: boolean;
}) {
  const {
    getTeacher,
    getLessonsForTeacher,
    getCourse,
    getRoom,
    toggleTeacherPreferredDate,
    toggleTeacherExcludedDate,
    setTeacherAvailability,
    toggleTeacherCommitment,
    removeTeacherCommitment,
    requestLessonReschedule,
    clearLessonReschedule,
  } = useCalendar();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(toIsoDate(now));
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("prefer");
  const [commitmentBand, setCommitmentBand] = useState<TeacherCommitmentBand>("giornata");
  const [rescheduleNote, setRescheduleNote] = useState("");

  const teacher = getTeacher(teacherId);
  const myLessons = getLessonsForTeacher(teacherId);
  const preferredDates = teacherPreferredDates(teacher);
  const excludedDates = teacherExcludedDates(teacher);
  const commitments = teacherCommitments(teacher);
  const availability = teacherAvailability(teacher);

  const rescheduleDateMarks = useMemo(
    () => rescheduleDates(myLessons),
    [myLessons]
  );

  const dayLessons = useMemo(
    () =>
      selectedDate ? myLessons.filter((l) => l.date === selectedDate) : [],
    [myLessons, selectedDate]
  );

  const handleCalendarDate = (date: string) => {
    setSelectedDate(date);
    if (calendarMode === "prefer") {
      toggleTeacherPreferredDate(teacherId, date);
      return;
    }
    if (calendarMode === "exclude") {
      toggleTeacherExcludedDate(teacherId, date);
      return;
    }
    toggleTeacherCommitment(teacherId, date, commitmentBand);
  };

  const modeHint =
    calendarMode === "prefer"
      ? "Clicca un giorno per segnarlo come preferito (verde)."
      : calendarMode === "exclude"
        ? "Clicca un giorno per escluderlo dalla programmazione (rosa)."
        : `Clicca un giorno per segnare un impegno (${COMMITMENT_BAND_LABELS[commitmentBand].toLowerCase()}).`;

  return (
    <div className="space-y-4">
      <div className="glass rounded-[1.4rem] p-4 md:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
          Disponibilità oraria
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setTeacherAvailability(teacherId, {
                ...availability,
                morning: !availability.morning,
              })
            }
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
              availability.morning
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-line bg-white/70 text-ink-soft line-through opacity-70"
            }`}
          >
            <Sun className="h-4 w-4" />
            Mattina
          </button>
          <button
            type="button"
            onClick={() =>
              setTeacherAvailability(teacherId, {
                ...availability,
                afternoon: !availability.afternoon,
              })
            }
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
              availability.afternoon
                ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                : "border-line bg-white/70 text-ink-soft line-through opacity-70"
            }`}
          >
            <Sunset className="h-4 w-4" />
            Pomeriggio
          </button>
        </div>
        <p className="mt-2 text-[11px] text-ink-soft">
          Le lezioni fuori dalle fasce selezionate verranno evidenziate come da spostare.
        </p>
      </div>

      <div className="glass rounded-[1.4rem] p-4 md:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft">
          Modalità calendario
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["prefer", "Preferenza", Heart],
              ["exclude", "Esclusione", Ban],
              ["commitment", "Impegno", CalendarClock],
            ] as const
          ).map(([mode, label, Icon]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setCalendarMode(mode)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition ${
                calendarMode === mode
                  ? mode === "prefer"
                    ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                    : mode === "exclude"
                      ? "border-rose-400 bg-rose-50 text-rose-800"
                      : "border-violet-400 bg-violet-50 text-violet-800"
                  : "border-line bg-white/70 text-ink-soft hover:bg-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {calendarMode === "commitment" && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(["mattina", "pomeriggio", "giornata"] as const).map((band) => (
              <button
                key={band}
                type="button"
                onClick={() => setCommitmentBand(band)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                  commitmentBand === band
                    ? COMMITMENT_BAND_STYLES[band].modeBtnActive
                    : "bg-white/80 text-ink-soft hover:bg-white"
                }`}
              >
                {COMMITMENT_BAND_LABELS[band]}
              </button>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-ink-soft">{modeHint}</p>
      </div>

      <MonthCalendar
        year={year}
        month={month}
        selectedDate={selectedDate}
        onSelectDate={handleCalendarDate}
        onChangeMonth={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
        filterTeacherId={teacherId}
        highlightTeacherId={teacherId}
        lessons={myLessons}
        markPreferredDates={preferredDates}
        markExcludedDates={excludedDates}
        markCommitments={commitments}
        markRescheduleDates={rescheduleDateMarks}
        problematicLessonIds={[...myLessons]
          .filter((l) => getLessonProblems(l, teacher))
          .map((l) => l.id)}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <DateChipList
          title="Date preferite"
          empty="Nessuna preferenza"
          dates={preferredDates}
          tone="emerald"
          onRemove={(date) => toggleTeacherPreferredDate(teacherId, date)}
        />
        <DateChipList
          title="Date escluse"
          empty="Nessuna esclusione"
          dates={excludedDates}
          tone="rose"
          onRemove={(date) => toggleTeacherExcludedDate(teacherId, date)}
        />
        <CommitmentList
          commitments={commitments}
          onRemove={(id) => removeTeacherCommitment(teacherId, id)}
        />
      </div>

      <div className="glass rounded-[1.5rem] p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">
            Lezioni del {selectedDate ?? "—"}
          </h2>
          <span className="text-xs font-semibold text-ink-soft">
            {dayLessons.length} lezione/i
          </span>
        </div>

        {dayLessons.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-soft">
            Nessuna lezione in questo giorno.
          </p>
        ) : (
          <ul className="space-y-3">
            {dayLessons.map((lesson) => {
              const problems = getLessonProblems(lesson, teacher);
              const course = getCourse(lesson.courseId);
              const room = lesson.roomId ? getRoom(lesson.roomId) : undefined;
              const flagged = lesson.needsReschedule;

              return (
                <li
                  key={lesson.id}
                  className={`rounded-2xl border bg-white/85 p-4 ${
                    problems?.severity === "critical"
                      ? "border-amber-400 bg-amber-50/40 ring-1 ring-amber-300/60"
                      : "border-line/70"
                  }`}
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: course?.color ?? "#0f8f8a",
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold text-ink-soft">
                          {lesson.startTime} – {lesson.endTime}
                        </p>
                        <ModalityBadge modality={lesson.modality} compact />
                        {flagged && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950">
                            <AlertTriangle className="h-3 w-3" />
                            Da spostare
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-display text-base font-bold text-ink">
                        {lesson.title}
                      </p>
                      <p className="text-sm text-ink-soft">
                        {course?.title}
                        {room ? ` · ${room.name}` : ""}
                      </p>
                      {problems && (
                        <ul className="mt-2 space-y-1">
                          {problems.reasons.map((reason) => (
                            <li
                              key={reason}
                              className="flex items-start gap-1.5 text-xs font-semibold text-amber-900"
                            >
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      )}
                      {lesson.rescheduleNote && (
                        <p className="mt-2 rounded-lg bg-white/80 px-2.5 py-1.5 text-xs text-ink-soft">
                          Nota: {lesson.rescheduleNote}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      {flagged ? (
                        <button
                          type="button"
                          onClick={() => clearLessonReschedule(lesson.id)}
                          className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-3 py-2 text-xs font-bold text-teal-deep"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Rimuovi segnalazione
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            requestLessonReschedule(
                              lesson.id,
                              rescheduleNote.trim() || undefined
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Segnala da spostare
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!compact && dayLessons.some((l) => !l.needsReschedule) && (
          <div className="mt-4 border-t border-line/60 pt-4">
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
              Nota opzionale per la prossima segnalazione
            </label>
            <input
              value={rescheduleNote}
              onChange={(e) => setRescheduleNote(e.target.value)}
              placeholder="Es. conflitto con altro impegno"
              className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DateChipList({
  title,
  empty,
  dates,
  tone,
  onRemove,
}: {
  title: string;
  empty: string;
  dates: string[];
  tone: "emerald" | "rose";
  onRemove: (date: string) => void;
}) {
  const chipClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
      : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100";

  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-soft">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {dates.length === 0 && (
          <span className="text-xs text-ink-soft">{empty}</span>
        )}
        {dates.map((date) => (
          <button
            key={date}
            type="button"
            onClick={() => onRemove(date)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${chipClass}`}
            title="Rimuovi"
          >
            {date} ×
          </button>
        ))}
      </div>
    </div>
  );
}

function CommitmentList({
  commitments,
  onRemove,
}: {
  commitments: ReturnType<typeof teacherCommitments>;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-soft">
        Impegni personali
      </p>
      <div className="mt-2 space-y-1.5">
        {commitments.length === 0 && (
          <span className="text-xs text-ink-soft">Nessun impegno segnato</span>
        )}
        {commitments.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onRemove(c.id)}
            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-[11px] font-bold ${COMMITMENT_BAND_STYLES[c.band].chip}`}
            title="Rimuovi impegno"
          >
            <span>{c.date}</span>
            <span>{COMMITMENT_BAND_LABELS[c.band]} ×</span>
          </button>
        ))}
      </div>
    </div>
  );
}
