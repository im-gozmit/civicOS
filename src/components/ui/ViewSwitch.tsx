"use client";

import { useSyncExternalStore } from "react";
import { PanelTop, Sunset } from "lucide-react";

const KEY = "sudhaar-view";
const EVENT = "sudhaar-view-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}
const isClassic = () => document.documentElement.dataset.view === "classic";

/**
 * Two-position switch in the navbar: "Prayagraj" (sunset photo hero) or "Classic" (plain hero).
 * The look is a data-view attribute on <html>; styles in globals.css react to it, and the choice is
 * remembered in localStorage.
 */
export function ViewSwitch() {
  // Read from <html> itself (set before first paint by the inline script), so there is one source of truth.
  const classic = useSyncExternalStore(subscribe, isClassic, () => false);

  function choose(next: boolean) {
    if (next === classic) return;
    if (next) document.documentElement.dataset.view = "classic";
    else delete document.documentElement.dataset.view;
    window.dispatchEvent(new Event(EVENT));
    try {
      localStorage.setItem(KEY, next ? "classic" : "prayagraj");
    } catch {
      // Private browsing: the switch still works for this visit.
    }
  }

  const seg = "relative z-10 inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-2.5 text-xs font-bold uppercase tracking-wider transition-colors duration-300 sm:px-3";
  return (
    <div
      role="group"
      aria-label="Page look"
      className="view-switch relative grid grid-cols-2 rounded-full border-2 border-slate-900 bg-[var(--paper)] p-0.5 shadow-[2px_2px_0_0_var(--ink)]"
    >
      {/* The sliding thumb sits under the active option. */}
      <span
        aria-hidden
        className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-slate-900 transition-transform duration-300 ease-[cubic-bezier(.4,1.4,.5,1)] ${classic ? "translate-x-full" : ""}`}
      />
      <button type="button" onClick={() => choose(false)} aria-pressed={!classic} title="Show the Prayagraj sunset photo" className={`${seg} ${classic ? "text-slate-600 hover:text-slate-900" : "text-white"}`}>
        <Sunset className="h-4 w-4" />
        <span className="hidden lg:inline">Prayagraj</span>
        <span className="sr-only lg:hidden">Prayagraj</span>
      </button>
      <button type="button" onClick={() => choose(true)} aria-pressed={classic} title="Show the classic plain look" className={`${seg} ${classic ? "text-white" : "text-slate-600 hover:text-slate-900"}`}>
        <PanelTop className="h-4 w-4" />
        <span className="hidden lg:inline">Classic</span>
        <span className="sr-only lg:hidden">Classic</span>
      </button>
    </div>
  );
}
