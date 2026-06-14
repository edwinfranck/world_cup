import type { StatRow } from "@/lib/types";
import { englishNameFor } from "@/lib/data/seed";

/**
 * OPTIONAL richer match statistics via API-Football (API-SPORTS).
 * Only active when API_FOOTBALL_KEY is set (free tier = 100 req/day). Gives
 * possession, passes, shots, corners, fouls, etc. Without a key this is inert
 * and the app falls back to TheSportsDB stats.
 *
 * World Cup league id = 1, season = 2026.
 */

const HOST = "https://v3.football.api-sports.io";
const LEAGUE = "1";
const SEASON = "2026";

const LABELS_FR: Record<string, string> = {
  "ball possession": "Possession (%)",
  "total shots": "Total tirs",
  "shots on goal": "Tirs cadrés",
  "shots off goal": "Tirs non cadrés",
  "blocked shots": "Tirs bloqués",
  "corner kicks": "Corners",
  fouls: "Fautes",
  offsides: "Hors-jeu",
  "yellow cards": "Cartons jaunes",
  "red cards": "Cartons rouges",
  "goalkeeper saves": "Arrêts gardien",
  "total passes": "Passes",
  "passes accurate": "Passes réussies",
  "passes %": "Précision passes (%)",
  "expected_goals": "Buts attendus (xG)",
};

function key(): string | null {
  return process.env.API_FOOTBALL_KEY || null;
}

async function af<T>(path: string): Promise<T | null> {
  const k = key();
  if (!k) return null;
  try {
    const res = await fetch(`${HOST}${path}`, {
      headers: { "x-apisports-key": k },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface AfFixtureResp {
  response?: {
    fixture: { id: number; date: string };
    teams: { home: { name: string }; away: { name: string } };
  }[];
}
interface AfStatResp {
  response?: {
    team: { id: number; name: string };
    statistics: { type: string; value: number | string | null }[];
  }[];
}

function toNum(v: number | string | null): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const n = parseFloat(v.replace("%", ""));
  return Number.isNaN(n) ? 0 : n;
}

async function findFixtureId(
  homeCode: string,
  awayCode: string,
  isoDate: string
): Promise<number | null> {
  const date = isoDate.slice(0, 10);
  const data = await af<AfFixtureResp>(
    `/fixtures?league=${LEAGUE}&season=${SEASON}&date=${date}`
  );
  const home = (englishNameFor(homeCode) ?? homeCode).toLowerCase();
  const away = (englishNameFor(awayCode) ?? awayCode).toLowerCase();
  for (const f of data?.response ?? []) {
    const h = f.teams.home.name.toLowerCase();
    const a = f.teams.away.name.toLowerCase();
    const match =
      (h.includes(home) || home.includes(h)) &&
      (a.includes(away) || away.includes(a));
    const swapped =
      (h.includes(away) || away.includes(h)) &&
      (a.includes(home) || home.includes(a));
    if (match || swapped) return f.fixture.id;
  }
  return null;
}

export async function fetchApiFootballStatRows(
  homeCode: string,
  awayCode: string,
  isoDate: string
): Promise<StatRow[]> {
  if (!key()) return [];
  const fid = await findFixtureId(homeCode, awayCode, isoDate);
  if (!fid) return [];
  const data = await af<AfStatResp>(`/fixtures/statistics?fixture=${fid}`);
  const teams = data?.response ?? [];
  if (teams.length < 2) return [];

  // response[0] = home, response[1] = away (API-Football convention).
  const homeStats = teams[0].statistics;
  const awayStats = teams[1].statistics;
  const awayByType = new Map(awayStats.map((s) => [s.type.toLowerCase(), s.value]));

  const rows: StatRow[] = [];
  for (const s of homeStats) {
    const type = s.type.toLowerCase();
    rows.push({
      label: LABELS_FR[type] ?? s.type,
      home: toNum(s.value),
      away: toNum(awayByType.get(type) ?? null),
    });
  }
  return rows.filter((r) => r.home || r.away);
}

export const apiFootballEnabled = () => !!key();
