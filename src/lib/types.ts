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

/** Where a report is, in the government's own terms, as far as the public map can tell. */
export interface Jurisdiction {
  status: "ok" | "partial" | "unavailable"; // unavailable = the map service could not be reached
  district: string | null;
  tehsil: string | null;
  municipality: string | null; // city or town body as mapped
  ward: string | null; // a locality name; official ward numbers are not on the public map
  thana: string | null; // the nearest police station; official thana boundaries are not on the public map
  thanaDistanceM: number | null;
  pin: string | null;
  source: "OpenStreetMap";
  lookedUpAt: string;
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
  jurisdiction?: Jurisdiction; // looked up from the coordinates when the report is registered
  mediaFiles: string[]; // relative paths under .data/media
  audioFiles: string[];
  repairChecks?: RepairCheck[];
  mediaHashes?: string[]; // sha256 of each photo, used to spot the very same picture sent twice
  duplicateCandidates?: DuplicateCandidate[]; // set when the report was created
  duplicateReviewed?: boolean; // staff looked at the candidates and decided
  duplicateOf?: { id: string; ticketId: string; by: string; at: string; reason: string }; // staff-confirmed link
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

/** An earlier complaint that looks like the same problem (a suggestion for staff, never automatic). */
export interface DuplicateCandidate {
  id: string;
  ticketId: string;
  distanceM: number;
  score: number;
  sameImage: boolean;
  reason: string;
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
  title?: string; // short label for staff, such as "Status: In progress" (older notifications have none)
  text: string;
  link?: string; // the tracking page; sent as a tap button, never pasted into the chat text
  linkLabel?: string; // the button's text
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
