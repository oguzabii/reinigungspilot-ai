/**
 * Internal sales kit content.
 *
 * Reusable, copy-ready sales material for selling ReinigungsPilot AI to Swiss
 * cleaning companies. Central config so the /sales-kit page stays presentational.
 * Tone: professional Swiss B2B, calm, specific, no hype — "AI prepares, the
 * human stays in control".
 */

export interface ColdEmail {
  audience: string;
  /** What this template is for (acquisition vs. example outreach). */
  note: string;
  subject: string;
  body: string;
}

export interface MessageTemplate {
  label: string;
  text: string;
}

export interface PhoneStep {
  step: string;
  text: string;
}

export interface ClosingLine {
  label: string;
  text: string;
}

export const SALES_KIT = {
  positioning: "ReinigungsPilot AI ist ein AI-Verkaufsbüro für Reinigungsfirmen.",
  positioningLong:
    "Es bündelt Anfragen, erstellt schneller Offerten, fasst konsequent nach und macht den Verkauf für die Inhaberin oder den Inhaber sichtbar. Die AI bereitet vor – entscheiden und freigeben tun Menschen.",

  pitch30:
    "ReinigungsPilot AI ist ein AI-Verkaufsbüro für Reinigungsfirmen. Es sammelt alle Anfragen an einem Ort, erstellt in Minuten Offerten und fasst automatisch nach – nach 24 Stunden, 48 Stunden und 5 Tagen. Ab dem Pro-Paket findet es zusätzlich aktiv neue B2B-Kunden wie Verwaltungen und Praxen. Die AI bereitet alles vor, freigeben tun Sie. So gewinnen Reinigungsfirmen mehr Aufträge, ohne mehr Zeit im Büro zu verlieren.",

  pitch120: [
    "Die meisten Reinigungsfirmen verlieren Aufträge nicht wegen der Qualität, sondern im Verkauf: Anfragen gehen unter, Offerten dauern zu lange, und nachgefasst wird selten konsequent. Gleichzeitig kommt aktive B2B-Akquise im Tagesgeschäft zu kurz.",
    "ReinigungsPilot AI ist das AI-Verkaufsbüro, das genau hier ansetzt. Alle Anfragen – aus Web, Telefon, E-Mail und Empfehlungen – landen zentral in einer Inbox und werden nach Potenzial bewertet. Aus einem Lead wird in Minuten eine fertige PDF-Offerte samt passender E-Mail. Das Follow-up läuft getaktet: nach 24 Stunden, 48 Stunden und 5 Tagen – damit kein Abschluss vergessen geht.",
    "Wichtig: Die AI bereitet vor, entscheiden und freigeben tun Sie. Es gibt keine automatischen Massen-Mails.",
    "Ab dem Pro-Paket sucht der AI Lead Hunter aktiv neue B2B-Kunden – Verwaltungen, Praxen, Büros, Umzugsfirmen, Gewerbe – inklusive Vorschlag für die Erstnachricht. Gewonnene Offerten werden zu geplanten Aufträgen, und ein wöchentlicher Chef-Report zeigt Leads, Conversion und erwarteten Umsatz.",
    "Es gibt drei Pakete: Starter als digitales Offert-Büro, Pro als Verkaufsmotor mit aktiver Akquise – unsere Empfehlung – und Premium als komplettes Wachstumsbüro.",
    "Aktuell nehmen wir die ersten drei Pilotfirmen auf: 60 Tage, reduzierte Konditionen, persönliche Begleitung. Am besten zeige ich Ihnen das in einer kurzen Demo – wann passt es Ihnen diese Woche?",
  ] as string[],

  coldEmails: [
    {
      audience: "Reinigungsfirma · Inhaber:in",
      note: "Akquise – ReinigungsPilot AI vorstellen",
      subject: "Schneller offerieren, konsequenter nachfassen – ohne mehr Büroarbeit",
      body: "Guten Tag [Name]\n\nviele Reinigungsfirmen verlieren Aufträge nicht wegen der Qualität, sondern weil Anfragen liegen bleiben, Offerten zu lange dauern und das Nachfassen untergeht.\n\nReinigungsPilot AI ist ein AI-Verkaufsbüro für Reinigungsfirmen: Anfragen zentral sammeln, in Minuten Offerten erstellen und automatisch nachfassen. Die AI bereitet vor, freigeben tun Sie.\n\nWir nehmen aktuell drei Pilotfirmen auf. Hätten Sie diese Woche 15 Minuten für eine kurze Demo?\n\nFreundliche Grüsse\n[Ihr Name]",
    },
    {
      audience: "Immobilienverwaltung",
      note: "Beispiel-Erstkontakt, den ReinigungsPilot AI vorbereitet",
      subject: "Reinigung Ihrer Liegenschaften – feste Teams, klare Übergaben",
      body: "Guten Tag [Name]\n\nfür Verwaltungen mit mehreren Liegenschaften übernehmen wir Treppenhaus-, Unterhalts- und Eingangsreinigung mit festen Teams und einem digitalen Übergabeprotokoll – damit die Qualität jederzeit nachvollziehbar bleibt.\n\nDürfen wir Ihnen eine unverbindliche Beispiel-Offerte für eine Ihrer Liegenschaften zusammenstellen?\n\nFreundliche Grüsse\n[Ihr Name]\n[Firma]",
    },
    {
      audience: "Umzugsfirma · Partnerschaft",
      note: "Beispiel-Erstkontakt für eine Kooperation",
      subject: "Endreinigung mit Abnahmegarantie – aus einer Hand für Ihre Kunden",
      body: "Guten Tag [Name]\n\nviele Umzugsfirmen bieten den Umzug an, aber nicht die Endreinigung. Genau das übernehmen wir – mit Abnahmegarantie und fixen Terminen.\n\nSo bieten Sie Ihren Kundinnen und Kunden alles aus einer Hand, ohne zusätzlichen Aufwand. Sollen wir die Konditionen einer Zusammenarbeit kurz besprechen?\n\nFreundliche Grüsse\n[Ihr Name]\n[Firma]",
    },
    {
      audience: "Gewerbe · Büro · Praxis",
      note: "Beispiel-Erstkontakt für gewerbliche Kunden",
      subject: "Saubere Räume ohne Aufwand für Ihr Team",
      body: "Guten Tag [Name]\n\nfür Büros, Praxen und Gewerbe übernehmen wir die Reinigung nach klaren Standards und – wo nötig – nach Betriebsschluss, damit Ihr Team ungestört arbeiten kann.\n\nGerne erstellen wir Ihnen ein unverbindliches Angebot, abgestimmt auf Ihre Räume und Frequenz. Wann passt Ihnen ein kurzer Termin?\n\nFreundliche Grüsse\n[Ihr Name]\n[Firma]",
    },
  ] as ColdEmail[],

  messages: [
    {
      label: "Erste Nachricht (kurz)",
      text: "Guten Tag [Name], ich arbeite mit Reinigungsfirmen daran, aus Anfragen schneller Aufträge zu machen – mit einem AI-Verkaufsbüro, das Offerten und Follow-ups vorbereitet. Wäre das für [Firma] interessant?",
    },
    {
      label: "Follow-up",
      text: "Guten Tag [Name], kurzes Nachfassen zu meiner letzten Nachricht. Falls bei Ihnen ab und zu Anfragen liegen bleiben oder Offerten zu lange dauern, lohnt sich ein kurzer Blick. 15 Minuten Demo diese Woche?",
    },
    {
      label: "Pilot-Angebot",
      text: "Guten Tag [Name], wir nehmen gerade drei Pilotfirmen auf: 60 Tage, reduzierte Konditionen, persönliche Begleitung. Ich glaube, ReinigungsPilot AI passt gut zu [Firma]. Soll ich es Ihnen unverbindlich zeigen?",
    },
  ] as MessageTemplate[],

  phoneScript: [
    {
      step: "Opener",
      text: "Guten Tag [Name], [Ihr Name] von ReinigungsPilot AI. Ich helfe Reinigungsfirmen, aus Anfragen schneller Aufträge zu machen. Haben Sie zwei Minuten?",
    },
    {
      step: "Problemfrage",
      text: "Wie läuft das heute bei Ihnen: Wer kümmert sich um eingehende Anfragen und Offerten – und wie konsequent wird nachgefasst?",
    },
    {
      step: "Wert erklären",
      text: "ReinigungsPilot AI sammelt alle Anfragen zentral, erstellt in Minuten Offerten und fasst automatisch nach. Die AI bereitet vor, freigeben tun Sie. So bleibt kein Auftrag liegen, ohne dass Sie mehr Zeit im Büro verbringen.",
    },
    {
      step: "Demo-Abschluss",
      text: "Am einfachsten zeige ich es Ihnen kurz live – etwa 15 Minuten. Passt es Ihnen eher am Vormittag oder am Nachmittag?",
    },
  ] as PhoneStep[],

  closingLines: [
    {
      label: "Demo buchen",
      text: "Sollen wir gleich 15 Minuten für eine Demo einplanen – diese oder nächste Woche?",
    },
    {
      label: "Pilot anfragen",
      text: "Möchten Sie sich einen der drei Pilotplätze sichern? Ich nehme Sie unverbindlich auf die Liste.",
    },
    {
      label: "Preislink senden",
      text: "Ich schicke Ihnen den Link zur Preisübersicht – schauen Sie in Ruhe, danach sprechen wir kurz.",
    },
    {
      label: "Prozess erfragen",
      text: "Wie viele Anfragen bekommen Sie ungefähr pro Monat – und was passiert heute mit einer Offerte, nachdem sie raus ist?",
    },
  ] as ClosingLine[],
};
