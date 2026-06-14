import type { Group, Match, Team } from "@/lib/types";

/**
 * The single contract every data source implements. The UI and API routes
 * depend only on this interface — swapping the seed provider for a real free
 * API (Football-Data.org today, anything else later) is a one-line change in
 * `getProvider()`.
 */
export interface DataProvider {
  readonly name: string;
  getMatches(): Promise<Match[]>;
  getMatch(id: string): Promise<Match | null>;
  getGroups(): Promise<Group[]>;
  getTeams(): Promise<Team[]>;
}
