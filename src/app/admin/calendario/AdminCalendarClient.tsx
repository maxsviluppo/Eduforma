"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Clock3,
  GraduationCap,
  Plus,
  RefreshCw,
  Users,
  Video,
} from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import type { Lesson, Modality } from "@/lib/calendar/types";
import { scheduledHoursForCourse } from "@/lib/calendar/demo-data";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";
import { SimulationLinksBanner } from "@/components/calendar/SimulationLinksBanner";
import { WeekCalendarGrid } from "@/components/calendar/WeekCalendarGrid";

type Tab = "calendario" | "nuovo-corso" | "risorse";

export default function AdminCalendarClient() {
  const {
    state,
    createCourseWithSchedule,
    addTeacher,
    addRoom,
    resetDemo,
    getCourse,
    getRoom,
    getTeacher,
  } = useCalendar();

  const [tab, setTab] = useState<Tab>("calendario");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const [courseForm, setCourseForm] = useState({
    title: "",
    totalHours: 16,
    teacherId: state.teachers[0]?.id ?? "",
    studentIds: [] as string[],
    modality: "ibrida" as Modality,
    roomId: state.rooms[0]?.id ?? "",
    sessionsCount: 4,
  });

  const [newTeacher, setNewTeacher] = useState({ name: "", email: "", specialty: "" });
  const [newRoom, setNewRoom] = useState({ name: "", capacity: 20 });

  const stats = useMemo(
    () => ({
      teachers: state.teachers.length,
      rooms: state.rooms.length,
      courses: state.courses.length,
      lessons: state.lessons.length,
      students: state.students.length,
      totalHours: state.courses.reduce((s, c) => s + c.totalHours, 0),
    }),
    [state]
  );

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title.trim() || !courseForm.teacherId) return;

    createCourseWithSchedule({
      ...courseForm,
      roomId: courseForm.modality === "dad" ? undefined : courseForm.roomId,
    });

    setCourseForm((f) => ({ ...f, title: "", studentIds: [] }));
    setTab("calendario");
  };

  const toggleStudent = (id: string) => {
    setCourseForm((f) => ({
      ...f,
      studentIds: f.studentIds.includes(id)
        ? f.studentIds.filter((s) => s !== id)
        : [...f.studentIds, id],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
            Pianificazione scuola
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink md:text-4xl">
            Calendario corsi
          </h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Definisci docenti, aule, ore, corsi, iscrizioni e modalità aula / DAD / ibrida.
          </p>
        </div>
        <button
          type="button"
          onClick={resetDemo}
          className="btn-ghost !py-2.5 text-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Reset demo
        </button>
      </div>

      <SimulationLinksBanner />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Docenti", value: stats.teachers, icon: GraduationCap },
          { label: "Aule", value: stats.rooms, icon: Building2 },
          { label: "Corsi", value: stats.courses, icon: CalendarDays },
          { label: "Lezioni", value: stats.lessons, icon: Clock3 },
          { label: "Studenti", value: stats.students, icon: Users },
          { label: "Ore totali", value: stats.totalHours, icon: Video },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 text-ink-soft">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.1em]">
                  {item.label}
                </span>
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-ink">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["calendario", "Vista settimanale"],
            ["nuovo-corso", "Crea corso + lezioni"],
            ["risorse", "Docenti & aule"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              tab === id
                ? "bg-teal text-white shadow-[0_8px_20px_var(--glow)]"
                : "bg-white/70 text-ink-soft hover:bg-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "calendario" && (
        <div className="glass rounded-[1.6rem] p-5 md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-ink">Settimana corrente</h2>
            <div className="flex flex-wrap gap-2">
              {state.courses.map((course) => (
                <span
                  key={course.id}
                  className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-ink"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: course.color }}
                  />
                  {course.title}
                  <span className="text-ink-soft">
                    ({scheduledHoursForCourse(state.lessons, course.id)}/
                    {course.totalHours}h)
                  </span>
                </span>
              ))}
            </div>
          </div>
          <WeekCalendarGrid
            lessons={state.lessons}
            onLessonClick={setSelectedLesson}
          />
        </div>
      )}

      {tab === "nuovo-corso" && (
        <form
          onSubmit={handleCreateCourse}
          className="glass-strong grid gap-6 rounded-[1.6rem] p-6 md:grid-cols-2 md:p-8"
        >
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-ink">Nuovo corso</h2>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                Titolo corso
              </span>
              <input
                required
                value={courseForm.title}
                onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Es. HACCP Avanzato"
                className="w-full rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none ring-teal/30 focus:ring-2"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Ore totali
                </span>
                <input
                  type="number"
                  min={4}
                  max={200}
                  value={courseForm.totalHours}
                  onChange={(e) =>
                    setCourseForm((f) => ({ ...f, totalHours: Number(e.target.value) }))
                  }
                  className="w-full rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none ring-teal/30 focus:ring-2"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                  N. lezioni
                </span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={courseForm.sessionsCount}
                  onChange={(e) =>
                    setCourseForm((f) => ({ ...f, sessionsCount: Number(e.target.value) }))
                  }
                  className="w-full rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none ring-teal/30 focus:ring-2"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                Docente
              </span>
              <select
                value={courseForm.teacherId}
                onChange={(e) => setCourseForm((f) => ({ ...f, teacherId: e.target.value }))}
                className="w-full rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none ring-teal/30 focus:ring-2"
              >
                {state.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.specialty}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                Modalità
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(["aula", "dad", "ibrida"] as Modality[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCourseForm((f) => ({ ...f, modality: m }))}
                    className={`rounded-2xl border px-3 py-3 text-xs font-bold transition ${
                      courseForm.modality === m
                        ? "border-teal bg-teal/10 text-teal-deep"
                        : "border-line bg-white/70 text-ink-soft"
                    }`}
                  >
                    {m === "aula" ? "In aula" : m === "dad" ? "DAD" : "Ibrida"}
                  </button>
                ))}
              </div>
            </label>

            {courseForm.modality !== "dad" && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                  Aula
                </span>
                <select
                  value={courseForm.roomId}
                  onChange={(e) => setCourseForm((f) => ({ ...f, roomId: e.target.value }))}
                  className="w-full rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm outline-none ring-teal/30 focus:ring-2"
                >
                  {state.rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.capacity} posti
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-lg font-bold text-ink">Iscrivi studenti</h3>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-line/70 bg-white/60 p-3">
              {state.students.map((student) => {
                const checked = courseForm.studentIds.includes(student.id);
                return (
                  <label
                    key={student.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                      checked ? "bg-teal/10" : "hover:bg-white/80"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStudent(student.id)}
                      className="h-4 w-4 accent-teal"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink">{student.name}</span>
                      <span className="text-xs text-ink-soft">{student.email}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="rounded-2xl border border-dashed border-teal/25 bg-teal/5 p-4 text-sm text-ink-soft">
              <p className="font-semibold text-ink">Cosa succede al salvataggio</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                <li>Viene creato il corso con colore e date settimana corrente</li>
                <li>Le lezioni si distribuiscono automaticamente lun–ven</li>
                <li>Docente e studenti vedono subito il calendario aggiornato</li>
              </ul>
            </div>

            <button type="submit" className="btn-primary w-full">
              <Plus className="h-4 w-4" />
              Crea corso e genera calendario
            </button>
          </div>
        </form>
      )}

      {tab === "risorse" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="glass rounded-[1.5rem] p-6">
            <h2 className="font-display text-xl font-bold text-ink">Docenti</h2>
            <ul className="mt-4 space-y-2">
              {state.teachers.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-ink-soft">{t.specialty}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-teal-deep">
                    {state.lessons.filter((l) => l.teacherId === t.id).length} lez.
                  </span>
                </li>
              ))}
            </ul>
            <form
              className="mt-4 grid gap-2 border-t border-line/60 pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTeacher.name) return;
                addTeacher(newTeacher.name, newTeacher.email, newTeacher.specialty);
                setNewTeacher({ name: "", email: "", specialty: "" });
              }}
            >
              <input
                placeholder="Nome docente"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher((f) => ({ ...f, name: e.target.value }))}
                className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
              />
              <input
                placeholder="Email"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher((f) => ({ ...f, email: e.target.value }))}
                className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
              />
              <input
                placeholder="Specializzazione"
                value={newTeacher.specialty}
                onChange={(e) => setNewTeacher((f) => ({ ...f, specialty: e.target.value }))}
                className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
              />
              <button type="submit" className="btn-ghost text-sm">
                <Plus className="h-4 w-4" /> Aggiungi docente
              </button>
            </form>
          </div>

          <div className="glass rounded-[1.5rem] p-6">
            <h2 className="font-display text-xl font-bold text-ink">Aule</h2>
            <ul className="mt-4 space-y-2">
              {state.rooms.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-ink">{r.name}</p>
                    <p className="text-xs text-ink-soft">{r.capacity} posti</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-azure">
                    {state.lessons.filter((l) => l.roomId === r.id).length} lez.
                  </span>
                </li>
              ))}
            </ul>
            <form
              className="mt-4 grid gap-2 border-t border-line/60 pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newRoom.name) return;
                addRoom(newRoom.name, newRoom.capacity);
                setNewRoom({ name: "", capacity: 20 });
              }}
            >
              <input
                placeholder="Nome aula"
                value={newRoom.name}
                onChange={(e) => setNewRoom((f) => ({ ...f, name: e.target.value }))}
                className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={4}
                placeholder="Capienza"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom((f) => ({ ...f, capacity: Number(e.target.value) }))}
                className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm"
              />
              <button type="submit" className="btn-ghost text-sm">
                <Plus className="h-4 w-4" /> Aggiungi aula
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedLesson && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-4 backdrop-blur-sm md:items-center"
          onClick={() => setSelectedLesson(null)}
        >
          <div
            className="glass-strong w-full max-w-md rounded-[1.6rem] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const course = getCourse(selectedLesson.courseId);
              const room = selectedLesson.roomId
                ? getRoom(selectedLesson.roomId)
                : undefined;
              const teacher = getTeacher(selectedLesson.teacherId);
              return (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-deep">
                    Dettaglio lezione
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-bold text-ink">
                    {selectedLesson.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-soft">{course?.title}</p>
                  <div className="mt-4 space-y-2 text-sm">
                    <p>
                      <strong>Quando:</strong> {selectedLesson.date} ·{" "}
                      {selectedLesson.startTime}–{selectedLesson.endTime}
                    </p>
                    <p className="flex items-center gap-2">
                      <strong>Modalità:</strong>{" "}
                      <ModalityBadge modality={selectedLesson.modality} />
                    </p>
                    {teacher && (
                      <p>
                        <strong>Docente:</strong> {teacher.name}
                      </p>
                    )}
                    {room && (
                      <p>
                        <strong>Aula:</strong> {room.name}
                      </p>
                    )}
                    {selectedLesson.dadLink && (
                      <p>
                        <strong>Link DAD:</strong>{" "}
                        <a
                          href={selectedLesson.dadLink}
                          className="text-teal-deep underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Apri sessione
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="mt-6 flex gap-2">
                    <Link href="/docente" className="btn-ghost flex-1 text-sm">
                      Vista docente
                    </Link>
                    <Link href="/studente" className="btn-primary flex-1 text-sm">
                      Vista studente
                    </Link>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
