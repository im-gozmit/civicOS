import type { Notification } from "@/lib/types";

/**
 * A short title for a WhatsApp update, for staff to see at a glance. New notifications carry an explicit title; for
 * older ones it is worked out from the message text ("📣 Update on CIV-000042: In progress." becomes "In progress").
 */
export function notificationTitle(n: Pick<Notification, "title" | "text">): string {
  if (n.title) return n.title;
  const firstLine = (n.text.split("\n")[0] ?? "").replace(/^📣\s*/, "");
  const team = firstLine.match(/assigned to (.+?)\.?$/i);
  if (team) return `Team confirmed: ${team[1]}`;
  if (/same problem as an earlier report/i.test(firstLine)) return "Linked to an earlier report";
  const afterColon = firstLine.replace(/^Update on [A-Z]+-\d+:\s*/i, "").replace(/\.$/, "").trim();
  const t = (afterColon || firstLine.trim() || "Update").replace(/^./, (c) => c.toUpperCase());
  return t.length > 70 ? t.slice(0, 67).trimEnd() + "…" : t;
}

/** The message as the citizen read it, without the tracking link line (staff already have the page). */
export function notificationBody(text: string): string {
  return text
    .split("\n")
    .filter((l) => !/^Track:\s*https?:\/\//i.test(l))
    .join("\n")
    .trim();
}
