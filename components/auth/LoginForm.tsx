"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/env";

type FormState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string };

/**
 * Login form skeleton. Functional against a configured Supabase project, but
 * intentionally minimal: this is the v0.2.6 foundation. When Supabase env is
 * absent it shows a clear notice instead of failing.
 *
 * TODO(v0.2.7): wire success to a protected `/app-shell` with a real session
 * check + redirect, and add password reset / magic-link options.
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
        setState({ kind: "error", message: error.message });
        return;
      }
      // TODO(v0.2.7): replace with a verified redirect to the protected shell.
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
        <p
          role="alert"
          className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-200"
        >
          {state.message}
        </p>
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
