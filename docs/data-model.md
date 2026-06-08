# Klarsa Core — Datenmodell (Plan)

> **Status: PLAN (v0.2.0).** Tabellen-Entwurf für das künftige Supabase-Schema.
> Es existiert **noch keine** Datenbank. Umsetzung ab v0.2.1, mit RLS und nur
> nach `docs/security-architecture.md`. Typen-Gegenstück:
> [`lib/klarsa-core-types.ts`](../lib/klarsa-core-types.ts).

## Konventionen

Gelten für **alle** Tabellen, sofern nicht anders vermerkt:

- **Primärschlüssel:** `id uuid` (Default `gen_random_uuid()`).
- **Mandantentrennung:** Jede geschäftsbezogene Tabelle trägt
  `company_id uuid not null` mit FK → `companies(id)`. Supabase **RLS** filtert
  jede Query auf die `company_id`(s) des eingeloggten Nutzers. Ausnahmen:
  `user_profiles` (an die globale Auth-Identität gebunden) und
  `industry_presets` (globaler Katalog).
- **Audit-Zeitstempel:** `created_at timestamptz not null default now()`,
  `updated_at timestamptz not null default now()` (per Trigger gepflegt).
- **Soft-Delete:** Bei datenhaltenden, kundenbezogenen Tabellen
  `deleted_at timestamptz null`. `null` = aktiv. Standard-Views/Queries filtern
  `deleted_at is null`. Wiederherstellung durch Admin.
- **Audit-Trail:** Kritische Aktionen (create/update/delete/restore, Export,
  bexio-Handoff, Freigabe) schreiben zusätzlich nach `audit_logs`.
- **Indizes:** Mindestens auf `company_id` und auf häufige FKs/Statusfelder.
- **Namensgebung:** Tabellen `snake_case` Plural, Spalten `snake_case`.

`company_id`-Strategie kurz: **„Default Deny".** RLS-Policies erlauben Zeilen
nur, wenn `company_id` zu einer aktiven Mitgliedschaft des Nutzers gehört. Ohne
gültige Mitgliedschaft sieht ein Nutzer nichts.

---

## Identität & Tenant

### `companies`
- **Zweck:** Der Tenant. Wurzel der Isolation; alles andere hängt an `company_id`.
- **Schlüsselfelder:** `id`, `legal_name`, `brand_name`, `industry_preset_id`
  (FK → `industry_presets`), `tier` (`starter|pro|premium`), `regions_served text[]`,
  `status` (`trial|active|suspended`), `is_first_tenant boolean`.
- **company_id:** ist selbst der Tenant (kein eigenes `company_id`).
- **Soft-Delete/Audit:** `deleted_at`; Änderungen am Tier/Status auditiert.

### `company_members`
- **Zweck:** Verknüpft Nutzer mit Firmen inkl. Rolle (RBAC). Ein Nutzer kann zu
  mehreren Firmen gehören.
- **Schlüsselfelder:** `id`, `company_id`, `user_id` (FK → `user_profiles`),
  `role` (`owner|admin|team|viewer`), `status` (`invited|active|disabled`),
  `invited_at`, `joined_at`.
- **company_id:** ja. Unique `(company_id, user_id)`.
- **Soft-Delete/Audit:** kein Soft-Delete (Status `disabled` genügt);
  Rollenänderungen werden auditiert.

### `user_profiles`
- **Zweck:** Anwendungsprofil zur Supabase-Auth-Identität (Name, Sprache,
  Einstellungen). **Keine** Passwörter — die liegen in Supabase Auth.
- **Schlüsselfelder:** `id` (= Auth-User-UID), `display_name`, `email`, `locale`,
  `last_seen_at`.
- **company_id:** **nein** — global pro Person. Firmenzugehörigkeit ergibt sich
  aus `company_members`.
- **Soft-Delete/Audit:** Profil deaktivierbar; sicherheitsrelevante Änderungen
  auditiert.

---

## Konfiguration

### `industry_presets`
- **Zweck:** Branchenvorlagen (Reinigung, Umzug, …) mit Default-Services,
  -Quellen, -Follow-up-Takten und Ziel-Kundentypen. Globaler Katalog.
- **Schlüsselfelder:** `id`, `key` (`reinigung`), `label`, `tagline`,
  `default_services text[]`, `default_sources text[]`,
  `default_followup_cadence_hours int[]`, `target_customer_types text[]`.
- **company_id:** **nein** (global). Eine Firma referenziert ihre Vorlage über
  `companies.industry_preset_id`.
- **Soft-Delete/Audit:** Versionierung statt Löschen (Presets bleiben referenzierbar).

### `company_settings`
- **Zweck:** Pro Firma: Einstellungen wie Standardsprache, MwSt.-Satz,
  Follow-up-Takte, Absenderangaben, Feature-Flags.
