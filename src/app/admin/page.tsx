import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  School,
  UserPlus,
  Wallet,
} from "lucide-react";

const stats = [
  { label: "Studenti attivi", value: "128" },
  { label: "Corsi in corso", value: "14" },
  { label: "Aule", value: "6" },
  { label: "Rate in scadenza", value: "9" },
];

const modules = [
  {
    title: "Calendario corsi",
    text: "Crea corsi, lezioni, orari, aule, docenti e modalità DAD/aula.",
    href: "/admin/calendario",
    icon: CalendarDays,
  },
  {
    title: "Anagrafe studenti",
    text: "Registrazione, iscrizioni e profilo.",
    href: "/admin/studenti",
    icon: UserPlus,
  },
  {
    title: "Rate & pagamenti",
    text: "Piani di pagamento e stati rate.",
    href: "/admin/pagamenti",
    icon: Wallet,
  },
  {
    title: "Configurazione sede",
    text: "Docenti, aule, branding e accessi.",
    href: "/admin/config",
    icon: School,
  },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
          Dashboard admin
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink md:text-4xl">
          Centro operativo scuola
        </h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Configura calendario, anagrafe, corsi, rate, attestati e autorizzazioni docenti/studenti.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
              {stat.label}
            </p>
            <p className="mt-3 font-display text-3xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="glass group flex items-start justify-between gap-4 rounded-[1.4rem] p-6 transition hover:-translate-y-0.5"
            >
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal/10 text-teal-deep">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 font-display text-xl font-bold text-ink">{mod.title}</h2>
                <p className="mt-2 text-sm text-ink-soft">{mod.text}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 text-ink-soft transition group-hover:translate-x-1 group-hover:text-teal-deep" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
