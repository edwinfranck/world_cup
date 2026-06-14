import type { DataProvider } from "@/lib/data/provider";
import type { Match } from "@/lib/types";
import {
  computeGroups,
  getSeedMatches,
  getSeedStadiums,
  getSeedTeams,
} from "@/lib/data/seed";
import { fetchLiveResults, pairKey } from "@/lib/data/live-thesportsdb";
import { fetchFifaMatchDetailByTeams } from "@/lib/data/match-detail-fifa";

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

  const overlaid = schedule.map((m) => {
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

  // Enrich currently-live matches with FIFA's exact clock (e.g. "67'"),
  // which TheSportsDB doesn't provide. Few matches are live at once.
  const liveMatches = overlaid.filter(
    (m) => m.status === "LIVE" || m.status === "PAUSED"
  );
  await Promise.all(
    liveMatches.map(async (m) => {
      try {
        const f = await fetchFifaMatchDetailByTeams(m.home.code, m.away.code);
        if (f?.clock) {
          m.clock = f.clock;
          const min = parseInt(f.clock, 10);
          if (!Number.isNaN(min)) m.minute = min;
        }
        if (f && f.homeScore !== null) m.homeScore = f.homeScore;
        if (f && f.awayScore !== null) m.awayScore = f.awayScore;
      } catch {
        // keep TheSportsDB values
      }
    })
  );

  return overlaid;
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
