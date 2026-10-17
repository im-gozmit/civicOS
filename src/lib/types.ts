export type ComplaintStatus =
  | "REPORTED"
  | "TRIAGED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED_PENDING_VERIFICATION"
  | "CLOSED"
  | "REOPENED"
  | "NEEDS_INFO"
  | "DUPLICATE"
  | "REJECTED";

export type Category =
  | "ROAD_DAMAGE"
  | "GARBAGE"
  | "DRAINAGE"
  | "WATER_SUPPLY"
  | "STREET_LIGHT"
  | "OTHER";

export interface HistoryEntry {
  status: ComplaintStatus;
  note: string;
  actor: "system" | "citizen" | "admin";
  at: string;
}

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** Which team handles the complaint, and whether a staff member has verified the AI suggestion. */
export interface Assignment {
  suggestedTeam: string; // TeamId suggested by AI or by rules
  suggestedBy: "ai" | "rules";
  reason: string;
  state: "PENDING_VERIFICATION" | "CONFIRMED" | "CORRECTED";
  finalTeam: string | null; // set once a person verifies
  verifiedBy: string | null;
  verifiedAt: string | null;
  correctionNote: string | null;
}

export interface Complaint {
  id: string;
  ticketId: string; // human-readable, guessable: never an authorization secret
  trackingToken: string; // unguessable: authorizes the citizen's own tracking view
  source: "whatsapp" | "web";
  senderKey: string; // WhatsApp user id; links complaints to the reporter
  senderPhone: string; // SPIKE ONLY: stored plain in a local file; encrypt before any real database
  caption: string;
  category: Category;
  title: string;
  queue: string; // label of the current (suggested or confirmed) demo team
  assignment?: Assignment; // missing on complaints created before this existed
  summary: string; // plain-English summary (AI-suggested or built from the caption)
  severity: Severity; // suggestion only
  hazards: string[];
  needsHumanReview: boolean;
  reviewReason: string | null;
  aiProvider: string | null; // null = keyword fallback, no AI used
  aiModel: string | null;
  status: ComplaintStatus;
  latitude: number;
  longitude: number;
  mediaFiles: string[]; // relative paths under .data/media
  audioFiles: string[];
  repairChecks?: RepairCheck[];
  voice?: { transcript: string; english: string; language: string; provider: string }; // from the voice note, if any
  createdAt: string;
  history: HistoryEntry[];
  internalNotes?: Array<{ at: string; by: string; text: string }>; // admin-only, never public
}

/** An "after repair" photo uploaded by staff, with the AI's advisory opinion about it. */
export interface RepairCheck {
  file: string;
  sha256: string;
  uploadedBy: string;
  at: string;
  verdict: "looks_repaired" | "partially_repaired" | "not_repaired" | "cannot_tell";
  reason: string;
  aiProvider: string | null;
  aiModel: string | null;
}

export interface PendingReport {
  caption: string;
  mediaFiles: string[];
  audioFiles: string[];
  startedAt: string;
}

export interface Notification {
  id: string;
  complaintId: string;
  text: string;
  state: "PENDING" | "SENT" | "FAILED";
  attempts: number;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
}

export interface Conversation {
  senderKey: string;
  phone: string;
  state: "IDLE" | "AWAITING_LOCATION";
  lastInboundAt?: string; // WhatsApp free-form replies are only allowed within 24h of this
  pending?: PendingReport;
  lastLocation?: { latitude: number; longitude: number; at: string };
  updatedAt: string;
}
