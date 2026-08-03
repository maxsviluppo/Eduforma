import type { Metadata } from "next";
import AdminCalendarClient from "./AdminCalendarClient";

export const metadata: Metadata = {
  title: "Calendario corsi",
};

export default function AdminCalendarioPage() {
  return <AdminCalendarClient />;
}
