import { randomBytes, randomUUID } from "crypto";
import { withStore } from "@/lib/localStore";
import type { Category, Complaint, HistoryEntry, Severity } from "@/lib/types";

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
