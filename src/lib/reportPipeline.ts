import path from "path";
import { MEDIA_DIR } from "@/lib/localStore";
import { createComplaint, fallbackAnalysis, resolveTeam } from "@/lib/complaints";
import type { Analysis } from "@/lib/complaints";
import { runTriage } from "@/lib/ai/triage";
import { logEvent } from "@/lib/whatsapp/eventLog";
import type { Complaint } from "@/lib/types";

// The ONE pipeline both channels use: AI looks at the photo + text, decides whether it is a civic
// issue and which team should handle it, then the complaint is registered (awaiting staff
// verification). WhatsApp and the website only differ in how they collect input and word replies.

export interface ReportInput {
  source: "whatsapp" | "web";
  senderKey: string;
  senderPhone: string;
  caption: string;
  mediaFiles: string[];
  audioFiles: string[];
  latitude: number;
  longitude: number;
  transcript?: string;
}

export type ReportResult =
  | { ok: true; complaint: Complaint }
  | { ok: false; code: "NOT_CIVIC" | "UNUSABLE"; seen: string };

function mimeFor(file: string) {
  return /\.png$/i.test(file) ? "image/png" : /\.webp$/i.test(file) ? "image/webp" : "image/jpeg";
}

async function analyse(input: ReportInput): Promise<{ analysis: Analysis } | { reject: "NOT_CIVIC" | "UNUSABLE"; seen: string }> {
  const first = input.mediaFiles[0];
  const run = await runTriage(
    { imagePath: path.join(MEDIA_DIR, first), mimeType: mimeFor(first), caption: input.caption, transcript: input.transcript },
    (e) => void logEvent(e),
  ).catch((err) => {
    console.error("[report] triage failed", err);
    return null;
  });
  if (!run) return { analysis: fallbackAnalysis(input.caption || input.transcript || "") };

  const r = run.result;
  if (!r.isCivicIssue) return { reject: "NOT_CIVIC", seen: r.summaryEn };
  if (r.photoQuality === "UNUSABLE") return { reject: "UNUSABLE", seen: r.summaryEn };
  return {
    analysis: {
      category: r.issueType,
      title: r.titleEn,
      summary: r.summaryEn,
      severity: r.severity,
      hazards: r.hazards,
      suggestedTeam: resolveTeam(r.issueType, r.suggestedTeam),
      teamReason: r.teamReason,
      teamSource: "ai",
      needsHumanReview: r.needsHumanReview || r.photoQuality === "POOR" || !r.captionConsistentWithPhoto,
      reviewReason: r.reviewReason,
      aiProvider: run.provider,
      aiModel: run.model,
    },
  };
}

export async function processReport(input: ReportInput): Promise<ReportResult> {
  if (input.mediaFiles.length === 0) return { ok: false, code: "UNUSABLE", seen: "No photo was provided." };
  const outcome = await analyse(input);
  if ("reject" in outcome) return { ok: false, code: outcome.reject, seen: outcome.seen };
  const complaint = await createComplaint(
    {
      source: input.source,
      senderKey: input.senderKey,
      senderPhone: input.senderPhone,
      caption: input.caption,
      latitude: input.latitude,
      longitude: input.longitude,
      mediaFiles: input.mediaFiles,
      audioFiles: input.audioFiles,
    },
    outcome.analysis,
  );
  return { ok: true, complaint };
}
