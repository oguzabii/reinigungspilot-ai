import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FilePenLine, FileText, ArrowLeft } from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { EditOfferForm, type EditOfferInitial } from "@/components/offers/EditOfferForm";
import { OFFER_STATUS_META } from "@/components/offers/offer-status";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getCompanySummary, getOfferDocumentData } from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Offerte bearbeiten (intern) – Klarsa",
  description:
    "Bestehende Offerte bearbeiten: Kunde, Leistung, Position und Preis ändern. Die PDF-Vorlage übernimmt die Änderungen automatisch.",
  robots: { index: false, follow: false },
};

/** Split the lead's notes block back into the structured edit fields. */
function parseNotes(notes: string | null): {
  cleaningDate: string;
  handover: string;
  rest: string;
} {
  let cleaningDate = "";
  let handover = "";
  const rest: string[] = [];
  for (const line of (notes ?? "").split("\n")) {
    const cm = line.match(/^Reinigungsdatum:\s*(.*)$/);
    const hm = line.match(/^Übergabe:\s*(.*)$/);
    if (cm) cleaningDate = cm[1].trim();
    else if (hm) handover = hm[1].trim();
    else if (line.trim()) rest.push(line);
  }
  return { cleaningDate, handover, rest: rest.join("\n") };
}

export default async function AppShellEditOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const { id } = await params;
  const [summary, offer] = await Promise.all([
    getCompanySummary(companyId),
    getOfferDocumentData(companyId, id),
  ]);
  if (!offer) notFound();

  const parsed = parseNotes(offer.customerNotes);
  const firstItem = offer.items[0];
  const statusMeta = OFFER_STATUS_META[offer.status] ?? OFFER_STATUS_META.draft;

  const initial: EditOfferInitial = {
    offerId: id,
    reference: offer.reference,
    isSent: offer.status === "sent",
    customerName: offer.customerName ?? "",
    contactName: offer.customerContact ?? "",
    email: offer.customerEmail ?? "",
    phone: offer.customerPhone ?? "",
    address: offer.customerAddress ?? "",
    service: offer.serviceInterest ?? "",
    cleaningDate: parsed.cleaningDate,
    handover: parsed.handover,
    notes: parsed.rest,
    itemLabel: firstItem?.label ?? "",
    itemDetail: firstItem?.detail ?? "",
    itemAmount: firstItem ? firstItem.amountChf.toFixed(2) : "",
    vatRatePct: offer.vatRatePct.toFixed(2),
    validUntil: offer.validUntil ?? "",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <Link
          href="/app-shell/pipeline"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück zur Pipeline
        </Link>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
              <FilePenLine className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
                Offerte bearbeiten
              </h1>
              <p className="inline-flex items-center gap-2 text-sm text-slate-500">
                {offer.reference}
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusMeta.className}`}>
                  {statusMeta.label}
                </span>
              </p>
            </div>
          </div>
          <a
            href={`/app-shell/offers/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800"
          >
            <FileText className="h-4 w-4" strokeWidth={2.2} /> PDF neu öffnen
          </a>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <EditOfferForm initial={initial} />
        </section>
      </main>
    </div>
  );
}
