import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { Complaint, Conversation } from "@/lib/types";

// SPIKE-ONLY persistence: one JSON file under .data/. Replaced by Supabase/Postgres later.
// All access goes through withStore(), which serialises reads and writes inside this process.

export interface Store {
  counter: number;
  complaints: Complaint[];
  conversations: Record<string, Conversation>;
}

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "store.json");

let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<Store> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Store;
  } catch {
    return { counter: 0, complaints: [], conversations: {} };
  }
}

export function withStore<T>(fn: (store: Store) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const store = await load();
    const result = await fn(store);
    await mkdir(DIR, { recursive: true });
    await writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export const MEDIA_DIR = path.join(DIR, "media");
