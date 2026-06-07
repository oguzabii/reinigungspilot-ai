/**
 * Central demo seed data for ReinigungsPilot AI.
 *
 * Everything here is local, fictional demo data for the sales demo of the
 * example company "Muster Service GmbH". No external sources.
 */

export const DEMO_COMPANY = {
  name: "Muster Service GmbH",
  owner: "Daniel Muster",
  ownerRole: "Inhaber",
  region: "Zürich & Umgebung",
  initials: "MS",
};

/* -------------------------------------------------------------------------- */
/* Leads (Lead Inbox)                                                          */
/* -------------------------------------------------------------------------- */

export type LeadStatus =
  | "Neu"
  | "Qualifiziert"
  | "Offerte"
  | "Follow-up"
  | "Gewonnen"
  | "Verloren";

export interface Lead {
  id: string;
  company: string;
  contact: string;
  service: string;
  location: string;
  status: LeadStatus;
  score: number;
  valueChf: number;
  valueUnit: string;
  nextAction: string;
  channel: string;
  receivedAgo: string;
}

export const DEMO_LEADS: Lead[] = [
  {
    id: "lead-1",
    company: "Helvetia Immobilien AG",
    contact: "Frau Keller",
    service: "Unterhaltsreinigung",
    location: "Dübendorf",
    status: "Neu",
    score: 92,
    valueChf: 31200,
    valueUnit: "pro Jahr",
    nextAction: "Besichtigungstermin vereinbaren",
    channel: "Empfehlung",
    receivedAgo: "vor 3 Std.",
  },
  {
    id: "lead-2",
    company: "Wohnbau Zürich AG",
    contact: "Herr Frei",
    service: "Treppenhausreinigung",
    location: "Zürich-Oerlikon",
    status: "Neu",
    score: 88,
    valueChf: 18600,
    valueUnit: "pro Jahr",
    nextAction: "Offerte erstellen",
    channel: "Web-Formular",
    receivedAgo: "vor 2 Std.",
  },
  {
    id: "lead-3",
    company: "Kanzlei Steiner & Partner",
    contact: "Frau Steiner",
    service: "Büroreinigung",
    location: "Zürich",
    status: "Gewonnen",
    score: 95,
    valueChf: 22800,
    valueUnit: "pro Jahr",
    nextAction: "Onboarding planen",
    channel: "Web-Formular",
    receivedAgo: "vor 4 Tagen",
  },
  {
    id: "lead-4",
    company: "Praxis Dr. Brunner",
    contact: "Dr. Brunner",
    service: "Praxisreinigung",
    location: "Winterthur",
    status: "Qualifiziert",
    score: 81,
    valueChf: 9400,
    valueUnit: "pro Jahr",
    nextAction: "Rückruf heute 14:00",
    channel: "Telefon",
    receivedAgo: "vor 5 Std.",
  },
  {
    id: "lead-5",
    company: "Gastro Löwen GmbH",
    contact: "Herr Aebischer",
    service: "Gewerbereinigung",
    location: "Uster",
    status: "Offerte",
    score: 74,
    valueChf: 12000,
    valueUnit: "pro Jahr",
    nextAction: "Offerte nachfassen",
    channel: "E-Mail",
    receivedAgo: "vor 1 Tag",
  },
  {
    id: "lead-6",
    company: "Umzug Blitz AG",
    contact: "Herr Tanner",
    service: "Umzugsreinigung",
    location: "Wallisellen",
    status: "Qualifiziert",
    score: 78,
    valueChf: 5600,
    valueUnit: "pro Auftrag",
    nextAction: "Abnahmegarantie erklären",
    channel: "Partner",
    receivedAgo: "vor 8 Std.",
  },
  {
    id: "lead-7",
    company: "Studio Pilates Flow",
    contact: "Frau Marti",
    service: "Fensterreinigung",
    location: "Zürich",
    status: "Follow-up",
    score: 63,
    valueChf: 3200,
    valueUnit: "pro Jahr",
    nextAction: "2. Follow-up senden",
    channel: "Instagram",
    receivedAgo: "vor 2 Tagen",
  },
  {
    id: "lead-8",
    company: "Café Central",
    contact: "Herr Costa",
    service: "Grundreinigung",
    location: "Winterthur",
    status: "Neu",
    score: 58,
    valueChf: 1900,
    valueUnit: "pro Auftrag",
    nextAction: "Bedarf telefonisch prüfen",
    channel: "Google",
    receivedAgo: "vor 6 Std.",
  },
];

