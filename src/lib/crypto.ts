import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "crypto";

// Field-level encryption for personal data (phone numbers) stored in the database.
// AES-256-GCM: confidential AND tamper-evident. The key comes from PHONE_ENCRYPTION_KEY
// (64 hex characters = 32 bytes). Stored form: "enc:v1:<iv>:<tag>:<ciphertext>" (base64url).

const PREFIX = "enc:v1:";

function key(): Buffer | null {
  const hex = process.env.PHONE_ENCRYPTION_KEY;
  if (!hex) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PHONE_ENCRYPTION_KEY must be set in production (64 hex characters).");
    }
    return null; // local development only: stored unencrypted
  }
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) throw new Error("PHONE_ENCRYPTION_KEY must be exactly 64 hex characters.");
  return Buffer.from(hex, "hex");
}

export function encryptField(plain: string): string {
  if (!plain) return plain;
  const k = key();
  if (!k) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return PREFIX + [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64url")).join(":");
}

export function decryptField(stored: string): string {
  if (!stored || !stored.startsWith(PREFIX)) return stored; // empty, or written before encryption was on
  const k = key();
  if (!k) throw new Error("This data is encrypted but PHONE_ENCRYPTION_KEY is not set.");
  const [iv, tag, enc] = stored.slice(PREFIX.length).split(":").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", k, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

/** Keyed hash for looking a value up without storing it (not used for secrets that need to be read back). */
export function blindIndex(value: string): string {
  return createHmac("sha256", process.env.PHONE_ENCRYPTION_KEY || "dev-only").update(value).digest("hex").slice(0, 32);
}
