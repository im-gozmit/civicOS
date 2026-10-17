"use client";

import { useState } from "react";
import { ImageOff, RefreshCw } from "lucide-react";

/**
 * A private evidence photo. If it cannot be shown, say why (signed out, missing from storage, server error)
 * instead of leaving an empty box, and let staff retry without reloading the page.
 */
export function AdminImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [attempt, setAttempt] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);

  async function explain() {
    try {
      const res = await fetch(src, { cache: "no-store" });
      if (res.ok) return setProblem("The photo exists but this browser could not draw it. Try Retry, or open it in a new tab.");
      setProblem(
        res.status === 401
          ? "Your staff session has ended. Sign in again."
          : res.status === 404
            ? "This photo is not in storage (or is not linked to a complaint)."
            : `The server could not load this photo (error ${res.status}).`,
      );
    } catch {
      setProblem("Network problem while loading the photo.");
    }
  }

  if (problem) {
    return (
      <div role="alert" className="flex flex-col items-start gap-2 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
        <p className="flex items-start gap-2 font-semibold">
          <ImageOff className="mt-0.5 h-4 w-4 shrink-0" /> {problem}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setProblem(null);
              setAttempt((n) => n + 1);
            }}
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
          <a href={src} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
            Open in new tab
          </a>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={attempt} src={attempt ? `${src}?retry=${attempt}` : src} alt={alt} className={className} onError={explain} />
  );
}