- **Schlüsselfelder:** `id`, `company_id`, `default_vat_rate_pct`,
  `followup_cadence_hours int[]`, `sender_name`, `sender_email`, `settings jsonb`.
- **company_id:** ja. Unique pro `company_id` (1:1).
- **Soft-Delete/Audit:** kein Soft-Delete; Änderungen auditiert.

### `company_services`
- **Zweck:** Die Leistungen, die eine Firma anbietet (z. B. Umzugsreinigung).
  Limit pro Paket (`limits.services`).
- **Schlüsselfelder:** `id`, `company_id`, `key`, `label`, `description`,
  `price_label`, `active boolean`, `sort_order`.
- **company_id:** ja.
- **Soft-Delete/Audit:** `deleted_at`; Änderungen auditiert.

### `pricing_models`
- **Zweck:** Preismodelle/Kalkulationsschemata pro Firma (z. B. pro m²,
  Pauschale, Stundensatz). Limit pro Paket (`limits.pricingModels`).
- **Schlüsselfelder:** `id`, `company_id`, `name`, `unit`, `base_rate numeric`,
  `params jsonb`, `active boolean`.
- **company_id:** ja.
- **Soft-Delete/Audit:** `deleted_at`; Änderungen auditiert.

---

## Leads & Prospects

### `leads`
- **Zweck:** Eingehende Anfragen (Lead Inbox).
- **Schlüsselfelder:** `id`, `company_id`, `company` (Name des Anfragenden),
  `contact_name`, `email`, `phone`, `service_interest`, `region`,
  `status` (`new|qualified|offer|follow_up|won|lost`),
  `source_id` (FK → `lead_sources`), `source_type`, `est_value_chf`,
  `prospect_id` (FK → `prospects`, falls aus Discovery promoted).
- **company_id:** ja. Index auf `(company_id, status)`.
- **Soft-Delete/Audit:** `deleted_at`; Statuswechsel auditiert + in
  `lead_activities`.

### `prospects`
- **Zweck:** Lead-Hunter-Kandidaten **vor** der Freigabe. Mit Provenance
  (Quelle, Query, Begründung) und Approval-Gate.
- **Schlüsselfelder:** `id`, `company_id`, `name`, `category`, `region`,
  `source_type`, `search_query`, `score`, `confidence`, `reason`,
  `suggested_message`, `approval_status` (`pending|approved|rejected`),
  `est_value_chf`, `promoted_lead_id` (FK → `leads`).
- **company_id:** ja.
- **Soft-Delete/Audit:** `deleted_at`; Freigabe/Ablehnung und Promotion auditiert.

### `lead_sources`
- **Zweck:** Pro Firma konfigurierte Quellen (Website, Google, Empfehlung,
  Verwaltung, Partner, manuell, …) mapped auf `source_type`.
- **Schlüsselfelder:** `id`, `company_id`, `type`, `label`, `enabled boolean`,
  `notes`.
- **company_id:** ja.
- **Soft-Delete/Audit:** kein Soft-Delete (`enabled=false` genügt); Änderungen auditiert.

### `lead_scores`
- **Zweck:** Bewertungs-Historie je Lead — **append-only**, damit die
  Score-Entwicklung nachvollziehbar ist.
- **Schlüsselfelder:** `id`, `company_id`, `lead_id` (FK → `leads`), `score`,
  `confidence`, `region_match boolean`, `service_fit boolean`, `reasons text[]`,
  `model_version`.
- **company_id:** ja. Index auf `(company_id, lead_id, created_at)`.
- **Soft-Delete/Audit:** kein Soft-Delete (append-only); kein Update.

### `lead_activities`
- **Zweck:** Aktivitäts-Timeline je Lead (Statuswechsel, Notiz, E-Mail,
  Anruf) — **append-only**.
- **Schlüsselfelder:** `id`, `company_id`, `lead_id`, `type`
  (`status_change|note|email_out|call|…`), `actor_user_id`, `summary`,
  `metadata jsonb`.
- **company_id:** ja.
- **Soft-Delete/Audit:** append-only; ist selbst Teil der Nachvollziehbarkeit.

---

## Offerten

### `offers`
- **Zweck:** Offerten zu einem Lead.
- **Schlüsselfelder:** `id`, `company_id`, `lead_id` (FK → `leads`),
  `reference` (`OF-2026-0142`), `status` (`draft|sent|accepted|declined|expired`),
  `total_net_chf`, `vat_rate_pct`, `total_gross_chf`, `valid_until`.
- **company_id:** ja. Unique `(company_id, reference)`.
- **Soft-Delete/Audit:** `deleted_at`; Versand/Annahme auditiert.

### `offer_items`
- **Zweck:** Positionen einer Offerte.
- **Schlüsselfelder:** `id`, `company_id`, `offer_id` (FK → `offers`), `label`,
  `detail`, `amount_chf`, `sort_order`.
