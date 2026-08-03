import Link from "next/link";
import { Clock3, PlayCircle, Upload } from "lucide-react";

const today = [
  { time: "09:30", course: "HACCP Base", room: "Aula 2 · Ibrida" },
  { time: "14:00", course: "Sicurezza 81/08", room: "DAD Live" },
  { time: "17:30", course: "Expert Call · Gruppo B", room: "Video call" },
];

export default function DocenteHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
          Ciao, Docente
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink md:text-4xl">
          Le tue lezioni di oggi
        </h1>
        <p className="mt-2 text-ink-soft">
          Orari, materiali, DAD e comunicazioni con l&apos;amministrazione.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass rounded-[1.5rem] p-6">
          <h2 className="font-display text-xl font-bold text-ink">Agenda</h2>
          <ul className="mt-5 space-y-3">
            {today.map((item) => (
              <li
                key={item.time + item.course}
                className="flex items-center gap-4 rounded-2xl border border-line/70 bg-white/70 px-4 py-3"
              >
                <span className="flex items-center gap-2 font-semibold text-teal-deep">
                  <Clock3 className="h-4 w-4" />
                  {item.time}
                </span>
                <div>
                  <p className="font-semibold text-ink">{item.course}</p>
                  <p className="text-xs text-ink-soft">{item.room}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <Link
            href="/docente/materiali"
            className="glass flex items-center gap-4 rounded-[1.4rem] p-5 transition hover:-translate-y-0.5"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-azure/15 text-azure">
              <Upload className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-ink">Carica materiale</p>
              <p className="text-sm text-ink-soft">Dispense, slide e video didattici</p>
            </div>
          </Link>
          <Link
            href="/docente/dad"
            className="glass flex items-center gap-4 rounded-[1.4rem] p-5 transition hover:-translate-y-0.5"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal/12 text-teal-deep">
              <PlayCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-bold text-ink">Avvia DAD / Expert</p>
              <p className="text-sm text-ink-soft">Lezione live o supporto video</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
