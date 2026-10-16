import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies Meta's X-Hub-Signature-256 header ("sha256=<hex>") against the RAW request body.
 * The body must be the exact bytes Meta sent, so call this before any JSON parsing.
 */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header || !header.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const supplied = header.slice("sha256=".length);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(supplied, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