/* -------------------------------------------------------------------------- */
/* Prospects (AI Lead Hunter)                                                  */
/* -------------------------------------------------------------------------- */

export type ProspectCategory =
  | "Immobilienverwaltung"
  | "Praxis"
  | "Büro"
  | "Umzugsfirma"
  | "Restaurant/Gewerbe";

export interface Prospect {
  id: string;
  name: string;
  category: ProspectCategory;
  location: string;
  score: number;
  reason: string;
  suggestedMessage: string;
  estValueChf: number;
}

export const DEMO_PROSPECTS: Prospect[] = [
  {
    id: "prospect-1",
    name: "Verwaltung Glattpark",
    category: "Immobilienverwaltung",
    location: "Opfikon",
    score: 90,
    reason:
      "Neubau-Areal mit 6 Mehrfamilienhäusern in der Erstvermietung – Bedarf an Unterhalts- und Treppenhausreinigung ist hoch und langfristig.",
    suggestedMessage:
      "Guten Tag, wir betreuen mehrere Wohnüberbauungen in der Region mit festen Teams und Abnahmegarantie. Für Ihr Areal im Glattpark erstellen wir Ihnen gerne eine unverbindliche Offerte.",
    estValueChf: 33500,
  },
  {
    id: "prospect-2",
    name: "Zürichsee Immobilien AG",
    category: "Immobilienverwaltung",
    location: "Thalwil",
    score: 88,
    reason:
      "Verwaltet rund 24 Liegenschaften und hat aktuell keinen erkennbaren festen Reinigungspartner – idealer Rahmenvertrag.",
    suggestedMessage:
      "Guten Tag Frau Bürgi, für Verwaltungen mit mehreren Liegenschaften bieten wir fixe Teams, klare Reinigungspläne und ein digitales Übergabeprotokoll. Dürfen wir Ihnen eine Beispiel-Offerte zusenden?",
    estValueChf: 28000,
  },
  {
    id: "prospect-3",
    name: "CoWork Hardturm",
    category: "Büro",
    location: "Zürich",
    score: 84,
    reason:
      "Wachsender Co-Working-Space (rund 1'200 m²), plant laut Website eine zweite Etage – steigender Reinigungsbedarf.",
    suggestedMessage:
      "Guten Tag, für Co-Working-Flächen sorgen wir mit flexiblen Zeitfenstern für tägliche Frische ohne Störung des Betriebs. Gerne zeigen wir Ihnen ein passendes Reinigungskonzept.",
    estValueChf: 19000,
  },
  {
    id: "prospect-4",
    name: "Zahnarztpraxis Seefeld",
    category: "Praxis",
    location: "Zürich",
    score: 82,
    reason:
      "Praxis-Eröffnung im dritten Quartal angekündigt – hohe Hygienestandards, idealer Zeitpunkt für einen Wartungsvertrag.",
    suggestedMessage:
      "Guten Tag, für medizinische Praxen reinigen wir nach klaren Hygienestandards und dokumentieren jeden Einsatz. Zur Eröffnung erstellen wir Ihnen gerne ein passendes Hygienekonzept.",
    estValueChf: 11500,
  },
  {
    id: "prospect-5",
    name: "Stadtumzug GmbH",
    category: "Umzugsfirma",
    location: "Winterthur",
    score: 79,
    reason:
      "Bietet Umzüge ohne Endreinigung an – idealer Kooperationspartner für Umzugsreinigung mit Abnahmegarantie.",
    suggestedMessage:
      "Guten Tag Herr Lehmann, viele Umzugsfirmen empfehlen uns für die Endreinigung mit Abnahmegarantie. So bieten Sie Ihren Kunden alles aus einer Hand – sollen wir die Konditionen besprechen?",
    estValueChf: 14400,
  },
  {
    id: "prospect-6",
    name: "Gruppenpraxis Limmattal",
    category: "Praxis",
    location: "Schlieren",
    score: 76,
    reason:
      "Drei Standorte und laut Stelleninserat Bedarf im Facility-Bereich – Potenzial für einen standortübergreifenden Vertrag.",
    suggestedMessage:
      "Guten Tag, für Gruppenpraxen mit mehreren Standorten bieten wir einheitliche Standards und eine zentrale Ansprechperson. Gerne erstellen wir eine Offerte über alle drei Standorte.",
    estValueChf: 12800,
  },
  {
    id: "prospect-7",
    name: "Trattoria Bellavista",
    category: "Restaurant/Gewerbe",
    location: "Uster",
    score: 71,
    reason:
      "Beliebtes Lokal mit hoher Frequenz, reinigt bisher intern – klares Entlastungspotenzial für das Team.",
    suggestedMessage:
      "Guten Tag, für Gastrobetriebe übernehmen wir die Reinigung nach Betriebsschluss, damit sich Ihr Team voll auf die Gäste konzentrieren kann. Dürfen wir Ihnen ein Angebot machen?",
    estValueChf: 8600,
  },
];

