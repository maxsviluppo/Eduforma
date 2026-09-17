"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Building2,
  Clock3,
  DoorClosed,
  GraduationCap,
  Users,
} from "lucide-react";
import {
  lessonChipLabel,
  lessonCourseColor,
} from "@/lib/calendar/calendar-display";
import {
  COURSE_CATEGORY_LABELS,
  type Course,
  type Lesson,
  type Room,
  type School,
  type Teacher,
} from "@/lib/calendar/types";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";
import { useCalendar } from "@/lib/calendar/CalendarProvider";

type Size = "xs" | "sm" | "md";

const SIZE: Record<
  Size,
  {
    wrap: string;
    time: string;
    sigla: string;
    pad: string;
    school: string;
    students: string;
  }
> = {
  xs: {
    wrap: "gap-1 px-1.5 py-0.5 text-[10px] leading-tight",
    time: "text-[9px] font-bold tabular-nums opacity-95",
    sigla: "text-[10px] font-black",
    pad: "min-h-[18px]",
    school: "text-[9px] px-1 py-0.2",
    students: "text-[9px] px-1 py-0.2",
  },
  sm: {
    wrap: "gap-1 px-1.5 py-0.5 text-[9px] leading-tight",
    time: "text-[8px] font-bold tabular-nums",
    sigla: "text-[9px] font-black",
    pad: "min-h-[19px]",
    school: "text-[8px] px-1 py-0.5",
    students: "text-[8px] px-1 py-0.5",
  },
  md: {
    wrap: "gap-1.5 px-2 py-1 text-xs leading-tight",
    time: "text-[10px] font-bold tabular-nums",
    sigla: "text-xs font-black",
    pad: "min-h-[22px]",
    school: "text-[9px] px-1.5 py-0.5",
    students: "text-[9px] px-1.5 py-0.5",
  },
};

