/**
 * Session helpers for Klarsa Core. SERVER-ONLY.
 *
 * Thin, guarded wrappers around the request-scoped server client. They are
 * meant for Server Components / Route Handlers / Server Actions and must NOT be
 * called from a static page at build time (they read cookies, a dynamic API).
 *
 * Every helper degrades gracefully: if Supabase is not configured, or there is
 * no signed-in user, they return `null` / `[]` rather than throwing — so the
 * foundation is safe before real auth/env exist.
 *
 * Data shape mirrors the schema (see lib/database-types.ts); the Supabase
 * client is not yet typed with the generated Database type, so the few rows we
 * read are narrowed with explicit casts. No real customer data flows yet.
 */

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { MemberRole } from "@/lib/database-types";

export interface SessionUser {
  id: string;
  email: string | null;
}

export interface SessionProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  locale: string;
}

export interface SessionMembership {
  companyId: string;
  role: MemberRole;
  isActive: boolean;
}

export interface CompanyContext {
  user: SessionUser;
  memberships: SessionMembership[];
  /** First active membership, used as the default tenant until a switcher exists. */
  activeCompanyId: string | null;
}

/** The currently signed-in auth user, or `null`. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return { id: data.user.id, email: data.user.email ?? null };
}

/** The signed-in user's `user_profiles` row, or `null`. */
export async function getCurrentProfile(): Promise<SessionProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("id, email, display_name, locale")
    .eq("id", user.id)
    .maybeSingle();

  const row = data as
    | { id: string; email: string | null; display_name: string | null; locale: string }
    | null;
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    locale: row.locale,
  };
}

/** Active memberships (company + role) for the signed-in user. */
export async function getCurrentMemberships(): Promise<SessionMembership[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  // Deterministic order: `activeCompanyId` is memberships[0], and Postgres row
  // order without ORDER BY is unspecified — without this, a multi-membership
  // user's "active" tenant could flip between requests (review finding F1).
  const { data } = await supabase
    .from("company_members")
    .select("company_id, role, is_active, created_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as Array<{
    company_id: string;
    role: MemberRole;
    is_active: boolean;
  }>;

  return rows.map((row) => ({
    companyId: row.company_id,
    role: row.role,
    isActive: row.is_active,
  }));
}

/** Combined user + memberships + a default active company, or `null`. */
export async function getCurrentCompanyContext(): Promise<CompanyContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const memberships = await getCurrentMemberships();
  return {
    user,
    memberships,
    activeCompanyId: memberships[0]?.companyId ?? null,
  };
}
