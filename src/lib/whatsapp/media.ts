import { putFile } from "@/lib/storage";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v23.0";
const MAX_BYTES = 12 * 1024 * 1024;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/aac": "aac",
  "audio/amr": "amr",
};

/**
 * Two-step download: resolve the media id to a short-lived URL, then fetch the bytes with the
 * access token. Returns a path relative to the project's .data/media folder.
 */
export async function downloadMedia(mediaId: string): Promise<{ file: string; mimeType: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error("WHATSAPP_ACCESS_TOKEN is not set");

  const metaRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(mediaId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error(`media lookup failed (${metaRes.status})`);
  const meta = (await metaRes.json()) as { url?: string; mime_type?: string; file_size?: number };
  if (!meta.url) throw new Error("media lookup returned no url");
  if (meta.file_size && meta.file_size > MAX_BYTES) throw new Error("media too large");

  const fileRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } });
  if (!fileRes.ok) throw new Error(`media download failed (${fileRes.status})`);
  const bytes = Buffer.from(await fileRes.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error("media too large");

  const mimeType = (meta.mime_type || "application/octet-stream").split(";")[0].trim();
  const ext = EXT[mimeType] ?? "bin";
  // The file name is derived from the numeric media id only, never from user-supplied text.
  const safeId = mediaId.replace(/[^0-9A-Za-z_-]/g, "");
  const file = `${safeId}.${ext}`;
  await putFile(file, bytes, mimeType);
  return { file, mimeType };
}
