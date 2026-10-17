import { after, NextRequest } from "next/server";
import { verifyMetaSignature } from "@/lib/whatsapp/signature";
import { handleInbound } from "@/lib/whatsapp/conversation";
import { claimMessage, logEvent } from "@/lib/events";

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
  interactive?: { type?: string; button_reply?: { id: string; title?: string } };
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

  // Raw payloads contain phone numbers, so they are NOT logged. Set WEBHOOK_DEBUG=1 to print them
  // to the console while debugging on your own machine.
  if (process.env.WEBHOOK_DEBUG === "1") console.log("[wa-webhook] payload", raw);

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

      // Delivery/read/failure callbacks for messages we sent. Only the outcome is logged (no
      // phone numbers), and only failures carry an error.
      if (Array.isArray(value.statuses)) {
        for (const s of value.statuses as Array<{ status?: string; errors?: Array<{ code?: number; title?: string }> }>) {
          logEvent({ delivery: { status: s.status, errors: s.errors?.map((e) => ({ code: e.code, title: e.title })) } });
        }
      }

      const contacts = (value.contacts as Array<{ user_id?: string; profile?: { name?: string } }> | undefined) ?? [];
      const messages = (value.messages as WaMessage[] | undefined) ?? [];
      for (const msg of messages) {
        if (!(await claimMessage(msg.id))) continue; // Meta redelivers; act on each message id once
        logEvent({ received: msg.type });
        await handleInbound({
          id: msg.id,
          from: msg.from,
          // Prefer Meta's stable user id; fall back to the phone number.
          senderKey: msg.from_user_id ?? contacts[0]?.user_id ?? msg.from,
          type: msg.type,
          text: msg.text?.body,
          image: msg.image ? { id: msg.image.id, caption: msg.image.caption } : undefined,
          audio: msg.audio ? { id: msg.audio.id } : undefined,
          buttonReply: msg.interactive?.button_reply ? { id: msg.interactive.button_reply.id, title: msg.interactive.button_reply.title } : undefined,
          profileName: contacts[0]?.profile?.name,
          location: msg.location
            ? { latitude: msg.location.latitude, longitude: msg.location.longitude }
            : undefined,
        });
      }
    }
  }
}
