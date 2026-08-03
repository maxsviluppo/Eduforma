import Link from "next/link";
import { BrandMark } from "./BrandMark";

const links = [
  { href: "/#accessi", label: "Accessi" },
  { href: "/piani", label: "Piani" },
  { href: "/#funzioni", label: "Funzioni" },
];

export function SiteHeader() {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8">
      <BrandMark />
      <nav className="hidden items-center gap-8 md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Link href="/#accessi" className="btn-ghost !py-2.5 !px-4 text-sm">
          Entra
        </Link>
        <Link href="/piani" className="btn-primary !py-2.5 !px-4 text-sm">
          Vedi piani
        </Link>
      </div>
    </header>
  );
}
