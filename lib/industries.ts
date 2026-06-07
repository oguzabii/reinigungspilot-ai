/**
 * Industry presets.
 *
 * ReinigungsPilot AI is an AI sales office for Swiss SMEs ("KMU"). Cleaning is
 * the first preset, not the whole product. Each preset configures the typical
 * leads, offer fields, follow-ups, workflow and example services for a trade.
 *
 * Central source — used by the demo "Branchenvorlagen" view and the brochure.
 */

import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Truck,
  Hammer,
  PaintRoller,
  Sprout,
  House,
  Briefcase,
} from "lucide-react";

export interface IndustryPreset {
  id: string;
  label: string;
  icon: LucideIcon;
  tagline: string;
  typicalLeads: string[];
  exampleServices: string[];
  offerFields: string[];
  followUps: string[];
  workflow: string[];
}

export const INDUSTRIES: IndustryPreset[] = [
  {
    id: "reinigung",
    label: "Reinigung",
    icon: Sparkles,
    tagline: "Unterhalts-, Bau- und Spezialreinigung für Liegenschaften und Gewerbe.",
    typicalLeads: [
      "Immobilienverwaltungen",
      "Büros & Praxen",
      "Umzugsendreinigung",
      "Gewerbe & Gastro",
    ],
    exampleServices: [
      "Unterhaltsreinigung",
      "Treppenhausreinigung",
      "Fensterreinigung",
      "Bauendreinigung",
    ],
    offerFields: ["Fläche / Objekt", "Frequenz", "Material & Verbrauch", "Wegpauschale"],
    followUps: ["24h: Eingang bestätigen", "48h: Offerte nachfassen", "5 Tage: letzter Kontakt"],
    workflow: ["Anfrage erfassen", "Objekt bewerten", "Offerte erstellen", "Einsatz planen"],
  },
  {
    id: "umzug",
    label: "Umzug",
    icon: Truck,
    tagline: "Umzüge und Räumungen mit Endreinigung und Abnahmegarantie.",
    typicalLeads: ["Privatumzüge", "Geschäftsumzüge", "Räumungen", "Partnerbetriebe"],
    exampleServices: ["Privatumzug", "Geschäftsumzug", "Möbellift", "Entsorgung"],
    offerFields: ["Volumen (m³ / Zimmer)", "Distanz", "Etagen / Lift", "Zusatzleistungen"],
    followUps: ["24h: Besichtigung anbieten", "48h: Offerte nachfassen", "5 Tage: Termin sichern"],
    workflow: ["Anfrage erfassen", "Volumen schätzen", "Offerte erstellen", "Umzugstermin planen"],
  },
  {
    id: "handwerk",
    label: "Handwerk",
    icon: Hammer,
    tagline: "Reparatur, Montage und Service rund ums Gebäude.",
    typicalLeads: ["Hausverwaltungen", "Privatkunden", "Reparatur-Notfälle", "Serviceverträge"],
    exampleServices: ["Reparaturen", "Montagen", "Sanitär / Heizung", "Service-Abos"],
    offerFields: ["Material", "Arbeitsstunden", "Anfahrt", "Express-Zuschlag"],
    followUps: ["24h: Termin vorschlagen", "48h: Offerte nachfassen", "5 Tage: nachhaken"],
    workflow: ["Anfrage erfassen", "Aufwand schätzen", "Kostenvoranschlag", "Termin planen"],
  },
  {
    id: "maler",
    label: "Maler / Gipser",
    icon: PaintRoller,
    tagline: "Maler-, Gips- und Renovationsarbeiten für innen und aussen.",
    typicalLeads: ["Renovationen", "Neubau / Ausbau", "Verwaltungen", "Privatkunden"],
    exampleServices: ["Innenanstrich", "Fassade", "Gipserarbeiten", "Tapezieren"],
    offerFields: ["Fläche (m²)", "Vorarbeiten / Untergrund", "Material", "Gerüst"],
    followUps: ["24h: Besichtigung anbieten", "48h: Offerte nachfassen", "5 Tage: Entscheid klären"],
    workflow: ["Anfrage erfassen", "Aufmass / Besichtigung", "Offerte erstellen", "Ausführung planen"],
  },
  {
    id: "gartenbau",
    label: "Gartenbau",
    icon: Sprout,
    tagline: "Gartenpflege, Gartenbau und Unterhalt für Aussenräume.",
    typicalLeads: ["Liegenschaften", "Privatgärten", "Unterhaltsverträge", "Verwaltungen"],
    exampleServices: ["Gartenunterhalt", "Heckenschnitt", "Neugestaltung", "Winterdienst"],
    offerFields: ["Fläche", "Frequenz", "Material / Pflanzen", "Entsorgung"],
    followUps: ["24h: Termin anbieten", "48h: Offerte nachfassen", "5 Tage: Saison-Hinweis"],
    workflow: ["Anfrage erfassen", "Fläche bewerten", "Offerte erstellen", "Saison / Einsatz planen"],
  },
  {
    id: "hauswartung",
    label: "Hauswartung",
    icon: House,
    tagline: "Hauswartung und technischer Unterhalt für Liegenschaften.",
    typicalLeads: ["Immobilienverwaltungen", "Stockwerkeigentum", "Gewerbeliegenschaften"],
    exampleServices: ["Hauswartung", "Umgebungspflege", "Winterdienst", "Kleinreparaturen"],
    offerFields: ["Liegenschaft / Fläche", "Leistungsumfang", "Frequenz", "Pikett / Notfall"],
    followUps: ["24h: Begehung anbieten", "48h: Offerte nachfassen", "5 Tage: Vertrag klären"],
    workflow: ["Anfrage erfassen", "Begehung", "Leistungsverzeichnis", "Betreuung planen"],
  },
  {
    id: "dienstleister",
    label: "Praxis / Büro-Dienstleister",
    icon: Briefcase,
    tagline: "Dienstleistungen für Praxen, Büros und lokale Anbieter.",
    typicalLeads: ["Praxen", "Büros & Co-Working", "Lokale Dienstleister", "Empfehlungen"],
    exampleServices: ["Service-Verträge", "Wartung", "Beratung", "Betreuungspakete"],
    offerFields: ["Leistungspaket", "Umfang / Frequenz", "Laufzeit", "Optionen"],
    followUps: ["24h: Rückmeldung", "48h: Offerte nachfassen", "5 Tage: Abschluss klären"],
    workflow: ["Anfrage erfassen", "Bedarf klären", "Offerte erstellen", "Onboarding planen"],
  },
];

export const DEFAULT_INDUSTRY_ID = "reinigung";
