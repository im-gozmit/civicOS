import type { Complaint } from "@/lib/types";

export function baseUrl() {
  return (process.env.PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function trackUrl(c: Complaint) {
  return `${baseUrl()}/t/${c.trackingToken}`;
}
