import { createHash } from "crypto";
import { CATEGORY_LABEL } from "@/lib/complaints";
import { STATUS_LABEL } from "@/lib/transitions";
import type { Complaint } from "@/lib/types";

// What the PUBLIC map may show. The rule is: enough to see where problems cluster and whether
// they are being handled, never enough to identify a person or a home. So: no photos, no text
// written by the citizen, no phone or sender id, no ticket or tracking numbers, only an
// approximate position, and only the day (not the time) of the report.

export interface PublicMarker {
  key: string; // opaque, not derivable from the ticket number
  lat: number;
  lng: number;
  category: string;
  categoryId: string;
  status: string;
  group: "new" | "working" | "done";
  reportedOn: string; // YYYY-MM-DD
}

const HIDDEN: Complaint["status"][] = ["REJECTED", "DUPLICATE"];

function group(status: Complaint["status"]): PublicMarker["group"] {
  if (status === "CLOSED") return "done";
  if (status === "ASSIGNED" || status === "IN_PROGRESS" || status === "RESOLVED_PENDING_VERIFICATION" || status === "REOPENED") return "working";
  return "new";
}

/**
 * Rounds to 3 decimals (about 110 m) and adds a small, fixed, per-report offset so the exact
 * spot cannot be recovered and nearby reports do not sit on top of each other.
 */
export function approximate(lat: number, lng: number, seed: string): { lat: number; lng: number } {
  const h = createHash("sha256").update("map:" + seed).digest();
  const jitter = (b: number) => ((b / 255) * 2 - 1) * 0.0006; // about +/- 65 m
  return {
    lat: Math.round(lat * 1000) / 1000 + jitter(h[0]),
    lng: Math.round(lng * 1000) / 1000 + jitter(h[1]),
  };
}

export function toPublicMarkers(complaints: Complaint[]): PublicMarker[] {
  return complaints
    .filter((c) => !HIDDEN.includes(c.status))
    .map((c) => {
      const p = approximate(c.latitude, c.longitude, c.id);
      return {
        key: createHash("sha256").update("key:" + c.id).digest("hex").slice(0, 12),
        lat: Number(p.lat.toFixed(5)),
        lng: Number(p.lng.toFixed(5)),
        category: CATEGORY_LABEL[c.category],
        categoryId: c.category,
        status: STATUS_LABEL[c.status],
        group: group(c.status),
        reportedOn: c.createdAt.slice(0, 10),
      };
    });
}
