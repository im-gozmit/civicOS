import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/adminAuth";
import { assignQueue } from "@/lib/complaints";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { queue?: unknown } | null;
  if (typeof body?.queue !== "string") return NextResponse.json({ error: "Queue is required." }, { status: 400 });

  const result = await assignQueue(id, body.queue, admin.email);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
