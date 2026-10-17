import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { Complaint, Conversation, Notification } from "@/lib/types";

// SPIKE-ONLY persistence: one JSON file under .data/. Replaced by Supabase/Postgres later.
// All access goes through withStore(), which serialises reads and writes inside this process.

export interface Store {
  counter: number;
  complaints: Complaint[];
  conversations: Record<string, Conversation>;
  notifications: Notification[];
}

const DIR = process.env.DATA_DIR || path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "store.json");

let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<Store> {
  try {
    const store = JSON.parse(await readFile(FILE, "utf8")) as Store;
    store.notifications ??= [];
    return store;
  } catch (err) {
    // Only a missing file means "empty store". Any other failure (partial write, bad JSON) must
    // not silently start from scratch, or the next save would overwrite real data.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { counter: 0, complaints: [], conversations: {}, notifications: [] };
    }
    throw err;
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
