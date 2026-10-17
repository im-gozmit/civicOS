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

/**
 * A message with up to three tap-to-reply buttons. Needs an open 24-hour window (it is always sent as a reply to
 * something the citizen just wrote). Titles are 20 characters at most, the body 1024.
 */
export async function sendButtons(
  to: string,
  opts: { body: string; buttons: Array<{ id: string; title: string }>; header?: string; footer?: string },
): Promise<{ ok: boolean; status: number; response: unknown }> {
  const { token, phoneNumberId } = config();
  const interactive: Record<string, unknown> = {
    type: "button",
    body: { text: opts.body.slice(0, 1024) },
    action: { buttons: opts.buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: b.title.slice(0, 20) } })) },
  };
  if (opts.header) interactive.header = { type: "text", text: opts.header.slice(0, 60) };
  if (opts.footer) interactive.footer = { text: opts.footer.slice(0, 60) };
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "interactive", interactive }),
  });
  const response = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, response };
}

/**
 * A message with ONE button that opens a web address (the tracking page). The link lives in the button, not in the
 * chat text. Needs an open 24-hour window. The button text is 20 characters at most, the body 1024.
 */
export async function sendLinkButton(
  to: string,
  opts: { body: string; label: string; url: string; header?: string; footer?: string },
): Promise<{ ok: boolean; status: number; response: unknown }> {
  const { token, phoneNumberId } = config();
  const interactive: Record<string, unknown> = {
    type: "cta_url",
    body: { text: opts.body.slice(0, 1024) },
    action: { name: "cta_url", parameters: { display_text: opts.label.slice(0, 20), url: opts.url } },
  };
  if (opts.header) interactive.header = { type: "text", text: opts.header.slice(0, 60) };
  if (opts.footer) interactive.footer = { text: opts.footer.slice(0, 60) };
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "interactive", interactive }),
  });
  const response = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, response };
}
