/**
 * Klarsa Core — shared domain types for the planned multi-tenant SaaS.
 *
 * These are FORWARD-LOOKING schema types for Klarsa Core (Phase 2+), aligned
 * one-to-one with `docs/data-model.md`. They describe the real multi-tenant
 * data model in which every business row carries a `companyId` for tenant
 * isolation. They are intentionally distinct from the local sales-demo display
 * types in `lib/demo-data.ts` (which use German display labels and carry no
 * tenant/audit fields).
 *
 * Types only — no runtime logic, no data, no secrets. Nothing here performs
 * I/O, talks to Supabase, or calls bexio. Timestamps are ISO-8601 strings.
 *
 * Status: PLAN. No table backed by these types exists yet. Real persistence
 * starts in v0.2.1 (Supabase schema) and only after auth + RLS + backup are in
 * place — see the "No Security = No Customer Data" rule in
 * `docs/security-architecture.md`.
 */

/* -------------------------------------------------------------------------- */
/* Enumerations                                                                */
/* -------------------------------------------------------------------------- */

/** Package tier. Mirrors `PackageId` in `lib/packages.ts` (kept inline so this
 *  core-types module stays dependency-free). */
export type PackageTier = "starter" | "pro" | "premium";

/** Controlled human-in-the-loop approval state. Outbound actions (e.g. Lead
 *  Hunter message drafts) must be `approved` by a person before they leave the
 *  system — there is no silent auto-send. */
export type ApprovalStatus = "pending" | "approved" | "rejected";

/**
 * Where a lead or prospect came from. Covers both inbound channels (web form,
 * phone, referral) and the controlled Lead Hunter discovery providers, which
 * are future/candidate sources — see `docs/lead-hunter-engine.md`.
 */
export type SourceType =
  | "web_form" // inbound website enquiry ("Website Anfrage")
  | "phone" // inbound call
  | "email" // inbound email
  | "google" // found via Google search / Google Business
  | "referral" // "Empfehlung"
  | "partner" // partner referral, e.g. "Umzugsfirma Partner"
  | "property_mgmt" // "Verwaltung"
  | "manual" // hand-entered ("manuell")
  | "csv_import" // bulk manual import (future)
  | "google_places" // Lead Hunter provider: Google Places / Maps API (future)
  | "zefix" // Lead Hunter validation: ZEFIX / Handelsregister (future)
  | "customer_list" // customer-owned list (future)
  | "website_signal"; // website / profile signal (future)

/** Lead pipeline stage. Code values; the demo UI maps these to German labels
 *  ("new" → "Neu", "won" → "Gewonnen", …). */
export type LeadStatus =
  | "new"
  | "qualified"
  | "offer"
  | "follow_up"
  | "won"
  | "lost";

/** Offer lifecycle. */
export type OfferStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "expired";

/** Job lifecycle. */
export type JobStatus =
  | "planned"
  | "confirmed"
  | "in_progress"
  | "done"
  | "cancelled";

/** Role of a user within one company (tenant). Drives RBAC + RLS policies. */
export type CompanyRole = "owner" | "admin" | "team" | "viewer";

/** Follow-up cadence step. */
export type FollowUpStage = "24h" | "48h" | "5d_final";

/* -------------------------------------------------------------------------- */
/* Shared field mixins                                                         */
/* -------------------------------------------------------------------------- */

/** Standard audit timestamps present on every row. */
export interface Timestamped {
  /** ISO-8601 creation time. */
  createdAt: string;
  /** ISO-8601 last-update time. */
  updatedAt: string;
}

/** Soft-delete marker. `null`/absent = active; set = logically deleted and
 *  hidden by default, restorable by an admin. */
export interface SoftDeletable {
  deletedAt?: string | null;
}

/** Every tenant-scoped row carries the owning company for `company_id` based
 *  isolation (enforced by Supabase RLS in production). */
export interface TenantScoped {
  companyId: string;
}

/* -------------------------------------------------------------------------- */
/* Tenant & identity                                                           */
/* -------------------------------------------------------------------------- */

/** A tenant. The top of the isolation hierarchy — everything else is scoped to
 *  a `companyId`. (`companies` table.) */
