import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Radar,
  Search,
  UserPlus,
  SlidersHorizontal,
  MapPin,
  CheckCircle2,
  CircleDashed,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Clock,
  Zap,
} from "lucide-react";
import { AppShellNav } from "@/components/app-shell/AppShellNav";
import {
  CANTON_BY_CODE,
  cantonForRegion,
  outlinePath,
  scoreFillRadar,
  scoreToneBadge,
} from "@/components/lead-hunter/swiss-radar";
import { CandidatePipelineButtons } from "@/components/lead-hunter/CandidatePipelineButtons";
import { sourceReadiness } from "@/lib/discovery/adapters";
import { isSupabaseConfigured } from "@/lib/env";
import { getCurrentCompanyContext } from "@/lib/auth/session";
import { getCompanySummary, getProspects, getDiscoveryRuns } from "@/lib/auth/tenant-data";

// Reads the session/cookies -> always rendered on demand, never prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lead Radar (intern) – Klarsa",
  description:
    "Wo Klarsa neue Leads sucht: aktive Lead-Quellen, neue Chancen und die nächste Aktion. Aus erfassten Daten, kein Scraping, keine externe Abfrage ohne Freigabe.",
  robots: { index: false, follow: false },
};

/** Plain-language status text per source channel. */
const SOURCE_TEXT: Record<string, { ready: string; missing: string }> = {
  google_places: {
    ready: "Aktiv – findet Betriebe über die offizielle Places-Suche.",
    missing: "Nicht konfiguriert – Zugang hinterlegen, dann findet Klarsa Betriebe.",
  },
  baugesuche: {
    ready: "Aktiv – offizielle Baugesuche/Bauprojekte als Signale.",
    missing: "Nicht konfiguriert – offiziellen Bauprojekt-Feed hinterlegen.",
  },
  simap: {
    ready: "Aktiv – öffentliche Ausschreibungen passend zu Reinigung.",
    missing: "Zugang erforderlich – offizielle SIMAP-API noch nicht verbunden.",
  },
  zefix: {
    ready: "Aktiv – Firmenprüfung & Handelsregister-Signale.",
    missing: "Zugang erforderlich – offizielle ZEFIX-API noch nicht verbunden.",
  },
};

const PRE_PROMO = new Set<string>(["raw", "scored", "approved"]);

