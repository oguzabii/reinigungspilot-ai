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
  HandoffStatus,
  BillingStatus,
} from "@/lib/database-types";
import {
  DEFAULT_AUTOPILOT_TOGGLES,
  type AutopilotToggles,
} from "@/components/revenue-autopilot/policy";

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
  /** Billing lifecycle (e.g. `internal_founder` for the Clean24 founder tenant). */
  billingStatus: BillingStatus | null;
}

/** Brand/legal name + tier + billing status for the active company (RLS-scoped). */
export async function getCompanySummary(
  companyId: string,
): Promise<CompanySummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("legal_name, brand_name, tier, billing_status")
    .eq("id", companyId)
    .maybeSingle();
  // Log read failures: an RLS/infra regression must not be silent (finding F4).
  if (error) console.error("[tenant-data] getCompanySummary failed:", error.message);

  const row = data as
    | {
        legal_name: string;
        brand_name: string;
        tier: PackageTier;
        billing_status: BillingStatus | null;
      }
    | null;
  if (!row) return null;

  return {
    name: row.brand_name || row.legal_name,
    legalName: row.legal_name,
    tier: row.tier,
    billingStatus: row.billing_status ?? null,
  };
}

export interface CompanySettingsInfo {
  /** Person who signs outbound messages (company_settings.sender_name), or null. */
  senderName: string | null;
  /** Reply-to address shown in drafts (company_settings.sender_email), or null. */
  senderEmail: string | null;
}

/**
 * The active company's settings relevant to outreach drafts (sender identity).
 * RLS-scoped via the session client (never service-role). Returns nulls if no
 * settings row or no values — drafts then fall back to the brand name. This is
 * read-only and used only to personalise copy-and-paste drafts (no sending).
 */
export async function getCompanySettings(
  companyId: string,
): Promise<CompanySettingsInfo> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_settings")
    .select("sender_name, sender_email")
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) {
    console.error("[tenant-data] getCompanySettings failed:", error.message);
    return { senderName: null, senderEmail: null };
  }
  const row = data as { sender_name: string | null; sender_email: string | null } | null;
  return {
    senderName: row?.sender_name ?? null,
    senderEmail: row?.sender_email ?? null,
  };
}

/**
 * The active company's Autopilot safe-mode toggles, read from the
 * `company_settings.settings` jsonb (key `autopilot`). RLS-scoped via the
 * session client (never service-role). Missing/invalid values fall back to the
 * SAFE defaults (everything OFF). No schema change — reuses the existing jsonb.
 */
export async function getAutopilotPolicy(
  companyId: string,
): Promise<AutopilotToggles> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_settings")
    .select("settings")
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) {
    console.error("[tenant-data] getAutopilotPolicy failed:", error.message);
    return { ...DEFAULT_AUTOPILOT_TOGGLES };
  }
  const settings = (data?.settings ?? {}) as Record<string, unknown>;
  const a = (settings.autopilot ?? {}) as Partial<AutopilotToggles>;
  return {
    autoCreateColdCandidates: Boolean(a.autoCreateColdCandidates),
    autoReplyInbound: Boolean(a.autoReplyInbound),
    autoFollowupExistingApproved: Boolean(a.autoFollowupExistingApproved),
    autoAppointmentProposal: Boolean(a.autoAppointmentProposal),
  };
}

export interface DiscoveryRunLog {
  id: string;
  createdAt: string;
  /** Which approved source the run used (e.g. "google", "baugesuche"). */
  source: string | null;
  query: string | null;
  region: string | null;
  found: number | null;
  created: number | null;
  deduped: number | null;
  autoCreate: boolean | null;
  status: string | null;
}

/**
 * Recent automatic-discovery runs, read from `audit_logs`
 * (`entity_type = 'discovery_run'`). Append-only transparency — no silent
 * actions. RLS-scoped via the session client (never service-role).
 */
