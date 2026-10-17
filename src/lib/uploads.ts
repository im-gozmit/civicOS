import { createHash, randomBytes } from "crypto";
import { putFile } from "@/lib/storage";

// Validates and stores files uploaded from the website. The file TYPE is decided from the file's
// own first bytes, never from the file name or the browser-supplied content type, and the stored
// name is random, so nothing the user typed ever reaches the file system.

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

function startsWith(buf: Buffer, bytes: number[], offset = 0) {
  return bytes.every((b, i) => buf[offset + i] === b);
}

export function sniffImage(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length < 12) return null;
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return { ext: "jpg", mime: "image/jpeg" };
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { ext: "png", mime: "image/png" };
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}

export function sniffAudio(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length < 12) return null;
  if (buf.toString("ascii", 0, 4) === "OggS") return { ext: "ogg", mime: "audio/ogg" };
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) return { ext: "webm", mime: "audio/webm" };
  if (buf.toString("ascii", 4, 8) === "ftyp") return { ext: "m4a", mime: "audio/mp4" };
  if (buf.toString("ascii", 0, 3) === "ID3" || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) return { ext: "mp3", mime: "audio/mpeg" };
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WAVE") return { ext: "wav", mime: "audio/wav" };
  return null;
}

export type SaveResult = { ok: true; file: string; mime: string; sha256: string } | { ok: false; error: string };

async function save(file: File, maxBytes: number, sniff: (b: Buffer) => { ext: string; mime: string } | null, label: string, prefix: string): Promise<SaveResult> {
  if (file.size === 0) return { ok: false, error: `The ${label} is empty.` };
  if (file.size > maxBytes) return { ok: false, error: `The ${label} is too large (max ${Math.round(maxBytes / 1024 / 1024)} MB).` };
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniff(buf);
  if (!kind) return { ok: false, error: `That ${label} format is not supported.` };
  const name = `${prefix}-${randomBytes(12).toString("hex")}.${kind.ext}`;
  await putFile(name, buf, kind.mime);
  return { ok: true, file: name, mime: kind.mime, sha256: createHash("sha256").update(buf).digest("hex") };
}

export const saveImageUpload = (file: File, prefix = "web") => save(file, MAX_IMAGE_BYTES, sniffImage, "photo", prefix);
export const saveAudioUpload = (file: File) => save(file, MAX_AUDIO_BYTES, sniffAudio, "voice note", "web");
