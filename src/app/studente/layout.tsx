"use client";

import { AppShell } from "@/components/AppShell";
import {
  BookOpen,
  Download,
  Home,
  PlayCircle,
  UserRound,
} from "lucide-react";

const nav = [
  { href: "/studente", label: "Home", icon: Home },
  { href: "/studente/corsi", label: "Corsi", icon: BookOpen },
  { href: "/studente/video", label: "Video", icon: PlayCircle },
  { href: "/studente/materiali", label: "File", icon: Download },
  { href: "/studente/profilo", label: "Profilo", icon: UserRound },
];

export default function StudenteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      roleLabel="Area Studente"
      nav={nav}
      mobileHint="Ottimizzato per lezioni in mobilità — play e download rapidi"
    >
      {children}
    </AppShell>
  );
}
