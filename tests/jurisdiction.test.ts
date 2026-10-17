import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lookupJurisdiction, nearestPolice, parseAddress } from "@/lib/jurisdiction";

// What the public map really returns for a spot in the middle of Prayagraj.
const CHOWK = {
  road: "Grand Trunk Road",
  suburb: "Chowk",
  city: "Prayagraj",
  county: "Allahabad",
  state_district: "Prayagraj",
  state: "Uttar Pradesh",
  postcode: "211001",
};

describe("jurisdiction from coordinates", () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.JURISDICTION_LOOKUP;
    delete process.env.JURISDICTION_LOOKUP; // these tests need the lookup switched on (fetch is mocked)
  });
  afterEach(() => {
    vi.restoreAllMocks();
    if (saved === undefined) delete process.env.JURISDICTION_LOOKUP;
    else process.env.JURISDICTION_LOOKUP = saved;
  });

  it("reads district, tehsil, municipal body, locality and PIN from a map address", () => {
    expect(parseAddress(CHOWK)).toEqual({ district: "Prayagraj", tehsil: "Allahabad", municipality: "Prayagraj", ward: "Chowk", pin: "211001" });
  });

  it("leaves out what the map does not have instead of guessing", () => {
    const p = parseAddress({ state: "Uttar Pradesh", state_district: "Prayagraj" });
    expect(p).toEqual({ district: "Prayagraj", tehsil: null, municipality: null, ward: null, pin: null });
  });

  it("picks the nearest police station and ignores things that are not police stations", () => {
    const near = nearestPolice(
      [
        { lat: "25.4500", lon: "81.8500", name: "Far Thana", type: "police" },
        { lat: "25.4360", lon: "81.8465", name: "Kotwali", type: "police" },
        { lat: "25.4358", lon: "81.8463", name: "A bookshop", type: "books" },
      ],
      25.4358,
      81.8463,
    );
    expect(near?.name).toBe("Kotwali");
    expect(near?.distanceM).toBeLessThan(100);
    expect(nearestPolice([], 25.4, 81.8)).toBeNull();
  });

  it("does nothing when switched off", async () => {
    process.env.JURISDICTION_LOOKUP = "off";
    const spy = vi.spyOn(globalThis, "fetch");
    const j = await lookupJurisdiction(25.4358, 81.8463);
    expect(j.status).toBe("unavailable");
    expect(spy).not.toHaveBeenCalled();
  });

  it("reports 'unavailable' without throwing when the map service cannot be reached", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const j = await lookupJurisdiction(25.4358, 81.8463);
    expect(j.status).toBe("unavailable");
    expect(j.district).toBeNull();
    expect(j.thana).toBeNull();
  }, 20000);

  it("fills what the service returns and marks the result partial when a police station is not found", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const u = String(url);
      const body = u.includes("/reverse") ? { address: CHOWK } : [];
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    });
    const j = await lookupJurisdiction(25.4358, 81.8463);
    expect(j.status).toBe("partial");
    expect(j.district).toBe("Prayagraj");
    expect(j.tehsil).toBe("Allahabad");
    expect(j.ward).toBe("Chowk");
    expect(j.thana).toBeNull();
  }, 20000);
});
