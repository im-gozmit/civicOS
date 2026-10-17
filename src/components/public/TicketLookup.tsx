"use client";

import { useState } from "react";

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
    const res = await fetch(`/api/v1/track/ticket/${encodeURIComponent(ticket.trim())}`);
    const data = (await res.json().catch(() => null)) as (Found & { error?: string }) | null;
    setBusy(false);
    if (res.ok && data) setFound(data);
    else setError(data?.error ?? "Not found. Check the number, for example CIV-000012.");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={lookup} className="flex gap-2">
        <label className="sr-only" htmlFor="ticket">
          Complaint number
        </label>
        <input
          id="ticket"
          value={ticket}
          onChange={(e) => setTicket(e.target.value)}
          placeholder="CIV-000012"
          className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-2 font-mono"
        />
        <button disabled={busy || !ticket.trim()} className="rounded bg-teal-700 px-4 py-2 font-medium text-white disabled:opacity-60">
          {busy ? "…" : "Check"}
        </button>
      </form>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {found ? (
        <dl className="space-y-2 rounded border border-zinc-200 p-4 text-sm">
          <div>
            <dt className="text-zinc-500">Complaint</dt>
            <dd className="font-mono">{found.ticketId}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Issue</dt>
            <dd>{found.category}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd>{found.status}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Last updated</dt>
            <dd>{new Date(found.lastUpdated).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</dd>
          </div>
          <p className="text-xs text-zinc-500">
            For photos and the full timeline, open the personal tracking link you received when you reported.
          </p>
        </dl>
      ) : null}
    </div>
  );
}
