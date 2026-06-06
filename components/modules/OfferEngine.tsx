import {
  FileText,
  FileCheck,
  Mail,
  Send,
  ShieldCheck,
  Building2,
  MapPin,
  Percent,
} from "lucide-react";
import type { PackageId } from "@/lib/packages";
import { getPackage } from "@/lib/packages";
import { DEMO_OFFERS, DEMO_COMPANY } from "@/lib/demo-data";
import { formatChf, formatNumber } from "@/lib/format";
import { ModuleHeader } from "@/components/ModuleHeader";
import { Panel, PanelTitle } from "@/components/Panel";
import { StatusBadge, riskTone } from "@/components/StatusBadge";

export function OfferEngine({ pkg }: { pkg: PackageId }) {
  const limit = getPackage(pkg).limits.pdfOffersPerMonth;
  const used = Math.round(limit * 0.3);
  const offer = DEMO_OFFERS[0];
  const others = DEMO_OFFERS.slice(1);

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={FileText}
        title="AI Offerten-Engine"
        description="Vom Lead zur fertigen Offerte: Preisvorschlag, PDF-Entwurf und passende E-Mail – in wenigen Minuten."
        badge={
          <StatusBadge
            label={`${formatNumber(used)} / ${formatNumber(limit)} PDF-Offerten`}
            tone="accent"
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: selected lead + price + other offers */}
        <div className="space-y-6">
          <Panel>
            <PanelTitle>Ausgewählter Lead</PanelTitle>
            <p className="mt-3 text-lg font-semibold text-navy-900">
              {offer.company}
            </p>
            <p className="text-sm text-slate-500">{offer.contact}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 className="h-4 w-4 text-slate-400" />
                {offer.service}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                {offer.location}
              </div>
            </dl>
          </Panel>

          <Panel>
            <PanelTitle>Preisvorschlag</PanelTitle>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight text-navy-900">
                {formatChf(offer.priceChf)}
              </span>
              <span className="text-sm font-medium text-slate-500">
                {offer.priceUnit}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Spielraum {formatChf(offer.priceFromChf)} –{" "}
              {formatChf(offer.priceToChf)}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-inset ring-emerald-100">
                <p className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <Percent className="h-3.5 w-3.5" />
                  Marge
                </p>
                <p className="mt-1 text-xl font-semibold text-emerald-700 tabular-nums">
                  {offer.marginPct}%
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-100">
                <p className="flex items-center gap-1 text-xs font-medium text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Risiko
                </p>
                <div className="mt-1.5">
                  <StatusBadge
                    label={offer.riskLevel}
                    tone={riskTone(offer.riskLevel)}
                  />
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              {offer.riskNote}
            </p>
          </Panel>

          <Panel>
            <PanelTitle>Weitere Offerten in Arbeit</PanelTitle>
            <ul className="mt-3 space-y-2">
              {others.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy-900">
                      {o.company}
                    </p>
                    <p className="truncate text-xs text-slate-500">{o.service}</p>
                  </div>
                  <span className="ml-3 shrink-0 font-semibold text-navy-900">
                    {formatChf(o.priceChf)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Right: PDF preview + email draft */}
        <div className="space-y-6 lg:col-span-2">
          {/* PDF preview */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1.5 w-full bg-navy-900" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    {DEMO_COMPANY.name}
                  </p>
                  <p className="text-xs text-slate-500">{DEMO_COMPANY.region}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-semibold text-navy-900">
                    {offer.pdf.reference}
                  </p>
                  <p>Gültig bis {offer.pdf.validUntil}</p>
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-slate-50 p-3 text-sm">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  An
                </p>
                <p className="font-medium text-navy-900">{offer.company}</p>
                <p className="text-slate-500">
                  {offer.contact} · {offer.location}
                </p>
              </div>

              <h3 className="mt-5 text-lg font-semibold tracking-tight text-navy-900">
                {offer.pdf.title}
              </h3>

              <table className="mt-3 w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {offer.pdf.lineItems.map((item) => (
                    <tr key={item.label}>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-navy-900">
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500">{item.detail}</p>
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-right font-medium text-navy-900 tabular-nums">
                        {formatChf(item.amountChf)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-navy-900">
                    <td className="pt-3 text-sm font-semibold text-navy-900">
                      Total {offer.pdf.totalUnit}
                    </td>
                    <td className="pt-3 text-right text-lg font-semibold text-navy-900 tabular-nums">
                      {formatChf(offer.pdf.totalChf)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <FileCheck className="h-4 w-4" />
                  PDF-Entwurf bereit
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
                >
                  <FileText className="h-4 w-4" />
                  PDF herunterladen
                </button>
              </div>
            </div>
          </div>

          {/* Email draft */}
          <Panel>
            <div className="flex items-center justify-between">
              <PanelTitle>E-Mail-Entwurf</PanelTitle>
              <StatusBadge label="Vorgeschlagen" tone="info" />
            </div>
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="border-b border-slate-200 pb-2 text-sm">
                <span className="text-slate-400">Betreff: </span>
                <span className="font-semibold text-navy-900">
                  {offer.email.subject}
                </span>
              </p>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
                <p>{offer.email.greeting}</p>
                {offer.email.paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                <p className="whitespace-pre-line text-slate-600">
                  {offer.email.signature}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-navy-800 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                <Mail className="h-4 w-4" />
                Bearbeiten
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
                Offerte senden
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
