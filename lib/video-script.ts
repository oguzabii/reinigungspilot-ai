/**
 * 60-second explainer storyboard (concept only — no real video yet).
 *
 * German voiceover with Swiss-SME ("KMU") wording. Used by the internal
 * /video-script page and referenced by the landing "In 1 Minute erklärt"
 * placeholder.
 */

export interface VideoScene {
  time: string;
  visual: string;
  voiceover: string;
}

export const VIDEO_SCRIPT = {
  title: "1-Minuten-Erklärvideo",
  subtitle:
    "60-Sekunden-Storyboard mit deutschem Voiceover. Konzept für ein späteres Video – aktuell kein fertiges Video.",
  scenes: [
    {
      time: "0:00 – 0:08",
      visual: "Logo, Inhaber eines KMU am Tablet, ruhige Bürosituation.",
      voiceover:
        "ReinigungsPilot AI ist das AI-Verkaufsbüro für Schweizer KMU – für Dienstleister, Handwerk und lokale Betriebe.",
    },
    {
      time: "0:08 – 0:18",
      visual: "Lead Inbox füllt sich mit Anfragen aus Web, Telefon und E-Mail.",
      voiceover:
        "Jede Anfrage landet zentral an einem Ort – aus Web, Telefon, E-Mail und Empfehlungen. Nichts geht mehr vergessen.",
    },
    {
      time: "0:18 – 0:28",
      visual: "Leads mit Score-Badges, Sortierung nach Potenzial.",
      voiceover:
        "Die AI bewertet jeden Lead nach Potenzial, damit Sie sofort sehen, wo sich der Aufwand lohnt.",
    },
    {
      time: "0:28 – 0:38",
      visual: "Aus einem Lead entsteht eine PDF-Offerte mit Preisvorschlag.",
      voiceover:
        "Aus einem Lead wird in Minuten eine fertige Offerte. Die AI bereitet vor – freigeben tun Sie.",
    },
    {
      time: "0:38 – 0:46",
      visual: "Follow-up-Sequenz: 24h, 48h, 5 Tage.",
      voiceover:
        "Follow-ups laufen automatisch getaktet – nach 24 Stunden, 48 Stunden und 5 Tagen.",
    },
    {
      time: "0:46 – 0:54",
      visual: "Gewonnene Offerte wird zu einem geplanten Auftrag im Kalender.",
      voiceover:
        "Gewonnene Offerten werden zu geplanten Aufträgen – mit Termin und Team.",
    },
    {
      time: "0:54 – 1:00",
      visual: "bexio-Übergabe mit Rechnungsentwurf, danach Logo und CTA.",
      voiceover:
        "Und der Auftrag geht direkt an Ihre Buchhaltung in bexio. ReinigungsPilot AI – mehr Aufträge, weniger Büro.",
    },
  ] as VideoScene[],
};
