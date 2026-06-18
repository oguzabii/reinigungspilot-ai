/**
 * Protected offer PDF. Streams a generated PDF for ONE offer that belongs to
 * the caller's active tenant. Reads go through the session client (RLS) — never
 * the service-role client. Runs only at request time (`force-dynamic`), so the
 * build needs no env. No external assets, no email, no sending — download only.
 */

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getOfferDocumentData,
  getCompanySummary,
  getCompanyProfileOverride,
} from "@/lib/auth/tenant-data";
import { buildOfferPdf } from "@/lib/pdf/offer-pdf";
import { resolveCompanyProfile } from "@/lib/pdf/company-profile";

export const dynamic = "force-dynamic";

/** Stable 5-digit customer number from a lead id (cosmetic, deterministic). */
function customerNrFrom(leadId: string | null): string | null {
  if (!leadId) return null;
  let h = 0;
  for (let i = 0; i < leadId.length; i++) h = (h * 31 + leadId.charCodeAt(i)) >>> 0;
  return `K-${String(10000 + (h % 90000))}`;
}

/** Split a free-text address into up to three display lines. */
function addressLines(address: string | null): string[] {
  if (!address) return [];
  return address
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

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
  const offer = await getOfferDocumentData(companyId, id);
  if (!offer) {
    return new NextResponse("Offerte nicht gefunden.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const [summary, profileOverride] = await Promise.all([
    getCompanySummary(companyId),
    getCompanyProfileOverride(companyId),
  ]);
  const profile = resolveCompanyProfile(summary?.name ?? null, profileOverride);

  const serviceLabel =
    offer.serviceInterest ?? offer.items[0]?.label ?? "Reinigung";

  const pdf = buildOfferPdf({
    profile,
    reference: offer.reference,
    createdAt: offer.createdAt,
    validUntil: offer.validUntil,
    customerNr: customerNrFrom(offer.leadId),
    recipientName: offer.customerContact ?? offer.customerName,
    addressLines: addressLines(offer.customerAddress),
    serviceLabel,
    items: offer.items.map((it) => ({
      label: it.label,
      detail: it.detail,
      amountChf: it.amountChf,
    })),
    vatRatePct: offer.vatRatePct,
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
