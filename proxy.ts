/**
 * Klarsa proxy (Next.js 16 renamed "middleware" -> "proxy"; same purpose).
 *
 * Refreshes the Supabase session on app/auth routes. The matcher is
 * intentionally LIMITED to the app/auth area, NOT the public marketing pages —
 * the static marketing site stays completely untouched. It can be broadened
 * later (the Supabase default runs on all non-asset routes).
 *
 * Build/runtime safety: `updateSession` is a no-op when Supabase env is absent,
 * so this never requires real credentials and the build is unaffected.
 *
 * NOTE: this only REFRESHES the session — it does not yet enforce auth/redirects
 * on protected routes. That guard arrives with v0.2.7.
 */

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/app-shell/:path*", "/workspace/:path*", "/login", "/auth/:path*"],
};
