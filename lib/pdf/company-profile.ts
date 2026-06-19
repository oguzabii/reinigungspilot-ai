/**
 * Company letterhead profile for the generated documents (SERVER-SAFE, pure).
 *
 * This is the SENDER's own public business letterhead (address, contact, bank,
 * VAT number) — the data that appears on every offer/invoice and on the public
 * website. It is NOT a credential and NOT customer data. For the Clean24 pilot
 * the default below mirrors the official Clean24 letterhead so the Offerte PDF
 * matches the company's real documents.
 *
 * Multi-tenant safety: a tenant can override every field via
 * `company_settings.settings.company_profile` (jsonb, RLS-scoped). When NO
 * override is stored and the active brand is NOT Clean24, we fall back to a
 * MINIMAL profile (brand name only, blank bank/contact) so another tenant never
 * inherits Clean24's footer — the PDF simply omits the blank lines.
 */

export interface CompanyProfile {
  legalName: string;
  brandName: string;
  street: string;
  zip: string;
  city: string;
  email: string;
  phone: string;
  website: string;
  bankName: string;
  bankHolder: string;
  bic: string;
  iban: string;
  /** MwSt-Nummer (e.g. CHE-123.456.789 MWST). */
  vatNo: string;
  /** UID (often identical to the VAT base number). */
  uid: string;
  ownerName: string;
  ownerRole: string;
  tagline: string;
}

/** Clean24 public letterhead (the pilot default). Override per-tenant via settings. */
export const CLEAN24_PROFILE: CompanyProfile = {
  legalName: "Clean24 Memis GmbH",
  brandName: "Clean24",
  street: "Glanzenbergstrasse 26",
  zip: "8953",
  city: "Dietikon",
  email: "info@clean-24.ch",
  phone: "+41 44 516 19 23",
  website: "www.clean-24.ch",
  bankName: "UBS",
  bankHolder: "Clean24 Memis GmbH",
  bic: "UBSWCHZH80A",
  iban: "CH40 0020 6206 8983 1701 U",
  vatNo: "CHE-260.909.323",
  uid: "CHE-260.909.323",
  ownerName: "Oguzhan Memis",
  ownerRole: "Geschäftsführer",
  tagline: "Ihr Reinigungsprofi",
};

/** Read a trimmed string field from an untrusted jsonb override. */
function str(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

/**
 * Resolve the letterhead for the active tenant.
 *
 * @param brandName  The active company's display name (from `getCompanySummary`).
 * @param override   `company_settings.settings.company_profile` jsonb, or null.
 */
export function resolveCompanyProfile(
  brandName: string | null,
  override: Record<string, unknown> | null | undefined,
): CompanyProfile {
  const isClean24 = (brandName ?? "").toLowerCase().includes("clean24");

  // Base: Clean24 default for the Clean24 tenant, else a minimal blank profile
  // so a different tenant never inherits Clean24's address/bank details.
  const base: CompanyProfile = isClean24
    ? { ...CLEAN24_PROFILE }
    : {
        legalName: brandName ?? "Mandant",
        brandName: brandName ?? "Mandant",
        street: "",
        zip: "",
        city: "",
        email: "",
        phone: "",
        website: "",
        bankName: "",
        bankHolder: "",
        bic: "",
        iban: "",
        vatNo: "",
        uid: "",
        ownerName: "",
        ownerRole: "",
        tagline: "",
      };

  if (!override || typeof override !== "object") return base;

  // Apply only present string overrides (jsonb is owner-controlled, RLS-scoped).
  const o = override;
  return {
    legalName: str(o.legalName) ?? base.legalName,
    brandName: str(o.brandName) ?? base.brandName,
    street: str(o.street) ?? base.street,
    zip: str(o.zip) ?? base.zip,
    city: str(o.city) ?? base.city,
    email: str(o.email) ?? base.email,
    phone: str(o.phone) ?? base.phone,
    website: str(o.website) ?? base.website,
    bankName: str(o.bankName) ?? base.bankName,
    bankHolder: str(o.bankHolder) ?? base.bankHolder,
    bic: str(o.bic) ?? base.bic,
    iban: str(o.iban) ?? base.iban,
    vatNo: str(o.vatNo) ?? base.vatNo,
    uid: str(o.uid) ?? base.uid,
    ownerName: str(o.ownerName) ?? base.ownerName,
    ownerRole: str(o.ownerRole) ?? base.ownerRole,
    tagline: str(o.tagline) ?? base.tagline,
  };
}

/** A footer text run: bold (label) or regular (value). */
export interface FooterSeg {
  t: string;
  b: boolean;
}

/**
 * Footer as bold-label segments (matching the Clean24 reference: bold labels
 * like "E-Mail:", "Bank:", "IBAN:" with regular values). Returns lines of
 * segments; only present values are included.
 */
export function footerSegments(p: CompanyProfile): FooterSeg[][] {
  const bold = (t: string): FooterSeg => ({ t, b: true });
  const reg = (t: string): FooterSeg => ({ t, b: false });
  const pair = (label: string, value: string): FooterSeg[] =>
    value ? [bold(label), reg(` ${value}`)] : [];
  const addr = [p.street, `${p.zip} ${p.city}`.trim()].filter(Boolean).join(", ");

  const line1: FooterSeg[] = [
    ...(p.legalName ? [bold(p.legalName)] : []),
    ...(addr ? [reg(`  ${addr}`)] : []),
    ...pair("  E-Mail:", p.email),
    ...pair("  Telefon:", p.phone),
  ];
  const line2: FooterSeg[] = [
    ...pair("Website:", p.website),
    ...pair("  Bank:", p.bankName),
    ...pair("  Kontoinhaber:", p.bankHolder),
    ...pair("  BIC/Swift:", p.bic),
  ];
  const line3: FooterSeg[] = [
    ...pair("IBAN:", p.iban),
    ...pair("  MwSt Nr.:", p.vatNo),
  ];
  return [line1, line2, line3].filter((l) => l.length > 0);
}

/** Single-line footer string with the parts that are present. */
export function footerLine(p: CompanyProfile): string[] {
  const line1Parts = [
    p.legalName,
    [p.street, `${p.zip} ${p.city}`.trim()].filter(Boolean).join(", "),
    p.email ? `E-Mail: ${p.email}` : "",
    p.phone ? `Telefon: ${p.phone}` : "",
  ].filter(Boolean);
  const line2Parts = [
    p.website ? `Website: ${p.website}` : "",
    p.bankName ? `Bank: ${p.bankName}` : "",
    p.bankHolder ? `Kontoinhaber: ${p.bankHolder}` : "",
    p.bic ? `BIC/Swift: ${p.bic}` : "",
  ].filter(Boolean);
  const line3Parts = [
    p.iban ? `IBAN: ${p.iban}` : "",
    p.vatNo ? `MwSt Nr.: ${p.vatNo}` : "",
  ].filter(Boolean);
  return [line1Parts.join(" "), line2Parts.join(" "), line3Parts.join(" ")].filter(
    (l) => l.length > 0,
  );
}
