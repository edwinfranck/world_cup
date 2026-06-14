import type { DataProvider } from "@/lib/data/provider";
import {
  getSeedGroups,
  getSeedMatches,
  getSeedTeams,
} from "@/lib/data/seed";

/**
 * Default provider — fully offline, no API key required. Powers the app out of
 * the box and serves as the fallback whenever a remote provider fails.
 */
export const seedProvider: DataProvider = {
  name: "seed",
  async getMatches() {
    return getSeedMatches();
  },
  async getMatch(id) {
    return getSeedMatches().find((m) => m.id === id) ?? null;
  },
  async getGroups() {
    return getSeedGroups();
  },
  async getTeams() {
    return getSeedTeams();
  },
};
