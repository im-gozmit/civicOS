// Usage: node scripts/try-verify.ts <before.jpg> <after.jpg>
// Runs the real before/after repair check on two local photos.
import { verifyRepair } from "../src/lib/ai/verifyRepair.ts";

process.loadEnvFile(".env.local");

const [before, after] = process.argv.slice(2);
if (!before || !after) {
  console.error("Usage: node scripts/try-verify.ts <before.jpg> <after.jpg>");
  process.exit(1);
}
const mime = (f: string) => (/\.png$/i.test(f) ? "image/png" : /\.webp$/i.test(f) ? "image/webp" : "image/jpeg");
const r = await verifyRepair(
  { beforePath: before, beforeMime: mime(before), afterPath: after, afterMime: mime(after), summary: "A damaged road with potholes" },
  (e) => console.log("log:", JSON.stringify(e)),
);
console.log(r ? JSON.stringify(r, null, 2) : "No provider returned a valid opinion.");
