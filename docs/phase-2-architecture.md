# Phase 2 — Klarsa Core Architektur

> **Status: PLAN (v0.2.0).** Dieses Dokument beschreibt die Ziel-Architektur von
> Klarsa Core. Es wird in diesem Schritt **kein** Backend gebaut: keine echte
> Datenbank, kein Auth, keine bexio-API, kein E-Mail-Versand, kein Scraping,
> keine echten Kundendaten. Nur Doku, Typen und ein statisches Skelett.

## 1. Was ist Klarsa?

**Klarsa ist ein Multi-Tenant-SaaS** — das KI-Verkaufsbüro für Schweizer KMU
(Dienstleister, Handwerk, Reinigung, Umzug, Gartenbau, Hauswartung,
Maler/Gipser, lokale Service-Betriebe).

- **Multi-Tenant:** Viele Firmen (Tenants) nutzen dieselbe Anwendung und
  dieselbe Datenbank, sind aber strikt über eine `company_id` getrennt
  (Mandantentrennung, durchgesetzt per Supabase Row Level Security).
- **Branchenfähig:** Eine Branchenvorlage (`industry_presets`) seedet Services,
  Quellen, Follow-up-Takte und Ziel-Kundentypen. **Reinigung ist die erste
  Vorlage**, nicht das ganze Produkt.
- **Mensch behält die Kontrolle:** Die KI bereitet vor (Scoring, Offerttexte,
  Outreach-Entwürfe). Entscheiden und freigeben tun Menschen.

Die bisherige v0.1.x-Basis ist die **verkaufsfähige Frontend-Demo** mit lokalen
Seed-Daten (`lib/demo-data.ts`). Phase 2 baut darunter das **echte Core-System**.

## 2. Clean24 = erster Tenant / Live-Proof

**Clean24 Memis GmbH** ist der **erste Tenant innerhalb von Klarsa** und dient
als Live-Proof: das reale Reinigungsunternehmen, an dem Klarsa zuerst echt
betrieben wird (Branche Reinigung, Region Schweiz).

Die typisierte Erst-Konfiguration liegt in
[`lib/tenant-clean24.ts`](../lib/tenant-clean24.ts) — Firma, Marke, Branche,
Regionen, Leistungen und Lead-Quellen, **ohne Secrets und ohne echte Daten**.

### Wichtige Abgrenzung: alter Clean24 Lead Autopilot bleibt getrennt

Der bestehende, **eigenständige Clean24 Lead Autopilot** ist ein separates
System und **wird nicht angefasst und nicht eingebunden**. „Clean24 als Tenant
in Klarsa" und „Clean24 Lead Autopilot" sind zwei verschiedene Dinge:

| | Alter Clean24 Lead Autopilot | Clean24 als Klarsa-Tenant |
| --- | --- | --- |
| Was | Eigenständiges Bestandssystem | Tenant-Datensatz in Klarsa Core |
| Code | Separates Repo / Projekt | Dieses Repo (`reinigungspilot-ai`) |
| Status | Unangetastet | Neu, in Planung |
| Verbindung | **Keine** | — |

> Regel: Keine Migration, kein Import, keine API-Kopplung zum alten Clean24,
> solange der Nutzer das nicht ausdrücklich verlangt.

## 3. Module (Klarsa Core)

Dieselben Module wie in der Demo, künftig echt und paketbasiert
(`lib/packages.ts`, `lib/package-gates.ts`):

| Modul | Zweck | Verfügbar |
| --- | --- | --- |
| **Lead Hunter** | Kontrollierte B2B-Discovery → Prospects mit Quelle, Begründung und Freigabe | Ab Pro |
| **Lead Inbox** | Zentrale, bewertete Sammlung eingehender Anfragen | Alle Pakete |
| **Offer Engine** | Offerten mit Positionen, Preisen und PDF-Entwurf | Alle Pakete |
| **Follow-ups** | Getaktete 24h-/48h-/5-Tage-Sequenzen | Alle Pakete |
| **Jobs** | Gewonnene Aufträge planen, Teams/Termine organisieren | Ab Pro |
| **bexio Übergabe** | Saubere Übergabe an die Buchhaltung (Connect / Connect Plus) | Ab Pro |
| **Reports** | Wöchentlicher Chef-Report, monatlicher Strategie-Report | Ab Pro / Premium |

