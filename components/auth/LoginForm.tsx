"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/env";

type FormState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string; detail?: string };

/**
 * Login form for the Klarsa app shell. Functional against a configured Supabase
 * project; when env is absent it shows a clear notice instead of failing.
 *
 * On success it navigates to `/app-shell`, which is server-protected (it
 * re-checks the session and redirects back here if absent).
 *
 * TODO(v0.2.8): add password reset / magic-link options.
 */
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<FormState>({ kind: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      setState({
        kind: "error",
        message:
          "Supabase ist in dieser Umgebung nicht konfiguriert. Login wird erst mit Staging-Zugang aktiv.",
      });
      return;
    }

    setState({ kind: "loading" });
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setState({
          kind: "error",
          message:
            "Login fehlgeschlagen. Prüfen Sie E-Mail, Passwort und ob der Testbenutzer in Supabase bestätigt ist.",
          detail: error.message,
        });
        return;
      }
      // /app-shell is server-protected; it re-checks the session there.
      window.location.assign("/app-shell");
    } catch {
      setState({
        kind: "error",
        message: "Login derzeit nicht verfügbar (kein Staging-Zugang).",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-navy-900"
        >
          E-Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-navy-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="name@firma.ch"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-navy-900"
        >
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-navy-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="••••••••"
        />
      </div>

      {state.kind === "error" && (
        <div
          role="alert"
          className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-200"
        >
          <p className="font-medium">{state.message}</p>
          {state.detail && (
            <p className="mt-1 text-xs text-amber-700/90">{state.detail}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={state.kind === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" strokeWidth={2.2} />
        {state.kind === "loading" ? "Anmelden…" : "Anmelden"}
      </button>

      <p className="text-center text-xs text-slate-400">
        Foundation v0.2.6 – noch keine echten Kundendaten. Zugang nur für Staging.
      </p>
    </form>
  );
}
