import { createHash } from "crypto";
import { readFile, unlink } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/adminAuth";
import { addRepairCheck, getRepairContext } from "@/lib/complaints";
import { MEDIA_DIR } from "@/lib/localStore";
import { saveImageUpload } from "@/lib/uploads";
import { verifyRepair } from "@/lib/ai/verifyRepair";
import { logEvent } from "@/lib/whatsapp/eventLog";
import { allow } from "@/lib/rateLimit";
import type { RepairCheck } from "@/lib/types";

function mimeFor(file: string) {
  return /\.png$/i.test(file) ? "image/png" : /\.webp$/i.test(file) ? "image/webp" : "image/jpeg";
}

// Staff upload an "after repair" photo. The AI compares it with the original photo and gives an
// ADVISORY opinion; it never closes anything. Closing is a separate, human status change.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  if (!allow(`evidence:${admin.email}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many uploads. Please wait." }, { status: 429 });
  }

  const { id } = await params;
  const ctx = await getRepairContext(id);
  if (!ctx) return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
  if (ctx.status !== "IN_PROGRESS" && ctx.status !== "RESOLVED_PENDING_VERIFICATION") {
    return NextResponse.json({ error: "After-repair photos can be added once work is in progress." }, { status: 409 });
  }

  const form = await req.formData().catch(() => null);
  const photo = form?.get("photo");
  if (!(photo instanceof File)) return NextResponse.json({ error: "Please choose a photo." }, { status: 400 });

  const saved = await saveImageUpload(photo, "after");
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: 400 });

  // Reject the same picture being reused as "proof" (the original, or an earlier upload).
  const beforeHashes = await Promise.all(
    ctx.before.map(async (f) => createHash("sha256").update(await readFile(path.join(MEDIA_DIR, f)).catch(() => Buffer.alloc(0))).digest("hex")),
  );
  if (beforeHashes.includes(saved.sha256) || ctx.shas.includes(saved.sha256)) {
    await unlink(path.join(MEDIA_DIR, saved.file)).catch(() => undefined);
    return NextResponse.json({ error: "This is the same photo as the original or an earlier upload. Please take a new photo after the repair." }, { status: 409 });
  }

  const run = await verifyRepair(
    {
      beforePath: path.join(MEDIA_DIR, ctx.before[0]),
      beforeMime: mimeFor(ctx.before[0]),
      afterPath: path.join(MEDIA_DIR, saved.file),
      afterMime: saved.mime,
      summary: ctx.summary,
    },
    (e) => void logEvent(e),
  ).catch(() => null);

  const check: RepairCheck = {
    file: saved.file,
    sha256: saved.sha256,
    uploadedBy: admin.email,
    at: new Date().toISOString(),
    verdict: run?.opinion.verdict ?? "cannot_tell",
    reason: run ? run.opinion.reason : "The automatic photo check was not available. Please compare the photos yourself.",
    aiProvider: run?.provider ?? null,
    aiModel: run?.model ?? null,
  };
  await addRepairCheck(id, check);
  return NextResponse.json({ ok: true, verdict: check.verdict, reason: check.reason });
}
