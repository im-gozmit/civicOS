// Usage: node scripts/try-triage.ts <image-path> [caption]
// Runs the real triage adapter on a local photo so you can see what the AI returns.
import { runTriage } from "../src/lib/ai/triage.ts";

process.loadEnvFile(".env.local");

const [imagePath, ...rest] = process.argv.slice(2);
if (!imagePath) {
  console.error("Usage: node scripts/try-triage.ts <image-path> [caption]");
  process.exit(1);
}
const mimeType = /\.png$/i.test(imagePath) ? "image/png" : /\.webp$/i.test(imagePath) ? "image/webp" : "image/jpeg";

const run = await runTriage({ imagePath, mimeType, caption: rest.join(" ") }, (e) => console.log("log:", JSON.stringify(e)));
console.log(run ? JSON.stringify(run, null, 2) : "No provider returned a valid result (fallback would apply).");
