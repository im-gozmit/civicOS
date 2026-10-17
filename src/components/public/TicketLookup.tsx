"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Loader2, Search } from "lucide-react";

interface Found {
  ticketId: string;
  category: string;
  status: string;
  lastUpdated: string;
}

export function TicketLookup() {
  const [ticket, setTicket] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFound(null);
    try {
      const res = await fetch(`/api/v1/track/ticket/${encodeURIComponent(ticket.trim())}`);
      const data = (await res.json().catch(() => null)) as (Found & { error?: string }) | null;
      if (res.ok && data) setFound(data);
      else if (res.status === 429) setError("Too many lookups. Please wait a few minutes.");
      else setError("We could not find that number. Check it and try again, for example CIV-000012.");
    } catch {
      setError("Network problem. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={lookup} className="card card-pad">
        <label htmlFor="ticket" className="label">
          Complaint number
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="ticket"
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              placeholder="CIV-000012"
              autoComplete="off"
              autoCapitalize="characters"
              className="field py-3 pl-11 font-mono text-base uppercase placeholder:normal-case"
            />
          </div>
          <button disabled={busy || !ticket.trim()} className="btn btn-primary px-6 py-3">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {busy ? "Checking…" : "Check status"}
          </button>
        </div>
        <p className="hint mt-3">You received this number when you reported the problem, on the website or on WhatsApp.</p>
      </form>

      {error ? (
        <div role="alert" className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      ) : null}

      {found ? (
        <div className="card animate-rise card-pad">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xl font-extrabold text-slate-900">{found.ticketId}</p>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800 ring-1 ring-inset ring-teal-200">{found.status}</span>
          </div>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Type of problem</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{found.category}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Last updated</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {new Date(found.lastUpdated).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}
              </dd>
            </div>
          </dl>
          <p className="mt-5 flex items-center gap-1.5 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            <ArrowRight className="h-4 w-4 shrink-0 text-teal-600" />
            For photos and the full timeline, open the personal tracking link you received when you reported.
          </p>
        </div>
      ) : null}
    </div>
  );
}
