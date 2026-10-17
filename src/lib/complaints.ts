import { randomBytes, randomUUID } from "crypto";
import { withStore } from "@/lib/localStore";
import { canTransition, NEEDS_REASON, STATUS_LABEL } from "@/lib/transitions";
import { findDuplicateCandidates } from "@/lib/duplicates";
import { DEFAULT_TEAM_FOR_CATEGORY, TEAM_IDS, TEAM_LABEL, isTeamId, teamIdFromLabel } from "@/lib/teams";
import type { TeamId } from "@/lib/teams";
import type { Assignment, Category, Complaint, ComplaintStatus, HistoryEntry, RepairCheck, Severity } from "@/lib/types";

// --- Triage (placeholder) ---------------------------------------------------------------------
// Real multimodal AI triage plugs in here later. Until then this is a deterministic keyword guess
// from the caption, and EVERY complaint is flagged for human review. The citizen is told so.

const KEYWORDS: Array<[Category, RegExp]> = [
  ["ROAD_DAMAGE", /pothole|road|sadak|सड़क|गड्ढ|gaddha|crack/i],
  ["GARBAGE", /garbage|trash|waste|kooda|kachra|कूड़ा|कचरा|dump/i],
  ["DRAINAGE", /drain|sewer|naali|nali|नाली|waterlog|overflow/i],
  ["WATER_SUPPLY", /water supply|pipeline|leak|paani|पानी|tap/i],
  ["STREET_LIGHT", /street ?light|lamp|bijli|बिजली|dark|light/i],
];

const TITLES: Record<Category, string> = {
  ROAD_DAMAGE: "Road damage reported",
  GARBAGE: "Garbage accumulation reported",
  DRAINAGE: "Drainage problem reported",
  WATER_SUPPLY: "Water supply problem reported",
  STREET_LIGHT: "Street light problem reported",
  OTHER: "Civic issue reported",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  ROAD_DAMAGE: "Road damage",
  GARBAGE: "Garbage",
  DRAINAGE: "Drainage",
  WATER_SUPPLY: "Water supply",
  STREET_LIGHT: "Street light",
  OTHER: "Other / to be reviewed",
};

/** What we know about a report after analysis (AI result, or the keyword fallback). */
export interface Analysis {
  category: Category;
  title: string;
  summary: string;
  severity: Severity;
  hazards: string[];
  suggestedTeam: TeamId;
  teamReason: string;
  teamSource: "ai" | "rules";
  needsHumanReview: boolean;
  reviewReason: string | null;
  aiProvider: string | null;
  aiModel: string | null;
}

/** Validated team for an AI suggestion; falls back to the category default if the AI chose none. */
export function resolveTeam(category: Category, suggested: unknown): TeamId {
  return isTeamId(suggested) ? suggested : DEFAULT_TEAM_FOR_CATEGORY[category];
}

/** Deterministic fallback when no AI provider returned a valid result. Always needs a human. */
export function fallbackAnalysis(caption: string): Analysis {
  const hit = KEYWORDS.find(([, re]) => re.test(caption));
  const category = hit ? hit[0] : "OTHER";
  return {
    category,
    title: TITLES[category],
    summary: caption || "Citizen photo report (no description).",
    severity: "MEDIUM",
    hazards: [],
    suggestedTeam: DEFAULT_TEAM_FOR_CATEGORY[category],
    teamReason: "Chosen from keywords in the caption (no automatic analysis).",
    teamSource: "rules",
    needsHumanReview: true,
    reviewReason: "Automatic analysis was unavailable.",
    aiProvider: null,
    aiModel: null,
  };
}

// --- Creation and lookup ----------------------------------------------------------------------

export interface NewComplaintInput {
  source: "whatsapp" | "web";
  senderKey: string;
  senderPhone: string;
  caption: string;
  latitude: number;
  longitude: number;
  mediaFiles: string[];
  audioFiles: string[];
  voice?: { transcript: string; english: string; language: string; provider: string };
  mediaHashes?: string[];
}

