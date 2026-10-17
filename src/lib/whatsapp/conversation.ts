import { withRepo } from "@/lib/repo";
import { bindToSender, getOwnByTicket, listForSender } from "@/lib/complaints";
import { TRACK_BUTTON_LABEL } from "@/lib/notificationText";
import { processReport } from "@/lib/reportPipeline";
import { sendButtons, sendLinkButton, sendLocationRequest, sendText } from "@/lib/whatsapp/cloud";
import { R, successText } from "@/lib/whatsapp/replies";
import {
  BTN_REPORT,
  HOW_IT_WORKS,
  REPORT_PROMPT,
  WELCOME_BUTTONS,
  WELCOME_FOOTER,
  WELCOME_HEADER,
  cleanProfileName,
  welcomeBody,
  welcomeText,
} from "@/lib/whatsapp/menu";
import type { MenuButton } from "@/lib/whatsapp/menu";
import { downloadMedia } from "@/lib/whatsapp/media";
import { logEvent } from "@/lib/events";
import type { Complaint, Conversation, PendingReport } from "@/lib/types";

export interface InboundMessage {
  id: string;
  from: string; // sender phone as given by Meta; used as the reply address
  senderKey: string; // stable sender id (Meta user id when present, else the phone)
  type: string;
  text?: string;
  image?: { id: string; caption?: string };
  audio?: { id: string };
  location?: { latitude: number; longitude: number };
  buttonReply?: { id: string; title?: string }; // the citizen tapped one of our reply buttons
  profileName?: string; // their WhatsApp profile name, used only to greet them
}

const LOCATION_FRESH_MS = 10 * 60 * 1000; // a location sent just before the photo still counts
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

// --- Replies -----------------------------------------------------------------------------------

