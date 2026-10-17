import { beforeEach, describe, expect, it, vi } from "vitest";

// The WhatsApp conversation is tested with the outside world replaced by fakes: no real messages
// are sent, no files are downloaded and no AI is called. The database is real (a temporary one).
const sent: Array<{ kind: "text" | "location"; to: string; text: string }> = [];
const reports: Array<{ mediaFiles: string[]; audioFiles: string[]; caption: string; latitude: number; longitude: number }> = [];
let reportResult: "ok" | "not_civic" = "ok";

vi.mock("@/lib/whatsapp/cloud", () => ({
  sendText: async (to: string, text: string) => {
    sent.push({ kind: "text", to, text });
    return { ok: true, status: 200, response: {} };
  },
  sendLocationRequest: async (to: string, text: string) => {
    sent.push({ kind: "location", to, text });
    return { ok: true, status: 200, response: {} };
  },
}));

let fileCounter = 0;
vi.mock("@/lib/whatsapp/media", () => ({
  downloadMedia: async (id: string) => {
    await new Promise((r) => setTimeout(r, id.startsWith("slow") ? 80 : 1));
    return { file: `file${++fileCounter}.jpg`, mimeType: "image/jpeg" };
  },
}));

vi.mock("@/lib/reportPipeline", () => ({
  processReport: async (input: (typeof reports)[number] & { senderKey: string }) => {
    reports.push(input);
    if (reportResult === "not_civic") return { ok: false, code: "NOT_CIVIC", seen: "a selfie" };
    return {
      ok: true,
      complaint: {
        ticketId: "CIV-TEST01",
        trackingToken: "tok",
        category: "ROAD_DAMAGE",
        queue: "Roads & Public Works (demo queue)",
        severity: "HIGH",
        summary: "A pothole.",
        status: "TRIAGED",
        needsHumanReview: false,
        aiProvider: "gemini",
      },
    };
  },
}));

import type { InboundMessage } from "@/lib/whatsapp/conversation";

let n = 0;
const person = () => {
  n += 1;
  return { from: `91000000${String(n).padStart(4, "0")}`, senderKey: `IN.CONV${n}` };
};
const msg = (who: { from: string; senderKey: string }, over: Partial<InboundMessage>): InboundMessage => ({
  id: "wamid." + Math.random().toString(36).slice(2),
  type: "text",
  ...who,
  ...over,
});
const textsTo = (to: string) => sent.filter((s) => s.to === to);

beforeEach(() => {
  sent.length = 0;
  reports.length = 0;
  reportResult = "ok";
});

describe("WhatsApp conversation", () => {
  it("photo first: asks for the location, then registers when it arrives", async () => {
    const { handleInbound } = await import("@/lib/whatsapp/conversation");
    const who = person();
    await handleInbound(msg(who, { type: "image", image: { id: "m1", caption: "pothole" } }));
    expect(textsTo(who.from).some((s) => s.kind === "location")).toBe(true);
    expect(reports).toHaveLength(0); // nothing registered without a location

    await handleInbound(msg(who, { type: "location", location: { latitude: 25.4, longitude: 81.8 } }));
    expect(reports).toHaveLength(1);
    expect(reports[0].caption).toBe("pothole");
    expect(reports[0].latitude).toBe(25.4);
    expect(textsTo(who.from).at(-1)?.text).toContain("CIV-TEST01");
  });

  it("location first: a photo within ten minutes registers straight away", async () => {
    const { handleInbound } = await import("@/lib/whatsapp/conversation");
    const who = person();
    await handleInbound(msg(who, { type: "location", location: { latitude: 25.5, longitude: 81.9 } }));
    expect(reports).toHaveLength(0);
    await handleInbound(msg(who, { type: "image", image: { id: "m1" } }));
    expect(reports).toHaveLength(1);
    expect(reports[0].longitude).toBe(81.9);
  });

  it("a location is used once: the next photo needs its own", async () => {
    const { handleInbound } = await import("@/lib/whatsapp/conversation");
    const who = person();
    await handleInbound(msg(who, { type: "location", location: { latitude: 25.5, longitude: 81.9 } }));
    await handleInbound(msg(who, { type: "image", image: { id: "m1" } }));
    await handleInbound(msg(who, { type: "image", image: { id: "m2" } }));
    expect(reports).toHaveLength(1);
    expect(textsTo(who.from).some((s) => s.kind === "location")).toBe(true);
  });

  it("extra photos, voice notes and text are added to the waiting report", async () => {
    const { handleInbound } = await import("@/lib/whatsapp/conversation");
    const who = person();
    await handleInbound(msg(who, { type: "image", image: { id: "m1", caption: "big pothole" } }));
    await handleInbound(msg(who, { type: "image", image: { id: "m2", caption: "near school" } }));
    await handleInbound(msg(who, { type: "audio", audio: { id: "a1" } }));
    await handleInbound(msg(who, { type: "text", text: "since last week" }));
    await handleInbound(msg(who, { type: "location", location: { latitude: 25.6, longitude: 82 } }));
    expect(reports).toHaveLength(1);
    expect(reports[0].mediaFiles).toHaveLength(2);
    expect(reports[0].audioFiles).toHaveLength(1);
    expect(reports[0].caption).toBe("big pothole near school since last week");
  });

  it("a photo and its location arriving at the same moment still make exactly one report", async () => {
    const { handleInbound } = await import("@/lib/whatsapp/conversation");
    const who = person();
    // The photo is slow to download, so the location is handled first.
    await Promise.all([
      handleInbound(msg(who, { type: "image", image: { id: "slow1" } })),
      handleInbound(msg(who, { type: "location", location: { latitude: 25.7, longitude: 82.1 } })),
    ]);
    expect(reports).toHaveLength(1);
    expect(reports[0].latitude).toBe(25.7);
  });

  it("tells the citizen when the photo is not a civic problem, without registering anything", async () => {
    const { handleInbound } = await import("@/lib/whatsapp/conversation");
    reportResult = "not_civic";
    const who = person();
    await handleInbound(msg(who, { type: "image", image: { id: "m1" } }));
    await handleInbound(msg(who, { type: "location", location: { latitude: 25.8, longitude: 82.2 } }));
    expect(textsTo(who.from).at(-1)?.text).toContain("did not register");
  });

  it("separate people never share a conversation", async () => {
    const { handleInbound } = await import("@/lib/whatsapp/conversation");
    const a = person();
    const b = person();
    await handleInbound(msg(a, { type: "image", image: { id: "m1" } }));
    await handleInbound(msg(b, { type: "location", location: { latitude: 25.9, longitude: 82.3 } }));
    expect(reports).toHaveLength(0); // b's location must not complete a's report
  });

  it("answers an unknown text with help and records that the person just wrote", async () => {
    const { handleInbound } = await import("@/lib/whatsapp/conversation");
    const { withRepo } = await import("@/lib/repo");
    const who = person();
    await handleInbound(msg(who, { type: "text", text: "hello" }));
    expect(textsTo(who.from).at(-1)?.text).toContain("Welcome to CivicOS");
    const conv = await withRepo((r) => r.getConversation(who.senderKey));
    expect(Date.now() - Date.parse(conv?.lastInboundAt ?? "")).toBeLessThan(5000);
  });
});

