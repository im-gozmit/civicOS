import { connection } from "next/server";
import { CheckCircle2, Inbox, Wrench } from "lucide-react";
import { publicStats } from "@/lib/complaints";

// Real totals from the database. Counts only: nothing here identifies a report or a person.
export async function LiveStats() {
  await connection(); // per-request data: never prerender
  const s = await publicStats();
  const items = [
    { label: "Reports received", value: s.received, Icon: Inbox, tone: "bg-teal-50 text-teal-700" },
    { label: "Being handled", value: s.working, Icon: Wrench, tone: "bg-blue-50 text-blue-700" },
    { label: "Fixed", value: s.fixed, Icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
  ];
  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {items.map(({ label, value, Icon, tone }) => (
        <div key={label} className="card flex items-center gap-4 p-5">
          <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <dd className="font-display text-3xl font-extrabold tabular-nums text-slate-900">{value.toLocaleString("en-IN")}</dd>
            <dt className="text-sm text-slate-500">{label}</dt>
          </div>
        </div>
      ))}
    </dl>
  );
}

export function LiveStatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card h-[88px] animate-pulse bg-slate-100/70" />
      ))}
    </div>
  );
}