export async function getDiscoveryRuns(
  companyId: string,
  limit = 10,
): Promise<DiscoveryRunLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, created_at, metadata")
    .eq("company_id", companyId)
    .eq("entity_type", "discovery_run")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[tenant-data] getDiscoveryRuns failed:", error.message);
    return [];
  }
  const rows = (data ?? []) as Array<{
    id: string;
    created_at: string;
    metadata: Record<string, unknown> | null;
  }>;
  const num = (v: unknown): number | null =>
    typeof v === "number" ? v : null;
  const str = (v: unknown): string | null =>
    typeof v === "string" ? v : null;
  return rows.map((r) => {
    const m = r.metadata ?? {};
    return {
      id: r.id,
      createdAt: r.created_at,
      source: str(m.source) ?? str(m.provider),
      query: str(m.query),
      region: str(m.region),
      found: num(m.found),
      created: num(m.created),
      deduped: num(m.deduped),
      autoCreate: typeof m.autoCreate === "boolean" ? m.autoCreate : null,
      status: str(m.status),
    };
  });
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
  /** The linked lead's id (followup_tasks.lead_id, NOT NULL). */
  leadId: string;
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
      "id, stage, due_at, channel, status, note, created_at, lead_id, leads ( company_name )",
    )
    .eq("company_id", companyId)
    // Archived/removed follow-ups (status 'skipped') leave the active list.
    .neq("status", "skipped")
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
    lead_id: string;
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
      leadId: row.lead_id,
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

export interface JobDocumentScopeItem {
  label: string;
  detail: string | null;
  amountChf: number;
}

/**
 * Rich job data for the customer/partner documents (Auftragsbestätigung,
 * Partner-Einsatzbestätigung): the job joined with its source offer (the agreed
 * scope = offer line items + pricing) and the customer lead. One embedded
 * PostgREST query (no N+1). RLS-scoped via the session client (never
 * service-role). Returns null if the job is not this tenant's. No migration —
 * uses only existing columns.
 */
export interface JobDocumentData {
  id: string;
  title: string;
  status: JobStatus;
  valueChf: number | null;
  scheduledFor: string | null;
  location: string | null;
  team: string | null;
  createdAt: string;
  customerName: string | null;
  customerContact: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerRegion: string | null;
  serviceInterest: string | null;
  offerReference: string | null;
  offerNetChf: number | null;
  offerVatRatePct: number | null;
  offerGrossChf: number | null;
  offerValidUntil: string | null;
  scopeItems: JobDocumentScopeItem[];
}

const JOB_DOC_SELECT =
  "id, title, status, value_chf, scheduled_for, location, team, created_at, offers ( reference, total_net_chf, vat_rate_pct, total_gross_chf, valid_until, offer_items ( label, detail, amount_chf, sort_order ) ), leads ( company_name, contact_name, email, phone, region, service_interest )";

interface RawJobDocOffer {
  reference: string;
  total_net_chf: number | string;
  vat_rate_pct: number | string;
  total_gross_chf: number | string;
  valid_until: string | null;
  offer_items: Array<{
    label: string;
    detail: string | null;
    amount_chf: number | string;
    sort_order: number;
  }> | null;
}
interface RawJobDocLead {
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  region: string | null;
  service_interest: string | null;
}
interface RawJobDocRow {
  id: string;
  title: string;
  status: JobStatus;
  value_chf: number | string | null;
  scheduled_for: string | null;
  location: string | null;
  team: string | null;
  created_at: string;
  offers: RawJobDocOffer | RawJobDocOffer[] | null;
  leads: RawJobDocLead | RawJobDocLead[] | null;
}

export async function getJobDocumentData(
  companyId: string,
  jobId: string,
): Promise<JobDocumentData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_DOC_SELECT)
    .eq("company_id", companyId)
    .eq("id", jobId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[tenant-data] getJobDocumentData failed:", error.message);
    return null;
  }
  if (!data) return null;

  const row = data as unknown as RawJobDocRow;
  const offer = Array.isArray(row.offers) ? row.offers[0] : row.offers;
  const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads;
  const scopeItems: JobDocumentScopeItem[] = (offer?.offer_items ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((it) => ({
      label: it.label,
      detail: it.detail,
      amountChf: Number(it.amount_chf) || 0,
    }));

  return {
    id: row.id,
    title: row.title,
    status: row.status,
    valueChf: row.value_chf === null ? null : Number(row.value_chf) || 0,
    scheduledFor: row.scheduled_for,
    location: row.location,
    team: row.team,
    createdAt: row.created_at,
    customerName: lead?.company_name ?? null,
    customerContact: lead?.contact_name ?? null,
    customerEmail: lead?.email ?? null,
    customerPhone: lead?.phone ?? null,
    customerRegion: lead?.region ?? null,
    serviceInterest: lead?.service_interest ?? null,
    offerReference: offer?.reference ?? null,
    offerNetChf: offer ? Number(offer.total_net_chf) || 0 : null,
    offerVatRatePct: offer ? Number(offer.vat_rate_pct) || 0 : null,
    offerGrossChf: offer ? Number(offer.total_gross_chf) || 0 : null,
    offerValidUntil: offer?.valid_until ?? null,
    scopeItems,
  };
}

