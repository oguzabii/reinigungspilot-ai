/**
 * Session refresh helper for the Next.js proxy (formerly "middleware").
 *
 * Keeps the Supabase auth cookie fresh on protected/app routes. Uses the
 * request/response cookie API (not `next/headers`), as required in the proxy.
 *
 * Build/runtime safety: if the public Supabase env is absent (e.g. no
 * `.env.local`), this is a no-op pass-through — so the app and the build work
 * without real credentials. See `proxy.ts` (project root) for the route matcher.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isSupabaseConfigured,
  getSupabaseUrl,
  getSupabaseAnonKey,
} from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // No credentials configured -> do nothing (foundation / build-safe).
  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touch the session so an expiring token gets refreshed. Never throws on a
  // missing/anonymous session.
  await supabase.auth.getUser();

  return response;
}
