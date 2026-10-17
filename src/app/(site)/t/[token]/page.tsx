import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AlertTriangle, Check, Info, ShieldCheck } from "lucide-react";
import { CATEGORY_LABEL, getByToken } from "@/lib/complaints";
import { STATUS_LABEL } from "@/lib/transitions";
import { Chip, IssueTimelineView, severityTone } from "@/components/public/IssueTimelineView";
import { BeforeAfter } from "@/components/public/BeforeAfter";
import { jurisdictionFacts } from "@/components/public/jurisdictionFacts";
import { statusTone } from "@/components/ui/StatusBadge";
import type { ComplaintStatus } from "@/lib/types";

export const metadata = { title: "Track your complaint" };

// The journey a complaint takes, in plain words. Each status maps to how far along it is.
const STEPS = ["Received", "Team confirmed", "Work in progress", "Resolved", "Closed"];
const STEP_OF: Partial<Record<ComplaintStatus, number>> = {
  REPORTED: 0,
  TRIAGED: 0,
  NEEDS_INFO: 0,
  ASSIGNED: 1,
  IN_PROGRESS: 2,
  REOPENED: 2,
  RESOLVED_PENDING_VERIFICATION: 3,
  CLOSED: 4,
};

const when = (iso: string, long = false) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: long ? "short" : undefined });

export default function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <div className="bg-hero">
      <main className="container-page py-8 sm:py-12">
        <Suspense fallback={<div className="mx-auto h-96 max-w-2xl animate-pulse rounded-2xl bg-slate-100" />}>
          <Tracker params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function Tracker({ params }: { params: Promise<{ token: string }> }) {
  await connection(); // per-request data: never prerender
  const { token } = await params;
  const c = await getByToken(token);
  if (!c) notFound();
  const step = STEP_OF[c.status];
  const pendingTeam = c.assignment?.state === "PENDING_VERIFICATION" || (!c.assignment && c.status === "TRIAGED");

  const severity = c.severity ? c.severity.charAt(0) + c.severity.slice(1).toLowerCase() : null;
  const timeline = [...c.history].reverse().map((h) => ({ title: STATUS_LABEL[h.status], note: h.note, meta: when(h.at, true), state: "done" as const }));

  return (
    <IssueTimelineView
      chips={
        <>
          <Chip tone="ink">{c.ticketId}</Chip>
          <Chip tone={c.status === "CLOSED" ? "green" : c.status === "REJECTED" ? "rose" : "plain"}>{STATUS_LABEL[c.status]}</Chip>
          {severity ? <Chip tone={severityTone(c.severity)}>{"●"} {severity}</Chip> : null}
        </>
      }
      title={severity ? `${CATEGORY_LABEL[c.category]} reported, ${severity} priority` : c.title}
      description={c.summary}
      media={<BeforeAfter token={token} before={c.mediaFiles.filter((f) => /.(jpg|png|webp)$/i.test(f))} after={(c.repairChecks ?? []).map((r) => ({ file: r.file, at: r.at }))} reportedAt={c.createdAt} />}
      timeline={timeline}
      facts={[
        { label: "Issue ID", value: <span className="font-mono">{c.ticketId}</span> },
        { label: "Category", value: CATEGORY_LABEL[c.category] },
        { label: "Team", value: c.queue, note: pendingTeam ? "Suggested. Staff will confirm before anything is promised." : undefined },
        { label: "Status", value: STATUS_LABEL[c.status] },
        { label: "Location", value: <span className="font-mono">{c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}</span> },
        ...jurisdictionFacts(c.jurisdiction),
        { label: "Reported", value: when(c.createdAt, true) },
        { label: "Review", value: c.needsHumanReview ? "A person will review this" : "Reviewed" },
      ]}
    >
      <section className="rounded-xl border-2 border-slate-900 bg-[var(--paper)] p-5 shadow-[4px_4px_0_0_var(--ink)] sm:p-6">
        <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Progress</h2>
        {step !== undefined ? <Progress current={step} status={c.status} /> : <SpecialStatus status={c.status} />}
      </section>
      <p className="flex gap-2.5 rounded-xl border border-slate-300 bg-white/70 p-4 text-xs leading-relaxed text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        Keep this link private: anyone who has it can see this page. Sudhaar is a demo service; the team shown is a demo queue and not an
        official government department.
      </p>
    </IssueTimelineView>
  );
}

function Progress({ current, status }: { current: number; status: ComplaintStatus }) {
  const bar = statusTone(status).bar;
  return (
    <div className="mt-5" role="group" aria-label={`Progress: step ${current + 1} of ${STEPS.length}, ${STEPS[current]}`}>
      <ol className="grid grid-cols-5">
        {STEPS.map((label, i) => {
          const done = i < current || status === "CLOSED";
          const here = i === current && status !== "CLOSED";
          return (
            <li key={label} className="relative flex flex-col items-center text-center">
              {i > 0 ? <span className={`absolute right-1/2 top-[15px] -z-0 h-0.5 w-full ${i <= current ? bar : "bg-slate-200"}`} /> : null}
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white ${
                  done ? `${bar} text-white` : here ? `${bar} text-white shadow-md` : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className={`mt-2 px-0.5 text-[11px] leading-tight sm:text-xs ${here ? "font-bold text-slate-900" : "text-slate-500"}`}>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SpecialStatus({ status }: { status: ComplaintStatus }) {
  const text =
    status === "DUPLICATE"
      ? "Staff found this is the same problem as an earlier report and linked them, so it will be handled together. Your complaint stays on record."
      : status === "REJECTED"
        ? "Staff were not able to accept this report. The latest note in the timeline below explains why."
        : "See the timeline below for the latest update.";
  const warn = status === "REJECTED";
  return (
    <div className={`mt-5 flex gap-3 rounded-xl p-4 text-sm ${warn ? "bg-rose-50 text-rose-900" : "bg-slate-50 text-slate-700"}`}>
      {warn ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /> : <Info className="mt-0.5 h-5 w-5 shrink-0" />}
      <p>{text}</p>
    </div>
  );
}
