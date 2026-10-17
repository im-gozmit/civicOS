import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AlertTriangle, Check, Info, MapPin, ShieldCheck } from "lucide-react";
import { CATEGORY_LABEL, getByToken } from "@/lib/complaints";
import { STATUS_LABEL } from "@/lib/transitions";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { SeverityBadge, StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import type { Complaint, ComplaintStatus } from "@/lib/types";

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

  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <header className="card card-pad">
        <div className="flex items-start gap-4">
          <CategoryIcon category={c.category} className="h-14 w-14" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-semibold text-slate-500">{c.ticketId}</p>
            <h1 className="mt-0.5 text-2xl font-extrabold leading-tight text-slate-900">{c.title}</h1>
            <div className="mt-3">
              <StatusBadge status={c.status} />
            </div>
          </div>
        </div>
        {c.summary ? <p className="mt-4 leading-relaxed text-slate-600">{c.summary}</p> : null}

        {step !== undefined ? <Progress current={step} status={c.status} /> : <SpecialStatus status={c.status} />}
      </header>

      <section className="card card-pad">
        <h2 className="text-lg font-bold text-slate-900">Details</h2>
        <dl className="mt-4 grid gap-5 text-sm sm:grid-cols-2">
          <Fact label="Type of problem" value={CATEGORY_LABEL[c.category]} />
          <Fact
            label="Team"
            value={c.queue}
            note={pendingTeam ? "Suggested. Staff will confirm before anything is promised." : undefined}
          />
          <div>
            <dt className="text-slate-500">Severity (suggested)</dt>
            <dd className="mt-1">
              <SeverityBadge severity={c.severity} />
            </dd>
          </div>
          <Fact label="Reported" value={when(c.createdAt, true)} />
          <Fact label="Review" value={c.needsHumanReview ? "A person will review this" : "Reviewed"} />
        </dl>
      </section>

      <Timeline c={c} />

      <p className="flex gap-2.5 rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs leading-relaxed text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        Keep this link private: anyone who has it can see this page. CivicOS is a demo service; the team shown is a demo queue and not an
        official government department.
      </p>
    </article>
  );
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
      {note ? <dd className="mt-1 text-xs text-slate-500">{note}</dd> : null}
    </div>
  );
}

function Progress({ current, status }: { current: number; status: ComplaintStatus }) {
  const bar = statusTone(status).bar;
  return (
    <div className="mt-6" role="group" aria-label={`Progress: step ${current + 1} of ${STEPS.length}, ${STEPS[current]}`}>
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

function Timeline({ c }: { c: Complaint }) {
  const items = [...c.history].reverse(); // newest first
  return (
    <section className="card card-pad">
      <h2 className="text-lg font-bold text-slate-900">Timeline</h2>
      <ol className="mt-5">
        {items.map((h, i) => {
          const tone = statusTone(h.status);
          return (
            <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
              {i < items.length - 1 ? <span className="absolute left-[15px] top-8 h-full w-px bg-slate-200" /> : null}
              <span className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${i === 0 ? tone.bar : "bg-slate-100"} ${i === 0 ? "text-white" : "text-slate-500"}`}>
                {i === 0 ? <tone.Icon className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{STATUS_LABEL[h.status]}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{h.note}</p>
                <p className="mt-1 text-xs text-slate-400">{when(h.at, true)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
