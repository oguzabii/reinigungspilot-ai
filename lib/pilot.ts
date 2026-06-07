/**
 * Pilot programme configuration.
 *
 * Central source of truth for the limited pilot offer (used on /pilot and in
 * pilot CTAs). Pricing is intentionally separate from the public packages.
 */

export interface PilotTimelinePhase {
  phase: string;
  title: string;
  text: string;
}

export const PILOT = {
  slots: 3,
  setupChf: 1490,
  monthlyChf: 299,
  durationDays: 60,
  afterPilot: "Pro oder Premium",

  forWhom: [
    "Inhabergeführte Reinigungsfirmen in der Schweiz",
    "Betriebe, die bereits Anfragen erhalten, aber im Verkauf Tempo und System vermissen",
    "Teams, die bereit sind, aktiv mitzuarbeiten und Feedback zu geben",
    "Betriebe mit klarer Wachstumsambition im B2B-Bereich",
  ] as string[],

  notForWhom: [
    "Wer eine fertige Komplettlösung ganz ohne eigene Mitwirkung erwartet",
    "Wer eine garantierte Umsatzsteigerung sucht",
    "Betriebe ohne definierte Dienstleistungen oder Preise",
    "Reine Privatkunden-Putzhilfen ohne B2B-Ambition",
  ] as string[],

  timeline: [
    {
      phase: "Woche 1",
      title: "Setup & Baseline",
      text: "Wir richten ReinigungsPilot AI ein: Services, Preise, Vorlagen – und halten die Ausgangslage fest.",
    },
    {
      phase: "Woche 2",
      title: "Go-Live",
      text: "Erste Leads, Offerten und Follow-ups laufen live im System.",
    },
    {
      phase: "Woche 3–6",
      title: "Optimierung",
      text: "Wir justieren Preise, Texte und Follow-up-Sequenzen anhand echter Reaktionen.",
    },
    {
      phase: "Woche 7–8",
      title: "Review & Entscheid",
      text: "Gemeinsames Review der Ergebnisse und Übergang in Pro oder Premium.",
    },
  ] as PilotTimelinePhase[],

  gets: [
    "Vollständig eingerichtetes Verkaufsbüro: Lead Inbox, Offerten-Engine, Follow-ups",
    "Persönliche Begleitung beim Setup und Go-Live",
    "Pilot-Konditionen für 60 Tage statt regulärer Preise",
    "Konkrete Auswertung der Ergebnisse nach 60 Tagen",
  ] as string[],

  weNeed: [
    "Aktives Feedback während der 60 Tage",
    "Erlaubnis, anonymisierte Erkenntnisse zur Produktverbesserung zu nutzen",
    "Bei Zufriedenheit: ein kurzes Testimonial bzw. eine Referenz",
    "Eine feste Ansprechperson im Betrieb",
  ] as string[],

  notes: [
    "Nur für die ersten 3 Pilotfirmen.",
    "Der Pilotpreis ist kein öffentlicher Standardpreis.",
    "Nach 60 Tagen erfolgt der Wechsel zu Pro oder Premium.",
  ] as string[],
};
