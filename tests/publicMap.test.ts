import { describe, expect, it } from "vitest";
import { approximate, toPublicMarkers } from "@/lib/publicMap";
import { distanceMeters } from "@/lib/duplicates";
import type { Complaint } from "@/lib/types";

function fake(over: Partial<Complaint>): Complaint {
  return {
    id: "11111111-aaaa-bbbb-cccc-222222222222",
    ticketId: "CIV-000042",
    trackingToken: "SECRET-TRACKING-TOKEN-1234",
    senderKey: "IN.PRIVATE-SENDER",
    senderPhone: "919999999999",
    caption: "my house is next to the pothole, call me",
    summary: "A pothole outside a house.",
    category: "ROAD_DAMAGE",
    status: "TRIAGED",
    latitude: 25.435812,
    longitude: 81.846377,
    mediaFiles: ["secret-photo.jpg"],
    audioFiles: ["secret-voice.ogg"],
    createdAt: "2026-10-17T08:30:45.123Z",
    internalNotes: [{ at: "x", by: "admin@example.com", text: "INTERNAL-NOTE" }],
    ...over,
  } as Complaint;
}

describe("public map", () => {
  it("exposes nothing private", () => {
    const json = JSON.stringify(toPublicMarkers([fake({})]));
    for (const secret of [
      "CIV-000042",
      "SECRET-TRACKING-TOKEN-1234",
      "IN.PRIVATE-SENDER",
      "919999999999",
      "pothole, call me",
      "A pothole outside a house",
      "secret-photo",
      "secret-voice",
      "INTERNAL-NOTE",
      "admin@example.com",
      "11111111-aaaa",
      "08:30:45",
    ]) {
      expect(json).not.toContain(secret);
    }
  });

  it("only returns the fields the map needs", () => {
    const [m] = toPublicMarkers([fake({})]);
    expect(Object.keys(m).sort()).toEqual(["category", "categoryId", "group", "key", "lat", "lng", "reportedOn", "status"]);
    expect(m.reportedOn).toBe("2026-10-17");
  });

  it("never shows the exact spot, but stays near it", () => {
    const c = fake({});
    const [m] = toPublicMarkers([c]);
    const d = distanceMeters({ latitude: c.latitude, longitude: c.longitude }, { latitude: m.lat, longitude: m.lng });
    expect(d).toBeGreaterThan(1); // not the original coordinates
    expect(d).toBeLessThan(250); // still useful for seeing clusters
  });

  it("gives the same approximate position every time for a report", () => {
    expect(approximate(25.4358, 81.8463, "seed-1")).toEqual(approximate(25.4358, 81.8463, "seed-1"));
    expect(approximate(25.4358, 81.8463, "seed-1")).not.toEqual(approximate(25.4358, 81.8463, "seed-2"));
  });

  it("hides rejected and duplicate reports, and groups the rest", () => {
    const list = toPublicMarkers([
      fake({ id: "a", status: "REJECTED" }),
      fake({ id: "b", status: "DUPLICATE" }),
      fake({ id: "c", status: "TRIAGED" }),
      fake({ id: "d", status: "IN_PROGRESS" }),
      fake({ id: "e", status: "CLOSED" }),
    ]);
    expect(list.map((m) => m.group).sort()).toEqual(["done", "new", "working"]);
  });
});
