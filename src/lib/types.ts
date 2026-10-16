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
  queue: string; // internal demo queue, not a government system
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
  createdAt: string;
  history: HistoryEntry[];
}

export interface PendingReport {
  caption: string;
  mediaFiles: string[];
  audioFiles: string[];
  startedAt: string;
}

export interface Conversation {
  senderKey: string;
  phone: string;
  state: "IDLE" | "AWAITING_LOCATION";
  pending?: PendingReport;
  lastLocation?: { latitude: number; longitude: number; at: string };
  updatedAt: string;
}