/* -------------------------------------------------------------------------- */
/* bexio handoffs (manual invoice-handoff queue)                               */
/* -------------------------------------------------------------------------- */

export interface HandoffInfo {
  id: string;
  status: HandoffStatus;
  netChf: number;
  vatRatePct: number;
  grossChf: number;
  invoiceDraftRef: string | null;
  createdAt: string;
}

export interface HandoffJobItem {
  id: string;
  title: string;
  status: JobStatus;
  valueChf: number | null;
  scheduledFor: string | null;
  location: string | null;
  createdAt: string;
  offerReference: string | null;
  offerNetChf: number | null;
  offerVatRatePct: number | null;
  offerGrossChf: number | null;
  customerName: string | null;
  customerContact: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerRegion: string | null;
  serviceInterest: string | null;
  /** Existing handoff for this job (most recent), or null. */
  handoff: HandoffInfo | null;
}

const HANDOFF_JOB_SELECT =
  "id, title, status, value_chf, scheduled_for, location, created_at, offers ( reference, total_net_chf, vat_rate_pct, total_gross_chf ), leads ( company_name, contact_name, email, phone, region, service_interest ), bexio_handoffs ( id, status, net_chf, vat_rate_pct, gross_chf, invoice_draft_ref, created_at )";

interface RawHandoffOffer {
  reference: string;
  total_net_chf: number | string;
  vat_rate_pct: number | string;
  total_gross_chf: number | string;
}
interface RawHandoffLead {
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  region: string | null;
  service_interest: string | null;
}
interface RawHandoffRow {
  id: string;
  title: string;
  status: JobStatus;
  value_chf: number | string | null;
  scheduled_for: string | null;
  location: string | null;
  created_at: string;
  offers: RawHandoffOffer | RawHandoffOffer[] | null;
  leads: RawHandoffLead | RawHandoffLead[] | null;
  bexio_handoffs: Array<{
    id: string;
    status: HandoffStatus;
    net_chf: number | string;
    vat_rate_pct: number | string;
    gross_chf: number | string;
    invoice_draft_ref: string | null;
    created_at: string;
  }> | null;
}

/**
 * Jobs joined with their source offer + customer lead + any existing bexio
 * handoff, for the manual invoice-handoff queue. One embedded PostgREST query
 * (no N+1). RLS-scoped via the session client (never service-role). Capped for
 * safety. The page splits these into ready / prepared / invoiced.
 */
