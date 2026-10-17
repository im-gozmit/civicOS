// Usage: npm run db:migrate
// Prepares the HOSTED database: creates the tables and the private photo bucket. Safe to run twice.

async function main() {
  process.loadEnvFile(".env.local");

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in .env.local. Paste the Supabase 'Transaction pooler' connection string there first.");
    process.exit(1);
  }

  // Loaded only after the environment file is read, so the settings above are seen.
  const { migrate, closeDb } = await import("../src/lib/db.ts");
  const { ensureBucket } = await import("../src/lib/storage.ts");

  const kind = await migrate();
  console.log(`Database ready (${kind}). Tables created or already present.`);

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const bucket = await ensureBucket();
    console.log(`Photo bucket: ${bucket}.`);
  } else {
    console.log("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set: photos will be kept on this computer only.");
  }
  await closeDb();
}

main().catch((err) => {
  // Print the reason without echoing connection details.
  console.error("Migration failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
