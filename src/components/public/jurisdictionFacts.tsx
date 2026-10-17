import type { Fact } from "@/components/public/IssueTimelineView";
import type { Jurisdiction } from "@/lib/types";

type Lang = "en" | "hi";

const T = {
  en: {
    district: "District",
    tehsil: "Tehsil",
    municipality: "Municipal body",
    ward: "Ward / locality",
    thana: "Thana (police station)",
    missing: "Not available",
    govt: "The government keeps this map with itself, so it is not on the public map.",
    down: "The map service could not be reached just now.",
    wardNote: "This is the locality name on the map. The official ward number is not published.",
    thanaNote: "The nearest police station on the map. The official thana boundary is kept by the government and is not published.",
    away: "away",
  },
  hi: {
    district: "ज़िला",
    tehsil: "तहसील",
    municipality: "नगर निकाय",
    ward: "वार्ड / मोहल्ला",
    thana: "थाना (पुलिस स्टेशन)",
    missing: "उपलब्ध नहीं",
    govt: "यह नक्शा सरकार के पास ही रहता है, इसलिए सार्वजनिक नक्शे पर नहीं है।",
    down: "अभी नक्शा सेवा से संपर्क नहीं हो सका।",
    wardNote: "यह नक्शे पर मोहल्ले का नाम है। आधिकारिक वार्ड नंबर प्रकाशित नहीं है।",
    thanaNote: "नक्शे पर सबसे नज़दीकी थाना। आधिकारिक थाना सीमा सरकार के पास है और प्रकाशित नहीं है।",
    away: "दूर",
  },
} as const;

const distance = (m: number) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`);

/**
 * The jurisdiction details as fact cards. Anything the public map does not have is shown as "Not available"
 * with the reason (the government keeps that map with itself, or the map service could not be reached).
 * Returns nothing for complaints registered before this lookup existed.
 */
export function jurisdictionFacts(j: Jurisdiction | null | undefined, lang: Lang = "en"): Fact[] {
  if (!j) return [];
  const t = T[lang];
  const reason = j.status === "unavailable" ? t.down : t.govt;
  const missing = (label: string): Fact => ({ label, value: <span className="font-medium text-slate-500">{t.missing}</span>, note: reason });
  const facts: Fact[] = [];
  facts.push(j.district ? { label: t.district, value: j.district } : missing(t.district));
  facts.push(j.tehsil ? { label: t.tehsil, value: j.tehsil } : missing(t.tehsil));
  facts.push(j.municipality ? { label: t.municipality, value: j.municipality } : missing(t.municipality));
  facts.push(j.ward ? { label: t.ward, value: j.ward, note: t.wardNote } : missing(t.ward));
  facts.push(
    j.thana
      ? { label: t.thana, value: j.thana + (j.thanaDistanceM != null ? ` (${distance(j.thanaDistanceM)} ${t.away})` : ""), note: t.thanaNote }
      : missing(t.thana),
  );
  return facts;
}
