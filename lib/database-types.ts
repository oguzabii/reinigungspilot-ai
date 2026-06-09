/**
 * Klarsa Core — database types (high-level, hand-written).
 *
 * A simple TypeScript mirror of the Supabase schema in
 * `supabase/migrations/001_klarsa_core_schema.sql`. Enum unions match the SQL
 * enums exactly; each table has a `*Row` interface with snake_case fields that
 * match its columns (nullable columns are `T | null`).
 *
 * Scope (v0.2.1): types only — no client, no queries, no credentials. These are
 * hand-written for now and will be REPLACED by Supabase CLI-generated types
 * (`supabase gen types typescript`) once a staging project exists (v0.2.2).
 *
 * Relationship to `lib/klarsa-core-types.ts`: that file is the v0.2.0
 * app-domain sketch (camelCase, looser enums). This file is the authoritative
 * DATABASE layer. Row types are suffixed `Row` so both modules can be imported
 * without name clashes. Where a type is identical, it is shared — e.g.
 * `PackageTier` is re-exported from the core module rather than redefined.
 */

import type { PackageTier } from "@/lib/klarsa-core-types";

export type { PackageTier };

/** JSON value, for `jsonb` columns. */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

/* -------------------------------------------------------------------------- */
/* Enums (match the SQL enums 1:1)                                             */
/* -------------------------------------------------------------------------- */

export type MemberRole =
  | "owner"
  | "admin"
  | "sales"
  | "ops"
  | "readonly"
  | "superadmin";

export type ApprovalStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected";

export type SourceType =
  | "manual"
  | "website"
  | "email"
  | "import"
  | "lead_hunter"
  | "google"
  | "referral"
  | "partner"
  | "bexio"
  | "other";

export type LeadStatus =
  | "new"
  | "qualified"
  | "offer_ready"
  | "offer_sent"
  | "waiting_reply"
  | "followup_due"
  | "won"
  | "lost"
  | "archived";

export type ProspectStatus =
  | "raw"
  | "scored"
  | "approved"
  | "contacted"
  | "replied"
  | "converted"
  | "rejected"
  | "archived";

export type OfferStatus =
  | "draft"
  | "ready"
  | "sent"
  | "accepted"
  | "declined"
  | "expired"
  | "archived";

export type JobStatus =
  | "planned"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "archived";

export type HandoffStatus =
  | "not_ready"
  | "ready"
  | "queued"
  | "sent"
  | "failed"
  | "completed";

export type AuditActionType =
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "status_change"
  | "login"
  | "export"
  | "handoff"
  | "system";

/* Helper unions backed by CHECK constraints (not their own SQL enums). */
export type CompanyStatus = "trial" | "active" | "suspended";
export type BexioConnectionStatus =
  | "disconnected"
  | "connected"
  | "error"
  | "reconnect_required";
export type BexioLevel = "connect" | "plus";
export type FollowupStage = "24h" | "48h" | "5d_final";
export type FollowupTaskStatus =
  | "planned"
  | "due"
  | "overdue"
  | "done"
  | "skipped";

/* -------------------------------------------------------------------------- */
/* Shared column shapes                                                        */
/* -------------------------------------------------------------------------- */

/** Audit timestamps present on every table. */
export interface BaseColumns {
  id: string;
  created_at: string;
  updated_at: string;
}

/** Tenant scoping + actor columns common to most business tables. */
export interface TenantColumns {
  company_id: string;
  created_by: string | null;
  updated_by: string | null;
}

/* -------------------------------------------------------------------------- */
/* Row types (one per table, snake_case to match columns)                     */
/* -------------------------------------------------------------------------- */

export interface IndustryPresetRow extends BaseColumns {
  key: string;
  label: string;
  tagline: string | null;
  default_services: string[];
  default_sources: SourceType[];
  default_followup_cadence_hours: number[];
  target_customer_types: string[];
}

export interface UserProfileRow extends BaseColumns {
  email: string | null;
  display_name: string | null;
  locale: string;
  is_active: boolean;
  last_seen_at: string | null;
}

export interface CompanyRow extends BaseColumns {
  legal_name: string;
  brand_name: string;
  industry_preset_id: string | null;
  tier: PackageTier;
  regions_served: string[];
  status: CompanyStatus;
  is_first_tenant: boolean;
  created_by: string | null;
  deleted_at: string | null;
}

export interface CompanyMemberRow extends BaseColumns {
  company_id: string;
  user_id: string;
  role: MemberRole;
  is_active: boolean;
  invited_at: string | null;
  joined_at: string | null;
}

export interface CompanySettingsRow extends BaseColumns, TenantColumns {
  default_vat_rate_pct: number;
  followup_cadence_hours: number[];
  sender_name: string | null;
  sender_email: string | null;
  settings: Json;
}

export interface CompanyServiceRow extends BaseColumns, TenantColumns {
  key: string;
  label: string;
  description: string | null;
  price_label: string | null;
  is_active: boolean;
  sort_order: number;
  deleted_at: string | null;
}

