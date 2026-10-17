import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";
import { ALL_QUEUES, CATEGORY_LABEL, assignmentOf, getById } from "@/lib/complaints";
import { TEAM_IDS, TEAM_LABEL } from "@/lib/teams";
import type { TeamId } from "@/lib/teams";
import { NEEDS_REASON, STATUS_LABEL, TRANSITIONS } from "@/lib/transitions";
import { withStore } from "@/lib/localStore";
import { EvidenceForm, QueueForm, StatusForm, VerifyTeamCard } from "@/components/admin/ActionForms";

export const metadata = { title: "Complaint — CivicOS admin" };

export default function AdminComplaintPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <Detail params={params} />
      </Suspense>
    </main>
  );
}

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const c = await getById(id);
  if (!c) notFound();

  const notifications = await withStore((s) => s.notifications.filter((n) => n.complaintId === id).slice(-5).reverse());
  const assignment = assignmentOf(c);
  const pendingTeam = assignment.state === "PENDING_VERIFICATION";
  const options = TRANSITIONS[c.status]
    .filter((s) => !(pendingTeam && s === "ASSIGNED")) // must go through team verification
    .map((s) => ({
    value: s,
    label: STATUS_LABEL[s],
    needsReason: NEEDS_REASON.includes(s),
  }));

  return (
    <article className="space-y-6">
      <Link href="/admin" className="text-sm text-teal-800 underline">
        ← Back to queue
      </Link>

      <header>
        <p className="font-mono text-sm text-zinc-500">{c.ticketId}</p>
        <h1 className="mt-1 text-2xl font-semibold">{c.title}</h1>
        <p className="mt-2 inline-block rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-900">
          {STATUS_LABEL[c.status]}
        </p>
      </header>

      {c.mediaFiles.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {c.mediaFiles.map((f) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={f}
              src={`/api/v1/admin/media/${f}`}
              alt="Photo sent by the citizen"
              className="max-h-72 rounded border border-zinc-200"
            />
          ))}
        </div>
      ) : null}

      {c.audioFiles.length > 0 ? (
        <div className="space-y-2 rounded border border-zinc-200 p-3 text-sm">
          <p className="font-medium">Voice note</p>
          {c.audioFiles.map((f) => (
            <audio key={f} controls src={"/api/v1/admin/media/" + f} className="w-full" />
          ))}
          {c.voice ? (
            <>
              <p>
                <span className="text-zinc-500">Heard ({c.voice.language}):</span> {c.voice.transcript}
              </p>
              {c.voice.english && c.voice.english !== c.voice.transcript ? (
                <p>
                  <span className="text-zinc-500">In English:</span> {c.voice.english}
                </p>
              ) : null}
              <p className="text-xs text-zinc-400">Automatic transcript, may contain mistakes.</p>
            </>
          ) : (
            <p className="text-zinc-500">No transcript available.</p>
          )}
        </div>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-zinc-500">Category (suggested)</dt>
          <dd>{CATEGORY_LABEL[c.category]}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Severity (suggested)</dt>
          <dd>{c.severity ? c.severity.charAt(0) + c.severity.slice(1).toLowerCase() : "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Caption</dt>
          <dd>{c.caption || "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Location</dt>
          <dd>
            <a
              className="text-teal-800 underline"
              target="_blank"
              rel="noreferrer"
              href={`https://www.openstreetmap.org/?mlat=${c.latitude}&mlon=${c.longitude}#map=17/${c.latitude}/${c.longitude}`}
            >
              {c.latitude.toFixed(5)}, {c.longitude.toFixed(5)}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Analysis</dt>
          <dd>{c.aiProvider ? `${c.aiProvider} (${c.aiModel}), suggestion only` : "Keyword fallback, no AI used"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Review flag</dt>
          <dd>{c.needsHumanReview ? `Needs review${c.reviewReason ? `: ${c.reviewReason}` : ""}` : "None"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-zinc-500">Summary</dt>
          <dd>{c.summary || "—"}</dd>
        </div>
        {c.hazards?.length ? (
          <div className="col-span-2">
            <dt className="text-zinc-500">Hazards noticed</dt>
            <dd>{c.hazards.join(", ")}</dd>
          </div>
        ) : null}
      </dl>

      {pendingTeam ? (
        <section className="space-y-3 rounded border-2 border-amber-400 bg-amber-50 p-4">
          <h2 className="font-semibold">Step 1: verify the suggested team</h2>
          <VerifyTeamCard
            id={c.id}
            suggestedTeam={assignment.suggestedTeam}
            suggestedLabel={TEAM_LABEL[assignment.suggestedTeam as TeamId] ?? assignment.suggestedTeam}
            reason={assignment.reason}
            suggestedBy={assignment.suggestedBy}
            teams={TEAM_IDS.map((id) => ({ id, label: TEAM_LABEL[id] }))}
          />
        </section>
      ) : (
        <section className="space-y-3 rounded border border-zinc-200 p-4">
          <h2 className="font-semibold">Team</h2>
          <p className="text-sm text-zinc-600">
            {assignment.state === "CORRECTED"
              ? `Staff corrected the suggestion (${TEAM_LABEL[assignment.suggestedTeam as TeamId] ?? assignment.suggestedTeam}) to ${c.queue}.`
              : `Suggestion confirmed by staff: ${c.queue}.`}
            {assignment.verifiedBy ? ` Verified by ${assignment.verifiedBy}.` : ""}
          </p>
          <QueueForm id={c.id} current={c.queue} queues={ALL_QUEUES} />
        </section>
      )}

      {c.status === "IN_PROGRESS" || c.status === "RESOLVED_PENDING_VERIFICATION" || (c.repairChecks?.length ?? 0) > 0 ? (
        <section className="space-y-3 rounded border border-zinc-200 p-4">
          <h2 className="font-semibold">Repair evidence</h2>
          <p className="text-xs text-zinc-500">
            The AI opinion is advisory. You decide whether the issue is really fixed before closing.
          </p>
          {(c.repairChecks ?? []).map((r) => (
            <div key={r.file} className="flex flex-wrap gap-3 rounded bg-zinc-50 p-3 text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={"/api/v1/admin/media/" + r.file} alt="Photo after repair" className="max-h-40 rounded border border-zinc-200" />
              <div className="min-w-48 flex-1">
                <p>
                  <span
                    className={
                      "rounded px-2 py-0.5 text-xs font-medium " +
                      (r.verdict === "looks_repaired"
                        ? "bg-teal-100 text-teal-900"
                        : r.verdict === "partially_repaired"
                          ? "bg-amber-100 text-amber-900"
                          : r.verdict === "not_repaired"
                            ? "bg-red-100 text-red-900"
                            : "bg-zinc-200 text-zinc-800")
                    }
                  >
                    {r.verdict === "looks_repaired"
                      ? "Looks repaired"
                      : r.verdict === "partially_repaired"
                        ? "Partly repaired"
                        : r.verdict === "not_repaired"
                          ? "Does not look repaired"
                          : "Cannot tell"}
                  </span>{" "}
                  <span className="text-xs text-zinc-500">{r.aiProvider ? "AI opinion" : "no AI available"}</span>
                </p>
                <p className="mt-1 text-zinc-700">{r.reason}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {r.uploadedBy}, {when(r.at)}
                </p>
              </div>
            </div>
          ))}
          {c.status === "IN_PROGRESS" || c.status === "RESOLVED_PENDING_VERIFICATION" ? <EvidenceForm id={c.id} /> : null}
        </section>
      ) : null}

      <section className="space-y-3 rounded border border-zinc-200 p-4">
        <h2 className="font-semibold">Change status</h2>
        <StatusForm id={c.id} options={options} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Timeline</h2>
        <ol className="mt-3 space-y-3 border-l border-zinc-300 pl-4 text-sm">
          {c.history.map((h, i) => (
            <li key={i}>
              <p className="font-medium">
                {STATUS_LABEL[h.status]} <span className="font-normal text-zinc-500">· {h.actor}</span>
              </p>
              <p className="text-zinc-600">{h.note}</p>
              <p className="text-xs text-zinc-400">{when(h.at)}</p>
            </li>
          ))}
        </ol>
      </section>

      {c.internalNotes?.length ? (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Internal notes (not public)</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {c.internalNotes.map((n, i) => (
              <li key={i}>
                <span className="text-zinc-500">
                  {n.by}, {when(n.at)}:
                </span>{" "}
                {n.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          WhatsApp updates sent to the citizen
        </h2>
        <ul className="mt-2 space-y-2 text-sm">
          {notifications.length === 0 ? <li className="text-zinc-500">None yet.</li> : null}
          {notifications.map((n) => (
            <li key={n.id}>
              <span
                className={n.state === "SENT" ? "text-teal-800" : n.state === "FAILED" ? "text-red-700" : "text-amber-700"}
              >
                {n.state}
              </span>
              {n.lastError ? <span className="text-zinc-500"> — {n.lastError}</span> : null}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
