"use client";

import { CalendarProvider } from "@/lib/calendar/CalendarProvider";
import { LearningProvider } from "@/lib/learning/LearningProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CalendarProvider>
      <LearningProvider>{children}</LearningProvider>
    </CalendarProvider>
  );
}
