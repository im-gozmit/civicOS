import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CATEGORY_LABEL, getByToken } from "@/lib/complaints";

export const metadata = { title: "Track your complaint — CivicOS" };

const STATUS_LABEL: Record<string, string> = {
  REPORTED: "Report received",
  TRIAGED: "Registered, awaiting review",
  ASSIGNED: "Assigned to a queue",
  IN_PROGRESS: "Work in progress",
  RESOLVED_PENDING_VERIFICATION: "Marked resolved, being verified",
  CLOSED: "Closed",
  REOPENED: "Reopened",
  NEEDS_INFO: "More information needed",
  DUPLICATE: "Linked to a similar report",
  REJECTED: "Not accepted",
};

export default function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <Tracker params={params} />
      </Suspense>
    </main>
  );
}

async function Tracker({ params }: { params: Promise<{ token: string }> }) {
  await connection(); // per-request data: never prerender
  const { token } = await params;
  const c = await getByToken(token);
  if (!c) notFound();

  return (
    <article className="space-y-6">
      <header>
        <p className="font-mono text-sm text-zinc-500">{c.ticketId}</p>
        <h1 className="mt-1 text-2xl font-semibold">{c.title}</h1>
        <p className="mt-2 inline-block rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-900">
          {STATUS_LABEL[c.status] ?? c.status}
        </p>
      </header>

      {c.summary ? <p className="text-zinc-700">{c.summary}</p> : null}

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-zinc-500">Category</dt>
          <dd>{CATEGORY_LABEL[c.category]}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Team</dt>
          <dd>
            {c.assignment?.state === "PENDING_VERIFICATION" || (!c.assignment && c.status === "TRIAGED")
              ? `${c.queue} (suggested, awaiting staff confirmation)`
              : c.queue}
          </dd>
        </div>
        {c.severity ? (
          <div>
            <dt className="text-zinc-500">Severity (suggested)</dt>
            <dd>{c.severity.charAt(0) + c.severity.slice(1).toLowerCase()}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-zinc-500">Reported</dt>
          <dd>{new Date(c.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Review</dt>
          <dd>{c.needsHumanReview ? "A person will review this" : "Reviewed"}</dd>
        </div>
      </dl>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Timeline</h2>
        <ol className="mt-3 space-y-4 border-l border-zinc-300 pl-4">
          {c.history.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal-600" />
              <p className="text-sm font-medium">{STATUS_LABEL[h.status] ?? h.status}</p>
              <p className="text-sm text-zinc-600">{h.note}</p>
              <p className="text-xs text-zinc-400">
                {new Date(h.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-xs text-zinc-500">
        CivicOS demo queue. This is not an official government system and does not mean a department has accepted
        your complaint.
      </p>
    </article>
  );
}
