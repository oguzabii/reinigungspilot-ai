/**
 * Environment validation for Klarsa Core (Supabase Auth).
 *
 * IMPORTANT — build safety: nothing here runs or throws at import time, so
 * `next build` never needs real environment values. The validators throw only
 * when CALLED at runtime with a missing value. No real values live in the repo;
 * see `.env.local.example` (placeholders only) and `docs/auth-foundation.md`.
 *
 * Client vs server:
 *   - `NEXT_PUBLIC_*` values are inlined into the client bundle (safe to expose).
 *   - `SUPABASE_SERVICE_ROLE_KEY` is SERVER-ONLY and must never reach the client.
 */

function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function required(name: string): string {
  const value = read(name);
  if (!value) {
    throw new Error(
      `[Klarsa] Missing required environment variable ${name}. ` +
        `Copy .env.local.example to .env.local and fill it in (staging only).`,
    );
  }
  return value;
}

/** Public, client-safe Supabase project URL. */
export function getSupabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL");
}

/** Public, client-safe anon key. RLS still applies to requests made with it. */
export function getSupabaseAnonKey(): string {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

/** Klarsa environment marker (e.g. "staging"). Defaults to "development". */
export function getKlarsaEnv(): string {
  return read("KLARSA_ENV") ?? "development";
}

/**
 * Cheap, non-throwing check that the public Supabase env is present. Used to
 * make the app degrade gracefully (and the build pass) when env is absent.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    read("NEXT_PUBLIC_SUPABASE_URL") && read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
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
  return required("SUPABASE_SERVICE_ROLE_KEY");
}
