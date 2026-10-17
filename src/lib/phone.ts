// The optional WhatsApp number a citizen may give on the website form.

export type PhoneResult = { kind: "none" } | { kind: "ok"; digits: string } | { kind: "invalid" };

/**
 * Cleans what the citizen typed into digits with the country code, e.g. "98765 43210" -> "919876543210".
 *   - empty -> "none" (the number is optional, so this is fine)
 *   - 10 digits starting 6-9 -> an Indian mobile number, "91" is added
 *   - 12 digits starting 91, or any other 11 to 15 digits (a number typed with its country code) -> kept
 *   - anything else -> "invalid"
 */
export function normalizeWhatsappNumber(raw: unknown): PhoneResult {
  if (typeof raw !== "string") return { kind: "none" };
  if (raw.trim() === "") return { kind: "none" };
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits === "") return { kind: "invalid" }; // something was typed, but there are no digits in it
  digits = digits.replace(/^\+/, "").replace(/^00/, "");
  if (!/^\d+$/.test(digits)) return { kind: "invalid" };
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1); // trunk prefix, e.g. 09876543210
  if (digits.length === 10) return /^[6-9]/.test(digits) ? { kind: "ok", digits: "91" + digits } : { kind: "invalid" };
  if (digits.length === 12 && digits.startsWith("91")) return /^[6-9]/.test(digits.slice(2)) ? { kind: "ok", digits } : { kind: "invalid" };
  if (digits.length >= 11 && digits.length <= 15 && !digits.startsWith("0")) return { kind: "ok", digits };
  return { kind: "invalid" };
}

/** "919876543210" -> "+91 ••••• ••210": enough to recognise, not enough to reveal. */
export function maskNumber(digits: string): string {
  if (!digits) return "";
  const tail = digits.slice(-3);
  const cc = digits.length > 10 ? digits.slice(0, digits.length - 10) : "";
  return `${cc ? "+" + cc + " " : ""}••••• ••${tail}`;
}
