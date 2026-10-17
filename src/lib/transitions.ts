import type { ComplaintStatus } from "@/lib/types";

// The single place that defines which status changes are allowed (see PROJECT_SPEC.md section 7).
export const TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  REPORTED: ["TRIAGED", "NEEDS_INFO", "REJECTED", "DUPLICATE"],
  TRIAGED: ["ASSIGNED", "NEEDS_INFO", "REJECTED", "DUPLICATE"],
  NEEDS_INFO: ["TRIAGED", "REJECTED"],
  ASSIGNED: ["IN_PROGRESS", "TRIAGED"],
  IN_PROGRESS: ["RESOLVED_PENDING_VERIFICATION", "ASSIGNED"],
  RESOLVED_PENDING_VERIFICATION: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["ASSIGNED", "IN_PROGRESS"],
  DUPLICATE: ["TRIAGED"], // undo a wrong link (a reason is required)
  REJECTED: [],
};

/** These need a written reason so the history is auditable. */
export const NEEDS_REASON: ComplaintStatus[] = ["REJECTED", "DUPLICATE", "NEEDS_INFO", "REOPENED", "TRIAGED"];

export const ALL_STATUSES = Object.keys(TRANSITIONS) as ComplaintStatus[];

export function isStatus(value: unknown): value is ComplaintStatus {
  return typeof value === "string" && (ALL_STATUSES as string[]).includes(value);
}

export function canTransition(from: ComplaintStatus, to: ComplaintStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Plain-language label shown to citizens. */
export const STATUS_LABEL: Record<ComplaintStatus, string> = {
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
