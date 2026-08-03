import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/site";

export function PricingGrid() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {PLANS.map((plan) => (
        <article
          key={plan.id}
          className={`relative overflow-hidden rounded-[1.75rem] p-7 transition-transform duration-300 hover:-translate-y-1 ${
            plan.highlight
              ? "glass-strong ring-1 ring-teal/25"
              : "glass"
          }`}
        >
          {plan.highlight && (
            <span className="absolute right-5 top-5 rounded-full bg-teal px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
              Consigliato
            </span>
          )}
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">
            {plan.name}
          </p>
          <div className="mt-4 flex items-end gap-1">
            {plan.price !== "Su misura" ? (
              <>
                <span className="font-display text-5xl font-bold tracking-tight text-ink">
                  €{plan.price}
                </span>
                <span className="mb-2 text-sm font-semibold text-ink-soft">
                  {plan.period}
                </span>
              </>
            ) : (
              <span className="font-display text-4xl font-bold tracking-tight text-ink">
                Su misura
              </span>
            )}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">{plan.blurb}</p>
          <ul className="mt-7 space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-ink">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal/12 text-teal-deep">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href={`/accesso/admin?piano=${plan.id}`}
            className={`mt-8 w-full ${plan.highlight ? "btn-primary" : "btn-ghost"}`}
          >
            {plan.id === "enterprise" ? "Parla con noi" : "Inizia con " + plan.name}
          </Link>
        </article>
      ))}
    </div>
  );
}
