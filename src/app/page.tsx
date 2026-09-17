import Link from "next/link";
import {
  CalendarDays,
  FileStack,
  Video,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneAtmosphere } from "@/components/SceneAtmosphere";
import { RoleAccessCard } from "@/components/RoleAccessCard";
import { ROLES, SITE } from "@/lib/site";

const features = [
  {
    icon: CalendarDays,
    title: "Calendario & orari",
    text: "Corsi, lezioni, aule e disponibilità docenti in un unico piano.",
  },
  {
    icon: FileStack,
    title: "Materiali didattici",
    text: "Dispense, video e download per corso, lezione e ruolo.",
  },
  {
    icon: Video,
    title: "DAD & Expert Call",
    text: "Strumenti per lezioni remote e supporto video verso gli iscritti.",
  },
];

export default function HomePage() {
  return (
    <div className="scene-gradient relative min-h-screen overflow-hidden">
      <SceneAtmosphere />
      <SiteHeader />

      <main className="relative z-10">
        <section className="mx-auto flex max-w-6xl flex-col items-start px-5 pb-16 pt-10 md:px-8 md:pb-24 md:pt-16">
          <p className="rounded-full border border-white/70 bg-white/55 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-deep shadow-sm backdrop-blur">
            SaaS Education OS
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-[0.95] tracking-tight text-ink md:text-7xl">
            {SITE.name}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft md:text-xl">
            {SITE.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#accessi" className="btn-primary">
              Entra nella piattaforma
            </Link>
          </div>
        </section>

        <section id="accessi" className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
          <div className="mb-8 max-w-xl">
            <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
              I tre ambienti della piattaforma
            </h2>
            <p className="mt-3 text-ink-soft">
              Portali dedicati per amministrazione, corpo docenti e studenti iscritti con accessi e strumenti personalizzati.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((role) => (
              <RoleAccessCard key={role.id} {...role} />
            ))}
          </div>
        </section>

        <section id="funzioni" className="mx-auto max-w-6xl px-5 pb-20 md:px-8">
          <div className="glass rounded-[2rem] p-7 md:p-10">
            <h2 className="font-display text-3xl font-bold text-ink">Cosa gestisce</h2>
            <p className="mt-2 max-w-2xl text-ink-soft">
              Dalla configurazione della scuola alla lezione in aula o in DAD.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-line/80 bg-white/70 p-5"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal/10 text-teal-deep">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-bold text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-line/70 bg-white/40 px-5 py-8 text-center text-sm text-ink-soft backdrop-blur md:px-8">
        © {new Date().getFullYear()} AulaNova — piattaforma per centri di formazione
      </footer>
    </div>
  );
}
