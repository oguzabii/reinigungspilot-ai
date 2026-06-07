import {
  PlugZap,
  Building2,
  ReceiptText,
  Check,
  ArrowRightLeft,
  FileCheck,
} from "lucide-react";
import type { PackageId } from "@/lib/packages";
import { getPackage } from "@/lib/packages";
import { getModuleAccess } from "@/lib/package-gates";
import { DEMO_BEXIO_HANDOFF } from "@/lib/demo-data";
import { formatChf } from "@/lib/format";
import { ModuleHeader } from "@/components/ModuleHeader";
import { Panel, PanelTitle } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { LockedFeature } from "@/components/LockedFeature";

interface Props {
  pkg: PackageId;
  onSelectPackage: (id: PackageId) => void;
}

export function BexioHandoff({ pkg, onSelectPackage }: Props) {
  const access = getModuleAccess(pkg, "bexio");

  if (access === "locked") {
    return (
      <div className="space-y-6">
        <ModuleHeader
          icon={PlugZap}
          title="bexio Übergabe"
          description="Gewonnene Aufträge mit Kundendaten, Leistung und MwSt. an die Buchhaltung übergeben."
          badge={<StatusBadge label="Gesperrt" tone="neutral" />}
        />
        <LockedFeature
          title="bexio Connect: Übergabe an die Buchhaltung"
          requiredPackageName="Pro"
          description="Übergeben Sie gewonnene Aufträge mit allen Daten direkt an bexio – inklusive Rechnungsentwurf. Kein doppeltes Erfassen mehr."
          icon={PlugZap}
          bullets={[
            "Kundendaten, Leistung, Preis und MwSt. automatisch übernommen",
            "Rechnungsentwurf in bexio erstellt",
            "Pro: bexio Connect · Premium: bexio Connect Plus",
          ]}
          onUpgrade={() => onSelectPackage("pro")}
        />
      </div>
    );
  }

  const isPlus = getPackage(pkg).limits.bexio === "plus";
  const h = DEMO_BEXIO_HANDOFF;

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={PlugZap}
        title="bexio Übergabe"
        description="Gewonnene Aufträge mit Kundendaten, Leistung und MwSt. an die Buchhaltung übergeben – ohne doppeltes Erfassen."
        badge={
          <StatusBadge
            label={isPlus ? "bexio Connect Plus" : "bexio Connect"}
            tone="success"
            dot
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel>
          <PanelTitle>Angenommener Auftrag</PanelTitle>
          <p className="mt-3 text-lg font-semibold text-navy-900">{h.company}</p>
          <p className="text-sm text-slate-500">{h.contact}</p>
          <dl className="mt-4 space-y-1.5 text-sm text-slate-600">
            <div>{h.service}</div>
            <div className="text-slate-500">{h.location}</div>
          </dl>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Building2 className="h-3.5 w-3.5" />
              Kundendaten
            </p>
            <p className="mt-1.5 text-sm text-navy-900">{h.customer.address}</p>
            <p className="text-sm text-slate-500">{h.customer.email}</p>
            <p className="text-sm text-slate-500">{h.customer.uid}</p>
          </div>
        </Panel>

        <Panel>
          <PanelTitle>Leistung, Preis &amp; MwSt.</PanelTitle>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Netto" value={formatChf(h.netChf)} />
            <Row label={`MwSt. (${h.vatRatePct}%)`} value={formatChf(h.vatChf)} />
            <div className="flex items-center justify-between border-t border-slate-200 pt-2">
              <dt className="font-semibold text-navy-900">Brutto</dt>
              <dd className="text-lg font-semibold text-navy-900 tabular-nums">
                {formatChf(h.grossChf)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Buchhaltung bereit
            </p>
            <ul className="mt-2 space-y-1.5">
              {h.steps.map((step) => (
                <li
                  key={step.label}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.4} />
                  {step.label}
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <FileCheck className="h-5 w-5" />
            Rechnungsentwurf erstellt · {h.invoiceDraftRef} (Entwurf)
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
          >
            <ArrowRightLeft className="h-4 w-4" strokeWidth={2} />
            An bexio übergeben
          </button>
        </div>
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          ReinigungsPilot AI ersetzt bexio nicht – es bereitet die Übergabe vor.
          Die API-Anbindung wird im produktiven Setup eingerichtet.
        </p>
        {isPlus && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-50/70 px-3 py-2 text-xs font-medium text-blue-800">
            <ReceiptText className="h-4 w-4" />
            bexio Connect Plus: zusätzliche Felder und automatischer Abgleich mit
            der Buchhaltung.
          </p>
        )}
      </Panel>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}
