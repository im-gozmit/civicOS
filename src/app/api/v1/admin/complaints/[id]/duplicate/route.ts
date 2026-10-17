import { after, NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/adminAuth";
import { dismissDuplicates, linkDuplicate } from "@/lib/complaints";
import { trackUrl } from "@/lib/links";
import { deliverNotification } from "@/lib/notifications";

// Staff decision on suggested duplicates: link to an earlier report, or say they are different.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { action?: unknown; primaryTicketId?: unknown; note?: unknown } | null;
  const note = typeof body?.note === "string" ? body.note.slice(0, 500) : "";

  if (body?.action === "dismiss") {
    const ok = await dismissDuplicates(id, admin.email);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Complaint not found." }, { status: 404 });
  }

  if (body?.action === "link") {
    const primary = typeof body.primaryTicketId === "string" ? body.primaryTicketId : "";
    if (!/^CIV-\d{1,10}$/i.test(primary)) return NextResponse.json({ error: "Choose the earlier report." }, { status: 400 });
    const result = await linkDuplicate(id, primary, note, admin.email, trackUrl);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    if (result.notificationId) {
      const notificationId = result.notificationId;
      after(async () => {
        try {
          await deliverNotification(notificationId);
        } catch (err) {
          console.error("[notify]", err);
        }
      });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action must be link or dismiss." }, { status: 400 });
}
