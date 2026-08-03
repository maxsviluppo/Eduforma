"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "./BrandMark";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

const copy = {
  admin: {
    title: "Accesso Amministrazione",
    subtitle: "Configura scuola, corsi, calendario e anagrafe.",
    demo: "/admin",
  },
  docente: {
    title: "Accesso Docente",
    subtitle: "Materiali, lezioni, DAD e valutazioni.",
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
  const meta = copy[role];

  return (
    <div className="glass-strong w-full max-w-md rounded-[1.8rem] p-7 md:p-8">
      <BrandMark compact={false} href="/" />
      <h1 className="mt-8 font-display text-3xl font-bold text-ink">{meta.title}</h1>
      <p className="mt-2 text-sm text-ink-soft">{meta.subtitle}</p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
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
              placeholder="nome@centro.it"
              className="w-full rounded-2xl border border-line bg-white/80 py-3.5 pl-11 pr-4 text-sm outline-none ring-teal/30 transition focus:ring-2"
              defaultValue={
                role === "admin"
                  ? "admin@aula.nova"
                  : role === "docente"
                    ? "docente@aula.nova"
                    : "studente@aula.nova"
              }
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
        <button type="submit" className="btn-primary mt-2 w-full">
          Entra in {role === "admin" ? "Admin" : role === "docente" ? "Docente" : "Studente"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-ink-soft">
        Demo aperta —{" "}
        <Link href={meta.demo} className="font-semibold text-teal-deep underline-offset-2 hover:underline">
          entra senza login
        </Link>
      </p>
    </div>
  );
}
