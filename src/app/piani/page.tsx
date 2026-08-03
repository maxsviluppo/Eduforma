import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneAtmosphere } from "@/components/SceneAtmosphere";
import { PricingGrid } from "@/components/PricingGrid";

export const metadata: Metadata = {
  title: "Piani abbonamento",
  description: "Tre fasce AulaNova: Start, Campus ed Enterprise per centri di formazione.",
};

export default function PianiPage() {
  return (
    <div className="scene-gradient relative min-h-screen overflow-hidden">
      <SceneAtmosphere />
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-24 pt-10 md:px-8 md:pt-14">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-deep">
          Pricing
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight text-ink md:text-6xl">
          Tre fasce. Scali quando cresci.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-soft">
          Start per partire, Campus per gestire il centro a regime, Enterprise per multi-sede
          e custom. Il dettaglio moduli lo impostiamo insieme.
        </p>
        <div className="mt-12">
          <PricingGrid />
        </div>
        <div className="mt-12 glass rounded-[1.75rem] p-7 md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Serve un demo guidato?</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Entra negli ambienti demo e prova subito admin, docente e studente.
            </p>
          </div>
          <Link href="/#accessi" className="btn-primary mt-5 md:mt-0">
            Apri gli accessi
          </Link>
        </div>
      </main>
    </div>
  );
}
