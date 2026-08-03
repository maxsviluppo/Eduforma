"use client";

import Link from "next/link";
import { Clock3, MonitorPlay, PlayCircle, Upload } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";
import { isToday } from "@/lib/calendar/types";

export default function DocenteHomeClient() {
  const {
    demoTeacherId,
    getTeacher,
    getLessonsForTeacher,
    getCourse,
    getRoom,
    weekDates,
  } = useCalendar();

  const teacher = getTeacher(demoTeacherId);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLessons = getLessonsForTeacher(demoTeacherId, [todayStr]);
  const weekLessons = getLessonsForTeacher(demoTeacherId, weekDates);
  const nextLive = weekLessons.find(
    (l) => l.modality !== "aula" && l.dadLink
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
          Ciao, {teacher?.name.split(" ")[0] ?? "Docente"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink md:text-4xl">
          Le tue lezioni
        </h1>
        <p className="mt-2 text-ink-soft">
          Calendario sincronizzato con l&apos;admin · {weekLessons.length} lezioni questa settimana
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass rounded-[1.5rem] p-6">
          <h2 className="font-display text-xl font-bold text-ink">
            {todayLessons.length > 0 ? "Agenda di oggi" : "Prossime lezioni"}
          </h2>
          <ul className="mt-5 space-y-3">
            {(todayLessons.length > 0 ? todayLessons : weekLessons.slice(0, 4)).map(
              (lesson) => {
                const course = getCourse(lesson.courseId);
                const room = lesson.roomId ? getRoom(lesson.roomId) : undefined;

                return (
                  <li
                    key={lesson.id}
                    className="rounded-2xl border border-line/70 bg-white/70 px-4 py-3"
                    style={{
                      borderLeftWidth: 4,
                      borderLeftColor: course?.color ?? "#0f8f8a",
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="flex items-center gap-2 font-semibold text-teal-deep">
                        <Clock3 className="h-4 w-4" />
                        {lesson.startTime} – {lesson.endTime}
                        {!isToday(lesson.date) && (
                          <span className="text-[10px] font-bold uppercase text-ink-soft">
                            · {lesson.date}
                          </span>
                        )}
                      </span>
                      <ModalityBadge modality={lesson.modality} compact />
                    </div>
                    <p className="mt-2 font-semibold text-ink">{lesson.title}</p>
                    <p className="text-xs text-ink-soft">
                      {course?.title}
                      {room ? ` · ${room.name}` : lesson.dadLink ? " · Online" : ""}
                    </p>
                    {lesson.dadLink && (
                      <a
                        href={lesson.dadLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-azure hover:underline"
                      >
                        <MonitorPlay className="h-3.5 w-3.5" />
                        Avvia sessione DAD
                      </a>
                    )}
                  </li>
                );
              }
            )}
          </ul>
        </div>

        <div className="space-y-4">
          {nextLive && (
            <Link
              href="/docente/dad"
              className="relative block overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-azure to-teal-deep p-5 text-white shadow-[0_16px_40px_rgba(59,130,196,0.35)]"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
                Prossima DAD
              </p>
              <p className="mt-2 font-display text-lg font-bold">{nextLive.title}</p>
              <p className="mt-1 text-sm text-white/80">
                {nextLive.date} · {nextLive.startTime}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-azure">
                <PlayCircle className="h-4 w-4" />
                Expert / Live
              </span>
            </Link>
          )}
          <Link
            href="/docente/materiali"
            className="glass flex items-center gap-4 rounded-[1.4rem] p-5 transition hover:-translate-y-0.5"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-azure/15 text-azure">
              <Upload className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-ink">Carica materiale</p>
              <p className="text-sm text-ink-soft">Dispense e video per le tue lezioni</p>
            </div>
          </Link>
          <Link
            href="/admin/calendario"
            className="rounded-[1.2rem] border border-dashed border-teal/30 bg-teal/5 px-4 py-3 text-center text-xs font-semibold text-teal-deep"
          >
            Vedi calendario completo (Admin)
          </Link>
        </div>
      </div>
    </div>
  );
}
