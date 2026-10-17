import { query } from "@/lib/db";

// Operational logging and WhatsApp duplicate-delivery protection.
// Logs go to the console (Vercel keeps them for you). They must never contain phone numbers,
// message text or photos, so callers pass only small facts such as status codes and timings.

export function logEvent(entry: Record<string, unknown>): void {
  console.log(JSON.stringify({ at: new Date().toISOString(), ...entry }));
}

/**
 * Meta delivers some webhooks more than once. This records a message id the first time and
 * returns true; any later delivery of the same id returns false and must be ignored.
 * It is one atomic INSERT, so two deliveries arriving at the same moment cannot both win.
 */
export async function claimMessage(messageId: string): Promise<boolean> {
  const rows = await query("insert into wa_events (message_id) values ($1) on conflict do nothing returning message_id", [messageId]);
  return rows.length > 0;
}
