import type { DataProvider } from "@/lib/data/provider";
import type { Match } from "@/lib/types";
import {
  computeGroups,
  getSeedMatches,
  getSeedStadiums,
  getSeedTeams,
} from "@/lib/data/seed";
import { fetchLiveResults, pairKey } from "@/lib/data/live-thesportsdb";

/**
 * Default provider: the REAL fixture schedule (dates, venues, groups, bracket)
 * with REAL scores/live status overlaid from TheSportsDB. No scores are ever
 * invented — fixtures without a live result stay SCHEDULED.
 *
 * 100% free (TheSportsDB public key), and if the live source is unreachable the
 * app still shows the correct schedule (just without scores).
 */

async function buildMatches(): Promise<Match[]> {
  const schedule = getSeedMatches();
  let live: Awaited<ReturnType<typeof fetchLiveResults>>;
  try {
    live = await fetchLiveResults();
  } catch {
    return schedule;
  }
  if (live.size === 0) return schedule;

  return schedule.map((m) => {
    if (m.home.code === "?" || m.away.code === "?") return m;
    const r = live.get(pairKey(m.home.code, m.away.code));
    if (!r) return m;
    // Align scores to this fixture's home/away orientation.
    const sameOrientation = r.homeCode === m.home.code;
    const homeScore = sameOrientation ? r.homeScore : r.awayScore;
    const awayScore = sameOrientation ? r.awayScore : r.homeScore;
    return {
      ...m,
      status: r.status,
      minute: r.minute,
      homeScore,
      awayScore,
      providerEventId: r.eventId,
    };
  });
}

export const hybridProvider: DataProvider = {
  name: "hybrid-live",
  async getMatches() {
    return buildMatches();
  },
  async getMatch(id) {
    const all = await buildMatches();
    return all.find((m) => m.id === id) ?? null;
  },
  async getGroups() {
    const matches = await buildMatches();
    return computeGroups(matches, getSeedTeams());
  },
  async getTeams() {
    return getSeedTeams();
  },
};

export { getSeedStadiums };
