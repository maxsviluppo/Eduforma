"use client";

import { useCalendar } from "@/lib/calendar/CalendarProvider";
import type { Lesson } from "@/lib/calendar/types";
import { formatDayLabel, isToday } from "@/lib/calendar/types";
import { ModalityBadge } from "./ModalityBadge";

export function WeekCalendarGrid({
  lessons,
  onLessonClick,
  renderLessonMeta,
}: {
  lessons: Lesson[];
  onLessonClick?: (lesson: Lesson) => void;
  renderLessonMeta?: (lesson: Lesson) => React.ReactNode;
}) {
  const { weekDates, getCourse, getRoom, getTeacher } = useCalendar();

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px] grid-cols-5 gap-2">
        {weekDates.map((date) => {
          const label = formatDayLabel(date);
          const dayLessons = lessons.filter((l) => l.date === date);
          const today = isToday(date);

          return (
            <div key={date} className="min-h-[280px]">
              <div
                className={`mb-2 rounded-xl px-3 py-2 text-center ${
                  today ? "bg-teal text-white" : "bg-white/70 text-ink"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">
                  {label.weekday}
                </p>
                <p className="font-display text-sm font-bold">{label.day}</p>
              </div>
              <div className="space-y-2">
                {dayLessons.length === 0 && (
                  <p className="rounded-xl border border-dashed border-line/80 px-3 py-6 text-center text-[11px] text-ink-soft">
                    Nessuna lezione
                  </p>
                )}
                {dayLessons.map((lesson) => {
                  const course = getCourse(lesson.courseId);
                  const room = lesson.roomId ? getRoom(lesson.roomId) : undefined;
                  const teacher = getTeacher(lesson.teacherId);
                  const flagged = lesson.needsReschedule;

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => onLessonClick?.(lesson)}
                      className={`w-full rounded-xl border bg-white/85 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                        flagged
                          ? "border-amber-400 bg-amber-50/40 ring-1 ring-amber-300/50"
                          : "border-line/70"
                      }`}
                      style={{ borderLeftWidth: 4, borderLeftColor: course?.color ?? "#0f8f8a" }}
                    >
                      <p className="text-[10px] font-bold text-ink-soft">
                        {lesson.startTime} – {lesson.endTime}
                      </p>
                      <p className="mt-1 text-sm font-bold text-ink">{lesson.title}</p>
                      <p className="mt-0.5 text-[11px] text-ink-soft">{course?.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <ModalityBadge modality={lesson.modality} compact />
                        {room && (
                          <span className="text-[10px] font-semibold text-ink-soft">
                            {room.name}
                          </span>
                        )}
                        {teacher && (
                          <span className="text-[10px] font-semibold text-ink-soft">
                            · {teacher.name.split(" ")[0]}
                          </span>
                        )}
                      </div>
                      {renderLessonMeta?.(lesson)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
