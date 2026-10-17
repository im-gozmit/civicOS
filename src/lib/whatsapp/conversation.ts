import { withStore } from "@/lib/localStore";
import { CATEGORY_LABEL, bindToSender, getOwnByTicket, listForSender } from "@/lib/complaints";
import { processReport } from "@/lib/reportPipeline";
import { sendLocationRequest, sendText } from "@/lib/whatsapp/cloud";
import { downloadMedia } from "@/lib/whatsapp/media";
import { logEvent } from "@/lib/whatsapp/eventLog";
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
}

const LOCATION_FRESH_MS = 10 * 60 * 1000; // a location sent just before the photo still counts
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

// Messages from one sender are handled one at a time so photo + location arriving together
// cannot race on the same conversation record.
const locks = new Map<string, Promise<unknown>>();
export function handleInbound(msg: InboundMessage): Promise<void> {
  const prev = locks.get(msg.senderKey) ?? Promise.resolve();
  const next = prev.then(() => processMessage(msg)).catch((err) => console.error("[conversation]", err));
  locks.set(msg.senderKey, next);
  next.finally(() => {
    if (locks.get(msg.senderKey) === next) locks.delete(msg.senderKey);
  });
  return next as Promise<void>;
}

// --- Replies -----------------------------------------------------------------------------------

const HELP =
  "👋 Welcome to CivicOS.\n" +
  "To report a problem: send a *photo* (add a short caption if you like) and then share the *location* (📎 > Location).\n" +
  "To check a complaint: send *status CIV-000123* or *my complaints*.\n\n" +
  "समस्या दर्ज करने के लिए फ़ोटो भेजें और फिर लोकेशन शेयर करें।";

