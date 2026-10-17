import { NextRequest, NextResponse } from "next/server";
import { getByToken } from "@/lib/complaints";
import { getFile } from "@/lib/storage";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

// A citizen's own photo, and the after-repair photo staff uploaded for the same complaint. The secret tracking
// token is what authorises it: it only works for files that belong to THAT complaint, and only photos (never voice
// notes). Every miss answers the same "not found", so nothing can be probed.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string; file: string }> }) {
  const { token, file } = await params;
  const notFound = () => new NextResponse("Not found", { status: 404 });
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return notFound();
  if (!/^[A-Za-z0-9_-]+\.(jpg|png|webp)$/.test(file)) return notFound();

  const c = await getByToken(token);
  if (!c) return notFound();
  const allowed = new Set<string>([...c.mediaFiles, ...(c.repairChecks ?? []).map((r) => r.file)]);
  if (!allowed.has(file)) return notFound();

  let bytes = await getFile(file).catch(() => null);
  if (!bytes) bytes = await getFile(file).catch(() => null); // hosted storage can hiccup
  if (!bytes) return notFound();
  const ext = file.split(".").pop() ?? "";
  return new NextResponse(new Uint8Array(bytes), {
    headers: { "Content-Type": TYPES[ext] ?? "application/octet-stream", "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" },
  });
}
