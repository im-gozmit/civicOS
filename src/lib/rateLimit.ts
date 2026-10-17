import { query } from "@/lib/db";

// Rate limits kept in the database, so they hold even when the app runs on several servers.

/** Counts the action and returns true if it is still within the limit. */
export async function allow(key: string, max: number, windowMs: number): Promise<boolean> {
  const since = new Date(Date.now() - windowMs).toISOString();
  const rows = await query<{ n: string | number }>("select count(*) as n from rate_hits where key = $1 and at > $2", [key, since]);
  if (Number(rows[0].n) >= max) return false;
  await query("insert into rate_hits (key, at) values ($1, now())", [key]);
  if (Math.random() < 0.02) await query("delete from rate_hits where at < now() - interval '2 days'");
  return true;
}

/** How many times `key` was recorded in the window (does not record anything). */
export async function rateCount(key: string, windowMs: number): Promise<number> {
  const since = new Date(Date.now() - windowMs).toISOString();
  const rows = await query<{ n: string | number }>("select count(*) as n from rate_hits where key = $1 and at > $2", [key, since]);
  return Number(rows[0].n);
}

export async function rateRecord(key: string): Promise<void> {
  await query("insert into rate_hits (key, at) values ($1, now())", [key]);
}

export async function rateClear(key: string): Promise<void> {
  await query("delete from rate_hits where key = $1", [key]);
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
