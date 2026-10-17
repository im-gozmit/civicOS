// Usage: npm run db:seed-demo
// Fills the LOCAL development database with sample complaints so the pages can be designed and
// tested with realistic content. It refuses to run if DATABASE_URL is set (the hosted database).
// Stop `npm run dev` first: the local database can only be opened by one program at a time.

async function main() {
  process.loadEnvFile(".env.local");
  if (process.env.DATABASE_URL) {
    console.error("DATABASE_URL is set, so this would write sample data to the HOSTED database. Refusing.");
    console.error("Run it as:  DATABASE_URL= npm run db:seed-demo   (an empty value selects the local database)");
    process.exit(1);
  }
  const { closeDb } = await import("../src/lib/db.ts");
  const { createComplaint, verifyAssignment, changeStatus, addRepairCheck } = await import("../src/lib/complaints.ts");
  type Cat = "ROAD_DAMAGE" | "GARBAGE" | "DRAINAGE" | "WATER_SUPPLY" | "STREET_LIGHT";
  type Team = "ROADS_PUBLIC_WORKS" | "SANITATION" | "DRAINAGE" | "WATER_SUPPLY" | "ELECTRICITY_STREETLIGHTS";

  const trackUrl = () => "http://localhost:3000/t/demo";
  const photos = ["2152042462391157.jpg", "1473662861327333.jpg", "1386798576867958.jpg"];

  const samples: Array<{ cat: Cat; team: Team; title: string; summary: string; sev: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; lat: number; lng: number; stage: "new" | "assigned" | "progress" | "closed" }> = [
    { cat: "ROAD_DAMAGE", team: "ROADS_PUBLIC_WORKS", title: "Large pothole near the school gate", summary: "A deep pothole covers half the lane near a school entrance and is filling with water.", sev: "HIGH", lat: 25.4521, lng: 81.8352, stage: "new" },
    { cat: "GARBAGE", team: "SANITATION", title: "Garbage pile beside the market", summary: "Uncollected garbage has spilled onto the road next to the vegetable market.", sev: "MEDIUM", lat: 25.4582, lng: 81.8611, stage: "assigned" },
    { cat: "DRAINAGE", team: "DRAINAGE", title: "Overflowing drain on the main road", summary: "A blocked drain is overflowing and sewage water is spreading onto the carriageway.", sev: "HIGH", lat: 25.4399, lng: 81.8473, stage: "progress" },
    { cat: "STREET_LIGHT", team: "ELECTRICITY_STREETLIGHTS", title: "Three street lights are dark", summary: "A stretch of three consecutive street lights has been off for several nights.", sev: "MEDIUM", lat: 25.4664, lng: 81.8269, stage: "new" },
    { cat: "WATER_SUPPLY", team: "WATER_SUPPLY", title: "Water pipeline leaking", summary: "Clean drinking water is leaking from a broken pipe and flooding the lane.", sev: "HIGH", lat: 25.4288, lng: 81.8585, stage: "progress" },
    { cat: "ROAD_DAMAGE", team: "ROADS_PUBLIC_WORKS", title: "Cracked and sunken road section", summary: "A cracked section of road has sunk and is dangerous for two-wheelers.", sev: "MEDIUM", lat: 25.4731, lng: 81.8689, stage: "closed" },
    { cat: "GARBAGE", team: "SANITATION", title: "Overflowing community bin", summary: "The community bin has overflowed and stray animals are scattering the waste.", sev: "LOW", lat: 25.4417, lng: 81.8225, stage: "new" },
  ];

  for (const [i, s] of samples.entries()) {
    const c = await createComplaint(
      { source: i % 2 === 0 ? "whatsapp" : "web", senderKey: i % 2 === 0 ? `IN.DEMO${i}` : `web:demo${i}`, senderPhone: "", caption: s.title, latitude: s.lat, longitude: s.lng, mediaFiles: [photos[i % photos.length]], audioFiles: [], mediaHashes: ["demo" + i] },
      { category: s.cat, title: s.title, summary: s.summary, severity: s.sev, hazards: [], suggestedTeam: s.team, teamReason: "The photo shows a problem this team usually handles.", teamSource: "ai", needsHumanReview: i === 3, reviewReason: i === 3 ? "Photo is dark; please check." : null, aiProvider: "gemini", aiModel: "demo" },
    );
    if (s.stage === "new") continue;
    await verifyAssignment(c.id, "confirm", undefined, "", "demo@example.com", trackUrl);
    if (s.stage === "assigned") continue;
    await changeStatus(c.id, "IN_PROGRESS", "Work has started on site.", "", "demo@example.com", trackUrl);
    if (s.stage === "progress") continue;
    await addRepairCheck(c.id, { file: photos[(i + 1) % photos.length], sha256: "demo-after-" + i, uploadedBy: "demo@example.com", at: new Date().toISOString(), verdict: "looks_repaired", reason: "The after photo shows a smooth, repaired surface where the damage was.", aiProvider: "gemini", aiModel: "demo" });
    await changeStatus(c.id, "RESOLVED_PENDING_VERIFICATION", "Repair completed.", "", "demo@example.com", trackUrl);
    await changeStatus(c.id, "CLOSED", "Checked and closed.", "", "demo@example.com", trackUrl);
  }
  console.log(`Added ${samples.length} sample complaints to the local database.`);
  await closeDb();
}

main().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
