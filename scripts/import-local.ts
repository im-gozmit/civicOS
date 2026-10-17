// Usage: npm run db:import
// Copies the complaints from the old local file (.data/store.json) and their photos into the
// current database and storage (whatever .env.local points at). Safe to run twice.
// Stop `npm run dev` first if you are importing into the local database.
import { existsSync, readFileSync } from "fs";
import path from "path";
import type { Complaint, Conversation, Notification } from "../src/lib/types.ts";

async function main() {
  process.loadEnvFile(".env.local");
  const { query, closeDb } = await import("../src/lib/db.ts");
  const { withRepo } = await import("../src/lib/repo.ts");
  const { putFile } = await import("../src/lib/storage.ts");

  const file = path.join(".data", "store.json");
  if (!existsSync(file)) {
    console.log("No .data/store.json found: nothing to import.");
    process.exit(0);
  }
  const old = JSON.parse(readFileSync(file, "utf8")) as { complaints: Complaint[]; notifications?: Notification[]; conversations?: Record<string, Conversation> };

  const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", ogg: "audio/ogg", mp3: "audio/mpeg", m4a: "audio/mp4", webm: "audio/webm", wav: "audio/wav" };

  let imported = 0;
  let skipped = 0;
  let files = 0;
  for (const c of old.complaints) {
    const exists = await withRepo((r) => r.getComplaintByTicket(c.ticketId));
    if (exists) {
      skipped++;
      continue;
    }
    for (const name of [...c.mediaFiles, ...c.audioFiles, ...(c.repairChecks ?? []).map((x) => x.file)]) {
      const p = path.join(".data", "media", name);
      if (existsSync(p)) {
        await putFile(name, readFileSync(p), MIME[name.split(".").pop() ?? ""] ?? "application/octet-stream");
        files++;
      }
    }
    const no = parseInt(c.ticketId.slice(4), 10);
    await withRepo((r) => r.insertComplaint(c, no));
    imported++;
  }
  for (const conv of Object.values(old.conversations ?? {})) await withRepo((r) => r.saveConversation(conv));
  for (const n of old.notifications ?? []) {
    const has = await withRepo((r) => r.getNotification(n.id));
    if (!has && old.complaints.some((c) => c.id === n.complaintId)) await withRepo((r) => r.insertNotification(n));
  }
  // Continue ticket numbers after the highest imported one.
  await query("select setval('ticket_seq', greatest((select coalesce(max(ticket_no), 0) from complaints), 1))");
  console.log(`Imported ${imported} complaint(s), skipped ${skipped} already present, uploaded ${files} file(s).`);
  await closeDb();
}

main().catch((err) => {
  console.error("Import failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
