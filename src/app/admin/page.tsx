import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";
import { CATEGORY_LABEL, listAll } from "@/lib/complaints";
import { ALL_STATUSES, STATUS_LABEL } from "@/lib/transitions";
import { LogoutButton } from "@/components/admin/LogoutButton";
import type { Complaint, ComplaintStatus } from "@/lib/types";

export const metadata = { title: "Complaint queue — CivicOS admin" };

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
const OPEN: ComplaintStatus[] = [
  "REPORTED",
  "TRIAGED",
  "ASSIGNED",
  "IN_PROGRESS",
  "REOPENED",
  "NEEDS_INFO",
  "RESOLVED_PENDING_VERIFICATION",
];

export default function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
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
  const filtered: Complaint[] =
    status && (ALL_STATUSES as string[]).includes(status)
      ? all.filter((c) => c.status === status)
      : status === "all"
        ? all
        : all.filter((c) => OPEN.includes(c.status));

  const sorted = [...filtered].sort(
    (a, b) =>
      Number(b.needsHumanReview) - Number(a.needsHumanReview) ||
      (SEVERITY_ORDER[a.severity ?? "MEDIUM"] ?? 2) - (SEVERITY_ORDER[b.severity ?? "MEDIUM"] ?? 2) ||
      b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Complaint queue</h1>
          <p className="text-sm text-zinc-500">
            Signed in as {admin.email}. Demo queues, not an official government system.
          </p>
        </div>
        <LogoutButton />
      </header>

      <nav className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin" className="rounded-full border px-3 py-1">
          Open
        </Link>
        <Link href="/admin?status=all" className="rounded-full border px-3 py-1">
          All
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link key={s} href={`/admin?status=${s}`} className="rounded-full border px-3 py-1 text-zinc-600">
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </nav>

      <div className="mt-6 overflow-x-auto rounded border border-zinc-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-3 py-2">Ticket</th>
              <th className="px-3 py-2">Issue</th>
              <th className="px-3 py-2">Severity</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Reported</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id} className="border-t border-zinc-200 hover:bg-zinc-50">
                <td className="px-3 py-2 font-mono">
                  <Link href={`/admin/c/${c.id}`} className="text-teal-800 underline">
                    {c.ticketId}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  {CATEGORY_LABEL[c.category]}
                  {c.needsHumanReview ? (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">needs review</span>
                  ) : null}
                </td>
                <td className="px-3 py-2">
                  {c.severity ? c.severity.charAt(0) + c.severity.slice(1).toLowerCase() : "—"}
                </td>
                <td className="px-3 py-2">{STATUS_LABEL[c.status]}</td>
                <td className="px-3 py-2 text-zinc-500">
                  {new Date(c.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                </td>
              </tr>
            ))}
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                  No complaints here yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
