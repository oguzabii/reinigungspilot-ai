import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  ArrowLeft,
  Lock,
  Inbox,
  CalendarClock,
  Receipt,
} from "lucide-react";
import { InternalHeader } from "@/components/InternalHeader";
import { NewOfferForm } from "@/components/offers/NewOfferForm";
import { OfferStatusForm } from "@/components/offers/OfferStatusForm";
import { AddOfferItemForm } from "@/components/offers/AddOfferItemForm";
import { OFFER_STATUS_META, formatChf } from "@/components/offers/offer-status";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import {
  getCompanySummary,
  getLeads,
  getOffers,
  type OfferListItem,
} from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Offer Engine (intern) – Klarsa",
  description:
    "Geschützte Offer Engine: Offerten-Entwürfe manuell erstellen, Positionen erfassen, Status pflegen. RLS-gefiltert, kein PDF/E-Mail/bexio.",
  robots: { index: false, follow: false },
};

export default async function AppShellOffersPage() {
  // Delegate setup / no-tenant states to /app-shell (which renders them).
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const [summary, leads, offers] = await Promise.all([
    getCompanySummary(companyId),
    getLeads(companyId),
    getOffers(companyId),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <InternalHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <Link
          href="/app-shell"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" /> App-Shell
        </Link>

        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <FileText className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Offer Engine
            </h1>
            <p className="text-sm text-slate-500">
              {/* "+" = list is capped; real total may be higher. */}
              {summary?.name ?? "Mandant"} · {offers.length}
              {offers.length >= 100 ? "+" : ""} Offerte
              {offers.length === 1 ? "" : "n"}
            </p>
          </div>
        </div>

        {/* No-real-data / scope note */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            Manuelle Offerten-Entwürfe – <strong className="font-semibold">kein
            PDF, kein E-Mail-Versand, keine bexio-Übergabe</strong> (noch). Alle
            Daten werden über die <strong className="font-semibold">RLS</strong>{" "}
            gefiltert und nur über den Session-Client geschrieben.
          </p>
        </div>

        {/* Create offer */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Neue Offerte erstellen
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Optional aus einem Lead. Referenz wird automatisch vergeben, wenn
            leer. Eine erste Position ist optional.
          </p>
          <div className="mt-4">
            <NewOfferForm
              leads={leads.map((l) => ({ id: l.id, name: l.companyName }))}
            />
          </div>
        </section>

        {/* Offer list / empty state */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-navy-900">
            Offerten
          </h2>
          {offers.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300" strokeWidth={1.8} />
              <p className="mt-2 text-sm font-medium text-navy-900">
                Noch keine Offerten.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Erstellen Sie oben den ersten Offerten-Entwurf.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {offers.map((offer) => (
                <OfferRow key={offer.id} offer={offer} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function OfferRow({ offer }: { offer: OfferListItem }) {
  const status = OFFER_STATUS_META[offer.status] ?? OFFER_STATUS_META.draft;
  const vatAmount = offer.totalGrossChf - offer.totalNetChf;
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 font-semibold text-navy-900">
          <Receipt className="h-4 w-4 text-slate-400" />
          {offer.reference}
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <Inbox className="h-3.5 w-3.5 text-slate-400" />
          {offer.leadName ?? "Ohne Lead"}
        </span>
        {offer.validUntil && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
            gültig bis {offer.validUntil}
          </span>
        )}
      </div>

      {/* Line items */}
      {offer.items.length > 0 ? (
        <ul className="mt-3 divide-y divide-slate-100 rounded-lg bg-slate-50 px-3 py-1 ring-1 ring-inset ring-slate-100">
          {offer.items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
              <span className="text-slate-700">
                {item.label}
                {item.detail && (
                  <span className="text-slate-400"> · {item.detail}</span>
                )}
              </span>
              <span className="tabular-nums text-navy-900">
                {formatChf(item.amountChf)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-400">Keine Positionen.</p>
      )}

      {/* Totals */}
      <dl className="mt-3 space-y-0.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Netto</dt>
          <dd className="tabular-nums text-slate-700">
            CHF {formatChf(offer.totalNetChf)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">
            MwSt ({offer.vatRatePct.toFixed(2)}%)
          </dt>
          <dd className="tabular-nums text-slate-700">CHF {formatChf(vatAmount)}</dd>
        </div>
        <div className="flex justify-between font-semibold">
          <dt className="text-navy-900">Brutto</dt>
          <dd className="tabular-nums text-navy-900">
            CHF {formatChf(offer.totalGrossChf)}
          </dd>
        </div>
      </dl>

      <AddOfferItemForm offerId={offer.id} />

      <div className="mt-3 border-t border-slate-100 pt-3">
        {/* Keyed on status so the uncontrolled select resyncs after refresh. */}
        <OfferStatusForm
          key={`${offer.id}:${offer.status}`}
          offerId={offer.id}
          currentStatus={offer.status}
        />
      </div>

      <p className="mt-2 text-xs text-slate-400">
        erstellt {offer.createdAt.slice(0, 10)}
      </p>
    </li>
  );
}
