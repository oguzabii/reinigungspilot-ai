/**
 * Admin Supabase client (SERVICE-ROLE key). SERVER-ONLY.
 *
 * ⚠️ DANGER: the service-role key **BYPASSES Row Level Security**. It can read
 * and write every tenant's data. Therefore:
 *   - NEVER import this module from a Client Component or any browser code.
 *   - NEVER add `"use client"` to a file that imports it.
 *   - NEVER log the key or pass it to the client.
 *   - Use ONLY in trusted server code (route handlers, server actions, cron),
 *     and PREFER the RLS-respecting `lib/supabase/server.ts` wherever possible.
 *
 * `getServiceRoleKey()` throws if this is ever reached in a browser context or
 * if the key is missing, so it cannot be created accidentally on the client.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getServiceRoleKey } from "@/lib/env";

/** Create a privileged, RLS-bypassing admin client. Server-only. */
export function createAdminClient() {
  const serviceRoleKey = getServiceRoleKey(); // throws in browser / if missing

  return createSupabaseClient(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
