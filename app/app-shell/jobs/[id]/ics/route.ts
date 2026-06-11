/**
 * Protected job calendar file (.ics). Streams an iCalendar VEVENT for ONE
 * scheduled job that belongs to the caller's active tenant. Reads go through
 * the session client (RLS) — never the service-role client. Runs only at
 * request time (`force-dynamic`), so the build needs no env.
 *
 * This is the calendar FOUNDATION: the user downloads the file and imports it
 * into their own calendar. There is NO calendar sync, no Google/Outlook API,
 * no email, no external call.
 */

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getJobById } from "@/lib/auth/tenant-data";
import { buildJobIcs } from "@/lib/ics/job-ics";
import { JOB_STATUS_META } from "@/components/jobs/job-status";
import { formatChf } from "@/components/offers/offer-status";

export const dynamic = "force-dynamic";

function text(body: string, status: number) {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { origin } = new URL(request.url);

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/app-shell`);
  }
  const context = await getCurrentCompanyContext();
  if (!context) {
    return NextResponse.redirect(`${origin}/login`);
  }
  const companyId = context.activeCompanyId;
  if (!companyId) {
    return NextResponse.redirect(`${origin}/app-shell`);
  }

  const { id } = await params;
  // RLS + explicit company scoping: only this tenant's job is ever loaded.
  const job = await getJobById(companyId, id);
  if (!job) {
    return text("Auftrag nicht gefunden.", 404);
  }
  if (!job.scheduledFor) {
    return text("Für diesen Auftrag ist kein Termin gesetzt.", 404);
  }

  const descParts: string[] = [];
  if (job.customerName) descParts.push(`Kunde: ${job.customerName}`);
  if (job.offerReference) descParts.push(`Aus Offerte ${job.offerReference}`);
  if (job.valueChf !== null) descParts.push(`Wert: CHF ${formatChf(job.valueChf)}`);
  descParts.push(`Status: ${JOB_STATUS_META[job.status]?.label ?? job.status}`);

  const ics = buildJobIcs({
    uid: job.id,
    stampIso: new Date().toISOString(),
    startIso: job.scheduledFor,
    title: job.title,
    description: descParts.join("\n"),
    location: job.location,
    status: job.status,
  });

  const safeRef = (job.offerReference ?? job.id).replace(/[^A-Za-z0-9._-]/g, "_");
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="Auftrag-${safeRef}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
