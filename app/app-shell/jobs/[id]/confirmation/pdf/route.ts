/**
 * Protected Auftragsbestätigung PDF. Streams a customer order-confirmation PDF
 * for ONE job that belongs to the caller's active tenant. Reads go through the
 * session client (RLS) — never the service-role client. Runs only at request
 * time (`force-dynamic`). No external asset, no email, no sending — download.
 */

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getJobDocumentData,
  getCompanySummary,
  getCompanyProfileOverride,
} from "@/lib/auth/tenant-data";
import { buildOrderConfirmationPdf } from "@/lib/pdf/order-confirmation-pdf";
import { resolveCompanyProfile } from "@/lib/pdf/company-profile";

export const dynamic = "force-dynamic";

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
  const job = await getJobDocumentData(companyId, id);
  if (!job) {
    return new NextResponse("Auftrag nicht gefunden.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const [summary, profileOverride] = await Promise.all([
    getCompanySummary(companyId),
    getCompanyProfileOverride(companyId),
  ]);
  const profile = resolveCompanyProfile(summary?.name ?? null, profileOverride);
  const time = job.scheduledFor ? job.scheduledFor.slice(11, 16) : "";
  const reference = `AB-${job.offerReference ?? job.id.slice(0, 8)}`;

  const pdf = buildOrderConfirmationPdf({
    profile,
    reference,
    createdAt: job.createdAt,
    offerReference: job.offerReference,
    customerName: job.customerName,
    customerContact: job.customerContact,
    customerAddress: job.location ?? job.customerRegion,
    serviceLabel: job.serviceInterest,
    cleaningDate: job.scheduledFor ? job.scheduledFor.slice(0, 10) : null,
    handoverDate: null,
    cleaningTime: time && time !== "00:00" ? time : null,
    scopeItems: job.scopeItems,
    netChf: job.offerNetChf,
    vatRatePct: job.offerVatRatePct,
    grossChf: job.offerGrossChf ?? job.valueChf,
  });

  const safeRef = reference.replace(/[^A-Za-z0-9._-]/g, "_");
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Auftragsbestaetigung-${safeRef}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
