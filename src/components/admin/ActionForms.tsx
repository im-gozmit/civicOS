"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRightLeft, Check, CheckCircle2, Copy, ImagePlus, Loader2, Send, Sparkles, Upload } from "lucide-react";
import { MAX_UPLOAD_BYTES, downscaleImage, uploadErrorMessage } from "@/lib/clientImage";

function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {message}
    </p>
  );
}

function Spin({ on }: { on: boolean }) {
  return on ? <Loader2 className="h-4 w-4 animate-spin" /> : null;
}

/* ------------------------------------------------------------------ status */

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

  if (options.length === 0) return <p className="text-sm text-slate-500">No further status changes are allowed from here.</p>;
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
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="move-to" className="label">
          Move to
        </label>
        <select id="move-to" value={effective} onChange={(e) => setStatus(e.target.value)} className="field">
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="public-note" className="label">
          Message to the citizen{" "}
          <span className={`font-normal ${needsReason ? "text-rose-600" : "text-slate-400"}`}>{needsReason ? "(a reason is required)" : "(optional)"}</span>
        </label>
        <textarea id="public-note" value={publicNote} onChange={(e) => setPublicNote(e.target.value)} rows={2} maxLength={500} className="field resize-y" />
      </div>
      <div>
        <label htmlFor="internal-note" className="label">
          Internal note <span className="font-normal text-slate-400">(never shown to the citizen)</span>
        </label>
        <textarea id="internal-note" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={2} maxLength={1000} className="field resize-y" />
      </div>
      <ErrorLine message={error} />
      <button disabled={busy} className="btn btn-primary w-full">
        <Spin on={busy} />
        {!busy ? <Send className="h-4 w-4" /> : null}
        {busy ? "Saving…" : "Update status and notify citizen"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------ team verification */

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
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 ring-1 ring-amber-200">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <Sparkles className="h-3.5 w-3.5" /> Suggested by {suggestedBy === "ai" ? "AI" : "keyword rules"}
        </p>
        <p className="mt-1 text-lg font-bold text-slate-900">{suggestedLabel}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{reason || "No reason given."}</p>
      </div>
      <p className="text-xs text-slate-500">The citizen is told about the team only after you confirm or correct it here.</p>

      <button disabled={busy} onClick={() => send("confirm")} className="btn btn-primary w-full">
        <Spin on={busy} />
        {!busy ? <CheckCircle2 className="h-4 w-4" /> : null}
        {busy ? "Saving…" : "Confirm this team and notify citizen"}
      </button>

      <div className="border-t border-amber-200/70 pt-4">
        <p className="label">Wrong team? Choose the right one</p>
        <select value={other} onChange={(e) => setOther(e.target.value)} className="field" aria-label="Correct team">
          {teams
            .filter((t) => t.id !== suggestedTeam)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
        </select>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Why? (internal note)" className="field mt-2" />
        <button disabled={busy} onClick={() => send("correct")} className="btn btn-secondary mt-3 w-full">
          <ArrowRightLeft className="h-4 w-4" /> Correct team and notify citizen
        </button>
      </div>
      <ErrorLine message={error} />
    </div>
  );
}

/* ------------------------------------------------------------------- reassign */

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
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="queue" className="label">
          Move to another team (demo)
        </label>
        <select id="queue" value={queue} onChange={(e) => setQueue(e.target.value)} className="field">
          {queues.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
      </div>
      <button disabled={busy || queue === current} className="btn btn-secondary w-full">
        <Spin on={busy} />
        {busy ? "Saving…" : "Reassign"}
      </button>
      <ErrorLine message={error} />
    </form>
  );
}

/* -------------------------------------------------------------- repair evidence */

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
    <form onSubmit={submit} className="space-y-3">
      <label
        htmlFor={`evidence-${id}`}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
          file ? "border-teal-400 bg-teal-50/60" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
        }`}
      >
        <span className={`flex h-11 w-11 items-center justify-center rounded-full ${file ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"}`}>
          {file ? <Check className="h-5 w-5" strokeWidth={3} /> : <ImagePlus className="h-5 w-5" />}
        </span>
        {file ? (
          <span className="text-sm">
            <strong className="block break-all text-teal-900">{file.name}</strong>
            <span className="text-teal-800">{sizeText} selected. Press the button below.</span>
          </span>
        ) : (
          <span className="text-sm">
            <strong className="block text-slate-800">Choose the photo taken after the repair</strong>
            <span className="text-slate-500">The button turns on once a photo is selected.</span>
          </span>
        )}
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
          className="sr-only"
        />
      </label>
      <ErrorLine message={error} />
      {done ? (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {done}
        </p>
      ) : null}
      <button disabled={!file || busy} className="btn btn-primary w-full">
        <Spin on={busy} />
        {!busy ? <Upload className="h-4 w-4" /> : null}
        {busy ? "Comparing with the original (about 10 seconds)…" : "Upload and compare"}
      </button>
    </form>
  );
}

/* ----------------------------------------------------------- duplicate review */

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
      <p className="text-sm leading-relaxed text-slate-600">
        These earlier open reports look like the same problem. Nothing is merged automatically, and this citizen keeps their own complaint
        number.
      </p>
      <ul className="space-y-2">
        {candidates.map((c) => (
          <li key={c.ticketId} className="rounded-xl bg-white p-3.5 ring-1 ring-sky-200">
            <div className="flex flex-wrap items-center gap-2">
              <a href={`/admin/c/${c.id}`} className="font-mono text-sm font-bold text-teal-800 underline decoration-teal-300 underline-offset-2">
                {c.ticketId}
              </a>
              <span className="text-xs text-slate-500">{c.status}</span>
              {c.sameImage ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800 ring-1 ring-inset ring-red-200">identical photo</span> : null}
            </div>
            <p className="mt-1 text-sm text-slate-600">{c.reason}</p>
            <button disabled={busy} onClick={() => send("link", c.ticketId)} className="btn btn-secondary btn-sm mt-3">
              <Copy className="h-4 w-4" /> Same problem: link as duplicate
            </button>
          </li>
        ))}
      </ul>
      <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Note (optional, internal)" className="field" />
      <button disabled={busy} onClick={() => send("dismiss")} className="btn btn-ghost w-full border border-slate-200">
        Not the same problem
      </button>
      <ErrorLine message={error} />
    </div>
  );
}
