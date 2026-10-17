import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_COOKIE_OPTIONS,
  adminConfigured,
  checkCredentials,
  clearLoginFailures,
  createSessionToken,
  loginAllowed,
  recordLoginFailure,
} from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "Admin login is not configured on the server." }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const body = (await req.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const key = `${ip}`;

  if (!loginAllowed(key)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }
  if (!email || !password || !checkCredentials(email, password)) {
    recordLoginFailure(key);
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  clearLoginFailures(key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(email.trim().toLowerCase()), SESSION_COOKIE_OPTIONS);
  return res;
}
