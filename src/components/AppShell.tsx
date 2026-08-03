"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./BrandMark";
import { LogOut, type LucideIcon } from "lucide-react";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function AppShell({
  roleLabel,
  nav,
  children,
  mobileHint,
}: {
  roleLabel: string;
  nav: ShellNavItem[];
  children: React.ReactNode;
  mobileHint?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="scene-gradient min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line/70 bg-white/55 p-5 backdrop-blur-xl lg:flex">
          <BrandMark href="/" />
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft">
            {roleLabel}
          </p>
          <nav className="mt-3 flex flex-1 flex-col gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={active}
                  className="shell-nav-link"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/" className="shell-nav-link mt-auto">
            <LogOut className="h-4 w-4" />
            Esci
          </Link>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line/60 bg-white/70 px-4 py-3 backdrop-blur-xl lg:hidden">
            <BrandMark compact href="/" />
            <span className="rounded-full bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-deep">
              {roleLabel}
            </span>
          </header>

          <main className="flex-1 px-4 py-5 md:px-7 md:py-7">{children}</main>

          {mobileHint && (
            <p className="px-4 pb-4 text-center text-[11px] text-ink-soft lg:hidden">
              {mobileHint}
            </p>
          )}

          <nav className="sticky bottom-0 z-20 grid grid-cols-4 gap-1 border-t border-line/60 bg-white/85 px-2 py-2 backdrop-blur-xl lg:hidden">
            {nav.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold ${
                    active ? "bg-teal/10 text-teal-deep" : "text-ink-soft"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
