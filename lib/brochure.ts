/**
 * Brochure narrative content.
 *
 * Sales-oriented prose for the (future-PDF) brochure at /brochure. Structured
 * lists (industries, modules, packages, add-ons, scope, success plan) are pulled
 * from the existing central config — this file only holds the connecting copy.
 */

export const BROCHURE = {
  title: "Klarsa",
  subtitle: "Das KI-Verkaufsbüro für Schweizer KMU.",
  intro:
    "Klarsa bündelt Anfragen, erstellt schneller Offerten, fasst konsequent nach und übergibt gewonnene Aufträge an die Buchhaltung. Reinigung ist die erste Branchenvorlage. Die KI bereitet vor, entscheiden tun Sie.",

  problemTitle: "Die Ausgangslage",
  problemText:
    "Gute KMU verlieren Aufträge nicht wegen der Qualität, sondern im Verkauf. Im Tagesgeschäft fehlt die Zeit für schnelle Offerten und konsequentes Nachfassen.",
  problems: [
    "Anfragen aus Web, Telefon und E-Mail gehen verloren",
    "Offerten dauern zu lange – der schnellste Anbieter gewinnt",
    "Follow-ups werden vergessen, Umsatz bleibt liegen",
    "Keine systematische B2B-Akquise bei Verwaltungen, Praxen und Büros",
  ] as string[],

  solutionTitle: "Die Lösung",
  solutionText:
    "Ein durchgängiger Verkaufsprozess in einem System – von der Anfrage bis zur Übergabe an die Buchhaltung.",
  steps: [
    "Anfragen zentral sammeln",
    "Leads nach Potenzial bewerten",
    "Offerten in Minuten erstellen",
    "Automatisch nachfassen (24h / 48h / 5 Tage)",
    "Aufträge planen und organisieren",
    "An die Buchhaltung (bexio) übergeben",
    "Umsatz im Chef-Dashboard verfolgen",
  ] as string[],

  controlNote:
    "In jedem Schritt gilt: Die KI bereitet vor, Sie behalten die Kontrolle und geben frei. Keine automatischen Massen-Mails.",

  closingTitle: "Der nächste Schritt",
  closingText:
    "Vereinbaren Sie eine unverbindliche Beratung oder sehen Sie sich die Demo an – wir prüfen gemeinsam, wie Klarsa zu Ihrem Betrieb passt.",
};
