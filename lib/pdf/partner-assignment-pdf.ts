/**
 * Partner-Einsatzbestätigung (internal partner assignment), SERVER-ONLY.
 *
 * The internal counterpart to the customer Auftragsbestätigung, in the same
 * modern card design: it tells the assigned partner/team what to do, where and
 * when — WITHOUT the customer price as a headline, with an "Ausführung" summary
 * and the fixed partner rules (communication runs through the company, no own
 * offers, etc.). Built from existing data only — no migration, no external
 * asset. Single-page A4 via `pdf-core` + `clean24-doc`. Tenant-aware.
 */

import { createPdf, wrap, GRAY } from "./pdf-core";
import {
  CARD_BORDER,
  DARK_TEXT,
  DOC_LEFT,
  DOC_RIGHT,
  drawBulletCard,
  drawCardFooter,
  drawCardHeader,
  drawChecklist,
  drawDarkCard,
  drawInfoCard,
} from "./clean24-doc";
import type { CompanyProfile } from "./company-profile";

export interface PartnerAssignmentScopeItem {
  label: string;
  detail: string | null;
}

export interface PartnerAssignmentData {
  profile: CompanyProfile;
  reference: string;
  createdAt: string; // ISO
  jobTitle: string;
  offerReference: string | null;
  customerName: string | null;
  customerContact: string | null;
  customerAddress: string | null;
  serviceLabel: string | null;
  cleaningDate: string | null; // YYYY-MM-DD
  handoverDate: string | null; // YYYY-MM-DD
  cleaningTime: string | null; // HH:mm or null
  team: string | null;
  statusLabel: string;
  scopeItems: PartnerAssignmentScopeItem[];
}

function dateCh(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split("-");
  return d && m && y ? `${d}.${m}.${y}` : iso.slice(0, 10);
}

export function buildPartnerAssignmentPdf(
  data: PartnerAssignmentData,
): Uint8Array<ArrayBuffer> {
  const doc = createPdf();
  const p = data.profile;
  const brand = p.brandName || p.legalName;
  const reinigung = dateCh(data.cleaningDate) ?? "n. Vereinbarung";
  const abgabe = dateCh(data.handoverDate) ?? dateCh(data.cleaningDate) ?? "n. Vereinbarung";
  const recipient = data.customerContact ?? data.customerName ?? "Kunde";
  const service = data.serviceLabel ?? "Reinigung inkl. Abgabegarantie";

  const bodyTop = drawCardHeader(doc, {
    brand,
    docLabel: "Einsatzbestätigung",
    subtitle: `Partnerauftrag - ${service}`,
    refLine: data.offerReference
      ? `Interne Partner-Version zur angenommenen Offerte ${data.offerReference}`
      : "Interne Partner-Version",
    minis: [
      { label: "Kunde", value: recipient },
      { label: "Reinigung", value: reinigung },
      { label: "Abgabe", value: abgabe },
      { label: "Status", value: data.statusLabel, note: data.cleaningTime ? "" : "Uhrzeit offen" },
    ],
  });

  // -------- Left column --------
  const lx = DOC_LEFT;
  const lw = 320;
  let ly = bodyTop;
  doc.text(lx, ly, 13, 2, "Auftrag & Projektdetails", DARK_TEXT);
  ly -= 18;
  const intro = `Bitte führen Sie die ${service} inklusive Abgabegarantie fachgerecht, sorgfältig und termingerecht aus. Der vereinbarte Leistungsumfang ist unten aufgeführt.`;
  for (const line of wrap(intro, 9, lw)) {
    doc.text(lx, ly, 9, 1, line, GRAY);
    ly -= 12;
  }
  ly -= 8;

  const cgap = 10;
  const cw = (lw - cgap) / 2;
  const chH = 58;
  const addrLines = (data.customerAddress ?? "")
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2);
  drawInfoCard(doc, lx, ly, cw, chH, "Kunde / Objektkontakt", [recipient, ...addrLines]);
  drawInfoCard(doc, lx + cw + cgap, ly, cw, chH, "Objekt", [service, "inkl. Abgabegarantie"]);
  ly -= chH + cgap;
  drawInfoCard(doc, lx, ly, cw, chH, "Termine", [`Reinigung: ${reinigung}`, `Abgabe: ${abgabe}`]);
  drawInfoCard(
    doc,
    lx + cw + cgap,
    ly,
    cw,
    chH,
    "Hinweis",
    data.cleaningTime
      ? [`${data.cleaningTime} Uhr`, "Übergabe-Zeit vereinbart"]
      : ["Uhrzeit der Übergabe", "noch nicht bekannt"],
  );
  ly -= chH + 16;

  doc.text(lx, ly, 13, 2, "Vereinbarter Leistungsumfang", DARK_TEXT);
  ly -= 16;
  const checklistItems =
    data.scopeItems.length > 0
      ? data.scopeItems.map((it) => ({ label: it.label, detail: it.detail }))
      : [{ label: service, detail: "gemäss Auftrag" }];
  drawChecklist(doc, lx, ly, lw, checklistItems);

  // -------- Right column --------
  const rx = 374;
  const rw = DOC_RIGHT - rx;
  let ry = bodyTop;

  // "Partner-Version" badge
  doc.roundedRectStroke(rx, ry - 16, 92, 16, 8, 0.8, CARD_BORDER);
  doc.text(rx + 10, ry - 11.5, 7.5, 2, "Partner-Version", DARK_TEXT);
  ry -= 28;

  // Ausführung bullets
  ry = drawBulletCard(doc, rx, ry, rw, "Ausführung", [
    `Termin: ${reinigung}`,
    `Abgabe: ${abgabe}`,
    data.team ? `Team: ${data.team}` : "Uhrzeit folgt nach Bestätigung",
    "Abgabebereit reinigen",
  ]);
  ry -= 14;

  ry = drawDarkCard(
    doc,
    rx,
    ry,
    rw,
    "Abgabegarantie",
    "Die vereinbarten Bereiche sind vollständig, sauber und abgabebereit zu reinigen. Beanstandungen sind gemäss Partnervereinbarung rasch zu beheben.",
  );
  ry -= 14;

  drawBulletCard(doc, rx, ry, rw, "Wichtige Hinweise", [
    `Kundenkommunikation läuft über ${brand}.`,
    "Keine eigenen Angebote an den Kunden.",
    `Bei Unklarheiten vor Ort zuerst ${brand} kontaktieren.`,
    "Vorher-/Nachher-Fotos sind empfohlen.",
  ]);

  drawCardFooter(doc, p);
  return doc.build();
}
