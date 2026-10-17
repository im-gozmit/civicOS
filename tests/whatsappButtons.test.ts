import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendButtons } from "@/lib/whatsapp/cloud";

describe("the buttons message sent to WhatsApp", () => {
  const saved = { t: process.env.WHATSAPP_ACCESS_TOKEN, p: process.env.WHATSAPP_PHONE_NUMBER_ID };
  beforeEach(() => {
    process.env.WHATSAPP_ACCESS_TOKEN = "test-token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123456";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    process.env.WHATSAPP_ACCESS_TOKEN = saved.t ?? "";
    if (saved.p === undefined) delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    else process.env.WHATSAPP_PHONE_NUMBER_ID = saved.p;
  });

  it("is an interactive 'button' message with reply buttons, and trims anything over WhatsApp's limits", async () => {
    interface Sent {
      messaging_product?: string;
      to?: string;
      type?: string;
      interactive: {
        type: string;
        body: { text: string };
        header?: { type: string; text: string };
        footer: { text: string };
        action: { buttons: Array<{ type: string; reply: { id: string; title: string } }> };
      };
    }
    let sentBody = {} as Sent;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      sentBody = JSON.parse(String((init as RequestInit).body));
      return new Response(JSON.stringify({ messages: [{ id: "wamid.x" }] }), { status: 200 });
    });
    const r = await sendButtons("919876543210", {
      body: "x".repeat(2000),
      header: "h".repeat(100),
      footer: "f".repeat(100),
      buttons: [
        { id: "A", title: "a very long button title indeed" },
        { id: "B", title: "Two" },
        { id: "C", title: "Three" },
        { id: "D", title: "Four is too many" },
      ],
    });
    expect(r.ok).toBe(true);
    expect(sentBody.messaging_product).toBe("whatsapp");
    expect(sentBody.to).toBe("919876543210");
    expect(sentBody.type).toBe("interactive");
    expect(sentBody.interactive.type).toBe("button");
    expect(sentBody.interactive.body.text).toHaveLength(1024);
    expect(sentBody.interactive.header).toEqual({ type: "text", text: "h".repeat(60) });
    expect(sentBody.interactive.footer.text).toHaveLength(60);
    const buttons = sentBody.interactive.action.buttons;
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toEqual({ type: "reply", reply: { id: "A", title: "a very long button t" } });
  });
});
