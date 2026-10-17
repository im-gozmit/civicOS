import { AlertTriangle, CheckCircle2, CircleDot, Clock, Copy, HelpCircle, Hourglass, Loader2, RotateCcw, XCircle } from "lucide-react";
import { STATUS_LABEL } from "@/lib/transitions";
import type { ComplaintStatus, Severity } from "@/lib/types";

// One meaning per colour, the same on every screen:
//   amber = waiting for a person, blue = being handled, green = fixed, grey = linked, red = not accepted.

const TONE: Record<ComplaintStatus, { box: string; dot: string; bar: string; Icon: typeof Clock }> = {
  REPORTED: { box: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500", bar: "bg-amber-500", Icon: Clock },
  TRIAGED: { box: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500", bar: "bg-amber-500", Icon: Hourglass },
  NEEDS_INFO: { box: "bg-violet-50 text-violet-800 ring-violet-200", dot: "bg-violet-500", bar: "bg-violet-500", Icon: HelpCircle },
  ASSIGNED: { box: "bg-sky-50 text-sky-800 ring-sky-200", dot: "bg-sky-500", bar: "bg-sky-500", Icon: CircleDot },
  IN_PROGRESS: { box: "bg-blue-50 text-blue-800 ring-blue-200", dot: "bg-blue-500", bar: "bg-blue-500", Icon: Loader2 },
  RESOLVED_PENDING_VERIFICATION: { box: "bg-indigo-50 text-indigo-800 ring-indigo-200", dot: "bg-indigo-500", bar: "bg-indigo-500", Icon: Hourglass },
  CLOSED: { box: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-500", Icon: CheckCircle2 },
  REOPENED: { box: "bg-orange-50 text-orange-800 ring-orange-200", dot: "bg-orange-500", bar: "bg-orange-500", Icon: RotateCcw },
  DUPLICATE: { box: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400", bar: "bg-slate-400", Icon: Copy },
  REJECTED: { box: "bg-rose-50 text-rose-800 ring-rose-200", dot: "bg-rose-500", bar: "bg-rose-500", Icon: XCircle },
};

export function StatusBadge({ status, className = "" }: { status: ComplaintStatus; className?: string }) {
  const t = TONE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${t.box} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function statusTone(status: ComplaintStatus) {
  return TONE[status];
}

const SEV: Record<Severity, string> = {
  LOW: "bg-slate-100 text-slate-700 ring-slate-200",
  MEDIUM: "bg-amber-50 text-amber-800 ring-amber-200",
  HIGH: "bg-orange-50 text-orange-800 ring-orange-200",
  CRITICAL: "bg-red-50 text-red-800 ring-red-200",
};

export function SeverityBadge({ severity }: { severity?: Severity }) {
  if (!severity) return <span className="text-slate-400">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${SEV[severity]}`}>
      {severity === "HIGH" || severity === "CRITICAL" ? <AlertTriangle className="h-3 w-3" /> : null}
      {severity.charAt(0) + severity.slice(1).toLowerCase()}
    </span>
  );
}
