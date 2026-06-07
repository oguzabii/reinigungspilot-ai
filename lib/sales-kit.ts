/**
 * Internal sales kit content.
 *
 * Reusable, copy-ready sales material for selling ReinigungsPilot AI to Swiss
 * SMEs ("KMU"). Cleaning is the first industry preset, not the whole product.
 * Tone: professional Swiss B2B, calm, specific, no hype — "AI prepares, the
 * human stays in control". Close via demo / consultation (no public pilot).
 */

export interface ColdEmail {
  audience: string;
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
  positioning: "ReinigungsPilot AI ist ein AI-Verkaufsbüro für Schweizer KMU.",
  positioningLong:
    "Es bündelt Anfragen, erstellt schneller Offerten, fasst konsequent nach und übergibt gewonnene Aufträge an die Buchhaltung (bexio). Reinigung ist die erste Branchenvorlage. Die AI bereitet vor – entscheiden und freigeben tun Menschen.",

  pitch30:
    "ReinigungsPilot AI ist ein AI-Verkaufsbüro für Schweizer KMU – für Dienstleister, Handwerk und lokale Betriebe. Es sammelt alle Anfragen an einem Ort, erstellt in Minuten Offerten und fasst automatisch nach. Ab dem Pro-Paket findet es zusätzlich aktiv neue B2B-Kunden und übergibt gewonnene Aufträge direkt an die Buchhaltung in bexio. Die AI bereitet vor, freigeben tun Sie. So gewinnen KMU mehr Aufträge, ohne mehr Zeit im Büro zu verlieren.",

  pitch120: [
    "Die meisten KMU verlieren Aufträge nicht wegen der Qualität, sondern im Verkauf: Anfragen gehen unter, Offerten dauern zu lange, und nachgefasst wird selten konsequent. Aktive B2B-Akquise kommt im Tagesgeschäft zu kurz.",
    "ReinigungsPilot AI ist das AI-Verkaufsbüro für Schweizer KMU. Alle Anfragen landen zentral in einer Inbox und werden nach Potenzial bewertet. Aus einem Lead wird in Minuten eine fertige Offerte. Das Follow-up läuft getaktet: nach 24 Stunden, 48 Stunden und 5 Tagen.",
    "Das System ist branchenfähig: Reinigung ist die erste Branchenvorlage, weitere wie Umzug, Handwerk, Gartenbau oder Hauswartung folgen – mit passenden Leads, Offertfeldern und Abläufen.",
    "Wichtig: Die AI bereitet vor, entscheiden und freigeben tun Sie. Es gibt keine automatischen Massen-Mails.",
    "Ab dem Pro-Paket findet der AI Lead Hunter aktiv neue B2B-Kunden, gewonnene Offerten werden zu geplanten Aufträgen, und über bexio Connect geht der Auftrag mit Kundendaten, Leistung und MwSt. direkt an die Buchhaltung – inklusive Rechnungsentwurf.",
    "Es gibt drei Pakete: Starter als digitales Offert-Büro, Pro als Verkaufsmotor mit bexio Connect – unsere Empfehlung – und Premium als komplettes Wachstumsbüro mit bexio Connect Plus.",
    "Am besten zeige ich Ihnen das in einer kurzen Demo an Ihrem Beispiel – wann passt es Ihnen diese Woche?",
  ] as string[],

