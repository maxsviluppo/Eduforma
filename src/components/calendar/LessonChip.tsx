"use client";

import {
  lessonChipLabel,
  lessonCourseColor,
} from "@/lib/calendar/calendar-display";
import type { Course, Lesson, Teacher } from "@/lib/calendar/types";

type Size = "xs" | "sm" | "md";

const SIZE: Record<
  Size,
  { wrap: string; time: string; sigla: string; pad: string }
> = {
  xs: {
    wrap: "gap-0.5 px-1 py-0.5 text-[8px] leading-none",
    time: "text-[7px] opacity-90",
    sigla: "text-[8px] font-black",
    pad: "min-h-[14px]",
  },
  sm: {
    wrap: "gap-1 px-1.5 py-0.5 text-[9px] leading-tight",
    time: "text-[8px] font-bold tabular-nums",
    sigla: "text-[9px] font-black",
    pad: "min-h-[18px]",
  },
  md: {
    wrap: "gap-1.5 px-2 py-1 text-xs leading-tight",
    time: "text-[10px] font-bold tabular-nums",
    sigla: "text-xs font-black",
    pad: "min-h-[22px]",
  },
};

export function LessonChip({
  lesson,
  getCourse,
  getTeacher,
  size = "sm",
  highlight,
  problematic,
  className = "",
}: {
  lesson: Lesson;
  getCourse: (id: string) => Course | undefined;
  getTeacher: (id: string) => Teacher | undefined;
  size?: Size;
  highlight?: boolean;
  problematic?: boolean;
  className?: string;
}) {
  const color = lessonCourseColor(lesson, getCourse);
  const { courseSigla, teacherSigla, time, title } = lessonChipLabel(
    lesson,
    getCourse,
    getTeacher
  );
  const s = SIZE[size];

  return (
    <span
      className={`flex min-w-0 items-center overflow-hidden rounded ${s.wrap} ${s.pad} text-white ${className} ${
        highlight ? "ring-1 ring-white/80" : ""
      } ${problematic ? "ring-2 ring-amber-300 ring-offset-1" : ""}`}
      style={{ backgroundColor: color }}
      title={`${time} ${courseSigla}-${teacherSigla} · ${title}`}
    >
      <span className={`shrink-0 ${s.time}`}>{time}</span>
      <span className={`min-w-0 truncate ${s.sigla}`}>
        {courseSigla}-{teacherSigla}
      </span>
    </span>
  );
}

export function LessonChipList({
  lessons,
  getCourse,
  getTeacher,
  max,
  size = "sm",
  highlightTeacherId,
  problematicLessonIds,
  layout = "stack",
}: {
  lessons: Lesson[];
  getCourse: (id: string) => Course | undefined;
  getTeacher: (id: string) => Teacher | undefined;
  max: number;
  size?: Size;
  highlightTeacherId?: string;
  problematicLessonIds?: Set<string>;
  layout?: "stack" | "wrap";
}) {
  const visible = lessons.slice(0, max);
  const extra = lessons.length - visible.length;

  return (
    <div
      className={
        layout === "wrap"
          ? "flex flex-wrap gap-0.5"
          : "flex w-full flex-col gap-0.5"
      }
    >
      {visible.map((lesson) => (
        <LessonChip
          key={lesson.id}
          lesson={lesson}
          getCourse={getCourse}
          getTeacher={getTeacher}
          size={size}
          highlight={Boolean(
            highlightTeacherId && lesson.teacherId === highlightTeacherId
          )}
          problematic={problematicLessonIds?.has(lesson.id)}
        />
      ))}
      {extra > 0 && (
        <span className="px-0.5 text-[8px] font-bold text-ink-soft">+{extra}</span>
      )}
    </div>
  );
}
