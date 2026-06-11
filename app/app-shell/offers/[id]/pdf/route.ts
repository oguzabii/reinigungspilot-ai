/**
 * Protected offer PDF. Streams a generated PDF for ONE offer that belongs to
 * the caller's active tenant. Reads go through the session client (RLS) — never
 * the service-role client. Runs only at request time (`force-dynamic`), so the
 * build needs no env. No external assets, no email, no sending — download only.
 */

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getOfferById, getCompanySummary } from "@/lib/auth/tenant-data";
import { buildOfferPdf } from "@/lib/pdf/offer-pdf";
import { OFFER_STATUS_META } from "@/components/offers/offer-status";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { origin } = new URL(request.url);

  // Same protection chain as the offers page: setup → login → active tenant.
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
  // RLS + explicit company scoping: only this tenant's offer is ever loaded.
  const offer = await getOfferById(companyId, id);
  if (!offer) {
    return new NextResponse("Offerte nicht gefunden.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const summary = await getCompanySummary(companyId);
  const statusLabel = OFFER_STATUS_META[offer.status]?.label ?? offer.status;

  const pdf = buildOfferPdf({
    companyName: summary?.name ?? "Mandant",
    reference: offer.reference,
    statusLabel,
    createdAt: offer.createdAt,
    validUntil: offer.validUntil,
    leadName: offer.leadName,
    vatRatePct: offer.vatRatePct,
    items: offer.items.map((it) => ({
      label: it.label,
      detail: it.detail,
      amountChf: it.amountChf,
    })),
    totalNetChf: offer.totalNetChf,
    totalGrossChf: offer.totalGrossChf,
  });

  const safeRef = offer.reference.replace(/[^A-Za-z0-9._-]/g, "_");
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Offerte-${safeRef}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