/* -------------------------------------------------------------------------- */
/* Offer Engine                                                                */
/* -------------------------------------------------------------------------- */

export type RiskLevel = "Niedrig" | "Mittel" | "Hoch";

export interface OfferLineItem {
  label: string;
  detail: string;
  amountChf: number;
}

export interface OfferDraft {
  id: string;
  leadId: string;
  company: string;
  contact: string;
  service: string;
  location: string;
  priceChf: number;
  priceFromChf: number;
  priceToChf: number;
  priceUnit: string;
  marginPct: number;
  riskLevel: RiskLevel;
  riskNote: string;
  pdf: {
    title: string;
    reference: string;
    validUntil: string;
    lineItems: OfferLineItem[];
    totalChf: number;
    totalUnit: string;
  };
  email: {
    subject: string;
    greeting: string;
    paragraphs: string[];
    signature: string;
  };
}

export const DEMO_OFFERS: OfferDraft[] = [
  {
    id: "offer-1",
    leadId: "lead-1",
    company: "Helvetia Immobilien AG",
    contact: "Frau Keller",
    service: "Unterhaltsreinigung Treppenhaus & Eingang",
    location: "Dübendorf",
    priceChf: 2600,
    priceFromChf: 2450,
    priceToChf: 2850,
    priceUnit: "pro Monat",
    marginPct: 34,
    riskLevel: "Niedrig",
    riskNote:
      "Stabiler Objekttyp mit guter Erreichbarkeit und planbarer Frequenz (2× wöchentlich). Empfohlener Aufschlag für Material und Wegzeit ist bereits einkalkuliert.",
    pdf: {
      title: "Offerte – Unterhaltsreinigung",
      reference: "OF-2026-0142",
      validUntil: "30.06.2026",
      lineItems: [
        {
          label: "Unterhaltsreinigung Treppenhaus",
          detail: "2× wöchentlich, 6 Etagen",
          amountChf: 1480,
        },
        {
          label: "Eingangsbereich & Lift",
          detail: "2× wöchentlich",
          amountChf: 620,
        },
        {
          label: "Fensterreinigung Eingang",
          detail: "monatlich",
          amountChf: 280,
        },
        {
          label: "Material & Verbrauch",
          detail: "Pauschale",
          amountChf: 220,
        },
      ],
      totalChf: 2600,
      totalUnit: "pro Monat (exkl. MwSt.)",
    },
    email: {
      subject: "Ihre Offerte für die Unterhaltsreinigung – Helvetia Immobilien",
      greeting: "Guten Tag Frau Keller",
      paragraphs: [
        "Vielen Dank für Ihr Interesse an unseren Reinigungsdienstleistungen und das angenehme Gespräch.",
        "Im Anhang finden Sie unsere Offerte für die Unterhaltsreinigung von Treppenhaus, Eingang und Lift Ihrer Liegenschaft in Dübendorf. Wir arbeiten mit einem festen Team und einem digitalen Übergabeprotokoll, damit die Qualität jederzeit nachvollziehbar bleibt.",
        "Gerne vereinbaren wir einen kurzen Besichtigungstermin, um letzte Details abzustimmen. Passt Ihnen ein Termin in der nächsten Woche?",
      ],
      signature: "Freundliche Grüsse\nDaniel Muster\nMuster Service GmbH",
    },
  },
  {
    id: "offer-2",
    leadId: "lead-2",
    company: "Wohnbau Zürich AG",
    contact: "Herr Frei",
    service: "Treppenhausreinigung",
    location: "Zürich-Oerlikon",
    priceChf: 1550,
    priceFromChf: 1450,
    priceToChf: 1700,
    priceUnit: "pro Monat",
    marginPct: 31,
    riskLevel: "Niedrig",
    riskNote:
      "Wiederkehrender Auftrag mit klarer Frequenz. Parkmöglichkeit vor Ort reduziert Wegzeit.",
    pdf: {
      title: "Offerte – Treppenhausreinigung",
      reference: "OF-2026-0143",
      validUntil: "30.06.2026",
      lineItems: [
        {
          label: "Treppenhausreinigung",
          detail: "1× wöchentlich, 4 Etagen",
          amountChf: 980,
        },
        {
          label: "Kellerabgänge & Waschküche",
          detail: "2× monatlich",
          amountChf: 360,
        },
        { label: "Material & Verbrauch", detail: "Pauschale", amountChf: 210 },
      ],
      totalChf: 1550,
      totalUnit: "pro Monat (exkl. MwSt.)",
    },
    email: {
      subject: "Ihre Offerte für die Treppenhausreinigung – Wohnbau Zürich AG",
      greeting: "Guten Tag Herr Frei",
      paragraphs: [
        "Besten Dank für Ihre Anfrage über unser Web-Formular.",
        "Anbei erhalten Sie unsere Offerte für die wöchentliche Treppenhausreinigung Ihrer Liegenschaft in Zürich-Oerlikon inklusive Kellerabgänge und Waschküche.",
        "Wir würden gerne mit einer kurzen Erstbegehung starten. Wann passt es Ihnen am besten?",
      ],
      signature: "Freundliche Grüsse\nDaniel Muster\nMuster Service GmbH",
    },
  },
  {
    id: "offer-3",
    leadId: "lead-5",
    company: "Gastro Löwen GmbH",
    contact: "Herr Aebischer",
    service: "Gewerbereinigung",
    location: "Uster",
    priceChf: 1000,
    priceFromChf: 900,
    priceToChf: 1200,
    priceUnit: "pro Monat",
    marginPct: 27,
    riskLevel: "Mittel",
    riskNote:
      "Nachtreinigung nach Betriebsschluss und stark frequentierte Küche erfordern erfahrenes Team – Aufschlag für Nachtzeit berücksichtigt.",
    pdf: {
      title: "Offerte – Gewerbereinigung",
      reference: "OF-2026-0139",
      validUntil: "20.06.2026",
      lineItems: [
        {
          label: "Gastraum & Sanitär",
          detail: "3× wöchentlich, nach Betriebsschluss",
          amountChf: 640,
        },
        { label: "Küche (Grundreinigung)", detail: "monatlich", amountChf: 260 },
        { label: "Material & Verbrauch", detail: "Pauschale", amountChf: 100 },
      ],
      totalChf: 1000,
      totalUnit: "pro Monat (exkl. MwSt.)",
    },
    email: {
      subject: "Ihre Offerte für die Gewerbereinigung – Gastro Löwen",
      greeting: "Guten Tag Herr Aebischer",
      paragraphs: [
        "Vielen Dank für das Gespräch und das Vertrauen.",
        "Im Anhang finden Sie unsere Offerte für die Reinigung von Gastraum, Sanitär und Küche nach Betriebsschluss. So bleibt Ihr Lokal jeden Morgen einladend sauber.",
        "Melden Sie sich gerne, falls Sie Anpassungen am Rhythmus wünschen.",
      ],
      signature: "Freundliche Grüsse\nDaniel Muster\nMuster Service GmbH",
    },
  },
];

