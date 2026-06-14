import type { DataProvider } from "@/lib/data/provider";
import type { Match } from "@/lib/types";
import {
  computeGroups,
  getSeedMatches,
  getSeedStadiums,
  getSeedTeams,
} from "@/lib/data/seed";
import { fetchLiveResults, pairKey } from "@/lib/data/live-thesportsdb";
import { fetchFifaResults, fetchFifaDates } from "@/lib/data/match-detail-fifa";

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

  // Two free sources, in parallel:
  //  - FIFA calendar window = AUTHORITATIVE live status + minute + score
  //  - TheSportsDB = providerEventId (for detail/stats) + fallback scores
  const [fifa, tsdb, fifaDates] = await Promise.all([
    fetchFifaResults().catch(() => new Map()),
    fetchLiveResults().catch(() => new Map()),
    fetchFifaDates().catch(() => new Map<number, string>()),
  ]);

  if (fifa.size === 0 && tsdb.size === 0 && fifaDates.size === 0) return schedule;

  // A match can't realistically be "live" longer than this (90' + ET + pens).
  const MAX_LIVE_MS = 4 * 60 * 60 * 1000;
  const now = Date.now();

  return schedule.map((m) => {
    const out = { ...m } as Match;

    // 0) Authoritative kickoff date/time from FIFA for EVERY match (our seed
    // times are timezone-offset). Keyed by FIFA MatchNumber == our match id.
    const fifaDate = fifaDates.get(Number(m.id));
    if (fifaDate) out.utcDate = fifaDate;

    if (m.home.code === "?" || m.away.code === "?") return out;
    const key = pairKey(m.home.code, m.away.code);
    const t = tsdb.get(key);
    const f = fifa.get(key);
    if (!t && !f) return out;

    // 1) TheSportsDB layer (gives the event id for lineups/stats + fallback).
    if (t) {
      const same = t.homeCode === m.home.code;
      out.status = t.status;
      out.minute = t.minute;
      out.homeScore = same ? t.homeScore : t.awayScore;
      out.awayScore = same ? t.awayScore : t.homeScore;
      out.providerEventId = t.eventId;
    }

    // 2) FIFA layer = authoritative status/score/clock/kickoff. Trust it fully.
    if (f) {
      const same = f.homeCode === m.home.code;
      out.status = f.status;
      out.minute = f.minute;
      out.clock = f.clock;
      if (f.date) out.utcDate = f.date; // our seed times can be offset
      if (f.homeScore !== null) out.homeScore = same ? f.homeScore : f.awayScore;
      if (f.awayScore !== null) out.awayScore = same ? f.awayScore : f.homeScore;
    } else if (
      // 3) Stale guard ONLY for TheSportsDB-only data (no FIFA truth here):
      // a fixture whose kickoff was long ago can't still be "live".
      (out.status === "LIVE" || out.status === "PAUSED") &&
      now - new Date(out.utcDate).getTime() > MAX_LIVE_MS
    ) {
      out.status = "FINISHED";
      out.clock = undefined;
      out.minute = undefined;
    }

    return out;
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
