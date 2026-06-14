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
  ArrowRight,
  Activity,
  ChevronRight,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import { matchServices } from "@/components/lead-hunter/scoring";
import {
  CANTON_BY_CODE,
  cantonForRegion,
  outlinePath,
  scoreFillRadar,
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

  const isEmpty = total === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
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
              {total >= 100 ? "+" : ""} Opportunit{total === 1 ? "y" : "ies"} auf
              dem Radar
            </p>
          </div>
        </div>

        {/* Opportunity Signals — "Warum jetzt?" per region/service */}
        <Link
          href="/app-shell/revenue-autopilot/signals"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
            <Activity className="h-4 w-4 text-blue-600" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-navy-900">
              Opportunity Signals · Warum jetzt?
            </span>
            <span className="block text-sm text-slate-500">
              Zeitkritische Chancen mit Service-Potenzial, Timing und Konfidenz –
              je Kandidat.
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
        </Link>

        {/* Stat cards — always shown (zeros read as "armed", not broken) */}
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

        {/* Swiss radar — ALWAYS rendered, even with 0 opportunities */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-navy-100 px-5 py-4">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
              <Radar className="h-4 w-4 text-blue-600" />
              Schweiz-Radar · Kantone
            </h2>
            <span className="text-xs text-slate-400">
              {isEmpty
                ? "bereit"
                : `${cantonBuckets.length} Region${cantonBuckets.length === 1 ? "" : "en"} platziert`}
            </span>
          </div>

          <SwissRadar buckets={cantonBuckets} />

          {/* Score legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 pb-4 text-xs text-slate-500">
            <span className="font-medium text-slate-400">Score-Intensität:</span>
            <LegendDot color="#34d399" label="≥70 hoch" />
            <LegendDot color="#60a5fa" label="40–69 mittel" />
            <LegendDot color="#fbbf24" label="<40 niedrig" />
            <LegendDot color="#94a3b8" label="kein Score" />
            <span className="text-slate-400">· Punktgrösse ≈ Anzahl</span>
          </div>

          {(unknownRegion > 0 || noRegion > 0) && (
            <p className="px-5 pb-4 text-xs text-slate-400">
              {unknownRegion > 0 &&
                `${unknownRegion} Opportunit${unknownRegion === 1 ? "y" : "ies"} ohne erkannten Kanton`}
              {unknownRegion > 0 && noRegion > 0 && " · "}
              {noRegion > 0 && `${noRegion} ohne Regionsangabe`}
              {" "}– nicht auf der Karte platziert.
            </p>
          )}
        </section>

        {/* Honest no-automation note */}
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
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

        {isEmpty ? (
          /* Honest, premium empty-state CTA — the radar above already looks alive */
          <section className="mt-6 rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/70 to-white p-6 text-center sm:p-8">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
              <Radar className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <p className="mt-3 text-base font-semibold text-navy-900">
              Der Radar ist bereit.
            </p>
            <p className="mx-auto mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600">
              Erfassen Sie die erste reale Opportunity, damit Klarsa Chancen nach
              Region, Quelle und Potenzial sichtbar macht.
            </p>
            <Link
              href="/app-shell/lead-hunter"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800"
            >
              Erste Opportunity erfassen
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          </section>
        ) : (
          <>
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
 * Premium Swiss radar — a dark "radar screen" rendered as a self-contained
 * static SVG (with a slow CSS/SMIL sweep so it feels alive even when empty).
 * A stylised Switzerland silhouette anchors the canvas; canton pins are placed
 * by the approximate offline layout (no map provider/tiles). Pin size ≈ count,
 * colour ≈ average score. Nothing here fetches anything.
 */
function SwissRadar({ buckets }: { buckets: CantonBucket[] }) {
  const W = 480;
  const H = 300;
  const PAD = 28;
  const px = (x: number) => PAD + (x / 100) * (W - 2 * PAD);
  const py = (y: number) => PAD + (y / 100) * (H - 2 * PAD);
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const pinR = (count: number) =>
    6 + (Math.sqrt(count) / Math.sqrt(maxCount)) * 12;
  const cx = W / 2;
  const cy = H / 2;
  const path = outlinePath(px, py);

  return (
    <div className="bg-slate-50/60 px-5 py-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Stilisierte Schweiz-Radar-Karte der Opportunities nach Kanton"
        className="h-auto w-full rounded-xl"
      >
        <defs>
          <radialGradient id="radarBg" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#1a2e57" />
            <stop offset="60%" stopColor="#0f1e3c" />
            <stop offset="100%" stopColor="#081025" />
          </radialGradient>
          <linearGradient id="radarSweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Dark radar canvas */}
        <rect x="0" y="0" width={W} height={H} rx="12" fill="url(#radarBg)" />

        {/* Concentric range rings */}
        {[52, 92, 132].map((r) => (
          <circle
            key={r}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(148,180,230,0.16)"
            strokeWidth={1}
          />
        ))}

        {/* Crosshair */}
        <line x1={PAD} y1={cy} x2={W - PAD} y2={cy} stroke="rgba(148,180,230,0.10)" strokeWidth={1} />
        <line x1={cx} y1={PAD} x2={cx} y2={H - PAD} stroke="rgba(148,180,230,0.10)" strokeWidth={1} />

        {/* Rotating sweep beam — pure SVG/SMIL, no JS, no clock */}
        <g>
          <path
            d={`M${cx} ${cy} L${cx + 150} ${cy - 44} A156 156 0 0 1 ${cx + 150} ${cy + 44} Z`}
            fill="url(#radarSweep)"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${cx} ${cy}`}
              to={`360 ${cx} ${cy}`}
              dur="7s"
              repeatCount="indefinite"
            />
          </path>
        </g>

        {/* Stylised Switzerland silhouette */}
        <path
          d={path}
          fill="rgba(96,165,250,0.06)"
          stroke="rgba(130,175,240,0.42)"
          strokeWidth={1.3}
          strokeLinejoin="round"
        />

        <text x={W - PAD} y={H - 12} textAnchor="end" fill="rgba(148,180,230,0.45)" fontSize="10">
          CH · stilisiert
        </text>

        {/* Canton pins (glow halo + core + label) */}
        {buckets.map((b) => {
          const r = pinR(b.count);
          const fill = scoreFillRadar(b.avgScore);
          return (
            <g key={b.code}>
              <circle cx={px(b.x)} cy={py(b.y)} r={r * 2.3} fill={fill} fillOpacity={0.16} />
              <circle
                cx={px(b.x)}
                cy={py(b.y)}
                r={r}
                fill={fill}
                fillOpacity={0.95}
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={1.5}
              />
              <text
                x={px(b.x)}
                y={py(b.y) + r + 11}
                textAnchor="middle"
                fill="rgba(226,235,250,0.92)"
                fontSize="9.5"
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