export async function createComplaint(input: NewComplaintInput, t: Analysis): Promise<Complaint> {
  const now = new Date().toISOString();
  return withStore((store) => {
    store.counter += 1;
    const candidates = findDuplicateCandidates(
      { latitude: input.latitude, longitude: input.longitude, category: t.category, mediaHashes: input.mediaHashes ?? [] },
      store.complaints,
    );
    const history: HistoryEntry[] = [
      { status: "REPORTED", note: `Report received via ${input.source}.`, actor: "citizen", at: now },
      {
        status: "TRIAGED",
        note: t.aiProvider
          ? `Photo analysed automatically (suggestion only)${t.needsHumanReview ? "; a person will review it" : ""}.`
          : "Registered in the CivicOS queue; a person will review it.",
        actor: "system",
        at: now,
      },
    ];
    const complaint: Complaint = {
      id: randomUUID(),
      ticketId: `CIV-${String(store.counter).padStart(6, "0")}`,
      trackingToken: randomBytes(16).toString("base64url"), // 128-bit, URL-safe
      source: input.source,
      senderKey: input.senderKey,
      senderPhone: input.senderPhone,
      caption: input.caption,
      category: t.category,
      title: t.title,
      queue: TEAM_LABEL[t.suggestedTeam],
      assignment: {
        suggestedTeam: t.suggestedTeam,
        suggestedBy: t.teamSource,
        reason: t.teamReason,
        state: "PENDING_VERIFICATION",
        finalTeam: null,
        verifiedBy: null,
        verifiedAt: null,
        correctionNote: null,
      },
      summary: t.summary,
      severity: t.severity,
      hazards: t.hazards,
      needsHumanReview: t.needsHumanReview,
      reviewReason: t.reviewReason,
      aiProvider: t.aiProvider,
      aiModel: t.aiModel,
      status: "TRIAGED",
      latitude: input.latitude,
      longitude: input.longitude,
      mediaFiles: input.mediaFiles,
      audioFiles: input.audioFiles,
      voice: input.voice,
      mediaHashes: input.mediaHashes,
      duplicateCandidates: candidates,
      createdAt: now,
      history,
    };
    store.complaints.push(complaint);
    return complaint;
  });
}

export function getByToken(token: string): Promise<Complaint | undefined> {
  return withStore((s) => s.complaints.find((c) => c.trackingToken === token));
}

export function listForSender(senderKey: string): Promise<Complaint[]> {
  return withStore((s) => s.complaints.filter((c) => c.senderKey === senderKey).slice(-5).reverse());
}

/** A sender may look up only their own complaints by ticket id. */
export function getOwnByTicket(senderKey: string, ticketId: string): Promise<Complaint | undefined> {
  return withStore((s) =>
    s.complaints.find((c) => c.senderKey === senderKey && c.ticketId.toLowerCase() === ticketId.toLowerCase()),
  );
}

// --- Admin operations -------------------------------------------------------------------------

export const ALL_QUEUES = TEAM_IDS.map((id) => TEAM_LABEL[id]);

export function listAll(): Promise<Complaint[]> {
  return withStore((s) => [...s.complaints].reverse());
}

export function getById(id: string): Promise<Complaint | undefined> {
  return withStore((s) => s.complaints.find((c) => c.id === id));
}

export type ChangeResult = { ok: true; complaint: Complaint; notificationId: string } | { ok: false; error: string };

/**
 * Validated status change. The status, the history entry and the notification-outbox row are
 * written in ONE store transaction. Delivering the WhatsApp message happens afterwards and its
 * failure never undoes the status change.
 */
