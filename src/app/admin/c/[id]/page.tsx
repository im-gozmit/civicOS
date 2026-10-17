import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Bell, Copy, ExternalLink, Eye, Link2, MapPin, Mic, NotebookPen, Sparkles, Users } from "lucide-react";
import { getAdmin } from "@/lib/adminAuth";
import { ALL_QUEUES, CATEGORY_LABEL, assignmentOf, getById, linkedReportsOf, needsDuplicateReview, notificationsFor, statusesOf } from "@/lib/complaints";
import { TEAM_IDS, TEAM_LABEL } from "@/lib/teams";
import type { TeamId } from "@/lib/teams";
import { NEEDS_REASON, STATUS_LABEL, TRANSITIONS } from "@/lib/transitions";
import { DuplicateCard, EvidenceForm, QueueForm, StatusForm, VerifyTeamCard } from "@/components/admin/ActionForms";
import { AdminImage } from "@/components/admin/AdminImage";
import { jurisdictionFacts } from "@/components/public/jurisdictionFacts";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { SeverityBadge, StatusBadge } from "@/components/ui/StatusBadge";

export const metadata = { title: "Complaint" };

export default function AdminComplaintPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="container-page py-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-slate-100" />}>
        <Detail params={params} />
      </Suspense>
    </main>
  );
}

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