function baseUrl() {
  return (process.env.PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function trackUrl(c: Complaint) {
  return `${baseUrl()}/t/${c.trackingToken}`;
}

function successMessage(c: Complaint) {
  return (
    `✅ Complaint registered: *${c.ticketId}*\n` +
    `Issue: ${CATEGORY_LABEL[c.category]}\n` +
    `Suggested team: ${c.queue}\n` +
    `(Staff will confirm the team, and we will message you when they do.)\n` +
    `Severity (suggested): ${c.severity.charAt(0) + c.severity.slice(1).toLowerCase()}\n` +
    `Summary: ${c.summary}\n` +
    (c.voice ? `Voice note (as we understood it): ${c.voice.english}\n` : "") +
    `Status: received, awaiting staff review\n` +
    (c.needsHumanReview
      ? `Note: ${c.aiProvider ? "the automatic analysis is only a suggestion and" : "automatic analysis was unavailable, so"} a person will review this report.\n`
      : "") +
    `\nTrack it here: ${trackUrl(c)}\n` +
    `Reply *status ${c.ticketId}* anytime.\n\n` +
    `आपकी शिकायत ${c.ticketId} दर्ज हो गई है। ऊपर दिए लिंक से स्थिति देखें।`
  );
}

async function reply(to: string, text: string) {
  const r = await sendText(to, text);
  await logEvent({ sent: { ok: r.ok, status: r.status, error: r.ok ? undefined : r.response } });
}

async function askForLocation(to: string) {
  const body = "Please share the location of the problem so we can register it. / कृपया समस्या की लोकेशन भेजें।";
  const r = await sendLocationRequest(to, body);
  await logEvent({ sent: { ok: r.ok, status: r.status, kind: "location_request", error: r.ok ? undefined : r.response } });
  if (!r.ok) await reply(to, body + "\n(📎 > Location > Send your current location)");
}

// --- State machine -----------------------------------------------------------------------------

async function getConversation(msg: InboundMessage): Promise<Conversation> {
  return withStore((store) => {
    const existing = store.conversations[msg.senderKey];
    const now = new Date().toISOString();
    if (existing) {
      existing.phone = msg.from;
      existing.lastInboundAt = now;
      if (existing.pending && Date.now() - Date.parse(existing.pending.startedAt) > PENDING_TTL_MS) {
        existing.pending = undefined;
        existing.state = "IDLE";
      }
      existing.updatedAt = now;
      return structuredClone(existing);
    }
    const fresh: Conversation = { senderKey: msg.senderKey, phone: msg.from, state: "IDLE", lastInboundAt: now, updatedAt: now };
    store.conversations[msg.senderKey] = fresh;
    return structuredClone(fresh);
  });
}

function saveConversation(conv: Conversation) {
  return withStore((store) => {
    store.conversations[conv.senderKey] = { ...conv, updatedAt: new Date().toISOString() };
  });
}

async function register(conv: Conversation, pending: PendingReport, latitude: number, longitude: number) {
  await reply(conv.phone, "🔎 Analysing your photo, this takes about 15 seconds…");
  const result = await processReport({
    source: "whatsapp",
    senderKey: conv.senderKey,
    senderPhone: conv.phone,
    caption: pending.caption,
    mediaFiles: pending.mediaFiles,
    audioFiles: pending.audioFiles,
    latitude,
    longitude,
  });
  conv.pending = undefined;
  conv.state = "IDLE";
  conv.lastLocation = undefined; // each report needs its own location
  await saveConversation(conv);

  if (!result.ok) {
    await reply(
      conv.phone,
      result.code === "NOT_CIVIC"
        ? "I could not see a public civic problem in that photo, so I did not register a complaint.\n" +
            `What I saw: ${result.seen}\n\n` +
            "Please send a clear photo of the problem (pothole, garbage, blocked drain, water leak, broken street light).\n" +
            "इस फ़ोटो में कोई सार्वजनिक समस्या नहीं दिखी। कृपया समस्या की साफ़ फ़ोटो भेजें।"
        : "That photo is too unclear to use. Please send a clearer photo of the problem. / कृपया साफ़ फ़ोटो भेजें।",
    );
    return;
  }
  await reply(conv.phone, successMessage(result.complaint));
}

async function processMessage(msg: InboundMessage) {
  const conv = await getConversation(msg);

  switch (msg.type) {
    case "image": {
      if (!msg.image) return;
      let file: string;
      try {
        file = (await downloadMedia(msg.image.id)).file;
      } catch (err) {
        console.error("[conversation] media download failed", err);
        await reply(conv.phone, "Sorry, I couldn't download that photo. Please try sending it again.");
        return;
      }
      const caption = msg.image.caption?.trim() ?? "";

      // Extra photos for a report that is still waiting for its location are attached to it.
      if (conv.state === "AWAITING_LOCATION" && conv.pending) {
        conv.pending.mediaFiles.push(file);
        if (caption) conv.pending.caption = [conv.pending.caption, caption].filter(Boolean).join(" ");
        await saveConversation(conv);
        await reply(conv.phone, "Added this photo to your report. Please share the location to finish.");
        return;
      }

      const pending: PendingReport = { caption, mediaFiles: [file], audioFiles: [], startedAt: new Date().toISOString() };
      const loc = conv.lastLocation;
      if (loc && Date.now() - Date.parse(loc.at) <= LOCATION_FRESH_MS) {
        await register(conv, pending, loc.latitude, loc.longitude);
        return;
      }
      conv.pending = pending;
      conv.state = "AWAITING_LOCATION";
      await saveConversation(conv);
      await reply(conv.phone, "📸 Got your photo.");
      await askForLocation(conv.phone);
      return;
    }

    case "location": {
      if (!msg.location) return;
      const { latitude, longitude } = msg.location;
      if (conv.state === "AWAITING_LOCATION" && conv.pending) {
        await register(conv, conv.pending, latitude, longitude);
        return;
      }
      conv.lastLocation = { latitude, longitude, at: new Date().toISOString() };
      await saveConversation(conv);
      await reply(conv.phone, "📍 Got the location. Now send a photo of the problem within 10 minutes.");
      return;
    }

    case "audio": {
      if (!msg.audio) return;
      if (conv.state === "AWAITING_LOCATION" && conv.pending) {
        try {
          const { file } = await downloadMedia(msg.audio.id);
          conv.pending.audioFiles.push(file);
          await saveConversation(conv);
          await reply(conv.phone, "🎙️ Got your voice note and added it. Please share the location to finish.");
        } catch (err) {
          console.error("[conversation] audio download failed", err);
          await reply(conv.phone, "I couldn't download that voice note. Please share the location to finish your report.");
        }
        return;
      }
      await reply(conv.phone, "🎙️ Voice notes can be added to a report. Please send a photo of the problem first.");
      return;
    }

    case "text": {
      const text = (msg.text ?? "").trim();

      // "TRACK CIV-000012 <token>" from the website's "Get updates on WhatsApp" button.
      const trackMatch = text.match(/^track\s+(CIV-\d+)\s+([A-Za-z0-9_-]{16,64})\s*$/i);
      if (trackMatch) {
        const c = await bindToSender(trackMatch[1], trackMatch[2], conv.senderKey, conv.phone);
        await reply(
          conv.phone,
          c
            ? `✅ WhatsApp updates are on for ${c.ticketId}. We will message you when staff update it.\nTrack: ${trackUrl(c)}`
            : "I could not link that complaint. Check you sent the whole message from the website; it may already be linked.",
        );
        return;
      }

      const statusMatch = text.match(/^status\s+(CIV-\d+)/i);
      if (statusMatch) {
        const c = await getOwnByTicket(conv.senderKey, statusMatch[1]);
        await reply(
          conv.phone,
          c
            ? `${c.ticketId}: ${c.status}\n${c.title}\nTrack: ${trackUrl(c)}`
            : "I couldn't find that complaint for this number. Check the ID, or send *my complaints*.",
        );
        return;
      }
      if (/^(my complaints|complaints|my status|status)$/i.test(text)) {
        const list = await listForSender(conv.senderKey);
        await reply(
          conv.phone,
          list.length
            ? "Your recent complaints:\n" + list.map((c) => `• ${c.ticketId} — ${c.status} — ${c.title}`).join("\n")
            : "You have no complaints yet. Send a photo of a problem to start.",
        );
        return;
      }
      if (conv.state === "AWAITING_LOCATION" && conv.pending) {
        // Free text while a report is pending is extra description, not a command.
        conv.pending.caption = [conv.pending.caption, text].filter(Boolean).join(" ");
        await saveConversation(conv);
        await reply(conv.phone, "Noted. Please share the location (📎 > Location) to finish your report.");
        return;
      }
      await reply(conv.phone, HELP);
      return;
    }

    default:
      await reply(conv.phone, "I can only read photos, voice notes, locations and text. Please send a photo of the problem.");
  }
}
