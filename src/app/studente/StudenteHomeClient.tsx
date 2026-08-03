"use client";

import Link from "next/link";
import { Download, Headphones, MapPin, MonitorPlay, Play } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";
import { formatTimeRange, isToday } from "@/lib/calendar/types";

export default function StudenteHomeClient() {
  const {
    demoStudentId,
    getCoursesForStudent,
    getLessonsForStudent,
    getCourse,
    getCourseProgress,
    getRoom,
    getTeacher,
    weekDates,
  } = useCalendar();

  const courses = getCoursesForStudent(demoStudentId);
  const weekLessons = getLessonsForStudent(demoStudentId, weekDates);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLessons = weekLessons.filter((l) => l.date === todayStr);
  const nextLesson =
    todayLessons[0] ??
    weekLessons.find((l) => l.date >= todayStr) ??
    weekLessons[0];
  const nextCourse = nextLesson ? getCourse(nextLesson.courseId) : undefined;

  return (
    <div className="mx-auto max-w-lg space-y-5 lg:max-w-3xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
          Ciao, Laura
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">
          Le tue lezioni
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {courses.length} corsi iscritti · calendario aggiornato dall&apos;admin
        </p>
      </div>

      {nextLesson && nextCourse && (
        <Link
          href="/studente/video"
          className="relative block overflow-hidden rounded-[1.7rem] bg-gradient-to-br from-teal to-teal-deep p-6 text-white shadow-[0_20px_50px_rgba(15,143,138,0.35)]"
        >
          <div className="absolute -right-6 -top-8 h-36 w-36 rounded-full bg-white/15 blur-xl" />
          <p className="relative text-xs font-bold uppercase tracking-[0.16em] text-white/75">
            {isToday(nextLesson.date) ? "Oggi" : "Prossima lezione"}
          </p>
          <h2 className="relative mt-3 font-display text-2xl font-bold">
            {nextCourse.title}
          </h2>
          <p className="relative mt-1 text-sm text-white/85">{nextLesson.title}</p>
          <p className="relative mt-2 text-sm text-white/75">
            {formatTimeRange(nextLesson)} ·{" "}
            {nextLesson.modality === "dad" ? "Online" : "In presenza / ibrida"}
          </p>
          <span className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-teal-deep">
            <Play className="h-4 w-4 fill-current" />
            {nextLesson.modality === "dad" ? "Entra in DAD" : "Guarda / Ascolta"}
          </span>
        </Link>
      )}

      {todayLessons.length > 1 && (
        <div className="glass rounded-[1.4rem] p-4">
          <h3 className="text-sm font-bold text-ink">Altre lezioni oggi</h3>
          <ul className="mt-3 space-y-2">
            {todayLessons.slice(1).map((lesson) => {
              const course = getCourse(lesson.courseId);
              return (
                <li
                  key={lesson.id}
                  className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2.5 text-sm"
                >
                  <span>
                    <span className="font-semibold text-ink">{course?.title}</span>
                    <span className="block text-xs text-ink-soft">
                      {lesson.startTime} · {lesson.title}
                    </span>
                  </span>
                  <ModalityBadge modality={lesson.modality} compact />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {courses.map((course) => {
          const progress = getCourseProgress(course.id, demoStudentId);
          const teacher = getTeacher(course.teacherId);
          const room = course.roomId ? getRoom(course.roomId) : undefined;
          const courseLessons = weekLessons.filter((l) => l.courseId === course.id);

          return (
            <article
              key={course.id}
              className="glass overflow-hidden rounded-[1.4rem] p-5"
              style={{
                background: `linear-gradient(135deg, ${course.color}18, white 60%)`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-bold text-ink">{course.title}</h3>
                <ModalityBadge modality={course.modality} compact />
              </div>
              <p className="mt-2 text-xs text-ink-soft">
                Doc. {teacher?.name.split(" ")[0]} · {course.totalHours}h totali
              </p>
              {room && (
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
                  <MapPin className="h-3 w-3" />
                  {room.name}
                </p>
              )}
              <p className="mt-2 text-xs text-ink-soft">
                Prossima: {courseLessons[0]?.title ?? "—"}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, background: course.color }}
                />
              </div>
              <p className="mt-2 text-xs font-semibold" style={{ color: course.color }}>
                {progress}% ore programmate
              </p>
            </article>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/studente/video"
          className="glass flex flex-col items-start gap-3 rounded-2xl p-4"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal/10 text-teal-deep">
            <Headphones className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold text-ink">Modalità ascolto</span>
        </Link>
        <Link
          href="/studente/materiali"
          className="glass flex flex-col items-start gap-3 rounded-2xl p-4"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-azure/15 text-azure">
            <Download className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold text-ink">Scarica file</span>
        </Link>
      </div>

      {weekLessons.some((l) => l.dadLink) && (
        <div className="glass rounded-[1.3rem] p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <MonitorPlay className="h-4 w-4 text-azure" />
            Link DAD disponibili
          </p>
          <ul className="mt-3 space-y-2">
            {weekLessons
              .filter((l) => l.dadLink)
              .slice(0, 3)
              .map((l) => (
                <li key={l.id}>
                  <a
                    href={l.dadLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-azure hover:underline"
                  >
                    {getCourse(l.courseId)?.title} · {l.title}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
