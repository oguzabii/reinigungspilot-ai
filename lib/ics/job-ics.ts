/**
 * Minimal, dependency-free iCalendar (.ics) builder for a single job
 * (SERVER-ONLY). Produces an RFC 5545 VCALENDAR with one VEVENT so the user can
 * import a scheduled job into their OWN calendar — there is NO calendar sync,
 * no Google/Outlook API, no network call. The user downloads the file and
 * imports it manually.
 *
 * Pure: the caller passes `stampIso` (now) and `startIso` (the schedule), so
 * this module never reads the clock — it stays deterministic and testable.
 */

import type { JobStatus } from "@/lib/database-types";

export interface JobIcsData {
  uid: string;
  stampIso: string; // DTSTAMP — when the file was produced (caller passes now)
  startIso: string; // DTSTART — the job's scheduled_for (must be set)
  title: string;
  description?: string | null;
  location?: string | null;
  status: JobStatus;
  /** Event duration in minutes (default 60). */
  durationMinutes?: number;
}

/** job_status → iCalendar VEVENT STATUS (TENTATIVE | CONFIRMED | CANCELLED). */
function icsStatus(status: JobStatus): string {
  switch (status) {
    case "planned":
      return "TENTATIVE";
    case "cancelled":
    case "archived":
      return "CANCELLED";
    default:
      return "CONFIRMED";
  }
}

/** Format an ISO timestamp as iCalendar UTC basic format: YYYYMMDDTHHMMSSZ. */
function toIcsUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

/** Escape text per RFC 5545 (backslash first, then ; , and newlines). */
function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold a content line to <=75 octets with CRLF + single space continuation. */
function foldLine(line: string): string {
  const bytesOf = (s: string) => Buffer.byteLength(s, "utf8");
  if (bytesOf(line) <= 75) return line;
  let out = "";
  let cur = "";
  for (const ch of line) {
    // +1 leaves room for the leading space on continuation lines.
    if (bytesOf(cur + ch) > 74) {
      out += (out ? "\r\n " : "") + cur;
      cur = ch;
    } else {
      cur += ch;
    }
  }
  out += (out ? "\r\n " : "") + cur;
  return out;
}

export function buildJobIcs(data: JobIcsData): string {
  const start = toIcsUtc(data.startIso);
  const startMs = new Date(data.startIso).getTime();
  const durMin = data.durationMinutes ?? 60;
  const end = Number.isNaN(startMs)
    ? start
    : toIcsUtc(new Date(startMs + durMin * 60_000).toISOString());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Klarsa//Klarsa Core//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(data.uid)}@klarsa`,
    `DTSTAMP:${toIcsUtc(data.stampIso)}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(data.title)}`,
    `STATUS:${icsStatus(data.status)}`,
  ];
  if (data.description) lines.push(`DESCRIPTION:${escapeIcs(data.description)}`);
  if (data.location) lines.push(`LOCATION:${escapeIcs(data.location)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  // RFC 5545 requires CRLF line breaks; fold long content lines.
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
