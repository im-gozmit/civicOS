import { describe, expect, it } from "vitest";
import { WELCOME_BUTTONS, WELCOME_FOOTER, WELCOME_HEADER, cleanProfileName, welcomeBody, welcomeText } from "@/lib/whatsapp/menu";

// WhatsApp rejects a button message that breaks its limits, so the limits are tested.
describe("welcome menu fits WhatsApp's limits", () => {
  it("has at most 3 buttons, each with a title of 20 characters or fewer", () => {
    expect(WELCOME_BUTTONS.length).toBeLessThanOrEqual(3);
    for (const b of WELCOME_BUTTONS) expect(b.title.length).toBeLessThanOrEqual(20);
  });

  it("keeps the body, header and footer inside the limits, even with a long name", () => {
    expect(welcomeBody("Abcdefghijklmnopqrst").length).toBeLessThanOrEqual(1024);
    expect(WELCOME_HEADER.length).toBeLessThanOrEqual(60);
    expect(WELCOME_FOOTER.length).toBeLessThanOrEqual(60);
  });

  it("works without a name, and the plain-text version still tells people what to do", () => {
    expect(welcomeBody()).toContain("Namaste!");
    expect(welcomeText()).toContain("status CIV-000123");
  });
});

describe("profile names", () => {
  it("keeps just a clean first name", () => {
    expect(cleanProfileName("Riya Sharma")).toBe("Riya");
    expect(cleanProfileName("  आरती  वर्मा ")).toBe("आरती");
    expect(cleanProfileName("Mayank 🚀")).toBe("Mayank");
  });

  it("drops names that are empty, too short or nothing but symbols", () => {
    expect(cleanProfileName("")).toBe("");
    expect(cleanProfileName("🔥🔥")).toBe("");
    expect(cleanProfileName("A")).toBe("");
    expect(cleanProfileName(undefined)).toBe("");
    expect(cleanProfileName("x".repeat(40))).toBe("");
  });
});
