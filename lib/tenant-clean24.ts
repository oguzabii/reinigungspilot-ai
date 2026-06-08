/**
 * Clean24 — Klarsa's first tenant / live proof.
 *
 * Typed first-tenant configuration ONLY. This is a static skeleton used by the
 * `/workspace` foundation page and as the reference shape for the future
 * onboarding flow. It contains:
 *   - no secrets, no API keys, no bexio tokens
 *   - no real customer/lead/offer data
 *   - no sensitive pricing logic (display labels only)
 *
 * Important separation: this describes Clean24 as a TENANT INSIDE Klarsa. It is
 * unrelated to, and must not be wired into, the old standalone "Clean24 Lead
 * Autopilot". See `docs/phase-2-architecture.md`.
 */

import type {
  PackageTier,
  SourceType,
} from "@/lib/klarsa-core-types";

/** A service Clean24 offers, with a display-only price label (no real logic). */
export interface TenantServiceLabel {
  key: string;
  label: string;
  /** Presentation-only hint, e.g. "Abo pro Monat". No CHF amounts, no logic. */
  priceLabel: string;
}

/** A configured lead source mapped to a core `SourceType`. */
export interface TenantSourceLabel {
  type: SourceType;
  label: string;
}

/** Shape of the first-tenant config. */
export interface FirstTenantConfig {
  /** Placeholder tenant id — no real uuid is assigned until the DB exists. */
  tenantId: string;
  /** Legal name. */
  legalName: string;
  /** Public brand. */
  brandName: string;
  /** Industry preset key (`lib/industries.ts` / industry_presets). */
  industryPresetKey: string;
  /** Planned starting tier for the live proof. */
  plannedTier: PackageTier;
  isFirstTenant: true;
  isLiveProof: true;
  /** All 26 Swiss canton codes this tenant may serve. */
  cantons: string[];
  /** Illustrative city examples within the served regions. */
  cityExamples: string[];
  services: TenantServiceLabel[];
  sources: TenantSourceLabel[];
  /** Safety reminders rendered on the foundation page. */
  notes: string[];
}

/** The 26 Swiss cantons (official two-letter codes). */
export const SWISS_CANTONS: string[] = [
  "ZH", "BE", "LU", "UR", "SZ", "OW", "NW", "GL", "ZG", "FR", "SO", "BS", "BL",
  "SH", "AR", "AI", "SG", "GR", "AG", "TG", "TI", "VD", "VS", "NE", "GE", "JU",
];

/**
 * Clean24 Memis GmbH — first Klarsa tenant.
 *
 * Reinigung preset, serving (in principle) all Swiss cantons with a focus on
 * the listed example cities. Static plan only — not connected to any backend.
 */
export const CLEAN24_TENANT: FirstTenantConfig = {
  tenantId: "tenant-clean24", // placeholder, not a real id
  legalName: "Clean24 Memis GmbH",
  brandName: "Clean24",
  industryPresetKey: "reinigung",
  plannedTier: "pro",
  isFirstTenant: true,
  isLiveProof: true,

  cantons: SWISS_CANTONS,
  cityExamples: [
    "Zürich",
    "Dietikon",
    "Basel",
    "Bern",
    "Luzern",
    "Zug",
    "St. Gallen",
    "Winterthur",
    "Lausanne",
    "Genève",
    "Lugano",
  ],

  services: [
    {
      key: "umzugsreinigung",
      label: "Umzugsreinigung",
      priceLabel: "Pauschale nach Wohnungsgrösse",
    },
    {
      key: "bueroreinigung",
      label: "Büroreinigung",
      priceLabel: "Abo pro Monat",
    },
    {
      key: "fensterreinigung",
      label: "Fensterreinigung",
      priceLabel: "Richtwert pro Einsatz",
    },
    {
      key: "unterhaltsreinigung",
      label: "Unterhaltsreinigung",
      priceLabel: "Abo pro Monat",
    },
    {
      key: "baureinigung",
      label: "Baureinigung",
      priceLabel: "Offerte nach Objekt",
    },
  ],

  sources: [
    { type: "web_form", label: "Website Anfrage" },
    { type: "google", label: "Google" },
    { type: "referral", label: "Empfehlung" },
    { type: "property_mgmt", label: "Verwaltung" },
    { type: "partner", label: "Umzugsfirma Partner" },
    { type: "manual", label: "manuell" },
  ],

  notes: [
    "Erste Tenant-Konfiguration als statischer Plan — keine echten Kundendaten.",
    "Kein Login, keine Datenbank, keine bexio-API, keine Secrets in diesem Repo.",
    "Getrennt vom alten, eigenständigen Clean24 Lead Autopilot.",
  ],
};
