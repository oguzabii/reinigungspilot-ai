import type { Metadata } from "next";
import { DemoShell } from "@/components/DemoShell";

export const metadata: Metadata = {
  title: "Live-Demo – ReinigungsPilot AI",
  description:
    "Interaktive Demo des AI-Vertriebsbüros für Reinigungsfirmen – mit Paketumschalter für Starter, Pro und Premium.",
};

export default function DemoPage() {
  return <DemoShell />;
}
