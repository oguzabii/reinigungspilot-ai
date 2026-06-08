# Klarsa Core — bexio-Architektur (Plan)

> **Status: PLAN (v0.2.0).** Konzept der künftigen bexio-Anbindung. In diesem
> Schritt gibt es **keine** echte bexio-API, **keine** Tokens, **keine**
> Übergaben. Die bexio-Übergabe in der Demo (`lib/demo-data.ts`,
> `DEMO_BEXIO_HANDOFF`) ist reine Visualisierung.

## Grundsatz: Klarsa ersetzt bexio nicht

Klarsa arbeitet **vor** der Buchhaltung: Anfragen sammeln, bewerten, Offerten
erstellen, nachfassen, Aufträge organisieren. Gewonnene Aufträge werden **sauber
an bexio übergeben** — Klarsa ist kein Buchhaltungs- oder ERP-Ersatz.

## Paket-Zuordnung

| Paket | bexio-Funktion | Feld (`lib/packages.ts`) |
| --- | --- | --- |
| Starter | — (keine Übergabe) | `bexio: "none"` |
| **Pro** | **bexio Connect** — Übergabe gewonnener Aufträge inkl. Rechnungsentwurf | `bexio: "connect"` |
| **Premium** | **bexio Connect Plus** — zusätzliche Felder + automatischer Abgleich | `bexio: "plus"` |

## Übergabe-Fluss (geplant)

```
Job gewonnen → Handoff erzeugt (queued) → Mapping (Kunde, Leistung, Preis, MwSt.)
→ bexio API (Kontakt + Rechnungsentwurf) → Status sent → (Connect Plus) Reconcile
```

- Übergeben werden: Kundendaten, Leistung, Netto/MwSt./Brutto, Referenz.
- Ergebnis in bexio: **Rechnungsentwurf** (kein automatischer Versand).
- Abbildung: `bexio_handoffs` (Queue/Protokoll), Status
  `queued|sent|failed|reconciled`.

## Zukünftige Bausteine

### Verschlüsselte Tokens
- OAuth-2-Tokens (Access/Refresh) **verschlüsselt** in separatem Secret-Store
  (Vault/KMS), referenziert per `secret_ref` aus `bexio_connections`.
- **Nie** im Klartext in App-Tabellen, **nie** im Client, **nie** in Logs.

### Sync-Logs
- Jeder API-Aufruf/Übergabeversuch wird protokolliert (Zeit, Status, Fehlercode)
  — **ohne** Tokens/PII. Sicherheits-/Audit-Relevantes zusätzlich in `audit_logs`.

### Handoff-Queue
- `bexio_handoffs` als Warteschlange: idempotente Verarbeitung, Retry mit
  Backoff bei `failed`, klare Endzustände. Verhindert Doppel-Übergaben.

### Reconnect-Flow
- Läuft ein Token ab oder wird der Zugriff entzogen → `bexio_connections.status =
  reconnect_required`. Die App fordert eine erneute Autorisierung an; bis dahin
  bleiben Handoffs `queued` (kein Datenverlust).

### Audit-Logs
- Connect/Disconnect/Reconnect, jede Übergabe und jeder Tokenzugriff werden
  auditiert (siehe `docs/security-architecture.md`).

## Sicherheitsregeln (Zusammenfassung)

- Verschlüsselte Tokens, **kein** Token-Logging, server-seitiger Zugriff nur
  minimal-privilegiert.
- Webhooks von bexio (falls genutzt) per Signatur verifizieren.
- Rate-Limiting/Quota-Beachtung gegenüber der bexio-API.
- `company_id`-Isolation: eine Firma sieht ausschliesslich ihre eigene
  Verbindung und ihre eigenen Handoffs.

## Heute (v0.2.0) ausdrücklich NICHT enthalten

- Keine bexio-API-Aufrufe, kein OAuth, keine Tokens.
- Keine echte Rechnungserstellung.
- Keine Hintergrund-Jobs/Webhooks.
- Nur Demo-Visualisierung + dieser Architektur-Plan.

## Verwandte Dokumente

- [Phase-2-Architektur](./phase-2-architecture.md)
- [Datenmodell](./data-model.md)
- [Security-Architektur](./security-architecture.md)
- [Lead-Hunter-Engine](./lead-hunter-engine.md)
