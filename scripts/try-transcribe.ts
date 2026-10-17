// Usage: node scripts/try-transcribe.ts <audio-file>
// Runs the real speech-to-text adapter on a local audio file.
import { readFileSync } from "fs";
import { transcribeAudio } from "../src/lib/ai/transcribe.ts";

process.loadEnvFile(".env.local");

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/try-transcribe.ts <audio-file>");
  process.exit(1);
}
const r = await transcribeAudio(readFileSync(file), file, (e) => console.log("log:", JSON.stringify(e)));
console.log(r ? JSON.stringify(r, null, 2) : "No transcription (silent audio or no provider available).");
