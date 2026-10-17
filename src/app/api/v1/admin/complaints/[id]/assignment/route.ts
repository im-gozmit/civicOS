import { after, NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/adminAuth";
import { verifyAssignment } from "@/lib/complaints";
import { trackUrl } from "@/lib/links";
import { deliverNotification } from "@/lib/notifications";

// Staff verification of the suggested team. Only this action tells the citizen about assignment.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { action?: unknown; team?: unknown; note?: unknown } | null;
  const action = body?.action;
  if (action !== "confirm" && action !== "correct") {
    return NextResponse.json({ error: "Action must be confirm or correct." }, { status: 400 });
  }
  const team = typeof body?.team === "string" ? body.team : undefined;
  const note = typeof body?.note === "string" ? body.note.slice(0, 500) : "";

  const result = await verifyAssignment(id, action, team, note, admin.email, trackUrl);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });

  after(async () => {
    try {
      await deliverNotification(result.notificationId);
    } catch (err) {
      console.error("[notify]", err);
    }
  });
  return NextResponse.json({ ok: true, status: result.complaint.status });
}