export function LessonChip({
  lesson,
  getCourse,
  getTeacher,
  getSchool: getSchoolProp,
  getRoom: getRoomProp,
  size = "sm",
  highlight,
  problematic,
  className = "",
  onSelectLesson,
}: {
  lesson: Lesson;
  getCourse: (id: string) => Course | undefined;
  getTeacher: (id: string) => Teacher | undefined;
  getSchool?: (id: string) => School | undefined;
  getRoom?: (id: string) => Room | undefined;
  size?: Size;
  highlight?: boolean;
  problematic?: boolean;
  className?: string;
  onSelectLesson?: (lesson: Lesson) => void;
}) {
  const { getSchool: getSchoolCtx, getRoom: getRoomCtx } = useCalendar();
  const getSchool = getSchoolProp ?? getSchoolCtx;
  const getRoom = getRoomProp ?? getRoomCtx;

  const course = getCourse(lesson.courseId);
  const teacher = getTeacher(lesson.teacherId);
  const room = lesson.roomId && getRoom ? getRoom(lesson.roomId) : undefined;
  const school =
    course && getSchool
      ? getSchool(room ? room.schoolId : course.schoolId)
      : undefined;

  const color = lessonCourseColor(lesson, getCourse);
  const { courseSigla, teacherSigla, schoolSigla, studentCount, time, title } =
    lessonChipLabel(lesson, getCourse, getTeacher, getSchool);
  const s = SIZE[size];

  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState<{
    x: number;
    y: number;
    placeAbove: boolean;
  }>({
    x: 0,
    y: 0,
    placeAbove: false,
  });

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipHeight = 280;
    const placeAbove =
      rect.bottom + tooltipHeight > window.innerHeight &&
      rect.top > tooltipHeight;

    const tooltipHalfWidth = 160;
    const targetX = rect.left + rect.width / 2;
    const clampedX = Math.min(
      Math.max(targetX, tooltipHalfWidth + 12),
      window.innerWidth - tooltipHalfWidth - 12
    );

    const targetY = placeAbove ? rect.top - 8 : rect.bottom + 8;

    setCoords({
      x: clampedX,
      y: targetY,
      placeAbove,
    });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          if (onSelectLesson) {
            e.preventDefault();
            e.stopPropagation();
            setShowTooltip(false);
            onSelectLesson(lesson);
          }
        }}
        className={`relative flex min-w-0 cursor-pointer items-center overflow-hidden rounded text-white shadow-xs transition-all hover:brightness-110 hover:shadow-sm ${s.wrap} ${s.pad} ${className} ${
          highlight ? "ring-1 ring-white/80" : ""
        } ${problematic ? "ring-2 ring-amber-300 ring-offset-1" : ""}`}
        style={{ backgroundColor: color }}
        title={`${time} ${courseSigla}-${teacherSigla} ${
          schoolSigla ? `· ${schoolSigla}` : ""
        } ${studentCount > 0 ? `· +${studentCount}` : ""} · ${title}`}
      >
        <span className={`shrink-0 font-bold tabular-nums ${s.time}`}>
          {time}
        </span>
        <span className={`min-w-0 truncate ${s.sigla}`}>
          {courseSigla}-{teacherSigla}
        </span>
        {schoolSigla && (
          <span
            className={`shrink-0 rounded bg-black/25 font-bold tracking-tight opacity-95 ${s.school}`}
            title={`Scuola: ${school?.name ?? schoolSigla}`}
          >
            {schoolSigla}
          </span>
        )}
        {studentCount > 0 && (
          <span
            className={`shrink-0 rounded bg-black/25 font-bold tracking-tight opacity-95 ${s.students}`}
            title={`${studentCount} alunni partecipanti`}
          >
            +{studentCount}
          </span>
        )}
      </span>

      {showTooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[9999] w-[320px] max-w-[92vw] -translate-x-1/2 select-none"
            style={{
              left: `${coords.x}px`,
              top: coords.placeAbove ? undefined : `${coords.y}px`,
              bottom: coords.placeAbove
                ? `${window.innerHeight - coords.y}px`
                : undefined,
            }}
          >
            <div
              className="overflow-hidden rounded-2xl border border-line/80 bg-white/98 text-ink shadow-2xl backdrop-blur-xl ring-1 ring-black/5"
              style={{
                borderTopWidth: 4,
                borderTopColor: color,
              }}
            >
              <div className="border-b border-line/60 bg-slate-50/80 px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 truncate text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {course
                      ? COURSE_CATEGORY_LABELS[course.category] ??
                        course.category
                      : "Corso"}
                  </span>
                  <ModalityBadge modality={lesson.modality} compact />
                </div>
                <h4 className="mt-1 font-display text-sm font-bold leading-snug text-ink">
                  {course?.title ?? lesson.title}
                </h4>
              </div>

              <div className="space-y-2.5 p-3.5 text-xs">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                    Lezione
                  </p>
                  <p className="mt-0.5 text-xs font-bold leading-snug text-ink">
                    {lesson.title}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-xl border border-line/60 bg-slate-50/90 p-2">
                  <div className="flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 shrink-0 text-teal-deep" />
                    <div>
                      <p className="text-[9px] font-semibold uppercase text-ink-soft">
                        Orario
                      </p>
                      <p className="text-xs font-bold text-ink">
                        {lesson.startTime} – {lesson.endTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 shrink-0 text-teal-deep" />
                    <div>
                      <p className="text-[9px] font-semibold uppercase text-ink-soft">
                        Partecipanti
                      </p>
                      <p className="text-xs font-bold text-ink">
                        {studentCount > 0
                          ? `${studentCount} alunni`
                          : "0 alunni"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] text-ink-soft">
                  {school && (
                    <div className="flex items-start gap-1.5">
                      <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-ink">
                          {school.name}
                        </span>
                        {schoolSigla && (
                          <span className="ml-1 rounded bg-teal/10 px-1 py-0.2 text-[9px] font-bold text-teal-deep">
                            {schoolSigla}
                          </span>
                        )}
                        {school.city ? ` · ${school.city}` : ""}
                      </div>
                    </div>
                  )}

                  {teacher && (
                    <div className="flex items-start gap-1.5">
                      <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                      <div className="min-w-0 flex-1">
                        Docente:{" "}
                        <strong className="font-semibold text-ink">
                          {teacher.name}
                        </strong>
                        {teacher.specialty ? ` (${teacher.specialty})` : ""}
                      </div>
                    </div>
                  )}

                  {room && (
                    <div className="flex items-start gap-1.5">
                      <DoorClosed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                      <div className="min-w-0 flex-1">
                        Aula:{" "}
                        <strong className="font-semibold text-ink">
                          {room.name}
                        </strong>
                        {room.capacity ? ` · max ${room.capacity} posti` : ""}
                      </div>
                    </div>
                  )}

                  {lesson.notes && (
                    <div className="mt-1 rounded-lg border border-amber-200/80 bg-amber-50/80 p-2 text-[11px] text-amber-950">
                      <span className="font-bold">Nota:</span> {lesson.notes}
                    </div>
                  )}

                  {lesson.needsReschedule && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-red-50 p-1.5 text-[10px] font-bold text-red-700">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>Richiesta riprogrammazione data</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export function LessonChipList({
  lessons,
  getCourse,
  getTeacher,
  getSchool,
  getRoom,
  max,
  size = "sm",
  highlightTeacherId,
  problematicLessonIds,
  layout = "stack",
  onSelectLesson,
}: {
  lessons: Lesson[];
  getCourse: (id: string) => Course | undefined;
  getTeacher: (id: string) => Teacher | undefined;
  getSchool?: (id: string) => School | undefined;
  getRoom?: (id: string) => Room | undefined;
  max: number;
  size?: Size;
  highlightTeacherId?: string;
  problematicLessonIds?: Set<string>;
  layout?: "stack" | "wrap";
  onSelectLesson?: (lesson: Lesson) => void;
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
          getSchool={getSchool}
          getRoom={getRoom}
          size={size}
          highlight={Boolean(
            highlightTeacherId && lesson.teacherId === highlightTeacherId
          )}
          problematic={problematicLessonIds?.has(lesson.id)}
          onSelectLesson={onSelectLesson}
        />
      ))}
      {extra > 0 && (
        <span className="px-0.5 text-[10px] font-bold text-ink-soft">
          +{extra}
        </span>
      )}
    </div>
  );
}
