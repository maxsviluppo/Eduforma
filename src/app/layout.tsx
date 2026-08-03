import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AulaNova — Piattaforma SaaS per centri di formazione",
    template: "%s · AulaNova",
  },
  description:
    "Gestisci scuola, docenti, studenti, calendario, materiali e DAD in un'unica piattaforma light e mobile-first.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${manrope.variable} ${syne.variable} h-full`}>
      <body className="min-h-full antialiased font-sans text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
