// Usage: npm run db:migrate
// Prepares the HOSTED database: creates the tables and the private photo bucket. Safe to run twice.
import { ensureBucket } from "../src/lib/storage.ts";
import { migrate } from "../src/lib/db.ts";

process.loadEnvFile(".env.local");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in .env.local. Paste the Supabase 'Transaction pooler' connection string there first.");
  process.exit(1);
}

const kind = await migrate();
console.log(`Database ready (${kind}). Tables created or already present.`);

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const bucket = await ensureBucket();
  console.log(`Photo bucket: ${bucket}.`);
} else {
  console.log("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set: photos will be kept on this computer only.");
}
process.exit(0);