describe("database: privacy and idempotency", () => {
  it("stores phone numbers encrypted, and reads them back decrypted", async () => {
    const { createComplaint } = await import("@/lib/complaints");
    const { getById } = await import("@/lib/complaints");
    const { query } = await import("@/lib/db");
    const c = await createComplaint(
      { source: "whatsapp", senderKey: "IN.ENC1", senderPhone: "919876501234", caption: "x", latitude: 27, longitude: 83, mediaFiles: ["a.jpg"], audioFiles: [], mediaHashes: [] },
      {
        category: "GARBAGE", title: "t", summary: "s", severity: "LOW", hazards: [], suggestedTeam: "SANITATION", teamReason: "r",
        teamSource: "ai", needsHumanReview: false, reviewReason: null, aiProvider: "x", aiModel: "y",
      },
    );
    const raw = await query<{ data: string }>("select data::text as data from complaints where id = $1", [c.id]);
    expect(raw[0].data).not.toContain("919876501234");
    expect(raw[0].data).toContain("enc:v1:");
    expect((await getById(c.id))?.senderPhone).toBe("919876501234");
  });

  it("encrypts conversation phone numbers too", async () => {
    const { handleInbound } = await import("@/lib/whatsapp/conversation");
    const { query } = await import("@/lib/db");
    await handleInbound({ id: "w1", from: "919800000001", senderKey: "IN.ENC2", type: "text", text: "hi" });
    const raw = await query<{ data: string }>("select data::text as data from conversations where sender_key = 'IN.ENC2'");
    expect(raw[0].data).not.toContain("919800000001");
  });

  it("refuses tampered ciphertext", async () => {
    const { encryptField, decryptField } = await import("@/lib/crypto");
    const enc = encryptField("919000000000");
    expect(decryptField(enc)).toBe("919000000000");
    const parts = enc.split(":");
    parts[4] = Buffer.from("tampered").toString("base64url");
    expect(() => decryptField(parts.join(":"))).toThrow();
    expect(encryptField("919000000000")).not.toBe(enc); // fresh random IV every time
  });

  it("acts on a WhatsApp message id only once, even for simultaneous deliveries", async () => {
    const { claimMessage } = await import("@/lib/events");
    expect(await claimMessage("wamid.ONCE")).toBe(true);
    expect(await claimMessage("wamid.ONCE")).toBe(false);
    const results = await Promise.all(Array.from({ length: 6 }, () => claimMessage("wamid.RACE")));
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("gives out unique, increasing ticket numbers under concurrent creation", async () => {
    const { createComplaint } = await import("@/lib/complaints");
    const make = (i: number) =>
      createComplaint(
        { source: "web", senderKey: `web:c${i}`, senderPhone: "", caption: "", latitude: 20 + i, longitude: 70 + i, mediaFiles: ["a.jpg"], audioFiles: [], mediaHashes: [] },
        {
          category: "OTHER", title: "t", summary: "s", severity: "LOW", hazards: [], suggestedTeam: "GENERAL_ADMIN", teamReason: "r",
          teamSource: "rules", needsHumanReview: true, reviewReason: null, aiProvider: null, aiModel: null,
        },
      );
    const made = await Promise.all([0, 1, 2, 3, 4].map(make));
    expect(new Set(made.map((c) => c.ticketId)).size).toBe(5);
  });
});