export default async function AppShellLeadRadarPage() {
  if (!isSupabaseConfigured()) redirect("/app-shell");

  const context = await getCurrentCompanyContext();
  if (!context) redirect("/login");
  const companyId = context.activeCompanyId;
  if (!companyId) redirect("/app-shell");

  const [summary, opportunities, runs] = await Promise.all([
    getCompanySummary(companyId),
    getProspects(companyId),
    getDiscoveryRuns(companyId, 1),
  ]);
  const company = summary?.name ?? "Ihren Betrieb";

  const sources = sourceReadiness();
  const activeSources = sources.filter((s) => s.configured).length;
  const lastRun = runs[0] ?? null;
  const lastSearch = lastRun ? lastRun.createdAt.slice(0, 16).replace("T", " ") : null;
  // Suggest the next source to check: first configured one, else first overall.
  const nextSource = sources.find((s) => s.configured)?.label ?? sources[0]?.label ?? null;

  // New candidates (not yet in the pipeline), most interesting first.
  const candidates = opportunities
    .filter((o) => o.promotedLeadId === null && PRE_PROMO.has(o.status))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const topCandidates = candidates.slice(0, 5);

  // Geographic radar buckets (deterministic offline mapping).
  const cantonAgg = new Map<string, { count: number; scoreSum: number; scoreN: number }>();
  const regionAgg = new Map<string, { display: string; count: number; scoreSum: number; scoreN: number }>();
  let noCanton = 0;
  for (const o of opportunities) {
    const region = (o.region ?? "").trim();
    if (region === "") continue;
    const code = cantonForRegion(region);
    if (code) {
      const a = cantonAgg.get(code) ?? { count: 0, scoreSum: 0, scoreN: 0 };
      a.count++;
      if (o.score !== null) {
        a.scoreSum += o.score;
        a.scoreN++;
      }
      cantonAgg.set(code, a);
    } else {
      noCanton++;
    }
    const rk = region.toLowerCase();
    const r = regionAgg.get(rk) ?? { display: region, count: 0, scoreSum: 0, scoreN: 0 };
    r.count++;
    if (o.score !== null) {
      r.scoreSum += o.score;
      r.scoreN++;
    }
    regionAgg.set(rk, r);
  }
  const cantonBuckets = [...cantonAgg.entries()]
    .map(([code, a]) => {
      const c = CANTON_BY_CODE[code];
      return { code, name: c.name, x: c.x, y: c.y, count: a.count, avgScore: a.scoreN > 0 ? Math.round(a.scoreSum / a.scoreN) : null };
    })
    .sort((p, q) => q.count - p.count);
  const topRegions = [...regionAgg.values()]
    .map((r) => ({ display: r.display, count: r.count, avgScore: r.scoreN > 0 ? Math.round(r.scoreSum / r.scoreN) : null }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShellNav companyName={summary?.name} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        {/* Hero */}
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">
            <Radar className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">
              Klarsa sucht aktiv neue Leads für {company}
            </h1>
            <p className="text-sm text-slate-500">
              {activeSources} von {sources.length} Lead-Quellen aktiv ·{" "}
              {candidates.length} neue Chance{candidates.length === 1 ? "" : "n"}
            </p>
          </div>
        </div>

        {/* Active-search status strip */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
            <Zap className="h-3.5 w-3.5" /> {activeSources > 0 ? "Suche aktiv" : "Suche bereit"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {lastSearch ? `Letzte Suche: ${lastSearch}` : "Noch keine Suche ausgeführt"}
          </span>
          {nextSource && (
            <span className="inline-flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              Nächste Quelle: {nextSource}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/app-shell/revenue-autopilot/discovery"
            className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800"
          >
            <Search className="h-4 w-4" strokeWidth={2.2} /> Neue Leads suchen
          </Link>
          <Link
            href="/app-shell/lead-hunter"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-800 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-700"
          >
            <UserPlus className="h-4 w-4" strokeWidth={2.2} /> Lead manuell erfassen
          </Link>
          <Link
            href="/app-shell/lead-hunter/sources"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-800 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-700"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2.2} /> Lead-Quellen verwalten
          </Link>
        </div>

        {/* Lead source channels */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
            Lead-Quellen
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {sources.map((s) => {
              const text = SOURCE_TEXT[s.key] ?? { ready: "Aktiv.", missing: "Nicht konfiguriert." };
              return (
                <div
                  key={s.key}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span
                    className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${
                      s.configured
                        ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
                        : "bg-slate-100 text-slate-400 ring-slate-200"
                    }`}
                  >
                    {s.configured ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-navy-900">{s.label}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                          s.configured
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-slate-100 text-slate-500 ring-slate-200"
                        }`}
                      >
                        {s.configured ? "Aktiv" : "Nicht verbunden"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      {s.configured ? text.ready : text.missing}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Zugänge werden in den{" "}
            <Link href="/app-shell/settings" className="font-medium text-blue-700 hover:text-blue-800">
              Einstellungen
            </Link>{" "}
            hinterlegt – keine Schlüssel sichtbar.
          </p>
        </section>

        {/* New candidates */}
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
              <Sparkles className="h-4 w-4 text-blue-600" /> Neue Chancen
            </h2>
            {candidates.length > 0 && (
              <Link
                href="/app-shell/pipeline#chancen"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                Alle in der Pipeline <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          {topCandidates.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
              <p className="text-sm font-semibold text-navy-900">Noch keine offenen Chancen.</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Starten Sie eine Suche oder erfassen Sie einen Lead manuell – neue Chancen erscheinen hier und in der Pipeline.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {topCandidates.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy-900">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        {[c.region, c.contactEmail || c.contactPhone ? "Kontakt vorhanden" : "Kontakt fehlt"]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    {c.score !== null && (
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${scoreToneBadge(c.score)}`}>
                        Score {c.score}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <CandidatePipelineButtons prospectId={c.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Swiss radar (geographic overview) */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b border-navy-100 px-5 py-4">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-navy-900">
              <Radar className="h-4 w-4 text-blue-600" /> Schweiz-Radar
            </h2>
            <span className="text-xs text-slate-400">
              {cantonBuckets.length === 0 ? "bereit" : `${cantonBuckets.length} Region${cantonBuckets.length === 1 ? "" : "en"}`}
            </span>
          </div>
          <SwissRadar buckets={cantonBuckets} />
          {noCanton > 0 && (
            <p className="px-5 pb-4 text-xs text-slate-400">
              {noCanton} Chance{noCanton === 1 ? "" : "n"} ohne erkannten Kanton – nicht platziert.
            </p>
          )}
        </section>

        {/* Calm note */}
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          Klarsa sucht nur über freigegebene, offizielle Quellen – kein Scraping, kein automatischer Versand.
        </div>

        {/* Technical details (collapsed; not the main customer view) */}
        <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-medium text-slate-600">
            Technische Details anzeigen
          </summary>
          <div className="mt-3 space-y-3">
            {topRegions.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Top-Regionen</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {topRegions.map((r) => (
                    <span
                      key={r.display}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${scoreToneBadge(r.avgScore)}`}
                    >
                      <MapPin className="h-3 w-3" /> {r.display}
                      <span className="rounded-full bg-white/70 px-1.5 tabular-nums">{r.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Link
              href="/app-shell/revenue-autopilot/signals"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800"
            >
              Signal-Analyse öffnen (warum jetzt?) <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </details>
      </main>
    </div>
  );
}

/**
 * Premium Swiss radar — a dark "radar screen" SVG (slow SMIL sweep so it feels
 * alive even when empty). Switzerland silhouette + canton pins (size ≈ count,
 * colour ≈ avg score). Nothing here fetches anything.
 */
function SwissRadar({
  buckets,
}: {
  buckets: Array<{ code: string; name: string; x: number; y: number; count: number; avgScore: number | null }>;
}) {
  const W = 480;
  const H = 300;
  const PAD = 28;
  const px = (x: number) => PAD + (x / 100) * (W - 2 * PAD);
  const py = (y: number) => PAD + (y / 100) * (H - 2 * PAD);
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const pinR = (count: number) => 6 + (Math.sqrt(count) / Math.sqrt(maxCount)) * 12;
  const cx = W / 2;
  const cy = H / 2;
  const path = outlinePath(px, py);

  return (
    <div className="bg-slate-50/60 px-5 py-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Schweiz-Radar der Chancen nach Kanton"
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
        <rect x="0" y="0" width={W} height={H} rx="12" fill="url(#radarBg)" />
        {[52, 92, 132].map((r) => (
          <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(148,180,230,0.16)" strokeWidth={1} />
        ))}
        <line x1={PAD} y1={cy} x2={W - PAD} y2={cy} stroke="rgba(148,180,230,0.10)" strokeWidth={1} />
        <line x1={cx} y1={PAD} x2={cx} y2={H - PAD} stroke="rgba(148,180,230,0.10)" strokeWidth={1} />
        <g>
          <path d={`M${cx} ${cy} L${cx + 150} ${cy - 44} A156 156 0 0 1 ${cx + 150} ${cy + 44} Z`} fill="url(#radarSweep)">
            <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="7s" repeatCount="indefinite" />
          </path>
        </g>
        <path d={path} fill="rgba(96,165,250,0.06)" stroke="rgba(130,175,240,0.42)" strokeWidth={1.3} strokeLinejoin="round" />
        <text x={W - PAD} y={H - 12} textAnchor="end" fill="rgba(148,180,230,0.45)" fontSize="10">
          CH · stilisiert
        </text>
        {buckets.map((b) => {
          const r = pinR(b.count);
          const fill = scoreFillRadar(b.avgScore);
          return (
            <g key={b.code}>
              <circle cx={px(b.x)} cy={py(b.y)} r={r * 2.3} fill={fill} fillOpacity={0.16} />
              <circle cx={px(b.x)} cy={py(b.y)} r={r} fill={fill} fillOpacity={0.95} stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
              <text x={px(b.x)} y={py(b.y) + r + 11} textAnchor="middle" fill="rgba(226,235,250,0.92)" fontSize="9.5" fontWeight="600">
                {b.code} · {b.count}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
