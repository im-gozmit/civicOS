import { createHmac } from "crypto";
import { beforeAll, describe, expect, it } from "vitest";

// DATA_DIR and the other test env values are set in tests/setup.ts, before anything is imported.

import { canTransition, NEEDS_REASON, TRANSITIONS } from "@/lib/transitions";
import { verifyMetaSignature } from "@/lib/whatsapp/signature";
import { sniffAudio, sniffImage } from "@/lib/uploads";
import { allow } from "@/lib/rateLimit";
import { checkCredentials, createSessionToken, verifySessionToken } from "@/lib/adminAuth";
import type { Analysis } from "@/lib/complaints";
import type { RepairCheck } from "@/lib/types";

const trackUrl = () => "https://example.test/t/x";

const analysis = (over: Partial<Analysis> = {}): Analysis => ({
  category: "ROAD_DAMAGE",
  title: "Road damage",
  summary: "A pothole.",
  severity: "HIGH",
  hazards: [],
  suggestedTeam: "ROADS_PUBLIC_WORKS",
  teamReason: "Pothole on a road.",
  teamSource: "ai",
  needsHumanReview: false,
  reviewReason: null,
  aiProvider: "gemini",
  aiModel: "test",
  ...over,
});

const newComplaint = async (source: "whatsapp" | "web" = "whatsapp", senderKey = "IN.TEST1") => {
  const { createComplaint } = await import("@/lib/complaints");
  return createComplaint(
    { source, senderKey, senderPhone: "910000000000", caption: "x", latitude: 25.4, longitude: 81.8, mediaFiles: ["a.jpg"], audioFiles: [] },
    analysis(),
  );
};

describe("status transitions", () => {
  it("allows the normal path and rejects shortcuts", () => {
    expect(canTransition("TRIAGED", "ASSIGNED")).toBe(true);
    expect(canTransition("ASSIGNED", "IN_PROGRESS")).toBe(true);
    expect(canTransition("IN_PROGRESS", "RESOLVED_PENDING_VERIFICATION")).toBe(true);
    expect(canTransition("RESOLVED_PENDING_VERIFICATION", "CLOSED")).toBe(true);
    expect(canTransition("TRIAGED", "CLOSED")).toBe(false);
    expect(canTransition("REPORTED", "IN_PROGRESS")).toBe(false);
  });
  it("has no way out of terminal states except reopening a closed one", () => {
    expect(TRANSITIONS.REJECTED).toEqual([]);
    expect(TRANSITIONS.DUPLICATE).toEqual([]);
    expect(TRANSITIONS.CLOSED).toEqual(["REOPENED"]);
  });
  it("requires a reason for reject, duplicate, needs-info and reopen", () => {
    expect(NEEDS_REASON).toEqual(expect.arrayContaining(["REJECTED", "DUPLICATE", "NEEDS_INFO", "REOPENED"]));
  });
});

describe("WhatsApp webhook signature", () => {
  const body = '{"entry":[]}';
  const good = "sha256=" + createHmac("sha256", "secret").update(body).digest("hex");
  it("accepts a correct signature", () => expect(verifyMetaSignature(body, good, "secret")).toBe(true));
  it("rejects a wrong secret, missing header, tampered body and bad format", () => {
    expect(verifyMetaSignature(body, good, "other")).toBe(false);
    expect(verifyMetaSignature(body, null, "secret")).toBe(false);
    expect(verifyMetaSignature(body + " ", good, "secret")).toBe(false);
    expect(verifyMetaSignature(body, "deadbeef", "secret")).toBe(false);
  });
});

