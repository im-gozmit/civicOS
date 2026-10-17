"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StatusOption {
  value: string;
  label: string;
  needsReason: boolean;
}

export function StatusForm({ id, options }: { id: string; options: StatusOption[] }) {
  const router = useRouter();
  const [status, setStatus] = useState(options[0]?.value ?? "");
  const [publicNote, setPublicNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (options.length === 0) return <p className="text-sm text-zinc-500">No further status changes are allowed from here.</p>;
  const needsReason = options.find((o) => o.value === status)?.needsReason ?? false;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/v1/admin/complaints/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, publicNote, internalNote }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (!res.ok) {
      setError(data?.error ?? "Could not update.");
      return;
    }
    setPublicNote("");
    setInternalNote("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm">
        <span className="text-zinc-600">Move to</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2">
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-zinc-600">Message to the citizen {needsReason ? "(a reason is required)" : "(optional)"}</span>
        <textarea value={publicNote} onChange={(e) => setPublicNote(e.target.value)} rows={2} maxLength={500} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="text-zinc-600">Internal note (never shown to the citizen)</span>
        <textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={2} maxLength={1000} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" />
      </label>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <button disabled={busy} className="rounded bg-teal-700 px-4 py-2 font-medium text-white disabled:opacity-60">
        {busy ? "Saving…" : "Update status and notify citizen"}
      </button>
    </form>
  );
}

export function VerifyTeamCard({
  id,
  suggestedTeam,
  suggestedLabel,
  reason,
  suggestedBy,
  teams,
}: {
  id: string;
  suggestedTeam: string;
  suggestedLabel: string;
  reason: string;
  suggestedBy: string;
  teams: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [other, setOther] = useState(teams.find((t) => t.id !== suggestedTeam)?.id ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(action: "confirm" | "correct") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/v1/admin/complaints/${id}/assignment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, team: action === "correct" ? other : undefined, note }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (!res.ok) setError(data?.error ?? "Could not save.");
    else router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">
        Suggested by <strong>{suggestedBy === "ai" ? "AI" : "keyword rules"}</strong>:{" "}
        <strong>{suggestedLabel}</strong>
      </p>
      <p className="text-sm text-zinc-600">Why: {reason || "—"}</p>
      <p className="text-xs text-zinc-500">
        The citizen is told about the team only after you confirm or correct it here.
      </p>
      <button
        disabled={busy}
        onClick={() => send("confirm")}
        className="rounded bg-teal-700 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {busy ? "Saving…" : "Confirm this team and notify citizen"}
      </button>
      <div className="border-t border-zinc-200 pt-3">
        <p className="text-sm text-zinc-600">Wrong team? Pick the right one:</p>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <select
            value={other}
            onChange={(e) => setOther(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
            aria-label="Correct team"
          >
            {teams
              .filter((t) => t.id !== suggestedTeam)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="Why? (internal note)"
            className="min-w-48 flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            disabled={busy}
            onClick={() => send("correct")}
            className="rounded border border-teal-700 px-3 py-2 text-teal-800 disabled:opacity-60"
          >
            Correct team and notify citizen
          </button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function QueueForm({ id, current, queues }: { id: string; current: string; queues: string[] }) {
  const router = useRouter();
  const [queue, setQueue] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/v1/admin/complaints/${id}/queue`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queue }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (!res.ok) setError(data?.error ?? "Could not update.");
    else router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <label className="block text-sm">
        <span className="text-zinc-600">Assign to queue (demo)</span>
        <select value={queue} onChange={(e) => setQueue(e.target.value)} className="mt-1 block rounded border border-zinc-300 px-3 py-2">
          {queues.map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
      </label>
      <button disabled={busy || queue === current} className="rounded border border-teal-700 px-3 py-2 text-teal-800 disabled:opacity-50">
        {busy ? "Saving…" : "Assign"}
      </button>
      {error ? <p role="alert" className="w-full text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
