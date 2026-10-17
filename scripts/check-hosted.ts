// Usage: npm run db:check
// Checks the database and photo storage that .env.local points at, without changing real data.

async function main() {
  process.loadEnvFile(".env.local");
  const { query, closeDb, getDb } = await import("../src/lib/db.ts");
  const { putFile, getFile, deleteFile } = await import("../src/lib/storage.ts");

  const db = await getDb();
  console.log("Database engine:", db.kind === "postgres" ? "hosted Postgres" : "local built-in database");

  const tables = await query<{ tablename: string; rowsecurity: boolean }>(
    "select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename in ('complaints','notifications','conversations','wa_events','rate_hits') order by tablename",
  );
  for (const t of tables) console.log(`  table ${t.tablename.padEnd(14)} row security: ${t.rowsecurity ? "ON" : "OFF  <-- should be on"}`);
  if (tables.length !== 5) console.log(`  WARNING: expected 5 tables, found ${tables.length}. Run npm run db:migrate.`);

  const counts = await query<{ n: string | number }>("select count(*) as n from complaints");
  console.log("  complaints stored:", Number(counts[0].n));

  // Round trip through the real storage layer with a tiny file, then delete it.
  const name = "check-" + Date.now().toString(36) + ".png";
  const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
  await putFile(name, bytes, "image/png");
  const back = await getFile(name);
  await deleteFile(name);
  const ok = !!back && back.equals(bytes);
  console.log("Photo storage:", process.env.SUPABASE_URL ? "Supabase bucket" : "local folder", ok ? "upload, read back and delete: OK" : "FAILED to read back what was uploaded");

  await closeDb();
  if (!ok) process.exit(1);
}

main().catch((err) => {
  console.error("Check failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
