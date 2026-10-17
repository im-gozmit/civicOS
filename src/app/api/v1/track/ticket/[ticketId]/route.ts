import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_LABEL } from "@/lib/complaints";
import { withStore } from "@/lib/localStore";
import { allow, clientIp } from "@/lib/rateLimit";
import { STATUS_LABEL } from "@/lib/transitions";

// Public, minimal lookup by ticket number. Ticket numbers are guessable, so this deliberately
// reveals very little: no photo, no exact location, no notes, no contact details.
export async function GET(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  if (!allow(`track:${clientIp(req.headers)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many lookups. Please wait a few minutes." }, { status: 429 });
  }
  const { ticketId } = await params;
  if (!/^CIV-\d{1,10}$/i.test(ticketId)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const c = await withStore((s) => s.complaints.find((x) => x.ticketId.toLowerCase() === ticketId.toLowerCase()));
  if (!c) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const last = c.history[c.history.length - 1];
  return NextResponse.json({
    ticketId: c.ticketId,
    category: CATEGORY_LABEL[c.category],
    status: STATUS_LABEL[c.status],
    lastUpdated: last?.at ?? c.createdAt,
  });
}
