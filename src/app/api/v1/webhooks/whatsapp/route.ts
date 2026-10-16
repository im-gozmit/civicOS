import { after, NextRequest } from "next/server";
import { verifyMetaSignature } from "@/lib/whatsapp/signature";
import { handleInbound } from "@/lib/whatsapp/conversation";
import { logEvent, seenMessageId } from "@/lib/whatsapp/eventLog";


// --- GET: Meta's one-time webhook verification handshake -------------------------------------
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const mode = p.get("hub.mode");
  const token = p.get("hub.verify_token");
  const challenge = p.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// --- POST: inbound messages and delivery status callbacks ------------------------------------
interface WaMessage {
  id: string;
  from: string;
  from_user_id?: string;
  type: string;
  text?: { body: string };
  image?: { id: string; caption?: string; mime_type?: string };
  audio?: { id: string; voice?: boolean; mime_type?: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
}

export async function POST(req: NextRequest) {
  const raw = await req.text(); // raw bytes first: the signature is over the exact body
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    console.error("[wa-webhook] WHATSAPP_APP_SECRET is not set; refusing to process events.");
    return new Response("Server not configured", { status: 500 });
  }
  if (!verifyMetaSignature(raw, req.headers.get("x-hub-signature-256"), appSecret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  // Always keep the raw payload while we are learning the real formats.
  await logEvent({ raw: payload });

  // Acknowledge fast; do the work after the response so Meta does not retry.
  after(async () => {
    try {
      await handlePayload(payload);
    } catch (err) {
      console.error("[wa-webhook] processing error", err);
    }
  });

  return new Response("OK", { status: 200 });
}

async function handlePayload(payload: unknown) {
  const entries = (payload as { entry?: Array<{ changes?: Array<{ value?: Record<string, unknown> }> }> })?.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};

      // Delivery/read/failure callbacks for messages we sent: just record them.
      if (Array.isArray(value.statuses)) {
        await logEvent({ statuses: value.statuses });
      }

      const contacts = (value.contacts as Array<{ user_id?: string }> | undefined) ?? [];
      const messages = (value.messages as WaMessage[] | undefined) ?? [];
      for (const msg of messages) {
        if (await seenMessageId(msg.id)) continue; // Meta redelivers; process each id once
        await logEvent({ processed: msg.id, type: msg.type });
        await handleInbound({
          id: msg.id,
          from: msg.from,
          // Prefer Meta's stable user id; fall back to the phone number.
          senderKey: msg.from_user_id ?? contacts[0]?.user_id ?? msg.from,
          type: msg.type,
          text: msg.text?.body,
          image: msg.image ? { id: msg.image.id, caption: msg.image.caption } : undefined,
          audio: msg.audio ? { id: msg.audio.id } : undefined,
          location: msg.location
            ? { latitude: msg.location.latitude, longitude: msg.location.longitude }
            : undefined,
        });
      }
    }
  }
}
