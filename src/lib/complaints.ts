import { randomBytes, randomUUID } from "crypto";
import { withStore } from "@/lib/localStore";
import { canTransition, NEEDS_REASON, STATUS_LABEL } from "@/lib/transitions";
import type { Category, Complaint, ComplaintStatus, HistoryEntry, Severity } from "@/lib/types";

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

const QUEUES: Record<Category, string> = {
  ROAD_DAMAGE: "Roads & Public Works (demo queue)",
  GARBAGE: "Sanitation (demo queue)",
  DRAINAGE: "Drainage (demo queue)",
  WATER_SUPPLY: "Water Supply (demo queue)",
  STREET_LIGHT: "Electricity & Street Lights (demo queue)",
  OTHER: "General Administration (demo queue)",
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
  queue: string;
  needsHumanReview: boolean;
  reviewReason: string | null;
  aiProvider: string | null;
  aiModel: string | null;
}

export function queueFor(category: Category): string {
  return QUEUES[category];
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
    queue: QUEUES[category],
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
}

export async function createComplaint(input: NewComplaintInput, t: Analysis): Promise<Complaint> {
  const now = new Date().toISOString();
  return withStore((store) => {
    store.counter += 1;
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
      queue: t.queue,
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

export const ALL_QUEUES = Array.from(new Set(Object.values(QUEUES)));

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
    if (NEEDS_REASON.includes(to) && !publicNote.trim() && !internalNote.trim()) {
      return { ok: false as const, error: `A reason is required for ${to}.` };
    }
    const now = new Date().toISOString();
    const from = c.status;
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
    c.queue = queue;
    const now = new Date().toISOString();
    c.history.push({ status: c.status, note: `Moved to ${queue}.`, actor: "admin", at: now });
    c.internalNotes = [...(c.internalNotes ?? []), { at: now, by: adminLabel, text: `Queue set to ${queue}` }];
    return { ok: true as const, complaint: structuredClone(c), notificationId: "" };
  });
}
