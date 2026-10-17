"use client";

import { useSyncExternalStore } from "react";
import { ArrowUp, Clock } from "lucide-react";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 10_000);
  return () => clearInterval(id);
}
const now = () => new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true });

/** The current time in Prayagraj. Empty on the server, so the page never shows a stale time. */
export function PrayagrajClock() {
  const time = useSyncExternalStore(subscribe, now, () => "");
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200">
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <Clock className="h-3.5 w-3.5 text-orange-300" aria-hidden />
      <span>Prayagraj</span>
      <span className="tabular-nums text-white" suppressHydrationWarning>
        {time || "--:--"}
      </span>
    </span>
  );
}

export function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to the top"
      className="group inline-flex h-10 items-center gap-2 rounded-full bg-orange-500 pl-4 pr-1.5 text-sm font-bold text-slate-950 shadow-[3px_3px_0_0_rgb(255_255_255/0.25)] transition hover:-translate-y-0.5 hover:bg-orange-400 active:translate-y-0"
    >
      Back to top
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-orange-300 transition group-hover:-translate-y-0.5">
        <ArrowUp className="h-4 w-4" />
      </span>
    </button>
  );
}