export async function getInvoiceHandoffJobs(
  companyId: string,
): Promise<HandoffJobItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(HANDOFF_JOB_SELECT)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[tenant-data] getInvoiceHandoffJobs failed:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as RawHandoffRow[]).map((row) => {
    const offer = Array.isArray(row.offers) ? row.offers[0] : row.offers;
    const lead = Array.isArray(row.leads) ? row.leads[0] : row.leads;
    // One handoff per job is the norm; pick the most recent defensively.
    const handoffs = (row.bexio_handoffs ?? [])
      .slice()
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const h = handoffs[0];
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      valueChf: row.value_chf === null ? null : Number(row.value_chf) || 0,
      scheduledFor: row.scheduled_for,
      location: row.location,
      createdAt: row.created_at,
      offerReference: offer?.reference ?? null,
      offerNetChf: offer ? Number(offer.total_net_chf) || 0 : null,
      offerVatRatePct: offer ? Number(offer.vat_rate_pct) || 0 : null,
      offerGrossChf: offer ? Number(offer.total_gross_chf) || 0 : null,
      customerName: lead?.company_name ?? null,
      customerContact: lead?.contact_name ?? null,
      customerEmail: lead?.email ?? null,
      customerPhone: lead?.phone ?? null,
      customerRegion: lead?.region ?? null,
      serviceInterest: lead?.service_interest ?? null,
      handoff: h
        ? {
            id: h.id,
            status: h.status,
            netChf: Number(h.net_chf) || 0,
            vatRatePct: Number(h.vat_rate_pct) || 0,
            grossChf: Number(h.gross_chf) || 0,
            invoiceDraftRef: h.invoice_draft_ref,
            createdAt: h.created_at,
          }
        : null,
    };
  });
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
  /** Optional registered source it was prepared from (prospects.source_id, 006). */
  sourceId: string | null;
  /** Embedded label of that source (lead_sources.label), or null. */
  sourceLabel: string | null;
  // Contact fields for controlled outreach (migration 007, v0.5.9).
  contactEmail: string | null;
  contactPhone: string | null;
  contactWebsite: string | null;
  contactPerson: string | null;
  /** When the owner last contacted this candidate (set by the send action). */
  lastContactedAt: string | null;
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
      "id, name, category, region, source_type, source_id, search_query, score, reason, suggested_message, status, created_at, promoted_lead_id, contact_email, contact_phone, contact_website, contact_person, last_contacted_at, lead_sources ( label )",
    )
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[tenant-data] getProspects failed:", error.message);
    return [];
  }

  // The untyped client infers the embed as an array; PostgREST returns an object
  // for a to-one FK. Accept both shapes and narrow.
  const rows = (data ?? []) as unknown as Array<{
    id: string;
    name: string;
    category: string | null;
    region: string | null;
    source_type: SourceType;
    source_id: string | null;
    search_query: string | null;
    score: number | null;
    reason: string | null;
    suggested_message: string | null;
    status: ProspectStatus;
    created_at: string;
    promoted_lead_id: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    contact_website: string | null;
    contact_person: string | null;
    last_contacted_at: string | null;
    lead_sources: { label: string } | Array<{ label: string }> | null;
  }>;

  return rows.map((row) => {
    const source = Array.isArray(row.lead_sources)
      ? row.lead_sources[0]
      : row.lead_sources;
    return {
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
      sourceId: row.source_id,
      sourceLabel: source?.label ?? null,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      contactWebsite: row.contact_website,
      contactPerson: row.contact_person,
      lastContactedAt: row.last_contacted_at,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Lead sources (Lead Hunter — Source Registry)                                */
/* -------------------------------------------------------------------------- */

export interface LeadSourceListItem {
  id: string;
  type: SourceType;
  label: string;
  enabled: boolean;
  notes: string | null;
  createdAt: string;
}

/**
 * A single registered lead source by id, scoped to the active company and not
 * soft-deleted. RLS-scoped via the session client (never service-role). Returns
 * null if the source does not exist for this tenant — used to seed the
 * "Opportunity aus Quelle" workflow (foreign/unknown id → null, never leaks).
 */
export async function getLeadSourceById(
  companyId: string,
  sourceId: string,
): Promise<LeadSourceListItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_sources")
    .select("id, type, label, enabled, notes, created_at")
    .eq("company_id", companyId)
    .eq("id", sourceId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[tenant-data] getLeadSourceById failed:", error.message);
    return null;
  }
  if (!data) return null;

  const row = data as {
    id: string;
    type: SourceType;
    label: string;
    enabled: boolean;
    notes: string | null;
    created_at: string;
  };
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    enabled: row.enabled,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

/**
 * The active company's registered lead sources, newest first, excluding
 * soft-deleted. RLS-scoped via the session client (never service-role). Capped
 * for safety. These are a human-curated catalog — no external lookup runs.
 */
export async function getLeadSources(
  companyId: string,
): Promise<LeadSourceListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_sources")
    .select("id, type, label, enabled, notes, created_at")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[tenant-data] getLeadSources failed:", error.message);
    return [];
  }

  const rows = (data ?? []) as Array<{
    id: string;
    type: SourceType;
    label: string;
    enabled: boolean;
    notes: string | null;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    label: row.label,
    enabled: row.enabled,
    notes: row.notes,
    createdAt: row.created_at,
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
