import type { Category, Complaint, ComplaintStatus, DuplicateCandidate } from "@/lib/types";

// Finds earlier complaints that are probably the SAME problem as a new one. It only ever
// SUGGESTS: nothing is merged or hidden automatically. A staff member decides, and every citizen
// keeps their own complaint number and tracking link.

const EARTH_RADIUS_M = 6_371_000;

export function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** How close two reports must be to be considered the same spot. Spreading problems get more room. */
export const RADIUS_METERS: Record<Category, number> = {
  ROAD_DAMAGE: 60,
  GARBAGE: 100,
  DRAINAGE: 100,
  WATER_SUPPLY: 80,
  STREET_LIGHT: 60,
  OTHER: 40,
};

export const WINDOW_DAYS = 21;
const CLOSED: ComplaintStatus[] = ["CLOSED", "REJECTED", "DUPLICATE"];

export interface NewReportFacts {
  latitude: number;
  longitude: number;
  category: Category;
  mediaHashes: string[];
  now?: number;
}

export function findDuplicateCandidates(facts: NewReportFacts, existing: Complaint[], max = 3): DuplicateCandidate[] {
  const now = facts.now ?? Date.now();
  const out: DuplicateCandidate[] = [];

  for (const c of existing) {
    if (CLOSED.includes(c.status)) continue;
    if (c.category !== facts.category) continue;
    const ageMs = now - Date.parse(c.createdAt);
    if (!(ageMs >= 0) || ageMs > WINDOW_DAYS * 24 * 3600 * 1000) continue;

    const d = distanceMeters(facts, c);
    const sameImage = facts.mediaHashes.length > 0 && (c.mediaHashes ?? []).some((h) => facts.mediaHashes.includes(h));
    if (d > RADIUS_METERS[facts.category] && !sameImage) continue;

    const score = Math.min(100, Math.round(100 - (d / RADIUS_METERS[facts.category]) * 40) + (sameImage ? 30 : 0));
    const days = Math.floor(ageMs / (24 * 3600 * 1000));
    out.push({
      id: c.id,
      ticketId: c.ticketId,
      distanceM: Math.round(d),
      score,
      sameImage,
      reason:
        `Same type of problem, ${Math.round(d)} m away, reported ${days === 0 ? "today" : days === 1 ? "1 day earlier" : `${days} days earlier`}` +
        (sameImage ? ", and the photo is identical" : ""),
    });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, max);
}
