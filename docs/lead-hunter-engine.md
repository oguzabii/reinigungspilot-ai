# Klarsa Core — Lead-Hunter-Engine (Plan)

> **Status: PLAN (v0.2.0).** Konzept einer **kontrollierten** Discovery-Pipeline.
> In diesem Schritt wird nichts ausgeführt: kein Scraping, keine API-Aufrufe,
> kein Versand. Der Lead Hunter ist ab **Pro** vorgesehen (`limits.leadHunterProspects`).

## Grundprinzip

Der KI Lead Hunter **scrapt nicht unkontrolliert das Internet** und versendet
**keine** automatische Kaltakquise. Er ist eine kontrollierte Discovery- und
Qualifizierungs-Pipeline mit **menschlicher Freigabe** vor jedem ausgehenden
Kontakt. Jeder Kandidat trägt seine **Herkunft** (Quelle + Query) und eine
**Begründung**.

## Pipeline

```
Branchenvorlage → Zielregion → Ziel-Kundentyp → freigegebene Quelle
→ Query-Generierung → Normalisierung → Duplikatsprüfung → Anreicherung
→ Scoring → Quellen-Tracking → Begründung/Erklärung → Nachrichten-Entwurf
→ menschliche Freigabe → CRM-Pipeline
```

### Stufen im Detail

1. **Branchenvorlage** (`industry_presets`): definiert Ziel-Kundentypen,
   Services und Standard-Suchmuster (Reinigung = erste Vorlage).
2. **Zielregion:** Kanton/Stadt aus den Regionen der Firma (`regions_served`).
3. **Ziel-Kundentyp:** z. B. Immobilienverwaltung, Praxis, Büro, Umzugsfirma.
4. **Freigegebene Quelle:** **nur** vom Betreiber/Kunden freigegebene Provider
   (siehe unten). Keine beliebigen Webseiten.
5. **Query-Generierung:** deterministische, nachvollziehbare Suchanfrage aus
   Vorlage + Region + Kundentyp; die exakte Query wird gespeichert
   (`prospects.search_query`).
6. **Normalisierung:** Rohergebnisse → einheitliches Schema (Name, Adresse,
   Kategorie, Kontaktpfad).
7. **Duplikatsprüfung:** Abgleich gegen bestehende `prospects`/`leads` (z. B.
   Name + Region + Domain), um Dubletten zu vermeiden.
8. **Anreicherung:** optionale, regelkonforme Zusatzinfos (z. B. Kategorie,
   Grösseindikator) aus **derselben** freigegebenen Quelle.
9. **Scoring:** `score` + `confidence` aus `region_match`, `service_fit` und
   weiteren Signalen (analog `lead_scores`).
10. **Quellen-Tracking:** `source_type` + `search_query` werden zwingend
    gespeichert (Provenance/Compliance).
11. **Begründung/Erklärung:** menschenlesbares `reason`, **warum** der Kandidat
    passt.
12. **Nachrichten-Entwurf:** `suggested_message` — ein **Entwurf**, niemals
    automatisch gesendet.
13. **Menschliche Freigabe:** `approval_status` wechselt `pending → approved`
    (oder `rejected`) durch eine Person. Erst danach darf Kontakt erfolgen.
14. **CRM-Pipeline:** Bei Freigabe wird der Prospect zu einem `lead` promoted
    (`promoted_lead_id`) und läuft durch Inbox → Offer → Follow-up.

## Datenabbildung

| Pipeline | Tabelle / Feld |
| --- | --- |
| Kandidat | `prospects` |
| Quelle/Provenance | `prospects.source_type`, `prospects.search_query`, `lead_sources` |
| Bewertung | `prospects.score`, `prospects.confidence`, `lead_scores` |
| Erklärung | `prospects.reason` |
| Entwurf | `prospects.suggested_message` |
| Freigabe | `prospects.approval_status` (`pending|approved|rejected`) |
| Promotion | `prospects.promoted_lead_id` → `leads` |
| Nachweis | `audit_logs` (Freigabe, Promotion, Outreach) |

## Lead-Qualitätsfelder

- `source` / `source_type` — Quelle
- `search_query` — verwendete Suchanfrage
- `category` — Kategorie/Kundentyp
- `region_match` — Regions-Übereinstimmung
- `service_fit` — Service-Passung
- `score` / `confidence` — Bewertung und Konfidenz
- `reason` — Begründung, warum relevant
- `suggested_next_action` / `suggested_message` — Vorschlag, kein Auto-Versand
- `approval_status` — Freigabestatus

## Freigegebene Quellen (Kandidaten, noch nicht implementiert)

In Reihenfolge der voraussichtlichen Umsetzung:

1. **CSV / manueller Import** — Kunde bringt eigene Liste ein.
2. **Kundeneigene Lead-Listen** — bestehende Kontakte des Betriebs.
3. **Google Places / Maps API** — offizielle API, mit Quotas/AGB-konform.
4. **ZEFIX / Handelsregister-Validierung** — Existenz-/Firmenprüfung.
5. **Website-/Profil-Signale** — nur regelkonform, aus freigegebenen Quellen.

> Jede Quelle muss **explizit freigegeben** sein. Keine Quelle = kein Lauf.

## Compliance-Regeln

- **Kein** unkontrolliertes Scraping.
- **Keine** automatische Kaltakquise / kein Bulk-Spam.
- **Quelle muss gespeichert** werden (Provenance Pflicht).
- **Menschliche Freigabe** vor jeder ausgehenden Nachricht.
- **Opt-out / Abmeldung** wird respektiert und gespeichert (Suppression-Liste,
  später).
- Rate-Limiting und Quota-Beachtung pro Provider.
- Schweizer Datenschutz (revDSG) und Provider-AGB sind einzuhalten.

## Sicherheit

- Provider-API-Keys server-seitig, verschlüsselt, **nie** im Client/Repo, **nie**
  in Logs (siehe `docs/security-architecture.md`).
- Alle Discovery-Läufe und Freigaben landen in `audit_logs`.
- KI erzeugt nur Entwürfe; Versand ist an `approval_status = approved` gekoppelt.

## Verwandte Dokumente

- [Phase-2-Architektur](./phase-2-architecture.md)
- [Datenmodell](./data-model.md)
- [Security-Architektur](./security-architecture.md)
- [bexio-Architektur](./bexio-architecture.md)
