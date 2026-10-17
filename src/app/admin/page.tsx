import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Copy, Eye, Inbox, ShieldQuestion, UserCheck } from "lucide-react";
import { getAdmin } from "@/lib/adminAuth";
import { CATEGORY_LABEL, assignmentOf, assignmentStats, listAll, needsDuplicateReview } from "@/lib/complaints";
import { ALL_STATUSES, STATUS_LABEL } from "@/lib/transitions";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { SeverityBadge, StatusBadge } from "@/components/ui/StatusBadge";
import type { Complaint, ComplaintStatus } from "@/lib/types";

export const metadata = { title: "Complaint queue" };

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
const OPEN: ComplaintStatus[] = ["REPORTED", "TRIAGED", "ASSIGNED", "IN_PROGRESS", "REOPENED", "NEEDS_INFO", "RESOLVED_PENDING_VERIFICATION"];

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

export default function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  return (
    <main className="container-page py-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-slate-100" />}>
        <Queue searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Queue({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");

  const { status } = await searchParams;
  const all = await listAll();
  const stats = await assignmentStats();
  const filtered: Complaint[] =
    status && (ALL_STATUSES as string[]).includes(status) ? all.filter((c) => c.status === status) : status === "all" ? all : all.filter((c) => OPEN.includes(c.status));

  const sorted = [...filtered].sort(
    (a, b) =>
      Number(b.needsHumanReview) - Number(a.needsHumanReview) ||
      (SEVERITY_ORDER[a.severity ?? "MEDIUM"] ?? 2) - (SEVERITY_ORDER[b.severity ?? "MEDIUM"] ?? 2) ||
      b.createdAt.localeCompare(a.createdAt),
  );

  const counts = new Map<string, number>();
  for (const c of all) counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
  const openCount = all.filter((c) => OPEN.includes(c.status)).length;
  const dupReview = all.filter(needsDuplicateReview).length;
  const needsReview = all.filter((c) => c.needsHumanReview && OPEN.includes(c.status)).length;
  const active = status && (status === "all" || (ALL_STATUSES as string[]).includes(status)) ? status : "open";

  const cards = [
    { label: "Open complaints", value: openCount, Icon: Inbox, tone: "bg-teal-50 text-teal-700" },
    { label: "Team to verify", value: stats.pending, Icon: UserCheck, tone: "bg-amber-50 text-amber-700" },
    { label: "Possible duplicates", value: dupReview, Icon: Copy, tone: "bg-sky-50 text-sky-700" },
    { label: "Flagged for review", value: needsReview, Icon: ShieldQuestion, tone: "bg-violet-50 text-violet-700" },
  ];
  const acceptedPct = stats.confirmed + stats.corrected > 0 ? Math.round((stats.confirmed / (stats.confirmed + stats.corrected)) * 100) : null;

  const chip = (isActive: boolean) =>
    `chip whitespace-nowrap ${isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`;

  return (
    <>
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">Complaint queue</h1>
        <p className="mt-1 text-sm text-slate-500">Demo queues, not an official government system.</p>
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, Icon, tone }) => (
          <div key={label} className="card flex items-center gap-3.5 p-4">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-slate-900">{value}</dd>
              <dt className="text-xs text-slate-500">{label}</dt>
            </div>
          </div>
        ))}
      </dl>

      {acceptedPct !== null ? (
        <p className="mt-3 text-sm text-slate-500">
          Team suggestions so far: <strong className="text-slate-700">{stats.confirmed}</strong> confirmed,{" "}
          <strong className="text-slate-700">{stats.corrected}</strong> corrected ({acceptedPct}% accepted as suggested).
        </p>
      ) : null}

      <nav aria-label="Filter by status" className="-mx-4 mt-6 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <div className="flex gap-2">
          <Link href="/admin" className={chip(active === "open")}>
            Open <span className="opacity-60">{openCount}</span>
          </Link>
          <Link href="/admin?status=all" className={chip(active === "all")}>
            All <span className="opacity-60">{all.length}</span>
          </Link>
          {ALL_STATUSES.filter((s) => (counts.get(s) ?? 0) > 0).map((s) => (
            <Link key={s} href={`/admin?status=${s}`} className={chip(active === s)}>
              {STATUS_LABEL[s]} <span className="opacity-60">{counts.get(s)}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="card mt-4 overflow-hidden">
        <div className="hidden grid-cols-[1fr_7rem_14rem_9rem_1.5rem] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
          <span>Complaint</span>
          <span>Severity</span>
          <span>Status</span>
          <span>Reported</span>
          <span />
        </div>
        <ul className="divide-y divide-slate-100">
          {sorted.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/c/${c.id}`} className="group grid items-center gap-x-4 gap-y-2 px-4 py-4 transition hover:bg-slate-50 md:grid-cols-[1fr_7rem_14rem_9rem_1.5rem] md:px-5">
                <div className="flex min-w-0 items-center gap-3.5">
                  <CategoryIcon category={c.category} className="h-11 w-11" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{c.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-600">{c.ticketId}</span>
                      <span>{CATEGORY_LABEL[c.category]}</span>
                      {assignmentOf(c).state === "PENDING_VERIFICATION" && c.status === "TRIAGED" ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">verify team</span>
                      ) : null}
                      {needsDuplicateReview(c) ? (
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-800 ring-1 ring-inset ring-sky-200">possible duplicate</span>
                      ) : null}
                      {c.needsHumanReview ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet-800 ring-1 ring-inset ring-violet-200">
                          <Eye className="h-3 w-3" /> needs review
                        </span>
                      ) : null}
                      {c.duplicateOf ? <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">duplicate of {c.duplicateOf.ticketId}</span> : null}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:block">
                  <SeverityBadge severity={c.severity} />
                </div>
                <div>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs text-slate-500">{when(c.createdAt)}</p>
                <ChevronRight className="hidden h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600 md:block" />
              </Link>
            </li>
          ))}
        </ul>
        {sorted.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Inbox className="h-6 w-6" />
            </span>
            <p className="mt-3 font-semibold text-slate-700">Nothing here yet</p>
            <p className="mt-1 text-sm text-slate-500">New complaints will appear in this list as soon as they arrive.</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
