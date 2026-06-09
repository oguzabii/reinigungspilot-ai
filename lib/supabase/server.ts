/**
 * Server Supabase client (anon key + request cookies).
 *
 * For Server Components, Route Handlers and Server Actions. Binds to the
 * request's cookies so the user's session (and thus RLS context) is applied.
 * Created lazily and asynchronously (`cookies()` is a dynamic API), so it only
 * runs at request time — never during the build.
 *
 * This still uses the PUBLIC anon key; writes are constrained by RLS and the
 * user's `member_role`. For privileged, RLS-bypassing operations use
 * `lib/supabase/admin.ts` (server-only) — and prefer this client wherever possible.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/lib/env";

/** Create a request-scoped server Supabase client. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` was called from a Server Component, where cookies are
          // read-only. Session refresh happens in middleware/route handlers
          // instead, so this is safe to ignore.
        }
      },
    },
  });
}