export function changeStatus(
  id: string,
  to: ComplaintStatus,
  publicNote: string,
  internalNote: string,
  adminLabel: string,
  trackUrl: (c: Complaint) => string,
): Promise<ChangeResult> {
  return withStore((store) => {
    const c = store.complaints.find((x) => x.id === id);
    if (!c) return { ok: false as const, error: "Complaint not found." };
    if (!canTransition(c.status, to)) {
      return { ok: false as const, error: `Cannot move from ${c.status} to ${to}.` };
    }
    if (to === "DUPLICATE") {
      return { ok: false as const, error: "Use the duplicate review box to link this to the earlier report." };
    }
    if (to === "ASSIGNED" && from_isPendingAssignment(c)) {
      return { ok: false as const, error: "Verify the suggested team first (use Confirm or Correct team)." };
    }
    const checks = c.repairChecks ?? [];
    if ((to === "RESOLVED_PENDING_VERIFICATION" || to === "CLOSED") && checks.length === 0) {
      return { ok: false as const, error: "Upload an after-repair photo first (it is checked against the original photo)." };
    }
    if (to === "CLOSED" && checks[checks.length - 1]?.verdict === "not_repaired" && !internalNote.trim()) {
      return { ok: false as const, error: "The photo check says it does not look repaired. To close anyway, write the reason in the internal note." };
    }
    if (NEEDS_REASON.includes(to) && !publicNote.trim() && !internalNote.trim()) {
      return { ok: false as const, error: `A reason is required for ${to}.` };
    }
    const now = new Date().toISOString();
    const from = c.status;
    if (from === "DUPLICATE" && to === "TRIAGED") {
      c.duplicateOf = undefined; // staff undid a wrong link
      c.duplicateReviewed = true;
    }
    c.status = to;
    c.history.push({
      status: to,
      note: publicNote.trim() || `Status changed from ${from} to ${to}.`,
      actor: "admin",
      at: now,
    });
    // Internal notes are kept in the admin log only and never shown to the citizen.
    if (internalNote.trim()) {
      c.internalNotes = [...(c.internalNotes ?? []), { at: now, by: adminLabel, text: internalNote.trim() }];
    }
    const notificationId = randomUUID();
    store.notifications.push({
      id: notificationId,
      complaintId: c.id,
      text:
        `📣 Update on ${c.ticketId}: ${STATUS_LABEL[to]}.` +
        (publicNote.trim() ? `\n${publicNote.trim()}` : "") +
        `\nTrack: ${trackUrl(c)}`,
      state: "PENDING",
      attempts: 0,
      lastError: null,
      createdAt: now,
      sentAt: null,
    });
    return { ok: true as const, complaint: structuredClone(c), notificationId };
  });
}

export function assignQueue(id: string, queue: string, adminLabel: string): Promise<ChangeResult | { ok: false; error: string }> {
  return withStore((store) => {
    const c = store.complaints.find((x) => x.id === id);
    if (!c) return { ok: false as const, error: "Complaint not found." };
    if (!ALL_QUEUES.includes(queue)) return { ok: false as const, error: "Unknown queue." };
    if (from_isPendingAssignment(c)) return { ok: false as const, error: "Verify the suggested team first." };
    c.queue = queue;
    if (c.assignment) c.assignment.finalTeam = teamIdFromLabel(queue);
    const now = new Date().toISOString();
    c.history.push({ status: c.status, note: `Moved to ${queue}.`, actor: "admin", at: now });
    c.internalNotes = [...(c.internalNotes ?? []), { at: now, by: adminLabel, text: `Queue set to ${queue}` }];
    return { ok: true as const, complaint: structuredClone(c), notificationId: "" };
  });
}

// --- Team verification ------------------------------------------------------------------------

/** Legacy complaints (before assignments existed) are treated as pending while still TRIAGED. */
export function assignmentOf(c: Complaint): Assignment {
  if (c.assignment) return c.assignment;
  const team = teamIdFromLabel(c.queue);
  return {
    suggestedTeam: team,
    suggestedBy: "rules",
    reason: "Created before team suggestions existed.",
    state: c.status === "TRIAGED" ? "PENDING_VERIFICATION" : "CONFIRMED",
    finalTeam: c.status === "TRIAGED" ? null : team,
    verifiedBy: null,
    verifiedAt: null,
    correctionNote: null,
  };
}

function from_isPendingAssignment(c: Complaint): boolean {
  return c.status === "TRIAGED" && assignmentOf(c).state === "PENDING_VERIFICATION";
}

export type VerifyResult = { ok: true; complaint: Complaint; notificationId: string } | { ok: false; error: string };

/**
 * A staff member confirms the suggested team, or corrects it. Only now does the complaint become
 * ASSIGNED and only now is the citizen told which team has it. One transaction: assignment,
 * status, history and the notification-outbox row are saved together.
 */
