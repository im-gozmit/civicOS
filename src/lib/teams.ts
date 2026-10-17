import type { Category } from "@/lib/types";

// The fixed list of domains/teams a report can be routed to. These are DEMO queues inside
// CivicOS, not official departments. The AI only ever suggests one of these ids; a staff member
// confirms or corrects it before the citizen is told anything about assignment.

export const TEAM_IDS = [
  "ROADS_PUBLIC_WORKS",
  "SANITATION",
  "DRAINAGE",
  "WATER_SUPPLY",
  "ELECTRICITY_STREETLIGHTS",
  "GENERAL_ADMIN",
] as const;

export type TeamId = (typeof TEAM_IDS)[number];

export const TEAM_LABEL: Record<TeamId, string> = {
  ROADS_PUBLIC_WORKS: "Roads & Public Works (demo queue)",
  SANITATION: "Sanitation (demo queue)",
  DRAINAGE: "Drainage (demo queue)",
  WATER_SUPPLY: "Water Supply (demo queue)",
  ELECTRICITY_STREETLIGHTS: "Electricity & Street Lights (demo queue)",
  GENERAL_ADMIN: "General Administration (demo queue)",
};

/** One-line description given to the AI so it picks the right domain. */
export const TEAM_DESCRIPTION: Record<TeamId, string> = {
  ROADS_PUBLIC_WORKS: "potholes, damaged roads, footpaths, broken dividers, road signs",
  SANITATION: "garbage piles, overflowing bins, dumping, dead animals, street sweeping",
  DRAINAGE: "blocked or overflowing drains and sewers, waterlogging, open manholes",
  WATER_SUPPLY: "water pipeline leaks, no or dirty water supply, broken taps or hydrants",
  ELECTRICITY_STREETLIGHTS: "broken or dark street lights, fallen or sparking wires and poles",
  GENERAL_ADMIN: "anything else, or unclear cases",
};

export const DEFAULT_TEAM_FOR_CATEGORY: Record<Category, TeamId> = {
  ROAD_DAMAGE: "ROADS_PUBLIC_WORKS",
  GARBAGE: "SANITATION",
  DRAINAGE: "DRAINAGE",
  WATER_SUPPLY: "WATER_SUPPLY",
  STREET_LIGHT: "ELECTRICITY_STREETLIGHTS",
  OTHER: "GENERAL_ADMIN",
};

export function isTeamId(v: unknown): v is TeamId {
  return typeof v === "string" && (TEAM_IDS as readonly string[]).includes(v);
}

/** Old complaints stored only the label; map it back to an id where possible. */
export function teamIdFromLabel(label: string): TeamId {
  return (TEAM_IDS.find((id) => TEAM_LABEL[id] === label) ?? "GENERAL_ADMIN") as TeamId;
}
