# Klarsa Core — Auth Foundation (v0.2.6)

> **Status: FOUNDATION.** Supabase Auth + session/client architecture is wired in
> a **build-safe, env-free** way. There is **no real authentication in this repo
> yet** (no committed credentials, no `.env.local`, no connected database) and
> **no real customer data**. The pieces here activate only once a staging
> `.env.local` exists. Hard rule: **"No Security = No Customer Data."**

Related: [`security-architecture.md`](./security-architecture.md),
[`supabase-schema-notes.md`](./supabase-schema-notes.md),
[`supabase-staging-results.md`](./supabase-staging-results.md),
[`../.env.local.example`](../.env.local.example).

## Pieces added

| Area | File(s) |
| --- | --- |
| Env validation (lazy) | `lib/env.ts` |
| Browser client (anon) | `lib/supabase/browser.ts` |
| Server client (cookies) | `lib/supabase/server.ts` |
| Admin client (service role, server-only) | `lib/supabase/admin.ts` |
| Proxy session refresh (Next 16) | `lib/supabase/middleware.ts`, `proxy.ts` |
| Session helpers | `lib/auth/session.ts` |
| Login form (client) | `components/auth/LoginForm.tsx` |
| Routes | `app/login`, `app/auth/callback`, `app/logout` |
| Protected shell preview | `app/app-shell` (static) |

## Build safety (why the build needs no real env)

- **Nothing reads env at import time.** `lib/env.ts` validators throw only when
  *called* at runtime; `isSupabaseConfigured()` is a non-throwing check.
- **Clients are created lazily** inside functions, never at module load.
- **Auth route handlers are `force-dynamic`** (`/auth/callback`, `/logout`), so
  they are not prerendered and never run during `next build`.
- **Static pages never call session helpers.** `/login` and `/app-shell`
  prerender as static; the login form only touches Supabase in the browser on
  submit.
- **The proxy is a no-op without env** (`updateSession` returns early), and its
  matcher excludes the marketing site entirely.

Net effect: `npm run lint` and `npm run build` stay green with no `.env.local`.

## Auth flow

1. **Email/password (primary skeleton):** `LoginForm` calls
   `supabase.auth.signInWithPassword`. The `@supabase/ssr` **browser** client
   persists the session in cookies, then we navigate to `/app-shell`.
2. **OAuth / PKCE (callback):** providers redirect to `/auth/callback?code=…`.
   The handler exchanges the code for a session via the **server** client
   (`exchangeCodeForSession`) and redirects to a safe, same-origin `next` path.
3. **Logout:** `/logout` calls `supabase.auth.signOut()` and redirects to
   `/login` (303).

> The flow is functional against a configured project but intentionally minimal
> (TODOs marked in code). No real env is committed, so it stays dormant here.

## Session handling & client strategy

Four clients, each for one context:

- **Browser** (`lib/supabase/browser.ts`) — anon key; for Client Components and
  the login form. RLS applies.
- **Server** (`lib/supabase/server.ts`) — anon key bound to request **cookies**
  via `next/headers`; for Server Components, Route Handlers and Server Actions.
  The user's session (and thus RLS context) travels with the request.
- **Proxy** (`proxy.ts` + `lib/supabase/middleware.ts`) — uses the
  request/response cookie API to **refresh** the session token before it expires.
  (Next 16 renamed the root `middleware` file convention to `proxy`.)
- **Admin** (`lib/supabase/admin.ts`) — service-role key, **server-only**.

Cookies are the single source of truth for the session, kept fresh by the
middleware and read by the server client.

## Role / member lookup

`lib/auth/session.ts` (server-only) exposes guarded helpers:

- `getCurrentUser()` → `{ id, email } | null`
- `getCurrentProfile()` → the `user_profiles` row, or `null`
- `getCurrentMemberships()` → active `company_members` (`companyId`, `role`,
  `isActive`), typed with `MemberRole` from `lib/database-types.ts`
- `getCurrentCompanyContext()` → `{ user, memberships, activeCompanyId }`

These map a signed-in user to their tenant(s) and role, which is exactly what the
**role-aware RLS** (verified on staging) keys off. Until a real session exists,
they return `null` / `[]`.

## Protected-route strategy

- **Now (v0.2.6):** `proxy.ts` only **refreshes** the session, and is scoped
  to `/app-shell`, `/workspace`, `/login`, `/auth/*` — the **marketing site is
  untouched**. No redirect/enforcement yet.
- **Next (v0.2.7):** add a guard — server-side, the protected pages call
  `getCurrentUser()` and redirect to `/login` when absent; the proxy matcher
  can be broadened. Pages become dynamic at that point (they read cookies).
- Enforcement is always **server-side** (never just hiding UI), layered on top of
  RLS (defense in depth).

## Service-role rules

- The service-role key **bypasses RLS** and can touch every tenant's data.
- `lib/supabase/admin.ts` is **server-only**: `getServiceRoleKey()` throws if
  reached in the browser or if the key is missing, so it can't be created on the
  client by accident.
- **Never** import `admin.ts` from a Client Component, never `"use client"` a
  file that imports it, never log the key. Prefer the RLS-respecting server
  client; use admin only for trusted system tasks (e.g. onboarding the first
  owner membership, future cron/webhooks).

## Why no real data yet

Auth being wired does **not** unlock real data. The gate stays:
authentication **and** RLS **and** verified backup/restore must all be in place
first (see [`security-architecture.md`](./security-architecture.md)). The app
still ships no real customer data; staging uses only fake `@example.test` data.
Clean24 remains the first real tenant — **after** the gate, not before.

## Next step

**v0.2.7 — connect the app shell to Supabase staging with fake tenant data and a
protected-route check:** wire `/app-shell` to read the session + memberships from
staging (fake `@example.test` data), add the redirect-to-`/login` guard, and
confirm role-aware access end-to-end. Still no real customer data.
