/**
 * Sign out and redirect to /login. Runs only at request time
 * (`force-dynamic`), so it never needs env during the build. Accepts POST
 * (preferred) and GET (convenience for the foundation skeleton).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

async function signOutAndRedirect(request: Request) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  // 303 so a POST becomes a GET on the redirect target.
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}

export async function POST(request: Request) {
  return signOutAndRedirect(request);
}

export async function GET(request: Request) {
  return signOutAndRedirect(request);
}
