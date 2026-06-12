import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Map as MapIcon,
  ArrowLeft,
  Lock,
  Radar,
  MapPin,
  Target,
  Gauge,
  TrendingUp,
  CheckCircle2,
  Tag,
  Library,
} from "lucide-react";
import { InternalHeader } from "@/components/InternalHeader";
import { matchServices } from "@/components/lead-hunter/scoring";
import {
  CANTON_BY_CODE,
  cantonForRegion,
  scoreFill,
  scoreToneBadge,
} from "@/components/lead-hunter/swiss-radar";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getCompanySummary, getProspects } from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lead Hunter · Schweiz-Radar (intern) – Klarsa",
  description:
    "Manuelle Radar-Ansicht der Opportunities nach Region/Kanton. Aus erfassten Daten, kein Kartenanbieter, keine externe Abfrage.",
  robots: { index: false, follow: false },
};

interface CantonBucket {
  code: string;
  name: string;
  x: number;
  y: number;
  count: number;
  avgScore: number | null;
}

export default async function AppShellLeadRadarPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const [summary, opportunities] = await Promise.all([
    getCompanySummary(companyId),
    getProspects(companyId),
  ]);

  const total = opportunities.length;
  const scored = opportunities.filter((o) => o.score !== null);
  const avgScore =
    scored.length > 0
      ? Math.round(scored.reduce((s, o) => s + (o.score ?? 0), 0) / scored.length)
      : null;
  const highScore = opportunities.filter(
    (o) => o.score !== null && o.score >= 70,
  ).length;
  const converted = opportunities.filter(
    (o) => o.promotedLeadId !== null || o.status === "converted",
  ).length;

  // Group by canton (deterministic offline mapping) for the radar pins.
  const cantonAgg = new Map<
    string,
    { count: number; scoreSum: number; scoreN: number }
  >();
  let unknownRegion = 0; // region text present, no canton match
  let noRegion = 0; // no region text at all
  for (const o of opportunities) {
    const region = (o.region ?? "").trim();
    if (region === "") {
      noRegion++;
      continue;
    }
    const code = cantonForRegion(region);
    if (!code) {
      unknownRegion++;
      continue;
    }
    const a = cantonAgg.get(code) ?? { count: 0, scoreSum: 0, scoreN: 0 };
    a.count++;
    if (o.score !== null) {
      a.scoreSum += o.score;
      a.scoreN++;
    }
    cantonAgg.set(code, a);
  }
  const cantonBuckets: CantonBucket[] = [...cantonAgg.entries()]
    .map(([code, a]) => {
      const c = CANTON_BY_CODE[code];
      return {
        code,
        name: c.name,
        x: c.x,
        y: c.y,
        count: a.count,
        avgScore: a.scoreN > 0 ? Math.round(a.scoreSum / a.scoreN) : null,
      };
    })
    .sort((p, q) => q.count - p.count);

  // Top regions by raw text (group case-insensitively, keep first display form).
  const regionAgg = new Map<
    string,
    { display: string; count: number; scoreSum: number; scoreN: number }
  >();
  for (const o of opportunities) {
    const region = (o.region ?? "").trim();
    if (region === "") continue;
    const key = region.toLowerCase();
    const r =
      regionAgg.get(key) ?? { display: region, count: 0, scoreSum: 0, scoreN: 0 };
    r.count++;
    if (o.score !== null) {
      r.scoreSum += o.score;
      r.scoreN++;
    }
    regionAgg.set(key, r);
  }
  const topRegions = [...regionAgg.values()]
    .map((r) => ({
      display: r.display,
      count: r.count,
      avgScore: r.scoreN > 0 ? Math.round(r.scoreSum / r.scoreN) : null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Service-match highlights (deterministic, reused from scoring.ts).
  const serviceAgg = new Map<string, number>();
  for (const o of opportunities) {
    const matched = matchServices({
      name: o.name,
      category: o.category ?? "Manuell",
      region: o.region ?? "",
      servicePotential: o.servicePotential ?? "",
      sourceType: o.sourceType,
      score: o.score,
    });
    for (const s of matched) serviceAgg.set(s, (serviceAgg.get(s) ?? 0) + 1);
  }
  const topServices = [...serviceAgg.entries()]
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count);

  // Source labels (only where an opportunity was prepared from a registry source).
  const sourceAgg = new Map<string, number>();
  for (const o of opportunities) {
    if (o.sourceLabel) {
      sourceAgg.set(o.sourceLabel, (sourceAgg.get(o.sourceLabel) ?? 0) + 1);
    }
  }
  const topSources = [...sourceAgg.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  // Opportunity types.
  const typeAgg = new Map<string, number>();
  for (const o of opportunities) {
    const t = o.category ?? "Manuell";
    typeAgg.set(t, (typeAgg.get(t) ?? 0) + 1);
  }
  const topTypes = [...typeAgg.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-slate-50">
      <InternalHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <Link
          href="/app-shell/lead-hunter"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" /> Lead Hunter
        </Link>

        <div className="mt-3 flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <MapIcon className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Lead Hunter · Schweiz-Radar
            </h1>
            <p className="text-sm text-slate-500">
              {summary?.name ?? "Mandant"} · {total}
              {total >= 100 ? "+" : ""} Opportunit{total === 1 ? "y" : "ies"}
            </p>
          </div>
        </div>

        {/* Honest no-automation note */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            <strong className="font-semibold">Manuelle Radar-Ansicht, keine
            automatische Suche.</strong>{" "}
            Visualisiert ausschliesslich die erfassten Opportunities dieses
            Mandanten (RLS-gefiltert). <strong className="font-semibold">Kein
            Kartenanbieter</strong>, keine Google-Maps-/Kacheln, keine ZEFIX-/
            SIMAP-/externe Abfrage – das Kanton-Layout ist eine stilisierte,
            lokale Darstellung.
          </p>
        </div>

        {total === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Radar className="mx-auto h-8 w-8 text-slate-300" strokeWidth={1.8} />
            <p className="mt-2 text-sm font-medium text-navy-900">
              Noch keine Opportunities zum Visualisieren.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Erfassen Sie im{" "}
              <Link
                href="/app-shell/lead-hunter"
                className="font-medium text-blue-700 hover:text-blue-800"
              >
                Opportunity Radar
              </Link>{" "}
              die erste Opportunity – manuell, ohne externe Quellen.
            </p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <section className="mt-8">
              <div className="grid gap-3 sm:grid-cols-4">
                <StatCard icon={Target} label="Opportunities" value={String(total)} />
                <StatCard
                  icon={Gauge}
                  label="Ø Score"
                  value={avgScore === null ? "—" : String(avgScore)}
                />
                <StatCard
                  icon={TrendingUp}
                  label="High-Score (≥70)"
                  value={String(highScore)}
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Konvertiert"
                  value={String(converted)}
                />
              </div>
            </section>

            {/* Swiss radar map (stylised, static SVG) */}
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
                  <Radar className="h-4 w-4 text-blue-600" />
                  Schweiz-Radar · Kantone
                </h2>
                <span className="text-xs text-slate-400">
                  {cantonBuckets.length} Region
                  {cantonBuckets.length === 1 ? "" : "en"} platziert
                </span>
              </div>

              <SwissRadar buckets={cantonBuckets} />

              {/* Score legend */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                <span className="font-medium text-slate-400">Score-Intensität:</span>
                <LegendDot color="#10b981" label="≥70 hoch" />
                <LegendDot color="#3b82f6" label="40–69 mittel" />
                <LegendDot color="#f59e0b" label="<40 niedrig" />
                <LegendDot color="#cbd5e1" label="kein Score" />
                <span className="text-slate-400">· Punktgrösse ≈ Anzahl</span>
              </div>

              {(unknownRegion > 0 || noRegion > 0) && (
                <p className="mt-3 text-xs text-slate-400">
                  {unknownRegion > 0 &&
                    `${unknownRegion} Opportunit${unknownRegion === 1 ? "y" : "ies"} ohne erkannten Kanton`}
                  {unknownRegion > 0 && noRegion > 0 && " · "}
                  {noRegion > 0 &&
                    `${noRegion} ohne Regionsangabe`}
                  {" "}– nicht auf der Karte platziert.
                </p>
              )}
            </section>

            {/* Top regions / cantons */}
            {topRegions.length > 0 && (
              <section className="mt-8">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Top-Regionen
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {topRegions.map((r) => (
                    <div
                      key={r.display}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy-900">
                          {r.display}
                        </p>
                        <p className="text-xs text-slate-500">
                          {r.count} Opportunit{r.count === 1 ? "y" : "ies"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${scoreToneBadge(r.avgScore)}`}
                      >
                        Ø {r.avgScore ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Highlights: services / sources / types */}
            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <ChipCard
                icon={Target}
                title="Service-Potenzial"
                empty="Noch kein Service-Match."
                chips={topServices.map((s) => ({ label: s.service, count: s.count }))}
                chipClass="bg-blue-50 text-blue-700 ring-blue-100"
              />
              <ChipCard
                icon={Library}
                title="Quellen"
                empty="Noch keine verknüpfte Quelle."
                chips={topSources.map((s) => ({ label: s.label, count: s.count }))}
                chipClass="bg-navy-50 text-navy-700 ring-navy-100"
              />
              <ChipCard
                icon={Tag}
                title="Typen"
                empty="Keine Typen."
                chips={topTypes.map((t) => ({ label: t.type, count: t.count }))}
                chipClass="bg-slate-100 text-slate-600 ring-slate-200"
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
        <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
        {label}
      </span>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-navy-900">
        {value}
      </p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function ChipCard({
  icon: Icon,
  title,
  chips,
  empty,
  chipClass,
}: {
  icon: typeof Target;
  title: string;
  chips: Array<{ label: string; count: number }>;
  empty: string;
  chipClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900">
        <Icon className="h-4 w-4 text-blue-600" strokeWidth={2} />
        {title}
      </span>
      {chips.length === 0 ? (
        <p className="mt-2 text-xs text-slate-400">{empty}</p>
      ) : (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={c.label}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${chipClass}`}
            >
              {c.label}
              <span className="rounded-full bg-white/70 px-1.5 tabular-nums">
                {c.count}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Stylised Swiss canton radar — a static SVG. Decorative concentric rings give
 * the "radar" feel; canton pins are placed by the approximate offline layout
 * (no map provider/tiles). Pin size ≈ opportunity count, colour ≈ average score.
 */
function SwissRadar({ buckets }: { buckets: CantonBucket[] }) {
  const W = 320;
  const H = 220;
  const PAD = 18;
  const px = (x: number) => PAD + (x / 100) * (W - 2 * PAD);
  const py = (y: number) => PAD + (y / 100) * (H - 2 * PAD);
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const pinR = (count: number) =>
    5 + (Math.sqrt(count) / Math.sqrt(maxCount)) * 9;
  const cx = W / 2;
  const cy = H / 2;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/60">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Stilisierte Schweiz-Radar-Karte der Opportunities nach Kanton"
        className="h-auto w-full"
      >
        {/* Decorative radar rings + crosshair */}
        {[44, 78, 112].map((r) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        ))}
        <line x1={PAD} y1={cy} x2={W - PAD} y2={cy} stroke="#eef2f7" strokeWidth={1} />
        <line x1={cx} y1={PAD} x2={cx} y2={H - PAD} stroke="#eef2f7" strokeWidth={1} />
        <text x={W - PAD} y={H - 8} textAnchor="end" className="fill-slate-300" fontSize="9">
          CH · stilisiert
        </text>

        {/* Canton pins */}
        {buckets.map((b) => {
          const r = pinR(b.count);
          return (
            <g key={b.code}>
              <circle
                cx={px(b.x)}
                cy={py(b.y)}
                r={r}
                fill={scoreFill(b.avgScore)}
                fillOpacity={0.85}
                stroke="#ffffff"
                strokeWidth={1.5}
              />
              <text
                x={px(b.x)}
                y={py(b.y) + r + 8}
                textAnchor="middle"
                className="fill-navy-700"
                fontSize="8"
                fontWeight="600"
              >
                {b.code} · {b.count}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
