import Link from "next/link";
import { Download, Headphones, Play } from "lucide-react";

const courses = [
  {
    title: "HACCP Base",
    progress: 62,
    next: "Modulo 4 · Contaminazioni",
    tone: "from-teal/25 to-mint/20",
  },
  {
    title: "Sicurezza sul Lavoro",
    progress: 28,
    next: "Video · DPI e segnaletica",
    tone: "from-azure/20 to-teal/10",
  },
];

export default function StudenteHomePage() {
  return (
    <div className="mx-auto max-w-lg space-y-5 lg:max-w-3xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
          Continua a studiare
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">
          Le tue lezioni
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Pensata per smartphone: play immediato, ascolto e download materiali.
        </p>
      </div>

      <Link
        href="/studente/video"
        className="relative block overflow-hidden rounded-[1.7rem] bg-gradient-to-br from-teal to-teal-deep p-6 text-white shadow-[0_20px_50px_rgba(15,143,138,0.35)]"
      >
        <div className="absolute -right-6 -top-8 h-36 w-36 rounded-full bg-white/15 blur-xl" />
        <div className="absolute bottom-0 right-4 h-24 w-24 rounded-[1.2rem] border border-white/25 bg-white/10 [transform:perspective(600px)_rotateX(50deg)_rotateZ(-12deg)]" />
        <p className="relative text-xs font-bold uppercase tracking-[0.16em] text-white/75">
          Riprendi ora
        </p>
        <h2 className="relative mt-3 font-display text-2xl font-bold">
          HACCP · Video lezione 3
        </h2>
        <p className="relative mt-2 text-sm text-white/80">12 min restanti · audio ottimizzato</p>
        <span className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-teal-deep">
          <Play className="h-4 w-4 fill-current" />
          Guarda / Ascolta
        </span>
      </Link>

      <div className="grid gap-3 sm:grid-cols-2">
        {courses.map((course) => (
          <article
            key={course.title}
            className={`glass overflow-hidden rounded-[1.4rem] bg-gradient-to-br ${course.tone} p-5`}
          >
            <h3 className="font-display text-lg font-bold text-ink">{course.title}</h3>
            <p className="mt-2 text-xs text-ink-soft">{course.next}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
              <div
                className="h-full rounded-full bg-teal"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-semibold text-teal-deep">{course.progress}% completato</p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/studente/video"
          className="glass flex flex-col items-start gap-3 rounded-2xl p-4"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal/10 text-teal-deep">
            <Headphones className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold text-ink">Modalità ascolto</span>
        </Link>
        <Link
          href="/studente/materiali"
          className="glass flex flex-col items-start gap-3 rounded-2xl p-4"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-azure/15 text-azure">
            <Download className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold text-ink">Scarica file</span>
        </Link>
      </div>
    </div>
  );
}