/* -------------------------------------------------------------------------- */
/* Follow-up Center                                                            */
/* -------------------------------------------------------------------------- */

export type FollowUpStage = "24h" | "48h" | "5-Tage-final";
export type FollowUpState = "Fällig" | "Geplant" | "Überfällig" | "Erledigt";

export interface FollowUp {
  id: string;
  company: string;
  stage: FollowUpStage;
  state: FollowUpState;
  channel: string;
  dueLabel: string;
  hot: boolean;
  note: string;
  valueChf: number;
}

export const DEMO_FOLLOWUPS: FollowUp[] = [
  {
    id: "fu-1",
    company: "Gastro Löwen GmbH",
    stage: "48h",
    state: "Fällig",
    channel: "E-Mail",
    dueLabel: "heute, 16:00",
    hot: true,
    note: "Offerte vor 2 Tagen gesendet – Interesse signalisiert, Preis noch offen.",
    valueChf: 12000,
  },
  {
    id: "fu-2",
    company: "Praxis Dr. Brunner",
    stage: "24h",
    state: "Überfällig",
    channel: "Telefon",
    dueLabel: "seit 2 Std.",
    hot: true,
    note: "Rückruf zugesagt – heute unbedingt erreichen.",
    valueChf: 9400,
  },
  {
    id: "fu-3",
    company: "Wohnbau Zürich AG",
    stage: "24h",
    state: "Geplant",
    channel: "Telefon",
    dueLabel: "morgen, 09:30",
    hot: true,
    note: "Offerte heute erstellt – Erstkontakt nach Versand einplanen.",
    valueChf: 18600,
  },
  {
    id: "fu-4",
    company: "Umzug Blitz AG",
    stage: "48h",
    state: "Fällig",
    channel: "Telefon",
    dueLabel: "heute, 15:00",
    hot: false,
    note: "Abnahmegarantie als Hauptargument betonen.",
    valueChf: 5600,
  },
  {
    id: "fu-5",
    company: "Studio Pilates Flow",
    stage: "5-Tage-final",
    state: "Überfällig",
    channel: "WhatsApp",
    dueLabel: "seit gestern",
    hot: false,
    note: "Letztes Follow-up – danach automatisch auf „nicht erreicht“ setzen.",
    valueChf: 3200,
  },
  {
    id: "fu-6",
    company: "Café Central",
    stage: "24h",
    state: "Fällig",
    channel: "E-Mail",
    dueLabel: "heute, 11:00",
    hot: false,
    note: "Bedarf noch klären – kleinere Anfrage, niedrige Priorität.",
    valueChf: 1900,
  },
  {
    id: "fu-7",
    company: "Trattoria Bellavista",
    stage: "5-Tage-final",
    state: "Geplant",
    channel: "E-Mail",
    dueLabel: "in 3 Tagen",
    hot: false,
    note: "Erstkontakt aus Lead Hunter – finales Follow-up vorbereiten.",
    valueChf: 8600,
  },
];

