import type { Jurisdiction } from "@/lib/types";

// Works out the administrative area for a point on the map: district, tehsil, municipal body, ward (locality)
// and the nearest police station (thana). It uses OpenStreetMap's public Nominatim service.
//
// Honest limits, shown to the user as such:
//  - OpenStreetMap has districts, tehsils, cities and locality names for India, but NOT the official ward
//    numbers or police-station (thana) jurisdiction boundaries. Those maps are kept by the government.
//  - The lookup never blocks or fails a report: if the map service is slow or down, the fields stay empty.
//  - Nominatim's public service allows about one request per second and needs an identifying User-Agent. That is
//    fine for a demo; for real traffic, self-host Nominatim or buy a geocoding plan (set NOMINATIM_URL).

const BASE = (process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org").replace(/\/$/, "");
const USER_AGENT = "SudhaarDemo/1.0 (civic issue reporting demo; https://github.com/im-gozmit)";
const TIMEOUT_MS = 6000;
const MIN_GAP_MS = 1100;

type NominatimAddress = Record<string, string | undefined>;

/** Pure: turns a Nominatim "address" object into our fields. */
export function parseAddress(address: NominatimAddress): Pick<Jurisdiction, "district" | "tehsil" | "municipality" | "ward" | "pin"> {
  const district = address.state_district || address.county || null;
  // In Uttar Pradesh the mapped "county" is the tehsil (for example "Allahabad" inside Prayagraj district).
  const tehsil = address.state_district && address.county && address.county !== address.state_district ? address.county : null;
  const municipality = address.city || address.town || address.municipality || address.village || null;
  const ward = address.suburb || address.neighbourhood || address.city_district || address.quarter || address.hamlet || null;
  return { district, tehsil, municipality, ward, pin: address.postcode || null };
}

/** Pure: the closest police station among map results, with its distance in metres. */
export function nearestPolice(
  results: Array<{ lat: string; lon: string; name?: string; display_name?: string; type?: string; category?: string }>,
  lat: number,
  lng: number,
): { name: string; distanceM: number } | null {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const metres = (aLat: number, aLng: number) => {
    const dLat = toRad(aLat - lat);
    const dLng = toRad(aLng - lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(aLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.sqrt(h));
  };
  let best: { name: string; distanceM: number } | null = null;
  for (const r of results) {
    if (r.type !== "police") continue;
    const rLat = Number(r.lat);
    const rLng = Number(r.lon);
    if (!Number.isFinite(rLat) || !Number.isFinite(rLng)) continue;
    const d = Math.round(metres(rLat, rLng));
    const name = (r.name || r.display_name?.split(",")[0] || "Police station").trim();
    if (!best || d < best.distanceM) best = { name, distanceM: d };
  }
  return best;
}

// One request at a time, with a pause between them, to respect the service's usage policy.
let chain: Promise<unknown> = Promise.resolve();
let lastCall = 0;
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const wait = lastCall + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    return fn();
  });
  chain = run.catch(() => undefined);
  return run;
}

async function getJson<T>(path: string): Promise<T> {
  return throttled(async () => {
    const res = await fetch(`${BASE}${path}`, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  });
}

/** Never throws. Returns whatever the map could tell us, and says plainly when it could not tell us anything. */
export async function lookupJurisdiction(lat: number, lng: number): Promise<Jurisdiction> {
  const empty: Jurisdiction = {
    status: "unavailable",
    district: null,
    tehsil: null,
    municipality: null,
    ward: null,
    thana: null,
    thanaDistanceM: null,
    pin: null,
    source: "OpenStreetMap",
    lookedUpAt: new Date().toISOString(),
  };
  // JURISDICTION_LOOKUP=off skips the map service entirely (used by the automated tests).
  if (process.env.JURISDICTION_LOOKUP === "off") return empty;
  let result = empty;
  let reached = false;
  try {
    const rev = await getJson<{ address?: NominatimAddress }>(`/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`);
    result = { ...result, ...parseAddress(rev.address ?? {}) };
    reached = true;
  } catch (err) {
    console.error("[jurisdiction] reverse lookup failed", err instanceof Error ? err.message : err);
  }
  try {
    const d = 0.04; // roughly 4 km each way
    const police = await getJson<Array<{ lat: string; lon: string; name?: string; display_name?: string; type?: string; category?: string }>>(
      `/search?q=police+station&format=jsonv2&limit=15&bounded=1&viewbox=${lng - d},${lat + d},${lng + d},${lat - d}&accept-language=en`,
    );
    const near = nearestPolice(police, lat, lng);
    if (near) result = { ...result, thana: near.name, thanaDistanceM: near.distanceM };
    reached = true;
  } catch (err) {
    console.error("[jurisdiction] police lookup failed", err instanceof Error ? err.message : err);
  }
  const filled = [result.district, result.tehsil, result.municipality, result.ward, result.thana].filter(Boolean).length;
  result.status = !reached ? "unavailable" : filled === 5 ? "ok" : "partial";
  return result;
}
