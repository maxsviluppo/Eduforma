"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BrandMark } from "./BrandMark";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";

const copy = {
  admin: {
    title: "Accesso Amministrazione",
    subtitle: "Configura scuola, docenti, corsi e calendario.",
    demo: "/admin",
  },
  docente: {
    title: "Accesso Docente",
    subtitle: "Entra con l'email del profilo creato dall'admin.",
    demo: "/docente",
  },
  studente: {
    title: "Accesso Studente",
    subtitle: "Corsi, video e materiali sempre con te.",
    demo: "/studente",
  },
} as const;

export function AccessForm({ role }: { role: keyof typeof copy }) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState(
    role === "admin"
      ? "admin@aula.nova"
      : role === "docente"
        ? "marco.bianchi@centro.it"
        : "laura.verdi@email.it"
  );
  const [error, setError] = useState("");
  const { state, loginAsTeacherEmail, setCurrentStudentId } = useCalendar();
  const meta = copy[role];

  const teacherHint = useMemo(
    () =>
      role === "docente"
        ? state.teachers.map((t) => t.email).slice(0, 3).join(" · ")
        : "",
    [role, state.teachers]
  );

  const studentHint = useMemo(
    () =>
      role === "studente"
        ? (state.students ?? []).map((s) => s.email).slice(0, 3).join(" · ")
        : "",
    [role, state.students]
  );

  return (
    <div className="glass-strong w-full max-w-md rounded-[1.8rem] p-7 md:p-8">
      <BrandMark compact={false} href="/" />
      <h1 className="mt-8 font-display text-3xl font-bold text-ink">{meta.title}</h1>
      <p className="mt-2 text-sm text-ink-soft">{meta.subtitle}</p>
      {role === "docente" && teacherHint && (
        <p className="mt-2 text-[11px] text-ink-soft">
          Demo docenti: {teacherHint}
        </p>
      )}
      {role === "studente" && studentHint && (
        <p className="mt-2 text-[11px] text-ink-soft">
          Demo allievi: {studentHint}
        </p>
      )}

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          if (role === "docente") {
            const teacher = loginAsTeacherEmail(email);
            if (!teacher) {
              setError("Nessun docente con questa email. Crealo prima in Admin → Docenti.");
              return;
            }
            window.location.href = meta.demo;
            return;
          }
          if (role === "studente") {
            const student = state.students.find(
              (s) => s.email.toLowerCase() === email.trim().toLowerCase()
            );
            if (student) setCurrentStudentId(student.id);
          }
          window.location.href = meta.demo;
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
            Email
          </span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@centro.it"
              className="w-full rounded-2xl border border-line bg-white/80 py-3.5 pl-11 pr-4 text-sm outline-none ring-teal/30 transition focus:ring-2"
            />
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
            Password
          </span>
          <span className="relative block">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              required
              type={show ? "text" : "password"}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-line bg-white/80 py-3.5 pl-11 pr-12 text-sm outline-none ring-teal/30 transition focus:ring-2"
              defaultValue="demo"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
              aria-label="Mostra password"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
        </label>
        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
        )}
        <button type="submit" className="btn-primary mt-2 w-full">
          Entra in {role === "admin" ? "Admin" : role === "docente" ? "Docente" : "Studente"}
        </button>
      </form>

      <div className="mt-5 text-center text-xs text-ink-soft">
        {role === "docente" ? (
          <div>
            Oppure scegli un docente:{" "}
            {state.teachers.slice(0, 3).map((t, i) => (
              <span key={t.id}>
                {i > 0 && " · "}
                <button
                  type="button"
                  className="font-semibold text-teal-deep underline-offset-2 hover:underline"
                  onClick={() => {
                    loginAsTeacherEmail(t.email);
                    window.location.href = meta.demo;
                  }}
                >
                  {t.name.split(" ")[0]}
                </button>
              </span>
            ))}
          </div>
        ) : role === "studente" ? (
          <div className="space-y-1.5">
            <div>
              Oppure entra come allievo demo:{" "}
              {state.students.slice(0, 3).map((s, i) => (
                <span key={s.id}>
                  {i > 0 && " · "}
                  <button
                    type="button"
                    className="font-semibold text-teal-deep underline-offset-2 hover:underline"
                    onClick={() => {
                      setCurrentStudentId(s.id);
                      window.location.href = meta.demo;
                    }}
                  >
                    {s.name.split(" ")[0]}
                  </button>
                </span>
              ))}
            </div>
            <div>
              <Link
                href={meta.demo}
                className="text-[11px] font-medium text-ink-soft underline-offset-2 hover:underline"
              >
                o entra subito come ospite
              </Link>
            </div>
          </div>
        ) : (
          <div>
            Demo aperta —{" "}
            <Link
              href={meta.demo}
              className="font-semibold text-teal-deep underline-offset-2 hover:underline"
            >
              entra senza login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
