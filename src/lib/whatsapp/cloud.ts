// Thin client for the Meta WhatsApp Cloud API. Server-side only.
// Verify field names against Meta's current docs when extending this.

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v23.0";

function config() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be set to send messages.");
  }
  return { token, phoneNumberId };
}

/** Interactive "share location" button. Needs an open 24-hour window; falls back to text on failure. */
export async function sendLocationRequest(to: string, bodyText: string): Promise<{ ok: boolean; status: number; response: unknown }> {
  const { token, phoneNumberId } = config();
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "location_request_message",
        body: { text: bodyText },
        action: { name: "send_location" },
      },
    }),
  });
  const response = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, response };
}

export async function sendText(to: string, body: string): Promise<{ ok: boolean; status: number; response: unknown }> {
  const { token, phoneNumberId } = config();
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body, preview_url: true },
    }),
  });
  const response = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, response };
}
