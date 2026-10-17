import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { SCHEMA_SQL } from "@/lib/schemaSql";

// The hosted database is reached through the `postgres` driver, which behaves differently from the
// in-process test database (for example it encodes JSON parameters itself). These tests put a
// real Postgres wire-protocol server in front of a throwaway database, so they exercise exactly the
// code path used in production: same driver, same settings.

let server: PGLiteSocketServer;
let backing: PGlite;

beforeAll(async () => {
  backing = await PGlite.create();
  await backing.exec(SCHEMA_SQL);
  server = new PGLiteSocketServer({ db: backing, port: 0, host: "127.0.0.1" });
  await server.start();
  const conn = server.getServerConn(); // "127.0.0.1:<port>"
  process.env.DATABASE_URL = `postgres://postgres@${conn}/postgres`;
});

afterAll(async () => {
  const { closeDb } = await import("@/lib/db");
  await closeDb();
  await server.stop();
  await backing.close();
});

const analysis = {
  category: "ROAD_DAMAGE" as const, title: "Road damage", summary: "A pothole.", severity: "HIGH" as const, hazards: [],
  suggestedTeam: "ROADS_PUBLIC_WORKS" as const, teamReason: "Road.", teamSource: "ai" as const, needsHumanReview: false,
  reviewReason: null, aiProvider: "gemini", aiModel: "test",
};

describe("through the production database driver", () => {
  it("is really using the hosted-style driver", async () => {
    const { getDb } = await import("@/lib/db");
    expect((await getDb()).kind).toBe("postgres");
  });

  it("stores complaint data as a JSON object (not a JSON string) and reads it back intact", async () => {
    const { createComplaint, getById, getByTicket } = await import("@/lib/complaints");
    const { query } = await import("@/lib/db");
    const c = await createComplaint(
      { source: "whatsapp", senderKey: "IN.DRV1", senderPhone: "919811111111", caption: "x", latitude: 25.5, longitude: 81.5, mediaFiles: ["a.jpg"], audioFiles: [], mediaHashes: ["h1"] },
      analysis,
    );
    const kind = await query<{ t: string }>("select jsonb_typeof(data) as t from complaints where id = $1", [c.id]);
    expect(kind[0].t).toBe("object");

    const back = await getById(c.id);
    expect(back?.ticketId).toBe(c.ticketId);
    expect(back?.senderPhone).toBe("919811111111");
    expect(back?.history).toHaveLength(2);
    expect((await getByTicket(c.ticketId))?.id).toBe(c.id);
  });

  it("keeps a conversation across messages (the bug that broke photos on the hosted site)", async () => {
    const { withRepo } = await import("@/lib/repo");
    const { query } = await import("@/lib/db");
    const conv = { senderKey: "IN.DRV2", phone: "919822222222", state: "AWAITING_LOCATION" as const, updatedAt: new Date().toISOString(),
      pending: { caption: "pothole", mediaFiles: ["a.jpg"], audioFiles: [], startedAt: new Date().toISOString() } };
    await withRepo((r) => r.saveConversation(conv));
    const kind = await query<{ t: string }>("select jsonb_typeof(data) as t from conversations where sender_key = 'IN.DRV2'");
    expect(kind[0].t).toBe("object");

    const loaded = await withRepo((r) => r.getConversation("IN.DRV2", true));
    expect(loaded?.state).toBe("AWAITING_LOCATION");
    expect(loaded?.pending?.mediaFiles).toEqual(["a.jpg"]);
    expect(loaded?.phone).toBe("919822222222");

    // second write (an update) must also stay an object
    loaded!.state = "IDLE";
    await withRepo((r) => r.saveConversation(loaded!));
    expect((await withRepo((r) => r.getConversation("IN.DRV2")))?.state).toBe("IDLE");
  });

  it("repairs a conversation an earlier version stored as a JSON string", async () => {
    const { withRepo } = await import("@/lib/repo");
    const { query } = await import("@/lib/db");
    const old = JSON.stringify({ senderKey: "IN.DRV3", phone: "919833333333", state: "IDLE", updatedAt: new Date().toISOString() });
    // what the broken version wrote: the JSON text stored as one JSON string value
    await query("insert into conversations (sender_key, updated_at, data) values ('IN.DRV3', now(), to_jsonb($1::text))", [old]);
    const loaded = await withRepo((r) => r.getConversation("IN.DRV3", true));
    expect(loaded?.senderKey).toBe("IN.DRV3");
    expect(loaded?.state).toBe("IDLE");
  });

  it("runs the status-change transaction, the notification outbox and file lookups", async () => {
    const { createComplaint, verifyAssignment, changeStatus, statusesOf, fileIsKnown, notificationsFor } = await import("@/lib/complaints");
    const c = await createComplaint(
      { source: "web", senderKey: "web:drv4", senderPhone: "", caption: "", latitude: 25.6, longitude: 81.6, mediaFiles: ["drv-photo.jpg"], audioFiles: [], mediaHashes: [] },
      analysis,
    );
    const trackUrl = () => "https://example.test/t/x";
    expect((await verifyAssignment(c.id, "confirm", undefined, "", "admin", trackUrl)).ok).toBe(true);
    expect((await changeStatus(c.id, "IN_PROGRESS", "", "", "admin", trackUrl)).ok).toBe(true);
    expect((await notificationsFor(c.id)).length).toBe(2);
    expect((await statusesOf([c.id]))[c.id]).toBe("IN_PROGRESS");
    expect(await fileIsKnown("drv-photo.jpg")).toBe(true);
    expect(await fileIsKnown("someone-elses.jpg")).toBe(false);
  });

  it("finds possible duplicates and counts rate limits through the same driver", async () => {
    const { createComplaint } = await import("@/lib/complaints");
    const { allow } = await import("@/lib/rateLimit");
    const a = await createComplaint({ source: "web", senderKey: "web:d5", senderPhone: "", caption: "", latitude: 26.2, longitude: 82.2, mediaFiles: ["d5.jpg"], audioFiles: [], mediaHashes: ["samehash-drv"] }, analysis);
    const b = await createComplaint({ source: "web", senderKey: "web:d6", senderPhone: "", caption: "", latitude: 26.20002, longitude: 82.20002, mediaFiles: ["d6.jpg"], audioFiles: [], mediaHashes: ["samehash-drv"] }, analysis);
    expect(b.duplicateCandidates?.map((x) => x.ticketId)).toContain(a.ticketId);
    expect(await allow("drv-rate", 1, 60_000)).toBe(true);
    expect(await allow("drv-rate", 1, 60_000)).toBe(false);
  });

  it("acts on a WhatsApp message id only once", async () => {
    const { claimMessage } = await import("@/lib/events");
    expect(await claimMessage("wamid.DRV")).toBe(true);
    expect(await claimMessage("wamid.DRV")).toBe(false);
  });
});
