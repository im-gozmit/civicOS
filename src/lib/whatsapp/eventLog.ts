import { appendFile, mkdir, readFile } from "fs/promises";
import path from "path";

// Spike-only persistence: raw webhook payloads go to a local JSONL file so we can see exactly
// what Meta sends. Replaced by the wa_messages table once the database exists.
const DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "wa-events.jsonl");

export async function logEvent(entry: Record<string, unknown>) {
  await mkdir(DIR, { recursive: true });
  await appendFile(FILE, JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n", "utf8");
}

export async function seenMessageId(id: string): Promise<boolean> {
  try {
    const text = await readFile(FILE, "utf8");
    return text.includes(`"processed":"${id}"`);
  } catch {
    return false;
  }
}
