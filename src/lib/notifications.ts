import { withStore } from "@/lib/localStore";
import { sendText } from "@/lib/whatsapp/cloud";
import { logEvent } from "@/lib/whatsapp/eventLog";

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
    const job = await withStore((store) => {
      const n = store.notifications.find((x) => x.id === notificationId);
      if (!n || n.state !== "PENDING") return null;
      const c = store.complaints.find((x) => x.id === n.complaintId);
      const conv = c ? store.conversations[c.senderKey] : undefined;
      if (!c || !conv) {
        n.state = "FAILED";
        n.lastError = "NO_WHATSAPP_RECIPIENT";
        return null;
      }
      const lastInbound = conv.lastInboundAt ? Date.parse(conv.lastInboundAt) : 0;
      if (Date.now() - lastInbound > WINDOW_MS) {
        // Free-form messages are only allowed within 24h of the citizen's last message.
        // An approved template message would be needed; not built yet.
        n.state = "FAILED";
        n.lastError = "OUTSIDE_24H_WINDOW (needs an approved template message)";
        return null;
      }
      n.attempts += 1;
      return { phone: conv.phone, text: n.text };
    });
    if (!job) return;

    let ok = false;
    let transient = false;
    let error: string | null = null;
    try {
      const r = await sendText(job.phone, job.text);
      ok = r.ok;
      transient = r.status === 429 || r.status >= 500;
      if (!ok) error = `HTTP ${r.status}`;
    } catch (err) {
      transient = true;
      error = err instanceof Error ? err.message : "send failed";
    }

    await withStore((store) => {
      const n = store.notifications.find((x) => x.id === notificationId);
      if (!n) return;
      if (ok) {
        n.state = "SENT";
        n.sentAt = new Date().toISOString();
        n.lastError = null;
      } else {
        n.lastError = error;
        if (!transient || attempt === MAX_ATTEMPTS) n.state = "FAILED";
      }
    });
    await logEvent({ notification: { id: notificationId, attempt, ok, error } });

    if (ok || !transient) return;
    await sleep(1500 * attempt);
  }
}

/** Retry sweep: delivers anything still pending (used after restarts). */
export async function flushPending(): Promise<number> {
  const ids = await withStore((s) => s.notifications.filter((n) => n.state === "PENDING").map((n) => n.id));
  for (const id of ids) await deliverNotification(id);
  return ids.length;
}
