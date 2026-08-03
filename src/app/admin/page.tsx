import type { Metadata } from "next";
import AdminHomeClient from "./AdminHomeClient";

export const metadata: Metadata = {
  title: "Dashboard admin",
};

export default function AdminHomePage() {
  return <AdminHomeClient />;
}
