import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReinigungsPilot AI – Das AI-Vertriebsbüro für Reinigungsfirmen",
  description:
    "ReinigungsPilot AI findet neue B2B-Kunden, sammelt Anfragen, erstellt Offerten und plant Follow-ups und Aufträge – das verkaufsstarke AI-Büro für Reinigungsunternehmen in der Schweiz.",
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
