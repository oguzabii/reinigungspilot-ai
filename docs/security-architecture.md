# Klarsa Core — Security-Architektur (Plan)

> **Status: PLAN (v0.2.0).** Anforderungen und Zielbild. In diesem Schritt wird
> **nichts** davon scharf geschaltet: kein Auth, keine echten Tokens, keine
> echten Daten. Dieses Dokument ist das Gate für Phase B.

## Harte Regel: „No Security = No Customer Data."

Kein echtes Kundenkonto, keine Firmendaten, kein bexio-Token, kein Datei-Upload
und keine echten Lead-/Offerten-/Auftragsdaten gehen live, **bevor** die unten
beschriebenen Kontrollen umgesetzt **und getestet** sind. Diese Regel hat
Vorrang vor jedem Feature-Wunsch.

## 1. Authentifizierung (Auth)

- **Supabase Auth** (E-Mail/Passwort; später optional SSO/Magic-Link).
- Sessions als kurzlebige JWTs + Refresh-Token; sichere, `HttpOnly`-Cookies.
- Passwort-Policy, E-Mail-Verifikation, Passwort-Reset über Supabase.
- **MFA/2FA** für `owner`/`admin` empfohlen, sobald verfügbar.
- Kein Zugriff ohne gültige Session — alle App-Routen und API-Routen sind
  standardmässig geschützt (Default Deny).

## 2. Rollen & Berechtigungen (RBAC)

Rollen pro Tenant im Enum `member_role` (`company_members.role`):

| Rolle | Schreibgrenzen (Lesen = jedes aktive Mitglied) |
| --- | --- |
| `owner` | Voll: Firma, Mitglieder, Einstellungen, bexio, Export/Restore – plus alle operativen Daten |
| `admin` | Wie owner im Tagesgeschäft inkl. Mitglieder-/Einstellungsverwaltung |
| `sales` | Leads, Prospects, Offerten, Offertpositionen, Follow-ups; Lead-Scores/-Aktivitäten (append) |
| `ops` | Jobs, Job-Notizen, Follow-ups |
| `readonly` | **Nur lesen** – keinerlei Schreibzugriff |
| `superadmin` | Support: **firmenübergreifender Lesezugriff**, **kein** Schreibzugriff |

### Rollenbasierte Schreibgrenzen (durchgesetzt per RLS, v0.2.3)

- **Lesen** = jedes aktive Mitglied der Firma (oder Superadmin). **Schreiben**
  hängt von der Rolle ab – durchgesetzt **server-seitig per RLS**, nicht nur im UI.
- Durchsetzung über SECURITY-DEFINER-Helfer in der Migration: `member_role_for`,
  `can_read_company`, `can_manage_company`, `can_write_sales`, `can_write_ops`,
  `can_write_settings`, `can_superadmin`.
- Pro Tabelle gibt es **getrennte Policies je Befehl** (SELECT/INSERT/UPDATE/
  DELETE), damit auch DELETE über das **Schreib**prädikat läuft (nicht über das
  Leseprädikat). `readonly` hat dadurch ausschliesslich SELECT.
- **Schreibdomänen:** `sales` → Leads/Prospects/Offerten/Follow-ups; `ops` →
  Jobs/Job-Notizen/Follow-ups; `owner`/`admin` → zusätzlich Einstellungen,
  Services, Preise, Lead-Quellen, Mitglieder, Firma und bexio. `superadmin`
  schreibt nie (Support = read-only). Vollständige Matrix und Tests:
  [`rls-test-plan.md`](./rls-test-plan.md).
- Sensible Aktionen (Export, Restore, bexio Connect, Token-Zugriff, Löschen)
  sind auf `owner`/`admin` beschränkt und werden auditiert.

## 3. Mandantentrennung über `company_id`

- Jede geschäftsbezogene Tabelle trägt `company_id` (siehe
  [`docs/data-model.md`](./data-model.md)).
- **Jede** Query ist implizit auf die `company_id`(s) des Nutzers gefiltert.
- Tenant-Zugehörigkeit kommt ausschliesslich aus `company_members` (aktiver
  Status). Cross-Tenant-Zugriff ist strukturell unmöglich, nicht nur „verboten".

## 4. Supabase Row Level Security (RLS)

- **RLS ist auf jeder Tabelle aktiviert** (`enable row level security`).
- **Default Deny:** ohne passende Policy keine Zeile.
- Policy-Muster (konzeptuell):

  ```sql
  -- Lesen: jedes aktive Mitglied (oder Superadmin) der Firma
  create policy leads_select on public.leads for select
    using (public.can_read_company(company_id));

  -- Schreiben: nur Schreibrollen (owner/admin/sales) – readonly ausgeschlossen.
  -- Getrennte Policies je Befehl, damit auch DELETE das Schreibprädikat nutzt.
  create policy leads_insert on public.leads for insert
    with check (public.can_write_sales(company_id));
  create policy leads_update on public.leads for update
    using (public.can_write_sales(company_id))
    with check (public.can_write_sales(company_id));
  create policy leads_delete on public.leads for delete
    using (public.can_write_sales(company_id));
  ```

- `audit_logs`: nur `insert` + `select` im eigenen Tenant, **kein** `update`/
  `delete` (auch nicht für `owner`).
- Service-Role-Key wird **nur** server-seitig (Edge/Server) genutzt, nie im
  Client.

## 5. Audit-Logs

