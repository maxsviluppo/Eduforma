import { timesOverlap, toIsoDate } from "./types";

export type AutoScheduleSlot = {
  startTime: string;
  endTime: string;
};

export type AutoScheduleInput = {
  count: number;
  startDate: string;
  weekdays: number[];
  maxPerWeek: number;
  maxPerMonth: number;
  preferredDates: string[];
  excludedDates: string[];
  /** Per slot: id docente per conflitti orari separati */
  teacherIds?: string[];
  slots: AutoScheduleSlot[];
  /** Lezioni già in calendario (con teacherId per filtro per slot) */
  teacherLessons: Array<{
    date: string;
    startTime: string;
    endTime: string;
    teacherId?: string;
  }>;
  /**
   * Date già usate in questo corso da un altro docente:
   * non assegnare lo stesso giorno a docenti diversi.
   */
  blockedDatesForOtherTeachers?: string[];
};

export type AssignedSlot = {
  date: string;
  slot: AutoScheduleSlot;
  teacherId?: string;
};

function monFirstFromIso(iso: string): number {
  const jsDay = new Date(`${iso}T12:00:00`).getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function weekKey(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.floor((d.getTime() - start.getTime()) / (7 * 86400000));
  return `${d.getFullYear()}-w${week}`;
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** Conflitto orario del docente: stessa data e fasce sovrapposte. */
export function hasTeacherTimeConflict(
  date: string,
  slot: AutoScheduleSlot,
  teacherLessons: AutoScheduleInput["teacherLessons"],
  assigned: AssignedSlot[] = [],
  forTeacherId?: string
): boolean {
  const relevantAssigned = forTeacherId
    ? assigned.filter((entry) => !entry.teacherId || entry.teacherId === forTeacherId)
    : assigned;
  const onDay = [
    ...teacherLessons.filter((l) => l.date === date),
    ...relevantAssigned.filter((a) => a.date === date).map((a) => a.slot),
  ];
  return onDay.some((l) =>
    timesOverlap(l.startTime, l.endTime, slot.startTime, slot.endTime)
  );
}

function fitsLimits(
  iso: string,
  input: AutoScheduleInput,
  weekCount: Map<string, number>,
  monthCount: Map<string, number>,
  relax: number
): boolean {
  if (input.excludedDates.includes(iso)) return false;
  if (iso < input.startDate) return false;
  const allowed = new Set(input.weekdays.length ? input.weekdays : [0, 1, 2, 3, 4]);
  if (!allowed.has(monFirstFromIso(iso))) return false;
  if (relax < 1 && (weekCount.get(weekKey(iso)) ?? 0) >= input.maxPerWeek) return false;
  if (relax < 2 && (monthCount.get(monthKey(iso)) ?? 0) >= input.maxPerMonth) return false;
  return true;
}

function registerDate(
  iso: string,
  weekCount: Map<string, number>,
  monthCount: Map<string, number>
) {
  weekCount.set(weekKey(iso), (weekCount.get(weekKey(iso)) ?? 0) + 1);
  monthCount.set(monthKey(iso), (monthCount.get(monthKey(iso)) ?? 0) + 1);
}

function findDateForSlot(
  slotIndex: number,
  input: AutoScheduleInput,
  weekCount: Map<string, number>,
  monthCount: Map<string, number>,
  assigned: AssignedSlot[]
): string | null {
  const slot = input.slots[slotIndex];
  if (!slot) return null;

  const slotTeacherId = input.teacherIds?.[slotIndex];
  const teacherLessons = slotTeacherId
    ? input.teacherLessons.filter((l) => l.teacherId === slotTeacherId)
    : input.teacherLessons;

  const tryIso = (iso: string, relax: number) => {
    if (!fitsLimits(iso, input, weekCount, monthCount, relax)) return null;
    if (input.blockedDatesForOtherTeachers?.includes(iso)) return null;
    // Stesso corso: niente due docenti diversi nello stesso giorno
    if (
      slotTeacherId &&
      assigned.some(
        (a) => a.date === iso && a.teacherId && a.teacherId !== slotTeacherId
      )
    ) {
      return null;
    }
    if (hasTeacherTimeConflict(iso, slot, teacherLessons, assigned, slotTeacherId)) return null;
    registerDate(iso, weekCount, monthCount);
    assigned.push({ date: iso, slot, teacherId: slotTeacherId });
    return iso;
  };

  const preferred = [...input.preferredDates]
    .filter((d) => !input.excludedDates.includes(d))
    .sort();

  for (const iso of preferred) {
    const found = tryIso(iso, 0);
    if (found) return found;
  }

  for (let relax = 0; relax <= 2; relax += 1) {
    const cursor = new Date(`${input.startDate}T12:00:00`);
    let guard = 0;
    while (guard < 800) {
      const iso = toIsoDate(cursor);
      const found = tryIso(iso, relax);
      if (found) return found;
      cursor.setDate(cursor.getDate() + 1);
      guard += 1;
    }
  }

  return null;
}

/** Genera date lezione evitando escluse e conflitti orari del docente. */
export function autoScheduleLessonDates(input: AutoScheduleInput): string[] {
  const weekCount = new Map<string, number>();
  const monthCount = new Map<string, number>();
  const assigned: AssignedSlot[] = [];
  const dates: string[] = [];

  for (let i = 0; i < input.count; i += 1) {
    const date = findDateForSlot(i, input, weekCount, monthCount, assigned);
    dates.push(date ?? "");
  }

  return dates;
}
