/**
 * Shared Tailwind class constants for the Lead-Inbox forms
 * (NewLeadForm, NewFollowupForm, LeadStatusForm). Pure constants — safe to
 * import from both client and server components.
 */

export const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-navy-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export const labelClass = "block text-xs font-medium text-slate-600";

export const submitClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60";

export const errorBoxClass =
  "rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-200";

export const successBoxClass =
  "rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200";
