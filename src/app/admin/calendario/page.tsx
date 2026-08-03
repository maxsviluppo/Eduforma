import type { Metadata } from "next";
import { Suspense } from "react";
import AdminCalendarClient from "./AdminCalendarClient";

export const metadata: Metadata = {
  title: "Calendario corsi",
};

export default function AdminCalendarioPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-line/70 bg-white/50 p-8 text-sm text-ink-soft">
          Caricamento calendario…
        </div>
      }
    >
      <AdminCalendarClient />
    </Suspense>
  );
}
