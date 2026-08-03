"use client";

import { CalendarProvider } from "@/lib/calendar/CalendarProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <CalendarProvider>{children}</CalendarProvider>;
}