- Zentrale, **append-only** Tabelle `audit_logs`.
- Erfasst: Login-relevante Events, create/update/**delete/restore**, Export,
  bexio-Handoff/-Connect, Freigaben (Approvals), Rollenänderungen.
- Inhalt: `actor_user_id`, `action`, `entity_type`, `entity_id`, `metadata`,
  `ip_hash`, `created_at`. **Keine** Secrets/Tokens, **keine** rohe IP (nur Hash).
- Unveränderlich; Aufbewahrung gemäss Datenschutz-Vorgaben.

## 6. Soft-Delete & Restore

- Kundenbezogene Tabellen haben `deleted_at` (siehe Konventionen im Datenmodell).
- „Löschen" setzt `deleted_at` (logisch); Standard-Queries blenden es aus.
- **Restore** durch `owner`/`admin`; jede Lösch-/Restore-Aktion wird auditiert.
- Hartes Löschen nur über kontrollierten Prozess (z. B. DSGVO/Datenschutz-
  Anfrage), dokumentiert und auditiert.

## 7. Webhook-Secrets

- Eingehende Webhooks (z. B. Posteingang, bexio-Events, Stripe) werden über
  **Signaturprüfung** verifiziert (HMAC mit geheimem Schlüssel, Timestamp gegen
  Replay).
- Secrets liegen in Server-Umgebungsvariablen / Secret-Store, **nie** im Repo,
  **nie** im Client-Bundle.
- Ungültige Signatur → sofortiger Reject, auditiert.

## 8. Rate-Limiting

- Pro IP **und** pro Tenant/User auf allen schreibenden und teuren API-Routen
  (Login, Outreach, Export, KI-Aufrufe).
- Sinnvolle Limits + exponentielles Backoff; 429 bei Überschreitung.
- Schutz vor Brute-Force (Login) und Missbrauch (Outreach/KI-Kosten).

## 9. Input-Validation

- **Server-seitige** Schema-Validierung jeder Eingabe (z. B. Zod) an der
  API-Grenze — Client-Validierung ist nur UX.
- Whitelisting statt Blacklisting; strikte Typen/Längen/Formate.
- Ausgabe-Encoding gegen XSS; parametrische Queries gegen Injection (Supabase
  Client / Prepared Statements).
- Security-Header / CSP am Edge (kein Inline-Script ohne Nonce).

## 10. Privater Storage & Datei-Uploads

- **Privater** Supabase-Storage-Bucket; Zugriff nur über **Signed URLs** mit
  kurzer Gültigkeit.
- **Dateibeschränkungen:** erlaubte MIME-Typen (z. B. PDF/JPG/PNG), maximale
  Dateigrösse, Endungs-/Magic-Byte-Prüfung server-seitig.
- Pfade pro Tenant (`{company_id}/…`); RLS/Policies auf Storage-Objekte.

### Malware-/Viren-Scan-Strategie

- Upload landet zuerst in **Quarantäne** (separater Bucket/Status `pending`).
- Asynchroner Scan (z. B. ClamAV/Drittanbieter-Scan-Service) **vor** Freigabe.
- Erst nach „clean" wird die Datei nutzbar; „infected" → blockiert + auditiert.
- Keine Auslieferung ungescannter Dateien über Signed URLs.

## 11. Verschlüsselte bexio-Tokens & kein Token-Logging

- OAuth-Tokens werden **verschlüsselt** gespeichert (Vault/`vault.secrets` bzw.
  KMS-gestützte Verschlüsselung), referenziert über `secret_ref` — **nie** im
  Klartext in Anwendungstabellen.
- **Kein Logging von Secrets/Tokens** — weder in App-Logs, Audit-Logs noch in
  Fehler-/Stacktraces. Log-Redaction für sensible Felder.
- Zugriff auf Tokens nur server-seitig, minimal-privilegiert, auditiert.
- Details: [`docs/bexio-architecture.md`](./bexio-architecture.md).

## 12. Backups, PITR & täglicher Export

- **Supabase-Datenbank-Backups** aktiviert.
- **Point-in-Time-Recovery (PITR)** für die Produktion.
- **Täglicher externer Export** (ausserhalb von Supabase) der kritischen Daten.
- **Storage-Backup** für hochgeladene Dateien.
- **Dokumentierte und getestete Restore-Prozedur** (Restore-Test, nicht nur
  „Backup existiert").
- Rollback von Code/Deployment über Vercel.

## 13. KI-Sicherheit (Human-in-the-Loop)

- KI bereitet vor (Scoring, Texte, Outreach-Entwürfe), **sendet/handelt aber
  nicht autonom** bei riskanten Aktionen.
- Ausgehende Nachrichten und externe Aktionen benötigen **menschliche Freigabe**
  (`approval_status = approved`), siehe `docs/lead-hunter-engine.md`.
- KI-Eingaben/-Ausgaben werden behandelt wie Nutzereingaben (Validation,
  Rate-Limiting, kein Token-Leak).

## Definition of Done (Phase-B-Gate)

Echte Kundendaten erst, wenn **alle** Punkte erfüllt und getestet sind:

- [ ] Auth + Session-Handling produktiv
- [ ] RBAC server-seitig erzwungen
- [ ] RLS auf allen Tabellen, Default Deny, Cross-Tenant-Test bestanden
- [ ] `audit_logs` aktiv (append-only)
- [ ] Soft-Delete/Restore inkl. Audit
- [ ] Webhook-Signaturprüfung
- [ ] Rate-Limiting auf kritischen Routen
- [ ] Server-seitige Input-Validation + CSP
- [ ] Privater Storage, Signed URLs, Dateibeschränkungen, Malware-Scan
- [ ] bexio-Tokens verschlüsselt, kein Token-Logging
- [ ] Backups + PITR + täglicher Export + **bestandener Restore-Test**

## Verwandte Dokumente

- [Phase-2-Architektur](./phase-2-architecture.md)
- [Datenmodell](./data-model.md)
- [Lead-Hunter-Engine](./lead-hunter-engine.md)
- [bexio-Architektur](./bexio-architecture.md)
