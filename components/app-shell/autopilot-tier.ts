/**
 * Package-aware Autopilot positioning (v0.5.6). PURE — no I/O, no clock.
 *
 * Klarsa stays package-aware. The same product presents three honest autonomy
 * levels, so the owner always understands what Klarsa does for THEM:
 *
 *   - Starter  → "Digitales Offert-Büro"            (offer_office)
 *   - Pro      → "Geführter Sales Autopilot"        (guided)
 *   - Premium  → "Vollautomatisches AI-Verkaufsbüro" (full)
 *
 * The Clean24 founder tenant runs on the premium tier (billing_status
 * `internal_founder`), so the tier already resolves to the full experience; we
 * also honour `internal_founder` defensively.
 */

import type { PackageTier } from "@/lib/database-types";

export type AutopilotMode = "offer_office" | "guided" | "full";

export interface AutopilotTierInfo {
  tier: PackageTier;
  mode: AutopilotMode;
  /** Owner-facing positioning label. */
  label: string;
  /** One-line description of what Klarsa does at this level. */
  tagline: string;
  /** Short status word for the overall autopilot state. */
  statusLabel: string;
  /** True only for the full (Premium) experience. */
  isFull: boolean;
}

const RANK: Record<PackageTier, number> = { starter: 0, pro: 1, premium: 2 };

/** Order rank for gating comparisons (starter < pro < premium). */
export function tierRank(tier: PackageTier): number {
  return RANK[tier] ?? 0;
}

/**
 * Premium = the full autopilot experience. True for the premium tier or the
 * internal founder tenant (Clean24).
 */
export function isPremiumExperience(
  tier: PackageTier,
  billingStatus?: string | null,
): boolean {
  return tier === "premium" || billingStatus === "internal_founder";
}

const INFO: Record<
  AutopilotMode,
  { label: string; tagline: string; statusLabel: string }
> = {
  offer_office: {
    label: "Digitales Offert-Büro",
    tagline: "Anfragen bündeln, schneller offerieren, sauber nachfassen.",
    statusLabel: "Offert-Büro aktiv",
  },
  guided: {
    label: "Geführter Sales Autopilot",
    tagline: "Klarsa führt Sie, bereitet Aktionen vor und zeigt Chancen.",
    statusLabel: "Geführt – Aktionen vorbereitet",
  },
  full: {
    label: "Vollautomatisches AI-Verkaufsbüro",
    tagline:
      "Klarsa findet, kontaktiert, fasst nach und koordiniert – sichtbar und kontrolliert.",
    statusLabel: "Vollautomatik – kanalweise aktivierbar",
  },
};

/** The autonomy mode for a tier. */
export function modeForTier(
  tier: PackageTier,
  billingStatus?: string | null,
): AutopilotMode {
  if (isPremiumExperience(tier, billingStatus)) return "full";
  if (tier === "pro") return "guided";
  return "offer_office";
}

/** Full owner-facing positioning info for a tier. */
export function autopilotTier(
  tier: PackageTier,
  billingStatus?: string | null,
): AutopilotTierInfo {
  const mode = modeForTier(tier, billingStatus);
  const info = INFO[mode];
  return {
    tier,
    mode,
    label: info.label,
    tagline: info.tagline,
    statusLabel: info.statusLabel,
    isFull: mode === "full",
  };
}
