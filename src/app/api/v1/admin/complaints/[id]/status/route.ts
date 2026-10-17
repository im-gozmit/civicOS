import { after, NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/adminAuth";
import { changeStatus } from "@/lib/complaints";
import { isStatus } from "@/lib/transitions";
import { trackUrl } from "@/lib/links";
import { deliverNotification } from "@/lib/notifications";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { status?: unknown; publicNote?: unknown; internalNote?: unknown } | null;
  if (!isStatus(body?.status)) return NextResponse.json({ error: "Unknown status." }, { status: 400 });

  const publicNote = typeof body?.publicNote === "string" ? body.publicNote.slice(0, 500) : "";
  const internalNote = typeof body?.internalNote === "string" ? body.internalNote.slice(0, 1000) : "";

  const result = await changeStatus(id, body.status, publicNote, internalNote, admin.email, trackUrl);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });

  // The status change is already saved. Telling the citizen happens afterwards and cannot undo it.
  after(async () => {
    try {
      await deliverNotification(result.notificationId);
    } catch (err) {
      console.error("[notify]", err);
    }
  });

  return NextResponse.json({ ok: true, status: result.complaint.status });
}
