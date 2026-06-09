/**
 * Environment access for Klarsa Core (Supabase Auth).
 *
 * BUILD SAFETY: nothing here runs or throws at import time, so `next build`
 * never needs real environment values. Validators throw only when CALLED at
 * runtime with a missing value.
 *
 * CLIENT INLINING (important): Next.js only inlines `NEXT_PUBLIC_*` variables
 * into the CLIENT bundle when they are referenced as **static literals**
 * (`process.env.NEXT_PUBLIC_X`). Dynamic access (`process.env[name]`) is NOT
 * inlined and reads as `undefined` in the browser. So the public vars below are
 * read via **direct static references** — this is what makes client-side
 * detection (and the browser client) work.
 *
 * No real values live in the repo (see `.env.local.example`):
 *   - `NEXT_PUBLIC_*` are client-safe.
 *   - `SUPABASE_SERVICE_ROLE_KEY` is SERVER-ONLY and must never reach the client.
 */

// Direct static references so Next inlines these into the client bundle.
const PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function nonEmpty(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

/** Public, client-safe Supabase project URL. Throws if missing. */
export function getSupabaseUrl(): string {
  const value = nonEmpty(PUBLIC_SUPABASE_URL);
  if (!value) {
    throw new Error(
      "[Klarsa] Missing NEXT_PUBLIC_SUPABASE_URL. Copy .env.local.example to .env.local and fill it in (staging only).",
    );
  }
  return value;
}

/** Public, client-safe anon key. RLS still applies to requests made with it. */
export function getSupabaseAnonKey(): string {
  const value = nonEmpty(PUBLIC_SUPABASE_ANON_KEY);
  if (!value) {
    throw new Error(
      "[Klarsa] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill it in (staging only).",
    );
  }
  return value;
}

/** Klarsa environment marker (e.g. "staging"). Defaults to "development". */
export function getKlarsaEnv(): string {
  return nonEmpty(process.env.KLARSA_ENV) ?? "development";
}

/**
 * Non-throwing check that the public Supabase env is present. Works on both the
 * server and the client (the static refs above are inlined into the client
 * bundle). Used to degrade gracefully and to keep the build env-free.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    nonEmpty(PUBLIC_SUPABASE_URL) && nonEmpty(PUBLIC_SUPABASE_ANON_KEY),
  );
}

/**
 * SERVER-ONLY. Returns the service-role key, which **bypasses Row Level
 * Security**. Throws if called in the browser or if the key is missing — never
 * expose this value to client code. See `lib/supabase/admin.ts`.
 */
export function getServiceRoleKey(): string {
  if (typeof window !== "undefined") {
    throw new Error(
      "[Klarsa] SUPABASE_SERVICE_ROLE_KEY must never be read in the browser.",
    );
  }
  const value = nonEmpty(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!value) {
    throw new Error("[Klarsa] Missing SUPABASE_SERVICE_ROLE_KEY (server-only).");
  }
  return value;
}
