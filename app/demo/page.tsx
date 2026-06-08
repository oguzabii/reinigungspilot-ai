import type { Metadata } from "next";
import { DemoShell } from "@/components/DemoShell";

export const metadata: Metadata = {
  title: "Live-Demo – Klarsa",
  description:
    "Interaktive Demo des KI-Verkaufsbüros für Schweizer KMU – mit Paketumschalter für Starter, Pro und Premium, Branchenvorlagen und bexio-Übergabe.",
};

export default function DemoPage() {
  return <DemoShell />;
}
