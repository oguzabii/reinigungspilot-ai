/**
 * Browser Supabase client (anon key only).
 *
 * Uses the PUBLIC anon key — Row Level Security applies to every request. Create
 * it lazily inside client components/event handlers; never at module load (keeps
 * the build env-free). Never use the service-role key here — see
 * `lib/supabase/admin.ts`.
 */

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/env";

/** Create a browser Supabase client bound to the anon key. */
export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