/* -------------------------------------------------------------------------- */
/* Job Organizer                                                               */
/* -------------------------------------------------------------------------- */

export type CalendarState = "Bestätigt" | "Geplant" | "Vorläufig";

export interface Job {
  id: string;
  company: string;
  service: string;
  location: string;
  jobDate: string;
  timeWindow: string;
  team: string;
  teamNote: string;
  calendarState: CalendarState;
  handoverNote: string;
  valueChf: number;
  valueUnit: string;
}

export const DEMO_JOBS: Job[] = [
  {
    id: "job-1",
    company: "Kanzlei Steiner & Partner",
    service: "Büroreinigung",
    location: "Zürich",
    jobDate: "Mo, 08.06.2026",
    timeWindow: "18:30 – 21:00",
    team: "Team City (2 Personen)",
    teamNote: "Schlüssel beim Empfang abholen, Alarmcode 4471.",
    calendarState: "Bestätigt",
    handoverNote: "Frau Steiner wünscht eine kurze Rückmeldung nach der Erstreinigung.",
    valueChf: 1900,
    valueUnit: "pro Monat",
  },
  {
    id: "job-2",
    company: "Helvetia Immobilien AG",
    service: "Unterhaltsreinigung",
    location: "Dübendorf",
    jobDate: "Di, 09.06.2026",
    timeWindow: "07:00 – 09:30",
    team: "Team Nord (3 Personen)",
    teamNote: "Zugang über Hauswart, Tel. 079 412 88 10.",
    calendarState: "Bestätigt",
    handoverNote: "Übergabeprotokoll Treppenhaus fotografieren und in der App ablegen.",
    valueChf: 2600,
    valueUnit: "pro Monat",
  },
  {
    id: "job-3",
    company: "Wohnbau Zürich AG",
    service: "Treppenhausreinigung",
    location: "Zürich-Oerlikon",
    jobDate: "Mi, 10.06.2026",
    timeWindow: "06:30 – 08:00",
    team: "Team Nord (2 Personen)",
    teamNote: "Parkplatz vor dem Haus ist reserviert.",
    calendarState: "Geplant",
    handoverNote: "Erstbegehung mit der Verwaltung um 06:15 Uhr.",
    valueChf: 1550,
    valueUnit: "pro Monat",
  },
  {
    id: "job-4",
    company: "Umzug Blitz AG",
    service: "Umzugsreinigung",
    location: "Wallisellen",
    jobDate: "Fr, 12.06.2026",
    timeWindow: "13:00 – 18:00",
    team: "Team Flex (4 Personen)",
    teamNote: "Abnahme durch den Vermieter um 18:00 Uhr.",
    calendarState: "Vorläufig",
    handoverNote: "Abnahmegarantie: Nachbesserung innert 24 Std. ist zugesichert.",
    valueChf: 1450,
    valueUnit: "pro Auftrag",
  },
  {
    id: "job-5",
    company: "Gastro Löwen GmbH",
    service: "Gewerbereinigung",
    location: "Uster",
    jobDate: "Sa, 13.06.2026",
    timeWindow: "22:00 – 00:30",
    team: "Team City (3 Personen)",
    teamNote: "Nachtreinigung nach Betriebsschluss, Eingang über den Hof.",
    calendarState: "Geplant",
    handoverNote: "Küchenabnahme gemeinsam mit dem Betriebsleiter.",
    valueChf: 1000,
    valueUnit: "pro Monat",
  },
];

