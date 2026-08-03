import Link from "next/link";
import { ArrowUpRight, GraduationCap, Shield, Users } from "lucide-react";

const icons = {
  admin: Shield,
  docente: GraduationCap,
  studente: Users,
} as const;

export function RoleAccessCard({
  id,
  label,
  description,
  href,
  accent,
}: {
  id: keyof typeof icons;
  label: string;
  description: string;
  href: string;
  accent: string;
}) {
  const Icon = icons[id];

  return (
    <Link
      href={href}
      className="depth-card glass group relative block overflow-hidden rounded-[1.6rem] p-6 md:p-7"
      style={{ perspective: "1000px" }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-80 transition-opacity group-hover:opacity-100`}
      />
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-8 flex items-start justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 shadow-sm">
            <Icon className="h-5 w-5 text-teal-deep" strokeWidth={2.2} />
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        <h3 className="font-display text-2xl font-bold text-ink">{label}</h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{description}</p>
        <span className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
          Accedi all&apos;ambiente
        </span>
      </div>
    </Link>
  );
}
