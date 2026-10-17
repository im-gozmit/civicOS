"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_UPLOAD_BYTES, downscaleImage, uploadErrorMessage } from "@/lib/clientImage";

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
  // The list of allowed moves changes after every update. If the remembered choice is no longer
  // offered, fall back to the first option, so what the dropdown shows is what gets sent.
  const effective = options.some((o) => o.value === status) ? status : options[0].value;
  const needsReason = options.find((o) => o.value === effective)?.needsReason ?? false;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/v1/admin/complaints/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: effective, publicNote, internalNote }),
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
        <select value={effective} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2">
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

export function EvidenceForm({ id }: { id: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  // A new key re-creates the file input after an upload, so it does not keep showing the old name.
  const [inputKey, setInputKey] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      // Phone photos are often over the 4.5 MB request limit, so shrink before sending.
      const small = await downscaleImage(file);
      if (small.size > MAX_UPLOAD_BYTES) {
        setError(uploadErrorMessage(413));
        return;
      }
      const body = new FormData();
      body.set("photo", small);
      const res = await fetch(`/api/v1/admin/complaints/${id}/evidence`, { method: "POST", body });
      const data = (await res.json().catch(() => null)) as { error?: string; verdict?: string } | null;
      if (!res.ok) {
        setError(uploadErrorMessage(res.status, data?.error));
        return;
      }
      setDone("Photo uploaded and compared with the original. The result is shown above.");
      setFile(null);
      setInputKey((k) => k + 1);
      router.refresh();
    } catch (err) {
      console.error("[evidence upload]", err);
      setError("Something went wrong while uploading. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const sizeText = file ? (file.size >= 1024 * 1024 ? (file.size / 1024 / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(file.size / 1024)) + " KB") : "";

  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-sm text-zinc-600">Photo taken after the repair</p>
      <input
        key={inputKey}
        id={`evidence-${id}`}
        type="file"
        accept="image/*"
        onChange={(e) => {
          setError(null);
          setDone(null);
          setFile(e.target.files?.[0] ?? null);
        }}
        className="block w-full text-sm"
      />
      {file ? (
        <p className="text-sm text-teal-800">
          Selected: <strong>{file.name}</strong> ({sizeText}). Now press the button below.
        </p>
      ) : (
        <p className="text-sm text-zinc-500">Choose a photo first. The button below turns on once a photo is selected.</p>
      )}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {done ? (
        <p role="status" className="text-sm text-teal-800">
          {done}
        </p>
      ) : null}
      <button
        disabled={!file || busy}
        className="rounded border border-teal-700 bg-teal-700 px-3 py-2 font-medium text-white disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500"
      >
        {busy ? "Comparing with the original photo (about 10 seconds)…" : "Upload and compare"}
      </button>
    </form>
  );
}

export function DuplicateCard({
  id,
  candidates,
}: {
  id: string;
  candidates: Array<{ id: string; ticketId: string; distanceM: number; reason: string; status: string; sameImage: boolean }>;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(action: "link" | "dismiss", primaryTicketId?: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/v1/admin/complaints/${id}/duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, primaryTicketId, note }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (!res.ok) setError(data?.error ?? "Could not save.");
    else router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600">
        These earlier open reports look like the same problem. Nothing is merged automatically, and this citizen keeps
        their own complaint number.
      </p>
      <ul className="space-y-2">
        {candidates.map((c) => (
          <li key={c.ticketId} className="rounded bg-white p-3 text-sm">
            <p>
              <a href={`/admin/c/${c.id}`} className="font-mono text-teal-800 underline">
                {c.ticketId}
              </a>{" "}
              <span className="text-zinc-500">({c.status})</span>
              {c.sameImage ? <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-900">identical photo</span> : null}
            </p>
            <p className="text-zinc-600">{c.reason}</p>
            <button
              disabled={busy}
              onClick={() => send("link", c.ticketId)}
              className="mt-2 rounded border border-teal-700 px-3 py-1.5 text-teal-800 disabled:opacity-60"
            >
              Same problem: link as duplicate of {c.ticketId}
            </button>
          </li>
        ))}
      </ul>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        placeholder="Note (optional, internal)"
        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
      />
      <button disabled={busy} onClick={() => send("dismiss")} className="rounded border border-zinc-400 px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-60">
        Not the same problem
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
