"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./BrandMark";
import { LogOut, Menu, PanelLeftClose, type LucideIcon } from "lucide-react";

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
  defaultSidebarOpen = false,
}: {
  roleLabel: string;
  nav: ShellNavItem[];
  children: React.ReactNode;
  mobileHint?: string;
  defaultSidebarOpen?: boolean;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen);
  const cols = Math.min(Math.max(nav.length, 2), 5);

  return (
    <div className="scene-gradient min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1700px]">
        {/* Desktop Sidebar (vertical, collapsible, closed by default) */}
        {sidebarOpen && (
          <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line/70 bg-white/75 p-5 backdrop-blur-xl transition-all duration-200 lg:flex">
            <div className="flex items-center justify-between">
              <BrandMark href="/" />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl p-1.5 text-ink-soft transition hover:bg-slate-100 hover:text-ink"
                title="Nascondi menu laterale"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft">
              {roleLabel}
            </p>
            <nav className="mt-3 flex flex-1 flex-col gap-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/admin" &&
                    item.href !== "/docente" &&
                    item.href !== "/studente" &&
                    pathname.startsWith(item.href));
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
        )}

        {/* Mobile Slide-over Drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="flex h-full w-72 flex-col border-r border-line/80 bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <BrandMark href="/" />
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-xl p-1.5 text-ink-soft hover:bg-slate-100"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft">
                {roleLabel}
              </p>
              <nav className="mt-3 flex flex-1 flex-col gap-1">
                {nav.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    (item.href !== "/admin" &&
                      item.href !== "/docente" &&
                      item.href !== "/studente" &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
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
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
          {/* Top Bar: Logo on far left -> Menu open icon -> Horizontal extended menu when closed -> Role badge */}
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line/60 bg-white/80 px-4 py-2.5 backdrop-blur-xl">
            <div className="flex min-w-0 items-center gap-3">
              {/* Logo always on far left */}
              <div className="shrink-0">
                <BrandMark compact href="/" />
              </div>

              {/* Menu toggle icon right after logo */}
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition shadow-xs ${
                  sidebarOpen
                    ? "border-line bg-white text-ink hover:bg-slate-50"
                    : "border-teal/30 bg-teal/10 text-teal-deep hover:bg-teal/20"
                }`}
                title={
                  sidebarOpen
                    ? "Chiudi menu laterale"
                    : "Apri menu laterale a scomparsa"
                }
              >
                {sidebarOpen ? (
                  <>
                    <PanelLeftClose className="h-4 w-4 text-ink-soft" />
                    <span className="hidden sm:inline">Chiudi menu</span>
                  </>
                ) : (
                  <>
                    <Menu className="h-4 w-4 text-teal-deep" />
                    <span className="hidden sm:inline">Menu</span>
                  </>
                )}
              </button>

              {/* Extended horizontal menu when sidebar is closed */}
              {!sidebarOpen && (
                <nav className="hidden min-w-0 items-center gap-1 overflow-x-auto py-0.5 md:flex">
                  {nav.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.href ||
                      (item.href !== "/admin" &&
                        item.href !== "/docente" &&
                        item.href !== "/studente" &&
                        pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        data-active={active}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                          active
                            ? "bg-teal text-white shadow-xs"
                            : "text-ink-soft hover:bg-slate-100/90 hover:text-ink"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-deep">
                {roleLabel}
              </span>
              <Link
                href="/"
                className="hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-ink-soft transition hover:bg-slate-100 hover:text-ink sm:inline-flex"
                title="Esci dall'area"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Esci</span>
              </Link>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 md:px-7 md:py-7">{children}</main>

          {mobileHint && (
            <p className="px-4 pb-3 text-center text-[11px] text-ink-soft lg:hidden">
              {mobileHint}
            </p>
          )}

          {/* Mobile bottom nav */}
          <nav
            className="fixed bottom-0 left-0 right-0 z-20 border-t border-line/60 bg-white/90 px-2 py-2 backdrop-blur-xl lg:hidden"
            style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
          >
            <div
              className="mx-auto grid max-w-lg gap-1"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {nav.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/admin" &&
                    item.href !== "/docente" &&
                    item.href !== "/studente" &&
                    pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-semibold ${
                      active ? "bg-teal/10 text-teal-deep" : "text-ink-soft"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
