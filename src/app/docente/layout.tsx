"use client";

import { AppShell } from "@/components/AppShell";
import { BookOpen, CalendarDays, LayoutDashboard } from "lucide-react";

const nav = [
  { href: "/docente", label: "Home", icon: LayoutDashboard },
  { href: "/docente/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/docente/corsi", label: "Corsi", icon: BookOpen },
];

export default function DocenteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell roleLabel="Area Docente" nav={nav} mobileHint="Scorri le lezioni e apri i link DAD dal telefono">
      {children}
    </AppShell>
  );
}
