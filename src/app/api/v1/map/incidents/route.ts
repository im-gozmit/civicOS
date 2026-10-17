import { NextRequest, NextResponse } from "next/server";
import { listAll } from "@/lib/complaints";
import { toPublicMarkers } from "@/lib/publicMap";
import { allow, clientIp, publicLimitsOn } from "@/lib/rateLimit";

// Public. Returns only privacy-safe markers (see lib/publicMap.ts).
export async function GET(req: NextRequest) {
  if (publicLimitsOn() && !(await allow(`map:${clientIp(req.headers)}`, 60, 60 * 1000))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }
  const markers = toPublicMarkers(await listAll());
  return NextResponse.json({ markers }, { headers: { "Cache-Control": "public, max-age=30" } });
}
