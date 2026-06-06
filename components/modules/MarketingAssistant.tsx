import { Megaphone, MapPin, Camera, Lightbulb, Search, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PackageId } from "@/lib/packages";
import { getModuleAccess } from "@/lib/package-gates";
import { DEMO_MARKETING } from "@/lib/demo-data";
import type { MarketingItem, MarketingType } from "@/lib/demo-data";
import { cn } from "@/lib/cn";
import { ModuleHeader } from "@/components/ModuleHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { LockedFeature } from "@/components/LockedFeature";

interface Props {
  pkg: PackageId;
  onSelectPackage: (id: PackageId) => void;
}

const TYPE_ICON: Record<MarketingType, LucideIcon> = {
  "Google Business Post": MapPin,
  "Instagram Caption": Camera,
  "Kampagnen-Idee": Lightbulb,
  "Lokales SEO-Thema": Search,
};

export function MarketingAssistant({ pkg, onSelectPackage }: Props) {
  const access = getModuleAccess(pkg, "marketingAssistant");

  if (access === "locked") {
    return (
      <div className="space-y-6">
        <ModuleHeader
          icon={Megaphone}
          title="AI Marketing-Assistent"
          description="Erstellt Content für Google Business, Social Media, Kampagnen und lokales SEO."
          badge={<StatusBadge label="Gesperrt" tone="neutral" />}
        />
        <LockedFeature
          title="AI Marketing-Assistent"
          requiredPackageName="Pro"
          description="Erstellt fertige Inhalte für Ihre Kanäle: Google-Business-Posts, Social-Captions, Kampagnenideen und lokale SEO-Themen."
          icon={Megaphone}
          bullets={[
            "Google-Business-Posts & Social-Captions",
            "Kampagnenideen für gezielte Akquise",
            "Lokale SEO-Themen für mehr Sichtbarkeit",
          ]}
          onUpgrade={() => onSelectPackage("pro")}
        />
      </div>
    );
  }

  const isFull = access === "full";

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={Megaphone}
        title="AI Marketing-Assistent"
        description="Erstellt Content für Google Business, Social Media, Kampagnen und lokales SEO."
        badge={
          isFull ? (
            <StatusBadge label="Voller Zugriff" tone="success" dot />
          ) : (
            <StatusBadge label="Vorschau · Pro" tone="warning" dot />
          )
        }
      />

      {!isFull && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3">
          <p className="text-sm text-blue-900">
            Im Pro-Paket sehen Sie eine Auswahl. Mit Premium schalten Sie alle
            Inhalte und den Content-Kalender frei.
          </p>
          <button
            type="button"
            onClick={() => onSelectPackage("premium")}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Premium ansehen
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {DEMO_MARKETING.map((item) => (
          <MarketingCard
            key={item.id}
            item={item}
            locked={!isFull && item.premiumOnly}
            onUpgrade={() => onSelectPackage("premium")}
          />
        ))}
      </div>
    </div>
  );
}

function MarketingCard({
  item,
  locked,
  onUpgrade,
}: {
  item: MarketingItem;
  locked: boolean;
  onUpgrade: () => void;
}) {
  const Icon = TYPE_ICON[item.type];
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          {item.type}
        </span>
        {item.premiumOnly && <StatusBadge label="Premium" tone="accent" />}
      </div>

      <h3 className="mt-3 font-semibold text-navy-900">{item.title}</h3>

      <div className="relative mt-1.5 flex-1">
        <div className={cn(locked && "select-none blur-sm")} aria-hidden={locked}>
          <p className="text-sm leading-relaxed text-slate-600">{item.body}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/50">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-white">
              <Lock className="h-4 w-4" />
            </span>
            <button
              type="button"
              onClick={onUpgrade}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Mit Premium freischalten
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
