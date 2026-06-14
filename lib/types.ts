/**
 * Domain model for the World Cup 2026 platform.
 * These types are provider-agnostic: every data adapter (seed, Football-Data.org,
 * or any future free API) maps its responses into these shapes so the UI never
 * has to know where the data came from.
 */

export type MatchStatus = "SCHEDULED" | "LIVE" | "PAUSED" | "FINISHED";

/** Tournament stage. Group stage uses `groupId`; knockout rounds don't. */
export type Stage =
  | "GROUP"
  | "ROUND_32"
  | "ROUND_16"
  | "QUARTER"
  | "SEMI"
  | "THIRD_PLACE"
  | "FINAL";

export const STAGE_LABELS: Record<Stage, string> = {
  GROUP: "Phase de groupes",
  ROUND_32: "Seizièmes de finale",
  ROUND_16: "Huitièmes de finale",
  QUARTER: "Quarts de finale",
  SEMI: "Demi-finales",
  THIRD_PLACE: "Match pour la 3e place",
  FINAL: "Finale",
};

export interface Team {
  id: string;
  name: string;
  /** 3-letter code, e.g. "FRA". */
  code: string;
  /** Flag emoji for zero-dependency rendering (seed provider). */
  flag: string;
  /** Optional crest/flag image URL (real API providers). UI prefers this when set. */
  crest?: string;
  groupId?: string;
  fifaRank?: number;
  coach?: string;
}

export interface MatchEvent {
  minute: number;
  type: "GOAL" | "OWN_GOAL" | "PENALTY" | "YELLOW" | "RED" | "SUB" | "VAR";
  /** "home" | "away" — which side the event belongs to. */
  side: "home" | "away";
  player?: string;
  assist?: string;
  detail?: string;
}

export interface LineupPlayer {
  name: string;
  number?: string;
  position?: string;
  starter: boolean;
  /** Player photo URL when available. */
  photo?: string;
  captain?: boolean;
}

export interface StatRow {
  label: string;
  home: number;
  away: number;
}

export interface TeamLineup {
  formation?: string;
  coach?: string;
  starters: LineupPlayer[];
  bench: LineupPlayer[];
}

export interface MatchLineups {
  home: TeamLineup;
  away: TeamLineup;
}

export interface MatchStats {
  possessionHome?: number;
  possessionAway?: number;
  shotsHome?: number;
  shotsAway?: number;
  shotsOnTargetHome?: number;
  shotsOnTargetAway?: number;
  cornersHome?: number;
  cornersAway?: number;
  foulsHome?: number;
  foulsAway?: number;
}

export interface Match {
  id: string;
  stage: Stage;
  groupId?: string;
  utcDate: string; // ISO
  status: MatchStatus;
  minute?: number;
  venue?: string;
  home: Team;
  away: Team;
  homeScore: number | null;
  awayScore: number | null;
  events?: MatchEvent[];
  lineups?: MatchLineups;
  stats?: MatchStats;
  /** Generic stat rows (label + home/away) rendered as bars. */
  statRows?: StatRow[];
  /** Live clock label, e.g. "67'" or "90'+4'" or "Mi-temps". */
  clock?: string;
  /** Upstream provider event id (e.g. TheSportsDB idEvent) for detail lookups. */
  providerEventId?: string;
}

export interface Player {
  id: string;
  name: string;
  position?: string;
  number?: string;
  nationality?: string;
  /** Photo / cutout URL when available. */
  thumb?: string;
  club?: string;
  birthDate?: string;
  description?: string;
}

export interface Standing {
  team: Team;
  position: number;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface Group {
  id: string; // "A".."L"
  standings: Standing[];
}
