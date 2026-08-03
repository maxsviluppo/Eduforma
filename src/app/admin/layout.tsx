"use client";

import { AppShell } from "@/components/AppShell";
import {
  Building2,
  CalendarDays,
  FileBadge2,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/admin/studenti", label: "Studenti", icon: Users },
  { href: "/admin/pagamenti", label: "Rate", icon: Wallet },
  { href: "/admin/attestati", label: "Attestati", icon: FileBadge2 },
  { href: "/admin/config", label: "Config", icon: Building2 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell roleLabel="Amministrazione" nav={nav}>
      {children}
    </AppShell>
  );
}