export interface Company extends Timestamped, SoftDeletable {
  id: string;
  /** Legal name, e.g. "Clean24 Memis GmbH". */
  legalName: string;
  /** Public brand shown to end-customers, e.g. "Clean24". */
  brandName: string;
  /** FK → industry_presets (e.g. the "reinigung" preset). */
  industryPresetId: string;
  /** Active subscription tier. */
  tier: PackageTier;
  /** Cantons / regions this company serves (canton codes or city labels). */
  regionsServed: string[];
  status: "trial" | "active" | "suspended";
  /** Clean24 is flagged as the first tenant / live proof. */
  isFirstTenant: boolean;
}

/** Membership join between a user and a company, with the user's role in that
 *  tenant. A user may belong to several companies. (`company_members` table.) */
export interface CompanyMember extends Timestamped, TenantScoped {
  id: string;
  /** FK → user_profiles / auth user id. */
  userId: string;
  role: CompanyRole;
  status: "invited" | "active" | "disabled";
  invitedAt?: string;
  joinedAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Configuration                                                               */
/* -------------------------------------------------------------------------- */

/** A trade template (cleaning, moving, …) that seeds default services, sources,
 *  follow-up cadence and target customer types. Global catalog, not tenant
 *  scoped. (`industry_presets` table.) */
export interface IndustryPreset extends Timestamped {
  id: string;
  /** Stable key, e.g. "reinigung". */
  key: string;
  /** Display label, e.g. "Reinigung". */
  label: string;
  tagline: string;
  defaultServices: string[];
  defaultSources: SourceType[];
  /** Default follow-up offsets in hours, e.g. [24, 48, 120]. */
  defaultFollowUpCadenceHours: number[];
  targetCustomerTypes: string[];
}

/* -------------------------------------------------------------------------- */
/* Leads & prospects                                                           */
/* -------------------------------------------------------------------------- */

/** A configured inbound/discovery source for one company. (`lead_sources`.) */
export interface LeadSource extends Timestamped, TenantScoped {
  id: string;
  type: SourceType;
  /** Human label as shown in the UI, e.g. "Website Anfrage". */
  label: string;
  enabled: boolean;
  notes?: string;
}

/** An inbound enquiry. (`leads` table.) */
export interface Lead extends Timestamped, SoftDeletable, TenantScoped {
  id: string;
  /** Name of the enquiring company / customer. */
  company: string;
  contactName?: string;
  email?: string;
  phone?: string;
  serviceInterest?: string;
  region?: string;
  status: LeadStatus;
  /** FK → lead_sources. */
  sourceId?: string;
  sourceType: SourceType;
  estValueChf?: number;
  /** Set when this lead was promoted from a Lead Hunter prospect. */
  prospectId?: string | null;
}

/** A Lead Hunter discovery candidate, before it becomes a real lead. Carries
 *  the audit trail (query, source, reason) and an approval gate. (`prospects`.) */
export interface Prospect extends Timestamped, SoftDeletable, TenantScoped {
  id: string;
  name: string;
  category: string;
  region: string;
  sourceType: SourceType;
  /** The exact query that surfaced this prospect (provenance). */
  searchQuery?: string;
  score?: number;
  confidence?: number;
  /** Why the engine thinks this prospect fits — human-readable. */
  reason?: string;
  /** Draft outreach message — never sent without approval. */
  suggestedMessage?: string;
  approvalStatus: ApprovalStatus;
  estValueChf?: number;
  /** Set once promoted into the `leads` pipeline. */
  promotedLeadId?: string | null;
}

/** A scoring record for a lead — append-only, so score history is auditable.
 *  (`lead_scores` table.) */
export interface LeadScore extends Timestamped, TenantScoped {
  id: string;
  /** FK → leads. */
  leadId: string;
  score: number;
  confidence: number;
  regionMatch: boolean;
  serviceFit: boolean;
  reasons: string[];
  /** Scoring model / ruleset version for reproducibility. */
  modelVersion?: string;
}

/** An activity on a lead (status change, note, message, call). Append-only
 *  timeline used for the lead history. (`lead_activities` table.) */
export interface LeadActivity extends Timestamped, TenantScoped {
  id: string;
  /** FK → leads. */
  leadId: string;
  /** e.g. "status_change", "note", "email_out", "call". */
  type: string;
  actorUserId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

/* -------------------------------------------------------------------------- */
/* Offers                                                                      */
/* -------------------------------------------------------------------------- */

/** A quote/offer generated for a lead. (`offers` table.) */
export interface Offer extends Timestamped, SoftDeletable, TenantScoped {
  id: string;
  /** FK → leads. */
  leadId: string;
  /** Human reference, e.g. "OF-2026-0142". */
  reference: string;
  status: OfferStatus;
  totalNetChf: number;
  vatRatePct: number;
  totalGrossChf: number;
  validUntil?: string;
}

/** A line item on an offer. (`offer_items` table.) */
export interface OfferItem extends TenantScoped {
  id: string;
  /** FK → offers. */
  offerId: string;
  label: string;
  detail?: string;
  amountChf: number;
  sortOrder: number;
}

/* -------------------------------------------------------------------------- */
/* Follow-ups & jobs                                                           */
/* -------------------------------------------------------------------------- */

/** A scheduled follow-up step for a lead/offer. (`followup_tasks` table.) */
export interface FollowupTask extends Timestamped, TenantScoped {
  id: string;
  /** FK → leads. */
  leadId: string;
  /** FK → offers (optional). */
  offerId?: string | null;
  stage: FollowUpStage;
  /** ISO-8601 due time. */
  dueAt: string;
  channel: string;
  status: "planned" | "due" | "overdue" | "done" | "skipped";
  note?: string;
}

/** A won job to be planned and executed. (`jobs` table.) */
export interface Job extends Timestamped, SoftDeletable, TenantScoped {
  id: string;
  /** FK → leads (optional). */
  leadId?: string;
  /** FK → offers (optional). */
  offerId?: string;
  title: string;
  location?: string;
  /** ISO-8601 scheduled start. */
  scheduledFor?: string;
  team?: string;
  status: JobStatus;
  valueChf?: number;
}

/** A note attached to a job (handover, on-site remarks). (`job_notes` table.) */
export interface JobNote extends Timestamped, TenantScoped {
  id: string;
  /** FK → jobs. */
  jobId: string;
  authorUserId?: string;
  body: string;
}

/* -------------------------------------------------------------------------- */
/* bexio                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Per-company bexio connection METADATA. Critically, OAuth access/refresh
 * tokens are NEVER part of this app type — encrypted tokens live in a separate,
 * restricted store and are never logged. See `docs/bexio-architecture.md` and
 * `docs/security-architecture.md`. (`bexio_connections` table.)
 */
export interface BexioConnection extends Timestamped, TenantScoped {
  id: string;
  status: "disconnected" | "connected" | "error" | "reconnect_required";
  /** "connect" (Pro) or "plus" (Premium). */
  level: "connect" | "plus";
  connectedAt?: string;
  lastSyncAt?: string;
}

/** A queued/sent handover of a won job to bexio. (`bexio_handoffs` table.) */
export interface BexioHandoff extends Timestamped, TenantScoped {
  id: string;
  /** FK → jobs. */
  jobId: string;
  /** FK → bexio_connections. */
  connectionId: string;
  status: "queued" | "sent" | "failed" | "reconciled";
  netChf: number;
  vatRatePct: number;
  grossChf: number;
  invoiceDraftRef?: string;
  queuedAt: string;
  sentAt?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Audit                                                                       */
/* -------------------------------------------------------------------------- */

/** Append-only audit record for security-relevant actions (create/update/
 *  delete/restore, exports, bexio handoffs, approvals). (`audit_logs` table.) */
export interface AuditLog extends TenantScoped {
  id: string;
  actorUserId?: string;
  /** Dotted action name, e.g. "lead.create", "offer.send", "bexio.handoff". */
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  /** Hashed (never raw) client IP, for abuse investigation. */
  ipHash?: string;
  /** ISO-8601 time the action occurred. */
  createdAt: string;
}
