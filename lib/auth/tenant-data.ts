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
import type { PackageTier, LeadStatus, SourceType } from "@/lib/database-types";

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
  const { data, error } = await supabase
    .from("companies")
    .select("legal_name, brand_name, tier")
    .eq("id", companyId)
    .maybeSingle();
  // Log read failures: an RLS/infra regression must not be silent (finding F4).
  if (error) console.error("[tenant-data] getCompanySummary failed:", error.message);

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

/* -------------------------------------------------------------------------- */
/* Leads (Lead Inbox)                                                          */
/* -------------------------------------------------------------------------- */

export interface LeadListItem {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  serviceInterest: string | null;
  status: LeadStatus;
  sourceType: SourceType;
  notes: string | null;
  createdAt: string;
}

/**
 * Lead Inbox: the active company's leads, newest first, excluding soft-deleted.
 * RLS-scoped via the session client (never service-role). Capped for safety.
 */
export async function getLeads(companyId: string): Promise<LeadListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, company_name, contact_name, email, phone, service_interest, status, source_type, notes, created_at",
    )
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[tenant-data] getLeads failed:", error.message);
    return [];
  }

  const rows = (data ?? []) as Array<{
    id: string;
    company_name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    service_interest: string | null;
    status: LeadStatus;
    source_type: SourceType;
    notes: string | null;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    serviceInterest: row.service_interest,
    status: row.status,
    sourceType: row.source_type,
    notes: row.notes,
    createdAt: row.created_at,
  }));
}

/* -------------------------------------------------------------------------- */
/* Follow-ups                                                                  */
/* -------------------------------------------------------------------------- */

export interface FollowupListItem {
  id: string;
  stage: string;
  dueAt: string;
  channel: string | null;
  status: string;
  note: string | null;
  createdAt: string;
  /** Linked lead's display name (embedded via the lead_id FK), or null. */
  leadName: string | null;
}

/**
 * The active company's follow-up tasks, soonest due first. One embedded
 * PostgREST query (no N+1): `leads(company_name)` joins via the lead_id FK.
 * RLS-scoped via the session client (never service-role). Capped for safety.
 */
export async function getFollowups(
  companyId: string,
): Promise<FollowupListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("followup_tasks")
    .select(
      "id, stage, due_at, channel, status, note, created_at, leads ( company_name )",
    )
    .eq("company_id", companyId)
    .order("due_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("[tenant-data] getFollowups failed:", error.message);
    return [];
  }

  // The untyped client infers the embed as an array; PostgREST returns an
  // object for a to-one FK. Cast via unknown and handle both shapes.
  const rows = (data ?? []) as unknown as Array<{
    id: string;
    stage: string;
    due_at: string;
    channel: string | null;
    status: string;
    note: string | null;
    created_at: string;
    leads:
      | { company_name: string }
      | Array<{ company_name: string }>
      | null;
  }>;

  return rows.map((row) => {
    const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads;
    return {
      id: row.id,
      stage: row.stage,
      dueAt: row.due_at,
      channel: row.channel,
      status: row.status,
      note: row.note,
      createdAt: row.created_at,
      leadName: lead?.company_name ?? null,
    };
  });
}

/** Active company's service labels (for the new-lead form datalist). RLS-scoped. */
export async function getServiceLabels(companyId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_services")
    .select("label")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[tenant-data] getServiceLabels failed:", error.message);
    return [];
  }
  const rows = (data ?? []) as Array<{ label: string }>;
  return rows.map((r) => r.label);
}
