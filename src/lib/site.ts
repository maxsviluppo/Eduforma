export const SITE = {
  name: "AulaNova",
  tagline: "La scuola, organizzata.",
  description:
    "Piattaforma SaaS per centri di formazione: calendario, corsi, aule, pagamenti, materiali e DAD — in un unico spazio light e mobile-first.",
};

export type PlanId = "start" | "campus" | "enterprise";

export const PLANS = [
  {
    id: "start" as PlanId,
    name: "Start",
    price: "79",
    period: "/mese",
    blurb: "Per piccoli centri che iniziano la digitalizzazione.",
    highlight: false,
    features: [
      "Fino a 80 studenti",
      "3 docenti",
      "Calendario corsi base",
      "Materiali e dispense",
      "Attestati PDF",
      "App studente mobile",
    ],
  },
  {
    id: "campus" as PlanId,
    name: "Campus",
    price: "189",
    period: "/mese",
    blurb: "Il piano completo per scuole e centri strutturati.",
    highlight: true,
    features: [
      "Fino a 500 studenti",
      "Docenti illimitati",
      "Orari, aule e rate",
      "Video didattici & DAD",
      "Video call Expert",
      "Report e valutazioni",
      "Comunicazioni interne",
    ],
  },
  {
    id: "enterprise" as PlanId,
    name: "Enterprise",
    price: "Su misura",
    period: "",
    blurb: "Multi-sede, branding e integrazioni avanzate.",
    highlight: false,
    features: [
      "Studenti illimitati",
      "Multi-sede / multi-brand",
      "SSO e API",
      "SLA dedicato",
      "Onboarding assistito",
      "Moduli custom",
    ],
  },
] as const;

export const ROLES = [
  {
    id: "admin",
    label: "Amministrazione",
    href: "/accesso/admin",
    dashboard: "/admin",
    accent: "from-teal/20 to-azure/10",
    description: "Configurazione, calendario, anagrafe, rate e attestati.",
  },
  {
    id: "docente",
    label: "Docente",
    href: "/accesso/docente",
    dashboard: "/docente",
    accent: "from-azure/20 to-mint/15",
    description: "Corsi, materiali, DAD, valutazioni e video call.",
  },
  {
    id: "studente",
    label: "Studente",
    href: "/accesso/studente",
    dashboard: "/studente",
    accent: "from-mint/25 to-teal/10",
    description: "Lezioni, video, download e accesso mobile smart.",
  },
] as const;
