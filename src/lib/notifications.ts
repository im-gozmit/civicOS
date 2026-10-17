import { withRepo } from "@/lib/repo";
import { sendText } from "@/lib/whatsapp/cloud";
import { logEvent } from "@/lib/events";

const WINDOW_MS = 23 * 60 * 60 * 1000; // 24h window with a safety margin
const MAX_ATTEMPTS = 3;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Delivers one outbox row. Safe to call repeatedly (it skips rows that are already SENT/FAILED).
 * A delivery failure only updates the outbox row; it never touches the complaint status.
 */
export async function deliverNotification(notificationId: string): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Step 1: decide whether and where to send. The row is locked only while we decide.
    const job = await withRepo(async (r) => {
      const n = await r.getNotification(notificationId, true);
      if (!n || n.state !== "PENDING") return null;
      const c = await r.getComplaint(n.complaintId);
      const conv = c ? await r.getConversation(c.senderKey) : undefined;
      if (!c || !conv) {
        n.state = "FAILED";
        n.lastError = "NO_WHATSAPP_RECIPIENT";
        await r.saveNotification(n);
        return null;
      }
      const lastInbound = conv.lastInboundAt ? Date.parse(conv.lastInboundAt) : 0;
      if (Date.now() - lastInbound > WINDOW_MS) {
        // Free-form messages are only allowed within 24h of the citizen's last message.
        // An approved template message would be needed; not built yet.
        n.state = "FAILED";
        n.lastError = "OUTSIDE_24H_WINDOW (needs an approved template message)";
        await r.saveNotification(n);
        return null;
      }
      n.attempts += 1;
      await r.saveNotification(n);
      return { phone: conv.phone, text: n.text };
    });
    if (!job) return;

    // Step 2: send (no database lock is held while we wait for WhatsApp).
    let ok = false;
    let transient = false;
    let error: string | null = null;
    try {
      const res = await sendText(job.phone, job.text);
      ok = res.ok;
      transient = res.status === 429 || res.status >= 500;
      if (!ok) error = `HTTP ${res.status}`;
    } catch (err) {
      transient = true;
      error = err instanceof Error ? err.message : "send failed";
    }

    // Step 3: record the outcome.
    await withRepo(async (r) => {
      const n = await r.getNotification(notificationId, true);
      if (!n) return;
      if (ok) {
        n.state = "SENT";
        n.sentAt = new Date().toISOString();
        n.lastError = null;
      } else {
        n.lastError = error;
        if (!transient || attempt === MAX_ATTEMPTS) n.state = "FAILED";
      }
      await r.saveNotification(n);
    });
    logEvent({ notification: { id: notificationId, attempt, ok, error } });

    if (ok || !transient) return;
    await sleep(1500 * attempt);
  }
}

/** Retry sweep: delivers anything still pending (used after restarts and by the scheduled job). */
export async function flushPending(): Promise<number> {
  const ids = await withRepo((r) => r.pendingNotificationIds());
  for (const id of ids) await deliverNotification(id);
  return ids.length;
}
