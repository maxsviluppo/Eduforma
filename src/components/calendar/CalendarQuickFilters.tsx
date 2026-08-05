"use client";

import { useMemo, useState } from "react";
import { BookOpen, Building2, ChevronDown, GraduationCap, SlidersHorizontal, X } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import {
  EMPTY_CALENDAR_LESSON_FILTERS,
  hasActiveLessonFilters,
  toggleFilterId,
  type CalendarLessonFilters,
} from "@/lib/calendar/lesson-filters";

function FilterChip({
  active,
  onClick,
  children,
  compact,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border font-bold transition ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      } ${
        active
          ? "border-teal bg-teal text-white shadow-sm"
          : "border-line/70 bg-white/80 text-ink-soft hover:border-teal/40 hover:bg-white hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function FilterRow({
  label,
  icon: Icon,
  allLabel,
  items,
  selectedIds,
  onChange,
  compact,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allLabel: string;
  items: { id: string; label: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  compact?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p
        className={`flex items-center gap-1.5 font-bold uppercase tracking-[0.12em] text-ink-soft ${
          compact ? "text-[9px]" : "text-[10px]"
        }`}
      >
        <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        {label}
        {selectedIds.length > 0 && (
          <span className="rounded-full bg-teal/15 px-1.5 py-0.5 text-[9px] font-bold normal-case tracking-normal text-teal-deep">
            {selectedIds.length}
          </span>
        )}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          active={selectedIds.length === 0}
          onClick={() => onChange([])}
          compact={compact}
        >
          {allLabel}
        </FilterChip>
        {items.map((item) => (
          <FilterChip
            key={item.id}
            active={selectedIds.includes(item.id)}
            onClick={() => onChange(toggleFilterId(selectedIds, item.id))}
            compact={compact}
          >
            {item.label}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

function activeFilterCount(filters: CalendarLessonFilters): number {
  return filters.schoolIds.length + filters.teacherIds.length + filters.courseIds.length;
}

export function CalendarQuickFilters({
  filters,
  onChange,
  compact = false,
}: {
  filters: CalendarLessonFilters;
  onChange: (filters: CalendarLessonFilters) => void;
  compact?: boolean;
}) {
  const { state } = useCalendar();
  const [open, setOpen] = useState(false);

  const schools = useMemo(
    () =>
      [...state.schools]
        .sort((a, b) => a.name.localeCompare(b.name, "it"))
        .map((s) => ({ id: s.id, label: s.name })),
    [state.schools]
  );

  const teachers = useMemo(
    () =>
      [...state.teachers]
        .filter((t) => t.active !== false)
        .sort((a, b) => a.name.localeCompare(b.name, "it"))
        .map((t) => ({ id: t.id, label: t.name })),
    [state.teachers]
  );

  const courses = useMemo(
    () =>
      [...state.courses]
        .sort((a, b) => a.title.localeCompare(b.title, "it"))
        .map((c) => ({
          id: c.id,
          label: c.title.length > 36 ? `${c.title.slice(0, 34)}…` : c.title,
        })),
    [state.courses]
  );

  const active = hasActiveLessonFilters(filters);
  const count = activeFilterCount(filters);

  return (
    <div className="overflow-hidden rounded-2xl border border-line/60 bg-white/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="calendar-quick-filters-panel"
        className={`flex w-full items-center justify-between gap-2 text-left transition hover:bg-white/70 ${
          compact ? "px-2.5 py-2" : "px-3 py-2.5 md:px-4 md:py-3"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <SlidersHorizontal
            className={`shrink-0 text-teal-deep ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`}
          />
          <span
            className={`font-bold uppercase tracking-[0.12em] text-ink ${
              compact ? "text-[9px]" : "text-[10px] md:text-xs"
            }`}
          >
            Filtri rapidi
          </span>
          {active && (
            <span
              className={`rounded-full bg-teal font-bold text-white ${
                compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
              }`}
            >
              {count}
            </span>
          )}
        </span>
        <ChevronDown
          className={`shrink-0 text-ink-soft transition-transform duration-200 ${
            compact ? "h-4 w-4" : "h-5 w-5"
          } ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        id="calendar-quick-filters-panel"
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`space-y-3 border-t border-line/60 ${
              compact ? "p-2.5" : "p-3 md:p-4"
            }`}
          >
            {active && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onChange(EMPTY_CALENDAR_LESSON_FILTERS)}
                  className={`inline-flex items-center gap-1 rounded-full bg-ink/5 font-bold text-ink-soft transition hover:bg-ink/10 ${
                    compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
                  }`}
                >
                  <X className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                  Azzera filtri
                </button>
              </div>
            )}

            <FilterRow
              label="Scuole"
              icon={Building2}
              allLabel="Tutte"
              items={schools}
              selectedIds={filters.schoolIds}
              onChange={(schoolIds) => onChange({ ...filters, schoolIds })}
              compact={compact}
            />
            <FilterRow
              label="Docenti"
              icon={GraduationCap}
              allLabel="Tutti"
              items={teachers}
              selectedIds={filters.teacherIds}
              onChange={(teacherIds) => onChange({ ...filters, teacherIds })}
              compact={compact}
            />
            <FilterRow
              label="Corsi"
              icon={BookOpen}
              allLabel="Tutti"
              items={courses}
              selectedIds={filters.courseIds}
              onChange={(courseIds) => onChange({ ...filters, courseIds })}
              compact={compact}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