Datenfluss (vereinfacht):

```
Lead Hunter → Prospect → (Freigabe) → Lead → Lead Inbox → Score
   → Offer Engine → Offer → Follow-ups → Job → bexio Übergabe → Reports
```

Jede Stufe schreibt in eigene Tabellen (siehe
[`docs/data-model.md`](./data-model.md)) und erzeugt bei kritischen Aktionen
einen Eintrag in `audit_logs`.

## 4. Ziel-Technologie

| Schicht | Wahl (geplant) | Hinweis |
| --- | --- | --- |
| Frontend | Next.js 16 (App Router) | bereits vorhanden |
| Auth | Supabase Auth | E-Mail/Passwort + Rollen pro Tenant |
| Datenbank | Supabase Postgres | Mandantentrennung via RLS auf `company_id` |
| Storage | Supabase Storage (privat) | Signed URLs, Dateibeschränkungen |
| Buchhaltung | bexio API (später) | verschlüsselte Tokens, Handoff-Queue |
| KI | Claude API (später) | nur mit Human-Approval für riskante Aktionen |

## 5. Implementierungsphasen

Strikt nacheinander. **Keine echten Kundendaten** vor abgeschlossener Phase B.

- **v0.2.0 — Architektur & Plan (dieser Schritt):** Docs, Core-Typen
  (`lib/klarsa-core-types.ts`), Erst-Tenant-Config (`lib/tenant-clean24.ts`),
  statische `/workspace`-Foundation-Seite. Kein Backend.
- **v0.2.1 — Supabase-Schema-Fundament:** Tabellen + RLS-Policies + Soft-Delete
  + `audit_logs`, gemäss `docs/data-model.md` und `docs/security-architecture.md`.
  Migrationen, noch ohne UI-Anbindung und ohne echte Daten.
- **Phase A — Auth & Tenancy:** Login, Rollen (RBAC), `company_id`-Isolation,
  Einladungen, Member-Verwaltung. Erst danach darf eine echte Firma angelegt
  werden.
- **Phase B — Security & Backup:** Audit-Logs aktiv, Soft-Delete/Restore,
  Webhook-Secrets, Rate-Limiting, Input-Validation, privater Storage, Backups,
  PITR, täglicher Export, Restore-Test. **Gate für echte Kundendaten.**
- **Phase C — Module live:** Lead Inbox → Offer Engine → Follow-ups → Jobs,
  schrittweise mit echten (Tenant-)Daten von Clean24.
- **Phase D — Lead Hunter:** kontrollierte Discovery gemäss
  `docs/lead-hunter-engine.md` (freigegebene Quellen, Human-Approval).
- **Phase E — bexio Connect:** verschlüsselte Tokens, Handoff-Queue,
  Reconnect-Flow gemäss `docs/bexio-architecture.md`.
- **Phase F — KI & Reports:** Scoring/Texte/Content über die KI-API, Reports.
- **Phase G — Billing:** Stripe, Abo-Verwaltung, Limiten-Enforcement.

## 6. Harte Regel: „No Security = No Customer Data."

Kein echtes Kundenkonto, keine Firmendaten, kein bexio-Token, kein Datei-Upload
und keine echten Lead-/Offerten-/Auftragsdaten gehen live, **bevor** Auth, RLS,
Audit-Logs und die Backup-/Recovery-Architektur stehen und getestet sind.
Details: [`docs/security-architecture.md`](./security-architecture.md).

## Verwandte Dokumente

- [Datenmodell](./data-model.md)
- [Security-Architektur](./security-architecture.md)
- [Lead-Hunter-Engine](./lead-hunter-engine.md)
- [bexio-Architektur](./bexio-architecture.md)