/* -------------------------------------------------------------------------- */
/* AI Marketing Assistant                                                      */
/* -------------------------------------------------------------------------- */

export type MarketingType =
  | "Google Business Post"
  | "Instagram Caption"
  | "Kampagnen-Idee"
  | "Lokales SEO-Thema";

export interface MarketingItem {
  id: string;
  type: MarketingType;
  title: string;
  body: string;
  tags: string[];
  /** Only shown in the full (Premium) preview. */
  premiumOnly: boolean;
}

export const DEMO_MARKETING: MarketingItem[] = [
  {
    id: "mk-1",
    type: "Google Business Post",
    title: "Frühlingsputz-Aktion für Liegenschaften",
    body: "Bereit für den Frühling? Wir bringen Ihr Treppenhaus und den Eingangsbereich auf Hochglanz – mit festem Team und Abnahmegarantie. Jetzt unverbindliche Offerte anfordern.",
    tags: ["#Reinigung", "#Zürich", "#Frühlingsputz"],
    premiumOnly: false,
  },
  {
    id: "mk-2",
    type: "Instagram Caption",
    title: "Vorher / Nachher: Treppenhaus",
    body: "Ein sauberes Treppenhaus ist die Visitenkarte jeder Liegenschaft. Swipe für das Vorher/Nachher – und sichern Sie sich Ihren festen Reinigungstermin. ✨🧽",
    tags: ["#vorhernachher", "#cleaning", "#zürich"],
    premiumOnly: false,
  },
  {
    id: "mk-3",
    type: "Kampagnen-Idee",
    title: "Praxis-Hygiene-Kampagne (Q3)",
    body: "Gezielte Kampagne für Arztpraxen und Zahnarztpraxen rund um das Thema Hygienestandards. Kombination aus Google Ads, Landingpage und einem Hygiene-Whitepaper als Lead-Magnet.",
    tags: ["B2B", "Gesundheit", "Lead-Magnet"],
    premiumOnly: true,
  },
  {
    id: "mk-4",
    type: "Lokales SEO-Thema",
    title: "Ratgeber: Büroreinigung in Zürich",
    body: "Ratgeber-Beitrag „Büroreinigung in Zürich – worauf Unternehmen achten sollten“. Optimiert auf lokale Suchbegriffe, mit interner Verlinkung zur Leistungsseite und Call-to-Action.",
    tags: ["SEO", "Büroreinigung", "Zürich"],
    premiumOnly: true,
  },
  {
    id: "mk-5",
    type: "Kampagnen-Idee",
    title: "Content-Kalender Q3 (12 Beiträge)",
    body: "Fertig geplanter Content-Kalender mit 12 Beiträgen über drei Monate – inklusive Themen, Formaten und Veröffentlichungsterminen für Google Business und Instagram.",
    tags: ["Content-Plan", "Social Media"],
    premiumOnly: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Boss / Chef Dashboard                                                       */
/* -------------------------------------------------------------------------- */

export interface DashboardSummary {
  newLeads: { value: number; delta: string; trend: "up" | "down" | "flat" };
  offersReady: { value: number; delta: string; trend: "up" | "down" | "flat" };
  followUpsDue: { value: number; delta: string; trend: "up" | "down" | "flat" };
  wonJobs: { value: number; delta: string; trend: "up" | "down" | "flat" };
  pipelineRevenueChf: number;
  expectedMonthlyRevenueChf: number;
}

export const DEMO_DASHBOARD: DashboardSummary = {
  newLeads: { value: 14, delta: "+5 diese Woche", trend: "up" },
  offersReady: { value: 6, delta: "+2 heute", trend: "up" },
  followUpsDue: { value: 4, delta: "2 überfällig", trend: "down" },
  wonJobs: { value: 9, delta: "+3 diesen Monat", trend: "up" },
  pipelineRevenueChf: 184600,
  expectedMonthlyRevenueChf: 32400,
};

export interface Opportunity {
  id: string;
  company: string;
  service: string;
  score: number;
  valueChf: number;
  action: string;
}

export const DEMO_TOP_OPPORTUNITIES: Opportunity[] = [
  {
    id: "op-1",
    company: "Verwaltung Glattpark",
    service: "Immobilienverwaltung",
    score: 90,
    valueChf: 33500,
    action: "Erstkontakt senden",
  },
  {
    id: "op-2",
    company: "Helvetia Immobilien AG",
    service: "Unterhaltsreinigung",
    score: 92,
    valueChf: 31200,
    action: "Termin vereinbaren",
  },
  {
    id: "op-3",
    company: "Kanzlei Steiner & Partner",
    service: "Büroreinigung",
    score: 95,
    valueChf: 22800,
    action: "Onboarding planen",
  },
  {
    id: "op-4",
    company: "Wohnbau Zürich AG",
    service: "Treppenhausreinigung",
    score: 88,
    valueChf: 18600,
    action: "Offerte erstellen",
  },
  {
    id: "op-5",
    company: "Praxis Dr. Brunner",
    service: "Praxisreinigung",
    score: 81,
    valueChf: 9400,
    action: "Rückruf heute 14:00",
  },
];

/** Weekly owner report (gated behind advancedReports). */
export const DEMO_WEEKLY_REPORT = {
  period: "Woche 23 · 01.–07.06.2026",
  highlights: [
    "9 neue Leads, davon 4 mit Score über 80",
    "2 Aufträge gewonnen (Kanzlei Steiner, Helvetia Immobilien)",
    "Antwortquote auf Follow-ups: 38 % (+6 Prozentpunkte)",
  ],
  conversionPct: 31,
  avgResponseHours: 3.2,
};

/* -------------------------------------------------------------------------- */
/* Customer Success — 12-month retention plan                                  */
/* -------------------------------------------------------------------------- */

export interface SuccessMonth {
  month: number;
  label: string;
  title: string;
  description: string;
}

export const DEMO_SUCCESS_TIMELINE: SuccessMonth[] = [
  {
    month: 0,
    label: "Monat 0",
    title: "Setup & Baseline",
    description:
      "Einrichtung von ReinigungsPilot AI, Import bestehender Kunden und Services, Definition der Preismodelle und Messung der Ausgangslage.",
  },
  {
    month: 1,
    label: "Monat 1",
    title: "Go-Live & erste Optimierung",
    description:
      "Live-Schaltung des AI Offer Büros, erste Offerten und Follow-ups, Feinjustierung der Preis- und Textvorlagen.",
  },
  {
    month: 2,
    label: "Monat 2",
    title: "Follow-up-Optimierung",
    description:
      "Analyse der Antwortquoten und Optimierung der 24h-, 48h- und 5-Tage-Sequenzen mit Fokus auf heisse Leads.",
  },
  {
    month: 3,
    label: "Monat 3",
    title: "ROI-Review",
    description:
      "Erster ROI-Check: gewonnene Aufträge, Conversion und Umsatz im Vergleich zur Baseline aus Monat 0.",
  },
  {
    month: 4,
    label: "Monat 4",
    title: "Lead-Hunter-Boost",
    description:
      "Skalierung des AI Lead Hunters auf neue B2B-Segmente und zusätzliche Regionen.",
  },
  {
    month: 5,
    label: "Monat 5",
    title: "Content & Sichtbarkeit",
    description:
      "Aufbau lokaler Sichtbarkeit über Google Business, Bewertungen und regelmässigen Content.",
  },
  {
    month: 6,
    label: "Monat 6",
    title: "Halbjahres-Business-Review",
    description:
      "Strategisches Halbjahres-Review mit dem Inhaber: Ziele, Margen und die wichtigsten Wachstumshebel.",
  },
  {
    month: 7,
    label: "Monat 7",
    title: "Saisonale Kampagne",
    description:
      "Saisonale Kampagne (z. B. Frühlings- oder Weihnachtsreinigung) mit gezieltem Outreach.",
  },
  {
    month: 8,
    label: "Monat 8",
    title: "System-Health-Check",
    description:
      "Technischer Health-Check, Datenpflege und Optimierung der laufenden Automationen.",
  },
  {
    month: 9,
    label: "Monat 9",
    title: "Lokales Wachstums-Review",
    description:
      "Regionale Wachstumsanalyse und Erschliessung angrenzender Gemeinden.",
  },
  {
    month: 10,
    label: "Monat 10",
    title: "Reaktivierungs-Monat",
    description:
      "Reaktivierung inaktiver Leads und ehemaliger Kunden mit massgeschneiderten Angeboten.",
  },
  {
    month: 11,
    label: "Monat 11",
    title: "Vorbereitung Verlängerung",
    description:
      "Vorbereitung der Vertragsverlängerung mit dokumentiertem Mehrwert und konkreten Ergebnissen.",
  },
  {
    month: 12,
    label: "Monat 12",
    title: "Verlängerung & Treue-Angebot",
    description:
      "Verlängerung mit Treue-Konditionen und Ausblick auf das nächste Wachstumsjahr.",
  },
];

/* -------------------------------------------------------------------------- */
/* bexio handover (demo only — no real API)                                   */
/* -------------------------------------------------------------------------- */

export interface BexioHandoff {
  jobId: string;
  company: string;
  contact: string;
  service: string;
  location: string;
  netChf: number;
  vatRatePct: number;
  vatChf: number;
  grossChf: number;
  customer: { address: string; email: string; uid: string };
  steps: { label: string; done: boolean }[];
  invoiceDraftRef: string;
}

export const DEMO_BEXIO_HANDOFF: BexioHandoff = {
  jobId: "job-2",
  company: "Helvetia Immobilien AG",
  contact: "Frau Keller",
  service: "Unterhaltsreinigung Treppenhaus & Eingang",
  location: "Dübendorf",
  netChf: 2600,
  vatRatePct: 8.1,
  vatChf: 211,
  grossChf: 2811,
  customer: {
    address: "Bahnhofstrasse 12, 8600 Dübendorf",
    email: "buchhaltung@helvetia-immobilien.ch",
    uid: "CHE-123.456.789 MWST",
  },
  steps: [
    { label: "Auftrag angenommen", done: true },
    { label: "Kundendaten vollständig", done: true },
    { label: "Leistung, Preis & MwSt. erfasst", done: true },
    { label: "Buchhaltung bereit", done: true },
  ],
  invoiceDraftRef: "RE-2026-0087",
};