export function verifyAssignment(
  id: string,
  action: "confirm" | "correct",
  team: string | undefined,
  note: string,
  adminLabel: string,
  trackUrl: (c: Complaint) => string,
): Promise<VerifyResult> {
  return withStore((store) => {
    const c = store.complaints.find((x) => x.id === id);
    if (!c) return { ok: false as const, error: "Complaint not found." };
    if (!from_isPendingAssignment(c)) return { ok: false as const, error: "This complaint is not waiting for team verification." };

    const current = assignmentOf(c);
    let finalTeam: TeamId = current.suggestedTeam as TeamId;
    let state: Assignment["state"] = "CONFIRMED";
    if (action === "correct") {
      if (!isTeamId(team)) return { ok: false as const, error: "Choose a valid team." };
      if (team === current.suggestedTeam) return { ok: false as const, error: "That is already the suggested team; use Confirm." };
      finalTeam = team;
      state = "CORRECTED";
    }
    const now = new Date().toISOString();
    c.assignment = {
      ...current,
      state,
      finalTeam,
      verifiedBy: adminLabel,
      verifiedAt: now,
      correctionNote: state === "CORRECTED" ? note.trim() || null : null,
    };
    c.queue = TEAM_LABEL[finalTeam];
    c.status = "ASSIGNED";
    c.history.push({
      status: "ASSIGNED",
      note: `Reviewed by staff and assigned to ${TEAM_LABEL[finalTeam]}.`,
      actor: "admin",
      at: now,
    });
    c.internalNotes = [
      ...(c.internalNotes ?? []),
      {
        at: now,
        by: adminLabel,
        text:
          state === "CONFIRMED"
            ? `Confirmed suggested team ${TEAM_LABEL[finalTeam]}`
            : `Corrected team from ${TEAM_LABEL[current.suggestedTeam as TeamId]} to ${TEAM_LABEL[finalTeam]}${note.trim() ? `: ${note.trim()}` : ""}`,
      },
    ];
    const notificationId = randomUUID();
    store.notifications.push({
      id: notificationId,
      complaintId: c.id,
      text:
        `📣 Update on ${c.ticketId}: your report has been reviewed by staff and assigned to ${TEAM_LABEL[finalTeam]}.` +
        `
Track: ${trackUrl(c)}`,
      state: "PENDING",
      attempts: 0,
      lastError: null,
      createdAt: now,
      sentAt: null,
    });
    return { ok: true as const, complaint: structuredClone(c), notificationId };
  });
}

/** How often staff accepted the AI/rules team suggestion. Useful to judge how good it is. */
export function assignmentStats(): Promise<{ pending: number; confirmed: number; corrected: number }> {
  return withStore((s) => {
    let pending = 0, confirmed = 0, corrected = 0;
    for (const c of s.complaints) {
      const st = assignmentOf(c).state;
      if (st === "PENDING_VERIFICATION") {
        if (c.status === "TRIAGED") pending++;
      }
      else if (st === "CONFIRMED") confirmed++;
      else corrected++;
    }
    return { pending, confirmed, corrected };
  });
}

// --- Linking a website complaint to a WhatsApp number -----------------------------------------

/**
 * "TRACK CIV-000012 <token>" sent to the bot proves the sender holds the tracking link, so their
 * WhatsApp number may receive updates for that complaint. Only unbound web complaints can be linked.
 */
export function bindToSender(ticketId: string, token: string, senderKey: string, phone: string): Promise<Complaint | undefined> {
  return withStore((s) => {
    const c = s.complaints.find((x) => x.ticketId.toLowerCase() === ticketId.toLowerCase());
    if (!c || c.trackingToken !== token) return undefined;
    if (!c.senderKey.startsWith("web:")) return undefined; // already linked to a real sender
    c.senderKey = senderKey;
    c.senderPhone = phone;
    c.history.push({ status: c.status, note: "WhatsApp updates switched on for this complaint.", actor: "citizen", at: new Date().toISOString() });
    return structuredClone(c);
  });
}

// --- Repair evidence --------------------------------------------------------------------------

export function getRepairContext(id: string): Promise<{ status: ComplaintStatus; summary: string; before: string[]; shas: string[] } | undefined> {
  return withStore((s) => {
    const c = s.complaints.find((x) => x.id === id);
    if (!c) return undefined;
    return { status: c.status, summary: c.summary || c.title, before: [...c.mediaFiles], shas: (c.repairChecks ?? []).map((r) => r.sha256) };
  });
}

