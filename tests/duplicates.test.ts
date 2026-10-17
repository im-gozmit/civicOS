import { describe, expect, it } from "vitest";
import { distanceMeters, findDuplicateCandidates } from "@/lib/duplicates";
import type { Analysis } from "@/lib/complaints";
import type { Complaint } from "@/lib/types";

const trackUrl = () => "https://example.test/t/x";
const DAY = 24 * 3600 * 1000;

// A spot in Prayagraj, and points a known distance away (1 degree of latitude is about 111 km).
const BASE = { latitude: 25.4358, longitude: 81.8463 };
const north = (meters: number) => ({ latitude: BASE.latitude + meters / 111_000, longitude: BASE.longitude });

function fake(over: Partial<Complaint> & { latitude?: number; longitude?: number }): Complaint {
  return {
    id: over.id ?? "id-" + Math.random().toString(36).slice(2),
    ticketId: over.ticketId ?? "CIV-000100",
    category: "ROAD_DAMAGE",
    status: "TRIAGED",
    latitude: BASE.latitude,
    longitude: BASE.longitude,
    createdAt: new Date().toISOString(),
    mediaHashes: [],
    ...over,
  } as Complaint;
}

describe("distance", () => {
  it("is about right for a known offset", () => {
    expect(distanceMeters(BASE, north(100))).toBeGreaterThan(95);
    expect(distanceMeters(BASE, north(100))).toBeLessThan(105);
    expect(distanceMeters(BASE, BASE)).toBe(0);
  });
});

describe("finding duplicate candidates", () => {
  const facts = { ...BASE, category: "ROAD_DAMAGE" as const, mediaHashes: [] as string[] };

  it("matches the same kind of problem nearby and recent", () => {
    const hits = findDuplicateCandidates(facts, [fake({ ...north(30), ticketId: "CIV-000007" })]);
    expect(hits).toHaveLength(1);
    expect(hits[0].ticketId).toBe("CIV-000007");
    expect(hits[0].distanceM).toBeGreaterThan(25);
    expect(hits[0].reason).toContain("m away");
  });

  it("ignores far-away, different-category, old, closed, rejected and duplicate reports", () => {
    const existing = [
      fake({ ...north(500) }), // too far
      fake({ category: "GARBAGE" }), // different problem
      fake({ createdAt: new Date(Date.now() - 40 * DAY).toISOString() }), // too old
      fake({ status: "CLOSED" }),
      fake({ status: "REJECTED" }),
      fake({ status: "DUPLICATE" }),
    ];
    expect(findDuplicateCandidates(facts, existing)).toHaveLength(0);
  });

  it("ranks the nearest first and returns at most three", () => {
    const existing = [
      fake({ ...north(50), ticketId: "CIV-000003" }),
      fake({ ...north(10), ticketId: "CIV-000001" }),
      fake({ ...north(30), ticketId: "CIV-000002" }),
      fake({ ...north(55), ticketId: "CIV-000004" }),
    ];
    const hits = findDuplicateCandidates(facts, existing);
    expect(hits).toHaveLength(3);
    expect(hits.map((h) => h.ticketId)).toEqual(["CIV-000001", "CIV-000002", "CIV-000003"]);
  });

  it("flags an identical photo even when the reports are somewhat further apart", () => {
    const existing = [fake({ ...north(150), mediaHashes: ["samehash"], ticketId: "CIV-000009" })];
    const hits = findDuplicateCandidates({ ...facts, mediaHashes: ["samehash"] }, existing);
    expect(hits).toHaveLength(1);
    expect(hits[0].sameImage).toBe(true);
  });
});

describe("linking duplicates", () => {
  const analysis: Analysis = {
    category: "ROAD_DAMAGE",
    title: "Road damage",
    summary: "A pothole.",
    severity: "HIGH",
    hazards: [],
    suggestedTeam: "ROADS_PUBLIC_WORKS",
    teamReason: "Road.",
    teamSource: "ai",
    needsHumanReview: false,
    reviewReason: null,
    aiProvider: "gemini",
    aiModel: "test",
  };

  // A spot far from everything the other test files create, so they cannot interfere.
  const mk = async (lat: number, lng: number, key: string) => {
    const { createComplaint } = await import("@/lib/complaints");
    return createComplaint(
      { source: "whatsapp", senderKey: key, senderPhone: "910000000000", caption: "x", latitude: lat, longitude: lng, mediaFiles: ["a.jpg"], audioFiles: [], mediaHashes: [] },
      analysis,
    );
  };

  it("flags a second report at the same spot, but never hides or merges it", async () => {
    const first = await mk(26.1, 82.1, "IN.D1");
    const second = await mk(26.10003, 82.10003, "IN.D2");
    expect(first.duplicateCandidates).toHaveLength(0);
    expect(second.duplicateCandidates?.map((c) => c.ticketId)).toContain(first.ticketId);
    expect(second.status).toBe("TRIAGED"); // still its own complaint, awaiting a person
    expect(second.ticketId).not.toBe(first.ticketId);
    expect(second.trackingToken).not.toBe(first.trackingToken);
  });

  it("staff can link it (reason kept, citizen notified once), and undo it", async () => {
    const { linkDuplicate, changeStatus, getById, linkedReportsOf } = await import("@/lib/complaints");
    const { withStore } = await import("@/lib/localStore");
    const a = await mk(26.3, 82.3, "IN.D3");
    const b = await mk(26.30002, 82.30002, "IN.D4");
    const before = await withStore((s) => s.notifications.length);

    const r = await linkDuplicate(b.id, a.ticketId, "Same pothole", "admin", trackUrl);
    expect(r.ok).toBe(true);
    expect((await getById(b.id))?.status).toBe("DUPLICATE");
    expect((await getById(b.id))?.duplicateOf?.ticketId).toBe(a.ticketId);
    expect((await linkedReportsOf(a.id)).map((x) => x.ticketId)).toEqual([b.ticketId]);
    expect(await withStore((s) => s.notifications.length)).toBe(before + 1);

    // undo needs a reason and clears the link
    expect((await changeStatus(b.id, "TRIAGED", "", "", "admin", trackUrl)).ok).toBe(false);
    expect((await changeStatus(b.id, "TRIAGED", "They are two different potholes", "", "admin", trackUrl)).ok).toBe(true);
    expect((await getById(b.id))?.duplicateOf).toBeUndefined();
    expect(await linkedReportsOf(a.id)).toHaveLength(0);
  });

  it("refuses bad links: to itself, to a duplicate (no chains), to an unknown ticket", async () => {
    const { linkDuplicate } = await import("@/lib/complaints");
    const a = await mk(26.5, 82.5, "IN.D5");
    const b = await mk(26.50002, 82.50002, "IN.D6");
    const c = await mk(26.50004, 82.50004, "IN.D7");
    expect((await linkDuplicate(a.id, a.ticketId, "", "admin", trackUrl)).ok).toBe(false);
    expect((await linkDuplicate(a.id, "CIV-999999", "", "admin", trackUrl)).ok).toBe(false);
    expect((await linkDuplicate(b.id, a.ticketId, "", "admin", trackUrl)).ok).toBe(true);
    expect((await linkDuplicate(c.id, b.ticketId, "", "admin", trackUrl)).ok).toBe(false); // b is itself a duplicate
  });

  it("the generic status route cannot mark a duplicate without naming the earlier report", async () => {
    const { changeStatus } = await import("@/lib/complaints");
    const a = await mk(26.7, 82.7, "IN.D8");
    expect((await changeStatus(a.id, "DUPLICATE", "same", "", "admin", trackUrl)).ok).toBe(false);
  });
});
