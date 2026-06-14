import type { DataProvider } from "@/lib/data/provider";
import type {
  Group,
  Match,
  MatchStatus,
  Stage,
  Standing,
  Team,
} from "@/lib/types";

/**
 * Adapter for the FREE Football-Data.org API (https://www.football-data.org/).
 * Requires only a free token (no credit card) set as FOOTBALL_DATA_TOKEN.
 * The World Cup competition code is "WC". Free tier is heavily rate-limited
 * (~10 req/min), which is why every API route caches aggressively and falls
 * back to the seed provider on error.
 */

const BASE = "https://api.football-data.org/v4";
const COMPETITION = "WC";

function headers(): HeadersInit {
  const token = process.env.FOOTBALL_DATA_TOKEN ?? "";
  return token ? { "X-Auth-Token": token } : {};
}

function mapStatus(s: string): MatchStatus {
  switch (s) {
    case "IN_PLAY":
      return "LIVE";
    case "PAUSED":
      return "PAUSED";
    case "FINISHED":
    case "AWARDED":
      return "FINISHED";
    default:
      return "SCHEDULED";
  }
}

function mapStage(s: string): Stage {
  switch (s) {
    case "LAST_32":
      return "ROUND_32";
    case "LAST_16":
      return "ROUND_16";
    case "QUARTER_FINALS":
      return "QUARTER";
    case "SEMI_FINALS":
      return "SEMI";
    case "THIRD_PLACE":
      return "THIRD_PLACE";
    case "FINAL":
      return "FINAL";
    default:
      return "GROUP";
  }
}

function groupId(raw?: string | null): string | undefined {
  // API returns e.g. "GROUP_A"
  if (!raw) return undefined;
  const m = raw.match(/GROUP_?([A-L])/i);
  return m ? m[1].toUpperCase() : undefined;
}

interface FdTeam {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

function mapTeam(t: FdTeam, group?: string): Team {
  return {
    id: t.tla || String(t.id),
    name: t.shortName || t.name,
    code: t.tla || t.name.slice(0, 3).toUpperCase(),
    flag: "🏳️",
    crest: t.crest,
    groupId: group,
  };
}

interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group?: string | null;
  minute?: number | null;
  venue?: string | null;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: { fullTime: { home: number | null; away: number | null } };
}

function mapMatch(m: FdMatch): Match {
  const g = groupId(m.group);
  return {
    id: String(m.id),
    stage: mapStage(m.stage),
    groupId: g,
    utcDate: m.utcDate,
    status: mapStatus(m.status),
    minute: m.minute ?? undefined,
    venue: m.venue ?? undefined,
    home: mapTeam(m.homeTeam, g),
    away: mapTeam(m.awayTeam, g),
    homeScore: m.score?.fullTime?.home ?? null,
    awayScore: m.score?.fullTime?.away ?? null,
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    // Route-level caching is handled by Next; keep a short revalidate here too.
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`football-data ${path} -> ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const footballDataProvider: DataProvider = {
  name: "football-data",

  async getMatches() {
    const data = await fetchJson<{ matches: FdMatch[] }>(
      `/competitions/${COMPETITION}/matches`
    );
    return data.matches.map(mapMatch);
  },

  async getMatch(id) {
    try {
      const m = await fetchJson<FdMatch>(`/matches/${id}`);
      return mapMatch(m);
    } catch {
      return null;
    }
  },

  async getTeams() {
    const data = await fetchJson<{ teams: FdTeam[] }>(
      `/competitions/${COMPETITION}/teams`
    );
    return data.teams.map((t) => mapTeam(t));
  },

  async getGroups() {
    interface FdStanding {
      stage: string;
      type: string;
      group?: string | null;
      table: Array<{
        position: number;
        team: FdTeam;
        playedGames: number;
        won: number;
        draw: number;
        lost: number;
        points: number;
        goalsFor: number;
        goalsAgainst: number;
        goalDifference: number;
      }>;
    }
    const data = await fetchJson<{ standings: FdStanding[] }>(
      `/competitions/${COMPETITION}/standings`
    );
    const groups: Group[] = [];
    data.standings
      .filter((s) => s.type === "TOTAL" && groupId(s.group))
      .forEach((s) => {
        const id = groupId(s.group)!;
        const standings: Standing[] = s.table.map((row) => ({
          team: mapTeam(row.team, id),
          position: row.position,
          played: row.playedGames,
          won: row.won,
          draw: row.draw,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          goalDifference: row.goalDifference,
          points: row.points,
        }));
        groups.push({ id, standings });
      });
    return groups.sort((a, b) => a.id.localeCompare(b.id));
  },
};
