/**
 * Tenant read helpers for the app shell. SERVER-ONLY.
 *
 * These read fake staging data through the **anon/session** server client, so
 * **Row Level Security applies** — a user only ever sees their own company's
 * rows. We deliberately do NOT use the service-role/admin client here (it would
 * bypass RLS). Counts are scoped to the active company id.
 *
 * Build/runtime safe: only invoked at request time from the dynamic
 * `/app-shell` page. No real customer data — staging uses `@example.test` data.
 */

import { createClient } from "@/lib/supabase/server";
import type { PackageTier } from "@/lib/database-types";

type CountTable =
  | "prospects"
  | "leads"
  | "offers"
  | "jobs"
  | "followup_tasks"
  | "bexio_handoffs";

export interface TenantCounts {
  prospects: number | null;
  leads: number | null;
  offers: number | null;
  jobs: number | null;
  followupTasks: number | null;
  bexioHandoffs: number | null;
}

export interface CompanySummary {
  name: string;
  legalName: string;
  tier: PackageTier;
}

/** Brand/legal name + tier for the active company (RLS-scoped). */
export async function getCompanySummary(
  companyId: string,
): Promise<CompanySummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("legal_name, brand_name, tier")
    .eq("id", companyId)
    .maybeSingle();

  const row = data as
    | { legal_name: string; brand_name: string; tier: PackageTier }
    | null;
  if (!row) return null;

  return {
    name: row.brand_name || row.legal_name,
    legalName: row.legal_name,
    tier: row.tier,
  };
}

/** Row counts per module for the active company. Each value is RLS-scoped. */
export async function getTenantCounts(companyId: string): Promise<TenantCounts> {
  const supabase = await createClient();

  const runCount = async (table: CountTable): Promise<number | null> => {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);
    return error ? null : count ?? 0;
  };

  const [prospects, leads, offers, jobs, followupTasks, bexioHandoffs] =
    await Promise.all([
      runCount("prospects"),
      runCount("leads"),
      runCount("offers"),
      runCount("jobs"),
      runCount("followup_tasks"),
      runCount("bexio_handoffs"),
    ]);

  return { prospects, leads, offers, jobs, followupTasks, bexioHandoffs };
}
