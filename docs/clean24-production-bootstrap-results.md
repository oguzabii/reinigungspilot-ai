# Klarsa Core — Clean24 Production Bootstrap & Login Results

> **Status: VERIFIED on production (2026-06-13).** The Clean24 production tenant
> bootstrap ran on `klarsa-production`, the verification query returned the
> expected config-only result (owner bound, **all customer-data counts = 0**),
> Vercel Production was configured + redeployed, and the **owner login succeeded**
> at `https://klarsa.vercel.app` with `/app-shell` opening. **No real customer
> data was added. No secrets/keys/UID are recorded here.** Real customer data
> remains **NO-GO** until the restore test passes and the owner signs GO
> ([`production-readiness-gate.md`](./production-readiness-gate.md),
> [`real-data-gate-policy.md`](./real-data-gate-policy.md)).

| | |
| --- | --- |
| **Date** | 2026-06-13 |
| **Environment** | `klarsa-production` (Supabase Pro) + Vercel Production (`https://klarsa.vercel.app`) |
| **Method** | Manual: run the bootstrap in the SQL editor (placeholder replaced **only** in the editor), verification query, configure Vercel env, redeploy, login |
| **Reported by** | User |

> **Provenance / honesty note:** recorded from the **user's manual production
> run**, as reported. It was **not** independently observed from this repository,
> and this repo holds **no connection/credentials** to the production project. No
> Supabase URL value, project ref, anon key, service-role key, DB password, JWT,
> auth UID, or `.env` value is recorded here.

## Result

### Bootstrap + verification (config only)

The placeholder `CLEAN24_OWNER_AUTH_USER_ID` was replaced **only inside the
Supabase SQL editor** (never committed). The read-only verification query
returned exactly:

| Field | Value |
| --- | --- |
| Company | **Clean24 Memis GmbH** exists |
| `tier` | `premium` |
| `status` | `active` |
| `billing_status` | `internal_founder` |
| `access_status` | `full` |
| `services` | 8 |
| `sources` | 4 |
| `owners` | 1 |
| `leads_should_be_0` | 0 |
| `offers_should_be_0` | 0 |
| `jobs_should_be_0` | 0 |
| `prospects_should_be_0` | 0 |

→ Owner bound (`role = 'owner'`, active), service/source **config** present, and
**zero** customer records — exactly as intended.

### Vercel Production env + Auth config (no secret values recorded)

| Item | Set? | Note |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | points at the `klarsa-production` project *(value not recorded)* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | production anon **public** key *(value not recorded)* |
| `KLARSA_ENV` | ✅ | `production` |
| Supabase Auth Site URL | ✅ | `https://klarsa.vercel.app` |
| Supabase Auth Redirect URL | ✅ | `https://klarsa.vercel.app/auth/callback` |
| Production redeploy | ✅ | done |

### Login

| Step / check | Outcome |
| --- | --- |
| Production login at `https://klarsa.vercel.app/login` | ✅ succeeded |
| Clean24 production **owner** login | ✅ worked |
| `/app-shell` opened for the owner | ✅ |
| Tenant shown | ✅ **Clean24** (Premium) |
| Real customer data added | ✅ none |

The login → session → tenant path now works **end-to-end on production**, through
Supabase Auth + RLS (session/anon client; no service-role).

## Safety confirmations

- ✅ **No real auth UID committed.** The UID was entered only in the Supabase SQL
  editor; the repo keeps the `CLEAN24_OWNER_AUTH_USER_ID` placeholder.
- ✅ **No secrets recorded.** No Supabase URL value/ref, anon key value,
  service-role key, DB password, JWT, or `.env` content in this doc or the repo.
- ✅ **No real customer data.** Only tenant config (company, owner, services,
  sources); every customer-data count is 0.
- ✅ **No fake/staging data on production.** Only the production bootstrap ran;
  `verification/002–005` were **not** run on production.
- ✅ **Not the old Clean24 Lead Autopilot.** This is the Klarsa Core production
  tenant; the separate legacy system is untouched.

## What this verifies

- Migrations 001–006 + the production bootstrap produce a correct, config-only
  Clean24 tenant on `klarsa-production`.
- Vercel Production is wired to the production project, and the **owner can log
  in** to the live app — the production auth/RLS path works.

## What this does NOT mean

- **Real customer data is still NO-GO.** Production tenant + login working is
  **not** the go-live signal. Real leads/offers/jobs/contacts/bexio data remain
  blocked until:
  - **PITR + daily external export** confirmed, and the **restore test PASSES**
    ([`backup-restore-runbook.md`](./backup-restore-runbook.md)), and
  - the **owner signs GO** in
    [`production-readiness-gate.md`](./production-readiness-gate.md).
- The hard rule **"No Security = No Customer Data"** still applies.

## Next step

**v0.4.2 — backup & restore test record** (execute the restore test per the
backup runbook, confirm PITR + daily export, and record the result) — the last
mandatory gate item before the owner's GO decision. **Offer PDF polish remains
deferred** until requested.