describe("upload sniffing (type comes from the bytes, not the name)", () => {
  const pad = (b: number[]) => Buffer.concat([Buffer.from(b), Buffer.alloc(16)]);
  it("recognises real images and audio", () => {
    expect(sniffImage(pad([0xff, 0xd8, 0xff, 0xe0]))?.ext).toBe("jpg");
    expect(sniffImage(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.ext).toBe("png");
    expect(sniffAudio(Buffer.concat([Buffer.from("OggS"), Buffer.alloc(16)]))?.ext).toBe("ogg");
    expect(sniffAudio(pad([0x1a, 0x45, 0xdf, 0xa3]))?.ext).toBe("webm");
  });
  it("rejects text, scripts and short files", () => {
    expect(sniffImage(Buffer.from("this is not an image at all"))).toBeNull();
    expect(sniffImage(Buffer.from("<script>alert(1)</script>"))).toBeNull();
    expect(sniffImage(Buffer.from([0xff, 0xd8]))).toBeNull();
    expect(sniffAudio(Buffer.from("plain text, not audio at all"))).toBeNull();
  });
});

describe("rate limiting", () => {
  it("blocks after the limit and counts keys separately", () => {
    expect(allow("k1", 2, 1000)).toBe(true);
    expect(allow("k1", 2, 1000)).toBe(true);
    expect(allow("k1", 2, 1000)).toBe(false);
    expect(allow("k2", 2, 1000)).toBe(true);
  });
});

describe("admin login and session", () => {
  it("checks credentials", () => {
    expect(checkCredentials("admin@example.com", "correct-horse-battery")).toBe(true);
    expect(checkCredentials("ADMIN@example.com ", "correct-horse-battery")).toBe(true);
    expect(checkCredentials("admin@example.com", "wrong")).toBe(false);
    expect(checkCredentials("someone@else.com", "correct-horse-battery")).toBe(false);
  });
  it("accepts its own token and rejects tampered or missing ones", () => {
    const token = createSessionToken("admin@example.com");
    expect(verifySessionToken(token)?.email).toBe("admin@example.com");
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ email: "attacker@example.com", exp: Date.now() + 1e9 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${sig}`)).toBeNull();
    expect(verifySessionToken(`${payload}.AAAA`)).toBeNull();
    expect(verifySessionToken(undefined)).toBeNull();
  });
});

describe("complaints: team verification and notifications", () => {
  beforeAll(async () => {
    await import("@/lib/localStore"); // make sure DATA_DIR was picked up
  });

  it("starts as TRIAGED with the team only suggested, and a unique ticket + tracking token", async () => {
    const a = await newComplaint();
    const b = await newComplaint();
    expect(a.status).toBe("TRIAGED");
    expect(a.assignment?.state).toBe("PENDING_VERIFICATION");
    expect(a.ticketId).not.toBe(b.ticketId);
    expect(a.trackingToken).not.toBe(b.trackingToken);
    expect(a.trackingToken.length).toBeGreaterThanOrEqual(20);
  });

  it("blocks ASSIGNED and queue changes until staff verify the team", async () => {
    const { changeStatus, assignQueue } = await import("@/lib/complaints");
    const c = await newComplaint();
    const r1 = await changeStatus(c.id, "ASSIGNED", "", "", "admin", trackUrl);
    expect(r1.ok).toBe(false);
    const r2 = await assignQueue(c.id, "Sanitation (demo queue)", "admin");
    expect(r2.ok).toBe(false);
  });

  it("confirm: moves to ASSIGNED and queues exactly one citizen notification", async () => {
    const { verifyAssignment } = await import("@/lib/complaints");
    const { withStore } = await import("@/lib/localStore");
    const c = await newComplaint();
    const before = await withStore((s) => s.notifications.length);
    const r = await verifyAssignment(c.id, "confirm", undefined, "", "admin", trackUrl);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.complaint.status).toBe("ASSIGNED");
      expect(r.complaint.assignment?.state).toBe("CONFIRMED");
    }
    expect(await withStore((s) => s.notifications.length)).toBe(before + 1);
    // a second verification must fail and must not send another message
    const again = await verifyAssignment(c.id, "confirm", undefined, "", "admin", trackUrl);
    expect(again.ok).toBe(false);
    expect(await withStore((s) => s.notifications.length)).toBe(before + 1);
  });

  it("correct: needs a valid, different team and records the change", async () => {
    const { verifyAssignment } = await import("@/lib/complaints");
    const c = await newComplaint();
    expect((await verifyAssignment(c.id, "correct", "NOT_A_TEAM", "", "admin", trackUrl)).ok).toBe(false);
    expect((await verifyAssignment(c.id, "correct", "ROADS_PUBLIC_WORKS", "", "admin", trackUrl)).ok).toBe(false); // same as suggested
    const r = await verifyAssignment(c.id, "correct", "SANITATION", "It is a garbage pile", "admin", trackUrl);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.complaint.assignment?.state).toBe("CORRECTED");
      expect(r.complaint.assignment?.finalTeam).toBe("SANITATION");
      expect(r.complaint.queue).toContain("Sanitation");
    }
  });

  it("keeps internal notes out of the citizen-visible history and notification", async () => {
    const { verifyAssignment } = await import("@/lib/complaints");
    const { withStore } = await import("@/lib/localStore");
    const c = await newComplaint();
    const r = await verifyAssignment(c.id, "correct", "DRAINAGE", "SECRET-INTERNAL-REASON", "admin", trackUrl);
    expect(r.ok).toBe(true);
    if (r.ok) expect(JSON.stringify(r.complaint.history)).not.toContain("SECRET-INTERNAL-REASON");
    const last = await withStore((s) => s.notifications.at(-1));
    expect(last?.text).not.toContain("SECRET-INTERNAL-REASON");
  });

  it("rejects invalid transitions and missing reasons", async () => {
    const { verifyAssignment, changeStatus } = await import("@/lib/complaints");
    const c = await newComplaint();
    await verifyAssignment(c.id, "confirm", undefined, "", "admin", trackUrl);
    expect((await changeStatus(c.id, "CLOSED", "", "", "admin", trackUrl)).ok).toBe(false); // ASSIGNED -> CLOSED
    const noReason = await changeStatus(c.id, "TRIAGED", "", "", "admin", trackUrl); // allowed move, fine
    expect(noReason.ok).toBe(true);
    const rej = await changeStatus(c.id, "REJECTED", "", "", "admin", trackUrl);
    expect(rej.ok).toBe(false); // reason required
    const rej2 = await changeStatus(c.id, "REJECTED", "Not a civic issue", "", "admin", trackUrl);
    expect(rej2.ok).toBe(true);
  });
});

describe("complaints: repair evidence rules", () => {
  const check = (verdict: RepairCheck["verdict"]): RepairCheck => ({
    file: "after-1.jpg",
    sha256: "abc" + verdict,
    uploadedBy: "admin",
    at: new Date().toISOString(),
    verdict,
    reason: "test",
    aiProvider: "gemini",
    aiModel: "test",
  });

  const toInProgress = async () => {
    const { verifyAssignment, changeStatus } = await import("@/lib/complaints");
    const c = await newComplaint();
    await verifyAssignment(c.id, "confirm", undefined, "", "admin", trackUrl);
    await changeStatus(c.id, "IN_PROGRESS", "", "", "admin", trackUrl);
    return c;
  };

  it("cannot mark resolved or close without an after-repair photo", async () => {
    const { changeStatus } = await import("@/lib/complaints");
    const c = await toInProgress();
    expect((await changeStatus(c.id, "RESOLVED_PENDING_VERIFICATION", "", "", "admin", trackUrl)).ok).toBe(false);
  });

  it("closing against an AI 'not repaired' opinion needs a written reason", async () => {
    const { addRepairCheck, changeStatus } = await import("@/lib/complaints");
    const c = await toInProgress();
    await addRepairCheck(c.id, check("not_repaired"));
    expect((await changeStatus(c.id, "RESOLVED_PENDING_VERIFICATION", "", "", "admin", trackUrl)).ok).toBe(true);
    expect((await changeStatus(c.id, "CLOSED", "Closed", "", "admin", trackUrl)).ok).toBe(false);
    expect((await changeStatus(c.id, "CLOSED", "Closed", "Inspected on site, it is fixed", "admin", trackUrl)).ok).toBe(true);
  });

  it("closes normally when the opinion is 'looks repaired'", async () => {
    const { addRepairCheck, changeStatus } = await import("@/lib/complaints");
    const c = await toInProgress();
    await addRepairCheck(c.id, check("looks_repaired"));
    await changeStatus(c.id, "RESOLVED_PENDING_VERIFICATION", "", "", "admin", trackUrl);
    expect((await changeStatus(c.id, "CLOSED", "Done", "", "admin", trackUrl)).ok).toBe(true);
  });
});

describe("linking a website complaint to WhatsApp", () => {
  it("links only with the right token, only once", async () => {
    const { bindToSender } = await import("@/lib/complaints");
    const c = await newComplaint("web", "web:abc");
    expect(await bindToSender(c.ticketId, "wrong-token-wrong-token", "IN.A", "910000000001")).toBeUndefined();
    const ok = await bindToSender(c.ticketId, c.trackingToken, "IN.A", "910000000001");
    expect(ok?.senderKey).toBe("IN.A");
    expect(await bindToSender(c.ticketId, c.trackingToken, "IN.ATTACKER", "910000000002")).toBeUndefined();
  });
  it("never links a complaint that already belongs to a WhatsApp sender", async () => {
    const { bindToSender } = await import("@/lib/complaints");
    const c = await newComplaint("whatsapp", "IN.OWNER");
    expect(await bindToSender(c.ticketId, c.trackingToken, "IN.THIEF", "910000000003")).toBeUndefined();
  });
});
