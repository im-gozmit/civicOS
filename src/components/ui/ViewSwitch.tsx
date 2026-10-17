"use client";

import { useSyncExternalStore } from "react";
import { ImageIcon, ImageOff } from "lucide-react";

const KEY = "sudhaar-view";
const EVENT = "sudhaar-view-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}
const isClassic = () => document.documentElement.dataset.view === "classic";

/**
 * Navbar button that switches the home page between the Prayagraj photo look and the classic plain look.
 * The look is a data-view attribute on <html>; styles in globals.css react to it, and the choice is
 * remembered in localStorage.
 */
export function ViewSwitch() {
  // Read from <html> itself (set before first paint by the inline script), so there is one source of truth.
  const classic = useSyncExternalStore(subscribe, isClassic, () => false);

  function toggle() {
    const next = !classic;
    if (next) document.documentElement.dataset.view = "classic";
    else delete document.documentElement.dataset.view;
    window.dispatchEvent(new Event(EVENT));
    try {
      localStorage.setItem(KEY, next ? "classic" : "prayagraj");
    } catch {
      // Private browsing: the switch still works for this visit.
    }
  }

  const Icon = classic ? ImageIcon : ImageOff;
  const label = classic ? "Show the Prayagraj photo" : "Switch to the classic look";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={classic}
      aria-label={label}
      title={label}
      className="view-switch inline-flex h-9 items-center gap-1.5 rounded-lg border border-current/40 px-2.5 text-sm font-semibold transition hover:bg-white/15"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden lg:inline">{classic ? "Prayagraj view" : "Classic view"}</span>
    </button>
  );
}
