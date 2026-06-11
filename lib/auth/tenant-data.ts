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
import type {
  PackageTier,
  LeadStatus,
  SourceType,
  OfferStatus,
  JobStatus,
  ProspectStatus,
} from "@/lib/database-types";

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

/* -------------------------------------------------------------------------- */
/* Offers (Offer Engine)                                                       */
/* -------------------------------------------------------------------------- */

export interface OfferItemListItem {
  id: string;
  label: string;
  detail: string | null;
  amountChf: number;
  sortOrder: number;
}

export interface OfferListItem {
  id: string;
  reference: string;
  status: OfferStatus;
  totalNetChf: number;
  vatRatePct: number;
  totalGrossChf: number;
  validUntil: string | null;
  createdAt: string;
  leadId: string | null;
  /** Linked lead's display name (embedded via the lead_id FK), or null. */
  leadName: string | null;
  items: OfferItemListItem[];
  /** True if a non-deleted job already exists for this offer (duplicate guard). */
  hasJob: boolean;
}

const OFFER_SELECT =
  "id, reference, status, total_net_chf, vat_rate_pct, total_gross_chf, valid_until, created_at, lead_id, leads ( company_name ), offer_items ( id, label, detail, amount_chf, sort_order ), jobs ( id, deleted_at )";

// The untyped client infers the embedded lead as an array; PostgREST returns an
// object for a to-one FK. We accept both shapes and coerce numerics (numeric
// columns can arrive as strings).
interface RawOfferRow {
  id: string;
  reference: string;
  status: OfferStatus;
  total_net_chf: number | string;
  vat_rate_pct: number | string;
  total_gross_chf: number | string;
  valid_until: string | null;
  created_at: string;
  lead_id: string | null;
  leads: { company_name: string } | Array<{ company_name: string }> | null;
  offer_items: Array<{
    id: string;
    label: string;
    detail: string | null;
    amount_chf: number | string;
    sort_order: number;
  }> | null;
  jobs: Array<{ id: string; deleted_at: string | null }> | null;
}

function mapOfferRow(row: RawOfferRow): OfferListItem {
  const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads;
  const items = (row.offer_items ?? [])
    .map((it) => ({
      id: it.id,
      label: it.label,
      detail: it.detail,
      amountChf: Number(it.amount_chf) || 0,
      sortOrder: it.sort_order,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    totalNetChf: Number(row.total_net_chf) || 0,
    vatRatePct: Number(row.vat_rate_pct) || 0,
    totalGrossChf: Number(row.total_gross_chf) || 0,
    validUntil: row.valid_until,
    createdAt: row.created_at,
    leadId: row.lead_id,
    leadName: lead?.company_name ?? null,
    items,
    hasJob: (row.jobs ?? []).some((j) => j.deleted_at === null),
  };
}

/**
 * The active company's offers, newest first, excluding soft-deleted. One
 * embedded PostgREST query (no N+1): `leads(company_name)` joins the source
 * lead and `offer_items(...)` pulls the line items. RLS-scoped via the session
 * client (never service-role). Capped for safety.
 */
export async function getOffers(companyId: string): Promise<OfferListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offers")
    .select(OFFER_SELECT)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[tenant-data] getOffers failed:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as RawOfferRow[]).map(mapOfferRow);
}

/**
 * A single offer by id, scoped to the active company and not soft-deleted.
 * RLS-scoped via the session client (never service-role). Returns null if the
 * offer does not exist for this tenant — used by the protected PDF route.
 */
export async function getOfferById(
  companyId: string,
  offerId: string,
): Promise<OfferListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offers")
    .select(OFFER_SELECT)
    .eq("company_id", companyId)
    .eq("id", offerId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[tenant-data] getOfferById failed:", error.message);
    return null;
  }
  if (!data) return null;
  return mapOfferRow(data as unknown as RawOfferRow);
}

/* -------------------------------------------------------------------------- */
/* Jobs (from accepted offers)                                                 */
/* -------------------------------------------------------------------------- */