function baseUrl() {
  return (process.env.PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function trackUrl(c: Complaint) {
  return `${baseUrl()}/t/${c.trackingToken}`;
}

async function reply(to: string, text: string) {
  const r = await sendText(to, text);
  logEvent({ sent: { ok: r.ok, status: r.status, error: r.ok ? undefined : r.response } });
}

/** A message whose tracking link is a tap button, not text in the chat. If WhatsApp refuses the button, the link is added as text so it is never lost. */
async function replyWithLink(to: string, text: string, url: string) {
  const r = await sendLinkButton(to, { body: text, label: TRACK_BUTTON_LABEL, url });
  logEvent({ sent: { ok: r.ok, status: r.status, kind: "link_button", error: r.ok ? undefined : r.response } });
  if (!r.ok) await reply(to, `${text}\n\n${url}`);
}

/** A message with tap buttons. If WhatsApp refuses the buttons, the same words go out as plain text. */
async function replyWithButtons(to: string, body: string, buttons: MenuButton[], plainText: string, opts: { header?: string; footer?: string } = {}) {
  const r = await sendButtons(to, { body, buttons, header: opts.header, footer: opts.footer });
  logEvent({ sent: { ok: r.ok, status: r.status, kind: "buttons", error: r.ok ? undefined : r.response } });
  if (!r.ok) await reply(to, plainText);
}

/** The welcome menu: a warm greeting and a button for each thing the citizen can do. */
async function sendWelcome(to: string, profileName?: string) {
  const name = cleanProfileName(profileName);
  await replyWithButtons(to, welcomeBody(name), WELCOME_BUTTONS, welcomeText(name), { header: WELCOME_HEADER, footer: WELCOME_FOOTER });
}

async function sendComplaintList(to: string, senderKey: string) {
  const list = await listForSender(senderKey);
  if (list.length) await reply(to, R.complaintList(list));
  else await replyWithButtons(to, R.noComplaints, [BTN_REPORT], R.noComplaints);
}

async function askForLocation(to: string) {
  const body = "Please share the location of the problem so we can register it. / कृपया समस्या की लोकेशन भेजें।";
  const r = await sendLocationRequest(to, body);
  logEvent({ sent: { ok: r.ok, status: r.status, kind: "location_request", error: r.ok ? undefined : r.response } });
  if (!r.ok) await reply(to, body + "\n(📎 > Location > Send your current location)");
}

// --- Conversation state ------------------------------------------------------------------------

/**
 * Reads the sender's conversation, lets `fn` change it, and saves it, all in ONE short database
 * transaction with the row locked. Two messages from the same person (a photo and its location)
 * can therefore never overwrite each other, even if different servers handle them.
 */
async function mutate<T>(msg: InboundMessage, fn: (conv: Conversation) => T): Promise<T> {
  return withRepo(async (r) => {
    const now = new Date().toISOString();
    let conv = await r.getConversation(msg.senderKey, true);
    if (!conv) {
      conv = { senderKey: msg.senderKey, phone: msg.from, state: "IDLE", updatedAt: now };
      await r.saveConversation(conv); // creates the row so it can be locked from now on
    }
    conv.phone = msg.from;
    conv.lastInboundAt = now;
    if (conv.pending && Date.now() - Date.parse(conv.pending.startedAt) > PENDING_TTL_MS) {
      conv.pending = undefined;
      conv.state = "IDLE";
    }
    const result = fn(conv);
    await r.saveConversation(conv);
    return result;
  });
}

async function register(to: string, senderKey: string, pending: PendingReport, latitude: number, longitude: number) {
  await reply(to, pending.audioFiles.length > 0 ? R.analysingPhotoVoice : R.analysingPhoto);
  const result = await processReport({
    source: "whatsapp",
    senderKey,
    senderPhone: to,
    caption: pending.caption,
    mediaFiles: pending.mediaFiles,
    audioFiles: pending.audioFiles,
    latitude,
    longitude,
  });

  if (!result.ok) {
    await reply(to, result.code === "NOT_CIVIC" ? R.notCivic(result.seen) : R.unusable);
    return;
  }
  await replyWithLink(to, successText(result.complaint), trackUrl(result.complaint));
}

type ImageDecision =
  | { action: "ATTACHED" }
  | { action: "ASK" }
  | { action: "REGISTER"; pending: PendingReport; latitude: number; longitude: number };

export async function handleInbound(msg: InboundMessage): Promise<void> {
  try {
    await processMessage(msg);
  } catch (err) {
    console.error("[conversation]", err);
  }
}

async function processMessage(msg: InboundMessage) {
  const to = msg.from;

  switch (msg.type) {
    case "image": {
      if (!msg.image) return;
      let file: string;
      try {
        file = (await downloadMedia(msg.image.id)).file;
      } catch (err) {
        console.error("[conversation] media download failed", err);
        await reply(to, R.photoDownloadFailed);
        return;
      }
      const caption = msg.image.caption?.trim() ?? "";

      // Decided atomically, after the (slow) download, against the freshest conversation state.
      const decision = await mutate<ImageDecision>(msg, (conv) => {
        // Extra photos for a report that is still waiting for its location are attached to it.
        if (conv.state === "AWAITING_LOCATION" && conv.pending) {
          conv.pending.mediaFiles.push(file);
          if (caption) conv.pending.caption = [conv.pending.caption, caption].filter(Boolean).join(" ");
          return { action: "ATTACHED" };
        }
        const pending: PendingReport = { caption, mediaFiles: [file], audioFiles: [], startedAt: new Date().toISOString() };
        const loc = conv.lastLocation;
        if (loc && Date.now() - Date.parse(loc.at) <= LOCATION_FRESH_MS) {
          conv.lastLocation = undefined; // each report needs its own location
          return { action: "REGISTER", pending, latitude: loc.latitude, longitude: loc.longitude };
        }
        conv.pending = pending;
        conv.state = "AWAITING_LOCATION";
        return { action: "ASK" };
      });

      if (decision.action === "ATTACHED") await reply(to, R.photoAdded);
      else if (decision.action === "ASK") {
        await reply(to, R.gotPhoto);
        await askForLocation(to);
      } else await register(to, msg.senderKey, decision.pending, decision.latitude, decision.longitude);
      return;
    }

    case "location": {
      if (!msg.location) return;
      const { latitude, longitude } = msg.location;
      const taken = await mutate<PendingReport | null>(msg, (conv) => {
        if (conv.state === "AWAITING_LOCATION" && conv.pending) {
          const p = conv.pending;
          conv.pending = undefined;
          conv.state = "IDLE";
          conv.lastLocation = undefined;
          return p;
        }
        conv.lastLocation = { latitude, longitude, at: new Date().toISOString() };
        return null;
      });
      if (taken) await register(to, msg.senderKey, taken, latitude, longitude);
      else await reply(to, R.gotLocation);
      return;
    }

    case "audio": {
      if (!msg.audio) return;
      const waiting = await mutate(msg, (conv) => conv.state === "AWAITING_LOCATION" && !!conv.pending);
      if (!waiting) {
        await reply(to, R.voiceNeedsPhoto);
        return;
      }
      let file: string;
      try {
        file = (await downloadMedia(msg.audio.id)).file;
      } catch (err) {
        console.error("[conversation] audio download failed", err);
        await reply(to, R.voiceDownloadFailed);
        return;
      }
      const attached = await mutate(msg, (conv) => {
        if (conv.state === "AWAITING_LOCATION" && conv.pending) {
          conv.pending.audioFiles.push(file);
          return true;
        }
        return false;
      });
      await reply(to, attached ? R.voiceAdded : R.voiceOrphan);
      return;
    }

    case "text": {
      const text = (msg.text ?? "").trim();

      // "TRACK CIV-000012 <token>" from the website's "Get updates on WhatsApp" button.
      const trackMatch = text.match(/^track\s+(CIV-\d+)\s+([A-Za-z0-9_-]{16,64})\s*$/i);
      if (trackMatch) {
        await mutate(msg, () => undefined); // records that this person just wrote (opens the 24h window)
        const c = await bindToSender(trackMatch[1], trackMatch[2], msg.senderKey, to);
        if (c) await replyWithLink(to, R.trackOn(c.ticketId), trackUrl(c));
        else await reply(to, R.trackFailed);
        return;
      }

      const statusMatch = text.match(/^status\s+(CIV-\d+)/i);
      if (statusMatch) {
        await mutate(msg, () => undefined);
        const c = await getOwnByTicket(msg.senderKey, statusMatch[1]);
        if (c) await replyWithLink(to, R.statusLine(c), trackUrl(c));
        else await reply(to, R.statusNotFound);
        return;
      }
      if (/^(my complaints|complaints|my status|status)$/i.test(text)) {
        await mutate(msg, () => undefined);
        await sendComplaintList(to, msg.senderKey);
        return;
      }

      // Free text while a report is pending is extra description, not a command.
      const appended = await mutate(msg, (conv) => {
        if (conv.state === "AWAITING_LOCATION" && conv.pending) {
          conv.pending.caption = [conv.pending.caption, text].filter(Boolean).join(" ");
          return true;
        }
        return false;
      });
      if (appended) await reply(to, R.noted);
      else await sendWelcome(to, msg.profileName);
      return;
    }

    // The citizen tapped one of the buttons from the welcome menu.
    case "interactive": {
      await mutate(msg, () => undefined); // they just wrote, which opens the 24h window
      switch (msg.buttonReply?.id) {
        case "REPORT":
          await reply(to, REPORT_PROMPT);
          return;
        case "MY_COMPLAINTS":
          await sendComplaintList(to, msg.senderKey);
          return;
        case "HOW_IT_WORKS":
          await replyWithButtons(to, HOW_IT_WORKS, [BTN_REPORT], HOW_IT_WORKS);
          return;
        default:
          await sendWelcome(to, msg.profileName);
          return;
      }
    }

    default:
      await mutate(msg, () => undefined);
      await reply(to, R.onlyMedia);
  }
}