function Panel({ title, icon, tone = "plain", children }: { title: string; icon?: React.ReactNode; tone?: "plain" | "amber" | "sky"; children: React.ReactNode }) {
  const ring = tone === "amber" ? "border-amber-300 bg-amber-50/60" : tone === "sky" ? "border-sky-300 bg-sky-50/60" : "border-slate-200 bg-white";
  return (
    <section className={`rounded-2xl border p-5 shadow-card ${ring}`}>
      <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900">
        {icon}
        {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Fact({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
    </div>
  );
}

function verdictBadge(verdict: string) {
  const map: Record<string, [string, string]> = {
    looks_repaired: ["Looks repaired", "bg-emerald-50 text-emerald-800 ring-emerald-200"],
    partially_repaired: ["Partly repaired", "bg-amber-50 text-amber-800 ring-amber-200"],
    not_repaired: ["Does not look repaired", "bg-rose-50 text-rose-800 ring-rose-200"],
  };
  const [label, cls] = map[verdict] ?? ["Cannot tell", "bg-slate-100 text-slate-700 ring-slate-200"];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}>{label}</span>;
}

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const c = await getById(id);
  if (!c) notFound();

  const notifications = await notificationsFor(id);
  const linked = await linkedReportsOf(c.id);
  const reviewDuplicates = needsDuplicateReview(c);
  const candidateStatuses = reviewDuplicates ? await statusesOf((c.duplicateCandidates ?? []).map((k) => k.id)) : {};
  const candidates = reviewDuplicates
    ? (c.duplicateCandidates ?? []).map((k) => ({
        id: k.id,
        ticketId: k.ticketId,
        distanceM: k.distanceM,
        reason: k.reason,
        sameImage: k.sameImage,
        status: STATUS_LABEL[candidateStatuses[k.id] ?? "REPORTED"],
      }))
    : [];
  const assignment = assignmentOf(c);
  const pendingTeam = assignment.state === "PENDING_VERIFICATION";
  const options = TRANSITIONS[c.status]
    .filter((s) => !(pendingTeam && s === "ASSIGNED")) // must go through team verification
    .filter((s) => s !== "DUPLICATE") // linking goes through the duplicate review box
    .map((s) => ({
      value: s,
      label: STATUS_LABEL[s],
      needsReason: NEEDS_REASON.includes(s),
    }));
  const showRepair = c.status === "IN_PROGRESS" || c.status === "RESOLVED_PENDING_VERIFICATION" || (c.repairChecks?.length ?? 0) > 0;
  const canUploadAfter = c.status === "IN_PROGRESS" || c.status === "RESOLVED_PENDING_VERIFICATION";

  return (
    <article>
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-teal-700">
        <ArrowLeft className="h-4 w-4" /> Back to queue
      </Link>

      <header className="mt-4 flex flex-wrap items-start gap-4">
        <CategoryIcon category={c.category} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold text-slate-500">{c.ticketId}</p>
          <h1 className="mt-0.5 text-2xl font-extrabold text-slate-900 sm:text-3xl">{c.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={c.status} />
            <SeverityBadge severity={c.severity} />
            {c.needsHumanReview ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-800 ring-1 ring-inset ring-violet-200">
                <Eye className="h-3.5 w-3.5" /> Needs review
              </span>
            ) : null}
            <span className="text-xs text-slate-400">Reported {when(c.createdAt)}</span>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        {/* ------------------------------------------------------ left: the facts */}
        <div className="space-y-6">
          {c.mediaFiles.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {c.mediaFiles.map((f) => (
                <AdminImage
                  key={f}
                  src={`/api/v1/admin/media/${f}`}
                  alt="Photo sent by the citizen"
                  className="max-h-96 w-full rounded-2xl border border-slate-200 bg-slate-50 object-cover shadow-card"
                />
              ))}
            </div>
          ) : null}

          {c.audioFiles.length > 0 ? (
            <Panel title="Voice note" icon={<Mic className="h-4 w-4 text-teal-600" />}>
              {c.audioFiles.map((f) => (
                <audio key={f} controls src={"/api/v1/admin/media/" + f} className="w-full" />
              ))}
              {c.voice ? (
                <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm">
                  <p>
                    <span className="text-slate-500">Heard ({c.voice.language}):</span> {c.voice.transcript}
                  </p>
                  {c.voice.english && c.voice.english !== c.voice.transcript ? (
                    <p>
                      <span className="text-slate-500">In English:</span> {c.voice.english}
                    </p>
                  ) : null}
                  <p className="text-xs text-slate-400">Automatic transcript, may contain mistakes.</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No transcript available.</p>
              )}
            </Panel>
          ) : null}

          <Panel title="Details" icon={<Sparkles className="h-4 w-4 text-teal-600" />}>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Fact label="Category (suggested)">{CATEGORY_LABEL[c.category]}</Fact>
              <Fact label="Severity (suggested)">{c.severity ? c.severity.charAt(0) + c.severity.slice(1).toLowerCase() : "—"}</Fact>
              <Fact label="Caption">{c.caption || "—"}</Fact>
              <Fact label="Location">
                <a
                  className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.openstreetmap.org/?mlat=${c.latitude}&mlon=${c.longitude}#map=17/${c.latitude}/${c.longitude}`}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {c.latitude.toFixed(5)}, {c.longitude.toFixed(5)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Fact>
              {jurisdictionFacts(c.jurisdiction).map((f) => (
                <Fact key={f.label} label={f.label}>
                  {f.value}
                  {f.note ? <span className="mt-0.5 block text-xs font-normal text-slate-500">{f.note}</span> : null}
                </Fact>
              ))}
              <Fact label="Analysis">{c.aiProvider ? `${c.aiProvider} (${c.aiModel}), suggestion only` : "Keyword fallback, no AI used"}</Fact>
              <Fact label="Review flag">{c.needsHumanReview ? `Needs review${c.reviewReason ? `: ${c.reviewReason}` : ""}` : "None"}</Fact>
              <Fact label="Summary" wide>
                {c.summary || "—"}
              </Fact>
              {c.hazards?.length ? (
                <Fact label="Hazards noticed" wide>
                  <span className="flex flex-wrap gap-1.5">
                    {c.hazards.map((h) => (
                      <span key={h} className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 ring-1 ring-inset ring-rose-200">
                        {h}
                      </span>
                    ))}
                  </span>
                </Fact>
              ) : null}
            </dl>
          </Panel>

          {c.duplicateOf ? (
            <p className="flex items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Linked as a duplicate of <strong className="font-mono">{c.duplicateOf.ticketId}</strong> by {c.duplicateOf.by}. {c.duplicateOf.reason} To undo, change
                the status back to &ldquo;Registered, awaiting review&rdquo; with a reason.
              </span>
            </p>
          ) : null}
          {linked.length > 0 ? (
            <p className="flex items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              <Copy className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {linked.length} other report{linked.length === 1 ? "" : "s"} of the same problem linked to this one:{" "}
                {linked.map((l, i) => (
                  <span key={l.id}>
                    {i > 0 ? ", " : ""}
                    <Link href={"/admin/c/" + l.id} className="font-mono font-semibold underline">
                      {l.ticketId}
                    </Link>
                  </span>
                ))}
              </span>
            </p>
          ) : null}

          <Panel title="Timeline">
            <ol className="relative space-y-5 border-l-2 border-slate-100 pl-6">
              {c.history.map((h, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white ${i === c.history.length - 1 ? "bg-teal-500 ring-4 ring-teal-100" : "bg-slate-300"}`} />
                  <p className="text-sm font-semibold text-slate-900">
                    {STATUS_LABEL[h.status]} <span className="font-normal text-slate-500">· {h.actor}</span>
                  </p>
                  {h.note ? <p className="mt-0.5 text-sm text-slate-600">{h.note}</p> : null}
                  <p className="mt-0.5 text-xs text-slate-400">{when(h.at)}</p>
                </li>
              ))}
            </ol>
          </Panel>

          {c.internalNotes?.length ? (
            <Panel title="Internal notes (not public)" icon={<NotebookPen className="h-4 w-4 text-slate-500" />}>
              <ul className="space-y-2 text-sm">
                {c.internalNotes.map((n, i) => (
                  <li key={i} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      {n.by}, {when(n.at)}
                    </p>
                    <p className="mt-0.5 text-slate-800">{n.text}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel title="WhatsApp updates sent to the citizen" icon={<Bell className="h-4 w-4 text-slate-500" />}>
            <ul className="space-y-2 text-sm">
              {notifications.length === 0 ? <li className="text-slate-500">None yet.</li> : null}
              {notifications.map((n) => (
                <li key={n.id} className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                      n.state === "SENT"
                        ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                        : n.state === "FAILED"
                          ? "bg-rose-50 text-rose-800 ring-rose-200"
                          : "bg-amber-50 text-amber-800 ring-amber-200"
                    }`}
                  >
                    {n.state}
                  </span>
                  {n.lastError ? <span className="text-slate-500">{n.lastError}</span> : null}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* ---------------------------------------------------- right: the actions */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          {reviewDuplicates ? (
            <Panel title="Possible duplicate: please check" icon={<Copy className="h-4 w-4 text-sky-700" />} tone="sky">
              <DuplicateCard id={c.id} candidates={candidates} />
            </Panel>
          ) : null}

          {pendingTeam ? (
            <Panel title="Step 1: verify the suggested team" icon={<Users className="h-4 w-4 text-amber-700" />} tone="amber">
              <VerifyTeamCard
                id={c.id}
                suggestedTeam={assignment.suggestedTeam}
                suggestedLabel={TEAM_LABEL[assignment.suggestedTeam as TeamId] ?? assignment.suggestedTeam}
                reason={assignment.reason}
                suggestedBy={assignment.suggestedBy}
                teams={TEAM_IDS.map((id) => ({ id, label: TEAM_LABEL[id] }))}
              />
            </Panel>
          ) : (
            <Panel title="Team" icon={<Users className="h-4 w-4 text-teal-600" />}>
              <p className="text-sm text-slate-600">
                {assignment.state === "CORRECTED"
                  ? `Staff corrected the suggestion (${TEAM_LABEL[assignment.suggestedTeam as TeamId] ?? assignment.suggestedTeam}) to ${c.queue}.`
                  : `Suggestion confirmed by staff: ${c.queue}.`}
                {assignment.verifiedBy ? ` Verified by ${assignment.verifiedBy}.` : ""}
              </p>
              <QueueForm id={c.id} current={c.queue} queues={ALL_QUEUES} />
            </Panel>
          )}

          {showRepair ? (
            <Panel title="Repair evidence">
              <p className="text-xs text-slate-500">The AI opinion is advisory. You decide whether the issue is really fixed before closing.</p>
              {(c.repairChecks ?? []).map((r) => (
                <div key={r.file} className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
                  <AdminImage src={"/api/v1/admin/media/" + r.file} alt="Photo after repair" className="max-h-48 w-full rounded-lg border border-slate-200 object-cover" />
                  <p className="flex flex-wrap items-center gap-2">
                    {verdictBadge(r.verdict)}
                    <span className="text-xs text-slate-500">{r.aiProvider ? "AI opinion" : "no AI available"}</span>
                  </p>
                  <p className="text-slate-700">{r.reason}</p>
                  <p className="text-xs text-slate-400">
                    {r.uploadedBy}, {when(r.at)}
                  </p>
                </div>
              ))}
              {canUploadAfter ? <EvidenceForm id={c.id} /> : null}
            </Panel>
          ) : null}

          <Panel title="Change status">
            <StatusForm id={c.id} options={options} />
          </Panel>
        </aside>
      </div>
    </article>
  );
}
