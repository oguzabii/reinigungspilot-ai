/**
 * Clean24 — Klarsa's first tenant / live proof.
 *
 * Typed first-tenant configuration ONLY. Used by the `/workspace` foundation
 * page and as the reference shape for staging tenant setup
 * (`supabase/verification/005_create_clean24_staging_tenant.sql`). It contains:
 *   - no secrets, no API keys, no bexio tokens
 *   - no real customer/lead/offer data (this is the tenant's own config)
 *   - no sensitive pricing logic (display labels only)
 *
 * Types are imported from `lib/database-types.ts` (the authoritative DB layer),
 * so `SourceType`/`PackageTier`/billing enums match the schema and the staging
 * SQL exactly.
 *
 * Important separation: this describes Clean24 as a TENANT INSIDE Klarsa. It is
 * unrelated to, and must not be wired into, the old standalone "Clean24 Lead
 * Autopilot". See `docs/phase-2-architecture.md`.
 */

import type {
  PackageTier,
  SourceType,
  BillingStatus,
  AccessStatus,
  BillingProvider,
} from "@/lib/database-types";

/** A service Clean24 offers, with a display-only price label (no real logic). */
export interface TenantServiceLabel {
  key: string;
  label: string;
  /** Presentation-only hint, e.g. "Abo pro Monat". No CHF amounts, no logic. */
  priceLabel: string;
}

/** A configured lead source mapped to a DB `source_type`. */
export interface TenantSourceLabel {
  type: SourceType;
  label: string;
}

/** Shape of the first-tenant config. */
export interface FirstTenantConfig {
  /** Placeholder tenant id — the real uuid is assigned by the staging SQL. */
  tenantId: string;
  /** Legal name. */
  legalName: string;
  /** Public brand. */
  brandName: string;
  /** Industry preset key (`lib/industries.ts` / industry_presets). */
  industryPresetKey: string;
  /** Starting tier for the live proof. */
  plannedTier: PackageTier;
  /** Billing lifecycle (no real billing yet). */
  billingStatus: BillingStatus;
  /** App access gate, independent of billing. */
  accessStatus: AccessStatus;
  /** Billing integration source. */
  billingProvider: BillingProvider;
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
 * Clean24 Memis GmbH — first Klarsa tenant (founder / live proof).
 *
 * Reinigung preset, Premium package, billing status `internal_founder` (the
 * founder runs the product, no real billing). Serves (in principle) all Swiss
 * cantons with a focus on the listed example cities. Config only — no real
 * customer data.
 */
export const CLEAN24_TENANT: FirstTenantConfig = {
  tenantId: "tenant-clean24", // placeholder; real uuid set by 005 staging SQL
  legalName: "Clean24 Memis GmbH",
  brandName: "Clean24",
  industryPresetKey: "reinigung",
  plannedTier: "premium",
  billingStatus: "internal_founder",
  accessStatus: "full",
  billingProvider: "internal",
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
    { key: "umzugsreinigung", label: "Umzugsreinigung", priceLabel: "Pauschale nach Wohnungsgrösse" },
    { key: "bueroreinigung", label: "Büroreinigung", priceLabel: "Abo pro Monat" },
    { key: "fensterreinigung", label: "Fensterreinigung", priceLabel: "Richtwert pro Einsatz" },
    { key: "unterhaltsreinigung", label: "Unterhaltsreinigung", priceLabel: "Abo pro Monat" },
    { key: "baureinigung", label: "Baureinigung", priceLabel: "Offerte nach Objekt" },
    { key: "treppenhausreinigung", label: "Treppenhausreinigung", priceLabel: "Abo pro Monat" },
    { key: "hauswartung", label: "Hauswartung", priceLabel: "Abo pro Monat" },
    { key: "tiefgaragenreinigung", label: "Tiefgaragenreinigung", priceLabel: "Offerte nach Objekt" },
  ],

  // `type` uses the DB `source_type` enum; `label` carries the specific channel.
  sources: [
    { type: "website", label: "Website Anfrage" },
    { type: "google", label: "Google" },
    { type: "referral", label: "Empfehlung" },
    { type: "partner", label: "Verwaltung" },
    { type: "partner", label: "Umzugsfirma Partner" },
    { type: "partner", label: "Bauprojekt" },
    { type: "referral", label: "Praxis/Ärzte" },
    { type: "manual", label: "manuell" },
  ],

  notes: [
    "Erster Tenant / Live-Proof — Setup auf Staging, keine echten Kundendaten.",
    "Premium-Paket, Billing-Status internal_founder (kein echtes Billing).",
    "Getrennt vom alten, eigenständigen Clean24 Lead Autopilot.",
  ],
};
