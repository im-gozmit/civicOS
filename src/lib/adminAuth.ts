import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { rateClear, rateCount, rateRecord } from "@/lib/rateLimit";

// Admin access for the prototype: ONE admin account whose credentials live in environment
// variables. There is no signup and no role is ever read from a request. Replaced by Supabase
// Auth with a profiles table later.

export const ADMIN_COOKIE = "civicos_admin";
const SESSION_MS = 12 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  return s;
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && (process.env.SESSION_SECRET?.length ?? 0) >= 32);
}

function digest(v: string) {
  return createHash("sha256").update(v).digest();
}

export function checkCredentials(email: string, password: string): boolean {
  const e = process.env.ADMIN_EMAIL;
  const p = process.env.ADMIN_PASSWORD;
  if (!e || !p) return false;
  // Both comparisons always run, on fixed-length digests, so timing does not leak which part was wrong.
  const okEmail = timingSafeEqual(digest(email.trim().toLowerCase()), digest(e.trim().toLowerCase()));
  const okPass = timingSafeEqual(digest(password), digest(p));
  return okEmail && okPass;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(email: string): string {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + SESSION_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): { email: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { email: string; exp: number };
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

/** Reads the admin session from the request cookies (works in pages and route handlers). */
export async function getAdmin(): Promise<{ email: string } | null> {
  if (!adminConfigured()) return null;
  await connection(); // the session check reads the clock, so it must run per request
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

// --- Login throttling (counted in the database, so it holds across servers) -------------------
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function loginAllowed(key: string): Promise<boolean> {
  return (await rateCount("login:" + key, WINDOW_MS)) < MAX_ATTEMPTS;
}

export async function recordLoginFailure(key: string): Promise<void> {
  await rateRecord("login:" + key);
}

export async function clearLoginFailures(key: string): Promise<void> {
  await rateClear("login:" + key);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MS / 1000,
};
