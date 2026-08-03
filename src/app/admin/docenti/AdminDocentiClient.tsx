"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Mail,
  Phone,
  Plus,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import type { Teacher } from "@/lib/calendar/types";
import { scheduledHoursForCourse } from "@/lib/calendar/demo-data";

export default function AdminDocentiClient() {
  const {
    state,
    demoSchoolId,
    addTeacher,
    updateTeacher,
    removeTeacher,
    setCurrentTeacherId,
    getCoursesForTeacher,
    getLessonsForTeacher,
    getSchool,
  } = useCalendar();

  const [selectedId, setSelectedId] = useState(state.teachers[0]?.id ?? "");
  const selected = state.teachers.find((t) => t.id === selectedId);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    schoolId: demoSchoolId,
    bio: "",
    active: true,
  });
  const [mode, setMode] = useState<"edit" | "create">("edit");
  const [saved, setSaved] = useState(false);

  const hydrate = (teacher: Teacher) => {
    setForm({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone ?? "",
      specialty: teacher.specialty,
      schoolId: teacher.schoolId ?? demoSchoolId,
      bio: teacher.bio ?? "",
      active: teacher.active !== false,
    });
  };

  useEffect(() => {
    if (selected && mode === "edit") hydrate(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, mode]);

  const courses = selected ? getCoursesForTeacher(selected.id) : [];
  const lessons = selected ? getLessonsForTeacher(selected.id) : [];
  const school = selected?.schoolId ? getSchool(selected.schoolId) : undefined;

  const startCreate = () => {
    setMode("create");
    setSelectedId("");
    setForm({
      name: "",
      email: "",
      phone: "",
      specialty: "",
      schoolId: demoSchoolId,
      bio: "",
      active: true,
    });
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      specialty: form.specialty.trim(),
      schoolId: form.schoolId,
      bio: form.bio.trim() || undefined,
      active: form.active,
    };
    if (!payload.name || !payload.email) return;

    if (mode === "create") {
      const id = addTeacher(payload);
      setSelectedId(id);
      setMode("edit");
    } else if (selected) {
      updateTeacher(selected.id, payload);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
            Anagrafe
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">Profili docenti</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Crea il docente con scuola e specialità: poi lo colleghi ai corsi dal calendario.
          </p>
        </div>
        <button type="button" onClick={startCreate} className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Nuovo docente
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="glass rounded-[1.4rem] p-3">
          <ul className="space-y-1">
            {state.teachers.map((teacher) => {
              const n = getLessonsForTeacher(teacher.id).length;
              return (
                <li key={teacher.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("edit");
                      setSelectedId(teacher.id);
                      hydrate(teacher);
                    }}
                    className={`w-full rounded-xl px-3 py-3 text-left transition ${
                      selectedId === teacher.id && mode === "edit"
                        ? "bg-teal/12 text-teal-deep"
                        : "hover:bg-white/80"
                    }`}
                  >
                    <p className="text-sm font-bold">{teacher.name}</p>
                    <p className="text-[11px] text-ink-soft">{teacher.specialty}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                      {n} lezioni
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <form onSubmit={save} className="glass-strong space-y-4 rounded-[1.6rem] p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold text-ink">
              {mode === "create" ? "Nuovo profilo docente" : "Modifica profilo"}
            </h2>
            {selected && mode === "edit" && (
              <div className="flex gap-2">
                <Link
                  href="/docente"
                  onClick={() => setCurrentTeacherId(selected.id)}
                  className="btn-ghost !py-2 !px-3 text-xs"
                >
                  <UserRound className="h-3.5 w-3.5" />
                  Apri calendario docente
                </Link>
                <button
                  type="button"
                  className="rounded-full bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600"
                  onClick={() => {
                    if (courses.length > 0) {
                      alert("Prima riassegna o chiudi i corsi collegati a questo docente.");
                      return;
                    }
                    removeTeacher(selected.id);
                    setSelectedId(state.teachers.find((t) => t.id !== selected.id)?.id ?? "");
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 inline mr-1" />
                  Elimina
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              required
              placeholder="Nome e cognome"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            />
            <input
              required
              type="email"
              placeholder="Email (usata per l'accesso)"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            />
            <input
              placeholder="Telefono"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            />
            <input
              required
              placeholder="Specialità"
              value={form.specialty}
              onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            />
          </div>

          <select
            value={form.schoolId}
            onChange={(e) => setForm((f) => ({ ...f, schoolId: e.target.value }))}
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
          >
            {state.schools.map((s) => (
              <option key={s.id} value={s.id}>
                Scuola: {s.name}
              </option>
            ))}
          </select>

          <textarea
            placeholder="Bio / note professionali"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className="min-h-[80px] w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
          />

          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="accent-teal"
            />
            Docente attivo (assegnabile ai corsi)
          </label>

          <button type="submit" className="btn-primary w-full md:w-auto">
            <Save className="h-4 w-4" />
            {saved ? "Salvato" : mode === "create" ? "Crea docente" : "Salva profilo"}
          </button>

          {selected && mode === "edit" && (
            <div className="rounded-2xl border border-line bg-white/70 p-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="inline-flex items-center gap-1.5 text-ink-soft">
                  <Mail className="h-3.5 w-3.5" /> {selected.email}
                </span>
                {selected.phone && (
                  <span className="inline-flex items-center gap-1.5 text-ink-soft">
                    <Phone className="h-3.5 w-3.5" /> {selected.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-ink-soft">
                  <CalendarDays className="h-3.5 w-3.5" /> {lessons.length} lezioni
                </span>
              </div>
              {school && (
                <p className="mt-2 text-xs text-ink-soft">
                  Collegato a: <strong>{school.name}</strong> · {school.city}
                </p>
              )}
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                Corsi assegnati
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {courses.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ background: c.color }}
                  >
                    {c.title} · {scheduledHoursForCourse(state.lessons, c.id)}h
                  </li>
                ))}
                {courses.length === 0 && (
                  <li className="text-xs text-ink-soft">Nessun corso ancora assegnato</li>
                )}
              </ul>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