export interface JobListItem {
  id: string;
  title: string;
  status: JobStatus;
  valueChf: number | null;
  scheduledFor: string | null;
  location: string | null;
  createdAt: string;
  /** Source offer reference (embedded via offer_id), or null. */
  offerReference: string | null;
  /** Customer/lead display name (embedded via lead_id), or null. */
  customerName: string | null;
}

const JOB_SELECT =
  "id, title, status, value_chf, scheduled_for, location, created_at, offers ( reference ), leads ( company_name )";

interface RawJobRow {
  id: string;
  title: string;
  status: JobStatus;
  value_chf: number | string | null;
  scheduled_for: string | null;
  location: string | null;
  created_at: string;
  offers: { reference: string } | Array<{ reference: string }> | null;
  leads: { company_name: string } | Array<{ company_name: string }> | null;
}

function mapJobRow(row: RawJobRow): JobListItem {
  const offer = Array.isArray(row.offers) ? row.offers[0] : row.offers;
  const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads;
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    valueChf: row.value_chf === null ? null : Number(row.value_chf) || 0,
    scheduledFor: row.scheduled_for,
    location: row.location,
    createdAt: row.created_at,
    offerReference: offer?.reference ?? null,
    customerName: lead?.company_name ?? null,
  };
}

/**
 * The active company's jobs, newest first, excluding soft-deleted. One embedded
 * PostgREST query (no N+1): `offers(reference)` is the source offer and
 * `leads(company_name)` the customer. RLS-scoped via the session client (never
 * service-role). Capped for safety.
 */
export async function getJobs(companyId: string): Promise<JobListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[tenant-data] getJobs failed:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as RawJobRow[]).map(mapJobRow);
}

/**
 * A single job by id, scoped to the active company and not soft-deleted.
 * RLS-scoped via the session client (never service-role). Returns null if the
 * job does not exist for this tenant — used by the protected ICS route.
 */
export async function getJobById(
  companyId: string,
  jobId: string,
): Promise<JobListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("company_id", companyId)
    .eq("id", jobId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[tenant-data] getJobById failed:", error.message);
    return null;
  }
  if (!data) return null;
  return mapJobRow(data as unknown as RawJobRow);
}

/* -------------------------------------------------------------------------- */
/* Opportunities (Lead Hunter / Opportunity Radar — manual prospects)          */
/* -------------------------------------------------------------------------- */

export interface OpportunityListItem {
  id: string;
  name: string;
  /** Opportunity type (prospects.category). */
  category: string | null;
  region: string | null;
  sourceType: SourceType;
  /** Service potential (prospects.search_query, repurposed). */
  servicePotential: string | null;
  score: number | null;
  reason: string | null;
  /** Next action (prospects.suggested_message, repurposed). */
  nextAction: string | null;
  status: ProspectStatus;
  createdAt: string;
  /** Set once promoted into the Lead Inbox (prospects.promoted_lead_id). */
  promotedLeadId: string | null;
}

/**
 * The active company's opportunities (manual prospects), newest first, excluding
 * soft-deleted. RLS-scoped via the session client (never service-role). Capped
 * for safety. No external source — these are manually captured.
 */
export async function getProspects(
  companyId: string,
): Promise<OpportunityListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospects")
    .select(
      "id, name, category, region, source_type, search_query, score, reason, suggested_message, status, created_at, promoted_lead_id",
    )
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[tenant-data] getProspects failed:", error.message);
    return [];
  }

  const rows = (data ?? []) as Array<{
    id: string;
    name: string;
    category: string | null;
    region: string | null;
    source_type: SourceType;
    search_query: string | null;
    score: number | null;
    reason: string | null;
    suggested_message: string | null;
    status: ProspectStatus;
    created_at: string;
    promoted_lead_id: string | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    region: row.region,
    sourceType: row.source_type,
    servicePotential: row.search_query,
    score: row.score,
    reason: row.reason,
    nextAction: row.suggested_message,
    status: row.status,
    createdAt: row.created_at,
    promotedLeadId: row.promoted_lead_id,
  }));
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
