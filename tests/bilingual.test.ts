import { describe, expect, it } from "vitest";
import { duplicateLinkedContent, statusUpdateContent, teamConfirmedContent } from "@/lib/notificationText";
import { R, successText } from "@/lib/whatsapp/replies";
import { ALL_STATUSES, STATUS_LABEL } from "@/lib/transitions";
import { STATUS_LABEL_HI } from "@/lib/hindi";
import type { Complaint } from "@/lib/types";

const hindi = /[ऀ-ॿ]/;

describe("every update goes out in English and Hindi, with no link in the chat text", () => {
  it("status updates say the status in both languages and carry staff's note in both", () => {
    const c = statusUpdateContent("CIV-000042", "IN_PROGRESS", "Work starts tomorrow.");
    expect(c.text).toContain("Update on CIV-000042: Work in progress.");
    expect(c.text).toContain("काम चल रहा है");
    expect(c.text.match(/Work starts tomorrow\./g)).toHaveLength(2); // staff write one note; it is shown under each language
    expect(c.text).not.toMatch(/https?:\/\//);
    expect(c.linkLabel.length).toBeLessThanOrEqual(20);
    expect(c.title).toBe("Status: Work in progress");
  });

  it("has a Hindi name for every status", () => {
    for (const s of ALL_STATUSES) {
      expect(STATUS_LABEL_HI[s]).toMatch(hindi);
      expect(statusUpdateContent("CIV-1", s, "").text).toContain(STATUS_LABEL[s]);
    }
  });

  it("team and duplicate updates are bilingual too", () => {
    const t = teamConfirmedContent("CIV-000042", "SANITATION");
    expect(t.text).toContain("assigned to Sanitation (demo queue)");
    expect(t.text).toContain("स्वच्छता (डेमो कतार)");
    const d = duplicateLinkedContent("CIV-000042");
    expect(d.text).toMatch(hindi);
    expect(d.text).toContain("same problem");
    for (const x of [t, d]) expect(x.text).not.toMatch(/https?:\/\//);
  });

  const complaint = {
    ticketId: "CIV-000042",
    trackingToken: "tok",
    category: "ROAD_DAMAGE",
    queue: "Roads & Public Works (demo queue)",
    severity: "HIGH",
    summary: "A deep pothole ".repeat(30),
    needsHumanReview: true,
    voice: { english: "There is a big hole near the school ".repeat(10), transcript: "", language: "hi", provider: "x" },
    duplicateCandidates: [{}],
    status: "TRIAGED",
    title: "Pothole",
  } as unknown as Complaint;

  it("the 'registered' message is bilingual, has no link, and fits WhatsApp's 1024-character button message even with long inputs", () => {
    const text = successText(complaint);
    expect(text).toContain("Complaint registered: *CIV-000042*");
    expect(text).toContain("शिकायत दर्ज हो गई: *CIV-000042*");
    expect(text).toContain("सड़क की खराबी");
    expect(text).toContain("अधिक");
    expect(text).not.toMatch(/https?:\/\//);
    expect(text.length).toBeLessThanOrEqual(1024);
  });

  it("status and list replies show readable status names in both languages, never raw codes", () => {
    const line = R.statusLine(complaint);
    expect(line).toContain("Registered, awaiting review");
    expect(line).toContain("दर्ज, समीक्षा बाकी");
    expect(line).not.toContain("TRIAGED");
    const list = R.complaintList([complaint]);
    expect(list).toContain("Your recent complaints");
    expect(list).toContain("आपकी हाल की शिकायतें");
  });

  it("the fixed replies are all bilingual", () => {
    const fixed = [R.photoDownloadFailed, R.photoAdded, R.gotPhoto, R.gotLocation, R.voiceNeedsPhoto, R.voiceDownloadFailed, R.voiceAdded, R.voiceOrphan, R.noted, R.onlyMedia, R.analysingPhoto, R.analysingPhotoVoice, R.unusable, R.trackFailed, R.statusNotFound, R.noComplaints, R.notCivic("a selfie"), R.trackOn("CIV-1")];
    for (const m of fixed) {
      expect(m).toMatch(hindi);
      expect(m).toMatch(/[A-Za-z]/);
      expect(m).not.toMatch(/https?:\/\//);
    }
  });
});
