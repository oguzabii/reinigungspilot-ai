/**
 * Consultation ("Beratung") content — replaces the former public pilot offer.
 *
 * The public product no longer advertises a pilot. Instead, interested SMEs
 * request a consultation / demo. (Our own internal proof runs separately and is
 * not surfaced publicly here.)
 */

export interface BeratungStep {
  title: string;
  text: string;
}

export const BERATUNG = {
  forWhom: [
    "Schweizer KMU aus Dienstleistung, Handwerk und lokalen Services",
    "Betriebe, die Anfragen erhalten, aber im Verkauf Tempo und System vermissen",
    "Inhaberinnen und Inhaber, die ihren Verkauf systematisieren wollen",
  ] as string[],

  steps: [
    {
      title: "Erstgespräch",
      text: "15–20 Minuten: Wir verstehen Ihren Betrieb, Ihre Branche und Ihre typischen Anfragen.",
    },
    {
      title: "System prüfen",
      text: "Wir zeigen, wie Klarsa mit der passenden Branchenvorlage für Ihren Betrieb aussieht.",
    },
    {
      title: "Demo",
      text: "Live-Demo an Ihrem Beispiel: Anfrage, Offerte, Follow-up und bexio-Übergabe.",
    },
    {
      title: "Entscheid",
      text: "Sie entscheiden in Ruhe über Einrichtung und Paket – ohne Druck.",
    },
  ] as BeratungStep[],

  weLookAt: [
    "Welche Anfragen Sie erhalten und woher",
    "Wie heute Offerten und Follow-ups laufen",
    "Welche Branchenvorlage am besten passt",
    "Ob und wie eine bexio-Anbindung sinnvoll ist",
  ] as string[],

  youGet: [
    "Ehrliche Einschätzung, ob das System zu Ihnen passt",
    "Eine Demo an Ihrem konkreten Beispiel",
    "Empfehlung für das passende Paket",
    "Einen klaren nächsten Schritt – unverbindlich",
  ] as string[],

  notes: [
    "Unverbindlich und kostenlos.",
    "Reinigung ist unsere erste Branchenvorlage – weitere Branchen folgen.",
  ] as string[],
};

export { CONTACT_MAILTO as BERATUNG_MAILTO } from "./contact";
