import Link from "next/link";

export function BrandMark({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="group inline-flex items-center gap-3">
      <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal to-teal-deep shadow-[0_10px_24px_rgba(15,143,138,0.35)]">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.55),transparent_55%)]" />
        <span className="relative font-display text-lg font-bold text-white">A</span>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-bold tracking-tight text-ink group-hover:text-teal-deep transition-colors">
            AulaNova
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
            Education OS
          </span>
        </span>
      )}
    </Link>
  );
}
