"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import {
  COURSE_CATEGORY_LABELS,
  COURSE_COLORS,
  MODALITY_LABELS,
  STATUS_LABELS,
  courseTeacherIds,
  type CourseCategory,
  type CourseStatus,
  type Modality,
} from "@/lib/calendar/types";
import { useRouter } from "next/navigation";

export default function CourseEditClient({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { state, hydrated, getCourse, updateCourse } = useCalendar();
  const course = getCourse(courseId);
  const [savedFlash, setSavedFlash] = useState(false);

  const [draft, setDraft] = useState({
    title: "",
    description: "",
    category: "tecnico" as CourseCategory,
    status: "bozza" as CourseStatus,
    modality: "ibrida" as Modality,
    color: COURSE_COLORS[0] as string,
    schoolId: "",
    roomId: "",
    totalHours: 16,
    daysCount: 1,
    startDate: "",
    endDate: "",
    teacherIds: [] as string[],
    studentCount: 1,
  });

  useEffect(() => {
    if (!course) return;
    setDraft({
      title: course.title,
      description: course.description,
      category: course.category,
      status: course.status,
      modality: course.modality,
      color: course.color,
      schoolId: course.schoolId,
      roomId: course.roomId ?? "",
      totalHours: course.totalHours,
      daysCount: course.daysCount,
      startDate: course.startDate,
      endDate: course.endDate,
      teacherIds: courseTeacherIds(course),
      studentCount: course.studentCount,
    });
  }, [course]);

  const schoolRooms = useMemo(
    () => state.rooms.filter((r) => r.schoolId === draft.schoolId),
    [state.rooms, draft.schoolId]
  );

  if (!hydrated) {
    return (
      <div className="rounded-3xl border border-line/70 bg-white/50 p-8 text-sm text-ink-soft">
        Caricamento…
      </div>
    );
  }

  if (!course) {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <p className="font-display text-xl font-bold text-ink">Corso non trovato</p>
        <Link href="/admin/corsi" className="btn-primary mt-4 inline-flex">
          Torna al catalogo
        </Link>
      </div>
    );
  }

  const toggleTeacher = (id: string) => {
    setDraft((d) => {
      const has = d.teacherIds.includes(id);
      const next = has ? d.teacherIds.filter((x) => x !== id) : [...d.teacherIds, id];
      return { ...d, teacherIds: next };
    });
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const primaryTeacher = draft.teacherIds[0] ?? course.teacherId;
    updateCourse(courseId, {
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      status: draft.status,
      modality: draft.modality,
      color: draft.color,
      schoolId: draft.schoolId,
      roomId: draft.modality === "dad" ? undefined : draft.roomId || undefined,
      totalHours: draft.totalHours,
      daysCount: draft.daysCount,
      startDate: draft.startDate,
      endDate: draft.endDate,
      teacherId: primaryTeacher,
      teacherIds: draft.teacherIds.length > 1 ? draft.teacherIds : undefined,
      studentCount: Math.max(1, draft.studentCount),
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const finalize = () => {
    updateCourse(courseId, { status: "attivo" });
    setDraft((d) => ({ ...d, status: "attivo" }));
    router.push(`/admin/corsi/${courseId}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/admin/corsi/${courseId}`}
          className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-3 py-2 text-sm font-bold text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Scheda corso
        </Link>
        {draft.status === "bozza" && (
          <button type="button" onClick={finalize} className="btn-primary ml-auto gap-2">
            <Sparkles className="h-4 w-4" />
            Finalizza
          </button>
        )}
      </div>

      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-deep">
          Modifica corso
        </p>
        <h1 className="font-display text-3xl font-bold text-ink">{course.title}</h1>
      </header>

      <form onSubmit={save} className="glass space-y-5 rounded-3xl p-5 md:p-6">
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
            Titolo
          </label>
          <input
            required
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
            Descrizione
          </label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            className="min-h-[100px] w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
              Categoria
            </label>
            <select
              value={draft.category}
              onChange={(e) =>
                setDraft((d) => ({ ...d, category: e.target.value as CourseCategory }))
              }
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            >
              {Object.entries(COURSE_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
              Stato
            </label>
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft((d) => ({ ...d, status: e.target.value as CourseStatus }))
              }
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            >
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
              Modalità
            </label>
            <select
              value={draft.modality}
              onChange={(e) =>
                setDraft((d) => ({ ...d, modality: e.target.value as Modality }))
              }
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            >
              {Object.entries(MODALITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
              Colore calendario
            </label>
            <div className="flex flex-wrap gap-2">
              {COURSE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, color }))}
                  className={`h-9 w-9 rounded-full border-2 transition ${
                    draft.color === color ? "border-ink scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
              Scuola
            </label>
            <select
              value={draft.schoolId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, schoolId: e.target.value, roomId: "" }))
              }
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            >
              {state.schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {draft.modality !== "dad" && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
                Aula
              </label>
              <select
                value={draft.roomId}
                onChange={(e) => setDraft((d) => ({ ...d, roomId: e.target.value }))}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              >
                <option value="">— Nessuna —</option>
                {schoolRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
              Ore totali
            </label>
            <input
              type="number"
              min={1}
              value={draft.totalHours}
              onChange={(e) =>
                setDraft((d) => ({ ...d, totalHours: Number(e.target.value) || 0 }))
              }
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
              Giornate
            </label>
            <input
              type="number"
              min={1}
              value={draft.daysCount}
              onChange={(e) =>
                setDraft((d) => ({ ...d, daysCount: Number(e.target.value) || 1 }))
              }
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
              Data inizio
            </label>
            <input
              type="date"
              value={draft.startDate}
              onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
              Data fine
            </label>
            <input
              type="date"
              value={draft.endDate}
              onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
            Docenti
          </label>
          <ul className="max-h-44 space-y-1 overflow-y-auto rounded-2xl border border-line bg-white p-2">
            {state.teachers.map((teacher) => {
              const checked = draft.teacherIds.includes(teacher.id);
              return (
                <li key={teacher.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 hover:bg-teal/5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTeacher(teacher.id)}
                    />
                    <span className="text-sm text-ink">{teacher.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wide text-ink-soft">
            Numero alunni
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={draft.studentCount}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                studentCount: Math.max(1, Number(e.target.value) || 1),
              }))
            }
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
          />
          <p className="text-[11px] text-ink-soft">
            Totale iscritti al corso (solo il numero complessivo).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="submit" className="btn-primary gap-2">
            <Save className="h-4 w-4" />
            Salva modifiche
          </button>
          {savedFlash && (
            <span className="text-sm font-bold text-teal-deep">Salvato</span>
          )}
        </div>
      </form>
    </div>
  );
}