export interface PricingModelRow extends BaseColumns, TenantColumns {
  name: string;
  unit: string | null;
  base_rate: number | null;
  params: Json;
  is_active: boolean;
  deleted_at: string | null;
}

export interface LeadSourceRow extends BaseColumns, TenantColumns {
  type: SourceType;
  label: string;
  enabled: boolean;
  notes: string | null;
  deleted_at: string | null;
}

export interface ProspectRow extends BaseColumns, TenantColumns {
  name: string;
  category: string | null;
  region: string | null;
  source_type: SourceType;
  search_query: string | null;
  score: number | null;
  confidence: number | null;
  reason: string | null;
  suggested_message: string | null;
  status: ProspectStatus;
  approval_status: ApprovalStatus;
  est_value_chf: number | null;
  promoted_lead_id: string | null;
  deleted_at: string | null;
}

export interface LeadRow extends BaseColumns, TenantColumns {
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  service_interest: string | null;
  region: string | null;
  status: LeadStatus;
  source_id: string | null;
  source_type: SourceType;
  est_value_chf: number | null;
  prospect_id: string | null;
  deleted_at: string | null;
}

export interface LeadScoreRow extends BaseColumns {
  company_id: string;
  lead_id: string;
  score: number;
  confidence: number | null;
  region_match: boolean | null;
  service_fit: boolean | null;
  reasons: string[];
  model_version: string | null;
  created_by: string | null;
}

export interface LeadActivityRow extends BaseColumns {
  company_id: string;
  lead_id: string;
  type: string;
  actor_user_id: string | null;
  summary: string;
  metadata: Json;
}

export interface OfferRow extends BaseColumns, TenantColumns {
  lead_id: string | null;
  reference: string;
  status: OfferStatus;
  total_net_chf: number;
  vat_rate_pct: number;
  total_gross_chf: number;
  valid_until: string | null;
  deleted_at: string | null;
}

export interface OfferItemRow extends BaseColumns {
  company_id: string;
  offer_id: string;
  label: string;
  detail: string | null;
  amount_chf: number;
  sort_order: number;
}

export interface FollowupTaskRow extends BaseColumns, TenantColumns {
  lead_id: string;
  offer_id: string | null;
  stage: FollowupStage;
  due_at: string;
  channel: string | null;
  status: FollowupTaskStatus;
  note: string | null;
}

export interface JobRow extends BaseColumns, TenantColumns {
  lead_id: string | null;
  offer_id: string | null;
  title: string;
  location: string | null;
  scheduled_for: string | null;
  team: string | null;
  status: JobStatus;
  value_chf: number | null;
  deleted_at: string | null;
}

export interface JobNoteRow extends BaseColumns {
  company_id: string;
  job_id: string;
  author_user_id: string | null;
  body: string;
  created_by: string | null;
  deleted_at: string | null;
}

export interface BexioConnectionRow extends BaseColumns, TenantColumns {
  status: BexioConnectionStatus;
  level: BexioLevel;
  /** Pointer to an encrypted token in a separate store — never the raw token. */
  secret_ref: string | null;
  connected_at: string | null;
  last_sync_at: string | null;
}

export interface BexioHandoffRow extends BaseColumns, TenantColumns {
  job_id: string;
  connection_id: string | null;
  status: HandoffStatus;
  net_chf: number;
  vat_rate_pct: number;
  gross_chf: number;
  invoice_draft_ref: string | null;
  queued_at: string | null;
  sent_at: string | null;
  error_message: string | null;
}

export interface AuditLogRow {
  id: string;
  company_id: string | null;
  actor_user_id: string | null;
  action: AuditActionType;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Json;
  ip_hash: string | null;
  created_at: string;
}

/* -------------------------------------------------------------------------- */
/* Table index                                                                */
/* -------------------------------------------------------------------------- */

/** Maps every table name to its row type. */
export interface KlarsaTables {
  industry_presets: IndustryPresetRow;
  user_profiles: UserProfileRow;
  companies: CompanyRow;
  company_members: CompanyMemberRow;
  company_settings: CompanySettingsRow;
  company_services: CompanyServiceRow;
  pricing_models: PricingModelRow;
  lead_sources: LeadSourceRow;
  prospects: ProspectRow;
  lead_scores: LeadScoreRow;
  leads: LeadRow;
  lead_activities: LeadActivityRow;
  offers: OfferRow;
  offer_items: OfferItemRow;
  followup_tasks: FollowupTaskRow;
  jobs: JobRow;
  job_notes: JobNoteRow;
  bexio_connections: BexioConnectionRow;
  bexio_handoffs: BexioHandoffRow;
  audit_logs: AuditLogRow;
}

/** Union of all table names. */
export type TableName = keyof KlarsaTables;

/** Row type for a given table name, e.g. `RowOf<"leads">`. */
export type RowOf<T extends TableName> = KlarsaTables[T];