  coldEmails: [
    {
      audience: "KMU · Inhaber:in",
      note: "Akquise – ReinigungsPilot AI vorstellen",
      subject: "Schneller offerieren, konsequenter nachfassen – ohne mehr Büroarbeit",
      body: "Guten Tag [Name]\n\nviele KMU verlieren Aufträge nicht wegen der Qualität, sondern weil Anfragen liegen bleiben, Offerten zu lange dauern und das Nachfassen untergeht.\n\nReinigungsPilot AI ist ein AI-Verkaufsbüro für Schweizer KMU: Anfragen zentral sammeln, in Minuten Offerten erstellen, automatisch nachfassen und gewonnene Aufträge an die Buchhaltung (bexio) übergeben. Die AI bereitet vor, freigeben tun Sie.\n\nHätten Sie diese Woche 15 Minuten für eine kurze Demo?\n\nFreundliche Grüsse\n[Ihr Name]",
    },
    {
      audience: "Immobilienverwaltung",
      note: "Beispiel-Erstkontakt (Branche Reinigung), den das System vorbereitet",
      subject: "Reinigung Ihrer Liegenschaften – feste Teams, klare Übergaben",
      body: "Guten Tag [Name]\n\nfür Verwaltungen mit mehreren Liegenschaften übernehmen wir Treppenhaus-, Unterhalts- und Eingangsreinigung mit festen Teams und einem digitalen Übergabeprotokoll – damit die Qualität jederzeit nachvollziehbar bleibt.\n\nDürfen wir Ihnen eine unverbindliche Beispiel-Offerte für eine Ihrer Liegenschaften zusammenstellen?\n\nFreundliche Grüsse\n[Ihr Name]\n[Firma]",
    },
    {
      audience: "Umzugsfirma · Partnerschaft",
      note: "Beispiel-Erstkontakt (Branche Umzug)",
      subject: "Endreinigung mit Abnahmegarantie – aus einer Hand für Ihre Kunden",
      body: "Guten Tag [Name]\n\nviele Umzugsfirmen bieten den Umzug an, aber nicht die Endreinigung. Genau das übernehmen wir – mit Abnahmegarantie und fixen Terminen.\n\nSo bieten Sie Ihren Kundinnen und Kunden alles aus einer Hand, ohne zusätzlichen Aufwand. Sollen wir die Konditionen einer Zusammenarbeit kurz besprechen?\n\nFreundliche Grüsse\n[Ihr Name]\n[Firma]",
    },
    {
      audience: "Gewerbe · Büro · Praxis",
      note: "Beispiel-Erstkontakt für gewerbliche Kunden",
      subject: "Saubere Räume ohne Aufwand für Ihr Team",
      body: "Guten Tag [Name]\n\nfür Büros, Praxen und Gewerbe übernehmen wir die Dienstleistung nach klaren Standards und – wo nötig – ausserhalb Ihrer Betriebszeiten, damit Ihr Team ungestört arbeiten kann.\n\nGerne erstellen wir Ihnen ein unverbindliches Angebot, abgestimmt auf Ihre Räume und Frequenz. Wann passt Ihnen ein kurzer Termin?\n\nFreundliche Grüsse\n[Ihr Name]\n[Firma]",
    },
  ] as ColdEmail[],

  messages: [
    {
      label: "Erste Nachricht (kurz)",
      text: "Guten Tag [Name], ich arbeite mit Schweizer KMU daran, aus Anfragen schneller Aufträge zu machen – mit einem AI-Verkaufsbüro, das Offerten und Follow-ups vorbereitet. Wäre das für [Firma] interessant?",
    },
    {
      label: "Follow-up",
      text: "Guten Tag [Name], kurzes Nachfassen zu meiner letzten Nachricht. Falls bei Ihnen ab und zu Anfragen liegen bleiben oder Offerten zu lange dauern, lohnt sich ein kurzer Blick. 15 Minuten Demo diese Woche?",
    },
    {
      label: "Beratung anbieten",
      text: "Guten Tag [Name], wenn Sie mögen, schaue ich mir Ihren Verkaufsprozess in einer kurzen, unverbindlichen Beratung an und zeige, wie ReinigungsPilot AI für [Firma] aussehen würde. Passt diese oder nächste Woche?",
    },
  ] as MessageTemplate[],

  phoneScript: [
    {
      step: "Opener",
      text: "Guten Tag [Name], [Ihr Name] von ReinigungsPilot AI. Ich helfe Schweizer KMU, aus Anfragen schneller Aufträge zu machen. Haben Sie zwei Minuten?",
    },
    {
      step: "Problemfrage",
      text: "Wie läuft das heute bei Ihnen: Wer kümmert sich um eingehende Anfragen und Offerten – und wie konsequent wird nachgefasst?",
    },
    {
      step: "Wert erklären",
      text: "ReinigungsPilot AI sammelt alle Anfragen zentral, erstellt in Minuten Offerten und fasst automatisch nach. Gewonnene Aufträge gehen direkt an Ihre Buchhaltung in bexio. Die AI bereitet vor, freigeben tun Sie.",
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
      label: "Beratung anfragen",
      text: "Sollen wir einen Termin für eine kurze, unverbindliche Beratung einplanen?",
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
