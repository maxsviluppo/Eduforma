"use client";

import { AppShell } from "@/components/AppShell";
import {
  BookOpen,
  Building2,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/scuola", label: "Scuola", icon: Building2 },
  { href: "/admin/docenti", label: "Docenti", icon: GraduationCap },
  { href: "/admin/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/admin/learning", label: "Learning", icon: BookOpen },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell roleLabel="Amministrazione" nav={nav}>
      {children}
    </AppShell>
  );
}