- **company_id:** ja (redundant zur Offerte, vereinfacht RLS).
- **Soft-Delete/Audit:** Hart gelöscht beim Bearbeiten des Entwurfs (Offerte
  selbst soft-deletable).

---

## Follow-ups & Jobs

### `followup_tasks`
- **Zweck:** Geplante Follow-up-Schritte (24h/48h/5-Tage) je Lead/Offerte.
- **Schlüsselfelder:** `id`, `company_id`, `lead_id`, `offer_id` (nullable),
  `stage` (`24h|48h|5d_final`), `due_at`, `channel`,
  `status` (`planned|due|overdue|done|skipped`), `note`.
- **company_id:** ja. Index auf `(company_id, due_at, status)`.
- **Soft-Delete/Audit:** kein Soft-Delete (`skipped` genügt); Ausführung auditiert.

### `jobs`
- **Zweck:** Gewonnene Aufträge zur Planung/Ausführung.
- **Schlüsselfelder:** `id`, `company_id`, `lead_id` (nullable),
  `offer_id` (nullable), `title`, `location`, `scheduled_for`, `team`,
  `status` (`planned|confirmed|in_progress|done|cancelled`), `value_chf`.
- **company_id:** ja.
- **Soft-Delete/Audit:** `deleted_at`; Statuswechsel auditiert.

### `job_notes`
- **Zweck:** Notizen/Übergabeinfos zu einem Job.
- **Schlüsselfelder:** `id`, `company_id`, `job_id` (FK → `jobs`),
  `author_user_id`, `body`.
- **company_id:** ja.
- **Soft-Delete/Audit:** `deleted_at` optional; Erstellung auditiert.

---

## bexio

### `bexio_connections`
- **Zweck:** Verbindungs-**Metadaten** je Firma (Status, Level, letzte Sync).
  **Keine** Tokens in dieser Tabelle.
- **Schlüsselfelder:** `id`, `company_id`,
  `status` (`disconnected|connected|error|reconnect_required`),
  `level` (`connect|plus`), `connected_at`, `last_sync_at`.
- **company_id:** ja. Unique pro `company_id`.
- **Token-Hinweis:** Access-/Refresh-Tokens liegen **verschlüsselt** in einem
  separaten, restriktiven Store (z. B. Vault/`vault.secrets`), referenziert über
  eine `secret_ref` — **nie** im Klartext, **nie** in Logs. Siehe
  `docs/bexio-architecture.md`.
- **Soft-Delete/Audit:** kein Soft-Delete; Connect/Disconnect/Reconnect auditiert.

### `bexio_handoffs`
- **Zweck:** Warteschlange/Protokoll der Übergaben gewonnener Jobs an bexio.
- **Schlüsselfelder:** `id`, `company_id`, `job_id` (FK → `jobs`),
  `connection_id` (FK → `bexio_connections`),
  `status` (`queued|sent|failed|reconciled`), `net_chf`, `vat_rate_pct`,
  `gross_chf`, `invoice_draft_ref`, `queued_at`, `sent_at`.
- **company_id:** ja. Index auf `(company_id, status)`.
- **Soft-Delete/Audit:** kein Soft-Delete; jeder Übergabe-Versuch auditiert
  (ohne Token/PII im Log).

---

## Audit

### `audit_logs`
- **Zweck:** Zentrales, **append-only** Audit für sicherheitsrelevante Aktionen.
- **Schlüsselfelder:** `id`, `company_id`, `actor_user_id`,
  `action` (`lead.create|offer.send|bexio.handoff|data.export|record.restore|…`),
  `entity_type`, `entity_id`, `metadata jsonb`, `ip_hash`, `created_at`.
- **company_id:** ja (nullable nur für plattformweite Systemereignisse).
- **Soft-Delete/Audit:** **niemals** löschbar/änderbar (Insert-only; per RLS nur
  Insert + Read im eigenen Tenant). Keine Secrets/Tokens, keine rohe IP.

---

## Beziehungsübersicht (vereinfacht)

```
companies 1───* company_members *───1 user_profiles
companies 1───1 company_settings
companies 1───* company_services
companies 1───* pricing_models
companies 1───1 industry_presets (Referenz, Katalog global)

companies 1───* lead_sources
companies 1───* prospects ──promote──> leads
companies 1───* leads 1───* lead_scores
                 leads 1───* lead_activities
                 leads 1───* offers 1───* offer_items
                 leads 1───* followup_tasks
                 leads/offers ──> jobs 1───* job_notes
companies 1───1 bexio_connections 1───* bexio_handoffs (je Job)
companies 1───* audit_logs
```

## Verwandte Dokumente

- [Phase-2-Architektur](./phase-2-architecture.md)
- [Security-Architektur](./security-architecture.md)
- [Lead-Hunter-Engine](./lead-hunter-engine.md)
- [bexio-Architektur](./bexio-architecture.md)
