import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReinigungsPilot AI – Das AI-Verkaufsbüro für Schweizer KMU",
  description:
    "ReinigungsPilot AI bündelt Anfragen, erstellt Offerten, plant Follow-ups und Aufträge und übergibt sie an die Buchhaltung (bexio) – das AI-Verkaufsbüro für Schweizer KMU. Reinigung ist die erste Branchenvorlage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
