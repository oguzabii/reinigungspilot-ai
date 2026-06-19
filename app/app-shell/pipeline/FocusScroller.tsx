"use client";

import { useEffect } from "react";

/**
 * Scrolls to a target element on mount when the Pipeline is opened with a
 * `?focus=` deep link (e.g. from "Follow-up planen" or "In Pipeline übernehmen").
 * Purely a convenience — the focused card is also reordered to the top + ringed
 * server-side, so this works even without JS.
 */
export function FocusScroller({ targetId }: { targetId: string }) {
  useEffect(() => {
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [targetId]);
  return null;
}
