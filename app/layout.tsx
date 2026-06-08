import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Klarsa – Das KI-Verkaufsbüro für Schweizer KMU",
  description:
    "Klarsa sammelt Anfragen, bewertet Chancen, erstellt Offerten, plant Follow-ups, organisiert Aufträge und übergibt gewonnene Jobs sauber an bexio – das KI-Verkaufsbüro für Schweizer KMU.",
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
