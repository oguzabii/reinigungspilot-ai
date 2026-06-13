"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Building2,
  Globe,
  Crosshair,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { inputClass, labelClass } from "@/components/leads/form-styles";

/**
 * Controlled research tools for a single source execution.
 *
 * The owner types a search keyword + region; we build **plain href links** to
 * their own browser searches (Google, Maps, ZEFIX, web/contact search). Clicking
 * a link opens a new tab — that is the ONLY thing that happens.
 *
 * HARD GUARDRAILS:
 *   - NO `fetch()`, NO API call, NO scraping, NO server-side collection.
 *   - Klarsa never reads, stores or transmits any search result.
 *   - The capture button routes to the pre-filled Opportunity form with safe,
 *     non-PII context (source id, suggested service, typed region). It creates
 *     nothing automatically — the human confirms and saves.
 */
export function ResearchTools({
  sourceId,
  defaultKeyword,
  service,
}: {
  sourceId: string;
  defaultKeyword: string;
  service: string;
}) {
  const [keyword, setKeyword] = useState(defaultKeyword);
  const [region, setRegion] = useState("");

  const term = `${keyword} ${region}`.trim();
  const q = encodeURIComponent(term || keyword);

  const links = [
    {
      key: "google",
      label: "Google Suche",
      icon: Search,
      href: `https://www.google.com/search?q=${q}`,
    },
    {
      key: "maps",
      label: "Google Maps",
      icon: MapPin,
      href: `https://www.google.com/maps/search/${q}`,
    },
    {
      key: "zefix",
      label: "ZEFIX (Firma prüfen)",
      icon: Building2,
      href: "https://www.zefix.ch/de/search",
    },
    {
      key: "web",
      label: "Website / Kontakt",
      icon: Globe,
      href: `https://www.google.com/search?q=${encodeURIComponent(`${term} kontakt`.trim())}`,
    },
  ];

  // Safe, non-PII capture context: source link + suggested service + region.
  const params = new URLSearchParams({ source: sourceId, service });
  if (region.trim()) params.set("region", region.trim());
  const captureHref = `/app-shell/lead-hunter?${params.toString()}`;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="re_keyword" className={labelClass}>
            Suchbegriff
          </label>
          <input
            id="re_keyword"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className={inputClass}
            placeholder="z. B. Liegenschaftsverwaltung"
          />
        </div>
        <div>
          <label htmlFor="re_region" className={labelClass}>
            Region / Ort
          </label>
          <input
            id="re_region"
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={inputClass}
            placeholder="z. B. Zürich"
          />
        </div>
      </div>

      {/* Research links — user-opened only, no fetch/scrape/API */}
      <div className="flex flex-wrap gap-2">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <a
              key={l.key}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-800 transition-colors hover:border-blue-300 hover:text-blue-700"
            >
              <Icon className="h-3.5 w-3.5 text-blue-600" strokeWidth={2} />
              {l.label}
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          );
        })}
      </div>

      <p className="inline-flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
        <ShieldCheck className="mt-px h-3 w-3 shrink-0 text-emerald-500" />
        Diese Links öffnen Ihre eigene Suche im Browser. Klarsa ruft nichts ab,
        speichert keine Ergebnisse und liest keine Webseiten aus.
      </p>

      {/* Capture CTA — carries safe, non-PII context into the form */}
      <Link
        href={captureHref}
        className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800"
      >
        <Crosshair className="h-4 w-4" strokeWidth={2.2} />
        Gefundene Firma als Opportunity erfassen
      </Link>
    </div>
  );
}
