import { STATUS_LABEL } from "@/lib/transitions";
import { TEAM_LABEL } from "@/lib/teams";
import type { TeamId } from "@/lib/teams";
import { STATUS_LABEL_HI, TEAM_LABEL_HI } from "@/lib/hindi";
import type { ComplaintStatus } from "@/lib/types";

// What a WhatsApp update says, always in English and Hindi. The tracking link is NOT part of the text: it goes
// out as a tap button (see sendLinkButton), so the chat shows a clean message and one clear button.

export interface NotificationContent {
  title: string; // for staff
  text: string; // what the citizen reads
  linkLabel: string; // the button, 20 characters at most
}

export const TRACK_BUTTON_LABEL = "Track | ट्रैक करें";

/** English block, a blank line, then the Hindi block. */
export const bilingual = (en: string, hi: string) => `${en}\n\n${hi}`;

export function statusUpdateContent(ticketId: string, to: ComplaintStatus, publicNote: string): NotificationContent {
  const note = publicNote.trim();
  const en = `📣 Update on ${ticketId}: ${STATUS_LABEL[to]}.` + (note ? `\nNote from staff: ${note}` : "");
  const hi = `📣 ${ticketId} पर अपडेट: ${STATUS_LABEL_HI[to]}।` + (note ? `\nस्टाफ का संदेश: ${note}` : "");
  return { title: `Status: ${STATUS_LABEL[to]}`, text: bilingual(en, hi), linkLabel: TRACK_BUTTON_LABEL };
}

export function teamConfirmedContent(ticketId: string, team: TeamId): NotificationContent {
  const en = `📣 Update on ${ticketId}: your report has been reviewed by staff and assigned to ${TEAM_LABEL[team]}.`;
  const hi = `📣 ${ticketId} पर अपडेट: स्टाफ ने आपकी रिपोर्ट देख ली है और उसे ${TEAM_LABEL_HI[team]} को सौंप दिया है।`;
  return { title: `Team confirmed: ${TEAM_LABEL[team]}`, text: bilingual(en, hi), linkLabel: TRACK_BUTTON_LABEL };
}

export function duplicateLinkedContent(ticketId: string): NotificationContent {
  const en = `📣 Update on ${ticketId}: it is the same problem as an earlier report, so staff linked them and will handle it together. Your complaint stays on record.`;
  const hi = `📣 ${ticketId} पर अपडेट: यह पहले दर्ज की गई समस्या जैसी ही है, इसलिए स्टाफ ने दोनों को जोड़ दिया है और साथ में निपटाएगा। आपकी शिकायत रिकॉर्ड में बनी रहेगी।`;
  return { title: "Linked to an earlier report", text: bilingual(en, hi), linkLabel: TRACK_BUTTON_LABEL };
}
