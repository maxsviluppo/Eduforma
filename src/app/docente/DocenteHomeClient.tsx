"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock3, MonitorPlay, PlayCircle } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { isToday, toIsoDate } from "@/lib/calendar/types";

export default function DocenteHomeClient() {
  const {
    currentTeacherId,
    getTeacher,
    getLessonsForTeacher,
    getCourse,
    getRoom,
    weekDates,
  } = useCalendar();

  const teacher = getTeacher(currentTeacherId);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(toIsoDate(now));

  const myLessons = getLessonsForTeacher(currentTeacherId);
  const todayStr = toIsoDate(now);
  const todayLessons = getLessonsForTeacher(currentTeacherId, [todayStr]);
  const weekLessons = getLessonsForTeacher(currentTeacherId, weekDates);
  const dayLessons = useMemo(
    () =>
      selectedDate
        ? myLessons.filter((l) => l.date === selectedDate)
        : [],
    [myLessons, selectedDate]
  );
  const list = todayLessons.length > 0 ? todayLessons : weekLessons.slice(0, 5);
  const nextLive = weekLessons.find((l) => l.modality !== "aula" && l.dadLink);

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:mx-0 lg:max-w-none lg:space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
          Ciao, {teacher?.name.split(" ")[0] ?? "Docente"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">
          Il tuo calendario
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Solo le lezioni di <strong>{teacher?.name ?? "…"}</strong> · {myLessons.length} totali
        </p>
      </div>

      {nextLive && (
        <a
          href={nextLive.dadLink}
          target="_blank"
          rel="noreferrer"
          className="relative flex min-h-[120px] flex-col justify-end overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-azure to-teal-deep p-5 text-white shadow-[0_16px_40px_rgba(59,130,196,0.35)] active:scale-[0.99]"
        >
          <p className="relative text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
            Prossima DAD
          </p>
          <p className="relative mt-1 font-display text-xl font-bold leading-tight">
            {nextLive.title}
          </p>
          <p className="relative mt-1 text-sm text-white/80">
            {nextLive.date} · {nextLive.startTime}
          </p>
          <span className="relative mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-azure">
            <PlayCircle className="h-4 w-4" />
            Entra in call
          </span>
        </a>
      )}

      <MonthCalendar
        year={year}
        month={month}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onChangeMonth={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
        filterTeacherId={currentTeacherId}
        highlightTeacherId={currentTeacherId}
        lessons={myLessons}
      />

      <div className="glass rounded-[1.5rem] p-4 md:p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          Lezioni del {selectedDate ?? "—"}
        </h2>
        <ul className="mt-3 space-y-3">
          {(dayLessons.length > 0 ? dayLessons : list).map((lesson) => {
            const course = getCourse(lesson.courseId);
            const room = lesson.roomId ? getRoom(lesson.roomId) : undefined;
            return (
              <li
                key={lesson.id}
                className="rounded-2xl border border-line/70 bg-white/80 p-3.5"
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: course?.color ?? "#0f8f8a",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-deep">
                    <Clock3 className="h-4 w-4" />
                    {lesson.startTime} – {lesson.endTime}
                  </span>
                  <ModalityBadge modality={lesson.modality} compact />
                </div>
                {!isToday(lesson.date) && dayLessons.length === 0 && (
                  <p className="mt-1 text-[10px] font-bold uppercase text-ink-soft">
                    {lesson.date}
                  </p>
                )}
                <p className="mt-2 text-base font-bold text-ink">{lesson.title}</p>
                <p className="text-xs text-ink-soft">
                  {course?.title}
                  {room ? ` · ${room.name}` : ""}
                </p>
                {lesson.dadLink && (
                  <a
                    href={lesson.dadLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-full bg-azure/10 px-3.5 py-2 text-xs font-bold text-azure"
                  >
                    <MonitorPlay className="h-4 w-4" />
                    Apri DAD
                  </a>
                )}
              </li>
            );
          })}
          {dayLessons.length === 0 && list.length === 0 && (
            <p className="rounded-xl border border-dashed border-line px-3 py-8 text-center text-sm text-ink-soft">
              Nessuna lezione assegnata a {teacher?.name}.
            </p>
          )}
        </ul>
      </div>

      <Link
        href="/docente/calendario"
        className="block rounded-[1.2rem] border border-dashed border-teal/30 bg-teal/5 px-4 py-3.5 text-center text-xs font-semibold text-teal-deep"
      >
        Vista settimanale completa
      </Link>
    </div>
  );
}
