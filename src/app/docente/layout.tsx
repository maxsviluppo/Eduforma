"use client";

import { AppShell } from "@/components/AppShell";
import {
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  MessageSquare,
  Upload,
  Video,
} from "lucide-react";

const nav = [
  { href: "/docente", label: "Home", icon: LayoutDashboard },
  { href: "/docente/corsi", label: "Corsi", icon: BookOpen },
  { href: "/docente/materiali", label: "Materiali", icon: Upload },
  { href: "/docente/dad", label: "DAD", icon: Video },
  { href: "/docente/valutazioni", label: "Valutazioni", icon: ClipboardCheck },
  { href: "/docente/messaggi", label: "Admin", icon: MessageSquare },
];

export default function DocenteLayout({ children }: { children: React.ReactNode }) {
  return <AppShell roleLabel="Area Docente" nav={nav}>{children}</AppShell>;
}
