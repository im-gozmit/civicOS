import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/adminAuth";
import { listAll } from "@/lib/complaints";
import { MEDIA_DIR } from "@/lib/localStore";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  ogg: "audio/ogg",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  webm: "audio/webm",
  wav: "audio/wav",
};

// Private evidence: only a signed-in admin can fetch it, and only files that belong to a complaint.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const admin = await getAdmin();
  if (!admin) return new NextResponse("Not authorised", { status: 401 });

  const { file } = await params;
  if (!/^[A-Za-z0-9_-]+\.[a-z0-9]{2,4}$/.test(file)) return new NextResponse("Bad request", { status: 400 });

  const all = await listAll();
  const known = all.some((c) => c.mediaFiles.includes(file) || c.audioFiles.includes(file) || (c.repairChecks ?? []).some((r) => r.file === file));
  if (!known) return new NextResponse("Not found", { status: 404 });

  try {
    const bytes = await readFile(path.join(MEDIA_DIR, file));
    const ext = file.split(".").pop() ?? "";
    return new NextResponse(bytes, {
      headers: { "Content-Type": TYPES[ext] ?? "application/octet-stream", "Cache-Control": "private, no-store" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
