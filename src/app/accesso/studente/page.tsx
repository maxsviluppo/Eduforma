import type { Metadata } from "next";
import { AccessForm } from "@/components/AccessForm";
import { SceneAtmosphere } from "@/components/SceneAtmosphere";

export const metadata: Metadata = {
  title: "Accesso Studente",
};

export default function AccessoStudentePage() {
  return (
    <div className="scene-gradient relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <SceneAtmosphere />
      <div className="relative z-10 w-full max-w-md">
        <AccessForm role="studente" />
      </div>
    </div>
  );
}