export function addRepairCheck(id: string, check: RepairCheck): Promise<boolean> {
  return withStore((s) => {
    const c = s.complaints.find((x) => x.id === id);
    if (!c) return false;
    c.repairChecks = [...(c.repairChecks ?? []), check];
    c.history.push({ status: c.status, note: "Repair photo added by staff.", actor: "admin", at: check.at });
    c.internalNotes = [
      ...(c.internalNotes ?? []),
      { at: check.at, by: check.uploadedBy, text: "Photo check (" + (check.aiProvider ?? "no AI") + "): " + check.verdict + ". " + check.reason },
    ];
    return true;
  });
}

// --- Duplicate review -------------------------------------------------------------------------

export type DuplicateResult = { ok: true; complaint: Complaint; notificationId: string | null } | { ok: false; error: string };

/** Staff say "this is the same problem as <primary>". The report is kept, just linked. */
export function linkDuplicate(
  id: string,
  primaryTicketId: string,
  note: string,
  adminLabel: string,
  trackUrl: (c: Complaint) => string,
): Promise<DuplicateResult> {
  return withStore((store) => {
    const c = store.complaints.find((x) => x.id === id);
    if (!c) return { ok: false as const, error: "Complaint not found." };
    if (!canTransition(c.status, "DUPLICATE")) return { ok: false as const, error: "This complaint can no longer be marked as a duplicate." };
    const primary = store.complaints.find((x) => x.ticketId.toLowerCase() === primaryTicketId.toLowerCase());
    if (!primary) return { ok: false as const, error: "Earlier report not found." };
    if (primary.id === c.id) return { ok: false as const, error: "A report cannot be a duplicate of itself." };
    if (primary.status === "DUPLICATE" || primary.duplicateOf) return { ok: false as const, error: "Link to the main report, not to another duplicate." };
    if (primary.status === "REJECTED") return { ok: false as const, error: "Cannot link to a rejected report." };

    const now = new Date().toISOString();
    c.status = "DUPLICATE";
    c.duplicateReviewed = true;
    c.duplicateOf = { id: primary.id, ticketId: primary.ticketId, by: adminLabel, at: now, reason: note.trim() || "Same problem at the same spot." };
    c.history.push({ status: "DUPLICATE", note: "Linked to an earlier report of the same problem.", actor: "admin", at: now });
    c.internalNotes = [...(c.internalNotes ?? []), { at: now, by: adminLabel, text: "Marked as duplicate of " + primary.ticketId + (note.trim() ? ": " + note.trim() : "") }];
    primary.internalNotes = [...(primary.internalNotes ?? []), { at: now, by: adminLabel, text: c.ticketId + " was linked to this report as a duplicate" }];

    const notificationId = randomUUID();
    store.notifications.push({
      id: notificationId,
      complaintId: c.id,
      text: "📣 Update on " + c.ticketId + ": it is the same problem as an earlier report, so staff linked them and will handle it together. Your complaint stays on record.\nTrack: " + trackUrl(c),
      state: "PENDING",
      attempts: 0,
      lastError: null,
      createdAt: now,
      sentAt: null,
    });
    return { ok: true as const, complaint: structuredClone(c), notificationId };
  });
}

/** Staff looked at the suggested matches and decided they are different problems. */
export function dismissDuplicates(id: string, adminLabel: string): Promise<boolean> {
  return withStore((store) => {
    const c = store.complaints.find((x) => x.id === id);
    if (!c) return false;
    c.duplicateReviewed = true;
    const now = new Date().toISOString();
    c.internalNotes = [...(c.internalNotes ?? []), { at: now, by: adminLabel, text: "Reviewed possible duplicates: not the same problem" }];
    return true;
  });
}

/** Reports that staff linked to this one. */
export function linkedReportsOf(id: string): Promise<Array<{ id: string; ticketId: string }>> {
  return withStore((s) => s.complaints.filter((x) => x.duplicateOf?.id === id).map((x) => ({ id: x.id, ticketId: x.ticketId })));
}

export function needsDuplicateReview(c: Complaint): boolean {
  return !c.duplicateReviewed && (c.duplicateCandidates?.length ?? 0) > 0 && ["REPORTED", "TRIAGED", "NEEDS_INFO"].includes(c.status);
}
