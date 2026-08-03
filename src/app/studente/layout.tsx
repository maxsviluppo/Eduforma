"use client";

import { AppShell } from "@/components/AppShell";
import { BookOpen, Home } from "lucide-react";

const nav = [
  { href: "/studente", label: "Home", icon: Home },
  { href: "/studente/corsi", label: "Calendario", icon: BookOpen },
];

export default function StudenteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      roleLabel="Area Studente"
      nav={nav}
      mobileHint="Lezioni e calendario sempre a portata di tap"
    >
      {children}
    </AppShell>
  );
}
