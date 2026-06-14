/**
 * Automatic discovery/signal cron — PREPARED, DISABLED BY DEFAULT (v0.5.3).
 *
 * This documents the safe shape of a future scheduled run. It is:
 *   - **Invisible** unless `CRON_SECRET` is set (returns 404 otherwise).
 *   - **Secret-protected** (`Authorization: Bearer <CRON_SECRET>`).
 *   - **Disabled by design**: it performs NO discovery and NO writes.
 *
 * Why no writes: autonomous, session-less runs would need a server identity that
 * **bypasses RLS** (service-role), which is BANNED in app routes. So scheduled
 * tenant writes are intentionally NOT implemented here — discovery/signal runs
 * stay owner-initiated in the app (authenticated session + RLS). A real
 * scheduled run needs a separately-reviewed, explicitly-approved server-identity
 * pattern (and would still: cap runs/results, audit every run, and NEVER trigger
 * any outreach).
 *
 * There is intentionally NO `vercel.json` cron entry, so nothing is scheduled.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;

  // Not configured → the endpoint does not exist.
  if (!secret || secret.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  // Configured → require the shared secret (never logged).
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Authorised, but autonomous runs are disabled by design (see header).
  return Response.json(
    {
      status: "disabled",
      message:
        "Autonome Discovery/Signal-Läufe sind standardmässig deaktiviert. Läufe werden vom Inhaber in der App ausgelöst (Session/RLS). Autonome Schreibvorgänge benötigen ein gesondert freizugebendes, geprüftes Server-Identity-Muster (kein Service-Role in App-Routen).",
    },
    { status: 200 },
  );
}
