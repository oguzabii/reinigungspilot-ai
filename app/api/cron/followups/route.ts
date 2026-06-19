/**
 * PREPARED follow-up cron endpoint (v0.5.16). SERVER-ONLY.
 *
 * Secret-gated foundation for scheduled follow-up processing. It is DISABLED for
 * sending by design and performs NO writes:
 *   - Without `FOLLOWUP_CRON_SECRET` set, it returns 404 (invisible).
 *   - With a matching secret, it returns a readiness JSON only.
 *
 * Why no sending here: processing due follow-ups across ALL tenants from a
 * cron would require a service-role identity (to bypass RLS), which is
 * intentionally NOT used anywhere in the app. Real sends therefore happen
 * OWNER-TRIGGERED in-app (session client + RLS, Premium + configured provider,
 * capped, audited) via `sendDueFollowups`. A true background worker would need
 * a separately-approved privileged service — out of scope and not enabled.
 *
 * To schedule the heartbeat on Vercel later, add to `vercel.json`:
 *   { "crons": [{ "path": "/api/cron/followups", "schedule": "0 * * * *" }] }
 * and set `FOLLOWUP_CRON_SECRET` in the environment (never in the repo).
 */

import { NextResponse } from "next/server";
import { isSendConfigured } from "@/lib/outreach/send-provider";

export const dynamic = "force-dynamic";

function readSecret(): string | undefined {
  const v = process.env.FOLLOWUP_CRON_SECRET;
  return v && v.length > 0 ? v : undefined;
}

export async function GET(request: Request): Promise<NextResponse> {
  const secret = readSecret();
  // Unset → invisible (no endpoint).
  if (!secret) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Accept the secret via Authorization: Bearer <secret> or ?secret=.
  const url = new URL(request.url);
  const auth = request.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ")
    ? auth.slice(7)
    : url.searchParams.get("secret") ?? "";
  if (provided !== secret) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Readiness only — this endpoint does NOT send (see file header).
  return NextResponse.json({
    ok: true,
    sending: false,
    providerConfigured: isSendConfigured(),
    note: "Prepared endpoint. Follow-up sends are owner-triggered in-app; background sending needs a privileged worker and is intentionally not enabled.",
  });
}
